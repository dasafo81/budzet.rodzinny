import { useState } from 'react'
import MonthNav from './MonthNav'
import { AddTransactionModal } from './AddTransactionForm'
import TxItem from './TxItem'
import { CAT_COLORS, CAT_ICONS, SOURCES, SOURCE_ICONS, fmt } from '../constants'

export default function Overview({
  monthTransactions, fixedExpenses, monthLabel, changeMonth,
  addTransaction, updateTransaction, deleteTransaction,
}) {
  const [adding, setAdding] = useState(false)

  const income   = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings  = monthTransactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
  const balance  = income - expenses - savings

  // Planned expense budget (everything except income + savings rows)
  const planExpenses = fixedExpenses
    .filter(f => { const g = f.group_name || f.group; return g !== 'OSZCZĘDZANIE' && g !== 'PRZYCHÓD' })
    .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
  const planPct = planExpenses > 0 ? Math.round((expenses / planExpenses) * 100) : null
  const planColor = planPct === null ? 'var(--accent)' : planPct > 100 ? 'var(--danger)' : planPct > 80 ? 'var(--warn)' : 'var(--accent)'

  // Plan per main category, to show remaining budget next to each bar
  const planByCat = {}
  fixedExpenses.forEach(f => {
    const g = f.group_name || f.group
    planByCat[g] = (planByCat[g] || 0) + (parseFloat(f.amount) || 0)
  })

  const bycat = {}
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    bycat[t.category] = (bycat[t.category] || 0) + t.amount
  })
  const sorted = Object.entries(bycat).sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] || 1

  const bySource = {}
  monthTransactions.filter(t => t.type === 'expense').forEach(t => {
    const s = t.payment_source || '—'
    bySource[s] = (bySource[s] || 0) + t.amount
  })

  return (
    <div>
      <div className="page-head">
        <MonthNav label={monthLabel} onChange={changeMonth} />
        <button className="btn-add" onClick={() => setAdding(true)}>+ Dodaj transakcję</button>
      </div>

      <div className="g3" style={{ marginBottom:'1rem' }}>
        <div className="card">
          <div className="stat-lbl">Przychody</div>
          <div className="stat-val green">{fmt(income)}</div>
          <div className="stat-sub">{monthTransactions.filter(t => t.type === 'income').length} transakcji</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Wydatki</div>
          <div className="stat-val red">{fmt(expenses)}</div>
          <div className="stat-sub">{monthTransactions.filter(t => t.type === 'expense').length} transakcji</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Bilans</div>
          <div className={`stat-val ${balance >= 0 ? 'green' : 'red'}`}>{fmt(balance)}</div>
          <div className="stat-sub">Odłożone: {fmt(savings)}</div>
        </div>
      </div>

      {planExpenses > 0 && (
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div className="plan-head">
            <div className="card-title" style={{ marginBottom:0 }}>Wykorzystanie budżetu</div>
            <div className="plan-nums">
              <span className="mono" style={{ color:planColor, fontWeight:600 }}>{fmt(expenses)}</span>
              <span style={{ color:'var(--text3)' }}> z {fmt(planExpenses)}</span>
            </div>
          </div>
          <div className="bar-track" style={{ height:10 }}>
            <div className="bar-fill" style={{ width: Math.min(planPct, 100) + '%', background: planColor }} />
          </div>
          <div className="stat-sub" style={{ marginTop:6 }}>
            {expenses > planExpenses
              ? `Plan przekroczony o ${fmt(expenses - planExpenses)} (${planPct}%)`
              : `Zostało ${fmt(planExpenses - expenses)} — wykorzystano ${planPct}% planu`}
          </div>
        </div>
      )}

      <div className="g2">
        <div className="card">
          <div className="card-title">Wydatki wg kategorii</div>
          {sorted.length === 0
            ? <div className="empty">Brak wydatków w tym miesiącu</div>
            : sorted.map(([cat, val]) => {
                const plan = planByCat[cat] || 0
                const pct = plan > 0 ? Math.round((val / plan) * 100) : null
                return (
                  <div key={cat} className="catline">
                    <div className="catline-top">
                      <span className="catline-name">{CAT_ICONS[cat] || '📌'} {cat}</span>
                      <span className="catline-amt mono">{fmt(val)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: Math.round(val / max * 100) + '%', background: CAT_COLORS[cat] || '#888' }} />
                    </div>
                    {pct !== null && (
                      <div className="catline-sub" style={{ color: pct > 100 ? 'var(--danger)' : 'var(--text3)' }}>
                        {pct}% planu ({fmt(plan)})
                      </div>
                    )}
                  </div>
                )
              })}

          {Object.keys(bySource).length > 0 && (
            <>
              <div className="card-title" style={{ marginTop:'1.5rem' }}>Kto płacił</div>
              <div className="src-row">
                {SOURCES.filter(s => bySource[s]).map(s => (
                  <div key={s} className="src-tile">
                    <div className="src-tile-ico">{SOURCE_ICONS[s]}</div>
                    <div className="src-tile-name">{s}</div>
                    <div className="src-tile-amt mono">{fmt(bySource[s])}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">Ostatnie transakcje</div>
          <div className="tx-list" style={{ maxHeight:520 }}>
            {monthTransactions.length === 0
              ? <div className="empty">Jeszcze nic tu nie ma. Dodaj pierwszą transakcję.</div>
              : monthTransactions.slice(0, 15).map(tx => (
                  <TxItem key={tx.id} tx={tx}
                    onEdit={updateTransaction} onDelete={deleteTransaction} />
                ))}
          </div>
        </div>
      </div>

      {adding && <AddTransactionModal onAdd={addTransaction} onClose={() => setAdding(false)} />}
    </div>
  )
}
