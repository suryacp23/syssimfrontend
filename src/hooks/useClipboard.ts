import { useCanvasStore } from '@/store/canvasStore';

export function useClipboard() {
  const copySelection = useCanvasStore((state) => state.copySelection);
  const pasteSelection = useCanvasStore((state) => state.pasteSelection);
  const clipboard = useCanvasStore((state) => state.clipboard);

  return {
    copy: copySelection,
    paste: pasteSelection,
    hasItems: !!clipboard && clipboard.nodes.length > 0,
  };
}
