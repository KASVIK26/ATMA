from docx import Document
from typing import Dict, List, Union
import json

def parse_timetable(file_path: str) -> Dict[str, Union[List[Dict], str]]:
    """Parse timetable from DOCX file into structured JSON."""
    try:
        doc = Document(file_path)
        tables_data = []
        
        for table_index, table in enumerate(doc.tables):
            if not table.rows:
                continue
                
            # Get headers from first row
            headers = [cell.text.strip() for cell in table.rows[0].cells]
            if not headers or not any(headers):  # Skip empty tables
                continue
                
            # Process data rows
            rows = []
            for row in table.rows[1:]:
                cells = [cell.text.strip() for cell in row.cells]
                if not any(cells):  # Skip empty rows
                    continue
                    
                # Create row record with all columns
                row_data = {}
                for header, cell in zip(headers, cells):
                    if header:  # Only include cells with headers
                        row_data[header] = cell
                if row_data:  # Only append if we have data
                    rows.append(row_data)
            
            if rows:  # Only include tables with data
                tables_data.append({
                    'tableIndex': table_index,
                    'headers': headers,
                    'rows': rows
                })
        
        if not tables_data:
            return {'status': 'error', 'message': 'No valid timetable data found'}
            
        return {
            'status': 'success',
            'data': tables_data
        }
        
    except Exception as e:
        return {'status': 'error', 'message': f"Error parsing timetable: {str(e)}"}

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        result = parse_timetable(sys.argv[1])
        print(json.dumps(result, indent=2))

