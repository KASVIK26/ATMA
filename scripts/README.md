# Enrollment File Parser Backend

This backend service provides an API endpoint to parse enrollment data from Excel and Word documents.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

Start the FastAPI server:
```bash
python api.py
```

The server will run on `http://localhost:8000`

## API Endpoints

### POST /parse-enrollment

Upload an enrollment file (Excel or Word document) to parse student data.

Example response:
```json
{
  "students": [
    {
      "rollNo": "1",
      "name": "John Doe",
      "present": false
    },
    ...
  ],
  "totalStudents": 30
}
```

## File Format Requirements

### Excel Files (.xlsx, .xls)
- Must have columns: "Roll No" and "Name"
- Additional columns will be ignored

### Word Files (.docx)
- Must contain a table with at least two columns
- First row should be headers
- First two columns should be Roll No and Name respectively

## Testing

You can test the file parser directly using:
```bash
python parse_enrollment.py path/to/your/file
``` 