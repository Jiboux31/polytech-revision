import MathRender from './MathRender'
import MiniCanvas from './MiniCanvas'

export default function ChampsManuscrits({ champs }: {
  champs: { label: string, id: string, width: string }[]
}) {
  const widthMap = { small: 200, medium: 350, large: 700 }
  
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end'
    }}>
      {champs.map(ch => (
        <div key={ch.id}>
          <div style={{
            fontSize: '0.9rem', marginBottom: 4,
            color: 'var(--text-secondary)'
          }}>
            <MathRender latex={ch.label} />
          </div>
          <MiniCanvas
            width={widthMap[ch.width as keyof typeof widthMap] || 350}
            height={60}
            id={ch.id}
          />
        </div>
      ))}
    </div>
  )
}
