import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useRef, useEffect } from 'react'

interface Props {
  latex: string
  display?: boolean
}

export default function MathRender({ latex, display = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      try {
        // Patch heuristique pour ajouter des espaces autour des mots français
        // car le JSON source mélange texte et LaTeX sans \text{}
        const patchedLatex = latex.replace(/([a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]{3,})/g, '\\text{ $1 }')
        
        katex.render(patchedLatex, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true
        })
      } catch (e) {
        ref.current.textContent = latex
      }
    }
  }, [latex, display])
  
  return <span ref={ref} />
}
