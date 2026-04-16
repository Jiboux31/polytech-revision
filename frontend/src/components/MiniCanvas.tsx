import { useRef, useEffect } from 'react'
import { Canvas, PencilBrush, Image as FabricImage } from 'fabric'

export default function MiniCanvas({ width, height, id }: { width: number, height: number, id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      width,
      height,
      backgroundColor: '#ffffff'
    })
    
    // Default brush settings
    const brush = new PencilBrush(canvas)
    brush.color = '#000000'
    brush.width = 2
    canvas.freeDrawingBrush = brush

    // Set id for extraction
    ;(canvas as any).customId = id

    // Injection helper for E2E
    ;(window as any).__injectTestImage = (base64: string) => {
      return new Promise((resolve, reject) => {
        const dataUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
          .then((img) => {
            img.scaleToWidth(canvas.width * 0.9);
            canvas.add(img);
            canvas.renderAll();
            resolve(true);
          })
          .catch(reject);
      });
    }

    ;(window as any).__getCanvasExport = () => {
      return canvas.toDataURL({ multiplier: 1, format: 'png' }).split(',')[1];
    }

    ;(window as any).clearCanvas = (canvasId: string) => {
      const c = (window as any).activeCanvases[canvasId];
      if (c) {
        c.clear();
        c.set('backgroundColor', '#ffffff');
        c.renderAll();
      }
    }

    // Store in window for global collection
    if (!(window as any).activeCanvases) (window as any).activeCanvases = {}
    ;(window as any).activeCanvases[id] = canvas

    // On unmount
    return () => {
      delete (window as any).activeCanvases[id]
      canvas.dispose()
    }
  }, [width, height, id])

  return (
    <div data-testid="canvas-container" style={{ border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className={`mini-canvas-${id}`} />
    </div>
  )
}
