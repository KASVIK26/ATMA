import subprocess
import sys
import os
import venv
from pathlib import Path

def create_venv():
    """Create virtual environment if it doesn't exist."""
    venv_path = Path('venv')
    if not venv_path.exists():
        print("Creating virtual environment...")
        venv.create('venv', with_pip=True)
        return True
    return False

def install_dependencies():
    """Install required dependencies."""
    # Get the correct pip path based on the OS
    if os.name == 'nt':  # Windows
        pip_path = 'venv\\Scripts\\pip'
    else:  # Unix/MacOS
        pip_path = 'venv/bin/pip'

    print("Installing dependencies...")
    subprocess.check_call([pip_path, 'install', '-r', 'requirements.txt'])

def start_server():
    """Start the FastAPI server."""
    # Get the correct python path based on the OS
    if os.name == 'nt':  # Windows
        python_path = 'venv\\Scripts\\python'
    else:  # Unix/MacOS
        python_path = 'venv/bin/python'

    print("Starting server...")
    subprocess.run([python_path, 'api.py'])

if __name__ == "__main__":
    try:
        # Create virtual environment if needed
        if create_venv():
            install_dependencies()
        
        # Start the server
        start_server()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1) 