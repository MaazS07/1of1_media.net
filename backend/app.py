from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Body, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, HttpUrl, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from agent import TextAgent, RAGAgent, WebAgent, CSVAgent, ZoomAgent
from components import (
    WebSearchAgent, EmailAgent, CSVProcessorAgent, BasicTextAgent, 
    BasicRAGAgent, get_component_info, create_component
)
from workflow import MarketingEmailWorkflow
import pandas as pd
import io
import os
import json
import requests
from typing import Dict, Any, List, Optional, Literal, Union
import pathlib
import importlib.util
import types
import inspect
import re

# Load env from .env automatically
from dotenv import load_dotenv
load_dotenv(os.getenv("DOTENV_PATH", ".env"))

# Optional Gemini dependency (code generation)
try:
    import google.generativeai as genai
except Exception:
    genai = None

# Optional Groq dependency (code generation)
try:
    from groq import Groq
except Exception:
    Groq = None

app = FastAPI()

# Authentication Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aiflow.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(30), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    api_keys = relationship("APIKey", back_populates="user")
    templates = relationship("Template", back_populates="user")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    value = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    template_data = Column(Text, nullable=False)  # JSON string
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="templates")

# Create tables
Base.metadata.create_all(bind=engine)

# Authentication Models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime

class APIKeyCreate(BaseModel):
    name: str
    value: str
    type: str

class APIKeyResponse(BaseModel):
    id: int
    name: str
    type: str
    is_active: bool
    created_at: datetime

class TemplateCreate(BaseModel):
    name: str
    description: str = ""
    template_data: str
    is_public: bool = False

class TemplateResponse(BaseModel):
    id: int
    name: str
    description: str
    template_data: str
    is_public: bool
    created_at: datetime
    updated_at: datetime

# Helper Functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# ==================== Authentication Endpoints ====================

