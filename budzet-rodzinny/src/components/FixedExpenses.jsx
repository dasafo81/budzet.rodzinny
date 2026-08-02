import { useState } from 'react'
import MonthNav from './MonthNav'
import { CATEGORIES, CAT_ICONS, FX_GROUPS, SAVINGS_CATS, SAVINGS_NAMES, fmt } from '../constants'

// Build the full list of budget rows: every canonical subcategory from constants.js
// (so it always lines up 1:1 with what's selectable in "Dodaj transakcję"), plus any
// extra custom items already saved in fixed_expenses that don't match a canonical name
// (e.g. legacy entries like "Netflix").
function buildRows(fixedExpenses, monthTransactions) {
  const rows = []
  FX_GROUPS.forEach(group => {
    const canonical = group === 'OSZCZĘDZANIE'
      ? SAVINGS_CATS.map(key => ({ name: key, label: SAVINGS_NAMES[key] || key }))
      : (CATEGORIES[group] || []).map(n => ({ name: n, label: n }))
    const canonicalNames = new Set(canonical.map(c => c.name))
    const existingForGroup = fixedExpenses.filter(f => (f.group_name || f.group) === group)
    const extra = existingForGroup
      .filter(f => !canonicalNames.has(f.name))
      .map(f => ({ name: f.name, label: f.name }))

    ;[...canonical, ...extra].forEach(({ name, label }) => {
      const existing = existingForGroup.find(f => f.name === name)
      const plan = existing ? (parseFloat(existing.amount) || 0) : 0
      const actual = monthTransactions
        .filter(t => t.category === group && t.subcategory === name && t.type !== 'income')
        .reduce((s, t) => s + t.amount, 0)
      rows.push({ group, name, label, id: existing?.id, plan, actual })
    })
  })
  return rows
}

function buildInsights(expenseRows, totalPlanExp, totalActualExp, totalPlanSav, totalActualSav) {
  const insights = []
  if (totalPlanExp > 0) {
    const pct = Math.round((totalActualExp / totalPlanExp) * 100)
    insights.push(
      totalActualExp > totalPlanExp
        ? `Łącznie przekroczyliście plan wydatków o ${fmt(totalActualExp - totalPlanExp)} (${pct}% planu).`
        : `Wykorzystaliście ${pct}% zaplanowanego budżetu wydatków — zostało ${fmt(totalPlanExp - totalActualExp)}.`
    )
  }
  const over = expenseRows
    .filter(r => r.plan > 0 && r.actual > r.plan)
    .sort((a, b) => (b.actual - b.plan) - (a.actual - a.plan))
  over.slice(0, 3).forEach(r => insights.push(`⚠️ ${r.group} → ${r.label}: przekroczono plan o ${fmt(r.actual - r.plan)}.`))

  if (totalPlanSav > 0) {
    insights.push(
      totalActualSav >= totalPlanSav
        ? `💰 Cel oszczędności na ten miesiąc osiągnięty — odłożono ${fmt(totalActualSav)} (plan: ${fmt(totalPlanSav)}).`
        : `💰 Do miesięcznego celu oszczędności brakuje jeszcze ${fmt(totalPlanSav - totalActualSav)}.`
    )
  }
  if (!over.length && totalPlanExp > 0) {
    const under = expenseRows
      .filter(r => r.plan > 0 && r.actual < r.plan)
      .sort((a, b) => (b.plan - b.actual) - (a.plan - a.actual))
    if (under.length) insights.push(`✅ Największy zapas budżetu macie w „${under[0].label}” — zostało ${fmt(under[0].plan - under[0].actual)}.`)
  }
  return insights
}

