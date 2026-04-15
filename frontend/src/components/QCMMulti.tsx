interface QCMOption {
  label: string
  correct: boolean
}

export default function QCMMulti({ options, selected, onChange }: {
  options: QCMOption[]
  selected: Set<number>
  onChange: (selected: Set<number>) => void
}) {
  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius)',
            border: '2px solid',
            borderColor: selected.has(i) ? 'var(--accent-blue)' : '#D1D5DB',
            background: selected.has(i) ? '#EFF6FF' : 'white',
            color: selected.has(i) ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: selected.has(i) ? 600 : 400,
            cursor: 'pointer',
            minWidth: 120,
            minHeight: 44,
            fontSize: '0.95rem'
          }}
        >
          {selected.has(i) ? '☑' : '☐'} {opt.label}
        </button>
      ))}
    </div>
  )
}
