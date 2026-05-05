import { useState } from 'react'
import MonthNav from './MonthNav'
import AddTransactionForm from './AddTransactionForm'
import TxItem from './TxItem'
import { CAT_ICONS } from '../constants'

export default function Transactions({ user, monthTransactions, monthLabel, changeMonth, addTransaction, updateTransaction, deleteTransaction }) {
  const [typeF, setTypeF] = useState('')
  const [catF, setCatF] = useState('')

  const cats = [...new Set(monthTransactions.map(t => t.category).filter(Boolean))]
  const filtered = monthTransactions
    .filter(t => !typeF || t.type === typeF)
    .filter(t => !catF  || t.category === catF)

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />
      <div className="g2">
        <div className="card">
          <div className="card-title">Dodaj transakcję</div>
          <AddTransactionForm onAdd={addTransaction} />
        </div>
        <div className="card" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div className="card-title" style={{ marginBottom:0 }}>Wszystkie transakcje</div>
            <div style={{ display:'flex', gap:8 }}>
              <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}>
                <option value="">Wszystkie</option>
                <option value="expense">Wydatki</option>
                <option value="income">Przychody</option>
                <option value="savings">Oszczędności</option>
              </select>
              <select value={catF} onChange={e => setCatF(e.target.value)} style={{ width:'auto', padding:'6px 10px', fontSize:13 }}>
                <option value="">Wszystkie kategorie</option>
                {cats.map(c => <option key={c} value={c}>{CAT_ICONS[c] || ''} {c}</option>)}
              </select>
            </div>
          </div>
          <div className="tx-list" style={{ maxHeight:520 }}>
            {filtered.length === 0
              ? <div className="empty">Brak transakcji</div>
              : filtered.map(tx => <TxItem key={tx.id} tx={tx} userId={user.id} onEdit={updateTransaction} onDelete={deleteTransaction} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
