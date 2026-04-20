import { CAT_COLORS, CAT_ICONS, SOURCE_ICONS, fmt, fmtDate } from '../constants'

export default function TxItem({ tx, userId, onDelete }) {
  const color = CAT_COLORS[tx.category] || '#888'
  const icon = CAT_ICONS[tx.category] || '📌'
  const sign = tx.type === 'income' ? '+' : tx.type === 'savings' ? '🏦 ' : '-'
  const cls = tx.type === 'income' ? 'pos' : 'neg'

  return (
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
        {onDelete && tx.user_id === userId && (
          <button className="btn-del" onClick={() => { if (confirm('Usunąć?')) onDelete(tx.id) }}>×</button>
        )}
      </div>
    </div>
  )
}
