import { useState } from 'react'
import MonthNav from './MonthNav'
import AddTransactionForm from './AddTransactionForm'
import TxItem from './TxItem'
import { CAT_ICONS, SOURCES, SOURCE_ICONS, fmt } from '../constants'

export default function Transactions({ user, monthTransactions, monthLabel, changeMonth, addTransaction, deleteTransaction }) {
  const [typeF, setTypeF] = useState('')
  const [catF, setCatF] = useState('')
  const [sourceF, setSourceF] = useState('')

  const cats = [...new Set(monthTransactions.map(t => t.category).filter(Boolean))]
  const filtered = monthTransactions
    .filter(t => !typeF   || t.type === typeF)
    .filter(t => !catF    || t.category === catF)
    .filter(t => !sourceF || t.payment_source === sourceF)

  // Per-source summary (expenses only)
  const bySource = SOURCES.map(s => ({
    source: s,
    total: monthTransactions.filter(t => t.type === 'expense' && t.payment_source === s).reduce((sum, t) => sum + t.amount, 0),
    count: monthTransactions.filter(t => t.type === 'expense' && t.payment_source === s).length,
  })).filter(s => s.count > 0)

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />
      <div className="g2">
        <div className="card">
          <div className="card-title">Dodaj transakcję</div>
          <AddTransactionForm onAdd={addTransaction} />
        </div>
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
            <div className="card-title" style={{ marginBottom:0 }}>Wszystkie transakcje</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}>
                <option value="">Wszystkie typy</option>
                <option value="expense">Wydatki</option>
                <option value="income">Przychody</option>
                <option value="savings">Oszczędności</option>
              </select>
              <select value={catF} onChange={e => setCatF(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}>
                <option value="">Wszystkie kategorie</option>
                {cats.map(c => <option key={c} value={c}>{CAT_ICONS[c] || ''} {c}</option>)}
              </select>
              <select value={sourceF} onChange={e => setSourceF(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}>
                <option value="">Wszystkie źródła</option>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>)}
              </select>
            </div>
          </div>
          <div className="tx-list" style={{ maxHeight:520 }}>
            {filtered.length === 0
              ? <div className="empty">Brak transakcji</div>
              : filtered.map(tx => <TxItem key={tx.id} tx={tx} userId={user.id} onDelete={deleteTransaction} />)}
          </div>
        </div>
      </div>

      {bySource.length > 0 && (
        <div className="card" style={{ marginTop:'1rem' }}>
          <div className="card-title">Wydatki wg źródła finansowania</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {bySource.map(({ source, total, count }) => (
              <div key={source} onClick={() => setSourceF(sourceF === source ? '' : source)}
                style={{
                  flex:'1 1 140px', padding:'14px 18px', borderRadius:'var(--r)',
                  background: sourceF === source ? 'var(--accent-l)' : 'var(--surface2)',
                  border: `1px solid ${sourceF === source ? 'var(--accent)' : 'var(--border)'}`,
                  cursor:'pointer', transition:'all .15s'
                }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{SOURCE_ICONS[source]}</div>
                <div style={{ fontWeight:600, fontSize:15 }}>{source}</div>
                <div style={{ fontSize:18, fontWeight:700, color:'var(--accent2)', fontFamily:"'DM Mono',monospace", marginTop:4 }}>{fmt(total)}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{count} transakcji</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
