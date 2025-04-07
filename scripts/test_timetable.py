import requests
import tempfile
import os
from timetable_parser import parse_timetable
import json

def test_timetable_parsing(file_url: str):
    """Test timetable parsing by downloading the file and parsing it."""
    try:
        # Download the file
        print(f"Downloading file from {file_url}...")
        response = requests.get(file_url)
        if not response.ok:
            print(f"Failed to download file: {response.status_code} {response.reason}")
            return

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
            print(f"Saved file to {temp_file_path}")

        try:
            # Parse the file
            print("Parsing timetable...")
            result = parse_timetable(temp_file_path)
            print("\nParsing result:")
            print(json.dumps(result, indent=2))
        finally:
            # Clean up
            os.unlink(temp_file_path)
            print(f"\nCleaned up temporary file: {temp_file_path}")

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    file_url = "https://zwwahatmyyuuglbtrbgy.supabase.co/storage/v1/object/public/timetables//bc7073ba-5a9b-440e-aa40-880f3f7856e1-timetable.docx"
    test_timetable_parsing(file_url)
 