import 'katex/dist/katex.min.css'
import { useRef, useEffect } from 'react'

// Utiliser require pour éviter les problèmes de types de KaTeX contrib
// const renderMathInElement = (window as any).renderMathInElement || (() => {});

interface Props {
  latex: string
  display?: boolean
}

export default function MathRender({ latex, display = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (ref.current && latex) {
      const text = String(latex)
      ref.current.textContent = text
      
      const options = {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false,
        trust: true
      };

      // @ts-ignore
      import('katex/dist/contrib/auto-render').then(module => {
        module.default(ref.current!, options);
      }).catch(() => {
        // Fallback si l'import dynamique échoue dans certains environnements
        try {
           (window as any).renderMathInElement(ref.current, options);
        } catch(e) {}
      });
    }
  }, [latex, display])
  
  return <span ref={ref} style={{ whiteSpace: 'pre-wrap' }} />
}
