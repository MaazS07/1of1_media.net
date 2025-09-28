from agno.agent import Agent
from agno.models.groq import Groq
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.csv_toolkit import CsvTools
import os
from agno.tools.zoom import ZoomTools
from dotenv import load_dotenv
from agno.tools.googlesearch import GoogleSearchTools
from agno.tools.email import EmailTools
from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.knowledge import Knowledge
from typing import Optional
from fastapi import UploadFile
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel

load_dotenv()

os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")

gemini_model=Gemini(id="gemini-2.0-flash-exp")  # More stable model
groq_model=Groq(id="llama-3.3-70b-versatile")  # More stable model

class CustomEmailTools:
    """Custom email tools that work around the agno framework schema issues."""
    
    def __init__(self, receiver_email: str, sender_email: str, sender_name: str, sender_passkey: str):
        self.receiver_email = receiver_email
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.sender_passkey = sender_passkey
    
    def send_email(self, subject: str, body: str) -> str:
        """Send an email with the given subject and body."""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = f"{self.sender_name} <{self.sender_email}>"
            msg['To'] = self.receiver_email
            msg['Subject'] = subject
            
            # Add body to email
            msg.attach(MIMEText(body, 'plain'))
            
            # Try SMTP with SSL on port 465 first, then fallback to TLS on 587
            try:
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            except Exception:
                server = smtplib.SMTP('smtp.gmail.com', 587)
                server.starttls()  # Enable security
            
            # Login with credentials
            server.login(self.sender_email, self.sender_passkey)
            
            # Send email
            text = msg.as_string()
            result = server.sendmail(self.sender_email, self.receiver_email, text)
            server.quit()
            
            return f"Email successfully sent to {self.receiver_email}"
            
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"SMTP Authentication failed: {str(e)}. Please check your email credentials."
            return error_msg
        except smtplib.SMTPException as e:
            error_msg = f"SMTP error occurred: {str(e)}"
            return error_msg
        except Exception as e:
            error_msg = f"Failed to send email: {str(e)}"
            return error_msg
    
    def get_tools(self):
        """Return the tool functions for the agent."""
        return [self.send_email]

class TextAgent:
    def __init__(self, model,instructions):
        if "gemini" in model.lower():
            self.model=gemini_model
        elif "groq" in model.lower():
            self.model=groq_model
       
        self.instructions=instructions
       
        self.agent=Agent(
        model=self.model,
        instructions=self.instructions,
        markdown=True
        )
    def run_agent(self,query):
        response=self.agent.run(query,stream=False)
        return response.content
    
class CSVAgent:
    def __init__ (self, model, file: UploadFile):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
        
        # Read the content immediately to avoid issues with file handle closing
        csv_content = file.file.read().decode("utf-8")
        file.file.seek(0)  # Reset file pointer
        file_name = file.filename
        
        print(f"CSV content length: {len(csv_content)}")
        print(f"CSV content preview: {csv_content[:100]}...")
        
        self.agent = Agent(
            model=self.model,
            tools=[CsvTools(csvs=[csv_content])],  # Pass csv_content directly to CsvTools
            markdown=True,
            
            instructions=[
                f"The name of the csv is {file_name}, but I'm providing the content directly",
                "First check the columns in the file",
                "Then run the query to answer the question",
                "The CSV content is already loaded, you don't need to look for a file",
                "Always wrap column names with double quotes if they contain spaces or special characters",
                "Remember to escape the quotes in the JSON string (use \")",
                "Use single quotes for string values"
            ],
        )
    def run_agent(self, query):
        response = self.agent.run(query, stream=False)
        return response.content

        
    
class ZoomAgent:
    def __init__(self, model, account_id, client_id, client_secret):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
            
        self.zoom_tools = ZoomTools(
            account_id=account_id,
            client_id=client_id,
            client_secret=client_secret
        )
        
        self.agent = Agent(
            model=self.model,
            tools=[self.zoom_tools],
            markdown=True,
            
        )
    
    def run_agent(self, query):
        response = self.agent.run(query, stream=False)
        return response.content

class WebAgent:
    def __init__(self, model):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
        
        self.agent = Agent(
            model=self.model,
            tools=[GoogleSearchTools()],
            instructions=[
                "You are a web search agent that can search the web and give answers to the user",
                "Given a topic by the user, respond with 4 latest search items about that topic.",
                "Search for 10  items and select the top 4 unique items.",
                "Search in English."
            ],
            
            debug_mode=True,
            markdown=True
        )
    
    def run_agent(self, query):
        response = self.agent.run(query, stream=False)
        return response.content

