export interface ConnectionPattern {
  nodeConnection: string;
  portConnection: string;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  requiredNodeTypes: string[];
  connections: ConnectionPattern[];
  endpoint: string;
}

export const workflowPatterns: WorkflowPattern[] = [
  // Email Marketing - most complex (6 nodes, 6 connections)
  {
    id: 'email-marketing',
    name: 'Email Marketing Workflow',
    requiredNodeTypes: [
      'File-Input-Tool', 
      'CSV-Agent', 
      'Text-Input-Tool', 
      'Text-Agent', 
      'Email-Tool', 
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'CSV-Agent→Text-Agent',
        portConnection: 'Personal Description→Tools' 
      },
      { 
        nodeConnection: 'CSV-Agent→Email-Tool',
        portConnection: 'Receiver Emails→Receiver Emails' 
      },
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Instructions' 
      },
      { 
        nodeConnection: 'Text-Agent→Email-Tool',
        portConnection: 'Output→Email Description' 
      },
      { 
        nodeConnection: 'Email-Tool→End',
        portConnection: 'Status→End' 
      }
    ],
    endpoint: 'http://localhost:8000/workflow_agent'
  },
  // Marketing Cold Caller (5 nodes, 4 connections)
  {
    id: 'marketing-cold-caller',
    name: 'Marketing Cold Caller Workflow',
    requiredNodeTypes: [
      'File-Input-Tool', 
      'CSV-Agent', 
      'Voice-Agent', 
      'WhatsApp-Tool', 
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'WhatsApp-Tool→Voice-Agent',
        portConnection: 'Output→Tools' 
      },
      { 
        nodeConnection: 'CSV-Agent→Voice-Agent',
        portConnection: 'Personal Description→Instructions' 
      },
      { 
        nodeConnection: 'Voice-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/voice_agent'
  },
  // CSV Agent (4 nodes, 3 connections)
  {
    id: 'csv-agent',
    name: 'CSV Agent Workflow',
    requiredNodeTypes: [
      'CSV-Agent',
      'File-Input-Tool',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'File-Input-Tool→CSV-Agent',
        portConnection: 'File→File' 
      },
      { 
        nodeConnection: 'Text-Input-Tool→CSV-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'CSV-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/csv_agent'
  },
  // Web Search (4 nodes, 3 connections)
  {
    id: 'web-search',
    name: 'Web Search Workflow',
    requiredNodeTypes: [
      'Web-Search-Tool',
      'Text-Agent',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Web-Search-Tool→Text-Agent',
        portConnection: 'Tool→Tools' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/web_agent'
  },
  // RAG (4 nodes, 3 connections)
  {
    id: 'rag',
    name: 'RAG Workflow',
    requiredNodeTypes: [
      'Text-Agent',
      'Text-Input-Tool',
      'Knowledge-Base',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Knowledge-Base→Text-Agent',
        portConnection: 'Content→Tools' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/rag_agent'
  },
  // Text Agent (3 nodes, 2 connections)
  {
    id: 'text-agent',
    name: 'Text Agent Workflow',
    requiredNodeTypes: [
      'Text-Agent',
      'Text-Input-Tool',
      'End'
    ],
    connections: [
      { 
        nodeConnection: 'Text-Input-Tool→Text-Agent',
        portConnection: 'Text→Query' 
      },
      { 
        nodeConnection: 'Text-Agent→End',
        portConnection: 'Output→End' 
      }
    ],
    endpoint: 'http://localhost:8000/text_agent'
  },
  // Zoom Tool (2 nodes, 1 connection)
  {
    id: 'zoom-tool',
    name: 'Zoom Agent',
    requiredNodeTypes: [
      'Zoom-Tool',
      'End'
    ],
    connections: [
      {
        nodeConnection: 'Zoom-Tool→End',
        portConnection: 'Output→End'
      }
    ],
    endpoint: 'http://localhost:8000/zoom_agent'
  },
  // ========== NEW SEARCH COMPONENT PATTERNS ==========
  {
    id: 'arxiv-search',
    name: 'ArXiv Search',
    requiredNodeTypes: ['ArXiv-Search', 'End'],
    connections: [
      { nodeConnection: 'ArXiv-Search→End', portConnection: 'Papers→End' }
    ],
    endpoint: 'http://localhost:8000/component/arxiv'
  },
  {
    id: 'hackernews-search',
    name: 'HackerNews Search',
    requiredNodeTypes: ['HackerNews-Search', 'End'],
    connections: [
      { nodeConnection: 'HackerNews-Search→End', portConnection: 'Stories→End' }
    ],
    endpoint: 'http://localhost:8000/component/hackernews'
  },

  // ========== DATA PROCESSING COMPONENT PATTERNS ==========
  {
    id: 'pandas-data',
    name: 'Pandas Data Analysis',
    requiredNodeTypes: ['Pandas-Data', 'End'],
    connections: [
      { nodeConnection: 'Pandas-Data→End', portConnection: 'Analysis→End' }
    ],
    endpoint: 'http://localhost:8000/component/pandas'
  },
  {
    id: 'duckdb-sql',
    name: 'DuckDB SQL Analysis',
    requiredNodeTypes: ['DuckDB-SQL', 'End'],
    connections: [
      { nodeConnection: 'DuckDB-SQL→End', portConnection: 'SQL Results→End' }
    ],
    endpoint: 'http://localhost:8000/component/duckdb'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    requiredNodeTypes: ['Calculator', 'End'],
    connections: [
      { nodeConnection: 'Calculator→End', portConnection: 'Result→End' }
    ],
    endpoint: 'http://localhost:8000/component/calculator'
  },
  {
    id: 'text-processor',
    name: 'Text Processor',
    requiredNodeTypes: ['Text-Processor', 'End'],
    connections: [
      { nodeConnection: 'Text-Processor→End', portConnection: 'Processed Text→End' }
    ],
    endpoint: 'http://localhost:8000/component/textprocessor'
  },
  {
    id: 'json-processor',
    name: 'JSON Processor',
    requiredNodeTypes: ['JSON-Processor', 'End'],
    connections: [
      { nodeConnection: 'JSON-Processor→End', portConnection: 'Processed JSON→End' }
    ],
    endpoint: 'http://localhost:8000/component/json'
  },
  // ========== SYSTEM/CODE COMPONENT PATTERNS ==========
  {
    id: 'python-code',
    name: 'Python Code Execution',
    requiredNodeTypes: ['Python-Code', 'End'],
    connections: [
      { nodeConnection: 'Python-Code→End', portConnection: 'Execution Result→End' }
    ],
    endpoint: 'http://localhost:8000/component/python'
  },

  {
    id: 'file-operations',
    name: 'File Operations',
    requiredNodeTypes: ['File-Operations', 'End'],
    connections: [
      { nodeConnection: 'File-Operations→End', portConnection: 'Result→End' }
    ],
    endpoint: 'http://localhost:8000/component/file'
  },
  // ========== WEB & RESEARCH COMPONENT PATTERNS ==========
  {
    id: 'web-scraping',
    name: 'Web Scraping',
    requiredNodeTypes: ['Web-Scraping', 'End'],
    connections: [
      { nodeConnection: 'Web-Scraping→End', portConnection: 'Content→End' }
    ],
    endpoint: 'http://localhost:8000/component/webscraping'
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia Research',
    requiredNodeTypes: ['Wikipedia', 'End'],
    connections: [
      { nodeConnection: 'Wikipedia→End', portConnection: 'Information→End' }
    ],
    endpoint: 'http://localhost:8000/component/wikipedia'
  },
  {
    id: 'youtube',
    name: 'YouTube Analysis',
    requiredNodeTypes: ['YouTube', 'End'],
    connections: [
      { nodeConnection: 'YouTube→End', portConnection: 'Analysis→End' }
    ],
    endpoint: 'http://localhost:8000/component/youtube'
  },
  // ========== FINANCIAL & UTILITY COMPONENT PATTERNS ==========
  {
    id: 'financial-analysis',
    name: 'Financial Analysis',
    requiredNodeTypes: ['Financial-Analysis', 'End'],
    connections: [
      { nodeConnection: 'Financial-Analysis→End', portConnection: 'Analysis→End' }
    ],
    endpoint: 'http://localhost:8000/component/financial'
  },

  {
    id: 'local-filesystem',
    name: 'Local File System',
    requiredNodeTypes: ['Local-FileSystem', 'End'],
    connections: [
      { nodeConnection: 'Local-FileSystem→End', portConnection: 'Result→End' }
    ],
    endpoint: 'http://localhost:8000/component/localfs'
  }
];