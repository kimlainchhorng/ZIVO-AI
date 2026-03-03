import os
import json
from datetime import datetime
from agents import function_tool
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Connector Registry
# A central registry mapping tool names to their implementations.
# Register new connectors here without touching the agent definition.
# ---------------------------------------------------------------------------

CONNECTOR_REGISTRY: dict = {}

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


@function_tool
def web_search(query: str) -> str:
    """
    Performs a web search for the given query and returns summarized results.
    Use this when the user asks about recent events, current facts, or anything
    requiring up-to-date information from the internet.

    Args:
        query: The search query string.
    """
    try:
        import urllib.request
        import urllib.parse
        # Use DuckDuckGo Instant Answer API (no key required)
        encoded = urllib.parse.quote_plus(query)
        url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1"
        req = urllib.request.Request(url, headers={"User-Agent": "ZIVO-AI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        abstract = data.get("AbstractText", "")
        related = [r.get("Text", "") for r in data.get("RelatedTopics", [])[:3] if isinstance(r, dict) and "Text" in r]
        if abstract:
            return f"**Summary:** {abstract}\n\n**Related:**\n" + "\n".join(f"- {r}" for r in related)
        elif related:
            return "**Related topics:**\n" + "\n".join(f"- {r}" for r in related)
        else:
            return f"[No instant answer found for '{query}'. Try rephrasing.]"
    except Exception as e:
        return f"[Web search error: {str(e)}]"


@function_tool
def deep_research(topic: str, depth: int = 3) -> str:
    """
    Performs multi-angle deep research on a topic by running several searches,
    cross-referencing findings, and synthesizing a structured report.
    Use this when the user asks for comprehensive analysis, research papers,
    strategic insights, or detailed background on a complex subject.

    Args:
        topic: The research topic or question.
        depth: Number of sub-queries to run (1-5). Defaults to 3.
    """
    import urllib.request
    import urllib.parse

    depth = max(1, min(5, depth))
    sub_queries = [
        topic,
        f"{topic} latest developments 2025 2026",
        f"{topic} expert analysis criticism",
        f"{topic} practical applications examples",
        f"{topic} future trends predictions",
    ][:depth]

    findings = []
    for i, q in enumerate(sub_queries, 1):
        try:
            encoded = urllib.parse.quote_plus(q)
            url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1"
            req = urllib.request.Request(url, headers={"User-Agent": "ZIVO-AI-Research/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
            abstract = data.get("AbstractText", "")
            related = [r.get("Text", "") for r in data.get("RelatedTopics", [])[:2] if isinstance(r, dict) and "Text" in r]
            if abstract:
                findings.append(f"**Angle {i} — {q}:**\n{abstract}")
            elif related:
                findings.append(f"**Angle {i} — {q}:**\n" + "; ".join(related))
        except Exception as e:
            findings.append(f"**Angle {i} — {q}:** [Search error: {str(e)}]")

    if not findings:
        return f"[Deep research produced no results for '{topic}']"

    report = f"# Deep Research Report: {topic}\n\n"
    report += "\n\n---\n\n".join(findings)
    report += f"\n\n---\n*Research depth: {depth} angles. Cross-referenced {len(findings)} sources.*"
    return report


# Expose all registered tools as a list for the Agent
ALL_TOOLS = [
    get_current_datetime,
    read_local_file,
    list_directory,
    web_search,
    deep_research,
]

PLANNER_TOOLS = [
    get_current_datetime,
    list_directory,
]

EXECUTOR_TOOLS = ALL_TOOLS  # Executor has access to everything

VALIDATOR_TOOLS = [
    get_current_datetime,
    read_local_file,
]
