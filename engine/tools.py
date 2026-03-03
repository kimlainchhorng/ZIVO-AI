import os
import json
from datetime import datetime
from agents import function_tool


@function_tool
def get_current_datetime() -> str:
    """Returns the current date and time."""
    return datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")


@function_tool
def read_local_file(file_path: str) -> str:
    """Reads and returns the content of a local file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content if content.strip() else f"[File '{file_path}' is empty]"
    except FileNotFoundError:
        return f"[Error: File '{file_path}' not found]"
    except Exception as e:
        return f"[Error reading file: {str(e)}]"


@function_tool
def list_directory(directory_path: str = "") -> str:
    """Lists the files and folders in a directory."""
    try:
        entries = os.listdir(directory_path)
        files = [e for e in entries if os.path.isfile(os.path.join(directory_path, e))]
        dirs = [e for e in entries if os.path.isdir(os.path.join(directory_path, e))]
        result = {"directories": sorted(dirs), "files": sorted(files)}
        return json.dumps(result, indent=2)
    except FileNotFoundError:
        return f"[Error: Directory '{directory_path}' not found]"
    except Exception as e:
        return f"[Error listing directory: {str(e)}]"