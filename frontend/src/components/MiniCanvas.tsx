import { useRef, useState, useEffect } from 'react'
import { fabric } from 'fabric'

export default function MiniCanvas({ width, height, id }: { width: number, height: number, id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width,
      height,
      backgroundColor: '#ffffff'
    })
    
    // Default brush settings
    canvas.freeDrawingBrush.color = '#000000'
    canvas.freeDrawingBrush.width = 2

    // Set id for extraction
    ;(canvas as any).customId = id

    setFabricCanvas(canvas)

    // On unmount
    return () => {
      canvas.dispose()
    }
  }, [width, height, id])

  return (
    <div style={{ border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
      <canvas ref={canvasRef} className={`mini-canvas-${id}`} />
    </div>
  )
}
