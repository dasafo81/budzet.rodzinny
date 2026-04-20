import MonthNav from './MonthNav'
import TxItem from './TxItem'
import { SAVINGS_NAMES, SAVINGS_ICONS, SAVINGS_TARGETS, fmt } from '../constants'

export default function Savings({ user, transactions, monthTransactions, monthLabel, changeMonth }) {
  const totals = { wakacje:0, inwestycje:0, poduszka:0 }
  transactions.filter(t => t.type === 'savings').forEach(t => {
    if (totals[t.subcategory] !== undefined) totals[t.subcategory] += t.amount
  })
  const savTxs = monthTransactions.filter(t => t.type === 'savings')

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />
      <div className="g3" style={{ marginBottom:'1rem' }}>
        {Object.keys(totals).map(key => {
          const pct = Math.min(Math.round(totals[key] / SAVINGS_TARGETS[key] * 100), 100)
          return (
            <div key={key} className="sv-card">
              <div style={{ fontSize:24, marginBottom:8 }}>{SAVINGS_ICONS[key]}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:4 }}>{SAVINGS_NAMES[key]}</div>
              <div style={{ fontSize:20, fontWeight:600, fontFamily:"'DM Mono',monospace", color:'var(--accent)' }}>{fmt(totals[key])}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Cel: {fmt(SAVINGS_TARGETS[key])}</div>
              <div className="sv-prog"><div className="sv-fill" style={{ width: pct + '%' }} /></div>
            </div>
          )
        })}
      </div>
      <div className="card">
        <div className="card-title">Historia wpłat — {monthLabel}</div>
        <div className="tx-list" style={{ maxHeight:400 }}>
          {savTxs.length === 0
            ? <div className="empty">Brak oszczędności w tym miesiącu</div>
            : savTxs.map(tx => <TxItem key={tx.id} tx={tx} userId={user.id} />)}
        </div>
      </div>
    </div>
  )
}
