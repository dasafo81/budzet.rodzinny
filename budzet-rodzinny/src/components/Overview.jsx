import MonthNav from './MonthNav'
import AddTransactionForm from './AddTransactionForm'
import TxItem from './TxItem'
import { CAT_COLORS, CAT_ICONS, fmt } from '../constants'

export default function Overview({ user, monthTransactions, monthLabel, changeMonth, addTransaction, deleteTransaction }) {
  const income   = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const savings  = monthTransactions.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
  const balance  = income - expenses - savings

  const bycat = {}
  monthTransactions.filter(t => t.type === 'expense').forEach(t => { bycat[t.category] = (bycat[t.category] || 0) + t.amount })
  const sorted = Object.entries(bycat).sort((a, b) => b[1] - a[1])
  const max = sorted[0]?.[1] || 1

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />

      {/* Stats */}
      <div className="g3" style={{ marginBottom:'1.5rem' }}>
        {[
          { label:'Przychody', val:income, cls:'green', sub: monthTransactions.filter(t=>t.type==='income').length + ' transakcji' },
          { label:'Wydatki',   val:expenses, cls:'red', sub: monthTransactions.filter(t=>t.type==='expense').length + ' transakcji' },
          { label:'Bilans',    val:balance, cls: balance >= 0 ? 'green' : 'red', sub: 'Oszczędności: ' + fmt(savings) },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="stat-lbl">{s.label}</div>
            <div className={`stat-val ${s.cls}`}>{fmt(s.val)}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        {/* Quick add */}
        <div className="card">
          <div className="card-title">Szybkie dodawanie</div>
          <AddTransactionForm onAdd={addTransaction} />
        </div>

        {/* Recent */}
        <div className="card">
          <div className="card-title">Ostatnie transakcje</div>
          <div className="tx-list" style={{ maxHeight:480 }}>
            {monthTransactions.length === 0
              ? <div className="empty">Brak transakcji w tym miesiącu</div>
              : monthTransactions.slice(0, 15).map(tx => (
                  <TxItem key={tx.id} tx={tx} userId={user.id} onDelete={deleteTransaction} />
                ))}
          </div>
        </div>
      </div>

      {/* Cat bars */}
      {sorted.length > 0 && (
        <div className="card" style={{ marginTop:'1rem' }}>
          <div className="card-title">Wydatki wg kategorii</div>
          {sorted.map(([cat, val]) => (
            <div key={cat} className="bar-row">
              <div className="bar-lbl">{CAT_ICONS[cat] || '📌'} {cat}</div>
              <div className="bar-track"><div className="bar-fill" style={{ width: Math.round(val/max*100)+'%', background: CAT_COLORS[cat]||'#888' }} /></div>
              <div className="bar-val">{fmt(val)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
