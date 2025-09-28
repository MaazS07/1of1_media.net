// Common response type
export interface ApiResponse {
  message: string;
  [key: string]: any; // Additional data that may be returned
}

// 1. Text Agent API
export interface TextAgentRequest {
  model: string;
  query: string;
  instructions: string;
}

// 2. CSV Agent API
// Note: For FormData, we use a different approach since it's not a JSON payload
export interface CsvAgentParams {
  model: string;
  query: string;
  file: File;
}

// 3. RAG Agent API
export interface RagAgentParams {
  model: string;
  query: string;
  file: File;
}

// 4. Web Search Agent API
export interface WebAgentRequest {
  model: string;
  query: string;
  instructions: string;
}

// 5. Zoom Agent API
export interface ZoomAgentRequest {
  account_id: string;
  client_id: string;
  client_secret: string;
  query: string;
}

// 6. Voice Agent API - No payload required

// New component request types
export interface ComponentRequest {
  model: string;
  query: string;
  instructions: string;
}

export interface JsonProcessorRequest {
  model: string;
  json_data: string;
  operation: string;
}

export interface WebSearchComponentRequest {
  model: string;
  query: string;
  search_engine: string;
}

// API Endpoints mapping
export enum ApiEndpoint {
  TextAgent = 'http://localhost:8000/text_agent',
  CsvAgent = 'http://localhost:8000/csv_agent',
  RagAgent = 'http://localhost:8000/rag_agent',
  WebAgent = 'http://localhost:8000/web_agent',
  ZoomAgent = 'http://localhost:8000/zoom_agent',
  VoiceAgent = 'http://localhost:8000/voice_agent',
  WorkflowAgent = 'http://localhost:8000/workflow_agent',
  // New component endpoints
  ArxivComponent = 'http://localhost:8000/component/arxiv',
  HackerNewsComponent = 'http://localhost:8000/component/hackernews',
  WebSearchComponent = 'http://localhost:8000/component/websearch',
  TextProcessorComponent = 'http://localhost:8000/component/textprocessor',
  JsonComponent = 'http://localhost:8000/component/json',
  PandasComponent = 'http://localhost:8000/component/pandas',
  DuckDBComponent = 'http://localhost:8000/component/duckdb',
  CalculatorComponent = 'http://localhost:8000/component/calculator',
  PythonComponent = 'http://localhost:8000/component/python',
  FileComponent = 'http://localhost:8000/component/file',
  WebScrapingComponent = 'http://localhost:8000/component/webscraping',
  WikipediaComponent = 'http://localhost:8000/component/wikipedia',
  YouTubeComponent = 'http://localhost:8000/component/youtube',
  FinancialComponent = 'http://localhost:8000/component/financial'
}

export interface WorkflowAgentParams {
  session_id: string;
  sender_email: string;
  sender_name: string;
  sender_passkey: string;
  company_name: string;
  product_description: string;
  csv_file: string;
  model: string;
}

export async function sendWorkflowAgentRequest<R = ApiResponse>(
  params: WorkflowAgentParams
): Promise<R> {
  const formData = new FormData();
  formData.append("session_id", params.session_id);
  formData.append("sender_email", params.sender_email);
  formData.append("sender_name", params.sender_name);
  formData.append("sender_passkey", params.sender_passkey);
  formData.append("company_name", params.company_name);
  formData.append("product_description", params.product_description);
  formData.append("csv_file", params.csv_file);
  formData.append("model", params.model);

  const response = await fetch(ApiEndpoint.WorkflowAgent, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Helper function for JSON payload APIs
export async function sendJsonRequest<T, R = ApiResponse>(
  endpoint: ApiEndpoint, 
  payload: T
): Promise<R> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Helper function for FormData payload APIs
export async function sendFormDataRequest<R = ApiResponse>(
  endpoint: ApiEndpoint, 
  params: CsvAgentParams | RagAgentParams
): Promise<R> {
  const formData = new FormData();
  formData.append('model', params.model);
  formData.append('query', params.query);
  formData.append('file', params.file);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Voice agent request (no payload)
export async function sendVoiceAgentRequest<R = ApiResponse>(): Promise<R> {
  const response = await fetch(ApiEndpoint.VoiceAgent, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}