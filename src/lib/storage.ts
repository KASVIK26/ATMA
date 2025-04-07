"use client"

import { supabase } from './supabase'

export const TIMETABLE_BUCKET = 'timetables'
export const ENROLLMENT_BUCKET = 'enrollments'

export type FileType = 'timetable' | 'enrollment'

// Initialize storage buckets
export async function initializeBuckets() {
  try {
    // First check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.log('User not authenticated, skipping bucket initialization')
      return
    }

    // Create timetables bucket if it doesn't exist
    const { error: timeTableError } = await supabase
      .storage
      .createBucket(TIMETABLE_BUCKET, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ]
      })

    // Create enrollments bucket if it doesn't exist
    const { error: enrollmentError } = await supabase
      .storage
      .createBucket(ENROLLMENT_BUCKET, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel' // .xls
        ]
      })

    // Only log non-existence errors
    if (timeTableError && !timeTableError.message.includes('already exists')) {
      console.error('Error creating timetable bucket:', timeTableError)
    }
    if (enrollmentError && !enrollmentError.message.includes('already exists')) {
      console.error('Error creating enrollment bucket:', enrollmentError)
    }
  } catch (error) {
    console.error('Error initializing buckets:', error)
  }
}

// Upload file to appropriate bucket
export async function uploadFile(
  sectionId: string,
  type: FileType,
  file: File | null
): Promise<string | null> {
  if (!file) {
    throw new Error('No file provided')
  }

  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const bucket = type === 'timetable' ? TIMETABLE_BUCKET : ENROLLMENT_BUCKET
    const fileName = `${sectionId}-${type}.${fileExtension}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error(`Error uploading ${type} file:`, uploadError.message)
      throw uploadError
    }

    if (!uploadData?.path) {
      throw new Error('Upload successful but no path returned')
    }

    // Generate a UUID for the file reference
    const { data: uuidData, error: uuidError } = await supabase
      .rpc('generate_uuid')

    if (uuidError) {
      console.error('Error generating UUID:', uuidError.message)
      // Clean up the uploaded file
      await supabase.storage.from(bucket).remove([uploadData.path])
      throw uuidError
    }

    // Update the section with the UUID and store the mapping
    const { error: updateError } = await supabase
      .from('files')
      .insert([{
        id: uuidData,
        path: uploadData.path,
        bucket: bucket,
        section_id: sectionId,
        type: type
      }])

    if (updateError) {
      console.error(`Error creating file record:`, updateError.message)
      // Clean up the uploaded file
      await supabase.storage.from(bucket).remove([uploadData.path])
      throw updateError
    }

    // Update the section with the file UUID
    const { error: sectionError } = await supabase
      .from('sections')
      .update({ [`${type}_file_id`]: uuidData })
      .eq('id', sectionId)

    if (sectionError) {
      console.error(`Error updating section:`, sectionError.message)
      // Clean up the file record and uploaded file
      await supabase.from('files').delete().eq('id', uuidData)
      await supabase.storage.from(bucket).remove([uploadData.path])
      throw sectionError
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    return publicUrl
  } catch (error) {
    console.error(`Error in uploadFile (${type}):`, error instanceof Error ? error.message : error)
    throw error
  }
}

// Get file URL from storage
export async function getFileUrl(
  sectionId: string,
  type: FileType
): Promise<string | null> {
  try {
    const bucket = type === 'timetable' ? TIMETABLE_BUCKET : ENROLLMENT_BUCKET
    
    const { data } = await supabase.storage
      .from(bucket)
      .list('', {
        search: `${sectionId}-${type}`
      })

    if (!data || data.length === 0) {
      console.error('File not found:', sectionId)
      return null
    }

    const { data: urlData, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data[0].name, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return urlData.signedUrl
  } catch (error) {
    console.error('Error in getFileUrl:', error)
    return null
  }
}

// Delete file from storage
export async function deleteFile(
  sectionId: string,
  type: FileType
): Promise<void> {
  try {
    // First get the file info from the files table
    const { data: fileData, error: fetchError } = await supabase
      .from('files')
      .select('id, path, bucket')
      .eq('section_id', sectionId)
      .eq('type', type)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No file found - this is okay, just return
        return
      }
      console.error(`Error fetching file data:`, fetchError.message)
      return
    }

    if (!fileData) {
      // No file found - this is okay, just return
      return
    }

    // Try to delete the file from storage, but don't throw if it fails
    try {
      await supabase.storage
        .from(fileData.bucket)
        .remove([fileData.path])
    } catch (storageError) {
      console.warn(`Storage deletion failed for ${fileData.path}, continuing with cleanup:`, storageError)
    }

    // Delete the file record - this should succeed due to cascade delete
    try {
      await supabase
        .from('files')
        .delete()
        .eq('id', fileData.id)
    } catch (recordError) {
      console.warn(`File record deletion failed, may have been deleted by cascade:`, recordError)
    }

    // Clear the file reference in the section if it still exists
    try {
      await supabase
        .from('sections')
        .update({ [`${type}_file_id`]: null })
        .eq('id', sectionId)
    } catch (updateError) {
      console.warn(`Section update failed, may have been deleted:`, updateError)
    }
  } catch (error) {
    console.error(`Error in deleteFile (${type}):`, error instanceof Error ? error.message : error)
    // Don't throw the error as this might be part of a section deletion
  }
} 