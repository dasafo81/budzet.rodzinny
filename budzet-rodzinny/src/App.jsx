import { useState, useEffect, useCallback } from 'react'
import { sb } from './supabase'
import Auth from './components/Auth'
import Overview from './components/Overview'
import Transactions from './components/Transactions'
import FixedExpenses from './components/FixedExpenses'
import Savings from './components/Savings'
import AIPanel from './components/AIPanel'
import Toast from './components/Toast'
import { MONTHS } from './constants'

const TABS = [
  { id: 'overview', label: 'Przegląd' },
  { id: 'transactions', label: 'Transakcje' },
  { id: 'fixed', label: 'Stałe wydatki' },
  { id: 'savings', label: 'Oszczędności' },
  { id: 'ai', label: 'Analiza AI' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d })

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type, id: Date.now() })
  }, [])

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadTransactions = useCallback(async () => {
    const { data, error } = await sb.from('transactions').select('*').order('date', { ascending: false })
    if (error) { showToast('Błąd: ' + error.message, 'error'); return }
    setTransactions(data || [])
  }, [showToast])

  const loadFixed = useCallback(async () => {
    const { data, error } = await sb.from('fixed_expenses').select('*')
    if (error) { showToast('Błąd stałych: ' + error.message, 'error'); return }
    setFixedExpenses(data || [])
  }, [showToast])

  useEffect(() => {
    if (!user) { setTransactions([]); setFixedExpenses([]); return }
    loadTransactions()
    loadFixed()
    const channel = sb.channel('budget-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, loadTransactions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixed_expenses' }, loadFixed)
      .subscribe()
    return () => sb.removeChannel(channel)
  }, [user, loadTransactions, loadFixed])

  const addTransaction = useCallback(async (row) => {
    const { error } = await sb.from('transactions').insert([{
      ...row,
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email.split('@')[0],
    }])
    if (error) { showToast('Błąd: ' + error.message, 'error'); return false }
    showToast('Dodano: ' + row.name)
    return true
  }, [user, showToast])

  const deleteTransaction = useCallback(async (id) => {
    const { error } = await sb.from('transactions').delete().eq('id', id)
    if (error) { showToast('Błąd: ' + error.message, 'error'); return false }
    showToast('Usunięto')
    return true
  }, [showToast])

  const saveFixed = useCallback(async (row) => {
    let error
    if (row.id) {
      const r = await sb.from('fixed_expenses').update({ name: row.name, group_name: row.group_name, amount: row.amount }).eq('id', row.id)
      error = r.error
    } else {
      const r = await sb.from('fixed_expenses').insert([{ name: row.name, group_name: row.group_name, amount: row.amount, active: true }])
      error = r.error
    }
    if (error) { showToast('Błąd: ' + error.message, 'error'); return false }
    showToast('Zapisano: ' + row.name)
    await loadFixed()
    return true
  }, [showToast, loadFixed])

  const deleteFixed = useCallback(async (id, name) => {
    const { error } = await sb.from('fixed_expenses').delete().eq('id', id)
    if (error) { showToast('Błąd: ' + error.message, 'error'); return false }
    showToast('Usunięto: ' + name)
    await loadFixed()
    return true
  }, [showToast, loadFixed])

  const changeMonth = (dir) => {
    setViewDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + dir); return d })
  }

  const monthLabel = MONTHS[viewDate.getMonth()] + ' ' + viewDate.getFullYear()
  const monthTransactions = transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth()
  })

  if (loading) return <div className="center-screen">Ładowanie...</div>
  if (!user) return <Auth />

  const panelProps = { user, transactions, monthTransactions, fixedExpenses, viewDate, monthLabel, changeMonth, addTransaction, deleteTransaction, saveFixed, deleteFixed, showToast }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <div className="topbar">
        <div className="logo">budżet<span>.</span>rodzinny</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="user-chip">{user.user_metadata?.name || user.email.split('@')[0]}</div>
          <button className="btn-outline" onClick={() => sb.auth.signOut()}>Wyloguj</button>
        </div>
      </div>
      <div className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="main">
        {tab === 'overview'     && <Overview      {...panelProps} />}
        {tab === 'transactions' && <Transactions  {...panelProps} />}
        {tab === 'fixed'        && <FixedExpenses {...panelProps} />}
        {tab === 'savings'      && <Savings       {...panelProps} />}
        {tab === 'ai'           && <AIPanel       {...panelProps} />}
      </div>
      <Toast toast={toast} />
    </div>
  )
}
