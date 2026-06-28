import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, ArrowUp, ArrowDown, Edit3 } from 'lucide-react';
import { SystemNode } from '@/store/canvasStore';

interface ContextMenuProps {
  x: number;
  y: number;
  node: SystemNode;
  onClose: () => void;
  onRename: (node: SystemNode) => void;
  onDuplicate: (node: SystemNode) => void;
  onDelete: (node: SystemNode) => void;
  onCopy: (node: SystemNode) => void;
  onBringForward: (node: SystemNode) => void;
  onSendBack: (node: SystemNode) => void;
}

export function ContextMenu({
  x,
  y,
  node,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onCopy,
  onBringForward,
  onSendBack,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Element)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-[100] min-w-[170px] bg-zinc-950/85 backdrop-blur-md border border-zinc-800 shadow-xl rounded-xl p-1.5 flex flex-col gap-0.5 text-zinc-300 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 mb-1">
        Node: {String(node.data?.label || 'Component')}
      </div>

      <button
        onClick={() => {
          onRename(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-left w-full"
      >
        <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
        <span>Rename</span>
      </button>

      <button
        onClick={() => {
          onDuplicate(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-left w-full"
      >
        <Copy className="w-3.5 h-3.5 text-zinc-400" />
        <div className="flex-1 flex items-center justify-between">
          <span>Duplicate</span>
          <kbd className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850">Ctrl+D</kbd>
        </div>
      </button>

      <button
        onClick={() => {
          onCopy(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-left w-full"
      >
        <Copy className="w-3.5 h-3.5 text-zinc-400" />
        <div className="flex-1 flex items-center justify-between">
          <span>Copy</span>
          <kbd className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850">Ctrl+C</kbd>
        </div>
      </button>

      <div className="h-px bg-zinc-900 my-1" />

      <button
        onClick={() => {
          onBringForward(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-left w-full"
      >
        <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
        <span>Bring Forward</span>
      </button>

      <button
        onClick={() => {
          onSendBack(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-left w-full"
      >
        <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
        <span>Send Back</span>
      </button>

      <div className="h-px bg-zinc-900 my-1" />

      <button
        onClick={() => {
          onDelete(node);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-destructive/15 text-destructive hover:text-destructive-foreground transition-colors cursor-pointer text-left w-full"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <div className="flex-1 flex items-center justify-between">
          <span>Delete</span>
          <kbd className="text-[9px] font-mono text-destructive/80 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850">Del</kbd>
        </div>
      </button>
    </div>
  );
}
