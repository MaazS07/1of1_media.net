from agno.agent import Agent
from agno.models.google import Gemini

from agno.vectordb.lancedb import LanceDb, SearchType
from agno.knowledge.pdf import PDFKnowledgeBase, PDFReader
from agno.embedder.google import GeminiEmbedder
embeddings=GeminiEmbedder()
import os 
from dotenv import load_dotenv

load_dotenv()
os.environ["GOOGLE_API_KEY"]=os.getenv("GOOGLE_API_KEY")


agent_slip = Agent(
    model=Gemini(id="gemini-2.5-flash-lite"),
    instructions="""You are a passionate and knowledgable AI assistant who can answer questions about various topics. Your responses should be informative and well-researched. Please provide detailed explanations for your answers. If you don't have enough information to answer the question, please say so and ask for more details.""",
    knowledge=PDFKnowledgeBase(
        path="data/Resume_JPMC.pdf",
        vector_db=LanceDb(
            uri="tmp/lancedb",
            table_name="payslip",
            search_type=SearchType.hybrid,
            embedder=embeddings,
          ),
    reader=PDFReader(chunk=True),
),
    
    markdown=True,
    add_references=True, 
)

if agent_slip.knowledge is not None:
    agent_slip.knowledge.load()

# agent_slip.print_response("What is her salary", stream = True)

agent_slip.print_response("name the projects from the resume", stream=True)