"""Tests for the new tools added in engine/tools.py."""

import json
import os
import sys
import tempfile
import types

# Stub agents + dotenv
for _mod in ("agents", "dotenv"):
    if _mod not in sys.modules:
        stub = types.ModuleType(_mod)
        stub.function_tool = lambda fn: fn  # type: ignore
        stub.Agent = object  # type: ignore
        stub.Runner = object  # type: ignore
        stub.ModelSettings = object  # type: ignore
        stub.handoff = lambda *a, **kw: None  # type: ignore
        stub.load_dotenv = lambda: None  # type: ignore
        sys.modules[_mod] = stub
sys.modules.setdefault("agents.mcp", types.ModuleType("agents.mcp"))

from engine.tools import (  # noqa: E402
    search_files,
    get_file_stats,
    append_to_file,
    delete_file,
    summarise_directory,
)


def test_search_files_finds_match():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("hello.txt", "w") as f:
                f.write("hello world\nfoo bar\n")
            result = json.loads(search_files("hello", "."))
            assert result["truncated"] is False
            assert any("hello world" in m["text"] for m in result["matches"])
        finally:
            os.chdir(orig_dir)


def test_search_files_no_match():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("hello.txt", "w") as f:
                f.write("foo bar\n")
            result = json.loads(search_files("zzznomatch", "."))
            assert result["matches"] == []
        finally:
            os.chdir(orig_dir)


def test_get_file_stats():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("sample.txt", "w") as f:
                f.write("line1\nline2\nline3\n")
            result = json.loads(get_file_stats("sample.txt"))
            assert result["line_count"] == 3
            assert result["size_bytes"] > 0
        finally:
            os.chdir(orig_dir)


def test_append_to_file():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("append.txt", "w") as f:
                f.write("initial\n")
            append_to_file("append.txt", "appended\n")
            with open("append.txt") as f:
                assert "appended" in f.read()
        finally:
            os.chdir(orig_dir)


def test_delete_file():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("todelete.txt", "w") as f:
                f.write("bye")
            result = delete_file("todelete.txt")
            assert "Success" in result
            assert not os.path.exists("todelete.txt")
        finally:
            os.chdir(orig_dir)


def test_delete_file_not_found():
    result = delete_file("ghost_file_xyz_does_not_exist.txt")
    assert "Error" in result


def test_summarise_directory():
    with tempfile.TemporaryDirectory() as tmp_dir:
        orig_dir = os.getcwd()
        os.chdir(tmp_dir)
        try:
            with open("a.py", "w") as f:
                f.write("x=1\n")
            with open("b.ts", "w") as f:
                f.write("const x=1;\n")
            result = json.loads(summarise_directory("."))
            assert result["total_files"] == 2
            assert ".py" in result["top_extensions"] or ".ts" in result["top_extensions"]
        finally:
            os.chdir(orig_dir)

