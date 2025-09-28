"""
Agno v2 Component Library - Essential Working Components Only
"""

from agno.agent import Agent
from agno.models.groq import Groq
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.csv_toolkit import CsvTools
from agno.tools.email import EmailTools
from agno.tools.arxiv import ArxivTools
# from agno.tools.hacker_news import HackerNewsTools  # Not available
# from agno.tools.json import JsonTools  # Not available
# from agno.tools.string import StringTools  # Not available
# Data processing tools
from agno.tools.pandas import PandasTools
from agno.tools.duckdb import DuckDbTools
from agno.tools.calculator import CalculatorTools
# Local/System tools  
from agno.tools.python import PythonTools
from agno.tools.file import FileTools
# Web scraping tools (require additional packages)
# from agno.tools.newspaper import NewspaperTools  # Requires newspaper3k lxml_html_clean
from agno.tools.website import WebsiteTools
# Additional search and knowledge tools
from agno.tools.wikipedia import WikipediaTools
from agno.tools.youtube import YouTubeTools
# Financial and analytics tools
from agno.tools.yfinance import YFinanceTools
# Utility tools
# Additional system tools
# from agno.tools.json import JsonTools  # Not available
# from agno.tools.string import StringTools  # Not available
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.lancedb import LanceDb, SearchType
from typing import Optional, Dict, List, Any
import os
from dotenv import load_dotenv

load_dotenv()

def get_model(model_name: str):
    """Get model instance based on name"""
    if "gemini" in model_name.lower():
        return Gemini(id="gemini-2.0-flash-exp")
    elif "groq" in model_name.lower():
        return Groq(id="openai/gpt-oss-120b")
    else:
        return Gemini(id="gemini-2.0-flash-exp")  # default to Gemini

# ========== SEARCH COMPONENTS ==========


class ArxivSearchAgent:
    """Component for searching arXiv academic papers"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[ArxivTools()],
            instructions="You are an academic search agent specializing in arXiv papers. Help users find relevant research papers, summarize abstracts, and provide academic insights.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class HackerNewsAgent:
    """Component for tech news analysis using web search"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[DuckDuckGoTools()],
            instructions="You are a tech news agent. Search for Hacker News content and tech trends using web search, then analyze and provide insights on tech topics.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class TextProcessorAgent:
    """Component for text processing using built-in capabilities"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[],  # Use built-in model capabilities only
            instructions="You are a text processing agent. Analyze, transform, and manipulate text content using advanced language processing capabilities.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class WebSearchAgent:
    """Component for reliable web search using DuckDuckGo"""
    def __init__(self, model: str, search_engine: str = "duckduckgo"):
        self.model = get_model(model)
        
        # Choose search engine tools based on preference
        if search_engine.lower() == "google":
            tools = [GoogleSearchTools()]
        else:
            tools = [DuckDuckGoTools()]
        
        self.agent = Agent(
            model=self.model,
            tools=tools,
            instructions=f"You are a web search agent using {search_engine}. Search for relevant information and provide comprehensive results.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class JsonProcessorAgent:
    """Component for JSON data processing and manipulation"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[PythonTools()],  # Use Python for JSON processing
            instructions="You are a JSON processing agent. Parse, validate, transform, and analyze JSON data using Python capabilities.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== SOCIAL/COMMUNICATION COMPONENTS ==========

# Import the working EmailAgent from agent.py
from agent import EmailAgent as WorkingEmailAgent

class EmailAgent:
    """Component for email operations using the functional EmailAgent from agent.py"""
    def __init__(self, model: str, receiver_email: str = None):
        # Get email credentials from environment variables
        sender_email = os.getenv('sender_email', 'darkbeast645@gmail.com')
        sender_name = os.getenv('sender_name', 'Raviraj')
        sender_passkey = os.getenv('sender_passkey', 'iaes xvos crlr zvlu')
        
        # Use a default receiver email if not provided
        if not receiver_email:
            receiver_email = os.getenv('receiver_email', 'test@example.com')
        
        # Use the working EmailAgent from agent.py
        self.email_agent = WorkingEmailAgent(
            model=model,
            receiver_email=receiver_email,
            sender_email=sender_email,
            sender_name=sender_name,
            sender_passkey=sender_passkey
        )
    
    def run_agent(self, query: str) -> str:
        return self.email_agent.run_agent(query)


