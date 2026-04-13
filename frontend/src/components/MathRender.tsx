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
        let finalLatex = latex
        
        // Le problème est que KaTeX en mode math écrase tous les espaces.
        // Si le texte contient des espaces, on transforme les espaces en `~` (espace insécable LaTeX)
        // ou on insère des espaces LaTeX `\;` entre les mots qui ne sont pas des commandes LaTeX.
        
        // Patch heuristique V3 :
        // Pour chaque espace dans la chaîne, on le remplace par '\ ' (espace explicite LaTeX)
        // SAUF si l'espace fait partie d'une commande (ex: "\lim_{x \to \infty}")
        if (latex.includes(' ')) {
             // Remplace tous les espaces simples par un espace LaTeX explicite
             finalLatex = latex.replace(/ /g, '\\ ')
        }

        katex.render(finalLatex, ref.current, {
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
