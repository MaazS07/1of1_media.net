"""
runtime_tools_service.py (Pydantic v2 compatible)
-------------------------------------------------
FastAPI microservice for runtime-created tools (webhook, prompt_template, python) and LLM-based code generation.

Features
- Register tools (POST /tools), list, delete
- Execute tools (POST /tools/{name}/execute)
- Auto-execute (POST /tools/auto-execute) — upsert + run
- Generate Python tool files (two providers):
    * Gemini:
        - POST /tools/generate       -> creates custom_tools/<name>.py with run(args)->Any
        - POST /tools/generate-agno  -> creates custom_tools/<name>.py with an @tool-decorated function
    * Groq:
        - POST /tools/generate-groq       -> creates custom_tools/<name>.py with run(args)->Any
        - POST /tools/generate-agno-groq  -> creates custom_tools/<name>.py with an @tool-decorated function
- Tools directory configurable via TOOLS_DIR (default: custom_tools/)
- JSON persistence via TOOLS_DB_PATH (default: runtime_tools_db.json)

Run
----
pip install fastapi uvicorn pydantic requests python-multipart python-dotenv
pip install google-generativeai  # for Gemini-based endpoints
pip install groq                 # for Groq-based endpoints
export GOOGLE_API_KEY="YOUR_KEY" # if using Gemini
export GROQ_API_KEY="YOUR_KEY"   # if using Groq
uvicorn runtime_tools_service:app --host 0.0.0.0 --port 7001
"""

import json
import os
import re
import importlib.util
import pathlib
import types
import inspect
from typing import Any, Dict, List, Literal, Optional, Callable

import requests
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl

# Load env from .env automatically
from dotenv import load_dotenv
load_dotenv(os.getenv("DOTENV_PATH", ".env"))

# Optional Gemini dependency (code generation)
try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

# Optional Groq dependency (code generation)
try:
    from groq import Groq
except Exception:  # pragma: no cover
    Groq = None

# -----------------------------
# Configuration & persistence
# -----------------------------
TOOLS_DB_PATH = os.getenv("TOOLS_DB_PATH", "runtime_tools_db.json")

# Directory to store generated Python tools
TOOLS_DIR = os.getenv("TOOLS_DIR", "custom_tools")
pathlib.Path(TOOLS_DIR).mkdir(parents=True, exist_ok=True)

def _load_db() -> Dict[str, Any]:
    if not os.path.exists(TOOLS_DB_PATH):
        return {"tools": []}
    try:
        with open(TOOLS_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"tools": []}

def _save_db(data: Dict[str, Any]) -> None:
    tmp_path = TOOLS_DB_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, TOOLS_DB_PATH)

# -----------------------------
# Models (Pydantic v2)
# -----------------------------
class WebhookConfig(BaseModel):
    url: HttpUrl
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"] = "POST"
    headers: Optional[Dict[str, str]] = None

class PromptTemplateConfig(BaseModel):
    template: str = Field(..., description="Use {var} placeholders for args")

class PythonConfig(BaseModel):
    file_path: str = Field(..., description="Path to the Python module file")
    entry_point: str = Field("run", description="Function name to call in the module")

class ToolSpec(BaseModel):
    name: str = Field(..., pattern=r"^[a-zA-Z0-9_\-]{1,64}$")
    description: Optional[str] = ""
    mode: Literal["webhook", "prompt_template", "python"]
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON-Schema-like dict for args (properties/required).",
    )
    webhook: Optional[WebhookConfig] = None
    promptTemplate: Optional[PromptTemplateConfig] = None
    python: Optional[PythonConfig] = None
    isActive: bool = True

class ExecuteRequest(BaseModel):
    args: Dict[str, Any] = Field(default_factory=dict)

class ExecuteResponse(BaseModel):
    ok: bool
    result: Any = None
    error: Optional[str] = None
    tool: Optional[str] = None

