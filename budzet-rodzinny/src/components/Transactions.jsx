import { useState } from 'react'
import MonthNav from './MonthNav'
import { AddTransactionModal } from './AddTransactionForm'
import TxItem from './TxItem'
import { CAT_ICONS, SOURCES, SOURCE_ICONS, MONTHS, fmt } from '../constants'

const TYPE_FILTERS = [
  { value:'', label:'Wszystko' },
  { value:'expense', label:'Wydatki' },
  { value:'income', label:'Przychody' },
  { value:'savings', label:'Oszczędności' },
]

function dayLabel(dateStr) {
  const d = new Date(dateStr)
  const t = new Date(); t.setHours(0,0,0,0)
  const y = new Date(t); y.setDate(y.getDate() - 1)
  const cmp = new Date(d); cmp.setHours(0,0,0,0)
  if (cmp.getTime() === t.getTime()) return 'Dziś'
  if (cmp.getTime() === y.getTime()) return 'Wczoraj'
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`
}

export default function Transactions({
  monthTransactions, monthLabel, changeMonth,
  addTransaction, updateTransaction, deleteTransaction,
}) {
  const [adding, setAdding] = useState(false)
  const [typeF, setTypeF] = useState('')
  const [catF, setCatF] = useState('')
  const [srcF, setSrcF] = useState('')
  const [q, setQ] = useState('')

  const cats = [...new Set(monthTransactions.map(t => t.category).filter(Boolean))].sort()

  const filtered = monthTransactions
    .filter(t => !typeF || t.type === typeF)
    .filter(t => !catF  || t.category === catF)
    .filter(t => !srcF  || t.payment_source === srcF)
    .filter(t => {
      if (!q.trim()) return true
      const hay = `${t.name} ${t.category} ${t.subcategory || ''}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })

  const sum = filtered.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
  const hasFilters = typeF || catF || srcF || q.trim()

  // Group by date, newest first
  const groups = []
  filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(tx => {
    const last = groups[groups.length - 1]
    if (last && last.date === tx.date) last.items.push(tx)
    else groups.push({ date: tx.date, items: [tx] })
  })

  return (
    <div>
      <div className="page-head">
        <MonthNav label={monthLabel} onChange={changeMonth} />
        <button className="btn-add" onClick={() => setAdding(true)}>+ Dodaj transakcję</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <input type="search" className="filter-search" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Szukaj po nazwie lub kategorii…" />
          <select value={catF} onChange={e => setCatF(e.target.value)}>
            <option value="">Wszystkie kategorie</option>
            {cats.map(c => <option key={c} value={c}>{CAT_ICONS[c] || ''} {c}</option>)}
          </select>
          <select value={srcF} onChange={e => setSrcF(e.target.value)}>
            <option value="">Wszyscy płacący</option>
            {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>)}
          </select>
        </div>

        <div className="seg-row">
          {TYPE_FILTERS.map(f => (
            <button key={f.value} className={`seg ${typeF === f.value ? 'sel' : ''}`} onClick={() => setTypeF(f.value)}>
              {f.label}
            </button>
          ))}
          {hasFilters && (
            <button className="seg clear" onClick={() => { setTypeF(''); setCatF(''); setSrcF(''); setQ('') }}>
              Wyczyść filtry
            </button>
          )}
        </div>

        <div className="list-summary">
          <span>{filtered.length} {filtered.length === 1 ? 'transakcja' : 'transakcji'}</span>
          <span className="mono" style={{ color: sum >= 0 ? 'var(--accent)' : 'var(--danger)', fontWeight:600 }}>
            {sum >= 0 ? '+' : ''}{fmt(sum)}
          </span>
        </div>

        <div className="tx-list" style={{ maxHeight:'none' }}>
          {groups.length === 0
            ? <div className="empty">
                {hasFilters ? 'Nic nie pasuje do tych filtrów.' : 'Brak transakcji w tym miesiącu.'}
              </div>
            : groups.map(g => (
                <div key={g.date}>
                  <div className="day-head">
                    <span>{dayLabel(g.date)}</span>
                    <span className="mono">{fmt(g.items.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0))}</span>
                  </div>
                  <div className="tx-list">
                    {g.items.map(tx => (
                      <TxItem key={tx.id} tx={tx}
                        onEdit={updateTransaction} onDelete={deleteTransaction} />
                    ))}
                  </div>
                </div>
              ))}
        </div>
      </div>

      {adding && <AddTransactionModal onAdd={addTransaction} onClose={() => setAdding(false)} />}
    </div>
  )
}
