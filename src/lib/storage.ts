"use client"

import { supabase } from './supabase'

const TIMETABLE_BUCKET = 'timetables'
const ENROLLMENT_BUCKET = 'enrollments'

type FileType = 'timetable' | 'enrollment'

// Initialize storage buckets
export async function initializeBuckets() {
  // Create timetables bucket if it doesn't exist
  const { data: timeTableBucket, error: timeTableError } = await supabase
    .storage
    .createBucket(TIMETABLE_BUCKET, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
    })

  // Create enrollments bucket if it doesn't exist
  const { data: enrollmentBucket, error: enrollmentError } = await supabase
    .storage
    .createBucket(ENROLLMENT_BUCKET, {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    })

  if (timeTableError && timeTableError.message !== 'Bucket already exists') {
    console.error('Error creating timetable bucket:', timeTableError)
  }
  if (enrollmentError && enrollmentError.message !== 'Bucket already exists') {
    console.error('Error creating enrollment bucket:', enrollmentError)
  }
}

// Upload file to appropriate bucket
export async function uploadFile(
  file: File,
  type: FileType,
  sectionId: string
): Promise<string | null> {
  try {
    const fileExtension = file.name.split('.').pop()
    const bucket = type === 'timetable' ? TIMETABLE_BUCKET : ENROLLMENT_BUCKET
    const path = `${sectionId}-${type}.${fileExtension}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file)

    if (error) {
      console.error(`Error uploading ${type}:`, error)
      return null
    }

    return data.path
  } catch (error) {
    console.error(`Error in uploadFile:`, error)
    return null
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
): Promise<boolean> {
  try {
    const bucket = type === 'timetable' ? TIMETABLE_BUCKET : ENROLLMENT_BUCKET
    
    const { data: files } = await supabase.storage
      .from(bucket)
      .list('', {
        search: `${sectionId}-${type}`
      })

    if (!files || files.length === 0) {
      console.error('File not found for deletion:', sectionId)
      return false
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([files[0].name])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteFile:', error)
    return false
  }
} 