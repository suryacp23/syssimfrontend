"use client";

import { useState, useEffect, useCallback } from 'react';
import { useReactFlow, useOnSelectionChange, Node, Edge } from '@xyflow/react';
import { useCanvasStore } from '@/store/canvasStore';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Trash2, Save, Loader2, Keyboard, Undo2, Redo2 } from 'lucide-react';
import { useSaveCanvas } from '@/hooks/useProjects';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView, deleteElements } = useReactFlow();
  const { activeProjectId, projects, undo, redo, history } = useCanvasStore();
  const saveCanvasMutation = useSaveCanvas();
  
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
  });

  const handleDelete = () => {
    deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  };

  const handleSave = useCallback(() => {
    if (!activeProjectId) return;
    if (saveCanvasMutation.isPending) return;
    
    const projectData = projects[activeProjectId];
    if (!projectData) return;

    saveCanvasMutation.mutate(
      { id: activeProjectId, data: projectData },
      {
        onSuccess: () => {
          toast.success("Canvas saved successfully");
        },
        onError: () => {
          toast.error("Failed to save canvas");
        }
      }
    );
  }, [activeProjectId, projects, saveCanvasMutation]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const shortcuts = [
    { label: "Save Canvas", keys: ["⌘/Ctrl", "S"] },
    { label: "Undo", keys: ["⌘/Ctrl", "Z"] },
    { label: "Redo", keys: ["⌘/Ctrl", "Y", "or", "Shift", "Z"] },
    { label: "Duplicate Selection", keys: ["⌘/Ctrl", "D"] },
    { label: "Copy Selection", keys: ["⌘/Ctrl", "C"] },
    { label: "Paste Selection", keys: ["⌘/Ctrl", "V"] },
    { label: "Select All Nodes", keys: ["⌘/Ctrl", "A"] },
    { label: "Delete Selected", keys: ["Del", "Backspace"] },
    { label: "Zoom In/Out", keys: ["Scroll Up/Down"] },
    { label: "Pan Canvas", keys: ["Space + Drag"] },
    { label: "Selection Box", keys: ["Shift + Drag"] },
  ];

  const projectHistory = activeProjectId ? history[activeProjectId] : null;
  const canUndo = projectHistory ? projectHistory.past.length > 0 : false;
  const canRedo = projectHistory ? projectHistory.future.length > 0 : false;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background border shadow-sm rounded-lg p-1.5 flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => undo()} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => redo()} disabled={!canRedo} title="Redo (Ctrl+Y / Ctrl+Shift+Z)">
        <Redo2 className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="ghost" size="icon" onClick={() => zoomOut()} title="Zoom Out">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => zoomIn()} title="Zoom In">
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => fitView({ duration: 800 })} title="Fit View">
        <Maximize className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        disabled={selectedNodes.length === 0 && selectedEdges.length === 0}
        onClick={handleDelete}
        title="Delete Selected (Del/Backspace)"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        disabled={saveCanvasMutation.isPending || !activeProjectId}
        onClick={handleSave}
        title="Save Canvas (Ctrl+S / Cmd+S)"
      >
        {saveCanvasMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>Save</span>
        <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>S
        </kbd>
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Dialog>
        <DialogTrigger
          render={<Button variant="ghost" size="icon" title="Keyboard Shortcuts" />}
        >
          <Keyboard className="w-4 h-4 text-muted-foreground" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{shortcut.label}</span>
                <div className="flex gap-1.5">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd 
                      key={keyIndex}
                      className="inline-flex h-6 items-center justify-center rounded border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
