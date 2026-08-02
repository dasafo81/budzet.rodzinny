import { useState } from 'react'
import MonthNav from './MonthNav'
import { CATEGORIES, CAT_ICONS, FX_GROUPS, SAVINGS_CATS, SAVINGS_NAMES, INCOME_CATS, SOURCES, SOURCE_ICONS, fmt } from '../constants'

const ALL_GROUPS = ['PRZYCHÓD', ...FX_GROUPS]

function canonicalFor(group) {
  if (group === 'OSZCZĘDZANIE') return SAVINGS_CATS.map(key => ({ name: key, label: SAVINGS_NAMES[key] || key }))
  if (group === 'PRZYCHÓD') return INCOME_CATS.map(n => ({ name: n, label: n }))
  return (CATEGORIES[group] || []).map(n => ({ name: n, label: n }))
}

// Every canonical subcategory always shows up (so it lines up 1:1 with "Dodaj transakcję"),
// plus any extra item already saved in fixed_expenses, plus any category/subcategory that
// only exists in older transactions — otherwise trimming the category list would silently
// hide past spending.
function buildRows(fixedExpenses, monthTransactions) {
  const rows = []

  const groupOf = f => f.group_name || f.group
  const legacyGroups = [...new Set([
    ...fixedExpenses.map(groupOf),
    ...monthTransactions.map(t => t.category),
  ])].filter(g => g && !ALL_GROUPS.includes(g))
  const groups = [...ALL_GROUPS, ...legacyGroups]

  groups.forEach(group => {
    const canonical = canonicalFor(group)
    const canonicalNames = new Set(canonical.map(c => c.name))
    const existingForGroup = fixedExpenses.filter(f => groupOf(f) === group)

    const seen = new Set(canonicalNames)
    const extra = []
    existingForGroup.forEach(f => {
      if (f.name && !seen.has(f.name)) { seen.add(f.name); extra.push({ name: f.name, label: f.name }) }
    })
    monthTransactions.forEach(t => {
      const isIncome = t.type === 'income'
      if (t.category !== group) return
      if (group === 'PRZYCHÓD' ? !isIncome : isIncome) return
      const sub = t.subcategory || '—'
      if (!seen.has(sub)) { seen.add(sub); extra.push({ name: sub, label: sub, legacy: true }) }
    })

    ;[...canonical, ...extra].forEach(({ name, label, legacy }) => {
      const existing = existingForGroup.find(f => f.name === name)
      const plan = existing ? (parseFloat(existing.amount) || 0) : 0
      const actual = monthTransactions
        .filter(t => t.category === group && (t.subcategory || '—') === name && (group === 'PRZYCHÓD' ? t.type === 'income' : t.type !== 'income'))
        .reduce((s, t) => s + t.amount, 0)
      if (legacy && plan === 0 && actual === 0) return
      rows.push({ group, name, label, id: existing?.id, plan, actual, legacy: !!legacy })
    })
  })
  return rows
}