@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        is_active=db_user.is_active,
        created_at=db_user.created_at
    )

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_credentials.username).first()
    if not user or not verify_password(user_credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

# ==================== API Keys Management ====================

@app.get("/api-keys", response_model=List[APIKeyResponse])
async def get_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_keys = db.query(APIKey).filter(APIKey.user_id == current_user.id, APIKey.is_active == True).all()
    return [APIKeyResponse(
        id=key.id,
        name=key.name,
        type=key.type,
        is_active=key.is_active,
        created_at=key.created_at
    ) for key in api_keys]

@app.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(api_key_data: APIKeyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_api_key = APIKey(
        user_id=current_user.id,
        name=api_key_data.name,
        value=api_key_data.value,
        type=api_key_data.type
    )
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    
    return APIKeyResponse(
        id=db_api_key.id,
        name=db_api_key.name,
        type=db_api_key.type,
        is_active=db_api_key.is_active,
        created_at=db_api_key.created_at
    )

@app.put("/api-keys/{key_id}")
async def update_api_key(key_id: int, api_key_data: APIKeyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.name = api_key_data.name
    api_key.value = api_key_data.value
    api_key.type = api_key_data.type
    db.commit()
    
    return {"message": "API key updated successfully"}

@app.get("/api-keys/{key_id}/value")
async def get_api_key_value(key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id, APIKey.is_active == True).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"value": api_key.value}

@app.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == current_user.id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    api_key.is_active = False
    db.commit()
    
    return {"message": "API key deleted successfully"}

# ==================== Email Configuration ====================

class EmailConfigResponse(BaseModel):
    smtp_server: str = ""
    smtp_port: int = 587
    sender_email: str = ""
    sender_name: str = ""
    use_tls: bool = True

class EmailConfigCreate(BaseModel):
    smtp_server: str
    smtp_port: int = 587
    sender_email: str
    sender_name: str
    sender_password: str
    use_tls: bool = True

@app.get("/api/email-config", response_model=EmailConfigResponse)
async def get_email_config(current_user: User = Depends(get_current_user)):
    # For now, return empty config - in a real app, this would be stored in database
    return EmailConfigResponse()

@app.post("/api/email-config")
async def update_email_config(config: EmailConfigCreate, current_user: User = Depends(get_current_user)):
    # For now, just return success - in a real app, this would be stored in database
    return {"message": "Email configuration updated successfully"}

# ==================== Templates Management ====================

@app.get("/templates", response_model=List[TemplateResponse])
async def get_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    templates = db.query(Template).filter(
        (Template.user_id == current_user.id) | (Template.is_public == True)
    ).all()
    return [TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        template_data=template.template_data,
        is_public=template.is_public,
        created_at=template.created_at,
        updated_at=template.updated_at
    ) for template in templates]

@app.post("/templates", response_model=TemplateResponse)
async def create_template(template_data: TemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_template = Template(
        user_id=current_user.id,
        name=template_data.name,
        description=template_data.description,
        template_data=template_data.template_data,
        is_public=template_data.is_public
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return TemplateResponse(
        id=db_template.id,
        name=db_template.name,
        description=db_template.description,
        template_data=db_template.template_data,
        is_public=db_template.is_public,
        created_at=db_template.created_at,
        updated_at=db_template.updated_at
    )

@app.put("/templates/{template_id}")
async def update_template(template_id: int, template_data: TemplateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.name = template_data.name
    template.description = template_data.description
    template.template_data = template_data.template_data
    template.is_public = template_data.is_public
    template.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Template updated successfully"}

@app.delete("/templates/{template_id}")
async def delete_template(template_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id, Template.user_id == current_user.id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}

# ==================== Basic Endpoints ====================

@app.get("/")
def root():
    """Root endpoint to check if the server is running"""
    return {"message": "AI Flow Builder Backend is running", "status": "healthy"}

class QueryRequest(BaseModel):
    model: str
    query: str
    instructions: str
    
class ZoomRequest(BaseModel):
    account_id: str
    client_id: str
    client_secret: str
    query: str

class WorkflowRequest(BaseModel):
    session_id: str
    sender_email: str
    sender_name: str
    sender_passkey: str
    company_name: str
    product_description: str
    use_cached_results: bool = True
    max_retries: int = 3
    retry_delay: int = 5

# New request models for components
class ComponentRequest(BaseModel):
    component_type: str
    model: str
    query: str
    parameters: dict = {}

# Runtime Tools Configuration & Models
TOOLS_DB_PATH = os.getenv("TOOLS_DB_PATH", "runtime_tools_db.json")
TOOLS_DIR = os.path.abspath(os.getenv("TOOLS_DIR", "custom_tools"))
pathlib.Path(TOOLS_DIR).mkdir(parents=True, exist_ok=True)

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
    type: Literal["webhook", "prompt_template", "python"]
    description: str = ""
    config: Union[WebhookConfig, PromptTemplateConfig, PythonConfig]

class ExecuteRequest(BaseModel):
    args: Dict[str, Any] = Field(default_factory=dict)

class ExecuteResponse(BaseModel):
    success: bool
    result: Any = None
    error: str = ""

class AutoExecRequest(BaseModel):
    tool: ToolSpec
    args: Dict[str, Any] = Field(default_factory=dict)

class AutoExecResponse(BaseModel):
    success: bool
    result: Any = None
    error: str = ""
    upserted: bool = False

class GenerateToolRequest(BaseModel):
    name: str = Field(..., pattern=r"^[a-zA-Z0-9_\-]{1,64}$")
    description: str
    args_schema: Dict[str, Any] = Field(default_factory=dict)

class GenerateToolResponse(BaseModel):
    success: bool
    file_path: str = ""
    error: str = ""

class GenerateAgnoToolResponse(BaseModel):
    success: bool
    file_path: str = ""
    error: str = ""

class WebSearchRequest(BaseModel):
    model: str
    query: str
    search_engine: str = "google"

class TextAnalysisRequest(BaseModel):
    model: str
    text_content: str
    analysis_type: str = "general"
    query: str = ""

class JSONProcessorRequest(BaseModel):
    model: str
    json_data: str
    operation: str

class ConditionalRequest(BaseModel):
    model: str
    condition: str
    data: str = ""

class EmailRequest(BaseModel):
    model: str
    sender_email: str
    sender_name: str
    sender_passkey: str
    query: str

class CSVRequest(BaseModel):
    model: str
    csv_content: str
    query: str

class TextRequest(BaseModel):
    model: str
    query: str
    task_description: str = "general text processing"

class RAGRequest(BaseModel):
    model: str
    knowledge_base: str
    query: str

class EmailComponentRequest(BaseModel):
    model: str
    query: str
    receiver_email: str = "test@example.com"

# Runtime Tools Utility Functions
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

def _extract_code_fenced_or_raw(response_text: str) -> str:
    """Extract Python code from LLM response, handling code fences or raw code."""
    if "```python" in response_text:
        start = response_text.find("```python") + len("```python")
        end = response_text.find("```", start)
        if end != -1:
            return response_text[start:end].strip()
    elif "```" in response_text:
        start = response_text.find("```") + 3
        end = response_text.find("```", start)
        if end != -1:
            return response_text[start:end].strip()
    return response_text.strip()

def _sanitize_tool_name(name: str) -> str:
    """
    Sanitize tool name to match the required pattern.
    """
    import re
    # Replace spaces and special chars with underscores
    sanitized = re.sub(r'[^a-zA-Z0-9_\-]', '_', name)
    # Remove multiple consecutive underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    sanitized = sanitized.strip('_')
    # Ensure it's not empty and within length limit
    if not sanitized:
        sanitized = 'tool'
    return sanitized[:64]

def _load_python_tool(file_path: str, entry_point: str = "run") -> Any:
    """Load a Python tool from file."""
    abs_path = os.path.abspath(file_path)
    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"Tool file not found: {abs_path}")
    
    spec = importlib.util.spec_from_file_location("tool_module", abs_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load spec from {abs_path}")
    
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    if not hasattr(module, entry_point):
        raise AttributeError(f"Function '{entry_point}' not found in {abs_path}")
    
    return getattr(module, entry_point)

def _make_adapter(tool_func: Any) -> Any:
    """Create an adapter for a tool function."""
    sig = inspect.signature(tool_func)
    
    def adapter(args_dict: Dict[str, Any]) -> Any:
        try:
            bound = sig.bind(**args_dict)
            bound.apply_defaults()
            return tool_func(*bound.args, **bound.kwargs)
        except TypeError as e:
            raise ValueError(f"Invalid arguments for tool: {e}")
    
    return adapter

@app.post("/text_agent")
def text_agent(request: QueryRequest):
    query_text = request.query
    model_name = request.model
    instructions_text = request.instructions
    agent = TextAgent(model_name, instructions_text)
    return {"response": agent.run_agent(query_text)}

@app.post("/csv_agent")
def csv_agent(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    agent = CSVAgent(model, file)
    return {"response": agent.run_agent(query)}

@app.post("/rag_agent")
def rag_agent(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    agent = RAGAgent(model, file)  # Pass the UploadFile object, not a string
    return {"response": agent.run_agent(query)}

@app.post("/web_agent")
def web_agent(request: QueryRequest):
    query_text = request.query
    model_name = request.model
    agent = WebAgent(model_name)
    return {"response": agent.run_agent(query_text)}
    
@app.post("/zoom_agent")
def zoom_agent(request: ZoomRequest):
    account_id = request.account_id
    client_id = request.client_id
    client_secret = request.client_secret
    model = "gemini"
    query = request.query
    agent = ZoomAgent(model, account_id, client_id, client_secret)
    return {"response": agent.run_agent(query)}

@app.post("/voice_agent")
def voice_agent():
    os.system(f'lk dispatch create --new-room --agent-name outbound-caller --metadata +917769915068')
    return {"response": "Voice agent has been dispatched."}

# ========== WORKING COMPONENT ENDPOINTS ==========

@app.get("/components/info")
def get_components_info():
    """Get information about all available components"""
    try:
        from components import get_component_info
        info = get_component_info()
        # Convert to JSON-serializable format
        serializable_info = {}
        for key, value in info.items():
            serializable_info[key] = {
                "name": value["name"],
                "description": value["description"],
                "parameters": value["parameters"]
            }
        return serializable_info
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/web_search")
def web_search_component(request: WebSearchRequest):
    """Web search component using Google or DuckDuckGo"""
    try:
        from components import WebSearchAgent
        agent = WebSearchAgent(request.model, request.search_engine)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/email")
def email_component(request: EmailComponentRequest):
    """Email sending component using functional EmailAgent from agent.py"""
    try:
        from agent import EmailAgent
        import os
        
        # Get credentials from .env
        sender_email = os.getenv('sender_email', 'darkbeast645@gmail.com')
        sender_name = os.getenv('sender_name', 'Raviraj')
        sender_passkey = os.getenv('sender_passkey', 'iaes xvos crlr zvlu')
        
        agent = EmailAgent(
            model=request.model,
            receiver_email=request.receiver_email,
            sender_email=sender_email,
            sender_name=sender_name,
            sender_passkey=sender_passkey
        )
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/csv")
def csv_component(request: CSVRequest):
    """CSV processing component"""
    try:
        from components import CSVProcessorAgent
        agent = CSVProcessorAgent(
            model=request.model,
            csv_content=request.csv_content
        )
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/csv_file")
def csv_file_component(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    """CSV file processing component with file upload"""
    try:
        from agent import CSVAgent
        agent = CSVAgent(model=model, file=file)
        return {"response": agent.run_agent(query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/text")
def text_component(request: TextRequest):
    """Basic text processing component"""
    try:
        from components import BasicTextAgent
        agent = BasicTextAgent(
            model=request.model,
            task_description=request.task_description or "general text processing"
        )
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/rag")
def rag_component(request: RAGRequest):
    """RAG (Retrieval Augmented Generation) component"""
    try:
        from components import BasicRAGAgent
        agent = BasicRAGAgent(
            model=request.model,
            knowledge_base=request.knowledge_base
        )
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== NEW SEARCH COMPONENT ENDPOINTS ==========

@app.post("/component/arxiv")
def arxiv_component(request: QueryRequest):
    """ArXiv academic search component"""
    try:
        from components import ArxivSearchAgent
        agent = ArxivSearchAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/hackernews")
def hackernews_component(request: QueryRequest):
    """Hacker News search component"""
    try:
        from components import HackerNewsAgent
        agent = HackerNewsAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/textprocessor")
def textprocessor_component(request: QueryRequest):
    """Text processing component using built-in capabilities"""
    try:
        from components import TextProcessorAgent
        agent = TextProcessorAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/websearch")
def websearch_component(request: QueryRequest):
    """Web search component using DuckDuckGo"""
    try:
        from components import WebSearchAgent
        agent = WebSearchAgent(model=request.model, search_engine="duckduckgo")
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/json")
def json_component(request: QueryRequest):
    """JSON processing component"""
    try:
        from components import JsonProcessorAgent
        agent = JsonProcessorAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== DATA PROCESSING COMPONENT ENDPOINTS ==========

@app.post("/component/pandas")
def pandas_component(request: QueryRequest):
    """Pandas data processing component"""
    try:
        from components import PandasDataAgent
        agent = PandasDataAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/duckdb")
def duckdb_component(request: QueryRequest):
    """DuckDB SQL analysis component"""
    try:
        from components import DuckDbAnalysisAgent
        agent = DuckDbAnalysisAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/calculator")
def calculator_component(request: QueryRequest):
    """Calculator component"""
    try:
        from components import CalculatorAgent
        agent = CalculatorAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== SYSTEM COMPONENT ENDPOINTS ==========

@app.post("/component/python")
def python_component(request: QueryRequest):
    """Python code execution component"""
    try:
        from components import PythonCodeAgent
        agent = PythonCodeAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/file")
def file_component(model: str = Form(...), query: str = Form(...), file: UploadFile = File(...)):
    """File operations component"""
    try:
        from components import FileOperationsAgent
        agent = FileOperationsAgent(model=model)
        # Save the uploaded file temporarily and include file path in query
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = file.file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Include file information in the query
        enhanced_query = f"{query}\n\nFile uploaded: {file.filename}\nFile path: {tmp_file_path}"
        response = agent.run_agent(enhanced_query)
        
        # Clean up temporary file
        try:
            os.unlink(tmp_file_path)
        except:
            pass
            
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}

# ========== WEB SCRAPING COMPONENT ENDPOINTS ==========

@app.post("/component/webscraping")
def webscraping_component(request: QueryRequest):
    """Web scraping component"""
    try:
        from components import WebScrapingAgent
        agent = WebScrapingAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== KNOWLEDGE & RESEARCH COMPONENT ENDPOINTS ==========

@app.post("/component/wikipedia")
def wikipedia_component(request: QueryRequest):
    """Wikipedia research component"""
    try:
        from components import WikipediaAgent
        agent = WikipediaAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

@app.post("/component/youtube")
def youtube_component(request: QueryRequest):
    """YouTube analysis component"""
    try:
        from components import YouTubeAgent
        agent = YouTubeAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== FINANCIAL & ANALYTICS COMPONENT ENDPOINTS ==========

@app.post("/component/financial")
def financial_component(request: QueryRequest):
    """Financial analysis component"""
    try:
        from components import FinancialAnalysisAgent
        agent = FinancialAnalysisAgent(model=request.model)
        return {"response": agent.run_agent(request.query)}
    except Exception as e:
        return {"error": str(e)}

# ========== UTILITY & INFORMATION COMPONENT ENDPOINTS ==========

# ========== DYNAMIC WORKFLOW EXECUTION ==========

class WorkflowNode(BaseModel):
    id: str
    type: str
    data: dict

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str
    targetHandle: str

class DynamicWorkflowRequest(BaseModel):
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]

@app.post("/execute_dynamic_workflow")
def execute_dynamic_workflow(request: DynamicWorkflowRequest):
    """Execute a workflow with dynamic component chaining"""
    try:
        return execute_workflow_chain(request.nodes, request.edges)
    except Exception as e:
        return {"error": str(e)}

def execute_workflow_chain(nodes: list[WorkflowNode], edges: list[WorkflowEdge]):
    """Execute components in a chain based on their connections"""
    
    print(f"Executing workflow with {len(nodes)} nodes and {len(edges)} edges")
    for node in nodes:
        print(f"Node: {node.id} (Type: {node.type})")
    
    print("\nEdges:")
    for edge in edges:
        print(f"Edge: {edge.source} -> {edge.target} ({edge.sourceHandle} -> {edge.targetHandle})")
    
    # Build adjacency map for the workflow
    adjacency = {}
    in_degree = {}
    
    for node in nodes:
        adjacency[node.id] = []
        in_degree[node.id] = 0
    
    for edge in edges:
        # Check if source and target nodes exist
        if edge.source not in adjacency:
            print(f"ERROR: Edge references non-existent source node: {edge.source}")
            return {"error": f"Edge references non-existent source node: {edge.source}"}
        
        if edge.target not in adjacency:
            print(f"ERROR: Edge references non-existent target node: {edge.target}")
            return {"error": f"Edge references non-existent target node: {edge.target}"}
        
        adjacency[edge.source].append(edge.target)
        in_degree[edge.target] += 1
    
    # Find start nodes (nodes with no incoming edges, excluding End nodes)
    start_nodes = [node_id for node_id, degree in in_degree.items() 
                   if degree == 0 and not any(n.type == "End" for n in nodes if n.id == node_id)]
    
    if not start_nodes:
        return {"error": "No start nodes found in the workflow"}
    
    # Execute workflow using proper dependency-aware topological sort
    execution_results = {}
    queue = start_nodes.copy()
    max_iterations = len(nodes) * 10  # Safety limit to prevent infinite loops
    iteration_count = 0
    
    while queue and iteration_count < max_iterations:
        current_node_id = queue.pop(0)
        current_node = next((n for n in nodes if n.id == current_node_id), None)
        
        if not current_node:
            continue
            
        # Skip End nodes - they just collect final results
        if current_node.type == "End":
            # Find the input data for the End node
            for edge in edges:
                if edge.target == current_node_id:
                    source_result = execution_results.get(edge.source)
                    if source_result:
                        return {"response": source_result.get("response", "Workflow completed")}
            continue
        
        # Check if all dependencies are satisfied
        dependencies_ready = True
        for edge in edges:
            if edge.target == current_node_id:
                if edge.source not in execution_results:
                    dependencies_ready = False
                    print(f"Node {current_node_id} waiting for dependency {edge.source}")
                    break
        
        if not dependencies_ready:
            # Put the node back at the end of the queue to check later
            queue.append(current_node_id)
            iteration_count += 1
            continue
        
        try:
            print(f"Processing node {current_node_id} (Type: {current_node.type})")
            print(f"Node data: {current_node.data}")
            
            # Prepare input for current node
            node_input = prepare_node_input(current_node, edges, execution_results, nodes)
            print(f"Prepared input: {node_input}")
            
            # Execute the current component
            result = execute_single_component(current_node, node_input, nodes)
            execution_results[current_node_id] = result
            
            print(f"Successfully executed {current_node.type} (ID: {current_node_id})")
            print(f"Result: {result}")
            
        except Exception as e:
            error_msg = f"Error executing node {current_node_id} ({current_node.type}): {str(e)}"
            print(f"ERROR: {error_msg}")
            import traceback
            traceback.print_exc()
            return {"error": error_msg}
        
        # Add dependent nodes to queue if they're not already there
        for next_node_id in adjacency[current_node_id]:
            if next_node_id not in queue and next_node_id not in execution_results:
                queue.append(next_node_id)
        
        iteration_count += 1
    
    # Check for timeout
    if iteration_count >= max_iterations:
        return {"error": "Workflow execution timeout - possible circular dependency"}
    
    # If no End node was found, return the last result
    if execution_results:
        last_result = list(execution_results.values())[-1]
        return {"response": last_result.get("response", "Workflow completed")}
    
    return {"error": "No components were executed"}

def prepare_node_input(node: WorkflowNode, edges: list[WorkflowEdge], results: dict, all_nodes: list[WorkflowNode]):
    """Prepare input for a node based on connected outputs"""
    
    # Collect different types of connected inputs
    query_inputs = []  # Direct query/text inputs
    tool_contexts = []  # Tool outputs connected to Tools input
    general_context = []  # Other connections
    node_query = ""
    
    if node.data and "inputs" in node.data:
        inputs = node.data["inputs"]
        
        # Get the node's own input values first
        for input_field in inputs:
            field_name = input_field.get("name", "")
            field_value = input_field.get("value")
            
            if field_name and field_value:
                field_name_lower = field_name.lower()
                if field_name_lower in ["query", "text", "input"]:
                    node_query = field_value
        
        # Look for connected inputs and categorize them
        for edge in edges:
            if edge.target == node.id:
                source_result = results.get(edge.source)
                if source_result:
                    source_node = next((n for n in all_nodes if n.id == edge.source), None)
                    source_type = source_node.type if source_node else "Previous Component"
                    source_output = source_result.get("response", "")
                    
                    # Categorize based on target handle and source type
                    target_handle = edge.targetHandle.lower()
                    
                    if "query" in target_handle or "input" in target_handle or "text" in target_handle:
                        # Direct input connection - this becomes the main query
                        query_inputs.append({
                            "source": source_type,
                            "content": source_output
                        })
                        
                    elif "tools" in target_handle:
                        # Tool connection - this provides context/background info
                        tool_contexts.append({
                            "source": source_type,
                            "content": source_output
                        })
                        
                    else:
                        # General connection - treat as additional context
                        general_context.append({
                            "source": source_type,
                            "content": source_output
                        })
    
    # Priority for query: connected inputs > node's own query
    final_query = node_query
    if query_inputs:
        final_query = query_inputs[0]["content"]  # Use the first connected query input
    
    return {
        "query": final_query,
        "query_inputs": query_inputs,
        "tool_contexts": tool_contexts,
        "general_context": general_context
    }

def execute_single_component(node: WorkflowNode, node_input: dict, all_nodes: list[WorkflowNode]):
    """Execute a single component based on its type"""
    
    try:
        node_type = node.type
        model = "gemini"  # default model
        
        # Extract the input query
        input_text = node_input.get("query", "")
        
        # Extract model from node data if available
        if node.data and "inputs" in node.data:
            for input_field in node.data["inputs"]:
                field_name = input_field.get("name", "")
                field_value = input_field.get("value")
                if field_name and "llm" in field_name.lower() and field_value:
                    model = field_value
                    break
        
        # Map node types to component execution
        if node_type == "Text-Input-Tool":
            # Text-Input-Tool just passes through its input value
            response = input_text or ""
            
        elif node_type == "File-Input-Tool":
            # File-Input-Tool should provide file content (this needs special handling in frontend)
            response = input_text or "File content would be provided here"
            
        elif node_type == "Wikipedia":
            from components import WikipediaAgent
            agent = WikipediaAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "Text-Agent":
            from components import BasicTextAgent
            # Get instructions from node data if available
            instructions = "You are a helpful AI assistant."
            if node.data and "inputs" in node.data:
                for input_field in node.data["inputs"]:
                    field_name = input_field.get("name", "")
                    field_value = input_field.get("value")
                    if field_name and "instructions" in field_name.lower() and field_value:
                        instructions = field_value
                        break
            
            # Build enhanced query with different types of context
            enhanced_query = input_text
            context_parts = []
            
            # Add tool contexts (from Tools connections)
            tool_contexts = node_input.get("tool_contexts", [])
            if tool_contexts:
                context_parts.append("=== AVAILABLE TOOLS & DATA ===")
                for tool_ctx in tool_contexts:
                    context_parts.append(f"\n{tool_ctx['source']} Results:")
                    context_parts.append(tool_ctx['content'])
                context_parts.append("\n=== END TOOLS DATA ===\n")
            
            # Add general context (from other connections)
            general_context = node_input.get("general_context", [])
            if general_context:
                context_parts.append("=== ADDITIONAL CONTEXT ===")
                for ctx in general_context:
                    context_parts.append(f"\n{ctx['source']} Output:")
                    context_parts.append(ctx['content'])
                context_parts.append("\n=== END CONTEXT ===\n")
            
            # Build the final enhanced query
            if context_parts:
                context_text = "\n".join(context_parts)
                if input_text:
                    enhanced_query = f"{context_text}\nUser Request: {input_text}\n\nPlease use the above information to provide a comprehensive response to the user's request."
                else:
                    enhanced_query = f"{context_text}\nPlease analyze and summarize the above information in a helpful way."
            
            agent = BasicTextAgent(model=model, task_description=instructions)
            response = agent.run_agent(enhanced_query)
            
        elif node_type == "YouTube":
            from components import YouTubeAgent
            agent = YouTubeAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "ArXiv-Search":
            from components import ArxivSearchAgent
            agent = ArxivSearchAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "HackerNews-Search":
            from components import HackerNewsAgent
            agent = HackerNewsAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "Web-Scraping":
            from components import WebScrapingAgent
            # Add context for web scraping if available
            enhanced_query = input_text
            tool_contexts = node_input.get("tool_contexts", [])
            general_context = node_input.get("general_context", [])
            
            if tool_contexts or general_context:
                context_parts = []
                if tool_contexts:
                    for ctx in tool_contexts:
                        context_parts.append(f"Reference from {ctx['source']}: {ctx['content']}")
                if general_context:
                    for ctx in general_context:
                        context_parts.append(f"Context from {ctx['source']}: {ctx['content']}")
                
                if context_parts:
                    enhanced_query = f"Context: {' | '.join(context_parts)}\n\nQuery: {input_text}"
            
            agent = WebScrapingAgent(model=model)
            response = agent.run_agent(enhanced_query)
            
        elif node_type == "Calculator":
            from components import CalculatorAgent
            agent = CalculatorAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "Python-Code":
            from components import PythonCodeAgent
            agent = PythonCodeAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "Pandas-Data":
            from components import PandasDataAgent
            agent = PandasDataAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "DuckDB-SQL":
            from components import DuckDbAnalysisAgent
            agent = DuckDbAnalysisAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "Financial-Analysis":
            from components import FinancialAnalysisAgent
            agent = FinancialAnalysisAgent(model=model)
            response = agent.run_agent(input_text)
            
        elif node_type == "CSV-Agent":
            # CSV Agent needs special handling for file input
            csv_content = input_text  # This should be CSV content from connected file input
            from components import CSVProcessorAgent
            agent = CSVProcessorAgent(model=model, csv_content=csv_content)
            response = agent.run_agent(input_text)
            
        else:
            response = f"Component type '{node_type}' not supported yet"
        
        return {"response": response}
        
    except Exception as e:
        return {"error": f"Error executing {node.type}: {str(e)}"}

# All working component endpoints are defined above

@app.post("/workflow_agent")
def workflow_agent(
    session_id: str = Form(...),
    sender_email: str = Form(...),
    sender_name: str = Form(...),
    sender_passkey: str = Form(...),
    company_name: str = Form('Powerlook'),
    product_description: str = Form(...),
    use_cached_results: bool = Form(True),
    max_retries: int = Form(3),
    retry_delay: int = Form(5),
    file: UploadFile = File(...)
):
    
    print("session_id:", session_id)
    print("sender_email:", sender_email)
    print("sender_name:", sender_name)
    print("sender_passkey:", sender_passkey)
    print("company_name:", company_name)
    print("product_description:", product_description)
    print("use_cached_results:", use_cached_results)
    print("max_retries:", max_retries)
    print("retry_delay:", retry_delay)
    print("file:", file.filename)

    try:
        workflow = MarketingEmailWorkflow(
            session_id=session_id,
            file=file,
            sender_email=sender_email,
            sender_name=sender_name,
            sender_passkey=sender_passkey
        )
        responses = workflow.run(
            company_name=company_name,
            product_description=product_description,
            use_cached_results=use_cached_results,
            max_retries=max_retries,
            retry_delay=retry_delay
        )

        # Collect all responses from the generator
        final_result = None
        for response in responses:
            print(response)  # This triggers the generator and prints response details
            final_result = response.content if hasattr(response, 'content') else str(response)

        # Return the actual result from the workflow
        return {
            "success": True,
            "message": final_result or "Email marketing workflow completed successfully",
            "response": final_result or "Successfully processed email marketing campaign"
        }
    
    except Exception as e:
        print(f"Error in workflow_agent: {str(e)}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "response": f"Failed to execute email marketing workflow: {str(e)}"
        }

# Runtime Tools Service Endpoints
@app.get("/tools", response_model=List[ToolSpec])
def list_tools():
    """List all registered tools."""
    db = _load_db()
    tools = []
    fixed_tools = []
    
    for tool_data in db.get("tools", []):
        try:
            # Create a copy to avoid modifying the original
            tool_copy = tool_data.copy()
            
            # Try to create ToolSpec, if invalid name, sanitize it
            if 'name' in tool_copy:
                original_name = tool_copy['name']
                sanitized_name = _sanitize_tool_name(original_name)
                if original_name != sanitized_name:
                    tool_copy['name'] = sanitized_name
                    print(f"Sanitized tool name: '{original_name}' -> '{sanitized_name}'")
            
            # Validate and create ToolSpec
            tool_spec = ToolSpec(**tool_copy)
            tools.append(tool_spec)
            fixed_tools.append(tool_copy)
            
        except Exception as e:
            print(f"Skipping invalid tool: {tool_data.get('name', 'unknown')}, error: {e}")
    
    # Update database with fixed tools if any changes were made
    if len(fixed_tools) != len(db.get("tools", [])) or any(
        fixed != original for fixed, original in zip(fixed_tools, db.get("tools", []))
    ):
        print(f"Updating database with {len(fixed_tools)} valid tools")
        db["tools"] = fixed_tools
        _save_db(db)
    
    return tools

@app.post("/tools", response_model=ToolSpec)
def register_tool(tool: ToolSpec):
    """Register a new tool (upsert)."""
    db = _load_db()
    tools = db.get("tools", [])
    
    # Remove existing tool with same name
    tools = [t for t in tools if t.get("name") != tool.name]
    
    # Add new tool
    tools.append(tool.model_dump())
    db["tools"] = tools
    _save_db(db)
    
    return tool

@app.delete("/tools/{name}")
def delete_tool(name: str):
    """Delete a tool by name."""
    db = _load_db()
    tools = db.get("tools", [])
    
    # Find the tool to get its file path
    tool_to_delete = next((t for t in tools if t.get("name") == name), None)
    if not tool_to_delete:
        raise HTTPException(status_code=404, detail=f"Tool '{name}' not found")
    
    # Remove from database
    tools = [t for t in tools if t.get("name") != name]
    db["tools"] = tools
    _save_db(db)
    
    # Also delete the Python file if it exists
    try:
        if tool_to_delete.get("type") == "python" and "config" in tool_to_delete:
            file_path = tool_to_delete["config"].get("file_path")
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                print(f"Deleted tool file: {file_path}")
    except Exception as e:
        print(f"Warning: Could not delete tool file: {e}")
    
    return {"message": f"Tool '{name}' deleted"}

@app.get("/tools/{name}/analyze")
def analyze_tool_parameters(name: str):
    """Analyze a tool's parameters by inspecting its function signature."""
    db = _load_db()
    tools = db.get("tools", [])
    
    tool_data = next((t for t in tools if t.get("name") == name), None)
    if not tool_data:
        raise HTTPException(status_code=404, detail=f"Tool '{name}' not found")
    
    try:
        tool = ToolSpec(**tool_data)
        
        if tool.type == "python":
            config = tool.config
            tool_func = _load_python_tool(config.file_path, config.entry_point)
            
            if tool_func is None:
                return {"parameters": []}
            
            # Get function signature
            sig = inspect.signature(tool_func)
            parameters = []
            
            for param_name, param in sig.parameters.items():
                # Skip **kwargs style parameters
                if param.kind == param.VAR_KEYWORD:
                    # Try to extract from docstring
                    docstring = tool_func.__doc__ or ""
                    import re
                    # Look for parameter documentation in docstring
                    # Match patterns like "string (str): The input string" or "num1 (int): First number"
                    matches = re.findall(r'(\w+)\s*\([^)]+\):', docstring)
                    if matches:
                        parameters.extend(matches)
                    else:
                        # Fallback: look for common parameter names in the function body
                        try:
                            import ast
                            with open(config.file_path, 'r') as f:
                                source = f.read()
                            tree = ast.parse(source)
                            for node in ast.walk(tree):
                                if isinstance(node, ast.Call) and hasattr(node.func, 'attr'):
                                    if node.func.attr == 'get' and len(node.args) > 0:
                                        if isinstance(node.args[0], ast.Constant):
                                            param_name = node.args[0].value
                                            if isinstance(param_name, str) and param_name not in parameters:
                                                parameters.append(param_name)
                        except:
                            pass
                    break
                elif param_name not in ['args', 'kwargs']:
                    parameters.append(param_name)
            
            return {"parameters": parameters}
        else:
            return {"parameters": []}
            
    except Exception as e:
        print(f"Error analyzing tool {name}: {e}")
        return {"parameters": []}

@app.post("/tools/{name}/execute", response_model=ExecuteResponse)
def execute_tool(name: str, request: ExecuteRequest):
    """Execute a tool by name with given arguments."""
    db = _load_db()
    tools = db.get("tools", [])
    
    tool_data = next((t for t in tools if t.get("name") == name), None)
    if not tool_data:
        raise HTTPException(status_code=404, detail=f"Tool '{name}' not found")
    
    try:
        tool = ToolSpec(**tool_data)
        result = None
        
        if tool.type == "webhook":
            config = tool.config
            response = requests.request(
                method=config.method,
                url=str(config.url),
                headers=config.headers or {},
                json=request.args,
                timeout=30
            )
            response.raise_for_status()
            result = response.json() if response.text else {"status": "success"}
            
        elif tool.type == "prompt_template":
            config = tool.config
            try:
                result = config.template.format(**request.args)
            except KeyError as e:
                raise ValueError(f"Missing template variable: {e}")
                
        elif tool.type == "python":
            config = tool.config
            tool_func = _load_python_tool(config.file_path, config.entry_point)
            adapter = _make_adapter(tool_func)
            result = adapter(request.args)
            
        return ExecuteResponse(success=True, result=result)
        
    except Exception as e:
        return ExecuteResponse(success=False, error=str(e))

@app.post("/tools/auto-execute", response_model=AutoExecResponse)
def auto_execute_tool(request: AutoExecRequest):
    """Register/update a tool and execute it in one call."""
    try:
        # Register/update the tool
        register_tool(request.tool)
        
        # Execute the tool
        exec_request = ExecuteRequest(args=request.args)
        exec_response = execute_tool(request.tool.name, exec_request)
        
        return AutoExecResponse(
            success=exec_response.success,
            result=exec_response.result,
            error=exec_response.error,
            upserted=True
        )
        
    except Exception as e:
        return AutoExecResponse(success=False, error=str(e), upserted=False)

@app.post("/tools/generate", response_model=GenerateToolResponse)
def generate_tool_gemini(request: GenerateToolRequest):
    """Generate a Python tool file using Gemini."""
    if genai is None:
        raise HTTPException(status_code=503, detail="Gemini not available (google-generativeai not installed)")
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GOOGLE_API_KEY not configured")
    
    try:
        genai.configure(api_key=api_key)
        # Try different model names in order of preference
        model_names = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
        model = None
        last_error = None
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                break
            except Exception as e:
                last_error = e
                continue
        
        if model is None:
            raise Exception(f"Could not initialize any Gemini model. Last error: {last_error}")
        
        args_schema_str = json.dumps(request.args_schema, indent=2) if request.args_schema else "{}"
        
        prompt = f"""
Generate a Python tool function with this specification:

Name: {request.name}
Description: {request.description}
Arguments schema: {args_schema_str}

Requirements:
1. Create a function named 'run' that takes keyword arguments
2. The function should implement the described functionality
3. Return appropriate results
4. Include proper error handling
5. Add docstring with parameter descriptions
6. Import any necessary libraries at the top

Example structure:
```python
def run(**kwargs):
    \"\"\"
    {request.description}
    
    Args:
        **kwargs: Arguments as defined in schema
    
    Returns:
        Result of the operation
    \"\"\"
    # Implementation here
    pass
```

Generate only the Python code, no explanations.
"""
        
        response = model.generate_content(prompt)
        code = _extract_code_fenced_or_raw(response.text)
        
        # Sanitize the name for file and tool registration
        sanitized_name = _sanitize_tool_name(request.name)
        
        # Save to file
        file_path = os.path.join(TOOLS_DIR, f"{sanitized_name}.py")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)
        
        # Register the tool in the database
        try:
            tool_spec = ToolSpec(
                name=sanitized_name,
                type="python",
                description=request.description or f"Generated tool: {request.name}",
                config=PythonConfig(
                    file_path=file_path,
                    entry_point="run"
                )
            )
            register_tool(tool_spec)
        except Exception as reg_error:
            print(f"Warning: Failed to register tool in database: {reg_error}")
        
        return GenerateToolResponse(success=True, file_path=file_path)
        
    except Exception as e:
        error_msg = str(e)
        if "not found for API version" in error_msg or "not supported" in error_msg:
            error_msg = f"Gemini API model error: {error_msg}. Please check your API key and model availability."
        elif "GOOGLE_API_KEY" in error_msg:
            error_msg = "Google API key not configured. Please set the GOOGLE_API_KEY environment variable."
        return GenerateToolResponse(success=False, error=error_msg)

@app.get("/tools/debug")
def debug_tools():
    """Debug endpoint to check API keys and model availability."""
    debug_info = {
        "google_api_key_set": bool(os.getenv("GOOGLE_API_KEY")),
        "groq_api_key_set": bool(os.getenv("GROQ_API_KEY")),
        "tools_directory": TOOLS_DIR,
        "tools_directory_exists": os.path.exists(TOOLS_DIR),
        "google_genai_available": 'genai' in globals(),
        "groq_available": Groq is not None,
    }
    
    # Test Gemini model availability if API key is set
    if debug_info["google_api_key_set"] and 'genai' in globals():
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            
            # Try to list models
            available_models = []
            try:
                for m in genai.list_models():
                    if 'generateContent' in m.supported_generation_methods:
                        available_models.append(m.name)
                debug_info["available_gemini_models"] = available_models[:5]  # First 5 models
            except Exception as e:
                debug_info["gemini_models_error"] = str(e)
                
        except Exception as e:
            debug_info["gemini_config_error"] = str(e)
    
    return debug_info

@app.post("/tools/generate-groq", response_model=GenerateToolResponse)
def generate_tool_groq(request: GenerateToolRequest):
    """Generate a Python tool file using Groq."""
    if Groq is None:
        raise HTTPException(status_code=503, detail="Groq not available")
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    try:
        client = Groq(api_key=api_key)
        
        args_schema_str = json.dumps(request.args_schema, indent=2) if request.args_schema else "{}"
        
        prompt = f"""
Generate a Python tool function with this specification:

Name: {request.name}
Description: {request.description}
Arguments schema: {args_schema_str}

Requirements:
1. Create a function named 'run' that takes keyword arguments
2. The function should implement the described functionality
3. Return appropriate results
4. Include proper error handling
5. Add docstring with parameter descriptions
6. Import any necessary libraries at the top

Generate only the Python code, no explanations.
"""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1
        )
        
        code = _extract_code_fenced_or_raw(response.choices[0].message.content)
        
        # Sanitize the name for file and tool registration
        sanitized_name = _sanitize_tool_name(request.name)
        
        # Save to file
        file_path = os.path.join(TOOLS_DIR, f"{sanitized_name}.py")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)
        
        # Register the tool in the database
        try:
            tool_spec = ToolSpec(
                name=sanitized_name,
                type="python",
                description=request.description or f"Generated tool: {request.name}",
                config=PythonConfig(
                    file_path=file_path,
                    entry_point="run"
                )
            )
            register_tool(tool_spec)
        except Exception as reg_error:
            print(f"Warning: Failed to register tool in database: {reg_error}")
        
        return GenerateToolResponse(success=True, file_path=file_path)
        
    except Exception as e:
        return GenerateToolResponse(success=False, error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)