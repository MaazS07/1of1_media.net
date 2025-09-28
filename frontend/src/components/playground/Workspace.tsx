import React, { useRef, useState, useEffect, Dispatch, SetStateAction } from "react";
import { NodeData, EdgeData, Position, NodeField } from '../../types/nodeTypes';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FieldPositions {
  [key: string]: Position;
}

interface ConnectionState {
  nodeId: string;
  fieldId: string;
  type: "input" | "output";
}

interface WorkspaceProps {
  nodes: NodeData[];
  setNodes: Dispatch<SetStateAction<NodeData[]>>;
  edges: EdgeData[];
  onAddEdge: (edge: EdgeData) => void;
  onRemoveEdge: (edgeId: string) => void;
  onNodeDrop?: (nodeType: string, position: Position) => void;
  onSaveTemplate?: () => void;
  onViewTemplates?: () => void;
  onPlayClick?: () => void;
  isExecuting?: boolean;
  executionResult?: { success: boolean; message: string; data?: any } | null;
}



const Workspace: React.FC<WorkspaceProps> = (props) => {
  const {
    nodes = [],
    setNodes,
    edges = [],
    onAddEdge = (_edge: EdgeData) => {},
    onRemoveEdge = (_edgeId: string) => {},
    onNodeDrop = (_nodeType: string, _position: Position) => {},
    onSaveTemplate = () => {},
    onViewTemplates = () => {},
    onPlayClick = () => {},
    isExecuting = false,
    executionResult = null,
  } = props;
    const workspaceRef = useRef<HTMLDivElement | null>(null);
  const transformContainerRef = useRef<HTMLDivElement>(null);
  const draggingNodeRef = useRef<string | null>(null);
  const updatePositionRequestRef = useRef<number | null>(null);
  const [connectionStart, setConnectionStart] = useState<ConnectionState | null>(null);
  const [mousePosition, setMousePosition] = useState<Position>({ x: 0, y: 0 });
  const [fieldPositions, setFieldPositions] = useState<FieldPositions>({});
  const [snapFieldId, setSnapFieldId] = useState<string | null>(null);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;

  useEffect(() => {
    console.log("Edges are:", edges);
  }, [edges]);

  useEffect(() => {
    console.log("Nodes are:", nodes.length, nodes.map(n => n.id));
  }, [nodes]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (updatePositionRequestRef.current) {
        cancelAnimationFrame(updatePositionRequestRef.current);
      }
    };
  }, []);

  // Update field positions when nodes change or when zoom/pan changes
 useEffect(() => {
  const updateFieldPositions = () => {
    const newPositions: FieldPositions = {};

    document.querySelectorAll("[data-field-id]").forEach((elem) => {
      const fieldId = elem.getAttribute("data-field-id");
      const rect = elem.getBoundingClientRect();
      const workspaceRect = workspaceRef.current?.getBoundingClientRect();

      if (fieldId && workspaceRect) {
        newPositions[fieldId] = {
          x:
            (rect.left + rect.width / 2 - workspaceRect.left) / scale -
            offset.x,
          y:
            (rect.top + rect.height / 2 - workspaceRect.top) / scale -
            offset.y,
        };
      }
    });

    setFieldPositions(newPositions);
  };

  // Use a simple timeout to debounce updates
  const timeoutId = setTimeout(updateFieldPositions, 50);

  return () => {
    clearTimeout(timeoutId);
  };
}, [nodes, scale, offset]);

  const handleZoom = (delta: number) => {
    const newScale = Math.min(Math.max(scale + delta, MIN_ZOOM), MAX_ZOOM);
    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    if (!workspaceRect) return;
    
    const newOffsetX = (-1 * (newScale - scale)) / newScale + offset.x;
    const newOffsetY = (-1 * (newScale - scale)) / newScale + offset.y;
    
    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  useEffect(() => {
    const currentWorkspaceRef = workspaceRef.current;

    const handleWheelEvent = (e: Event) => {
      const wheelEvent = e as globalThis.WheelEvent;
      wheelEvent.preventDefault();
      const delta = wheelEvent.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, MIN_ZOOM), MAX_ZOOM);
      const workspaceRect = currentWorkspaceRef?.getBoundingClientRect();
      if (!workspaceRect) return;
      
      const newOffsetX = (-1 * (newScale - scale)) / newScale + offset.x;
      const newOffsetY = (-1 * (newScale - scale)) / newScale + offset.y;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    if (currentWorkspaceRef) {
      currentWorkspaceRef.addEventListener("wheel", handleWheelEvent, {
        passive: false,
      });
    }

    return () => {
      if (currentWorkspaceRef) {
        currentWorkspaceRef.removeEventListener("wheel", handleWheelEvent);
      }
    };
  }, [scale, offset]);

  useEffect(() => {
    if (workspaceRef.current && transformContainerRef.current) {
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const transformWidth = 3500;
      const transformHeight = 3500;
      
      const initialOffsetX = (workspaceRect.width - transformWidth * scale) / 2 / scale + 500;
      const initialOffsetY = (workspaceRect.height - transformHeight * scale) / 2 / scale;
      
      setOffset({ x: initialOffsetX, y: initialOffsetY });
    }
  }, []);

  const handlePanStart = (e: React.MouseEvent) => {
    console.log("MouseDown detected", e.button);

    const target = e.target as Element;
    const isClickOnNode = target.closest("[data-node-id]");
    const isClickOnField = target.closest("[data-field-id]");

    if (
      e.button === 1 ||
      (e.button === 0 && !isClickOnNode && !isClickOnField)
    ) {
      e.preventDefault();
      setIsPanning(true);
      console.log("Panning set to true");
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = "grabbing";

      const handlePanMoveDocument = (moveEvent: globalThis.MouseEvent) => {
        moveEvent.preventDefault();
        
        const dx = (moveEvent.clientX - lastMousePos.current.x) / scale;
        const dy = (moveEvent.clientY - lastMousePos.current.y) / scale;

        setOffset((prevOffset) => ({
          x: prevOffset.x + dx,
          y: prevOffset.y + dy,
        }));

        lastMousePos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
      };

      const handlePanEndDocument = () => {
        setIsPanning(false);
        document.body.style.cursor = "default";
        
        document.removeEventListener("mousemove", handlePanMoveDocument);
        document.removeEventListener("mouseup", handlePanEndDocument);
      };

      document.addEventListener("mousemove", handlePanMoveDocument);
      document.addEventListener("mouseup", handlePanEndDocument);
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault();
    }
  };

  const handlePanEnd = () => {};

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (!e.dataTransfer) return;
    const nodeType = e.dataTransfer.getData("application/reactflow");
    if (!nodeType) return;

    const workspaceRect = workspaceRef.current?.getBoundingClientRect();
    if (!workspaceRect) return;

    const x = (e.clientX - workspaceRect.left) / scale - offset.x;
    const y = (e.clientY - workspaceRect.top) / scale - offset.y;

    onNodeDrop?.(nodeType, { x, y });
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();

    const target = e.target as Element;
    if (
      target &&
      (target.classList.contains("node-input") ||
        target.classList.contains("node-output"))
    ) {
      return;
    }

    if (isPanning) return;

    draggingNodeRef.current = nodeId;

    const startX = e.clientX;
    const startY = e.clientY;

    const currentNode = nodes.find((n) => n.id === nodeId);
    if (!currentNode) return;

    const startNodeX = currentNode.position.x;
    const startNodeY = currentNode.position.y;

    document.body.classList.add("select-none");
    document.body.style.cursor = "grabbing";

    const nodeElement = document.querySelector(
      `[data-node-id="${nodeId}"]`
    ) as HTMLElement;
    if (!nodeElement) return;

    // Set up for hardware acceleration and smooth dragging
    nodeElement.style.willChange = "transform";
    nodeElement.style.zIndex = "30"; // Lower than connections (z-50) so connections stay visible
    nodeElement.style.pointerEvents = "none"; // Prevent interference during drag
    nodeElement.style.transition = "none"; // Disable transitions during drag
    nodeElement.classList.add("dragging");

    let isDragging = true;

    const updateFieldPositionsForNode = (nodeId: string) => {
      if (!workspaceRef.current) return;
      
      const workspaceRect = workspaceRef.current.getBoundingClientRect();
      const newPositions: FieldPositions = { ...fieldPositions };
      let hasUpdates = false;
      
      document.querySelectorAll(`[data-node-id="${nodeId}"] [data-field-id]`).forEach((elem) => {
        const fieldId = elem.getAttribute("data-field-id");
        const rect = elem.getBoundingClientRect();

        if (fieldId && workspaceRect) {
          const newPos = {
            x: (rect.left + rect.width / 2 - workspaceRect.left) / scale - offset.x,
            y: (rect.top + rect.height / 2 - workspaceRect.top) / scale - offset.y,
          };
          
          // Only update if position has changed significantly
          const currentPos = newPositions[fieldId];
          if (!currentPos || 
              Math.abs(currentPos.x - newPos.x) > 1 || 
              Math.abs(currentPos.y - newPos.y) > 1) {
            newPositions[fieldId] = newPos;
            hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        setFieldPositions(newPositions);
      }
    };

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      if (!isDragging) return;

      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      // Direct transform update for immediate visual feedback
      nodeElement.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      
      // Throttle field position updates using requestAnimationFrame
      if (updatePositionRequestRef.current) {
        cancelAnimationFrame(updatePositionRequestRef.current);
      }
      
      updatePositionRequestRef.current = requestAnimationFrame(() => {
        updateFieldPositionsForNode(nodeId);
      });
    };

    const handleMouseUp = (upEvent: globalThis.MouseEvent) => {
      if (!isDragging) return;
      isDragging = false;

      // Cancel any pending position updates
      if (updatePositionRequestRef.current) {
        cancelAnimationFrame(updatePositionRequestRef.current);
        updatePositionRequestRef.current = null;
      }

      const dx = (upEvent.clientX - startX) / scale;
      const dy = (upEvent.clientY - startY) / scale;

      // Reset styles
      nodeElement.style.transform = "";
      nodeElement.style.willChange = "auto";
      nodeElement.style.zIndex = "";
      nodeElement.style.pointerEvents = "";
      nodeElement.style.transition = "";
      nodeElement.classList.remove("dragging");
      document.body.style.cursor = "default";

      // Update the node position in state
      setNodes((prevNodes: NodeData[]) =>
        prevNodes.map((node: NodeData) =>
          node.id === nodeId
            ? {
                ...node,
                position: {
                  x: startNodeX + dx,
                  y: startNodeY + dy,
                },
              }
            : node
        )
      );

      draggingNodeRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("select-none");
      
      // Final field position update to ensure everything is in sync
      setTimeout(() => updateFieldPositionsForNode(nodeId), 0);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, nodeId: string, field: { id: string; fieldType: 'input' | 'output' }) => {
    e.stopPropagation();

    const fieldType = field.fieldType;
    if (
      (fieldType === "input" &&
        connectionStart !== null &&
        connectionStart.type === "output") ||
      fieldType === "output"
    ) {
      const workspaceRect = workspaceRef.current?.getBoundingClientRect();
      if (workspaceRect) {
        const initialX = (e.clientX - workspaceRect.left) / scale - offset.x;
        const initialY = (e.clientY - workspaceRect.top) / scale - offset.y;
        setMousePosition({ x: initialX, y: initialY });
      }

      setConnectionStart({
        nodeId,
        fieldId: field.id,
        type: fieldType,
      });

      let currentSnapCandidate: string | null = null;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const workspaceRect = workspaceRef.current?.getBoundingClientRect();
        if (workspaceRect) {
          const mx =
            (moveEvent.clientX - workspaceRect.left) / scale - offset.x;
          const my = (moveEvent.clientY - workspaceRect.top) / scale - offset.y;
          setMousePosition({ x: mx, y: my });

          const snapDistance = 40 / scale;
          let candidate: string | null = null;
          let minDistance = Infinity;
          Object.entries(fieldPositions).forEach(([fid, pos]) => {
            const dx = pos.x - mx;
            const dy = pos.y - my;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance && distance <= snapDistance) {
              minDistance = distance;
              candidate = fid;
            }
          });
          currentSnapCandidate = candidate;
          setSnapFieldId(candidate);
        }
      };

      const handleMouseUp = (_upEvent: globalThis.MouseEvent) => {
        const targetFieldIdCandidate = currentSnapCandidate;
        setSnapFieldId(null);

        if (targetFieldIdCandidate) {
          const fieldElement = document.querySelector(
            `[data-field-id="${targetFieldIdCandidate}"]`
          );
          if (fieldElement) {
            const targetFieldId = fieldElement.getAttribute("data-field-id");
            const targetNodeId = fieldElement.getAttribute("data-node-id");
            const targetFieldType =
              fieldElement.getAttribute("data-field-type");

            if (targetFieldId && targetNodeId && targetFieldType) {
              const currentConnection = {
                nodeId,
                fieldId: field.id,
                type: fieldType,
              };

              const isValidConnection =
                (currentConnection.type === "output" &&
                  targetFieldType === "input") ||
                (currentConnection.type === "input" &&
                  targetFieldType === "output");

              if (
                isValidConnection &&
                targetNodeId !== currentConnection.nodeId
              ) {
                const source =
                  currentConnection.type === "output"
                    ? currentConnection.nodeId
                    : targetNodeId;
                const sourceHandle =
                  currentConnection.type === "output"
                    ? currentConnection.fieldId
                    : targetFieldId;
                const target =
                  currentConnection.type === "output"
                    ? targetNodeId
                    : currentConnection.nodeId;
                const targetHandle =
                  currentConnection.type === "output"
                    ? targetFieldId
                    : currentConnection.fieldId;

                onAddEdge({
                  id: "temp-id",
                  source,
                  sourceHandle,
                  target,
                  targetHandle,
                });
              }
            }
          }
        }
        setConnectionStart(null);
        
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  // Enhanced curved path generation
  const generateCurvedPath = (startX: number, startY: number, endX: number, endY: number) => {
    const dx = endX - startX;
    
    // Control point distance based on horizontal distance
    const controlDistance = Math.max(Math.abs(dx) * 0.3, 100);
    
    // Control points for bezier curve
    const cp1x = startX + controlDistance;
    const cp1y = startY;
    const cp2x = endX - controlDistance;
    const cp2y = endY;
    
    return `M${startX},${startY} C${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
  };

  // Helper to render a connection line with glow effect
  const renderConnectionLine = () => {
    if (!connectionStart) return null;

    const startPosition = fieldPositions[connectionStart.fieldId];
    if (!startPosition) return null;

    const { x: startX, y: startY } = startPosition;
    const { x: mouseX, y: mouseY } = mousePosition;

    const path = generateCurvedPath(startX, startY, mouseX, mouseY);

    return (
      <svg
        className="absolute inset-0 pointer-events-none z-50 w-full h-full"
        style={{ filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))' }}
      >
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
            <stop offset="50%" stopColor="#f9a8d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d={path}
          stroke="url(#connectionGradient)"
          strokeWidth={3 / scale}
          fill="none"
          className="animate-pulse"
        />
      </svg>
    );
  };

  // Helper to render edge connections with smooth curves
  // Helper to render edge connections with smooth curves
const renderEdges = () => {
  return (
    <svg
      className="absolute z-50 top-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,6 L7,3 z" fill="#ffffff" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {edges.map((edge) => {
        const sourcePos = fieldPositions[edge.sourceHandle];
        const targetPos = fieldPositions[edge.targetHandle];

        if (!sourcePos || !targetPos) {
          return null;
        }

        const path = generateCurvedPath(
          sourcePos.x, 
          sourcePos.y, 
          targetPos.x, 
          targetPos.y
        );

        return (
          <g key={edge.id}>
            {/* Invisible thick path for easier clicking */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth={12 / scale}
              fill="none"
              style={{ 
                pointerEvents: "all",
                cursor: "pointer"
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveEdge(edge.id);
              }}
            />
            {/* Visible connection line */}
            <path
              d={path}
              stroke="#ffffff"
              strokeWidth={2.5 / scale}
              fill="none"
              markerEnd="url(#arrow)"
              style={{ 
                pointerEvents: "none",
                filter: "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))"
              }}
              className="hover:stroke-red-400 transition-colors"
            />
          </g>
        );
      })}
    </svg>
  );
};

  const getZoomPercentage = () => Math.round(scale * 100);

  return (
    <div
      ref={workspaceRef}
      className="flex-1 h-full relative overflow-hidden bg-gray-900 p-4 font-['Inter']"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={handlePanEnd}
      onMouseLeave={handlePanEnd}
      style={{ 
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none"
      }}
    >
      {/* Play button and execution status */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-3">
        <button
          onClick={onPlayClick}
          disabled={isExecuting}
          className={`flex items-center cursor-pointer justify-center p-2.5 rounded-full shadow-lg transition-all duration-300 ${
            isExecuting
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-pink-500 hover:bg-pink-600 text-white hover:shadow-pink-400/50"
          }`}
          title="Execute flow"
        >
          {isExecuting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
            </svg>
          )}
        </button>

        {executionResult && (
          <div
            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all duration-300 ${
              executionResult.success
                ? "bg-green-900/80 text-green-300 border border-green-700"
                : "bg-red-900/80 text-red-300 border border-red-700"
            }`}
          >
            {executionResult.message}
          </div>
        )}
      </div>

      {/* Templates buttons */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2">
         <button
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 hover:border-pink-400 hover:shadow-pink-400/25 transition-all duration-300 flex items-center gap-2"
          onClick={() => window.open("/playground")}

        >
          
         <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={1.5}
  stroke="currentColor"
  className="w-6 h-6 text-white"
>
    <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M7 8a3 3 0 100-6 3 3 0 000 6zM17 16a3 3 0 100-6 3 3 0 000 6zM7 22a3 3 0 100-6 3 3 0 000 6zM10.4 7.4l3.2 1.2M13.6 15.4l-3.2 1.2M10.4 16.6l3.2-1.2"
  />
</svg>

          PlayGround
        </button>
        <button
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 hover:border-pink-400 hover:shadow-pink-400/25 transition-all duration-300 flex items-center gap-2"
          onClick={onViewTemplates}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          Marketplace
        </button>
         <button
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 hover:border-pink-400 hover:shadow-pink-400/25 transition-all duration-300 flex items-center gap-2"
          onClick={() => window.open("/prompt")}

        >
          
         <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={1.5}
  stroke="currentColor"
  className="w-6 h-6 text-white"
>
   <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
  />
</svg>

          AI Prompt
        </button>
        <button
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 hover:border-pink-400 hover:shadow-pink-400/25 transition-all duration-300 flex items-center gap-2"
          onClick={() => window.open("/api", "_blank")}

        >
          
         <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={1.5}
  stroke="currentColor"
  className="w-6 h-6 text-white"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M6.75 7.5h-2.5a2 2 0 00-2 2v5a2 2 0 002 2h2.5m0-9v9m0-9h3.25a1.75 1.75 0 110 3.5H6.75m6.5 5.5v-9h2.25a2.25 2.25 0 012.25 2.25v0a2.25 2.25 0 01-2.25 2.25H13.25m0 4.5h2.25a2.25 2.25 0 002.25-2.25v0A2.25 2.25 0 0015.5 12h-2.25m7.5 0v-4.5m0 0h-2.25m2.25 0h2.25"
  />
</svg>

          Keys
        </button>
        <button
          className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 hover:border-pink-400 hover:shadow-pink-400/25 transition-all duration-300 flex items-center gap-2"
          onClick={onSaveTemplate}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 text-white"
          >
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.12a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Save Template
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-2 items-end z-20">
        <div className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg shadow-lg text-sm text-white flex items-center">
          {getZoomPercentage()}%
        </div>
        <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button
            className="px-3 py-2 text-white hover:bg-gray-800 hover:text-pink-400 transition-colors border-b border-gray-700"
            onClick={() => handleZoom(0.1)}
          >
            +
          </button>
          <button
            className="px-3 py-2 text-white hover:bg-gray-800 hover:text-pink-400 transition-colors"
            onClick={() => handleZoom(-0.1)}
          >
            −
          </button>
        </div>
      </div>

      {/* Transform container */}
      <div
        ref={transformContainerRef}
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
          pointerEvents: "auto",
          width: `3500px`,
          height: `3500px`,
        }}
      >
        {/* Background grid with darker theme */}
       <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(25px,1fr))] grid-rows-[repeat(40,minmax(25px,1fr))] opacity-15 pointer-events-none">
          {Array.from({ length: 1600 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-white" />
          ))}
        </div>

        {/* Render all edges first */}
        {renderEdges()}

        {/* Render connecting line when dragging (above edges) */}
        {connectionStart && renderConnectionLine()}

        {/* Render nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-zinc-900 border border-gray-700 rounded-xl shadow-lg w-100 p-6 cursor-move select-none hover:border-pink-400 transition-colors duration-200 z-20"
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              userSelect: "none",
              transform: "translateZ(0)", // Force hardware acceleration
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNodeDragStart(e, node.id);
            }}
            data-node-id={node.id}
          >
            {/* Node header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
              <div className="flex items-center">
                <span className="text-2xl mr-3 filter grayscale">
                  {node.type === "text-agent" && "💬"}
                  {node.type === "voice-agent" && "🎤"}
                  {node.type === "csv-agent" && "📂"}
                  {node.type === "Email-Tool" && "📧"}
                  {node.type === "Text-Input-Tool" && "📝"}
                  {node.type === "File-Input-Tool" && "📎"}
                  {node.type === "Text-Output-Tool" && "📤"}
                  {node.type === "Knowledge-Base" && "🗃️"}
                  {node.type === "Web-Search-Tool" && "🔍"}
                  {node.type === "WhatsApp-Tool" && "💬"}
                  {node.type === "Zoom-Tool" && "📹"}
                  {node.type === "ArXiv-Search" && "📚"}
                  {node.type === "HackerNews-Search" && "📰"}
                  {node.type === "PubMed-Search" && "🏥"}
                  {node.type === "Exa-Search" && "🔍"}
                  {node.type === "Pandas-Data" && "🐼"}
                  {node.type === "DuckDB-SQL" && "🦆"}
                  {node.type === "Calculator" && "🧮"}
                  {node.type === "Python-Code" && "🐍"}
                  {node.type === "Shell-Command" && "💻"}
                  {node.type === "File-Operations" && "📁"}
                  {node.type === "Web-Scraping" && "🌐"}
                  {node.type === "Wikipedia" && "📖"}
                  {node.type === "YouTube" && "📺"}
                  {node.type === "Financial-Analysis" && "💰"}
                  {node.type === "Weather" && "🌤️"}
                  {node.type === "Sleep-Timer" && "⏰"}
                  {node.type === "Local-FileSystem" && "💾"}
                  {node.type === "End" && "🏁"}
                </span>
                <span className="font-semibold text-white capitalize tracking-wide">
                  {node.data?.label || 'Node'}
                </span>
              </div>
              <button
                className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-gray-800 z-50 relative"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('Removing node:', node.id);
                  
                  // Remove all edges connected to this node first
                  const connectedEdges = edges.filter((edge) => 
                    edge.source === node.id || edge.target === node.id
                  );
                  
                  connectedEdges.forEach((edge) => {
                    console.log('Removing edge:', edge.id);
                    onRemoveEdge(edge.id);
                  });
                  
                  // Remove the node
                  setNodes((prevNodes) => {
                    const newNodes = prevNodes.filter((n) => n.id !== node.id);
                    console.log('Nodes after removal:', newNodes.length);
                    return newNodes;
                  });
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Node content */}
            <div className="flex flex-col space-y-5">
              {/* Input fields */}
              {node.data?.inputs?.length > 0 && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 w-full">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Inputs
                  </h4>
                  <div className="flex flex-col gap-3">
                    {node.data.inputs.map((input) => (
                      <div
                        key={input.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full"
                      >
                        {/* Connection dot with enhanced hover effects */}
                        <div
                          className={`w-4 h-4 rounded-full bg-pink-500 flex-shrink-0 transition-all duration-300 hover:scale-125 hover:shadow-pink-400/50 hover:shadow-lg cursor-pointer z-60 relative ${
                            snapFieldId === input.id
                              ? "ring-2 ring-pink-300 scale-125 shadow-pink-400/50 shadow-lg"
                              : ""
                          }`}
                          data-field-id={input.id}
                          data-node-id={node.id}
                          data-field-type="input"
                          onMouseDown={(e) =>
                            handleFieldMouseDown(e, node.id, input)
                          }
                        />
                        {/* Label */}
                        <label className="text-sm font-medium text-gray-300 flex-shrink-0 w-24">
                          {input.name}
                        </label>
                        {/* Input field styling */}
                        {input.type === "string" && !input.options && (
                          <div className="flex w-full">
                            <textarea
                              className="flex-grow p-2 text-sm bg-gray-800 border border-gray-600 rounded-l text-white w-full min-h-[38px] max-h-[120px] resize-none outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors
             scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
                              style={{
                                scrollbarWidth: "thin",
                                height: "auto",
                                minHeight: "38px",
                                overflowY: "hidden",
                              }}
                              placeholder="Enter value"
                              value={input.value || ""}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.target.style.height = "38px";
                                const newHeight = Math.min(
                                  e.target.scrollHeight,
                                  120
                                );
                                e.target.style.height = `${newHeight}px`;

                                e.target.style.overflowY =
                                  newHeight >= 120 ? "auto" : "hidden";

                                setNodes((prev: NodeData[]) =>
                                  prev.map((n: NodeData) =>
                                    n.id === node.id
                                      ? {
                                          ...n,
                                          data: {
                                            ...n.data,
                                            inputs: n.data.inputs.map((i: NodeField) =>
                                              i.id === input.id
                                                ? {
                                                    ...i,
                                                    value: e.target.value,
                                                  }
                                                : i
                                            ),
                                          },
                                        }
                                      : n
                                  )
                                );
                              }}
                              onFocus={(e) => {
                                e.target.style.height = "38px";
                                const newHeight = Math.min(
                                  e.target.scrollHeight,
                                  120
                                );
                                e.target.style.height = `${newHeight}px`;

                                e.target.style.overflowY =
                                  newHeight >= 120 ? "auto" : "hidden";
                              }}
                            />
                            <button
                              className="bg-gray-700 hover:bg-pink-500 text-white p-2 border border-l-0 border-gray-600 rounded-r flex items-center justify-center transition-colors duration-300"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();

                                const SpeechRecognition =
                                  window.SpeechRecognition ||
                                  window.webkitSpeechRecognition;

                                if (!SpeechRecognition) {
                                  alert(
                                    "Speech recognition is not supported in your browser"
                                  );
                                  return;
                                }

                                const recognition = new SpeechRecognition();
                                recognition.lang = "en-US";
                                recognition.interimResults = false;

                                const button = e.currentTarget;
                                button.classList.add(
                                  "bg-red-500",
                                  "animate-pulse"
                                );
                                button.innerHTML =
                                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-white"><path fill-rule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l2.474 10.124a.75.75 0 0 1-.375.84A6.723 6.723 0 0 1 18.5 18.75H5.5a6.723 6.723 0 0 1-3.431-.761.75.75 0 0 1-.375-.84L4.168 7.025H2.25a.75.75 0 0 1-.152-1.485 49.105 49.105 0 0 1 9.152-1V3a.75.75 0 0 1 .75-.75Zm4.878 13.997a.75.75 0 0 0 .132-1.5 24.585 24.585 0 0 0-4.257-.4h-1.505a24.592 24.592 0 0 0-4.257.4.75.75 0 0 0 .132 1.5c.49-.086 1.011-.142 1.542-.166h6.67c.532.024 1.052.08 1.542.166Z" clip-rule="evenodd" /></svg>';

                                recognition.onresult = (event: any) => {
                                  const transcript =
                                    event.results[0][0].transcript;

                                  setNodes((prev: NodeData[]) =>
                                    prev.map((n: NodeData) =>
                                      n.id === node.id
                                        ? {
                                            ...n,
                                            data: {
                                              ...n.data,
                                              inputs: n.data.inputs.map((i: NodeField) =>
                                                i.id === input.id
                                                  ? { ...i, value: transcript }
                                                  : i
                                              ),
                                            },
                                          }
                                        : n
                                    )
                                  );
                                };

                                recognition.onend = () => {
                                  button.classList.remove(
                                    "bg-red-500",
                                    "animate-pulse"
                                  );
                                  button.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-white"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" /></svg>';
                                };

                                recognition.onerror = (event: any) => {
                                  console.error(
                                    "Speech recognition error",
                                    event.error
                                  );
                                  button.classList.remove(
                                    "bg-red-500",
                                    "animate-pulse"
                                  );
                                  button.innerHTML =
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-white"><path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" /><path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" /></svg>';
                                };

                                recognition.start();
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4 text-white"
                              >
                                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {input.type === "file" && (
                          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="px-3 py-1 text-sm bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors cursor-pointer"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Find the file input and trigger it
                                const fileInput = e.currentTarget.nextElementSibling as HTMLInputElement;
                                if (fileInput) {
                                  fileInput.click();
                                }
                              }}
                            >
                              Browse
                            </button>
                            <input
                              type="file"
                              className="hidden"
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  const file = e.target.files[0];
                                  console.log('File selected:', file.name, file.size, 'bytes');
                                  setNodes((prev: NodeData[]) =>
                                    prev.map((n: NodeData) =>
                                      n.id === node.id
                                        ? {
                                            ...n,
                                            data: {
                                              ...n.data,
                                              inputs: n.data.inputs.map((i: NodeField) =>
                                                i.id === input.id
                                                  ? { ...i, value: file }
                                                  : i
                                              ),
                                            },
                                          }
                                        : n
                                    )
                                  );
                                }
                              }}
                            />
                            <span className="text-sm text-gray-400">
                              {input.value instanceof File
                                ? input.value.name
                                : input.value || "No file selected"}
                            </span>
                          </div>
                        )}
                        {input.options && (
                          <select
                            className="flex-grow p-2 text-sm bg-gray-800 border border-gray-600 rounded text-white w-full focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-colors"
                            value={input.value || ""}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setNodes((prev: NodeData[]) =>
                                prev.map((n: NodeData) =>
                                  n.id === node.id
                                    ? {
                                        ...n,
                                        data: {
                                          ...n.data,
                                          inputs: n.data.inputs.map((i: NodeField) =>
                                            i.id === input.id
                                              ? { ...i, value: e.target.value }
                                              : i
                                          ),
                                        },
                                      }
                                    : n
                                )
                              )
                            }
                          >
                            <option value="" className="bg-gray-800">Select an option</option>
                            {input.options.map((option) => (
                              <option key={option} value={option} className="bg-gray-800">
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Output fields */}
              {node.data?.outputs?.length > 0 && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    Outputs
                  </h4>
                  <div className="space-y-3">
                    {node.data.outputs.map((output) => (
                      <div key={output.id}>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-300 flex-1">
                            {output.name}
                          </label>
                          <div
                            className={`w-4 h-4 rounded-full bg-cyan-400 flex-shrink-0 transition-all duration-300 hover:scale-125 hover:shadow-cyan-400/50 hover:shadow-lg cursor-pointer z-60 relative ${
                              snapFieldId === output.id
                                ? "ring-2 ring-cyan-300 scale-125 shadow-cyan-400/50 shadow-lg"
                                : ""
                            }`}
                            data-field-id={output.id}
                            data-node-id={node.id}
                            data-field-type="output"
                            onMouseDown={(e) =>
                              handleFieldMouseDown(e, node.id, {
                                ...output,
                                fieldType: "output"
                              })
                            }
                          />
                        </div>
                        {output.display && (
                          <div className="mt-2 p-3 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white">
                            {output.value || (
                              <span className="text-gray-500 italic">
                                No output
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workspace;