function FxModal({ onSave, onClose, preGroup }) {
  const [group, setGroup] = useState(preGroup || 'DOM')
  const [name, setName] = useState('')
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
        <div style={{ fontSize:16, fontWeight:600, marginBottom:'1.25rem' }}>Nowa pozycja budżetu</div>
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
          <label>Plan miesięczny (zł)</label>
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

function BudgetRow({ row, isSavings, localAmounts, setLocalAmounts, savingKeys, onSaveRow, onDelete, onAddSingleToTx }) {
  const key = row.group + '|' + row.name
  const localVal = localAmounts[key]
  const plan = localVal !== undefined ? (parseFloat(localVal) || 0) : row.plan
  const pct = plan > 0 ? Math.round((row.actual / plan) * 100) : (row.actual > 0 ? 100 : 0)
  const diff = isSavings ? (row.actual - plan) : (plan - row.actual)
  const good = diff >= 0

  let barColor
  if (isSavings) barColor = row.actual >= plan ? 'var(--accent)' : (pct >= 60 ? 'var(--warn)' : 'var(--danger)')
  else barColor = pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : 'var(--accent)'

  return (
    <div className="bdg-item">
      <div className="bdg-item-top">
        <div style={{ fontSize:14, fontWeight:500 }}>{row.label}</div>
        <div className="fx-item-r">
          <button className="btn-sm" disabled={savingKeys[key]} onClick={() => onSaveRow(row, localVal)}>
            {savingKeys[key] ? '...' : 'Zapisz'}
          </button>
          <button className="btn-sm" onClick={() => onAddSingleToTx(row, plan)} title="Dodaj do transakcji">+</button>
          {row.id && (
            <button className="btn-del" onClick={() => { if (confirm(`Usunąć plan dla "${row.label}"?`)) onDelete(row.id, row.label) }}>×</button>
          )}
        </div>
      </div>
      <div className="bdg-row">
        <div className="bdg-field">
          <span className="bdg-lbl">Plan</span>
          <input type="number" className="fx-inp" defaultValue={row.plan || 0}
            onChange={e => setLocalAmounts(a => ({ ...a, [key]: e.target.value }))} />
        </div>
        <div className="bdg-field">
          <span className="bdg-lbl">Rzeczywiste</span>
          <div className="bdg-val">{fmt(row.actual)}</div>
        </div>
        <div className="bdg-field">
          <span className="bdg-lbl">Różnica</span>
          <div className="bdg-val" style={{ color: good ? 'var(--accent)' : 'var(--danger)' }}>
            {diff >= 0 ? '+' : ''}{fmt(diff)}
          </div>
        </div>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width: Math.min(pct, 100) + '%', background: barColor }} /></div>
    </div>
  )
}

