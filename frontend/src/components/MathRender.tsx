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
    if (ref.current && latex) {
      const text = String(latex)
      
      // Si le texte ne contient pas de délimiteurs LaTeX $ ou \, on l'affiche simplement
      // mais on permet quand même le rendu KaTeX si c'est du pur LaTeX
      if (!text.includes('$') && !text.includes('\\')) {
        ref.current.textContent = text
        return
      }

      try {
        // Pour le Run 3, on va utiliser une approche simplifiée :
        // Si ça ressemble à une phrase avec des petits morceaux de math entre $ $
        // On pourrait utiliser renderMathInElement, mais ici on va juste
        // s'assurer que si on rend tout le bloc, les espaces sont respectés.
        
        // Hack: KaTeX ignore les espaces sauf si on utilise \text{} ou \ 
        // Si c'est un texte complet, on l'enrobe dans \text{} pour KaTeX
        // Sauf si ça commence par un caractère mathématique typique
        const isPureMath = text.startsWith('\\') || text.includes('^') || text.includes('_') || text.includes('{')
        
        let toRender = text
        if (!isPureMath) {
            toRender = `\\text{${text}}`
        }

        katex.render(toRender, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
          strict: false
        })
      } catch (e) {
        ref.current.textContent = text
      }
    }
  }, [latex, display])
  
  return <span ref={ref} />
}
