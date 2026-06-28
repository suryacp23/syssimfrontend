import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  reconnectEdge,
} from '@xyflow/react';
import { SystemNodeData } from '@/types/node';
import { v4 as uuidv4 } from 'uuid';

export type SystemNode = Node<SystemNodeData>;

interface ProjectCanvasData {
  nodes: SystemNode[];
  edges: Edge[];
}

interface CanvasState {
  projects: Record<string, ProjectCanvasData>;
  activeProjectId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  clipboard: { nodes: SystemNode[]; edges: Edge[] } | null;
  isDirty: Record<string, boolean>;
  
  setActiveProject: (projectId: string) => void;
  setProjectData: (projectId: string, nodes: SystemNode[], edges: Edge[]) => void;
  setDirty: (projectId: string, isDirty: boolean) => void;
  
  onNodesChange: (changes: NodeChange<SystemNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: OnConnect;
  addNode: (node: SystemNode) => void;
  updateNodeData: (nodeId: string, data: Partial<SystemNodeData>) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  
  // Day 5 editing capabilities
  duplicateNode: (nodeId?: string) => void;
  copySelection: () => void;
  pasteSelection: () => void;
  updateEdge: (edgeId: string, updates: Partial<Edge>) => void;
  reconnectEdge: (oldEdge: Edge, newConnection: Connection) => void;
  selectAll: () => void;
  bringToFront: (nodeId: string) => void;
  sendToBack: (nodeId: string) => void;
  
  history: Record<string, { past: ProjectCanvasData[], future: ProjectCanvasData[] }>;
  loadedProjects: Record<string, boolean>;
  undo: () => void;
  redo: () => void;
  pushState: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  projects: {},
  activeProjectId: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  clipboard: null,
  isDirty: {},

  history: {},
  loadedProjects: {} as Record<string, boolean>,

  setActiveProject: (projectId: string) => {
    const { projects, history, isDirty } = get();
    // Initialize if it doesn't exist
    if (!projects[projectId]) {
      set({
        activeProjectId: projectId,
        selectedNodeId: null,
        selectedEdgeId: null,
        projects: {
          ...projects,
          [projectId]: { nodes: [], edges: [] }
        },
        history: {
          ...history,
          [projectId]: { past: [], future: [] }
        },
        isDirty: {
          ...isDirty,
          [projectId]: false
        }
      });
    } else {
      set({ activeProjectId: projectId, selectedNodeId: null, selectedEdgeId: null });
    }
  },

  pushState: () => {
    const { activeProjectId, projects, history, isDirty } = get();
    if (!activeProjectId) return;
    
    const currentProjectData = projects[activeProjectId];
    if (!currentProjectData) return;
    
    const projectHistory = history[activeProjectId] || { past: [], future: [] };
    const snapshot = JSON.parse(JSON.stringify(currentProjectData));
    
    set({
      history: {
        ...history,
        [activeProjectId]: {
          past: [...projectHistory.past, snapshot].slice(-50),
          future: [],
        }
      },
      isDirty: {
        ...isDirty,
        [activeProjectId]: true
      }
    });
  },

  undo: () => {
    const { activeProjectId, projects, history, isDirty } = get();
    if (!activeProjectId) return;
    
    const projectHistory = history[activeProjectId];
    if (!projectHistory || projectHistory.past.length === 0) return;
    
    const previousState = projectHistory.past[projectHistory.past.length - 1];
    const newPast = projectHistory.past.slice(0, -1);
    
    const currentState = projects[activeProjectId];
    const snapshot = JSON.parse(JSON.stringify(currentState));
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: previousState,
      },
      history: {
        ...history,
        [activeProjectId]: {
          past: newPast,
          future: [snapshot, ...projectHistory.future],
        }
      },
      isDirty: {
        ...isDirty,
        [activeProjectId]: true
      },
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  redo: () => {
    const { activeProjectId, projects, history, isDirty } = get();
    if (!activeProjectId) return;
    
    const projectHistory = history[activeProjectId];
    if (!projectHistory || projectHistory.future.length === 0) return;
    
    const nextState = projectHistory.future[0];
    const newFuture = projectHistory.future.slice(1);
    
    const currentState = projects[activeProjectId];
    const snapshot = JSON.parse(JSON.stringify(currentState));
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: nextState,
      },
      history: {
        ...history,
        [activeProjectId]: {
          past: [...projectHistory.past, snapshot],
          future: newFuture,
        }
      },
      isDirty: {
        ...isDirty,
        [activeProjectId]: true
      },
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  setProjectData: (projectId: string, nodes: SystemNode[], edges: Edge[]) => {
    const { projects, history, loadedProjects, isDirty } = get();
    set({
      loadedProjects: {
        ...loadedProjects,
        [projectId]: true
      },
      projects: {
        ...projects,
        [projectId]: { nodes, edges }
      },
      history: {
        ...history,
        [projectId]: { past: [], future: [] }
      },
      isDirty: {
        ...isDirty,
        [projectId]: false
      }
    });
  },

  setDirty: (projectId: string, activeIsDirty: boolean) => {
    const { isDirty } = get();
    set({
      isDirty: {
        ...isDirty,
        [projectId]: activeIsDirty
      }
    });
  },
  
  onNodesChange: (changes: NodeChange<SystemNode>[]) => {
    const { activeProjectId, projects, isDirty } = get();
    if (!activeProjectId) return;
    
    const currentNodes = projects[activeProjectId].nodes;
    const hasPositionChange = changes.some(
      (c) => c.type === 'position' || c.type === 'remove' || c.type === 'add'
    );

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: applyNodeChanges(changes, currentNodes) as SystemNode[],
        }
      },
      isDirty: hasPositionChange ? {
        ...isDirty,
        [activeProjectId]: true
      } : isDirty
    });
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    const { activeProjectId, projects, isDirty } = get();
    if (!activeProjectId) return;
    
    const currentEdges = projects[activeProjectId].edges;
    const hasEdgeChange = changes.some(
      (c) => c.type === 'remove' || c.type === 'add'
    );

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: applyEdgeChanges(changes, currentEdges),
        }
      },
      isDirty: hasEdgeChange ? {
        ...isDirty,
        [activeProjectId]: true
      } : isDirty
    });
  },
  
  onConnect: (connection: Connection) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    const currentEdges = projects[activeProjectId].edges;
    const newEdge: Edge = {
      ...connection,
      id: uuidv4(),
      type: 'custom',
      data: { type: 'smoothstep' }
    };
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: addEdge(newEdge, currentEdges),
        }
      }
    });
  },
  
  addNode: (node) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: [...projects[activeProjectId].nodes, node],
        }
      }
    });
  },
  
  removeNode: (nodeId) => {
    const { activeProjectId, projects, selectedNodeId } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    const currentNodes = projects[activeProjectId].nodes;
    const currentEdges = projects[activeProjectId].edges;
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          nodes: currentNodes.filter((node) => node.id !== nodeId),
          edges: currentEdges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        }
      },
      selectedNodeId: selectedNodeId === nodeId ? null : selectedNodeId,
    });
  },

  removeEdge: (edgeId) => {
    const { activeProjectId, projects, selectedEdgeId } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    const currentEdges = projects[activeProjectId].edges;
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: currentEdges.filter((edge) => edge.id !== edgeId),
        }
      },
      selectedEdgeId: selectedEdgeId === edgeId ? null : selectedEdgeId,
    });
  },
  
  updateNodeData: (nodeId, data) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    const currentNodes = projects[activeProjectId].nodes;
    
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: currentNodes.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...data,
                },
              };
            }
            return node;
          }),
        }
      }
    });
  },

  setSelectedNodeId: (nodeId) => {
    set({ selectedNodeId: nodeId });
  },

  setSelectedEdgeId: (edgeId) => {
    set({ selectedEdgeId: edgeId });
  },

  // Duplicate nodes
  duplicateNode: (nodeId) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const currentNodes = projects[activeProjectId].nodes;
    const currentEdges = projects[activeProjectId].edges;

    let nodesToDuplicate: SystemNode[] = [];
    if (nodeId) {
      const node = currentNodes.find((n) => n.id === nodeId);
      if (node) nodesToDuplicate = [node];
    } else {
      nodesToDuplicate = currentNodes.filter((n) => n.selected);
    }

    if (nodesToDuplicate.length === 0) return;

    get().pushState();

    const idMap: Record<string, string> = {};
    const newNodes = nodesToDuplicate.map((node) => {
      const newId = uuidv4();
      idMap[node.id] = newId;
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
      };
    });

    const connectingEdges = currentEdges.filter(
      (edge) => idMap[edge.source] && idMap[edge.target]
    );

    const newEdges = connectingEdges.map((edge) => ({
      ...edge,
      id: uuidv4(),
      source: idMap[edge.source],
      target: idMap[edge.target],
      selected: false,
    }));

    const deselectedNodes = currentNodes.map((n) => ({ ...n, selected: false }));
    const deselectedEdges = currentEdges.map((e) => ({ ...e, selected: false }));

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          nodes: [...deselectedNodes, ...newNodes],
          edges: [...deselectedEdges, ...newEdges],
        },
      },
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
      selectedEdgeId: null,
    });
  },

  // Copy selection to clipboard
  copySelection: () => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const currentNodes = projects[activeProjectId].nodes;
    const currentEdges = projects[activeProjectId].edges;

    const selectedNodes = currentNodes.filter((n) => n.selected);
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    const selectedEdges = currentEdges.filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    if (selectedNodes.length === 0) return;

    set({
      clipboard: {
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(selectedEdges)),
      },
    });
  },

  // Paste selection from clipboard
  pasteSelection: () => {
    const { activeProjectId, projects, clipboard } = get();
    if (!activeProjectId || !clipboard || clipboard.nodes.length === 0) return;

    get().pushState();

    const currentNodes = projects[activeProjectId].nodes;
    const currentEdges = projects[activeProjectId].edges;

    const idMap: Record<string, string> = {};
    const newNodes = clipboard.nodes.map((node) => {
      const newId = uuidv4();
      idMap[node.id] = newId;
      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
      };
    });

    const newEdges = clipboard.edges.map((edge) => ({
      ...edge,
      id: uuidv4(),
      source: idMap[edge.source],
      target: idMap[edge.target],
      selected: false,
    }));

    const deselectedNodes = currentNodes.map((n) => ({ ...n, selected: false }));
    const deselectedEdges = currentEdges.map((e) => ({ ...e, selected: false }));

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          nodes: [...deselectedNodes, ...newNodes],
          edges: [...deselectedEdges, ...newEdges],
        },
      },
      clipboard: {
        nodes: clipboard.nodes.map((n) => ({
          ...n,
          position: { x: n.position.x + 30, y: n.position.y + 30 },
        })),
        edges: clipboard.edges,
      },
      selectedNodeId: newNodes.length === 1 ? newNodes[0].id : null,
      selectedEdgeId: null,
    });
  },

  // Update edge style/labels
  updateEdge: (edgeId, updates) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    get().pushState();

    const currentEdges = projects[activeProjectId].edges;
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: currentEdges.map((edge) => {
            if (edge.id === edgeId) {
              const baseData = edge.data || {};
              const updateData = updates.data || {};
              return {
                ...edge,
                ...updates,
                data: {
                  ...baseData,
                  ...updateData,
                },
              };
            }
            return edge;
          }),
        },
      },
    });
  },

  // Reconnect edge endpoints
  reconnectEdge: (oldEdge, newConnection) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    get().pushState();

    const currentEdges = projects[activeProjectId].edges;
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: reconnectEdge(oldEdge, newConnection, currentEdges),
        },
      },
    });
  },

  // Select all nodes and edges
  selectAll: () => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    const currentNodes = projects[activeProjectId].nodes;
    const currentEdges = projects[activeProjectId].edges;

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          nodes: currentNodes.map((node) => ({ ...node, selected: true })),
          edges: currentEdges.map((edge) => ({ ...edge, selected: true })),
        },
      },
    });
  },

  // Bring node to front (zIndex)
  bringToFront: (nodeId) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    get().pushState();

    const currentNodes = projects[activeProjectId].nodes;
    const maxZ = currentNodes.reduce((max, n) => Math.max(max, n.zIndex || 0), 0);

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: currentNodes.map((node) =>
            node.id === nodeId ? { ...node, zIndex: maxZ + 1 } : node
          ),
        },
      },
    });
  },

  // Send node to back (zIndex)
  sendToBack: (nodeId) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;

    get().pushState();

    const currentNodes = projects[activeProjectId].nodes;
    const minZ = currentNodes.reduce((min, n) => Math.min(min, n.zIndex || 0), 0);

    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: currentNodes.map((node) =>
            node.id === nodeId ? { ...node, zIndex: Math.min(0, minZ - 1) } : node
          ),
        },
      },
    });
  },
}));
