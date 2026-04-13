import { useState, useEffect } from 'react'

export default function Timer() {
  const [seconds, setSeconds] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '1.2rem',
      color: 'var(--text-secondary)',
      background: 'var(--bg-card)',
      padding: '4px 12px',
      borderRadius: '8px',
      boxShadow: 'var(--shadow)',
      fontWeight: 'bold'
    }}>
      ⏱️ {mm}:{ss}
    </div>
  )
}
