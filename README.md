# 🧵 Threadloom

> **No-Code AI Workflow Platform** - Visual workflow automation built with modern full-stack technologies

<div align="center">

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)

</div>

## 🎯 What This Project Actually Is

Threadloom is a **No-Code AI Workflow Builder Platform** (like Langflow or n8n) that empowers users to create complex AI workflows through an intuitive visual interface, without writing any code.

## 🚀 **Core Platform Features**

### 🎨 **Visual Workflow Builder (Main Feature)**
- **Drag & Drop Interface**: Build workflows by connecting components visually
- **Live Playground**: Real-time workflow creation and testing environment
- **Node-Based Architecture**: Connect input/output ports between components
- **Visual Flow Execution**: Watch data flow through your workflow in real-time
- **No Coding Required**: Everything is visual - just drag, drop, and connect

### � **Comprehensive Component Library**
Ready-to-use components that work individually or connected together:

#### **🤖 AI Processing Components**
- **Text Agent**: GPT-4, Claude, Gemini for text processing and generation
- **CSV Analyzer**: Upload and analyze data files with AI insights
- **RAG Document Q&A**: Query documents using retrieval-augmented generation
- **Web Scraper**: Extract and analyze web content in real-time
- **Voice Processor**: Speech-to-text and voice command handling
- **Image Analyzer**: Process and analyze images with AI models

#### **🔧 Utility Components**
- **Data Transformers**: Format, filter, and manipulate data between nodes
- **API Connectors**: Connect to external APIs and services
- **File Handlers**: Upload, download, and process various file types
- **Email Senders**: Send automated emails with dynamic content
- **Conditional Logic**: If/then/else branching for complex workflows

#### **� Output Components**
- **Data Visualizers**: Create charts and graphs from workflow data
- **Report Generators**: Generate formatted reports and summaries
- **Notification Systems**: Send alerts via email, SMS, or webhooks

### 🧠 **AI-Powered Workflow Creation**
- **Prompt-to-Workflow**: Describe what you want, AI builds the workflow
- **Natural Language**: "Analyze this CSV and send me an email summary"
- **Smart Component Selection**: AI chooses the right components automatically
- **Auto-Connection**: AI connects components with proper data flow
- **Missing Component Generation**: If needed component doesn't exist, AI creates it

### 🏪 **Workflow Marketplace**
- **Pre-built Templates**: Ready-to-use workflows for common tasks
- **Popular Workflows**: Email automation, data analysis, content generation
- **Import/Export**: Share workflows with other users
- **Template Categories**: Business, Marketing, Data Science, Personal automation

### 🔧 **Dynamic Component Creation**
- **Custom Component Generator**: AI creates new components based on user requirements
- **Runtime Code Generation**: Components generated and deployed instantly
- **Component Testing**: Test new components before adding to workflows
- **Personal Component Library**: Save and reuse your custom components

## 🛠️ No-Code Platform Technical Implementation

### **Visual Workflow Engine**
- **ReactFlow** - Professional node-based editor enabling drag-and-drop workflow construction
- **Component Registry** - Dynamic component discovery and instantiation system
- **Data Flow Engine** - Type-safe connections between components with automatic data transformation
- **Real-time Execution** - Live workflow processing with visual state updates
- **Workflow Persistence** - Save, load, and version control for complex workflows

### **Frontend Platform Architecture**
- **React 19** with TypeScript providing component-based UI and concurrent features
- **Three.js** powering 3D workspace visualization and interactive graphics
- **Component Library** - 15+ pre-built, connectable workflow components
- **Visual Editor** - Intuitive drag-and-drop interface for workflow construction
- **AI Integration UI** - Natural language to workflow conversion interface

### **Backend Workflow Infrastructure**
- **FastAPI** with async execution engine for high-performance workflow processing
- **Component Runtime** - Sandboxed execution environment for custom and AI-generated components
- **Multi-Provider AI** - OpenAI, Google, Groq integration for diverse AI capabilities
- **Workflow Storage** - SQLite persistence for workflows, components, and execution history
- **Dynamic Component Creation** - AI-powered generation of new workflow components from descriptions

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.11+ 
- Git (for cloning)

### **Quick Setup**

