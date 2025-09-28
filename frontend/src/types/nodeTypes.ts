export interface Position {
  x: number;
  y: number;
}

export type DataType = 'string' | 'number' | 'boolean' | 'file' | 'array' | 'object' | 'none';

export interface NodeField {
  id: string;
  name: string;
  type: DataType;
  fieldType: 'input' | 'output';
  display: string;
  value?: any;
  options?: string[]; // For dropdown type
}

export interface NodeData {
  id: string;
  type: string;
  position: Position;
  data: {
    label: string;
    inputs: NodeField[];
    outputs: NodeField[];
    [key: string]: any;
  };
}

export interface EdgeData {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}