class AutoExecRequest(BaseModel):
    name: str
    mode: Literal["webhook", "prompt_template", "python"]
    description: Optional[str] = ""
    parameters: Dict[str, Any] = Field(default_factory=dict)
    webhook: Optional[WebhookConfig] = None
    promptTemplate: Optional[PromptTemplateConfig] = None
    python: Optional[PythonConfig] = None
    args: Dict[str, Any] = Field(default_factory=dict)
    upsert: bool = True

class AutoExecResponse(BaseModel):
    ok: bool
    created_or_updated: bool
    result: Any = None
    error: Optional[str] = None
    tool: Optional[str] = None

# Code-gen: plain python run(args)->Any (Gemini)
class GenerateToolRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    prompt: str = Field(..., description="Describe the tool; Gemini will produce Python code with run(args)->Any")
    entry_point: str = "run"
    model: str = os.getenv("GEMINI_MODEL", "gemini-1.5")
    temperature: float = 0.4
    test_args: Optional[Dict[str, Any]] = None

class GenerateToolResponse(BaseModel):
    ok: bool
    file_path: Optional[str] = None
    result_preview: Optional[Any] = None
    error: Optional[str] = None
    tool: Optional[str] = None

# Code-gen: Agno @tool (Gemini)
class GenerateAgnoToolRequest(BaseModel):
    name: str
    description: str = "Runtime-generated Agno tool"
    prompt: str = Field(..., description="Describe the tool behavior and its parameters.")
    function_name: str = "tool_fn"
    inputs: Dict[str, str] = Field(default_factory=dict, description="Arg name -> python type (e.g., 'a': 'int')")
    return_type: str = "Any"
    model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
    temperature: float = 0.2

class GenerateAgnoToolResponse(BaseModel):
    ok: bool
    file_path: str = ""
    error: Optional[str] = None
    import_example: Optional[str] = None

# Code-gen: plain python run(args)->Any (Groq)
class GenerateToolGroqRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    prompt: str = Field(..., description="Describe the tool; Groq will produce Python code with run(args)->Any")
    entry_point: str = "run"
    model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")  # updated default
    temperature: float = 0.4
    test_args: Optional[Dict[str, Any]] = None

# Code-gen: Agno @tool (Groq)
class GenerateAgnoToolGroqRequest(BaseModel):
    name: str
    description: str = "Runtime-generated Agno tool"
    prompt: str = Field(..., description="Describe the tool behavior and its parameters.")
    function_name: str = "tool_fn"
    inputs: Dict[str, str] = Field(default_factory=dict, description="Arg name -> python type (e.g., 'a': 'int')")
    return_type: str = "Any"
    model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")  # updated default
    temperature: float = 0.2

# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI(title="Runtime Tools Service", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:7000",
        "http://127.0.0.1:7000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Helpers
# -----------------------------
def _find_tool(db: Dict[str, Any], name: str) -> Optional[Dict[str, Any]]:
    for t in db.get("tools", []):
        if t.get("name") == name and t.get("isActive", True):
            return t
    return None

def _fill_template(template: str, args: Dict[str, Any]) -> str:
    out = template
    for m in re.findall(r"{(\w+)}", template):
        out = out.replace("{%s}" % m, str(args.get(m, "")))
    return out

def _make_adapter(callable_target: Callable) -> Callable[[Dict[str, Any]], Any]:
    """
    Return a callable that always takes `args: Dict[str, Any]` and calls the
    underlying `callable_target` appropriately (kwargs, single dict, or no-arg).
    """
    try:
        sig = inspect.signature(callable_target)
    except Exception:
        sig = None

    def adapter(args: Dict[str, Any]) -> Any:
        if args is None:
            args = {}
        # 1) Prefer kwargs (works for most plain or @tool-decorated callables)
        try:
            return callable_target(**args)
        except TypeError as e_kwargs:
            # 2) If the callable expects a single param, try passing the dict positionally
            if sig:
                params = list(sig.parameters.values())
                if len(params) == 1 and params[0].kind in (
                    inspect.Parameter.POSITIONAL_ONLY,
                    inspect.Parameter.POSITIONAL_OR_KEYWORD,
                    inspect.Parameter.KEYWORD_ONLY,
                ):
                    try:
                        return callable_target(args)
                    except Exception as e_pos:
                        raise TypeError(
                            f"Callable rejected both kwargs and single-dict positional: {e_pos}"
                        ) from e_pos
            # 3) Last resort: call with no args (some tools take none)
            try:
                return callable_target()
            except Exception:
                # fall back to the original kwargs error for clarity
                raise e_kwargs
    return adapter

