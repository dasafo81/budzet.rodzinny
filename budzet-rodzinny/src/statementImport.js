import { CATEGORIES, INCOME_CATS, SAVINGS_CATS } from './constants'

export const MAX_PDF_BYTES = 3 * 1024 * 1024 // base64 + JSON musi zmieścić się w 4,5 MB limicie funkcji

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Model ma zwracać liczbę, ale gdyby podał tekst w polskim zapisie ("1 200,50"), nie gubimy kwoty.
const parseAmount = (v) => {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[\s\u00a0]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = () => reject(new Error('Nie udało się wczytać pliku'))
    r.readAsDataURL(file)
  })
}

// Dotychczasowe wpisy jako wzorce klasyfikacji ("Biedronka" → JEDZENIE / Sklep spożywczy).
export function buildExamples(transactions, limit = 60) {
  const seen = new Set()
  const out = []
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.name || !CATEGORIES[t.category]?.includes(t.subcategory)) continue
    const key = t.name.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ name: t.name.trim(), category: t.category, subcategory: t.subcategory })
    if (out.length >= limit) break
  }
  return out
}

// Sprowadza odpowiedź modelu do pary kategoria/podkategoria, którą aplikacja zna.
export function fixCategory(type, category, subcategory) {
  if (type === 'income') {
    return { category: 'PRZYCHÓD', subcategory: INCOME_CATS.includes(subcategory) ? subcategory : 'Inne przychody' }
  }
  if (type === 'savings') {
    return { category: 'OSZCZĘDZANIE', subcategory: SAVINGS_CATS.includes(subcategory) ? subcategory : 'poduszka' }
  }
  if (CATEGORIES[category]?.includes(subcategory)) return { category, subcategory }
  return { category: 'INNE', subcategory: 'Inne' }
}

export function isDuplicate(row, existing) {
  return existing.some(t =>
    t.date === row.date && t.type === row.type && Math.abs(Number(t.amount) - row.amount) < 0.005)
}

// Surowe wiersze od modelu → wiersze do podglądu (z oznaczeniem duplikatów i przelewów własnych).
export function normalizeRows(raw, existing) {
  return (Array.isArray(raw) ? raw : []).map((r, i) => {
    const type = ['expense', 'income', 'savings'].includes(r.type) ? r.type : 'expense'
    const amount = Math.round(Math.abs(parseAmount(r.amount)) * 100) / 100
    const date = ISO_DATE.test(r.date) ? r.date : ''
    const row = {
      id: i, type, amount, date,
      name: String(r.name || '').trim() || 'Transakcja',
      ...fixCategory(type, r.category, r.subcategory),
      internal: !!r.internal_transfer,
    }
    row.duplicate = !!date && isDuplicate(row, existing)
    row.selected = !!date && amount > 0 && !row.duplicate && !row.internal
    return row
  }).filter(r => r.amount > 0)
}

export function rowToTransaction(row, paymentSource) {
  return {
    name: row.name, amount: row.amount, date: row.date, type: row.type,
    category: row.category, subcategory: row.subcategory, payment_source: paymentSource,
  }
}
