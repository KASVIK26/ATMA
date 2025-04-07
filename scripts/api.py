from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import subprocess
import sys
from enrollment_parser import parse_enrollment_file
from timetable_parser import parse_timetable
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_dependencies():
    """Check and install required packages."""
    required_packages = [
        "pandas",
        "python-docx",
        "openpyxl",
        "python-multipart",
        "fastapi",
        "uvicorn"
    ]
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            logger.info(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

@app.on_event("startup")
async def startup_event():
    """Check dependencies on startup."""
    check_dependencies()
    logger.info("API server started")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("Health check requested")
    return {"status": "ok"}

@app.post("/parse-enrollment")
async def parse_enrollment(file: UploadFile):
    """Parse enrollment file and return structured data."""
    if not file:
        logger.error("No file provided for enrollment parsing")
        raise HTTPException(status_code=400, detail="No file provided")
        
    try:
        logger.info(f"Processing enrollment file: {file.filename}")
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Parse the file
            result = parse_enrollment_file(temp_file_path)
            
            if result["status"] == "error":
                logger.error(f"Enrollment parsing error: {result['message']}")
                raise HTTPException(status_code=400, detail=result["message"])
                
            logger.info("Enrollment file parsed successfully")
            return result
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
    except Exception as e:
        logger.error(f"Error processing enrollment file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-timetable")
async def parse_timetable_endpoint(file: UploadFile):
    """Parse timetable file and return structured data."""
    if not file:
        logger.error("No file provided for timetable parsing")
        raise HTTPException(status_code=400, detail="No file provided")
        
    try:
        logger.info(f"Processing timetable file: {file.filename}")
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Parse the file
            result = parse_timetable(temp_file_path)
            
            if result["status"] == "error":
                logger.error(f"Timetable parsing error: {result['message']}")
                raise HTTPException(status_code=400, detail=result["message"])
                
            logger.info("Timetable file parsed successfully")
            return result
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
    except Exception as e:
        logger.error(f"Error processing timetable file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002) 