def _load_python_tool(file_path: str, entry_point: str) -> Callable[[Dict[str, Any]], Any]:
    """
    Load an entry point from a Python file and return an adapter that accepts Dict[str, Any].
    Supports:
      - plain functions
      - decorated functions with __wrapped__
      - Agno @tool wrappers exposing .function or .fn
      - callable objects (with __call__)
    """
    p = pathlib.Path(file_path).resolve()
    if not p.exists():
        raise FileNotFoundError(f"Tool module not found: {p}")
    spec = importlib.util.spec_from_file_location(p.stem, str(p))
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load module from {p}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore

    obj = getattr(mod, entry_point, None)
    if obj is None:
        raise AttributeError(f"Entry point '{entry_point}' not found in {p.name}")

    # Try to unwrap to a real callable function first
    cand = None
    if isinstance(obj, (types.FunctionType, types.BuiltinFunctionType)):
        cand = obj
    elif hasattr(obj, "__wrapped__") and callable(getattr(obj, "__wrapped__")):
        cand = getattr(obj, "__wrapped__")
    elif hasattr(obj, "function") and callable(getattr(obj, "function")):
        # Common for some tool wrappers
        cand = getattr(obj, "function")
    elif hasattr(obj, "fn") and callable(getattr(obj, "fn")):
        cand = getattr(obj, "fn")

    # If not found, but the object itself is callable (e.g., Agno tool instance), use it directly
    callable_target = cand if cand is not None else (obj if callable(obj) else None)
    if callable_target is None:
        raise AttributeError(
            f"Entry point '{entry_point}' is neither a function nor a callable tool in {p.name}"
        )

    return _make_adapter(callable_target)

def _ensure_mode_config(name: str, mode: str, webhook, promptTemplate, python):
    if mode == "webhook" and not webhook:
        raise HTTPException(status_code=400, detail=f"`webhook` config is required for tool '{name}'")
    if mode == "prompt_template" and not promptTemplate:
        raise HTTPException(status_code=400, detail=f"`promptTemplate` is required for tool '{name}'")
    if mode == "python" and not python:
        raise HTTPException(status_code=400, detail=f"`python` config is required for tool '{name}'")

def _extract_code_fenced_or_raw(text: str) -> str:
    txt = (text or "").strip()
    m = re.search(r"```(?:python)?\n([\s\S]*?)\n```", txt, re.IGNORECASE)
    return m.group(1) if m else txt

# -----------------------------
# Routes (core)
# -----------------------------
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/tools", response_model=List[ToolSpec])
def list_tools():
    db = _load_db()
    return db.get("tools", [])

@app.post("/tools", response_model=ToolSpec)
def register_tool(spec: ToolSpec = Body(...)):
    _ensure_mode_config(spec.name, spec.mode, spec.webhook, spec.promptTemplate, spec.python)
    db = _load_db()
    tools = db.get("tools", [])
    for i, t in enumerate(tools):
        if t.get("name") == spec.name:
            tools[i] = json.loads(spec.model_dump_json())
            _save_db(db)
            return spec
    tools.append(json.loads(spec.model_dump_json()))
    db["tools"] = tools
    _save_db(db)
    return spec

