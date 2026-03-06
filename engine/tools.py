import fnmatch
import os
import json
import re
import subprocess
import sys
import textwrap
from datetime import datetime, datetime as _dt
from agents import function_tool
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Connector Registry
# A central registry mapping tool names to their implementations.
# Register new connectors here without touching the agent definition.
# ---------------------------------------------------------------------------

CONNECTOR_REGISTRY: dict = {}

# ---------------------------------------------------------------------------
# Module-level constants
# ---------------------------------------------------------------------------

# File extensions that are likely binary or non-text; skipped during search
BINARY_FILE_EXTENSIONS: tuple[str, ...] = (
    ".png", ".jpg", ".jpeg", ".gif", ".ico",
    ".woff", ".woff2", ".ttf", ".zip", ".lock",
)

# Directories that are typically generated/hidden and should be skipped
IGNORED_DIRECTORIES: frozenset[str] = frozenset(
    ("node_modules", "__pycache__", ".git", "dist", ".next")
)

def register_tool(fn):
    """Decorator: register a function_tool in the global Connector Registry."""
    tool = function_tool(fn)
    CONNECTOR_REGISTRY[fn.__name__] = tool
    return tool


# ---------------------------------------------------------------------------
# Guardrail models (Pydantic input/output validation)
# ---------------------------------------------------------------------------

class FilePathInput(BaseModel):
    file_path: str

    def model_post_init(self, __context):
        if ".." in self.file_path or self.file_path.startswith("/"):
            raise ValueError(f"Unsafe path rejected: {self.file_path!r}")


class DirectoryInput(BaseModel):
    directory_path: str = "."

    def model_post_init(self, __context):
        if ".." in self.directory_path or self.directory_path.startswith("/"):
            raise ValueError(f"Unsafe directory path rejected: {self.directory_path!r}")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@register_tool
def get_current_datetime() -> str:
    """
    Returns the current date and time.
    Use this when the user asks about the current time or date.
    """
    return datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")


