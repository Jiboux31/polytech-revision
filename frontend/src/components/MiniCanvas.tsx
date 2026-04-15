import { useRef, useState, useEffect } from 'react'
import { Canvas, PencilBrush } from 'fabric'

export default function MiniCanvas({ width, height, id }: { width: number, height: number, id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null)

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

    setFabricCanvas(canvas)

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
    <div style={{ border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className={`mini-canvas-${id}`} />
    </div>
  )
}
