import { useEffect, useState } from 'react'

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 3000)
    return () => clearTimeout(t)
  }, [toast])

  if (!visible || !toast) return null
  return <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>
}