@register_tool
def read_local_file(file_path: str) -> str:
    """
    Reads and returns the content of a local file.
    Use this when the user asks you to analyze, summarize, or review a file on disk.

    Args:
        file_path: The relative path to the file (no absolute paths or traversal).
    """
    try:
        validated = FilePathInput(file_path=file_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        with open(validated.file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content if content.strip() else f"[File '{validated.file_path}' is empty]"
    except FileNotFoundError:
        return f"[Error: File '{validated.file_path}' not found]"
    except Exception as e:
        return f"[Error reading file: {str(e)}]"


@register_tool
def list_directory(directory_path: str = ".") -> str:
    """
    Lists the files and folders in a directory.
    Use this when the user wants to know what files exist in a folder.

    Args:
        directory_path: The relative directory path (no absolute paths or traversal).
    """
    try:
        validated = DirectoryInput(directory_path=directory_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        entries = os.listdir(validated.directory_path)
        files = [e for e in entries if os.path.isfile(os.path.join(validated.directory_path, e))]
        dirs = [e for e in entries if os.path.isdir(os.path.join(validated.directory_path, e))]
        return json.dumps({"directories": sorted(dirs), "files": sorted(files)}, indent=2)
    except FileNotFoundError:
        return f"[Error: Directory '{validated.directory_path}' not found]"
    except Exception as e:
        return f"[Error listing directory: {str(e)}]"


@register_tool
def write_local_file(file_path: str, content: str) -> str:
    """
    Writes content to a local file, creating it if it doesn't exist.
    Use this when the user asks you to save, create, or write a file.

    Args:
        file_path: The relative path of the file to write.
        content: The text content to write.
    """
    try:
        validated = FilePathInput(file_path=file_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        os.makedirs(os.path.dirname(validated.file_path) or ".", exist_ok=True)
        with open(validated.file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"[Success: Written {len(content)} characters to '{validated.file_path}']"
    except Exception as e:
        return f"[Error writing file: {str(e)}]"


@register_tool
def search_files(pattern: str, directory_path: str = ".") -> str:
    """
    Searches for a text pattern (case-insensitive) inside all files under a directory.
    Returns a JSON list of {file, line, text} matches (max 50 results).

    Args:
        pattern: The text to search for (plain string, case-insensitive).
        directory_path: Root directory to search recursively (no absolute paths or traversal).
    """
    try:
        validated = DirectoryInput(directory_path=directory_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    regex = re.compile(re.escape(pattern), re.IGNORECASE)
    matches: list[dict] = []

    for root, _, files in os.walk(validated.directory_path):
        for fname in files:
            # Skip binary / large files
            if any(fname.endswith(ext) for ext in BINARY_FILE_EXTENSIONS):
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    for lineno, line in enumerate(f, 1):
                        if regex.search(line):
                            matches.append({
                                "file": fpath,
                                "line": lineno,
                                "text": line.rstrip(),
                            })
                            if len(matches) >= 50:
                                return json.dumps({"matches": matches, "truncated": True}, indent=2)
            except Exception:
                continue

    return json.dumps({"matches": matches, "truncated": False}, indent=2)


@register_tool
def get_file_stats(file_path: str) -> str:
    """
    Returns metadata about a file: size, line count, last modified time.

    Args:
        file_path: The relative path to the file.
    """
    try:
        validated = FilePathInput(file_path=file_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        stat = os.stat(validated.file_path)
        with open(validated.file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = sum(1 for _ in f)
        return json.dumps({
            "file": validated.file_path,
            "size_bytes": stat.st_size,
            "line_count": lines,
            "last_modified": _dt.fromtimestamp(stat.st_mtime).isoformat(),
        }, indent=2)
    except FileNotFoundError:
        return f"[Error: File '{validated.file_path}' not found]"
    except Exception as e:
        return f"[Error getting file stats: {e}]"


@register_tool
def append_to_file(file_path: str, content: str) -> str:
    """
    Appends content to the end of an existing file (or creates it if absent).

    Args:
        file_path: The relative path of the file to append to.
        content: The text to append.
    """
    try:
        validated = FilePathInput(file_path=file_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        os.makedirs(os.path.dirname(validated.file_path) or ".", exist_ok=True)
        with open(validated.file_path, "a", encoding="utf-8") as f:
            f.write(content)
        return f"[Success: Appended {len(content)} characters to '{validated.file_path}']"
    except Exception as e:
        return f"[Error appending to file: {e}]"


@register_tool
def delete_file(file_path: str) -> str:
    """
    Deletes a local file. Only works on files (not directories).

    Args:
        file_path: The relative path of the file to delete.
    """
    try:
        validated = FilePathInput(file_path=file_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    try:
        if not os.path.isfile(validated.file_path):
            return f"[Error: '{validated.file_path}' is not a file or does not exist]"
        os.remove(validated.file_path)
        return f"[Success: Deleted '{validated.file_path}']"
    except Exception as e:
        return f"[Error deleting file: {e}]"


@register_tool
def run_python_snippet(code: str) -> str:
    """
    Executes a small Python code snippet in a sandboxed subprocess and returns stdout + stderr.
    Timeout: 10 seconds. Max output: 4 KB.
    Use for quick calculations, data transformations, or verifying logic.

    Args:
        code: The Python source code to execute.
    """
    # Reject obviously dangerous patterns
    BLOCKED = ["import os", "import sys", "import subprocess", "__import__", "open(", "exec(", "eval("]
    for b in BLOCKED:
        if b in code:
            return f"[Guardrail blocked]: pattern '{b}' is not allowed in sandboxed snippets."

    try:
        result = subprocess.run(
            [sys.executable, "-c", textwrap.dedent(code)],
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = (result.stdout + result.stderr)[:4096]
        return output if output.strip() else "[No output]"
    except subprocess.TimeoutExpired:
        return "[Error: Snippet timed out after 10 seconds]"
    except Exception as e:
        return f"[Error running snippet: {e}]"


@register_tool
def summarise_directory(directory_path: str = ".") -> str:
    """
    Returns a high-level summary of a project directory: total files, file types,
    top-level structure, and largest files.

    Args:
        directory_path: The relative directory to summarise.
    """
    try:
        validated = DirectoryInput(directory_path=directory_path)
    except ValueError as e:
        return f"[Guardrail blocked]: {e}"

    ext_counts: dict[str, int] = {}
    file_sizes: list[tuple[int, str]] = []
    total_files = 0

    for root, dirs, files in os.walk(validated.directory_path):
        # Skip hidden / build dirs
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in IGNORED_DIRECTORIES]
        for fname in files:
            fpath = os.path.join(root, fname)
            total_files += 1
            ext = os.path.splitext(fname)[1].lower() or "(no ext)"
            ext_counts[ext] = ext_counts.get(ext, 0) + 1
            try:
                size = os.path.getsize(fpath)
                file_sizes.append((size, fpath))
            except OSError:
                pass

    top_ext = sorted(ext_counts.items(), key=lambda x: -x[1])[:10]
    top_large = sorted(file_sizes, reverse=True)[:5]

    return json.dumps({
        "total_files": total_files,
        "top_extensions": {k: v for k, v in top_ext},
        "largest_files": [{"path": p, "size_bytes": s} for s, p in top_large],
    }, indent=2)


# Expose all registered tools as a list for the Agent
ALL_TOOLS = list(CONNECTOR_REGISTRY.values())
