import katex from 'katex'
import renderMathInElement from 'katex/dist/contrib/auto-render'
import 'katex/dist/katex.min.css'
import { useRef, useEffect } from 'react'

interface Props {
  latex: string
  display?: boolean
}

export default function MathRender({ latex, display = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (ref.current && latex) {
      const text = String(latex)
      
      // 1. On injecte d'abord le texte brut
      ref.current.textContent = text
      
      // 2. On laisse auto-render chercher les formules et les transformer
      // Il va chercher les délimiteurs standards : $...$, $$...$$, \(...\), \[...\]
      try {
        renderMathInElement(ref.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false,
          trust: true
        })
      } catch (e) {
        console.error("KaTeX auto-render error:", e)
      }
    }
  }, [latex, display])
  
  return <span ref={ref} style={{ whiteSpace: 'pre-wrap' }} />
}
