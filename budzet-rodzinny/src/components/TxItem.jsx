import { useState } from 'react'
import {
  CATEGORIES, CAT_COLORS, CAT_ICONS, SOURCES, SOURCE_ICONS,
  INCOME_CATS, SAVINGS_CATS, SAVINGS_NAMES, fmt, fmtDate,
} from '../constants'

function subOptionsFor(tx, category) {
  if (tx.type === 'income') return INCOME_CATS
  if (tx.type === 'savings') return SAVINGS_CATS
  return CATEGORIES[category] || []
}

export default function TxItem({ tx, onEdit, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const subLabel = tx.type === 'savings'
    ? (SAVINGS_NAMES[tx.subcategory] || tx.subcategory || tx.category)
    : (tx.subcategory || tx.category)

  const open = () => {
    setForm({
      name: tx.name, amount: tx.amount, category: tx.category,
      subcategory: tx.subcategory || '', payment_source: tx.payment_source || '', date: tx.date,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!onEdit) { setShowModal(false); return }
    setSaving(true)
    const ok = await onEdit(tx.id, { ...form, amount: parseFloat(form.amount) || 0 })
    setSaving(false)
    if (ok) setShowModal(false)
  }

  const subOptions = subOptionsFor(tx, form.category)

  return (
    <>
      <div className="txi">
        <div className="txi-l">
          <div className="txi-ico" style={{ background: color + '22' }}>{icon}</div>
          <div style={{ minWidth:0 }}>
            <div className="txi-name">{tx.name}</div>
            <div className="txi-meta">{subLabel} · {fmtDate(tx.date)} · {tx.user_name}</div>
          </div>
        </div>
        <div className="txi-r">
          {tx.payment_source && (
            <span className="src-badge">{SOURCE_ICONS[tx.payment_source] || ''} {tx.payment_source}</span>
          )}
          <div className={`txi-amt ${cls}`}>{sign}{fmt(tx.amount)}</div>
          {onEdit && <button className="btn-edit" onClick={open} title="Edytuj">✎</button>}
          {onDelete && <button className="btn-del" onClick={() => { if (confirm(`Usunąć „${tx.name}”?`)) onDelete(tx.id) }} title="Usuń">×</button>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edytuj transakcję</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>
                Opis
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Kwota (zł)
                <input type="number" step="0.01" min="0" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} />
              </label>

              {tx.type === 'expense' && (
                <label>
                  Kategoria
                  <select value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value, subcategory: '' })}>
                    {Object.keys(CATEGORIES).map(g => (
                      <option key={g} value={g}>{CAT_ICONS[g] || '📌'} {g}</option>
                    ))}
                  </select>
                </label>
              )}

              <label>
                Podkategoria
                <select value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}>
                  <option value="">— wybierz —</option>
                  {subOptions.map(s => (
                    <option key={s} value={s}>{tx.type === 'savings' ? (SAVINGS_NAMES[s] || s) : s}</option>
                  ))}
                </select>
              </label>

              <label>
                Źródło finansowania
                <select value={form.payment_source} onChange={e => setForm({ ...form, payment_source: e.target.value })}>
                  <option value="">— brak —</option>
                  {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>)}
                </select>
              </label>

              <label>
                Data
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowModal(false)}>Anuluj</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
