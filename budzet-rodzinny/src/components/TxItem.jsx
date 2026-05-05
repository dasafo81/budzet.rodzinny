import { useState } from 'react'
import { CAT_COLORS, CAT_ICONS, SOURCE_ICONS, fmt, fmtDate } from '../constants'

export default function TxItem({ tx, userId, onEdit, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: tx.name,
    amount: tx.amount,
    category: tx.category,
    subcategory: tx.subcategory || '',
    payment_source: tx.payment_source || '',
    date: tx.date,
  })

  const color = CAT_COLORS[tx.category] || '#888'
  const icon = CAT_ICONS[tx.category] || '📌'
  const sign = tx.type === 'income' ? '+' : tx.type === 'savings' ? '🏦 ' : '-'
  const cls = tx.type === 'income' ? 'pos' : 'neg'

  const handleSave = async () => {
    const success = await onEdit(tx.id, form)
    if (success) setShowModal(false)
  }

  return (
    <>
      <div className="txi">
        <div className="txi-l">
          <div className="txi-ico" style={{ background: color + '22' }}>{icon}</div>
          <div>
            <div className="txi-name">{tx.name}</div>
            <div className="txi-meta">{tx.subcategory || tx.category} · {fmtDate(tx.date)} · {tx.user_name}</div>
          </div>
        </div>
        <div className="txi-r">
          {tx.payment_source && (
            <span className="src-badge">{SOURCE_ICONS[tx.payment_source] || ''} {tx.payment_source}</span>
          )}
          <div className={`txi-amt ${cls}`}>{sign}{fmt(tx.amount)}</div>
          <button className="btn-edit" onClick={() => setShowModal(true)} title="Edytuj">✎</button>
          <button className="btn-del" onClick={() => { if (confirm('Usunąć?')) onDelete(tx.id) }} title="Usuń">×</button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edytuj transakcję</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>
                Nazwa
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Kwota
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
              </label>
              <label>
                Kategoria
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </label>
              <label>
                Podkategoria
                <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="Opcjonalnie" />
              </label>
              <label>
                Źródło płatności
                <input value={form.payment_source} onChange={e => setForm({ ...form, payment_source: e.target.value })} placeholder="Opcjonalnie" />
              </label>
              <label>
                Data
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Anuluj</button>
              <button className="btn-primary" onClick={handleSave}>Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
