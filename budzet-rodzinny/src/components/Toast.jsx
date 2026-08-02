import { useEffect, useState } from 'react'

export default function Toast({ toast }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), toast.action ? 6000 : 3000)
    return () => clearTimeout(t)
  }, [toast])

  if (!visible || !toast) return null

  return (
    <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
      <span>{toast.msg}</span>
      {toast.action && (
        <button className="toast-action" onClick={() => { setVisible(false); toast.action.onClick() }}>
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