function BudgetGroup({ group, rows, localAmounts, setLocalAmounts, savingKeys, onSaveRow, onDelete, onAddGroupToTx, onAddSingleToTx, onAddNew }) {
  const [open, setOpen] = useState(true)
  const isSavings = group === 'OSZCZĘDZANIE'
  const totalPlan = rows.reduce((s, r) => s + r.plan, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0)
  const diff = isSavings ? (totalActual - totalPlan) : (totalPlan - totalActual)
  const good = diff >= 0

  return (
    <div className="fx-group">
      <div className="fx-hdr" onClick={() => setOpen(o => !o)} style={{ flexWrap:'wrap', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>{CAT_ICONS[group] || '📌'}</span>
          <span style={{ fontSize:15, fontWeight:600 }}>{group}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'var(--text3)' }}>Plan {fmt(totalPlan)}</span>
          <span style={{ fontSize:12, color:'var(--text3)' }}>Fakt {fmt(totalActual)}</span>
          <span style={{ fontSize:14, fontWeight:600, fontFamily:"'DM Mono',monospace", color: good ? 'var(--accent)' : 'var(--danger)' }}>
            {diff >= 0 ? '+' : '-'}{fmt(Math.abs(diff))}
          </span>
        </div>
      </div>
      {open && (
        <div className="fx-body">
          {rows.length === 0
            ? <div className="empty">Brak pozycji</div>
            : rows.map(row => (
                <BudgetRow key={row.name} row={row} isSavings={isSavings}
                  localAmounts={localAmounts} setLocalAmounts={setLocalAmounts} savingKeys={savingKeys}
                  onSaveRow={onSaveRow} onDelete={onDelete} onAddSingleToTx={onAddSingleToTx} />
              ))}
          <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn-sm" onClick={() => onAddGroupToTx(group, rows)}>+ Dodaj wszystkie do transakcji</button>
            <button className="btn-sm" onClick={() => onAddNew(group)}>+ Nowa pozycja</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FixedExpenses({ user, fixedExpenses, monthTransactions, monthLabel, changeMonth, saveFixed, deleteFixed, addTransaction, showToast }) {
  const [modal, setModal] = useState(null) // null | group string
  const [localAmounts, setLocalAmounts] = useState({})
  const [savingKeys, setSavingKeys] = useState({})

  const rows = buildRows(fixedExpenses, monthTransactions)
  const byGroup = {}
  rows.forEach(r => { (byGroup[r.group] ||= []).push(r) })

  const expenseRows = rows.filter(r => r.group !== 'OSZCZĘDZANIE')
  const savingsRows = rows.filter(r => r.group === 'OSZCZĘDZANIE')
  const totalPlanExp = expenseRows.reduce((s, r) => s + r.plan, 0)
  const totalActualExp = expenseRows.reduce((s, r) => s + r.actual, 0)
  const totalPlanSav = savingsRows.reduce((s, r) => s + r.plan, 0)
  const totalActualSav = savingsRows.reduce((s, r) => s + r.actual, 0)
  const balance = totalPlanExp - totalActualExp
  const insights = buildInsights(expenseRows, totalPlanExp, totalActualExp, totalPlanSav, totalActualSav)

  const handleSaveRow = async (row, val) => {
    const key = row.group + '|' + row.name
    const amount = val !== undefined ? (parseFloat(val) || 0) : row.plan
    setSavingKeys(s => ({ ...s, [key]: true }))
    await saveFixed({ id: row.id, group_name: row.group, name: row.name, amount })
    setSavingKeys(s => ({ ...s, [key]: false }))
  }

  const handleAddSingleToTx = async (row, plan) => {
    if (!plan || plan <= 0) { showToast('Ustaw najpierw kwotę planu', 'error'); return }
    const ok = await addTransaction({
      name: row.label, amount: plan,
      date: new Date().toISOString().split('T')[0],
      type: row.group === 'OSZCZĘDZANIE' ? 'savings' : 'expense',
      category: row.group, subcategory: row.name,
      payment_source: 'Porters',
    })
    if (ok) showToast(`Dodano: ${row.label}`)
  }

  const handleAddGroupToTx = async (group, groupRows) => {
    const withPlan = groupRows.filter(r => r.plan > 0)
    if (!withPlan.length) { showToast('Brak kwot planu do dodania', 'error'); return }
    let ok = true
    for (const row of withPlan) {
      const r = await addTransaction({
        name: row.label, amount: row.plan,
        date: new Date().toISOString().split('T')[0],
        type: group === 'OSZCZĘDZANIE' ? 'savings' : 'expense',
        category: group, subcategory: row.name,
        payment_source: 'Porters',
      })
      if (!r) ok = false
    }
    if (ok) showToast(`Dodano ${withPlan.length} pozycji`)
  }

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />

      <div className="g3" style={{ marginBottom:'1rem' }}>
        <div className="card">
          <div className="stat-lbl">Plan wydatków</div>
          <div className="stat-val">{fmt(totalPlanExp)}</div>
          <div className="stat-sub">Rzeczywiste: {fmt(totalActualExp)}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Bilans planu</div>
          <div className={`stat-val ${balance >= 0 ? 'green' : 'red'}`}>{balance >= 0 ? '+' : ''}{fmt(balance)}</div>
          <div className="stat-sub">{balance >= 0 ? 'Zostało w budżecie' : 'Przekroczono budżet'}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Oszczędności — fakt / plan</div>
          <div className="stat-val" style={{ color:'var(--accent)' }}>{fmt(totalActualSav)}</div>
          <div className="stat-sub">Cel na miesiąc: {fmt(totalPlanSav)}</div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div className="card-title">Wnioski tego miesiąca</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {insights.map((t, i) => <div key={i} style={{ fontSize:14, lineHeight:1.5 }}>{t}</div>)}
          </div>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:8 }}>
        <div style={{ fontSize:14, color:'var(--text2)' }}>Zaplanuj budżet dla każdej podkategorii i porównuj z rzeczywistymi wydatkami.</div>
        <button className="btn-sm" style={{ padding:'6px 14px', fontSize:13 }} onClick={() => setModal('')}>+ Dodaj pozycję</button>
      </div>

      {FX_GROUPS.map(group => (
        <BudgetGroup key={group} group={group} rows={byGroup[group] || []}
          localAmounts={localAmounts} setLocalAmounts={setLocalAmounts} savingKeys={savingKeys}
          onSaveRow={handleSaveRow} onDelete={deleteFixed}
          onAddGroupToTx={handleAddGroupToTx} onAddSingleToTx={handleAddSingleToTx}
          onAddNew={g => setModal(g)} />
      ))}

      {modal !== null && (
        <FxModal preGroup={modal || 'DOM'} onSave={saveFixed} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
