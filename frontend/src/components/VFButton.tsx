interface Props {
  value: boolean | null
  onChange: (v: boolean | null) => void
}

export default function VFButton({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
      <button
        onClick={() => onChange(value === true ? null : true)}
        style={{
          padding: '12px 32px',
          borderRadius: 'var(--radius)',
          border: '2px solid',
          borderColor: value === true ? 'var(--accent-green)' : '#E5E7EB',
          background: value === true ? 'var(--correct-bg)' : 'white',
          color: value === true ? 'var(--accent-green)' : 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minWidth: '110px',
          minHeight: '44px' // Tablette-first
        }}
      >
        VRAI
      </button>
      <button
        onClick={() => onChange(value === false ? null : false)}
        style={{
          padding: '12px 32px',
          borderRadius: 'var(--radius)',
          border: '2px solid',
          borderColor: value === false ? 'var(--accent-red)' : '#E5E7EB',
          background: value === false ? 'var(--incorrect-bg)' : 'white',
          color: value === false ? 'var(--accent-red)' : 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minWidth: '110px',
          minHeight: '44px'
        }}
      >
        FAUX
      </button>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          border: '2px solid #E5E7EB',
          background: 'white',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          minHeight: '44px',
          opacity: value === null ? 0.5 : 1
        }}
        title="Je ne sais pas"
      >
        ?
      </button>
    </div>
  )
}
