import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/playground/Sidebar';
import Workspace from '../components/playground/Workspace';
import CustomToolsSidebar from '../components/playground/CustomToolsSidebar';
import { NodeData, EdgeData } from '../types/nodeTypes';
import { workflowPatterns } from '../utils/workflowPatterns';
import { 
  ApiEndpoint, 
  TextAgentRequest, 
  sendJsonRequest,
  sendFormDataRequest,
  ApiResponse,
  ComponentRequest,
  JsonProcessorRequest
} from '../types/apiTypes';
import { BiMessageDetail } from 'react-icons/bi';
import { BsMicFill, BsFileEarmarkText, BsFileEarmark } from 'react-icons/bs';
import { MdEmail, MdTextFields, MdOutlineOutput, MdCalculate } from 'react-icons/md';
import { FiPaperclip, FiSearch, FiFile, FiCloud, FiDollarSign } from 'react-icons/fi';
import { AiOutlineSound } from 'react-icons/ai';
import { FaDatabase, FaPython, FaYoutube, FaWikipediaW } from 'react-icons/fa';
import { SiHackaday, SiArxiv, SiPandas, SiDuckdb, SiJson } from 'react-icons/si';
import { BsTerminal } from 'react-icons/bs';
import ReactMarkdown from 'react-markdown';