function buildInsights(expenseRows, totalPlanExp, totalActualExp, totalPlanSav, totalActualSav, pozostajeDoRozdysponowania) {
  const insights = []
  if (Math.abs(pozostajeDoRozdysponowania) > 1) {
    insights.push(
      pozostajeDoRozdysponowania > 0
        ? `Plan nie jest jeszcze domknięty — ${fmt(pozostajeDoRozdysponowania)} planowanych przychodów nie ma jeszcze przypisanej kategorii.`
        : `Plan wydatków i oszczędności przekracza planowane przychody o ${fmt(-pozostajeDoRozdysponowania)}.`
    )
  }
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
            {ALL_GROUPS.map(g => <option key={g} value={g}>{CAT_ICONS[g] || '📌'} {g}</option>)}
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

// In-cell "data bar" — mimics Numbers' conditional-format green bars behind the % number.
function PctCell({ plan, pct, colorVar }) {
  if (!(plan > 0)) return <div className="bdg-cell right"><span className="pct-empty">—</span></div>
  const barWidth = Math.min(Math.max(pct, 0), 100)
  return (
    <div className="bdg-cell right">
      <div className="pct-bar" style={{ background:`linear-gradient(to right, ${colorVar}26 ${barWidth}%, transparent ${barWidth}%)` }}>
        <span style={{ color: colorVar }}>{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

function colorFor(pct, reverseGood) {
  if (reverseGood) return pct >= 100 ? 'var(--accent)' : pct >= 60 ? 'var(--warn)' : 'var(--danger)'
  return pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warn)' : 'var(--accent)'
}

function BudgetItemRow({ row, reverseGood, localAmounts, setLocalAmounts, savingKeys, onSaveRow, onDelete, onPay }) {
  const key = row.group + '|' + row.name
  const localVal = localAmounts[key]
  const plan = localVal !== undefined ? (parseFloat(localVal) || 0) : row.plan
  const pct = plan > 0 ? (row.actual / plan) * 100 : 0
  const diff = reverseGood ? (row.actual - plan) : (plan - row.actual)
  const good = diff >= 0
  const color = plan > 0 ? colorFor(pct, reverseGood) : (good ? 'var(--accent)' : 'var(--danger)')
  const [dirty, setDirty] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Plans save themselves when the field loses focus — no save button to forget.
  const handleBlur = async () => {
    if (!dirty) return
    setDirty(false)
    const ok = await onSaveRow(row, localVal)
    if (ok !== false) { setJustSaved(true); setTimeout(() => setJustSaved(false), 1600) }
  }

  const paid = row.actual > 0

  return (
    <div className="bdg-row-wrap">
      <div className="bdg-cell bdg-itemname">
        {row.label}
        {row.legacy && <span className="tag-legacy" title="Pozycja spoza aktualnej listy kategorii — pochodzi ze starszych transakcji">archiwalne</span>}
      </div>
      <div className="bdg-cell right">
        <input type="number" className="fx-inp bdg-inp" defaultValue={row.plan || 0}
          onChange={e => { setLocalAmounts(a => ({ ...a, [key]: e.target.value })); setDirty(true) }}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} />
      </div>
      <div className="bdg-cell right mono">{fmt(row.actual)}</div>
      <div className="bdg-cell right mono" style={{ color: good ? 'var(--accent)' : 'var(--danger)' }}>
        {diff >= 0 ? '+' : ''}{fmt(diff)}
      </div>
      <PctCell plan={plan} pct={pct} colorVar={color} />
      <div className="bdg-cell bdg-actions">
        {savingKeys[key] ? <span className="save-hint">zapisuję…</span>
          : justSaved ? <span className="save-hint ok">zapisano</span>
          : plan > 0 ? (
            <button className={`pay-btn ${paid ? 'paid' : ''}`}
              title={paid ? `W tym miesiącu zapisano już ${fmt(row.actual)}. Kliknij, żeby dopisać kolejną kwotę.` : 'Zapisz jako transakcję'}
              onClick={() => onPay([row])}>
              {paid ? '✓ Zapisane' : 'Zapłacone'}
            </button>
          ) : null}
        {row.id && <button className="bdg-icon-btn danger" title="Usuń plan" onClick={() => { if (confirm(`Usunąć plan dla "${row.label}"?`)) onDelete(row.id, row.label) }}>×</button>}
      </div>
    </div>
  )
}

function BudgetGroupBlock({ group, rows, reverseGood, onlyActive, localAmounts, setLocalAmounts, savingKeys, onSaveRow, onDelete, onPay, onAddNew }) {
  const [open, setOpen] = useState(true)
  const totalPlan = rows.reduce((s, r) => s + r.plan, 0)
  const totalActual = rows.reduce((s, r) => s + r.actual, 0)
  const pct = totalPlan > 0 ? (totalActual / totalPlan) * 100 : 0
  const diff = reverseGood ? (totalActual - totalPlan) : (totalPlan - totalActual)
  const good = diff >= 0
  const color = totalPlan > 0 ? colorFor(pct, reverseGood) : (good ? 'var(--accent)' : 'var(--danger)')

  const visibleRows = onlyActive ? rows.filter(r => r.plan > 0 || r.actual > 0) : rows
  const missing = rows.filter(r => r.plan > 0 && r.actual === 0)

  if (onlyActive && visibleRows.length === 0) return null

  return (
    <>
      <div className="bdg-row-wrap bdg-grouprow" onClick={() => setOpen(o => !o)}>
        <div className="bdg-cell bdg-groupname"><span>{CAT_ICONS[group] || '📌'}</span> {group}</div>
        <div className="bdg-cell right mono">{fmt(totalPlan)}</div>
        <div className="bdg-cell right mono">{fmt(totalActual)}</div>
        <div className="bdg-cell right mono" style={{ color: good ? 'var(--accent)' : 'var(--danger)' }}>
          {diff >= 0 ? '+' : ''}{fmt(diff)}
        </div>
        <PctCell plan={totalPlan} pct={pct} colorVar={color} />
        <div className="bdg-cell bdg-toggle">{open ? '▾' : '▸'}</div>
      </div>
      {open && visibleRows.map(row => (
        <BudgetItemRow key={row.name} row={row} reverseGood={reverseGood}
          localAmounts={localAmounts} setLocalAmounts={setLocalAmounts} savingKeys={savingKeys}
          onSaveRow={onSaveRow} onDelete={onDelete} onPay={onPay} />
      ))}
      {open && (
        <div className="bdg-row-wrap bdg-groupactions">
          <div className="bdg-cell" style={{ gridColumn:'1 / -1', display:'flex', gap:8, flexWrap:'wrap', padding:'6px 10px 10px' }}>
            {missing.length > 0 && (
              <button className="btn-sm" onClick={() => onPay(missing)}>
                Zapisz nieopłacone ({missing.length})
              </button>
            )}
            <button className="btn-sm" onClick={() => onAddNew(group)}>+ Nowa pozycja</button>
          </div>
        </div>
      )}
    </>
  )
}

// Turns planned positions into real transactions — with amounts you can correct first,
// so a 300 zł plan doesn't get booked when the bill actually came to 340 zł.
function PayModal({ group, items, onClose, onConfirm }) {
  const [rows, setRows] = useState(
    items.map(r => ({ ...r, checked: true, amount: String(r.plan || '') }))
  )
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [source, setSource] = useState('Porters')
  const [busy, setBusy] = useState(false)

  const setRow = (name, patch) =>
    setRows(rs => rs.map(r => (r.name === name ? { ...r, ...patch } : r)))

  const chosen = rows.filter(r => r.checked && (parseFloat(r.amount) || 0) > 0)
  const total = chosen.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const confirm = async () => {
    if (!chosen.length) return
    setBusy(true)
    await onConfirm(chosen.map(r => ({ row: r, amount: parseFloat(r.amount) || 0 })), { date, source })
    setBusy(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{items.length === 1 ? 'Zapisz wydatek' : `Zapisz wydatki — ${group}`}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="pay-list">
          {rows.map(r => {
            const already = r.actual > 0
            return (
              <div key={r.name} className={`pay-row ${r.checked ? '' : 'off'}`}>
                <input type="checkbox" checked={r.checked}
                  onChange={e => setRow(r.name, { checked: e.target.checked })} />
                <div className="pay-name">
                  {r.label}
                  {already && <span className="pay-note">zapisano już {fmt(r.actual)}</span>}
                </div>
                <input type="number" className="fx-inp pay-amt" value={r.amount} min="0" step="0.01"
                  onChange={e => setRow(r.name, { amount: e.target.value })} />
              </div>
            )
          })}
        </div>

        <div className="form-row" style={{ marginTop:14 }}>
          <div className="ff">
            <label>Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="ff">
            <label>Źródło finansowania</label>
            <select value={source} onChange={e => setSource(e.target.value)}>
              {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICONS[s]} {s}</option>)}
            </select>
          </div>
        </div>

        <div className="pay-total">
          <span>{chosen.length} {chosen.length === 1 ? 'pozycja' : 'pozycji'}</span>
          <span className="mono" style={{ fontWeight:600 }}>{fmt(total)}</span>
        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Anuluj</button>
          <button className="btn-primary" onClick={confirm} disabled={busy || !chosen.length}>
            {busy ? 'Zapisuję…' : `Zapisz ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function TableHeader({ planLabel }) {
  return (
    <div className="bdg-row-wrap bdg-headrow">
      <div className="bdg-th">Kategoria</div>
      <div className="bdg-th right">{planLabel}</div>
      <div className="bdg-th right">Rzeczywiste</div>
      <div className="bdg-th right">Różnica</div>
      <div className="bdg-th right">%</div>
      <div className="bdg-th"></div>
    </div>
  )
}

export default function FixedExpenses({ fixedExpenses, monthTransactions, viewDate, monthLabel, changeMonth, saveFixed, deleteFixed, addTransaction, showToast }) {
  const [modal, setModal] = useState(null) // null | group string
  const [payItems, setPayItems] = useState(null) // null | array of rows
  const [onlyActive, setOnlyActive] = useState(true)
  const [localAmounts, setLocalAmounts] = useState({})
  const [savingKeys, setSavingKeys] = useState({})

  const rows = buildRows(fixedExpenses, monthTransactions)
  const byGroup = {}
  rows.forEach(r => { (byGroup[r.group] ||= []).push(r) })

  const incomeRows = byGroup['PRZYCHÓD'] || []
  const expenseRows = rows.filter(r => r.group !== 'OSZCZĘDZANIE' && r.group !== 'PRZYCHÓD')
  const savingsRows = rows.filter(r => r.group === 'OSZCZĘDZANIE')

  // Canonical groups first, then any legacy group still carrying data
  const expenseGroupNames = [
    ...FX_GROUPS,
    ...Object.keys(byGroup).filter(g => g !== 'PRZYCHÓD' && !FX_GROUPS.includes(g)),
  ]

  const totalPlanIncome = incomeRows.reduce((s, r) => s + r.plan, 0)
  const totalActualIncome = incomeRows.reduce((s, r) => s + r.actual, 0)
  const totalPlanExp = expenseRows.reduce((s, r) => s + r.plan, 0)
  const totalActualExp = expenseRows.reduce((s, r) => s + r.actual, 0)
  const totalPlanSav = savingsRows.reduce((s, r) => s + r.plan, 0)
  const totalActualSav = savingsRows.reduce((s, r) => s + r.actual, 0)

  const totalPlanAlloc = totalPlanExp + totalPlanSav
  const totalActualAlloc = totalActualExp + totalActualSav
  const pozostajeDoRozdysponowania = totalPlanIncome - totalPlanAlloc
  const mogeJeszczeWydac = totalPlanAlloc - totalActualAlloc

  const now = new Date()
  const isCurrentMonth = viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const daysRemaining = isCurrentMonth ? Math.max(daysInMonth - now.getDate() + 1, 1) : null
  const dailyAllowance = daysRemaining ? mogeJeszczeWydac / daysRemaining : null

  const insights = buildInsights(expenseRows, totalPlanExp, totalActualExp, totalPlanSav, totalActualSav, pozostajeDoRozdysponowania)

  const handleSaveRow = async (row, val) => {
    const key = row.group + '|' + row.name
    const amount = val !== undefined ? (parseFloat(val) || 0) : row.plan
    if (amount === row.plan) return true
    setSavingKeys(s => ({ ...s, [key]: true }))
    const ok = await saveFixed({ id: row.id, group_name: row.group, name: row.name, amount }, { silent: true })
    setSavingKeys(s => ({ ...s, [key]: false }))
    return ok
  }

  const handlePayConfirm = async (entries, { date, source }) => {
    let added = 0
    for (const { row, amount } of entries) {
      const r = await addTransaction({
        name: row.label, amount, date,
        type: row.group === 'OSZCZĘDZANIE' ? 'savings' : row.group === 'PRZYCHÓD' ? 'income' : 'expense',
        category: row.group, subcategory: row.name,
        payment_source: source,
      }, { silent: true })
      if (r) added++
    }
    if (added) showToast(added === 1 ? `Zapisano: ${entries[0].row.label}` : `Zapisano ${added} pozycji`)
  }

  const rowProps = { localAmounts, setLocalAmounts, savingKeys, onSaveRow: handleSaveRow, onDelete: deleteFixed, onPay: setPayItems }
  const handleAddNewIncome = () => setModal('PRZYCHÓD')

  const hiddenCount = rows.filter(r => r.plan === 0 && r.actual === 0).length

  return (
    <div>
      <MonthNav label={monthLabel} onChange={changeMonth} />

      <div className="card-title" style={{ marginBottom:8 }}>Plan budżetu</div>
      <div className="g3" style={{ marginBottom:'1rem' }}>
        <div className="card">
          <div className="stat-lbl">Planowane przychody</div>
          <div className="stat-val">{fmt(totalPlanIncome)}</div>
          <div className="stat-sub">Rzeczywiste: {fmt(totalActualIncome)}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Planowane wydatki (z oszczędnościami)</div>
          <div className="stat-val">{fmt(totalPlanAlloc)}</div>
          <div className="stat-sub">Rzeczywiste: {fmt(totalActualAlloc)}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Pozostaje do rozdysponowania</div>
          <div className={`stat-val ${Math.abs(pozostajeDoRozdysponowania) <= 1 ? 'green' : pozostajeDoRozdysponowania > 0 ? '' : 'red'}`}>
            {fmt(pozostajeDoRozdysponowania)}
          </div>
          <div className="stat-sub">Po dopięciu planu powinno być 0 zł</div>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom:8 }}>Realizacja tego miesiąca</div>
      <div className="g3" style={{ marginBottom:'1rem' }}>
        <div className="card">
          <div className="stat-lbl">Rzeczywiste przychody</div>
          <div className="stat-val green">{fmt(totalActualIncome)}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Rzeczywiste wydatki (z oszczędnościami)</div>
          <div className="stat-val red">{fmt(totalActualAlloc)}</div>
        </div>
        <div className="card">
          <div className="stat-lbl">Mogę jeszcze wydać do końca miesiąca</div>
          <div className={`stat-val ${mogeJeszczeWydac >= 0 ? 'green' : 'red'}`}>{fmt(mogeJeszczeWydac)}</div>
          {dailyAllowance !== null && (
            <div className="stat-sub">Dziennie: {fmt(dailyAllowance)} (zostało {daysRemaining} dni)</div>
          )}
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

      <div className="table-head">
        <div className="card-title" style={{ marginBottom:0 }}>Przychody</div>
        <label className="toggle-line">
          <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />
          Pokaż tylko aktywne
          {onlyActive && hiddenCount > 0 && <span className="toggle-note">ukryto {hiddenCount}</span>}
        </label>
      </div>
      <div className="bdg-scroll" style={{ marginBottom:'1.5rem' }}>
        <div className="bdg-table">
          <TableHeader planLabel="Plan przychodów" />
          {(onlyActive ? incomeRows.filter(r => r.plan > 0 || r.actual > 0) : incomeRows).map(row => (
            <BudgetItemRow key={row.name} row={row} reverseGood={true} {...rowProps} />
          ))}
          <div className="bdg-row-wrap bdg-groupactions">
            <div className="bdg-cell" style={{ gridColumn:'1 / -1', display:'flex', gap:8, flexWrap:'wrap', padding:'6px 10px 10px' }}>
              <button className="btn-sm" onClick={handleAddNewIncome}>+ Nowe źródło przychodu</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom:8 }}>Wydatki i oszczędności</div>
      <div className="bdg-scroll">
        <div className="bdg-table">
          <TableHeader planLabel="Plan wydatków" />
          {expenseGroupNames.map(group => (
            <BudgetGroupBlock key={group} group={group} rows={byGroup[group] || []}
              reverseGood={group === 'OSZCZĘDZANIE'}
              onlyActive={onlyActive}
              {...rowProps}
              onAddNew={g => setModal(g)} />
          ))}
        </div>
      </div>

      {modal !== null && (
        <FxModal preGroup={modal || 'DOM'} onSave={saveFixed} onClose={() => setModal(null)} />
      )}

      {payItems && payItems.length > 0 && (
        <PayModal group={payItems[0].group} items={payItems}
          onClose={() => setPayItems(null)} onConfirm={handlePayConfirm} />
      )}
    </div>
  )
}