#### 1️⃣ **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows (use source .venv/bin/activate on Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env file with your API keys (see Environment Variables section)

# Start the development server
uvicorn app:app --reload
```
✅ Backend will be running at **http://localhost:8000**

#### 2️⃣ **Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
✅ Frontend will be running at **http://localhost:5173**

## ✨ Platform Capabilities Implemented

### 🎨 **No-Code Workflow Builder**
- ✅ **Visual Playground** - Drag-and-drop workflow creation interface
- ✅ **Component Library** - 15+ pre-built, functional components
- ✅ **Node Connections** - Visual linking between component inputs/outputs
- ✅ **Real-time Execution** - Run workflows and see results instantly
- ✅ **Flow Validation** - Automatic checking of workflow connections

### � **AI-Powered Workflow Creation**
- ✅ **Prompt-to-Workflow** - Natural language to visual workflow conversion
- ✅ **Smart Component Selection** - AI chooses optimal components automatically
- ✅ **Auto-Connection Logic** - Intelligent linking of compatible components
- ✅ **Missing Component Generation** - AI creates custom components on-demand
- ✅ **Workflow Optimization** - AI suggests improvements to existing flows

### 🧩 **Component System**
- ✅ **Modular Architecture** - Each component works independently
- ✅ **Universal Compatibility** - Components can connect to any compatible component
- ✅ **Dynamic Parameters** - Configurable inputs for each component
- ✅ **Output Formatting** - Standardized data formats between components
- ✅ **Error Handling** - Graceful failure handling in component chains

### 🏪 **Marketplace & Templates**
- ✅ **Workflow Templates** - Pre-built workflows for common use cases
- ✅ **Template Categories** - Organized by business function and industry
- ✅ **Import/Export** - Save and share workflows with others
- ✅ **Template Customization** - Modify templates to fit specific needs
- ✅ **Popular Workflows** - Email automation, data analysis, content generation

### 🔐 **Platform Infrastructure**
- ✅ **User Authentication** - Complete JWT-based auth system
- ✅ **API Key Management** - Secure storage for external service credentials
- ✅ **File Processing** - Upload and handle various file types in workflows
- ✅ **Multi-AI Integration** - OpenAI, Google AI, Groq support across components
- ✅ **Scalable Backend** - FastAPI with async processing for workflow execution

## 🔗 No-Code Platform API Reference

### **Authentication Endpoints**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new user account |
| `POST` | `/auth/login` | User login with JWT token |
| `GET` | `/auth/me` | Get current user information |

### **Workflow Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows` | List user's saved workflows |
| `POST` | `/workflows` | Create new workflow |
| `PUT` | `/workflows/{id}` | Update existing workflow |
| `DELETE` | `/workflows/{id}` | Delete workflow |
| `POST` | `/workflows/{id}/execute` | Execute workflow and return results |

### **Component System**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/components` | List available workflow components |
| `POST` | `/components/execute` | Execute individual component |
| `POST` | `/components/generate` | AI-generate new component from description |
| `GET` | `/components/{id}/schema` | Get component input/output schema |

### **AI-Powered Features**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/prompt-to-workflow` | Convert natural language to visual workflow |
| `POST` | `/ai/optimize-workflow` | Get AI suggestions for workflow improvements |
| `POST` | `/ai/generate-component` | Create custom component from description |

### **Marketplace & Templates**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/marketplace/templates` | Browse workflow templates |
| `POST` | `/marketplace/templates/{id}/import` | Import template to workspace |
| `POST` | `/marketplace/publish` | Publish workflow as template |
| `GET` | `/marketplace/categories` | List template categories |

### **API Key Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api-keys` | List user's API keys |
| `POST` | `/api-keys` | Create new API key |
| `GET` | `/api-keys/{id}/value` | Get API key value |
| `DELETE` | `/api-keys/{id}` | Delete API key |

> 📚 **Complete API Documentation**: Visit http://localhost:8000/docs for interactive API explorer

## ⚙️ Environment Configuration

### **Required Variables**
```env
# Core AI Models
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_API_KEY=your-google-ai-api-key  
GROQ_API_KEY=your-groq-api-key

# Security
SECRET_KEY=your-jwt-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **Optional Features**
```env
# Communication Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Web Scraping
FIRECRAWL_API_KEY=your-firecrawl-api-key

