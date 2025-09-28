// pages/PromptPlayground.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/playground/Sidebar';
import Workspace from '../components/playground/Workspace';
import { NodeData, EdgeData } from '../types/nodeTypes';
import { workflowPatterns } from '../utils/workflowPatterns';
import { 
  ApiEndpoint, 
  TextAgentRequest, 
  sendJsonRequest,
  sendFormDataRequest,
  ApiResponse,
  sendWorkflowAgentRequest
} from '../types/apiTypes';
import { BiMessageDetail } from 'react-icons/bi';
import { BsMicFill, BsFileEarmarkText, BsFileEarmark } from 'react-icons/bs';
import { MdEmail, MdTextFields, MdOutlineOutput, MdSend } from 'react-icons/md';
import { FiPaperclip, FiSearch } from 'react-icons/fi';
import { AiOutlineSound } from 'react-icons/ai';
import { FaDatabase, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface Template {
  id: string;
  name: string;
  nodes: NodeData[];
  edges: EdgeData[];
  createdAt: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config?: any;
  inputs: Array<{
    name: string;
    type: string;
    required?: boolean;
    default_value?: any;
  }>;
  outputs: Array<{
    name: string;
    type: string;
  }>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  source_output: string;
  target_input: string;
}

interface WorkflowResponse {
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const nodeTemplates: Record<string, { inputs: any[], outputs: any[], icon: React.ElementType }> = {
  "End": {
    inputs: [
      { id: 'input-1', name: 'End', type: 'none', fieldType: 'input' }
    ],
    outputs: [],
    icon: BsFileEarmark 
  },
  "Text-Agent": {
    inputs: [
      { id: 'input-1', name: 'Tools', type: 'tool', fieldType: 'none' },
      { id: 'input-2', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'Query', type: 'none', fieldType: 'input' },
      { id: 'input-4', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] },
      { id: 'input-5', name: 'API Key', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' },
    ],
    icon: BiMessageDetail
  },
  "Voice-Agent": {
    inputs: [
      { id: 'input-1', name: 'Tools', type: 'tool', fieldType: 'none' },
      { id: 'input-2', name: 'STT', type: 'string', fieldType: 'input', options: ['OpenAI', 'Google', 'Azure', 'Assembly AI'] },
      { id: 'input-3', name: 'TTS', type: 'string', fieldType: 'input', options: ['OpenAI', 'ElevenLabs', 'Deepgram', 'Google'] },
      { id: 'input-4', name: 'Language', type: 'string', fieldType: 'input' },
      { id: 'input-5', name: 'Instructions', type: 'none', fieldType: 'input' },
      { id: 'input-6', name: 'To Phone Number', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' },
    ],
    icon: BsMicFill
  },
  "CSV-Agent": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'none', fieldType: 'input' },
      { id: 'input-2', name: 'Instructions', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Personal Description', type: 'string', fieldType: 'output' },
      { id: 'output-2', name: 'Receiver Emails', type: 'string', fieldType: 'output' },
      { id: 'output-3', name: 'Output', type: 'string', fieldType: 'output' },
    ],
    icon: BsFileEarmarkText
  },
  "Email-Tool": {
    inputs: [
      { id: 'input-1', name: 'Sender Mail', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Passkey', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: "Sender's Name", type: 'string', fieldType: 'input' },
      { id: 'input-4', name: "Receiver Emails", type: 'none', fieldType: 'input' },
      { id: 'input-5', name: "Email Description", type: 'none', fieldType: 'input' },
    ],
    outputs: [
      { id: 'output-1', name: 'Status', type: 'string', fieldType: 'output' }
    ],
    icon: MdEmail
  },
  "Text-Input-Tool": {
    inputs: [
      { id: 'input-1', name: 'Text', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Text', type: 'string', fieldType: 'output' }
    ],
    icon: MdTextFields
  },
  "File-Input-Tool": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'File', type: 'file', fieldType: 'output' }
    ],
    icon: FiPaperclip
  },
  "Text-Output-Tool": {
    inputs: [
      { id: 'input-1', name: 'Text', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: true }
    ],
    icon: MdOutlineOutput
  },
  "Knowledge-Base": {
    inputs: [
      { id: 'input-1', name: 'File', type: 'file', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Content', type: 'string', fieldType: 'output', display: false }
    ],
    icon: FaDatabase
  },
  "Web-Search-Tool": {
    inputs: [
      { id: 'input-1', name: 'Search Engine', type: 'string', fieldType: 'input', options: ['Google', 'DuckDuckGo'] },
      { id: 'input-2', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Results', type: 'string', fieldType: 'output' }
    ],
    icon: FiSearch
  },
  "WhatsApp-Tool": {
    inputs: [],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: false }
    ],
    icon: BiMessageDetail
  },
  "Zoom-Tool": {
    inputs: [
        { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
        { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: false }
    ],
    icon: AiOutlineSound
  },
  "ArXiv-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Papers', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  },
  "HackerNews-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Stories', type: 'string', fieldType: 'output' }
    ],
    icon: FiSearch
  },
  "PubMed-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Literature', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  },
  "YouTube-Analysis": {
    inputs: [
      { id: 'input-1', name: 'Video URL', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Analysis', type: 'string', fieldType: 'output' }
    ],
    icon: AiOutlineSound
  },
  "Financial-Analysis": {
    inputs: [
      { id: 'input-1', name: 'Symbol', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Analysis', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  },
  "Weather-Info": {
    inputs: [
      { id: 'input-1', name: 'Location', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'API Key', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Weather Data', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  },
  "Python-Code": {
    inputs: [
      { id: 'input-1', name: 'Code', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Result', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  },
  "Shell-Command": {
    inputs: [
      { id: 'input-1', name: 'Command', type: 'string', fieldType: 'input' }
    ],
    outputs: [
      { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output' }
    ],
    icon: FaDatabase
  }
};

// Node type mapping
const nodeTypeMapping: Record<string, string> = {
  'prompt_template': 'Text-Input-Tool',
  'chat_llm': 'Text-Agent',
  'csv_agent': 'CSV-Agent',
  'email_tool': 'Email-Tool',
  'file_input': 'File-Input-Tool',
  'text_output': 'Text-Output-Tool',
  'knowledge_base': 'Knowledge-Base',
  'web_search': 'Web-Search-Tool',
  'voice_agent': 'Voice-Agent',
  'whatsapp_tool': 'WhatsApp-Tool',
  'zoom_tool': 'Zoom-Tool',
  'arxiv_search': 'ArXiv-Search',
  'hackernews_search': 'HackerNews-Search',
  'pubmed_search': 'PubMed-Search',
  'youtube_analysis': 'YouTube-Analysis',
  'financial_analysis': 'Financial-Analysis',
  'weather_info': 'Weather-Info',
  'python_code': 'Python-Code',
  'shell_command': 'Shell-Command'
};

const PromptPlayground = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [savedTemplateName, setSavedTemplateName] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  
  // Prompt generation states
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Loader text state for animated messages while executing
  const loaderMessages = ["Initializing workflows...", "Processing nodes...", "Executing pipeline...", "Almost ready..."];
  const [currentLoaderText, setCurrentLoaderText] = useState(loaderMessages[0]);
  const generationMessages = ["Analyzing prompt...", "Designing workflow...", "Creating connections...", "Almost ready..."];
  const [currentGenerationText, setCurrentGenerationText] = useState(generationMessages[0]);
  
  const navigate = useNavigate();

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  // Cycle through loader texts every 2 seconds when executing
  useEffect(() => {
    let interval: number;
    if (isExecuting) {
      let index = 0;
      interval = window.setInterval(() => {
        index = (index + 1) % loaderMessages.length;
        setCurrentLoaderText(loaderMessages[index]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);

  // Cycle through generation texts
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      let index = 0;
      interval = window.setInterval(() => {
        index = (index + 1) % generationMessages.length;
        setCurrentGenerationText(generationMessages[index]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('d2k-templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (e) {
        console.error("Error loading templates:", e);
      }
    }
    const templateToLoad = sessionStorage.getItem('template-to-load');
    if (templateToLoad) {
      try {
        const template = JSON.parse(templateToLoad);
        
        // Process template nodes to handle potential file inputs properly
        const processedNodes = template.nodes.map((node: { data: { inputs: any[]; }; }) => {
          // Process inputs to handle file values
          if (node.data?.inputs) {
            node.data.inputs = node.data.inputs.map(input => {
              // If it's a file input with a stored filename object, ensure it's not rendered directly
              if (input.type === 'file' && typeof input.value === 'object') {
                // Store filename info but not as a direct value to prevent React rendering issues
                return { ...input, value: null, fileInfo: input.value };
              }
              return input;
            });
          }
          return node;
        });
        
        setNodes(processedNodes);
        setEdges(template.edges);
        sessionStorage.removeItem('template-to-load');
      } catch (e) {
        console.error("Error loading template from session storage:", e);
      }
    }
  }, []);

  // Save templates to localStorage when they change
  useEffect(() => {
    if (templates.length > 0) {
      console.log('Saving templates to localStorage:', templates);
      localStorage.setItem('d2k-templates', JSON.stringify(templates));
      console.log('Templates saved to localStorage');
    }
  }, [templates]);

  // Convert workflow node to NodeData format
  const convertWorkflowNodeToNodeData = (workflowNode: WorkflowNode): NodeData => {
    const mappedType = nodeTypeMapping[workflowNode.type] || 'Text-Agent';
    const template = nodeTemplates[mappedType];
    
    if (!template) {
      console.warn(`Template not found for type: ${mappedType}`);
      return {
        id: workflowNode.id,
        type: mappedType,
        position: workflowNode.position,
        data: {
          label: workflowNode.name || mappedType,
          inputs: [],
          outputs: []
        }
      };
    }

    // Create inputs based on the template structure
    const inputs = template.inputs.map((templateInput, index) => {
      const workflowInput = workflowNode.inputs.find(wi => wi.name.toLowerCase() === templateInput.name.toLowerCase()) || workflowNode.inputs[index];
      return {
        ...templateInput,
        id: `${workflowNode.id}-input-${index}`,
        name: templateInput.name,
        value: workflowInput?.default_value || null
      };
    });

    // Create outputs based on the template structure
    const outputs = template.outputs.map((templateOutput, index) => {
      const workflowOutput = workflowNode.outputs.find(wo => wo.name.toLowerCase() === templateOutput.name.toLowerCase()) || workflowNode.outputs[index];
      return {
        ...templateOutput,
        id: `${workflowNode.id}-output-${index}`,
        name: templateOutput.name
      };
    });

    return {
      id: workflowNode.id,
      type: mappedType,
      position: workflowNode.position,
      data: {
        label: workflowNode.name || mappedType,
        inputs,
        outputs
      }
    };
  };

  // Convert workflow edge to EdgeData format
  const convertWorkflowEdgeToEdgeData = (
    workflowEdge: WorkflowEdge, 
    workflowNodes: WorkflowNode[],
    convertedNodes: NodeData[]
  ): EdgeData => {
    const sourceNode = convertedNodes.find(n => n.id === workflowEdge.source);
    const targetNode = convertedNodes.find(n => n.id === workflowEdge.target);
    
    if (!sourceNode || !targetNode) {
      console.warn(`Could not find nodes for edge: ${workflowEdge.source} -> ${workflowEdge.target}`);
      return {
        id: workflowEdge.id,
        source: workflowEdge.source,
        sourceHandle: `${workflowEdge.source}-output-0`,
        target: workflowEdge.target,
        targetHandle: `${workflowEdge.target}-input-0`
      };
    }

    // Find matching output and input by name (case insensitive)
    const sourceOutputIndex = sourceNode.data.outputs.findIndex(
      o => o.name.toLowerCase().includes(workflowEdge.source_output.toLowerCase()) ||
           workflowEdge.source_output.toLowerCase().includes(o.name.toLowerCase())
    );
    const targetInputIndex = targetNode.data.inputs.findIndex(
      i => i.name.toLowerCase().includes(workflowEdge.target_input.toLowerCase()) ||
           workflowEdge.target_input.toLowerCase().includes(i.name.toLowerCase())
    );

    const finalSourceIndex = sourceOutputIndex >= 0 ? sourceOutputIndex : 0;
    const finalTargetIndex = targetInputIndex >= 0 ? targetInputIndex : 2; // Default to Query input for Text-Agent

    return {
      id: workflowEdge.id,
      source: workflowEdge.source,
      sourceHandle: `${workflowEdge.source}-output-${finalSourceIndex}`,
      target: workflowEdge.target,
      targetHandle: `${workflowEdge.target}-input-${finalTargetIndex}`
    };
  };

  // Helper function to get current viewport center in workspace coordinates
  const getCurrentViewportCenter = () => {
    const workspaceElement = document.querySelector('.flex-1.h-full.relative.overflow-hidden');
    let centerX = 500;
    let centerY = 300;
    
    if (workspaceElement) {
      const rect = workspaceElement.getBoundingClientRect();
      const transformElement = workspaceElement.querySelector('[style*="transform"]') as HTMLElement;
      
      if (transformElement) {
        const style = window.getComputedStyle(transformElement);
        const transform = style.transform || style.webkitTransform;
        
        if (transform && transform !== 'none') {
          const matrix = new DOMMatrix(transform);
          const scale = matrix.a;
          const offsetX = matrix.e;
          const offsetY = matrix.f;
          
          const viewportCenterX = rect.width / 2;
          const viewportCenterY = rect.height / 2;
          
          centerX = (viewportCenterX - offsetX) / scale;
          centerY = (viewportCenterY - offsetY) / scale;
        }
      }
    }
    
    return { x: centerX, y: centerY };
  };

  const generateWorkflow = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    // Get current viewport center for positioning nodes
    const viewportCenter = getCurrentViewportCenter();

    // Skip API call for now and directly use demo workflow
    setTimeout(() => {
      let sampleWorkflow: WorkflowResponse;

      // Different workflows based on prompt keywords
      if (prompt.toLowerCase().includes('email') || prompt.toLowerCase().includes('mail')) {
        sampleWorkflow = {
          "name": "Email Processing Workflow",
          "description": "Processes text input and sends via email",
          "version": "1.0.0",
          "nodes": [
            {
              "id": "input_1",
              "type": "prompt_template",
              "name": "Text Input",
              "config": {},
              "inputs": [{ "name": "Text", "type": "string", "required": true, "default_value": "Enter your message..." }],
              "outputs": [{ "name": "Text", "type": "string" }],
              "position": {"x": viewportCenter.x - 200, "y": viewportCenter.y}
            },
            {
              "id": "llm_1",
              "type": "chat_llm",
              "name": "Content Processor",
              "config": {},
              "inputs": [
                { "name": "Instructions", "type": "string", "default_value": "Format this content for email" },
                { "name": "Query", "type": "string", "required": true },
                { "name": "LLM", "type": "string", "default_value": "Groq" }
              ],
              "outputs": [{ "name": "Output", "type": "string" }],
              "position": {"x": viewportCenter.x + 100, "y": viewportCenter.y}
            },
            {
              "id": "email_1",
              "type": "email_tool",
              "name": "Email Sender",
              "config": {},
              "inputs": [
                { "name": "Sender Mail", "type": "string", "default_value": "your@email.com" },
                { "name": "Passkey", "type": "string", "default_value": "" },
                { "name": "Sender's Name", "type": "string", "default_value": "Your Name" },
                { "name": "Receiver Emails", "type": "string", "default_value": "" },
                { "name": "Email Description", "type": "string", "required": true }
              ],
              "outputs": [{ "name": "Status", "type": "string" }],
              "position": {"x": viewportCenter.x + 400, "y": viewportCenter.y}
            }
          ],
          "edges": [
            {
              "id": "edge_1",
              "source": "input_1",
              "target": "llm_1",
              "source_output": "Text",
              "target_input": "Query"
            },
            {
              "id": "edge_2",
              "source": "llm_1",
              "target": "email_1",
              "source_output": "Output",
              "target_input": "Email Description"
            }
          ]
        };
      } else if (prompt.toLowerCase().includes('csv') || prompt.toLowerCase().includes('file')) {
        sampleWorkflow = {
          "name": "CSV Data Processing",
          "description": "Processes CSV files with AI analysis",
          "version": "1.0.0",
          "nodes": [
            {
              "id": "file_1",
              "type": "file_input",
              "name": "CSV File Input",
              "config": {},
              "inputs": [{ "name": "File", "type": "file", "required": true }],
              "outputs": [{ "name": "File", "type": "file" }],
              "position": {"x": viewportCenter.x - 200, "y": viewportCenter.y}
            },
            {
              "id": "csv_1",
              "type": "csv_agent",
              "name": "CSV Analyzer",
              "config": {},
              "inputs": [
                { "name": "File", "type": "file", "required": true },
                { "name": "Instructions", "type": "string", "default_value": "Analyze the CSV data" },
                { "name": "Query", "type": "string", "default_value": "Provide insights from this data" }
              ],
              "outputs": [
                { "name": "Personal Description", "type": "string" },
                { "name": "Receiver Emails", "type": "string" },
                { "name": "Output", "type": "string" }
              ],
              "position": {"x": viewportCenter.x + 100, "y": viewportCenter.y}
            },
            {
              "id": "output_1",
              "type": "text_output",
              "name": "Results",
              "config": {},
              "inputs": [{ "name": "Text", "type": "string", "required": true }],
              "outputs": [{ "name": "Output", "type": "string" }],
              "position": {"x": viewportCenter.x + 400, "y": viewportCenter.y}
            }
          ],
          "edges": [
            {
              "id": "edge_1",
              "source": "file_1",
              "target": "csv_1",
              "source_output": "File",
              "target_input": "File"
            },
            {
              "id": "edge_2",
              "source": "csv_1",
              "target": "output_1",
              "source_output": "Output",
              "target_input": "Text"
            }
          ]
        };
      } else {
        sampleWorkflow = {
          "name": "AI Text Processing",
          "description": `Custom workflow: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
          "version": "1.0.0",
          "nodes": [
            {
              "id": "input_1",
              "type": "prompt_template",
              "name": "User Input",
              "config": {},
              "inputs": [{ "name": "Text", "type": "string", "required": true, "default_value": "Enter your input..." }],
              "outputs": [{ "name": "Text", "type": "string" }],
              "position": {"x": viewportCenter.x - 200, "y": viewportCenter.y}
            },
            {
              "id": "llm_1",
              "type": "chat_llm",
              "name": "AI Processor",
              "config": {},
              "inputs": [
                { "name": "Instructions", "type": "string", "default_value": "Process and respond to the user input" },
                { "name": "Query", "type": "string", "required": true },
                { "name": "LLM", "type": "string", "default_value": "Groq" }
              ],
              "outputs": [{ "name": "Output", "type": "string" }],
              "position": {"x": viewportCenter.x + 100, "y": viewportCenter.y}
            },
            {
              "id": "output_1",
              "type": "text_output",
              "name": "Final Result",
              "config": {},
              "inputs": [{ "name": "Text", "type": "string", "required": true }],
              "outputs": [{ "name": "Output", "type": "string" }],
              "position": {"x": viewportCenter.x + 400, "y": viewportCenter.y}
            }
          ],
          "edges": [
            {
              "id": "edge_1",
              "source": "input_1",
              "target": "llm_1",
              "source_output": "Text",
              "target_input": "Query"
            },
            {
              "id": "edge_2",
              "source": "llm_1",
              "target": "output_1",
              "source_output": "Output",
              "target_input": "Text"
            }
          ]
        };
      }

      const convertedNodes = sampleWorkflow.nodes.map(convertWorkflowNodeToNodeData);
      const convertedEdges = sampleWorkflow.edges.map(edge => 
        convertWorkflowEdgeToEdgeData(edge, sampleWorkflow.nodes, convertedNodes)
      );
      
      setNodes(convertedNodes);
      setEdges(convertedEdges);
      setPrompt(''); // Clear prompt after generation
      setIsGenerating(false);
    }, 2500);
  };

  const handleSaveTemplate = (templateName: string) => {
    if (!templateName.trim()) return;

    // Check if there are nodes to save
    if (nodes.length === 0) {
      alert('Please add some components to your workflow before saving.');
      return;
    }

    console.log('Saving template:', templateName);
    console.log('Current nodes:', nodes);
    console.log('Current edges:', edges);

    // Create a deep copy of nodes and clean file input values
    const sanitizedNodes = nodes.map(node => {
      // Create a deep copy of the node
      const nodeCopy = { ...node, data: { ...node.data } };
      
      // If the node has inputs, sanitize file inputs
      if (nodeCopy.data.inputs) {
        nodeCopy.data.inputs = nodeCopy.data.inputs.map(input => {
          // If it's a file input with a File object or non-serializable value
          if (input.type === 'file' && input.value) {
            // For file inputs, store only the filename instead of the File object
            if (input.value instanceof File) {
              return { 
                ...input, 
                value: { filename: input.value.name, size: input.value.size } 
              };
            }
            // For other non-serializable objects
            return { ...input, value: null };
          }
          return { ...input };
        });
      }
      
      return nodeCopy;
    });

    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      nodes: sanitizedNodes,
      edges: [...edges],
      createdAt: new Date().toISOString()
    };
    
    setTemplates(prev => {
      // Load existing templates from localStorage to merge with current state
      const existingTemplates = localStorage.getItem('d2k-templates');
      let allTemplates = [...prev];
      
      if (existingTemplates) {
        try {
          const parsed = JSON.parse(existingTemplates);
          // Merge existing templates, avoiding duplicates by id
          parsed.forEach((existingTemplate: any) => {
            if (!allTemplates.some(t => t.id === existingTemplate.id)) {
              allTemplates.push(existingTemplate);
            }
          });
        } catch (e) {
          console.error("Error loading existing templates:", e);
        }
      }
      
      const updated = [...allTemplates, newTemplate];
      console.log('Updated templates (merged):', updated);
      return updated;
    });
    setIsTemplateSaveModalOpen(false);
    
    // Show success notification
    setSavedTemplateName(templateName);
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setSavedTemplateName('');
    }, 3000); // Hide after 3 seconds
    
    console.log('Template saved successfully:', templateName);
  };

  const handleAddNode = (nodeType: string) => {
    const template = nodeTemplates[nodeType];
    const viewportCenter = getCurrentViewportCenter();
    
    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position: { x: viewportCenter.x, y: viewportCenter.y },
      data: { 
        label: nodeType,
        inputs: template.inputs.map(input => ({ ...input, id: `${input.id}-${Date.now()}` })),
        outputs: template.outputs.map(output => ({ ...output, id: `${output.id}-${Date.now()}` }))
      }
    };
    setNodes([...nodes, newNode]);
  };

  const handleNodeDrop = (nodeType: string, position: { x: number, y: number }) => {
    const template = nodeTemplates[nodeType];
    if (!template) return;
    const newNode: NodeData = {
      id: `node-${Date.now()}`,
      type: nodeType,
      position,
      data: { 
        label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
        inputs: template.inputs.map(input => ({ ...input, id: `${input.id}-${Date.now()}` })),
        outputs: template.outputs.map(output => ({ ...output, id: `${output.id}-${Date.now()}` }))
      }
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const handleAddEdge = (edge: EdgeData) => {
    const edgeExists = edges.some(
      e => e.source === edge.source && e.target === edge.target && 
           e.sourceHandle === edge.sourceHandle && e.targetHandle === edge.targetHandle
    );
    if (!edgeExists) {
      setEdges([...edges, { ...edge, id: `edge-${Date.now()}` }]);
    }
  };

  const handleRemoveEdge = (edgeId: string) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateWorkflow();
    }
  };

  // Shows a debug payload in the console each time nodes or edges change
  useEffect(() => {
    if (edges.length > 0) {
      const payload = nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: {
          label: node.data.label,
          inputs: node.data.inputs.map(input => ({
            id: input.id,
            name: input.name,
            type: input.type,
            fieldType: input.fieldType,
            value: input.value || null
          })),
          outputs: node.data.outputs.map(output => ({
            id: output.id,
            name: output.name,
            type: output.type,
            fieldType: output.fieldType,
            value: output.value || null
          }))
        },
        connectedEdges: edges
          .filter(edge => edge.source === node.id || edge.target === node.id)
          .map(edge => ({
            id: edge.id,
            source: edge.source,
            sourceHandle: edge.sourceHandle,
            target: edge.target,
            targetHandle: edge.targetHandle
          }))
      }));
    }
  }, [edges, nodes]);

  const checkWorkflowPattern = (nodes: NodeData[], edges: EdgeData[], patternId: string): boolean => {
    const pattern = workflowPatterns.find(p => p.id === patternId);
    if (!pattern) return false;
    const nodeTypeMap: Record<string, NodeData[]> = {};
    nodes.forEach(node => {
      if (!nodeTypeMap[node.type]) {
        nodeTypeMap[node.type] = [];
      }
      nodeTypeMap[node.type].push(node);
    });
    for (const type of pattern.requiredNodeTypes) {
      if (!nodeTypeMap[type] || nodeTypeMap[type].length === 0) {
        return false;
      }
    }
    const connections: Record<string, string[]> = {};
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;
      const connection = `${sourceNode.type}→${targetNode.type}`;
      if (!connections[connection]) {
        connections[connection] = [];
      }
      const sourceOutput = sourceNode.data.outputs.find(o => o.id === edge.sourceHandle);
      const targetInput = targetNode.data.inputs.find(i => i.id === edge.targetHandle);
      if (sourceOutput && targetInput) {
        connections[connection].push(`${sourceOutput.name}→${targetInput.name}`);
      }
    });
    for (const { nodeConnection, portConnection } of pattern.connections) {
      if (!connections[nodeConnection]) {
        return false;
      }
      const matchFound = connections[nodeConnection].some(conn => {
        const [sourcePort, targetPort] = conn.split('→');
        const [expectedSourcePort, expectedTargetPort] = portConnection.split('→');
        return (
          sourcePort.toLowerCase().includes(expectedSourcePort.toLowerCase()) &&
          targetPort.toLowerCase().includes(expectedTargetPort.toLowerCase())
        );
      });
      if (!matchFound) {
        return false;
      }
    }
    return true;
  };

  const detectWorkflowPattern = (nodes: NodeData[], edges: EdgeData[]): {patternId: string, endpoint: string} | null => {
    for (const pattern of workflowPatterns) {
      if (checkWorkflowPattern(nodes, edges, pattern.id)) {
        return {
          patternId: pattern.id,
          endpoint: pattern.endpoint
        };
      }
    }
    return null;
  };

  // Helper to prepare minimal node data
  const prepareNodeData = () => {
    return nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: {
        label: node.data.label,
        inputs: node.data.inputs.map(input => ({
          id: input.id,
          name: input.name,
          type: input.type,
          fieldType: input.fieldType,
          value: input.value || null
        })),
        outputs: node.data.outputs.map(output => ({
          id: output.id,
          name: output.name,
          type: output.type,
          fieldType: output.fieldType
        }))
      }
    }));
  };

  const handlePlayClick = async () => {
    if (nodes.length === 0) {
      alert("Nothing to execute. Please add some nodes to your flow.");
      return;
    }
    setIsExecuting(true);
    setExecutionResult(null);
    try {
      const detectedPattern = detectWorkflowPattern(nodes, edges);
      if (!detectedPattern) {
        throw new Error("Unsupported workflow pattern. Please check your node connections.");
      }
      console.log(`${detectedPattern.patternId} pattern detected - calling ${detectedPattern.endpoint}`);
      let response;
      let result;
      switch (detectedPattern.patternId) {
        case 'text-agent': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !textInputNode) {
            throw new Error("Missing required nodes for Text Agent workflow");
          }
          const modelInput = textAgentNode.data.inputs.find(input => input.name === 'LLM');
          const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const payload: TextAgentRequest = {
            model: modelInput?.value || "gemini",
            query: queryValue,
            instructions: instructionsInput?.value || ""
          };
          console.log("Sending text agent request:", payload);
          result = await sendJsonRequest<TextAgentRequest>(ApiEndpoint.TextAgent, payload);
          console.log('Execution result:', result);
          break;
        }
        // Add other cases as needed...
        default: {
          const payload = { nodes: prepareNodeData(), edges: edges };
          response = await fetch(detectedPattern.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }
      if (response) {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        result = await response.json();
      }
      // Store both a friendly message and full response data for debugging/display.
      setExecutionResult({
        success: true,
        message: result.message || "Workflow executed successfully!",
        data: result.response ? result.response : result
      });
    } catch (error) {
      console.error('Error executing flow:', error);
      setExecutionResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleViewTemplates = () => {
    navigate('/marketplace');
  };

  return (
    <div className="relative flex h-screen w-full bg-gray-900 font-['Inter']">
      <Sidebar onAddNode={handleAddNode} />
      
      {/* Main workspace with prompt input at bottom */}
      <div className="flex-1 flex flex-col">
        <Workspace 
          nodes={nodes} 
          setNodes={setNodes} 
          edges={edges}
          onAddEdge={handleAddEdge}
          onRemoveEdge={handleRemoveEdge}
          onNodeDrop={handleNodeDrop}
          onSaveTemplate={() => setIsTemplateSaveModalOpen(true)}
          onViewTemplates={handleViewTemplates}
          onPlayClick={handlePlayClick}
          isExecuting={isExecuting}
          executionResult={executionResult}
        />
        
        {/* Prompt Input Bar - Fixed at bottom */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-end gap-3 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-pink-400 transition-all duration-300 p-3">
            <FaRobot className="w-5 h-5 text-pink-400 mb-1 flex-shrink-0" />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your workflow... (Press Enter to generate, Shift+Enter for new line)"
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none font-['Inter'] text-sm leading-relaxed max-h-[120px] min-h-[20px]"
                rows={1}
                disabled={isGenerating}
              />
            </div>
            <button
              onClick={generateWorkflow}
              disabled={!prompt.trim() || isGenerating}
              className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[36px] h-[36px]"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <MdSend className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generation Loader */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999]">
          <div 
            className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
            style={{
              boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), 0 0 100px rgba(236, 72, 153, 0.1)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 animate-pulse"></div>
            
            <div className="relative z-10">
              <div 
                className="w-20 h-20 border-4 border-pink-400 border-t-transparent rounded-full mx-auto animate-spin mb-6"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.6))',
                }}
              ></div>
              <p className="text-2xl font-bold text-white mb-2 font-['Poppins']">{currentGenerationText}</p>
              <p className="text-gray-300 font-['Inter']">Building your workflow...</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Loader Overlay */}
      {isExecuting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999]">
          <div 
            className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
            style={{
              boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), 0 0 100px rgba(236, 72, 153, 0.1)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 animate-pulse"></div>
            
            <div className="relative z-10">
              <div 
                className="w-20 h-20 border-4 border-pink-400 border-t-transparent rounded-full mx-auto animate-spin mb-6"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.6))',
                }}
              ></div>
              <p className="text-2xl font-bold text-white mb-2 font-['Poppins']">{currentLoaderText}</p>
              <p className="text-gray-300 font-['Inter']">Processing your workflow...</p>
            </div>
          </div>
        </div>
      )}

      {/* Execution Result Modal */}
      {executionResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[10000] p-4">
          <div 
            className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden relative"
            style={{
              boxShadow: executionResult.success 
                ? '0 0 50px rgba(34, 197, 94, 0.3), 0 0 100px rgba(34, 197, 94, 0.1)'
                : '0 0 50px rgba(239, 68, 68, 0.3), 0 0 100px rgba(239, 68, 68, 0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className={`${executionResult.success ? 'text-green-400' : 'text-red-400'} font-bold text-2xl font-['Poppins'] flex items-center`}>
                <span className={`w-3 h-3 rounded-full mr-3 ${executionResult.success ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{
                    boxShadow: executionResult.success 
                      ? '0 0 10px rgba(34, 197, 94, 0.5)'
                      : '0 0 10px rgba(239, 68, 68, 0.5)',
                  }}
                ></span>
                {executionResult.success ? 'Execution Success' : 'Execution Failed'}
              </h3>
              <button 
                className="p-2 rounded-full text-gray-400 hover:text-pink-400 hover:bg-gray-700 transition-all duration-300 text-2xl font-bold"
                onClick={() => setExecutionResult(null)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <p className="mb-6 text-gray-200 text-lg font-['Inter'] leading-relaxed">{executionResult.message}</p>
              {executionResult.data && (
                <div className="bg-gray-900 border border-gray-600 p-6 rounded-xl overflow-y-auto max-h-[50vh]">
                  <div className="text-gray-200 prose prose-invert max-w-none">
                    <ReactMarkdown className="text-gray-200">
                      {typeof executionResult.data === 'string' ? executionResult.data : JSON.stringify(executionResult.data, null, 2)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Save Modal */}
      {isTemplateSaveModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[10000] p-4">
          <div 
            className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden"
            style={{
              boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), 0 0 100px rgba(236, 72, 153, 0.1)',
            }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5"></div>
            
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white font-['Poppins']">Save Template</h2>
                <button 
                  className="p-2 rounded-full text-gray-400 hover:text-pink-400 hover:bg-gray-700 transition-all duration-300 text-2xl font-bold"
                  onClick={() => setIsTemplateSaveModalOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  ×
                </button>
              </div>

              {/* Input */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-3 font-['Inter']">Template Name</label>
                <input 
                  type="text" 
                  placeholder="Enter template name..."
                  className="w-full p-4 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-300 font-['Inter']"
                  autoFocus
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(236, 72, 153, 0.3)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                      handleSaveTemplate((e.target as HTMLInputElement).value.trim());
                    }
                  }}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button 
                  className="px-6 py-3 bg-gray-600 text-gray-200 rounded-xl hover:bg-gray-500 transition-all duration-300 font-medium font-['Inter']"
                  onClick={() => setIsTemplateSaveModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-300 font-semibold font-['Poppins'] transform hover:scale-105"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.parentElement?.querySelector('input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleSaveTemplate(input.value.trim());
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(236, 72, 153, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSaveSuccess && (
        <div className="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg border border-green-400 flex items-center gap-2 animate-pulse">
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="font-medium">
            Workflow "{savedTemplateName}" saved successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default PromptPlayground;
