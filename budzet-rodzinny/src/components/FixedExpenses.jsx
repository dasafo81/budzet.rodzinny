import { useState } from 'react'
import MonthNav from './MonthNav'
import { CAT_ICONS, FX_GROUPS, fmt } from '../constants'

function FxModal({ onSave, onClose, preGroup }) {
  const [group, setGroup] = useState(preGroup || 'DOM')
  const [name, setName]   = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    if (!name.trim()) { alert('Podaj nazwę'); return }
    setSaving(true)
    const ok = await onSave({ group_name: group, name: name.trim(), amount: parseFloat(amount) || 0 })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div style={{ fontSize:16, fontWeight:600, marginBottom:'1.25rem' }}>Nowa stała pozycja</div>
        <div className="ff" style={{ marginBottom:10 }}>
          <label>Grupa</label>
          <select value={group} onChange={e => setGroup(e.target.value)}>
            {FX_GROUPS.map(g => <option key={g} value={g}>{CAT_ICONS[g] || '📌'} {g}</option>)}
          </select>
        </div>
        <div className="ff" style={{ marginBottom:10 }}>
          <label>Nazwa</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Netflix, Siłownia..." autoFocus />
        </div>
        <div className="ff" style={{ marginBottom:'1.25rem' }}>
          <label>Kwota (zł)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
            onKeyDown={e => e.key === 'Enter' && handle()} />
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={handle} disabled={saving}>
            {saving ? 'Zapisuję...' : 'Zapisz'}
          </button>
          <button className="btn-outline" onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}

function FxGroup({ group, items, monthKey, onSave, onDelete, onAddToTx, onAddSingleToTx, onAddNew }) {
  const [open, setOpen] = useState(true)
  const [localAmounts, setLocalAmounts] = useState({})
  const [saving, setSaving] = useState({})

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const isPaid = (name) => localStorage.getItem(`paid_${monthKey}_${group}_${name}`) === '1'
  const setPaid = (name, val) => localStorage.setItem(`paid_${monthKey}_${group}_${name}`, val ? '1' : '0')

  const handleSave = async (item) => {
    const val = localAmounts[item.name] !== undefined ? localAmounts[item.name] : item.amount
    setSaving(s => ({ ...s, [item.name]: true }))
    await onSave({ id: item.id, group_name: group, name: item.name, amount: parseFloat(val) || 0 })
    setSaving(s => ({ ...s, [item.name]: false }))
  }

  return (
    <div className="fx-group">
      <div className="fx-hdr" onClick={() => setOpen(o => !o)}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{CAT_ICONS[group] || '📌'}</span>
          <span style={{ fontSize:15, fontWeight:600 }}>{group}</span>
        </div>
        <span style={{ fontSize:14, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'var(--accent2)' }}>{fmt(total)}</span>
      </div>
      {open && (
        <div className="fx-body">
          {items.map(item => (
            <div key={item.id} className="fx-item">
              <div style={{ fontSize:14 }}>{item.name}</div>
              <div className="fx-item-r">
                <input type="number" className="fx-inp"
                  defaultValue={item.amount || 0}
                  onChange={e => setLocalAmounts(a => ({ ...a, [item.name]: e.target.value }))} />
                <button className="btn-sm" disabled={saving[item.name]} onClick={() => handleSave(item)}>
                  {saving[item.name] ? '...' : 'Zapisz'}
                </button>
                <button className="btn-sm" onClick={() => onAddSingleToTx(group, item)} title="Dodaj do transakcji">+</button>
                <input type="checkbox" defaultChecked={isPaid(item.name)}
                  onChange={e => setPaid(item.name, e.target.checked)}
                  style={{ width:20, height:20, accentColor:'var(--accent)', cursor:'pointer' }} />
                <button className="btn-del" onClick={() => { if (confirm(`Usunąć "${item.name}"?`)) onDelete(item.id, item.name) }}>×</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn-sm" onClick={() => onAddToTx(group)}>+ Dodaj wszystkie do transakcji</button>
            <button className="btn-sm" onClick={() => onAddNew(group)}>+ Nowa pozycja</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FixedExpenses({ user, fixedExpenses, monthLabel, changeMonth, saveFixed, deleteFixed, addTransaction, showToast }) {
  const [modal, setModal] = useState(null) // null | group string

  const monthKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })()

  // Group fixed expenses
  const grouped = {}
  fixedExpenses.forEach(f => {
    const g = f.group_name || f.group || 'INNE'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(f)
  })

  const grandTotal = fixedExpenses.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)

  const handleAddToTx = async (group) => {
    const items = grouped[group] || []
    const rows = items.filter(i => i.amount > 0).map(i => ({
      name: i.name, amount: i.amount,
      date: new Date().toISOString().split('T')[0],
      type: group === 'OSZCZĘDZANIE' ? 'savings' : 'expense',
      category: group, subcategory: i.name,
      payment_source: 'Porters',
    }))
    if (!rows.length) { showToast('Brak kwot do dodania', 'error'); return }
    let ok = true
    for (const row of rows) { const r = await addTransaction(row); if (!r) { ok = false } }
    if (ok) showToast(`Dodano ${rows.length} pozycji`)
  }

  const handleAddSingleToTx = async (group, item) => {
    if (!item.amount || item.amount <= 0) { showToast('Kwota musi być większa od 0', 'error'); return }
    const row = {
      name: item.name,
      amount: item.amount,
      date: new Date().toISOString().split('T')[0],
      type: group === 'OSZCZĘDZANIE' ? 'savings' : 'expense',
      category: group,
      subcategory: item.name,
      payment_source: 'Porters',
    }
    const ok = await addTransaction(row)
    if (ok) showToast(`Dodano: ${item.name}`)
  }

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
        <div style={{ fontSize:14, color:'var(--text2)' }}>Stałe wydatki każdego miesiąca.</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className="badge orange">Razem: {fmt(grandTotal)}</span>
          <button className="btn-sm" style={{ padding:'6px 14px', fontSize:13 }} onClick={() => setModal('')}>+ Dodaj pozycję</button>
        </div>
      </div>

      {Object.entries(grouped).map(([group, items]) => (
        <FxGroup key={group} group={group} items={items} monthKey={monthKey}
          onSave={saveFixed} onDelete={deleteFixed}
          onAddToTx={handleAddToTx} onAddSingleToTx={handleAddSingleToTx} onAddNew={g => setModal(g)} />
      ))}

      {fixedExpenses.length === 0 && <div className="empty">Brak stałych wydatków. Dodaj pierwszą pozycję.</div>}

      {modal !== null && (
        <FxModal preGroup={modal || 'DOM'} onSave={saveFixed} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
