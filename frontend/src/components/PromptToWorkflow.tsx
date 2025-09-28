// components/PromptToWorkflow.tsx
import React, { useState, useRef, useEffect } from 'react';
import { NodeData, EdgeData } from '../types/nodeTypes';
import { FaRobot } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';
import { BiMessageDetail } from 'react-icons/bi';
import { BsMicFill, BsFileEarmarkText, BsFileEarmark } from 'react-icons/bs';
import { MdEmail, MdTextFields, MdOutlineOutput } from 'react-icons/md';
import { FiPaperclip, FiSearch } from 'react-icons/fi';
import { AiOutlineSound } from 'react-icons/ai';
import { FaDatabase } from 'react-icons/fa';

// Same nodeTemplates as PromptPlayground...
// Same nodeTemplates as PromptPlayground...
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

interface PromptToWorkflowProps {
  onWorkflowGenerated: (nodes: NodeData[], edges: EdgeData[]) => void;
  isVisible: boolean;
  onClose: () => void;
}

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

const PromptToWorkflow: React.FC<PromptToWorkflowProps> = ({
  onWorkflowGenerated,
  isVisible,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  // Convert workflow node to NodeData format
  const convertWorkflowNodeToNodeData = (workflowNode: WorkflowNode): NodeData => {
    const mappedType = nodeTypeMapping[workflowNode.type] || 'Text-Agent';
    const template = nodeTemplates[mappedType];
    
    if (!template) {
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

    const inputs = template.inputs.map((templateInput, index) => {
      const workflowInput = workflowNode.inputs.find(wi => wi.name.toLowerCase() === templateInput.name.toLowerCase()) || workflowNode.inputs[index];
      return {
        ...templateInput,
        id: `${workflowNode.id}-input-${index}`,
        name: templateInput.name,
        value: workflowInput?.default_value || null
      };
    });

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
      return {
        id: workflowEdge.id,
        source: workflowEdge.source,
        sourceHandle: `${workflowEdge.source}-output-0`,
        target: workflowEdge.target,
        targetHandle: `${workflowEdge.target}-input-0`
      };
    }

    const sourceOutputIndex = sourceNode.data.outputs.findIndex(
      o => o.name.toLowerCase().includes(workflowEdge.source_output.toLowerCase()) ||
           workflowEdge.source_output.toLowerCase().includes(o.name.toLowerCase())
    );
    const targetInputIndex = targetNode.data.inputs.findIndex(
      i => i.name.toLowerCase().includes(workflowEdge.target_input.toLowerCase()) ||
           workflowEdge.target_input.toLowerCase().includes(i.name.toLowerCase())
    );

    const finalSourceIndex = sourceOutputIndex >= 0 ? sourceOutputIndex : 0;
    const finalTargetIndex = targetInputIndex >= 0 ? targetInputIndex : 2;

    return {
      id: workflowEdge.id,
      source: workflowEdge.source,
      sourceHandle: `${workflowEdge.source}-output-${finalSourceIndex}`,
      target: workflowEdge.target,
      targetHandle: `${workflowEdge.target}-input-${finalTargetIndex}`
    };
  };

  const generateWorkflow = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    setTimeout(() => {
      let sampleWorkflow: WorkflowResponse;

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
              "position": {"x": 400, "y": 300}
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
              "position": {"x": 700, "y": 300}
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
              "position": {"x": 1000, "y": 300}
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
              "position": {"x": 400, "y": 600}
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
              "position": {"x": 700, "y": 600}
            },
            {
              "id": "output_1",
              "type": "text_output",
              "name": "Final Result",
              "config": {},
              "inputs": [{ "name": "Text", "type": "string", "required": true }],
              "outputs": [{ "name": "Output", "type": "string" }],
              "position": {"x": 1000, "y": 600}
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
      
      onWorkflowGenerated(convertedNodes, convertedEdges);
      setIsGenerating(false);
      onClose();
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateWorkflow();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[10000] p-4">
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden"
        style={{
          boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), 0 0 100px rgba(236, 72, 153, 0.1)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <FaRobot className="w-6 h-6 text-pink-400" />
              <div>
                <h2 className="text-2xl font-bold text-white font-['Poppins']">
                  AI Workflow Generator
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Describe your workflow in natural language
                </p>
              </div>
            </div>
            <button 
              className="p-2 rounded-full text-gray-400 hover:text-pink-400 hover:bg-gray-700 transition-all duration-300 text-2xl font-bold"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-end gap-3 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-pink-400 transition-all duration-300 p-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your workflow... (e.g., 'Create an email automation that processes CSV data')"
                  className="w-full bg-transparent text-white placeholder-white resize-none outline-none font-['Inter'] text-sm leading-relaxed max-h-[120px] min-h-[20px]"
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
            
            <div className="mt-4 text-xs text-gray-400 text-center">
              Press Enter to generate • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptToWorkflow;