@app.delete("/tools/{name}")
def delete_tool(name: str):
    db = _load_db()
    tools = db.get("tools", [])
    new_tools = [t for t in tools if t.get("name") != name]
    if len(new_tools) == len(tools):
        raise HTTPException(status_code=404, detail="Tool not found")
    db["tools"] = new_tools
    _save_db(db)
    return {"ok": True}

@app.post("/tools/{name}/execute", response_model=ExecuteResponse)
def execute_tool(name: str, req: ExecuteRequest):
    db = _load_db()
    tool = _find_tool(db, name)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found or inactive")

    mode = tool.get("mode")
    try:
        if mode == "webhook":
            wh = tool.get("webhook") or {}
            method = (wh.get("method") or "POST").upper()
            url = wh.get("url")
            headers = wh.get("headers") or {}
            if not url:
                raise ValueError("Webhook url missing")

            if method == "GET":
                r = requests.get(url, params=req.args, headers=headers, timeout=20)
            elif method in ("POST", "PUT", "PATCH", "DELETE"):
                r = requests.request(method, url, json=req.args, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported webhook method: {method}")

            content_type = r.headers.get("Content-Type", "")
            try:
                data = r.json() if "application/json" in content_type else r.text
            except Exception:
                data = r.text
            return ExecuteResponse(ok=r.ok, result=data, error=None if r.ok else f"HTTP {r.status_code}", tool=name)

        elif mode == "python":
            py = tool.get("python") or {}
            file_path = py.get("file_path")
            entry_point = py.get("entry_point", "run")
            fn = _load_python_tool(file_path, entry_point)  # returns adapter(args: dict)
            result = fn(req.args or {})
            return ExecuteResponse(ok=True, result=result, tool=name)

        elif mode == "prompt_template":
            pt = tool.get("promptTemplate") or {}
            tpl = pt.get("template") or ""
            if not tpl:
                raise ValueError("promptTemplate.template missing")
            rendered = _fill_template(tpl, req.args or {})
            return ExecuteResponse(ok=True, result={"prompt": rendered}, tool=name)

        else:
            raise ValueError(f"Unknown mode: {mode}")

    except Exception as e:
        return ExecuteResponse(ok=False, error=str(e), tool=name)

@app.post("/tools/auto-execute", response_model=AutoExecResponse)
def auto_execute(req: AutoExecRequest):
    _ensure_mode_config(req.name, req.mode, req.webhook, req.promptTemplate, req.python)

    db = _load_db()
    existing = _find_tool(db, req.name)

    spec_dict = {
        "name": req.name,
        "description": req.description or "",
        "mode": req.mode,
        "parameters": req.parameters or {},
        "webhook": req.webhook.model_dump() if req.webhook else None,
        "promptTemplate": req.promptTemplate.model_dump() if req.promptTemplate else None,
        "python": req.python.model_dump() if req.python else None,
        "isActive": True,
    }

    created_or_updated = False
    if existing is None:
        db.setdefault("tools", []).append(spec_dict)
        created_or_updated = True
    elif req.upsert:
        for i, t in enumerate(db.get("tools", [])):
            if t.get("name") == req.name:
                db["tools"][i] = spec_dict
                created_or_updated = True
                break

    _save_db(db)

    try:
        if req.mode == "webhook":
            wh = spec_dict.get("webhook") or {}
            method = (wh.get("method") or "POST").upper()
            url = wh.get("url")
            headers = wh.get("headers") or {}
            if not url:
                raise ValueError("Webhook url missing")

            if method == "GET":
                r = requests.get(url, params=req.args, headers=headers, timeout=20)
            elif method in ("POST", "PUT", "PATCH", "DELETE"):
                r = requests.request(method, url, json=req.args, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported webhook method: {method}")

            content_type = r.headers.get("Content-Type", "")
            try:
                data = r.json() if "application/json" in content_type else r.text
            except Exception:
                data = r.text
            return AutoExecResponse(ok=r.ok, created_or_updated=created_or_updated, result=data,
                                    error=None if r.ok else f"HTTP {r.status_code}", tool=req.name)

        elif req.mode == "python":
            py = spec_dict.get("python") or {}
            file_path = py.get("file_path")
            entry_point = py.get("entry_point", "run")
            fn = _load_python_tool(file_path, entry_point)
            result = fn(req.args or {})
            return AutoExecResponse(ok=True, created_or_updated=created_or_updated,
                                    result=result, tool=req.name)

        elif req.mode == "prompt_template":
            pt = spec_dict.get("promptTemplate") or {}
            tpl = pt.get("template") or ""
            if not tpl:
                raise ValueError("promptTemplate.template missing")
            rendered = _fill_template(tpl, req.args or {})
            return AutoExecResponse(ok=True, created_or_updated=created_or_updated,
                                    result={"prompt": rendered}, tool=req.name)

        else:
            raise ValueError(f"Unknown mode: {req.mode}")

    except Exception as e:
        return AutoExecResponse(ok=False, created_or_updated=created_or_updated, error=str(e), tool=req.name)

# -----------------------------
# Code generation (Gemini)
# -----------------------------
@app.post("/tools/generate", response_model=GenerateToolResponse)
def generate_tool(req: GenerateToolRequest):
    if genai is None:
        raise HTTPException(status_code=500, detail="Missing dependency: google-generativeai. Install it via `pip install google-generativeai`.")
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GOOGLE_API_KEY env var is required to call Gemini.")
    genai.configure(api_key=api_key)

    sys_msg = (
        "Generate a SINGLE Python module that defines a function "
        f"named `{req.entry_point}(args: dict) -> Any`. "
        "Do not include any non-Python text. Output ONLY the Python code. "
        "Avoid external network calls unless explicitly requested. "
        "Import within the module as needed. "
        "The function should read inputs from the `args` dict and return a JSON-serializable object."
    )
    user_msg = (
        "Tool description:\n"
        f"{req.prompt}\n\n"
        "Constraints:\n"
        f"- Entry function `{req.entry_point}(args: dict) -> Any` must exist.\n"
        "- Return only JSON-serializable content.\n"
        "- Handle missing inputs gracefully with clear errors.\n"
    )

    model = genai.GenerativeModel(req.model)
    resp = model.generate_content([sys_msg, user_msg], generation_config={"temperature": req.temperature})
    code = _extract_code_fenced_or_raw(getattr(resp, "text", "") or "")

    if req.entry_point not in code:
        return GenerateToolResponse(ok=False, error=f"Generated code does not contain entry point '{req.entry_point}'", tool=req.name)

    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", req.name).strip("_")
    file_path = os.path.join(TOOLS_DIR, f"{safe_name}.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    db = _load_db()
    spec = {
        "name": req.name,
        "description": req.description or req.prompt[:200],
        "mode": "python",
        "parameters": {},
        "python": {"file_path": file_path, "entry_point": req.entry_point},
        "isActive": True,
    }
    tools = db.get("tools", [])
    for i, t in enumerate(tools):
        if t.get("name") == req.name:
            tools[i] = spec
            break
    else:
        tools.append(spec)
    db["tools"] = tools
    _save_db(db)

    preview = None
    if req.test_args is not None:
        try:
            fn = _load_python_tool(file_path, req.entry_point)
            preview = fn(req.test_args)
        except Exception as e:
            return GenerateToolResponse(ok=False, error=f"Generated but failed to import/execute: {e}", file_path=file_path, tool=req.name)

    return GenerateToolResponse(ok=True, file_path=file_path, result_preview=preview, tool=req.name)

@app.post("/tools/generate-agno", response_model=GenerateAgnoToolResponse)
def generate_agno_tool(req: GenerateAgnoToolRequest):
    if genai is None:
        raise HTTPException(status_code=500, detail="Missing dependency: google-generativeai. Install it via `pip install google-generativeai`.")
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GOOGLE_API_KEY env var is required to call Gemini.")
    genai.configure(api_key=api_key)

    sig_hint = ", ".join(f"{k}: {v}" for k, v in (req.inputs or {}).items()) or "args as needed by the prompt"
    sys_msg = (
        "You generate a SINGLE Python module that contains exactly one callable decorated with @tool from agno.tools. "
        "Do not output any prose or markdown fences; only the Python code. "
        "The function must be fully type-annotated, have a concise docstring, and return JSON-serializable data. "
        "If importing dependencies, include the imports. Avoid prints except guarded debugging."
    )
    user_msg = (
        f"Create the file for a tool function named `{req.function_name}`.\n"
        f"It should accept arguments: {sig_hint}.\n"
        f"It should return type `{req.return_type}`.\n"
        f"Docstring should clearly describe parameters and return value.\n"
        f"Behavior: {req.prompt}\n"
        "Add @tool decorator with parameters: show_result=True, stop_after_tool_call=False.\n"
    )

    model = genai.GenerativeModel(req.model)
    resp = model.generate_content([sys_msg, user_msg], generation_config={"temperature": req.temperature})
    code = _extract_code_fenced_or_raw(getattr(resp, "text", "") or "")

    if "@tool" not in code or req.function_name not in code:
        return GenerateAgnoToolResponse(ok=False, error="Generated code missing @tool or function_name.", file_path="")

    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", req.name).strip("_")
    file_path = os.path.join(TOOLS_DIR, f"{safe_name}.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    import_example = (
        f"from custom_tools.{safe_name} import {req.function_name}\n"
        f"from agno.agent import Agent\n"
        f"from agno.models.openai import OpenAIChat\n"
        f"agent = Agent(model=OpenAIChat(id='gpt-4o-mini'), tools=[{req.function_name}], markdown=True)"
    )
    return GenerateAgnoToolResponse(ok=True, file_path=file_path, import_example=import_example)

# -----------------------------
# Code generation (Groq)
# -----------------------------
@app.post("/tools/generate-groq", response_model=GenerateToolResponse)
def generate_tool_groq(req: GenerateToolGroqRequest):
    if Groq is None:
        raise HTTPException(status_code=500, detail="Missing dependency: groq. Install it via `pip install groq`.")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY env var is required to call Groq.")
    client = Groq(api_key=api_key)

    sys_msg = (
        "Generate a SINGLE Python module that defines a function "
        f"named `{req.entry_point}(args: dict) -> Any`. "
        "Do not include any non-Python text. Output ONLY the Python code. "
        "Avoid external network calls unless explicitly requested. "
        "Import within the module as needed. "
        "The function should read inputs from the `args` dict and return a JSON-serializable object."
    )
    user_msg = (
        "Tool description:\n"
        f"{req.prompt}\n\n"
        "Constraints:\n"
        f"- Entry function `{req.entry_point}(args: dict) -> Any` must exist.\n"
        "- Return only JSON-serializable content.\n"
        "- Handle missing inputs gracefully with clear errors.\n"
    )

    chat = client.chat.completions.create(
        model=req.model,
        temperature=req.temperature,
        messages=[
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_msg},
        ],
    )
    content = chat.choices[0].message.content if chat.choices else ""
    code = _extract_code_fenced_or_raw(content)

    if req.entry_point not in code:
        return GenerateToolResponse(ok=False, error=f"Generated code does not contain entry point '{req.entry_point}'", tool=req.name)

    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", req.name).strip("_")
    file_path = os.path.join(TOOLS_DIR, f"{safe_name}.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    db = _load_db()
    spec = {
        "name": req.name,
        "description": req.description or req.prompt[:200],
        "mode": "python",
        "parameters": {},
        "python": {"file_path": file_path, "entry_point": req.entry_point},
        "isActive": True,
    }
    tools = db.get("tools", [])
    for i, t in enumerate(tools):
        if t.get("name") == req.name:
            tools[i] = spec
            break
    else:
        tools.append(spec)
    db["tools"] = tools
    _save_db(db)

    preview = None
    if req.test_args is not None:
        try:
            fn = _load_python_tool(file_path, req.entry_point)
            preview = fn(req.test_args)
        except Exception as e:
            return GenerateToolResponse(ok=False, error=f"Generated but failed to import/execute: {e}", file_path=file_path, tool=req.name)

    return GenerateToolResponse(ok=True, file_path=file_path, result_preview=preview, tool=req.name)

@app.post("/tools/generate-agno-groq", response_model=GenerateAgnoToolResponse)
def generate_agno_tool_groq(req: GenerateAgnoToolGroqRequest):
    if Groq is None:
        raise HTTPException(status_code=500, detail="Missing dependency: groq. Install it via `pip install groq`.")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY env var is required to call Groq.")
    client = Groq(api_key=api_key)

    sig_hint = ", ".join(f"{k}: {v}" for k, v in (req.inputs or {}).items()) or "args as needed by the prompt"
    sys_msg = (
        "You generate a SINGLE Python module that contains exactly one callable decorated with @tool from agno.tools. "
        "Do not output any prose or markdown fences; only the Python code. "
        "The function must be fully type-annotated, have a concise docstring, and return JSON-serializable data. "
        "If importing dependencies, include the imports. Avoid prints except guarded debugging."
    )
    user_msg = (
        f"Create the file for a tool function named `{req.function_name}`.\n"
        f"It should accept arguments: {sig_hint}.\n"
        f"It should return type `{req.return_type}`.\n"
        f"Docstring should clearly describe parameters and return value.\n"
        f"Behavior: {req.prompt}\n"
        "Add @tool decorator with parameters: show_result=True, stop_after_tool_call=False.\n"
    )

    chat = client.chat.completions.create(
        model=req.model,
        temperature=req.temperature,
        messages=[
            {"role": "system", "content": sys_msg},
            {"role": "user", "content": user_msg},
        ],
    )
    content = chat.choices[0].message.content if chat.choices else ""
    code = _extract_code_fenced_or_raw(content)

    if "@tool" not in code or req.function_name not in code:
        return GenerateAgnoToolResponse(ok=False, error="Generated code missing @tool or function_name.", file_path="")

    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", req.name).strip("_")
    file_path = os.path.join(TOOLS_DIR, f"{safe_name}.py")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)

    import_example = (
        f"from custom_tools.{safe_name} import {req.function_name}\n"
        f"from agno.agent import Agent\n"
        f"from agno.models.openai import OpenAIChat\n"
        f"agent = Agent(model=OpenAIChat(id='gpt-4o-mini'), tools=[{req.function_name}], markdown=True)"
    )
    return GenerateAgnoToolResponse(ok=True, file_path=file_path, import_example=import_example)

# -----------------------------
# Entrypoint
# -----------------------------
if __name__ == "__main__":  # optional convenience runner
    import uvicorn
    port = int(os.getenv("PORT", "7001"))
    uvicorn.run("runtime_tools_service:app", host="0.0.0.0", port=port, reload=False)


# Sample Create Tool
# curl -X POST http://localhost:7001/tools/generate-groq \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "multiply_two_numbers",
#     "description": "Multiply two numbers a and b",
#     "prompt": "Create a Python tool function run(args: dict) -> int that multiplies args[\"a\"] and args[\"b\"]. Validate inputs, coerce numeric strings, and raise ValueError if invalid.",
#     "entry_point": "run",
#     "model": "openai/gpt-oss-120b",
#     "temperature": 0.1,
#     "test_args": {"a": 6, "b": 7}
#   }'


# Sample Call Tool
# curl -X POST http://localhost:7001/tools/multiply_two_numbers/execute \
#   -H "Content-Type: application/json" \
#   -d '{"args":{"a":8,"b":5}}'
