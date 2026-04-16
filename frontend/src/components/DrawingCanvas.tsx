import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, PencilBrush, Image as FabricImage } from 'fabric'

interface Props {
  onExport: (base64: string) => void
  width?: number
  height?: number
}

// Extension globale pour les tests E2E
declare global {
  interface Window {
    __injectTestImage: (base64: string) => Promise<void>;
    __getCanvasExport: () => string;
    __clearCanvas: () => void;
  }
}

export default function DrawingCanvas({ onExport, width = 900, height = 400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const [brushColor, setBrushColor] = useState('#1A1A2E')
  const [brushWidth, setBrushWidth] = useState(2)
  const [isEraser, setIsEraser] = useState(false)

  const handleClear = useCallback(() => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.set('backgroundColor', '#FFFFFF')
    fabricRef.current.renderAll()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    
    // Initialisation Fabric 7+
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: '#FFFFFF',
      width,
      height
    })
    
    canvas.freeDrawingBrush = new PencilBrush(canvas)
    canvas.freeDrawingBrush.color = brushColor
    canvas.freeDrawingBrush.width = brushWidth
    
    fabricRef.current = canvas

    // Exposer les fonctions pour E2E
    window.__injectTestImage = async (base64: string) => {
      if (!fabricRef.current) return;
      return new Promise((resolve, reject) => {
        const dataUrl = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
          .then((img) => {
            if (!fabricRef.current) return;
            img.scaleToWidth(fabricRef.current.width * 0.8);
            fabricRef.current.add(img);
            fabricRef.current.renderAll();
            resolve();
          })
          .catch(reject);
      });
    };
    window.__getCanvasExport = () => {
      if (!fabricRef.current) return '';
      return fabricRef.current.toDataURL({ multiplier: 1, format: 'png' }).split(',')[1];
    };
    window.__clearCanvas = () => {
      handleClear();
    };
    
    return () => { canvas.dispose() }
  }, [width, height, handleClear])

  useEffect(() => {
    if (!fabricRef.current) return
    const brush = fabricRef.current.freeDrawingBrush
    if (!brush) return

    if (isEraser) {
      brush.color = '#FFFFFF'
      brush.width = 20
    } else {
      brush.color = brushColor
      brush.width = brushWidth
    }
  }, [brushColor, brushWidth, isEraser])

  const handleUndo = useCallback(() => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    if (objects.length > 0) {
      fabricRef.current.remove(objects[objects.length - 1])
      fabricRef.current.renderAll()
    }
  }, [])

  const handleExport = useCallback(() => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    if (objects.length === 0) {
      alert("Tu n'as encore rien écrit ! Utilise le stylet pour répondre.")
      return
    }
    const dataUrl = fabricRef.current.toDataURL({ multiplier: 1, format: 'png', quality: 0.9 })
    const base64 = dataUrl.split(',')[1]
    onExport(base64)
  }, [onExport])

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#F3F4F6',
    borderRadius: '8px 8px 0 0',
    flexWrap: 'wrap'
  }

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: active ? '2px solid var(--accent-blue)' : '1px solid #D1D5DB',
    background: active ? '#EFF6FF' : 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: active ? 600 : 400,
    minHeight: '44px'
  })

  return (
    <div data-testid="canvas-container" style={{ border: '1px solid #E5E7EB', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={toolbarStyle}>
        {['#1A1A2E', '#2563EB', '#DC2626'].map(c => (
          <button
            key={c}
            data-testid="tool-color"
            onClick={() => { setBrushColor(c); setIsEraser(false) }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: c,
              border: brushColor === c && !isEraser ? '3px solid var(--accent-blue)' : '2px solid #D1D5DB',
              cursor: 'pointer'
            }}
          />
        ))}
        
        <div style={{ width: 1, height: 24, background: '#D1D5DB', margin: '0 4px' }} />
        
        {[1, 2, 4].map(w => (
          <button
            key={w}
            onClick={() => { setBrushWidth(w); setIsEraser(false) }}
            style={btnStyle(brushWidth === w && !isEraser)}
          >
            {'─'.repeat(w)}
          </button>
        ))}
        
        <div style={{ width: 1, height: 24, background: '#D1D5DB', margin: '0 4px' }} />
        
        <button data-testid="tool-eraser" onClick={() => setIsEraser(!isEraser)} style={btnStyle(isEraser)}>
          🧹 Gomme
        </button>
        <button data-testid="tool-undo" onClick={handleUndo} style={btnStyle()}>
          ↩️ Annuler
        </button>
        <button data-testid="tool-clear" onClick={handleClear} style={btnStyle()}>
          🗑️ Effacer tout
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          data-testid="submit-answer"
          onClick={handleExport}
          style={{
            ...btnStyle(),
            background: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            fontWeight: 600
          }}
        >
          ✅ Valider ma réponse
        </button>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
    </div>
  )
}
