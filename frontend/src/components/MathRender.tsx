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
        katex.render(latex, ref.current, {
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