interface Template {
  id: string;
  name: string;
  nodes: NodeData[];
  edges: EdgeData[];
  createdAt: string;
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
    inputs: [],
    outputs: [
      { id: 'output-1', name: 'Tool', type: 'string', fieldType: 'output', display: false }
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
  "Zoom-Tool": {   // new Zoom-Tool template
    inputs: [
        { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' }
    ],
    outputs: [
        { id: 'output-1', name: 'Output', type: 'string', fieldType: 'output', display: false }
    ],
    icon: AiOutlineSound
  },
  // ========== SEARCH COMPONENTS ==========
  "ArXiv-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Papers', type: 'string', fieldType: 'output' }
    ],
    icon: SiArxiv
  },
  "HackerNews-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Stories', type: 'string', fieldType: 'output' }
    ],
    icon: SiHackaday
  },
  "Web-Search": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Search Engine', type: 'string', fieldType: 'input', options: ['google', 'duckduckgo'] },
      { id: 'input-3', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Results', type: 'string', fieldType: 'output' }
    ],
    icon: FiSearch
  },
  // ========== DATA PROCESSING COMPONENTS ==========
  "Pandas-Data": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Analysis', type: 'string', fieldType: 'output' }
    ],
    icon: SiPandas
  },
  "DuckDB-SQL": {
    inputs: [
      { id: 'input-1', name: 'Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'SQL Results', type: 'string', fieldType: 'output' }
    ],
    icon: SiDuckdb
  },
  "Calculator": {
    inputs: [
      { id: 'input-1', name: 'Expression', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Result', type: 'number', fieldType: 'output' }
    ],
    icon: MdCalculate
  },
  "JSON-Processor": {
    inputs: [
      { id: 'input-1', name: 'JSON Data', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'Operation', type: 'string', fieldType: 'input' },
      { id: 'input-3', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Result', type: 'string', fieldType: 'output' }
    ],
    icon: SiJson
  },
  // ========== SYSTEM/CODE COMPONENTS ==========
  "Python-Code": {
    inputs: [
      { id: 'input-1', name: 'Code Request', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Execution Result', type: 'string', fieldType: 'output' }
    ],
    icon: FaPython
  },
  "File-Operations": {
    inputs: [
      { id: 'input-1', name: 'Operation', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Result', type: 'string', fieldType: 'output' }
    ],
    icon: FiFile
  },
  "Text-Processor": {
    inputs: [
      { id: 'input-1', name: 'Text', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Processed Text', type: 'string', fieldType: 'output' }
    ],
    icon: MdTextFields
  },
  // ========== WEB & RESEARCH COMPONENTS ==========
  "Web-Scraping": {
    inputs: [
      { id: 'input-1', name: 'URL', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Content', type: 'string', fieldType: 'output' }
    ],
    icon: FiCloud
  },
  "Wikipedia": {
    inputs: [
      { id: 'input-1', name: 'Topic', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Information', type: 'string', fieldType: 'output' }
    ],
    icon: FaWikipediaW
  },
  "YouTube": {
    inputs: [
      { id: 'input-1', name: 'Video Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Analysis', type: 'string', fieldType: 'output' }
    ],
    icon: FaYoutube
  },
  // ========== FINANCIAL COMPONENTS ==========
  "Financial-Analysis": {
    inputs: [
      { id: 'input-1', name: 'Symbol/Query', type: 'string', fieldType: 'input' },
      { id: 'input-2', name: 'LLM', type: 'string', fieldType: 'input', options: ['Groq', 'Gemini'] }
    ],
    outputs: [
      { id: 'output-1', name: 'Analysis', type: 'string', fieldType: 'output' }
    ],
    icon: FiDollarSign
  }
};

const Playground = () => {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateSaveModalOpen, setIsTemplateSaveModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [isCustomToolsSidebarOpen, setIsCustomToolsSidebarOpen] = useState(false);
  // Loader text state for animated messages while executing
  const loaderMessages = ["Initializing workflows...", "Processing nodes...", "Executing pipeline...", "Almost ready..."];
  const [currentLoaderText, setCurrentLoaderText] = useState(loaderMessages[0]);
  const navigate = useNavigate();

  // Clean up invalid edges when nodes change
  useEffect(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(edge => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
    
    if (invalidEdges.length > 0) {
      console.log(`Cleaning up ${invalidEdges.length} invalid edges`);
      const validEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));
      setEdges(validEdges);
    }
  }, [nodes.length, nodes.map(n => n.id).join(',')]); // Only run when nodes actually change

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

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
      localStorage.setItem('d2k-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const handleSaveTemplate = (templateName: string) => {
    if (!templateName.trim()) return;

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
    
    setTemplates(prev => [...prev, newTemplate]);
    setIsTemplateSaveModalOpen(false);
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
      console.log('Workflow payload:', payload);
    }
  }, [edges, nodes]);

  const checkWorkflowPattern = (nodes: NodeData[], edges: EdgeData[], patternId: string): boolean => {
    const pattern = workflowPatterns.find(p => p.id === patternId);
    if (!pattern) return false;
    
    // Strict check: pattern must have EXACTLY the same node types (no more, no less)
    const patternNodeTypes = [...pattern.requiredNodeTypes].sort();
    const workflowNodeTypes = [...new Set(nodes.map(n => n.type))].sort();
    
    // If the node types don't match exactly, this is not the pattern
    if (patternNodeTypes.length !== workflowNodeTypes.length || 
        !patternNodeTypes.every((type, index) => type === workflowNodeTypes[index])) {
      return false;
    }
    
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
      // Check if there's an End node in the workflow
      const hasEndNode = nodes.some(node => node.type === "End");
      if (!hasEndNode) {
        throw new Error("Workflow must have an End component to complete the execution.");
      }

      // First try to detect predefined patterns for backward compatibility
      const detectedPattern = detectWorkflowPattern(nodes, edges);
      console.log("Workflow nodes:", nodes.map(n => n.type));
      console.log("Workflow edges:", edges.map(e => `${nodes.find(n => n.id === e.source)?.type} → ${nodes.find(n => n.id === e.target)?.type}`));
      
      if (detectedPattern) {
        console.log(`${detectedPattern.patternId} pattern detected - calling ${detectedPattern.endpoint}`);
      } else {
        console.log("No predefined pattern detected - using dynamic workflow execution");
      }
      let response;
      let result;
      switch (detectedPattern?.patternId) {
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
        case 'csv-agent': {
          const csvAgentNode = nodes.find(node => node.type === 'CSV-Agent');
          const fileInputNode = nodes.find(node => node.type === 'File-Input-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!csvAgentNode || !fileInputNode) {
            throw new Error("Missing required nodes for CSV Agent workflow");
          }
          const queryValue = textInputNode?.data.inputs.find(input => input.name === 'Text')?.value || '';
          const fileInput = fileInputNode.data.inputs.find(input => input.name === 'File');
          const fileValue = fileInput?.value;
          console.log("File value:", fileValue);
          if (!fileValue) {
            throw new Error("No file selected for CSV Agent. Please upload a file.");
          }
          if (!(fileValue instanceof File) || fileValue.size === 0) {
            throw new Error("Please select a valid CSV file with content (not just a filename)");
          }
          result = await sendFormDataRequest<ApiResponse>(
            ApiEndpoint.CsvAgent,
            { model: "gemini", query: queryValue, file: fileValue }
          );
          console.log('Execution result:', result);
          break;
        }
        case 'rag': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const knowledgeBaseNode = nodes.find(node => node.type === 'Knowledge-Base');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !knowledgeBaseNode || !textInputNode) {
            throw new Error("Missing required nodes for RAG workflow");
          }
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const fileInput = knowledgeBaseNode.data.inputs.find(input => input.name === 'File');
          const fileValue = fileInput?.value;
          if (!fileValue) {
            throw new Error("No file selected for Knowledge Base");
          }
          const formData = new FormData();
          formData.append("model", "gemini");
          formData.append("query", queryValue);
          formData.append("file", fileValue);
          response = await fetch(detectedPattern.endpoint, {
            method: 'POST',
            body: formData
          });
          break;
        }
        case 'web-search': {
          const textAgentNode = nodes.find(node => node.type === 'Text-Agent');
          const webSearchNode = nodes.find(node => node.type === 'Web-Search-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!textAgentNode || !webSearchNode || !textInputNode) {
            throw new Error("Missing required nodes for Web Search workflow");
          }
          const queryValue = textInputNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const modelInput = textAgentNode.data.inputs.find(input => input.name === 'LLM');
          const instructionsInput = textAgentNode.data.inputs.find(input => input.name === 'Instructions');
          const payload = {
            model: modelInput?.value || "gemini",
            query: queryValue,
            instructions: instructionsInput?.value || ""
          };
          response = await fetch(detectedPattern.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          break;
        }
        case 'marketing-cold-caller': {
          response = await fetch(detectedPattern.endpoint, { method: 'POST' });
          break;
        }
        case 'email-marketing': {
          // Extract required nodes
          const emailAgentNode = nodes.find(node => node.type === 'Email-Tool');
          const fileInputNode = nodes.find(node => node.type === 'File-Input-Tool');
          const textInputNode = nodes.find(node => node.type === 'Text-Input-Tool');
          if (!emailAgentNode || !fileInputNode) {
            throw new Error("Missing required nodes for Email Marketing workflow");
          }
          const senderEmail = emailAgentNode.data.inputs.find(input => input.name === 'Sender Mail')?.value || "";
          const senderName = emailAgentNode.data.inputs.find(input => input.name === "Sender's Name")?.value || "";
          const senderPasskey = emailAgentNode.data.inputs.find(input => input.name === 'Passkey')?.value || "";
          
          const fileInput = fileInputNode.data.inputs.find(input => input.name === 'File');
          const csvFile = fileInput?.value;
          if (!csvFile) {
            throw new Error("No file selected for Email Marketing workflow");
          }
          
          if (!(csvFile instanceof File) || csvFile.size === 0) {
            throw new Error("Please select a valid CSV file with content (not just a filename)");
          }
          
          const productDescription = textInputNode?.data.inputs.find(input => input.name === 'Text')?.value || "Default Product Description";
          
          // Prepare FormData for sending the actual file
          const formData = new FormData();
          formData.append("session_id", "marketing_campaign_222");
          formData.append("sender_email", senderEmail || "darkbeast645@gmail.com");
          formData.append("sender_name", senderName || "Raviraj");
          formData.append("sender_passkey", senderPasskey || "iaes xvos crlr zvlu");
          formData.append("company_name", "PowerLook");
          formData.append("product_description", productDescription);
          formData.append("use_cached_results", "true");
          formData.append("max_retries", "3");
          formData.append("retry_delay", "5");
          formData.append("file", csvFile);
          
          // Send the actual FormData request
          const response = await fetch(ApiEndpoint.WorkflowAgent, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          result = await response.json();
          break;
        }
        case 'zoom-tool': { // New Zoom Agent workflow pattern branch
          const zoomToolNode = nodes.find(node => node.type === 'Zoom-Tool');
          if (!zoomToolNode) {
            throw new Error("Missing Zoom-Tool node for Zoom Agent workflow");
          }
          const queryValue = zoomToolNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          // Hardcoded parameters for the Zoom Agent API
          const payload = {
            account_id: "pXfzC-OvToyumpB3e5G5zg",
            client_id: "ZhVZkp8xSKuRepA2HCmmg",
            client_secret: "BcQHU2Tt64ud3VkLhwzf2wVX3fUPUVET",
            query: queryValue
          };
          console.log("Sending Zoom agent request:", payload);
          result = await sendJsonRequest(ApiEndpoint.ZoomAgent, payload);
          break;
        }
        // ========== NEW SEARCH COMPONENT CASES ==========
        case 'arxiv-search': {
          const arxivNode = nodes.find(node => node.type === 'ArXiv-Search');
          if (!arxivNode) {
            throw new Error("Missing ArXiv-Search node");
          }
          const queryValue = arxivNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          const modelValue = arxivNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.ArxivComponent, payload);
          break;
        }
        case 'hackernews-search': {
          const hackerNewsNode = nodes.find(node => node.type === 'HackerNews-Search');
          if (!hackerNewsNode) {
            throw new Error("Missing HackerNews-Search node");
          }
          const queryValue = hackerNewsNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          const modelValue = hackerNewsNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.HackerNewsComponent, payload);
          break;
        }
        case 'text-processor': {
          const textProcessorNode = nodes.find(node => node.type === 'Text-Processor');
          if (!textProcessorNode) {
            throw new Error("Missing Text-Processor node");
          }
          const queryValue = textProcessorNode.data.inputs.find(input => input.name === 'Text')?.value || '';
          const modelValue = textProcessorNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.TextProcessorComponent, payload);
          break;
        }
        // ========== DATA PROCESSING COMPONENT CASES ==========
        case 'pandas-data': {
          const pandasNode = nodes.find(node => node.type === 'Pandas-Data');
          if (!pandasNode) {
            throw new Error("Missing Pandas-Data node");
          }
          const queryValue = pandasNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          const modelValue = pandasNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.PandasComponent, payload);
          break;
        }
        case 'duckdb-sql': {
          const duckdbNode = nodes.find(node => node.type === 'DuckDB-SQL');
          if (!duckdbNode) {
            throw new Error("Missing DuckDB-SQL node");
          }
          const queryValue = duckdbNode.data.inputs.find(input => input.name === 'Query')?.value || '';
          const modelValue = duckdbNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.DuckDBComponent, payload);
          break;
        }
        case 'calculator': {
          const calculatorNode = nodes.find(node => node.type === 'Calculator');
          if (!calculatorNode) {
            throw new Error("Missing Calculator node");
          }
          const queryValue = calculatorNode.data.inputs.find(input => input.name === 'Expression')?.value || '';
          const modelValue = calculatorNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.CalculatorComponent, payload);
          break;
        }
        case 'json-processor': {
          const jsonNode = nodes.find(node => node.type === 'JSON-Processor');
          if (!jsonNode) {
            throw new Error("Missing JSON-Processor node");
          }
          const jsonDataValue = jsonNode.data.inputs.find(input => input.name === 'JSON Data')?.value || '';
          const operationValue = jsonNode.data.inputs.find(input => input.name === 'Operation')?.value || '';
          const modelValue = jsonNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: JsonProcessorRequest = { model: modelValue, json_data: jsonDataValue, operation: operationValue };
          result = await sendJsonRequest(ApiEndpoint.JsonComponent, payload);
          break;
        }
        // ========== SYSTEM/CODE COMPONENT CASES ==========
        case 'python-code': {
          const pythonNode = nodes.find(node => node.type === 'Python-Code');
          if (!pythonNode) {
            throw new Error("Missing Python-Code node");
          }
          const queryValue = pythonNode.data.inputs.find(input => input.name === 'Code Request')?.value || '';
          const modelValue = pythonNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.PythonComponent, payload);
          break;
        }
        case 'file-operations': {
          const fileNode = nodes.find(node => node.type === 'File-Operations');
          if (!fileNode) {
            throw new Error("Missing File-Operations node");
          }
          const queryValue = fileNode.data.inputs.find(input => input.name === 'Operation')?.value || '';
          const modelValue = fileNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.FileComponent, payload);
          break;
        }
        // ========== WEB & RESEARCH COMPONENT CASES ==========
        case 'web-scraping': {
          const webScrapingNode = nodes.find(node => node.type === 'Web-Scraping');
          if (!webScrapingNode) {
            throw new Error("Missing Web-Scraping node");
          }
          const queryValue = webScrapingNode.data.inputs.find(input => input.name === 'URL')?.value || '';
          const modelValue = webScrapingNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.WebScrapingComponent, payload);
          break;
        }
        case 'wikipedia': {
          const wikipediaNode = nodes.find(node => node.type === 'Wikipedia');
          if (!wikipediaNode) {
            throw new Error("Missing Wikipedia node");
          }
          const queryValue = wikipediaNode.data.inputs.find(input => input.name === 'Topic')?.value || '';
          const modelValue = wikipediaNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.WikipediaComponent, payload);
          break;
        }
        case 'youtube': {
          const youtubeNode = nodes.find(node => node.type === 'YouTube');
          if (!youtubeNode) {
            throw new Error("Missing YouTube node");
          }
          const queryValue = youtubeNode.data.inputs.find(input => input.name === 'Video Query')?.value || '';
          const modelValue = youtubeNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.YouTubeComponent, payload);
          break;
        }
        // ========== FINANCIAL & UTILITY COMPONENT CASES ==========
        case 'financial-analysis': {
          const financialNode = nodes.find(node => node.type === 'Financial-Analysis');
          if (!financialNode) {
            throw new Error("Missing Financial-Analysis node");
          }
          const queryValue = financialNode.data.inputs.find(input => input.name === 'Symbol/Query')?.value || '';
          const modelValue = financialNode.data.inputs.find(input => input.name === 'LLM')?.value || 'gemini';
          const payload: ComponentRequest = { model: modelValue, query: queryValue, instructions: '' };
          result = await sendJsonRequest(ApiEndpoint.FinancialComponent, payload);
          break;
        }
        case null:
        case undefined:
        default: {
          if (detectedPattern) {
            const payload = { nodes: prepareNodeData(), edges: edges };
            response = await fetch(detectedPattern.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } else {
            // Use dynamic workflow execution for component chaining
            console.log("Using dynamic workflow execution for Wikipedia -> Text Agent -> End");
            
            // Clean up invalid edges before sending
            const nodeIds = new Set(nodes.map(n => n.id));
            const validEdges = edges.filter(edge => {
              const isValid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
              if (!isValid) {
                console.log(`Removing invalid edge: ${edge.source} -> ${edge.target} (missing node)`);
              }
              return isValid;
            });
            
            console.log(`Cleaned edges: ${edges.length} -> ${validEdges.length}`);
            
            const payload = { nodes: prepareNodeData(), edges: validEdges };
            response = await fetch('http://localhost:8000/execute_dynamic_workflow', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
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

      {/* Custom Tools Floating Button */}
      <button
        onClick={() => setIsCustomToolsSidebarOpen(true)}
        className="fixed bottom-30 right-6 w-14 h-14 bg-gradient-to-r from-white-900 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-30 flex items-center justify-center"
        style={{
          boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(236, 72, 153, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(236, 72, 153, 0.4)';
        }}
        title="Custom Tools"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </button>

      {/* Custom Tools Sidebar */}
      <CustomToolsSidebar 
        isOpen={isCustomToolsSidebarOpen}
        onClose={() => setIsCustomToolsSidebarOpen(false)}
      />

      {/* Loader Overlay */}
      {isExecuting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999]">
          <div 
            className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
            style={{
              boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), 0 0 100px rgba(236, 72, 153, 0.1)',
            }}
          >
            {/* Animated background gradient */}
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
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="text-gray-200">{children}</p>,
                        h1: ({children}) => <h1 className="text-gray-200">{children}</h1>, 
                        h2: ({children}) => <h2 className="text-gray-200">{children}</h2>,
                        h3: ({children}) => <h3 className="text-gray-200">{children}</h3>,
                        li: ({children}) => <li className="text-gray-200">{children}</li>,
                        ul: ({children}) => <ul className="text-gray-200">{children}</ul>,
                        ol: ({children}) => <ol className="text-gray-200">{children}</ol>,
                        code: ({children}) => <code className="text-gray-200 bg-gray-800 px-1 rounded">{children}</code>,
                        pre: ({children}) => <pre className="text-gray-200 bg-gray-800 p-2 rounded overflow-x-auto">{children}</pre>
                      }}
                    >
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
    </div>
  );
};

export default Playground;