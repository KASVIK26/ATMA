import pandas as pd
from docx import Document
import json
from typing import Dict, List, Union
import os

def parse_excel_file(file_path: str) -> List[Dict[str, Union[str, int]]]:
    """Parse enrollment data from Excel file."""
    try:
        df = pd.read_excel(file_path)
        
        # Drop completely empty rows and columns
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        # Normalize column names (remove whitespace, make lowercase)
        df.columns = [str(col).strip() for col in df.columns]
        
        # Convert DataFrame to list of dictionaries
        students = []
        for _, row in df.iterrows():
            student = {}
            for col in df.columns:
                value = row[col]
                # Convert numeric values to strings and handle NaN
                if pd.isna(value):
                    value = ""
                elif isinstance(value, (int, float)):
                    value = str(int(value)) if value.is_integer() else str(value)
                else:
                    value = str(value).strip()
                student[col] = value
            students.append(student)
        
        return students

    except Exception as e:
        print(f"❌ Error parsing Excel file: {str(e)}")
        return []

def parse_docx_file(file_path: str) -> List[Dict[str, Union[str, int]]]:
    """Parse enrollment data from DOCX file."""
    try:
        doc = Document(file_path)
        students = []

        for table in doc.tables:
            if not table.rows:
                continue
                
            # Get headers from first row
            headers = [cell.text.strip() for cell in table.rows[0].cells]
            if not headers or not any(headers):  # Skip empty tables
                continue
            
            # Process data rows
            for row in table.rows[1:]:
                cells = [cell.text.strip() for cell in row.cells]
                if not any(cells):  # Skip empty rows
                    continue
                    
                # Create student record with all columns
                student = {}
                for header, cell in zip(headers, cells):
                    if header:  # Only include cells with headers
                        student[header] = cell
                if student:  # Only append if we have data
                    students.append(student)

        return students

    except Exception as e:
        print(f"❌ Error parsing DOCX file: {str(e)}")
        return []

def parse_enrollment_file(file_path: str) -> Dict[str, Union[List[Dict], str]]:
    """Parse enrollment file and return structured data."""
    try:
        file_extension = os.path.splitext(file_path)[1].lower()

        if file_extension in ['.xlsx', '.xls']:
            students = parse_excel_file(file_path)
        elif file_extension == '.docx':
            students = parse_docx_file(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

        if not students:
            raise ValueError("No valid student data found in file")

        return {
            'status': 'success',
            'data': {
                'students': students,
                'totalStudents': len(students)
            }
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = parse_enrollment_file(sys.argv[1])
        print(json.dumps(result, indent=2))