# Speech Processing
DEEPGRAM_API_KEY=your-deepgram-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Meeting Integration
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
```

> ⚠️ **Important**: Copy `.env.example` to `.env` and fill in your actual API keys

## 🎮 Demo & Usage

### **Running the Application**
1. **Start Backend**: `uvicorn app:app --reload` (from backend folder)
2. **Start Frontend**: `npm run dev` (from frontend folder)  
3. **Open Browser**: Navigate to http://localhost:5173

### **🚀 Try the No-Code Workflow Builder**

#### **Method 1: Visual Drag & Drop**
1. **Access Playground**: Click on "Playground" in the navigation
2. **Browse Components**: See the component library with AI agents, utilities, and outputs
3. **Drag Components**: Drag components like "Text Agent" or "CSV Analyzer" onto the canvas
4. **Connect Nodes**: Link component outputs to inputs by dragging connections
5. **Configure Parameters**: Set up API keys, prompts, and settings for each component
6. **Execute Workflow**: Run your workflow and see results flow through each component

#### **Method 2: AI Prompt-to-Workflow**
1. **Use Prompt Interface**: Click "Prompt to Workflow" feature
2. **Describe Your Need**: Type something like "Analyze this CSV file and email me a summary"
3. **Watch AI Build**: See AI automatically select and connect the right components
4. **Review & Execute**: Check the generated workflow and run it
5. **Customize**: Modify the AI-generated workflow as needed

#### **Method 3: Marketplace Templates**
1. **Browse Marketplace**: Explore pre-built workflow templates
2. **Popular Categories**: Email automation, data analysis, content generation, web scraping
3. **Import Template**: Load a template that matches your use case
4. **Customize**: Modify parameters and connections for your specific needs
5. **Save & Share**: Export your customized workflow for reuse

### **🎯 Example Workflows to Try**
- **Data Analysis Pipeline**: CSV Upload → AI Analysis → Chart Generation → Email Report
- **Content Generation**: Web Scraping → Text Summarization → Social Media Posts
- **Customer Support**: Email Input → Sentiment Analysis → Auto Response → Ticket Creation
- **Research Assistant**: Document Upload → RAG Q&A → Summary Generation → Knowledge Base Update

---

## 🎯 Project Scope & Achievements

### **✅ No-Code Platform Successfully Built**
- **Visual Workflow Builder**: Complete drag-and-drop interface like Langflow/n8n
- **Component-Based Architecture**: 15+ functional, connectable components
- **AI-Powered Workflow Generation**: Natural language to visual workflow conversion
- **Marketplace System**: Template library with import/export functionality
- **Real-time Execution Engine**: Live workflow processing and result visualization
- **Universal Component Compatibility**: Any component can connect to compatible components

### **🔧 Technical Platform Highlights**
- **ReactFlow Integration**: Professional node-based workflow editor
- **Component Abstraction**: Standardized interface for all workflow components
- **Dynamic Component Creation**: AI generates new components at runtime
- **Workflow Persistence**: Save, load, and share complex workflows
- **Multi-Modal Processing**: Text, files, images, voice, and web data handling
- **Scalable Execution**: Async workflow processing with error handling

### **� Innovation Achievements**
- **Prompt-to-Workflow AI**: First-of-its-kind natural language workflow generation
- **Dynamic Component Generation**: AI creates missing components automatically
- **Universal Node Compatibility**: Seamless data flow between any compatible components
- **Real-time Visual Execution**: Live workflow state visualization during execution

### **🔄 Future Enhancements**
- **Production Deployment**: Docker containerization and cloud deployment configurations
- **Advanced Error Handling**: Comprehensive error recovery and user feedback systems
- **Testing Suite**: Complete unit and integration test coverage
- **Enterprise Features**: Advanced user management, workflow versioning, and collaboration tools

---

## � Project Vision

Threadloom represents the future of **no-code AI workflow automation**. Built to democratize AI capabilities through visual programming, enabling anyone to create sophisticated AI-powered workflows without writing code. This platform showcases:
- Advanced visual workflow design and execution
- Intelligent AI-powered workflow generation from natural language
- Scalable component-based architecture
- Professional-grade user experience and interface design
- Enterprise-ready authentication and security systems