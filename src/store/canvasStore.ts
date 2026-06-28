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
} from '@xyflow/react';
import { SystemNodeData } from '@/types/node';

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
  
  setActiveProject: (projectId: string) => void;
  setProjectData: (projectId: string, nodes: SystemNode[], edges: Edge[]) => void;
  
  onNodesChange: (changes: NodeChange<SystemNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: OnConnect;
  addNode: (node: SystemNode) => void;
  updateNodeData: (nodeId: string, data: Partial<SystemNodeData>) => void;
  removeNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  
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

  history: {},
  loadedProjects: {} as Record<string, boolean>,

  setActiveProject: (projectId: string) => {
    const { projects, history } = get();
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
        }
      });
    } else {
      set({ activeProjectId: projectId, selectedNodeId: null, selectedEdgeId: null });
    }
  },

  pushState: () => {
    const { activeProjectId, projects, history } = get();
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
      }
    });
  },

  undo: () => {
    const { activeProjectId, projects, history } = get();
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
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  redo: () => {
    const { activeProjectId, projects, history } = get();
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
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  setProjectData: (projectId: string, nodes: SystemNode[], edges: Edge[]) => {
    const { projects, history, loadedProjects } = get();
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
      }
    });
  },
  
  onNodesChange: (changes: NodeChange<SystemNode>[]) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    const currentNodes = projects[activeProjectId].nodes;
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          nodes: applyNodeChanges(changes, currentNodes) as SystemNode[],
        }
      }
    });
  },
  
  onEdgesChange: (changes: EdgeChange[]) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    const currentEdges = projects[activeProjectId].edges;
    set({
      projects: {
        ...projects,
        [activeProjectId]: {
          ...projects[activeProjectId],
          edges: applyEdgeChanges(changes, currentEdges),
        }
      }
    });
  },
  
  onConnect: (connection: Connection) => {
    const { activeProjectId, projects } = get();
    if (!activeProjectId) return;
    
    get().pushState();
    
    const currentEdges = projects[activeProjectId].edges;
    const newEdge = { ...connection, type: 'custom' };
    
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
}));
