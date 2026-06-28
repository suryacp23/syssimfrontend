import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/store/canvasStore';
import { useClipboard } from './useClipboard';

export function useKeyboardShortcuts() {
  const { deleteElements } = useReactFlow();
  const { undo, redo, selectAll, duplicateNode, activeProjectId, projects } = useCanvasStore();
  const { copy, paste } = useClipboard();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid intercepting keystrokes when typing in input controls
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = event.ctrlKey || event.metaKey;

      // 1. Delete / Backspace: Delete selected elements
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (!activeProjectId) return;
        const currentNodes = projects[activeProjectId]?.nodes || [];
        const currentEdges = projects[activeProjectId]?.edges || [];

        const selectedNodes = currentNodes.filter((n) => n.selected);
        const selectedEdges = currentEdges.filter((e) => e.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();
          deleteElements({ nodes: selectedNodes, edges: selectedEdges });
        }
      }

      // 2. Ctrl + C: Copy selection
      if (isCtrl && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copy();
      }

      // 3. Ctrl + V: Paste selection
      if (isCtrl && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        paste();
      }

      // 4. Ctrl + D: Duplicate selection
      if (isCtrl && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateNode();
      }

      // 5. Ctrl + A: Select all
      if (isCtrl && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selectAll();
      }

      // 6. Ctrl + Z / Ctrl + Shift + Z: Undo & Redo
      if (isCtrl && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          event.preventDefault();
          redo();
        } else {
          event.preventDefault();
          undo();
        }
      }

      // 7. Ctrl + Y: Redo
      if (isCtrl && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    activeProjectId,
    projects,
    deleteElements,
    copy,
    paste,
    duplicateNode,
    selectAll,
    undo,
    redo,
  ]);
}
