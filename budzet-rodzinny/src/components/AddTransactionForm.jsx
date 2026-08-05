import { useState } from 'react'
import {
  CATEGORIES, CAT_ICONS, CAT_COLORS, SOURCES, SOURCE_ICONS,
  INCOME_CATS, SAVINGS_CATS, SAVINGS_NAMES, SAVINGS_ICONS, today, fmt,
} from '../constants'

const INCOME_ICONS = {
  Wynagrodzenie:'💼', Premia:'🏆', Freelance:'💻',
  Wynajem:'🏠', Inwestycje:'📈', 'Inne przychody':'📌',
}

const TYPE_LABELS = { expense:'Wydatek', income:'Przychód', savings:'Oszczędności' }

function dateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// The six category/subcategory pairs used most often lately — most entries repeat.
function recentPairs(transactions, limit = 6) {
  const counts = new Map()
  transactions
    // only pairs that still exist in the current category list — an old/renamed
    // category from a past transaction shouldn't produce a shortcut that crashes
    .filter(t => t.type === 'expense' && t.category && t.subcategory && CATEGORIES[t.category]?.includes(t.subcategory))
    .slice(0, 120)
    .forEach(t => {
      const key = `${t.category}|${t.subcategory}`
      counts.set(key, (counts.get(key) || 0) + 1)
    })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => {
      const [category, subcategory] = key.split('|')
      return { category, subcategory }
    })
}