class EmailAgent:
    def __init__(self, model, receiver_email, sender_email, sender_name, sender_passkey):
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model
        
        self.receiver_email = receiver_email
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.sender_passkey = sender_passkey
        
        # Create custom email tools with proper schema
        self.email_tools = CustomEmailTools(
            receiver_email=receiver_email,
            sender_email=sender_email,
            sender_name=sender_name,
            sender_passkey=sender_passkey
        )
        
        # Simple approach: handle email sending directly in run_agent
        self.agent = Agent(
            model=self.model,
            markdown=True,
            instructions=[
                f"You are an email assistant that helps compose professional emails.",
                "Given content, extract or generate a suitable subject line and email body.",
                "Format your response as: SUBJECT: [subject] BODY: [body]",
                f"The email will be sent to {receiver_email} from {sender_name}."
            ]
        )
    
    def run_agent(self, query):
        try:
            # First, get the email content from the agent
            response = self.agent.run(query, stream=False)
            content = response.content
            
            # Parse the response to extract subject and body
            subject = "Marketing Information"  # Default subject
            body = content  # Default body
            
            # Try to extract subject and body from the response
            if "SUBJECT:" in content and "BODY:" in content:
                parts = content.split("BODY:", 1)
                if len(parts) == 2:
                    subject_part = parts[0].replace("SUBJECT:", "").strip()
                    body = parts[1].strip()
                    if subject_part:
                        subject = subject_part
            elif "Subject:" in content:
                # Alternative format parsing
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if line.strip().lower().startswith('subject:'):
                        subject = line.split(':', 1)[1].strip()
                        body = '\n'.join(lines[i+1:]).strip()
                        break
            
            # Send the email using our custom email tools
            result = self.email_tools.send_email(subject, body)
            return result
            
        except Exception as e:
            error_msg = f"Error sending email: {str(e)}"
            return error_msg

class RAGAgent:
    def __init__(self, model: str, file: UploadFile):
        # Select model
        if "gemini" in model.lower():
            self.model = gemini_model
        elif "groq" in model.lower():
            self.model = groq_model

        # Create temporary directory if it doesn't exist
        os.makedirs("tmp", exist_ok=True)

        # Save the uploaded file
        pdf_path = f"tmp/{file.filename}"
        with open(pdf_path, "wb") as f:
            f.write(file.file.read())

        # Set up knowledge base
        knowledge = Knowledge(
            vector_db=LanceDb(
                uri="tmp/lancedb",
                table_name="documents",
                search_type=SearchType.hybrid,
            ),
        )
        
        # Add PDF content to knowledge base using the new v2 method
        knowledge.add_content(path=pdf_path)
        
        self.agent = Agent(
            model=self.model,
            instructions="You are a RAG-based AI agent that will be given the resume of the user through knowledge, and you have to answer the questions.",
            knowledge=knowledge,
            
            markdown=True,
            add_knowledge_to_context=True,
        )

    def run_agent(self, query: str):
        response = self.agent.run(query)
        return response.content
# # Example usage:
# # Text Agent example
# text_agent = TextAgent(
#     model="groq",
#     instructions="You are a helpful assistant that provides information about programming.",
#     tools=[DuckDuckGoTools()]
# )
# print(text_agent.run_agent("What are the key features of Python?"))

# # CSV Agent example
# csv_agent = CSVAgent(model="groq", file_path="customer_dataset.csv")
# print(csv_agent.run_agent("who has work address Gymnasium?"))

# # Zoom Agent example
# zoom_agent = ZoomAgent(
#     model="groq",
#     account_id=os.getenv("ZOOM_ACCOUNT_ID"),
#     client_id=os.getenv("ZOOM_CLIENT_ID"),
#     client_secret=os.getenv("ZOOM_CLIENT_SECRET")
# )
# print(zoom_agent.run_agent("Schedule a team meeting for tomorrow at 2 PM UTC"))

# # News Agent example
# news_agent = NewsAgent(model="groq")
# print(news_agent.run_agent("Latest news about artificial intelligence"))

# # Email Agent example
# email_agent = EmailAgent(
#     model="groq",
#     receiver_email=os.getenv("receiver_email"),
#     sender_email=os.getenv("sender_email"),
#     sender_name=os.getenv("sender_name"),
#     sender_passkey=os.getenv("sender_passkey")
# )
# print(email_agent.run_agent("Send an email about the upcoming team meeting"))

# RAG Agent example
# rag_agent = EmailAgent(model="gemini")
# print(rag_agent.run_agent("find me latest news from mumbai"))