import { useState } from 'react'
import { CATEGORIES, CAT_ICONS, SOURCES, SOURCE_ICONS, today, fmt } from '../constants'

const INCOME_CATS = ['Wynagrodzenie','Premia','Freelance','Wynajem','Inwestycje','Inne przychody']
const INCOME_ICONS = { Wynagrodzenie:'💼', Premia:'🏆', Freelance:'💻', Wynajem:'🏠', Inwestycje:'📈', 'Inne przychody':'📌' }
const SAVINGS_CATS = [{ value:'wakacje', label:'🏖️ Wakacje' }, { value:'inwestycje', label:'📈 Inwestycje' }, { value:'poduszka', label:'🛡️ Poduszka finansowa' }]

export default function AddTransactionForm({ onAdd }) {
  const [type, setType] = useState('expense')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [source, setSource] = useState('Porters')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [incomeCat, setIncomeCat] = useState('Wynagrodzenie')
  const [savingsCat, setSavingsCat] = useState('wakacje')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { alert('Podaj kwotę'); return }
    if (!date) { alert('Podaj datę'); return }

    let cat, subcat
    if (type === 'income') {
      cat = 'PRZYCHÓD'; subcat = incomeCat
    } else if (type === 'savings') {
      cat = 'OSZCZĘDZANIE'; subcat = savingsCat
    } else {
      if (!category) { alert('Wybierz kategorię'); return }
      cat = category; subcat = subcategory
    }

    setSaving(true)
    const ok = await onAdd({
      name: name.trim() || subcat || cat,
      amount: Math.round(amt * 100) / 100,
      date,
      type,
      category: cat,
      subcategory: subcat,
      payment_source: source,
    })
    setSaving(false)
    if (ok) {
      setName(''); setAmount(''); setCategory(''); setSubcategory('')
    }
  }

  return (
    <div className="form-stack">
      {/* Type */}
      <div className="ttoggle t3">
        {['expense','income','savings'].map(t => (
          <button key={t} className={`tbtn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
            {t === 'expense' ? 'Wydatek' : t === 'income' ? 'Przychód' : 'Oszczędności'}
          </button>
        ))}
      </div>

      {/* Name */}
      <div className="ff">
        <label>Opis <span style={{ color:'var(--text3)', fontWeight:400 }}>(opcjonalny)</span></label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="np. Biedronka, Judo Beniamin..." />
      </div>

      {/* Amount + Date */}
      <div className="form-row">
        <div className="ff">
          <label>Kwota (zł)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
        </div>
        <div className="ff">
          <label>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* Source */}
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

      {/* Category pickers */}
      {type === 'expense' && (
        <div className="ff">
          <label>Kategoria</label>
          <div className="cat-picker">
            {Object.entries(CATEGORIES).map(([group, subs]) => (
              <div key={group}>
                <div className="cg-label">{CAT_ICONS[group] || '📌'} {group}</div>
                <div className="chips">
                  {subs.map(sub => (
                    <button key={sub}
                      className={`chip ${category === group && subcategory === sub ? 'sel' : ''}`}
                      onClick={() => { setCategory(group); setSubcategory(sub) }}>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'income' && (
        <div className="ff">
          <label>Źródło przychodu</label>
          <select value={incomeCat} onChange={e => setIncomeCat(e.target.value)}>
            {INCOME_CATS.map(c => <option key={c} value={c}>{INCOME_ICONS[c]} {c}</option>)}
          </select>
        </div>
      )}

      {type === 'savings' && (
        <div className="ff">
          <label>Na cel</label>
          <select value={savingsCat} onChange={e => setSavingsCat(e.target.value)}>
            {SAVINGS_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Zapisuję...' : '+ Dodaj'}
      </button>
    </div>
  )
}