// A tile grid — used for picking a main category, an income source, or a savings goal.
function TileGrid({ items, selected, onSelect }) {
  return (
    <div className="cat-grid">
      {items.map(it => (
        <button key={it.value}
          className={`cat-tile ${selected === it.value ? 'sel' : ''}`}
          style={selected === it.value && it.color ? { borderColor: it.color, background: it.color + '18' } : undefined}
          onClick={() => onSelect(it.value)}>
          <span className="cat-tile-ico">{it.icon}</span>
          <span className="cat-tile-lbl">{it.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function AddTransactionForm({ onAdd, onDone, transactions = [] }) {
  const [type, setType] = useState('expense')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [source, setSource] = useState('Porters')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [incomeCat, setIncomeCat] = useState('')
  const [savingsCat, setSavingsCat] = useState('')
  const [error, setError] = useState('')
  const [dupWarning, setDupWarning] = useState(null)
  const [saving, setSaving] = useState(false)

  const amt = parseFloat(amount) || 0
  const recent = recentPairs(transactions)

  const switchType = (t) => {
    setType(t); setError(''); setDupWarning(null)
    setCategory(''); setSubcategory(''); setIncomeCat(''); setSavingsCat('')
  }

  const pickRecent = (r) => {
    setType('expense')
    setCategory(r.category)
    setSubcategory(r.subcategory)
    setError(''); setDupWarning(null)
  }

  const handleSubmit = async (opts = {}) => {
    setError('')
    if (!amt || amt <= 0) { setError('Podaj kwotę większą od zera.'); return }
    if (!date) { setError('Wybierz datę.'); return }

    let cat, subcat
    if (type === 'income') {
      if (!incomeCat) { setError('Wybierz źródło przychodu.'); return }
      cat = 'PRZYCHÓD'; subcat = incomeCat
    } else if (type === 'savings') {
      if (!savingsCat) { setError('Wybierz cel oszczędzania.'); return }
      cat = 'OSZCZĘDZANIE'; subcat = savingsCat
    } else {
      if (!category) { setError('Wybierz kategorię.'); return }
      if (!subcategory) { setError('Wybierz podkategorię — dzięki temu wydatek trafi do właściwej pozycji budżetu.'); return }
      cat = category; subcat = subcategory
    }

    // Two people share this budget, so the same purchase can easily get entered twice.
    if (!opts.force) {
      const dup = transactions.find(t =>
        t.date === date &&
        t.category === cat &&
        (t.subcategory || '') === (subcat || '') &&
        Math.abs(t.amount - amt) < 0.005
      )
      if (dup) {
        setDupWarning({ name: dup.name, who: dup.user_name })
        return
      }
    }

    setSaving(true)
    const ok = await onAdd({
      name: name.trim() || subcat || cat,
      amount: Math.round(amt * 100) / 100,
      date, type, category: cat, subcategory: subcat,
      payment_source: source,
    })
    setSaving(false)
    if (ok) {
      setName(''); setAmount(''); setCategory(''); setSubcategory('')
      setIncomeCat(''); setSavingsCat(''); setDupWarning(null)
      if (onDone) onDone()
    }
  }

  const submitLabel = saving
    ? 'Zapisuję…'
    : amt > 0
      ? `Dodaj ${TYPE_LABELS[type].toLowerCase()} ${fmt(amt)}`
      : `Dodaj ${TYPE_LABELS[type].toLowerCase()}`

  return (
    <div className="form-stack">
      {/* 0 — one-tap shortcuts for what gets entered most */}
      {recent.length > 0 && (
        <div className="ff">
          <label>Ostatnio używane</label>
          <div className="chips">
            {recent.map(r => (
              <button key={`${r.category}|${r.subcategory}`}
                className={`chip ${type === 'expense' && category === r.category && subcategory === r.subcategory ? 'sel' : ''}`}
                onClick={() => pickRecent(r)}>
                {CAT_ICONS[r.category] || '📌'} {r.subcategory}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 1 — what kind of entry */}
      <div className="ttoggle t3">
        {['expense','income','savings'].map(t => (
          <button key={t} className={`tbtn ${type === t ? 'active' : ''}`} onClick={() => switchType(t)}>
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 2 — amount, the hero field */}
      <div className="ff">
        <label>Kwota</label>
        <div className="amt-field">
          <input type="number" inputMode="decimal" value={amount} autoFocus
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00" min="0" step="0.01" />
          <span className="amt-suffix">zł</span>
        </div>
      </div>

      {/* 3 — category, two-step so the screen is never a wall of chips */}
      {type === 'expense' && (
        <div className="ff">
          <label>Kategoria</label>
          {!category ? (
            <TileGrid
              items={Object.keys(CATEGORIES).map(g => ({
                value:g, label:g, icon:CAT_ICONS[g] || '📌', color:CAT_COLORS[g],
              }))}
              selected={category}
              onSelect={g => { setCategory(g); setSubcategory(''); setError('') }} />
          ) : (
            <>
              <div className="picked-bar" style={{ borderColor:(CAT_COLORS[category] || 'var(--accent)') + '55' }}>
                <span className="picked-ico">{CAT_ICONS[category] || '📌'}</span>
                <span className="picked-name">{category}</span>
                <button className="picked-change" onClick={() => { setCategory(''); setSubcategory('') }}>Zmień</button>
              </div>
              <div className="chips sub-chips">
                {(CATEGORIES[category] || []).map(sub => (
                  <button key={sub}
                    className={`chip ${subcategory === sub ? 'sel' : ''}`}
                    onClick={() => { setSubcategory(sub); setError('') }}>
                    {sub}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {type === 'income' && (
        <div className="ff">
          <label>Źródło przychodu</label>
          <TileGrid
            items={INCOME_CATS.map(c => ({ value:c, label:c, icon:INCOME_ICONS[c] || '📌' }))}
            selected={incomeCat}
            onSelect={c => { setIncomeCat(c); setError('') }} />
        </div>
      )}

      {type === 'savings' && (
        <div className="ff">
          <label>Cel oszczędzania</label>
          <TileGrid
            items={SAVINGS_CATS.map(k => ({ value:k, label:SAVINGS_NAMES[k] || k, icon:SAVINGS_ICONS[k] || '💰' }))}
            selected={savingsCat}
            onSelect={k => { setSavingsCat(k); setError('') }} />
        </div>
      )}

      {/* 4 — who paid */}
      <div className="ff">
        <label>Źródło finansowania</label>
        <div className="ttoggle t3">
          {SOURCES.map(s => (
            <button key={s} className={`tbtn ${source === s ? 'active' : ''}`} onClick={() => setSource(s)}>
              {SOURCE_ICONS[s]} {s}
            </button>
          ))}
        </div>
      </div>

      {/* 5 — when */}
      <div className="ff">
        <label>Data</label>
        <div className="date-row">
          <button className={`date-quick ${date === today() ? 'sel' : ''}`} onClick={() => setDate(today())}>Dziś</button>
          <button className={`date-quick ${date === dateNDaysAgo(1) ? 'sel' : ''}`} onClick={() => setDate(dateNDaysAgo(1))}>Wczoraj</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* 6 — optional note */}
      <div className="ff">
        <label>Opis <span style={{ color:'var(--text3)', fontWeight:400 }}>(opcjonalny)</span></label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="np. Biedronka, Judo Beniamin…"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
      </div>

      {error && <div className="form-err">{error}</div>}

      {dupWarning ? (
        <div className="dup-warn">
          <div className="dup-warn-txt">
            Tego dnia zapisano już <strong>{fmt(amt)}</strong> w tej podkategorii
            {dupWarning.name ? ` („${dupWarning.name}”` : ''}{dupWarning.who ? `, dodane przez: ${dupWarning.who})` : dupWarning.name ? ')' : ''}.
            Dodać mimo to?
          </div>
          <div className="dup-warn-btns">
            <button className="btn-outline" onClick={() => setDupWarning(null)}>Anuluj</button>
            <button className="btn-primary" onClick={() => handleSubmit({ force: true })} disabled={saving}>
              {saving ? 'Zapisuję…' : 'Tak, dodaj'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={() => handleSubmit()} disabled={saving}>{submitLabel}</button>
      )}
    </div>
  )
}

export function AddTransactionModal({ onAdd, onClose, transactions = [] }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Dodaj transakcję</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <AddTransactionForm onAdd={onAdd} onDone={onClose} transactions={transactions} />
      </div>
    </div>
  )
}
