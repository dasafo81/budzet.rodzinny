import { useState, useRef } from 'react'
import { sb } from '../supabase'
import {
  CATEGORIES, INCOME_CATS, SAVINGS_CATS, SAVINGS_NAMES, SOURCES, SOURCE_ICONS, CAT_ICONS, fmt,
} from '../constants'
import {
  MAX_PDF_BYTES, fileToBase64, buildExamples, normalizeRows, fixCategory, rowToTransaction,
} from '../statementImport'

const TYPE_LABELS = { expense: 'Wydatek', income: 'Przychód', savings: 'Oszczędności' }

export default function StatementImport({ transactions, onImport, onClose }) {
  const [stage, setStage] = useState('pick') // pick | loading | review | saving
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState([])
  const [source, setSource] = useState('Porters')
  const fileRef = useRef()

  const analyze = async (file) => {
    setError('')
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Wybierz plik PDF z wyciągiem.'); return
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`Plik ma ${(file.size / 1048576).toFixed(1)} MB — limit to 3 MB. Wgraj krótszy okres lub mniejszy PDF.`); return
    }
    setFileName(file.name)
    setStage('loading')
    try {
      const { data: { session } } = await sb.auth.getSession()
      if (!session) throw new Error('Sesja wygasła — zaloguj się ponownie')
      const r = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          pdf: await fileToBase64(file),
          categories: CATEGORIES,
          incomeCats: INCOME_CATS,
          savingsCats: SAVINGS_CATS,
          examples: buildExamples(transactions),
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || `Błąd serwera (${r.status})`)
      const list = normalizeRows(data.transactions, transactions)
      if (!list.length) throw new Error('Nie znalazłem transakcji w tym PDF.')
      setRows(list)
      setStage('review')
    } catch (e) {
      setError(e.message)
      setStage('pick')
    }
  }

  const patch = (id, changes) => setRows(rs => rs.map(r => r.id === id ? { ...r, ...changes } : r))

  const changeType = (row, type) => patch(row.id, { type, ...fixCategory(type, row.category, row.subcategory) })
  const changeCategory = (row, category) =>
    patch(row.id, { category, subcategory: CATEGORIES[category][0] })

  const selected = rows.filter(r => r.selected)
  const bad = selected.find(r => !r.date || !(r.amount > 0))
  const expenseSum = selected.filter(r => r.type !== 'income').reduce((s, r) => s + r.amount, 0)
  const incomeSum = selected.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)

  const save = async () => {
    if (bad) { setError(`Uzupełnij datę i kwotę: ${bad.name}`); return }
    setError('')
    setStage('saving')
    const ok = await onImport(selected.map(r => rowToTransaction(r, source)))
    if (ok) onClose()
    else setStage('review')
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && stage !== 'saving') onClose() }}>
      <div className="modal modal-import" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Import wyciągu PDF</h3>
          <button className="modal-close" onClick={onClose} disabled={stage === 'saving'}>×</button>
        </div>

        {(stage === 'pick' || stage === 'loading') && (
          <>
            <div className="ai-zone"
              onClick={() => stage === 'pick' && fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (stage === 'pick') analyze(e.dataTransfer.files[0]) }}>
              <div style={{ fontSize: 28 }}>{stage === 'loading' ? '⏳' : '📄'}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                {stage === 'loading'
                  ? `Analizuję ${fileName}… to może potrwać do minuty`
                  : 'Kliknij lub przeciągnij PDF z wyciągiem z konta (do 3 MB)'}
              </div>
            </div>
            <input type="file" ref={fileRef} accept="application/pdf,.pdf" style={{ display: 'none' }}
              onChange={e => { analyze(e.target.files[0]); e.target.value = '' }} />
            <div className="imp-hint">
              Transakcje zostaną odczytane i przypisane do kategorii. Zanim cokolwiek zapiszę, zobaczysz listę do sprawdzenia.
            </div>
          </>
        )}

        {(stage === 'review' || stage === 'saving') && (
          <>
            <div className="imp-top">
              <div className="ff">
                <label>Źródło finansowania (dla wszystkich)</label>
                <div className="ttoggle t3">
                  {SOURCES.map(s => (
                    <button key={s} className={`tbtn ${source === s ? 'active' : ''}`} onClick={() => setSource(s)}>
                      {SOURCE_ICONS[s]} {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="imp-sum">
                <span>Zaznaczono <strong>{selected.length}</strong> z {rows.length}</span>
                <span className="mono">−{fmt(expenseSum)}{incomeSum > 0 ? ` · +${fmt(incomeSum)}` : ''}</span>
              </div>
              <div className="imp-bulk">
                <button className="seg" onClick={() => setRows(rs => rs.map(r => ({ ...r, selected: !!r.date && r.amount > 0 })))}>Zaznacz wszystkie</button>
                <button className="seg" onClick={() => setRows(rs => rs.map(r => ({ ...r, selected: false })))}>Odznacz wszystkie</button>
              </div>
            </div>

            <div className="imp-list">
              {rows.map(r => (
                <div key={r.id} className={`imp-row ${r.selected ? '' : 'off'}`}>
                  <input type="checkbox" checked={r.selected} onChange={e => patch(r.id, { selected: e.target.checked })} />
                  <input type="date" className="imp-date" value={r.date} onChange={e => patch(r.id, { date: e.target.value })} />
                  <input type="text" className="imp-name" value={r.name} onChange={e => patch(r.id, { name: e.target.value })} />
                  <input type="number" className="imp-amt" step="0.01" min="0" value={r.amount}
                    onChange={e => patch(r.id, { amount: parseFloat(e.target.value) || 0 })} />
                  <select value={r.type} onChange={e => changeType(r, e.target.value)}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {r.type === 'expense' && (
                    <>
                      <select value={r.category} onChange={e => changeCategory(r, e.target.value)}>
                        {[...Object.keys(CATEGORIES)].map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                      </select>
                      <select value={r.subcategory} onChange={e => patch(r.id, { subcategory: e.target.value })}>
                        {CATEGORIES[r.category].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </>
                  )}
                  {r.type === 'income' && (
                    <select value={r.subcategory} onChange={e => patch(r.id, { subcategory: e.target.value })}>
                      {INCOME_CATS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {r.type === 'savings' && (
                    <select value={r.subcategory} onChange={e => patch(r.id, { subcategory: e.target.value })}>
                      {SAVINGS_CATS.map(s => <option key={s} value={s}>{SAVINGS_NAMES[s] || s}</option>)}
                    </select>
                  )}
                  {(r.duplicate || r.internal || !r.date) && (
                    <span className="imp-flags">
                      {r.duplicate && <span className="imp-flag warn">możliwy duplikat</span>}
                      {r.internal && <span className="imp-flag">przelew własny</span>}
                      {!r.date && <span className="imp-flag warn">brak daty</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="form-err" style={{ marginTop: 10 }}>{error}</div>}

            <div className="modal-footer">
              <button className="btn-outline" onClick={() => { setStage('pick'); setRows([]); setError('') }} disabled={stage === 'saving'}>
                Inny plik
              </button>
              <button className="btn-primary" onClick={save} disabled={!selected.length || stage === 'saving'}>
                {stage === 'saving' ? 'Zapisuję…' : `Dodaj zaznaczone (${selected.length})`}
              </button>
            </div>
          </>
        )}

        {error && (stage === 'pick' || stage === 'loading') && <div className="form-err" style={{ marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  )
}