class CSVProcessorAgent:
    """Component for CSV data processing"""
    def __init__(self, model: str, csv_content: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[CsvTools(csvs=[csv_content])],
            instructions="You are a CSV data processing agent. Analyze, query, and manipulate CSV data efficiently.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class BasicTextAgent:
    """Basic text processing agent without external tools"""
    def __init__(self, model: str, task_description: str = "general text processing"):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[],  # No external tools - just model capabilities
            instructions=f"You are a text processing agent for {task_description}. Use your language model capabilities to analyze, transform, and generate text content.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class BasicRAGAgent:
    """Simple RAG agent with knowledge base"""
    def __init__(self, model: str, knowledge_base: str):
        self.model = get_model(model)
        
        # Create knowledge with default vector db (LanceDb)
        self.knowledge = Knowledge()
        
        # Add text content to knowledge
        import asyncio
        try:
            # Try to add content synchronously for simplicity
            asyncio.run(self.knowledge.add_content_async(text_content=knowledge_base))
        except:
            # Fallback: just create empty knowledge for now
            pass
        
        self.agent = Agent(
            model=self.model,
            knowledge=self.knowledge,
            instructions="You are a RAG agent. Use your knowledge base to answer questions accurately and provide relevant information.",
            search_knowledge=True,  # Enable agentic RAG
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== DATA PROCESSING COMPONENTS ==========

class PandasDataAgent:
    """Component for advanced data processing using Pandas"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[PandasTools()],
            instructions="You are a data analysis agent specializing in Pandas operations. Help users analyze, manipulate, and visualize data using advanced pandas functions.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class DuckDbAnalysisAgent:
    """Component for SQL analysis using DuckDB"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[DuckDbTools()],
            instructions="You are a SQL analysis agent using DuckDB. Help users perform complex SQL queries, data analysis, and database operations.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class CalculatorAgent:
    """Component for mathematical calculations"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[CalculatorTools()],
            instructions="You are a mathematical calculation agent. Help users perform complex calculations, solve equations, and analyze numerical data.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== SYSTEM/LOCAL COMPONENTS ==========

class PythonCodeAgent:
    """Component for writing and executing Python code"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[PythonTools()],
            instructions="You are a Python programming agent. Help users write, execute, and debug Python code. Create scripts, analyze data, and solve programming problems.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class FileOperationsAgent:
    """Component for file operations"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[FileTools()],
            instructions="You are a file operations agent. Help users read, write, create, and manage files. Handle text files, analyze content, and perform file system operations.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== WEB SCRAPING COMPONENTS ==========

class WebScrapingAgent:
    """Component for web scraping and content extraction"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[WebsiteTools()],
            instructions="You are a web scraping agent. Help users extract content from websites, analyze web pages, and gather information from online sources.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== KNOWLEDGE & RESEARCH COMPONENTS ==========

class WikipediaAgent:
    """Component for Wikipedia research and information retrieval"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[WikipediaTools()],
            instructions="You are a Wikipedia research agent. Help users find comprehensive, accurate information from Wikipedia articles. Provide well-structured summaries and detailed explanations.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


class YouTubeAgent:
    """Component for YouTube video analysis and transcript processing"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[YouTubeTools()],
            instructions="You are a YouTube analysis agent. Help users analyze YouTube videos, extract transcripts, summarize content, and provide insights from video content.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== FINANCIAL & ANALYTICS COMPONENTS ==========

class FinancialAnalysisAgent:
    """Component for financial data analysis using YFinance"""
    def __init__(self, model: str):
        self.model = get_model(model)
        self.agent = Agent(
            model=self.model,
            tools=[YFinanceTools()],
            instructions="You are a financial analysis agent. Help users analyze stocks, market data, financial trends, and provide investment insights using Yahoo Finance data.",
            markdown=True
        )
    
    def run_agent(self, query: str) -> str:
        response = self.agent.run(query, stream=False)
        return response.content


# ========== UTILITY & INFORMATION COMPONENTS ==========


# ========== COMPONENT REGISTRY ==========

AVAILABLE_COMPONENTS = {
    # ========== SEARCH COMPONENTS ==========
    "websearch": {
        "class": WebSearchAgent,
        "name": "Web Search Agent",
        "description": "Search the web using Google or DuckDuckGo",
        "category": "search",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "search_engine": {"type": "string", "default": "google", "options": ["google", "duckduckgo"]}
        }
    },
    "arxiv": {
        "class": ArxivSearchAgent,
        "name": "ArXiv Research Agent",
        "description": "Search academic papers on arXiv",
        "category": "search",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "hackernews": {
        "class": HackerNewsAgent,
        "name": "Hacker News Agent",
        "description": "Search and analyze Hacker News content",
        "category": "search",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "textprocessor": {
        "class": TextProcessorAgent,
        "name": "Text Processor Agent",
        "description": "Process and analyze text using built-in capabilities",
        "category": "utility",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "websearch": {
        "class": WebSearchAgent,
        "name": "Web Search Agent",
        "description": "Reliable web search using DuckDuckGo",
        "category": "search",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "search_engine": {"type": "string", "default": "duckduckgo"}
        }
    },
    "json": {
        "class": JsonProcessorAgent,
        "name": "JSON Processor Agent",
        "description": "Process and manipulate JSON data",
        "category": "data",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== COMMUNICATION COMPONENTS ==========
    "email": {
        "class": EmailAgent,
        "name": "Email Agent", 
        "description": "Send and manage emails using functional EmailAgent from agent.py",
        "category": "communication",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "receiver_email": {"type": "string", "default": "test@example.com"}
        }
    },
    
    # ========== DATA PROCESSING COMPONENTS ==========
    "csv": {
        "class": CSVProcessorAgent,
        "name": "CSV Processor",
        "description": "Process and analyze CSV data", 
        "category": "data",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "csv_content": {"type": "string", "required": True}
        }
    },
    "pandas": {
        "class": PandasDataAgent,
        "name": "Pandas Data Analyst",
        "description": "Advanced data processing using Pandas",
        "category": "data",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "duckdb": {
        "class": DuckDbAnalysisAgent,
        "name": "DuckDB SQL Analyst",
        "description": "SQL analysis using DuckDB",
        "category": "data",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "calculator": {
        "class": CalculatorAgent,
        "name": "Calculator",
        "description": "Mathematical calculations and computations",
        "category": "data",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== SYSTEM/LOCAL COMPONENTS ==========
    "python": {
        "class": PythonCodeAgent,
        "name": "Python Code Agent",
        "description": "Write and execute Python code",
        "category": "system",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },

    "file": {
        "class": FileOperationsAgent,
        "name": "File Operations Agent",
        "description": "File system operations and management",
        "category": "system",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== WEB SCRAPING COMPONENTS ==========
    "webscraping": {
        "class": WebScrapingAgent,
        "name": "Web Scraping Agent",
        "description": "Extract content from websites",
        "category": "web",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== KNOWLEDGE & RESEARCH COMPONENTS ==========
    "wikipedia": {
        "class": WikipediaAgent,
        "name": "Wikipedia Research Agent",
        "description": "Research information from Wikipedia",
        "category": "research",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    "youtube": {
        "class": YouTubeAgent,
        "name": "YouTube Analysis Agent",
        "description": "Analyze YouTube videos and transcripts",
        "category": "research",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== FINANCIAL & ANALYTICS COMPONENTS ==========
    "financial": {
        "class": FinancialAnalysisAgent,
        "name": "Financial Analysis Agent",
        "description": "Analyze financial data and market trends",
        "category": "finance",
        "parameters": {
            "model": {"type": "string", "default": "gemini"}
        }
    },
    
    # ========== UTILITY & INFORMATION COMPONENTS ==========

    
    # ========== GENERAL COMPONENTS ==========
    "text": {
        "class": BasicTextAgent,
        "name": "Text Processor",
        "description": "Basic text processing and analysis",
        "category": "general",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "task_description": {"type": "string", "default": "general text processing"}
        }
    },
    "rag": {
        "class": BasicRAGAgent,
        "name": "RAG Agent",
        "description": "Knowledge-based question answering",
        "category": "general",
        "parameters": {
            "model": {"type": "string", "default": "gemini"},
            "knowledge_base": {"type": "string", "required": True}
        }
    }
}


def get_component_info():
    """Get information about all available components"""
    return AVAILABLE_COMPONENTS


def create_component(component_type: str, **kwargs):
    """Factory function to create components"""
    if component_type not in AVAILABLE_COMPONENTS:
        raise ValueError(f"Unknown component type: {component_type}")
    
    component_class = AVAILABLE_COMPONENTS[component_type]["class"]
    return component_class(**kwargs)