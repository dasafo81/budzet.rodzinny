import { useState, useRef } from 'react'
import { CATEGORIES, CAT_ICONS, fmt } from '../constants'
import { MONTHS } from '../constants'

const QUICK_QS = [
  'Podsumuj wydatki tego miesiąca i wskaż gdzie wydajemy najwięcej',
  'Gdzie mogę zaoszczędzić? Porównaj z poprzednim miesiącem',
  'Zaplanuj budżet na przyszły miesiąc na podstawie historii',
  'Oceń nasze nawyki finansowe i daj 3 konkretne wskazówki',
  'Ile wydajemy na dzieci i czy to rozsądna kwota?',
]

export default function AIPanel({ monthTransactions, viewDate, addTransaction, user, showToast }) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('Dodaj transakcje i zapytaj AI o analizę budżetu.')
  const [loading, setLoading] = useState(false)
  const [imgBase64, setImgBase64] = useState(null)
  const [imgSrc, setImgSrc] = useState(null)
  const fileRef = useRef()

  const buildCtx = () => {
    const inc  = monthTransactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)
    const exp  = monthTransactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)
    const bycat = {}
    monthTransactions.filter(t=>t.type==='expense').forEach(t=>{bycat[t.category]=(bycat[t.category]||0)+t.amount})
    return `Miesiąc: ${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}
Przychody: ${inc.toFixed(2)} zł | Wydatki: ${exp.toFixed(2)} zł | Bilans: ${(inc-exp).toFixed(2)} zł
Kategorie: ${Object.entries(bycat).map(([k,v])=>k+': '+v.toFixed(0)+' zł').join(', ')||'brak'}
Ostatnie: ${monthTransactions.slice(0,8).map(t=>t.name+' '+t.amount+' zł').join(', ')||'brak'}`
  }

  const callAI = async (messages, system) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'anthropic-dangerous-direct-browser-access':'true' },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system, messages })
    })
    const data = await r.json()
    if (data.error) throw new Error(data.error.message)
    return data.content?.find(b=>b.type==='text')?.text || ''
  }

  const askAI = async (q) => {
    const query = q || question
    if (!query.trim()) return
    setLoading(true); setResponse('Analizuję...')
    try {
      const txt = await callAI(
        [{ role:'user', content: `Dane:\n${buildCtx()}\n\nPytanie: ${query}` }],
        'Jesteś doradcą finansowym dla polskiej rodziny. Odpowiadasz zwięźle, konkretnie, po polsku. Bez markdown. Masz dwójkę dzieci (Beniamin i drugie).'
      )
      setResponse(txt)
    } catch(e) {
      setResponse('Błąd API: ' + e.message)
    }
    setLoading(false)
  }

  const processFile = (file) => {
    const r = new FileReader()
    r.onload = e => { setImgBase64(e.target.result.split(',')[1]); setImgSrc(e.target.result) }
    r.readAsDataURL(file)
  }

  const analyzeImage = async () => {
    if (!imgBase64) return
    setLoading(true); setResponse('Analizuję screenshot...')
    const catList = Object.entries(CATEGORIES).map(([g,s])=>`${g}: ${s.join(', ')}`).join('\n')
    const [y,m] = [viewDate.getFullYear(), String(viewDate.getMonth()+1).padStart(2,'0')]
    try {
      const txt = await callAI([{ role:'user', content:[
        { type:'image', source:{ type:'base64', media_type:'image/jpeg', data:imgBase64 }},
        { type:'text', text:'Wyciągnij transakcje i przypisz do kategorii. Odpowiedz TYLKO tablicą JSON, bez markdown.' }
      ]}], `Jesteś asystentem finansowym. Kategorie:\n${catList}\nFormat: [{"name":"...","amount":0.00,"category":"...","subcategory":"...","date":"YYYY-MM-DD"}]`)
      const parsed = JSON.parse(txt.replace(/```json|```/g,'').trim())
      if (!parsed.length) { setResponse('Nie znalazłem transakcji na screenshocie.'); setLoading(false); return }
      for (const t of parsed) {
        await addTransaction({ name:t.name, amount:t.amount, date:t.date||`${y}-${m}-01`, type:'expense', category:t.category, subcategory:t.subcategory, payment_source:'Porters' })
      }
      setResponse(`Dodano ${parsed.length} transakcji:\n` + parsed.map(t=>`• ${t.name}: ${fmt(t.amount)} → ${t.category}`).join('\n'))
    } catch(e) {
      setResponse('Błąd: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="g2">
      <div className="card">
        <div className="card-title">Wgraj screenshot transakcji</div>
        <div className="ai-zone" onClick={() => fileRef.current.click()}
          onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)processFile(f)}}>
          <div style={{ fontSize:28 }}>📷</div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>Kliknij lub przeciągnij screenshot z banku</div>
        </div>
        <input type="file" ref={fileRef} accept="image/*,.pdf" style={{ display:'none' }}
          onChange={e => { if(e.target.files[0]) processFile(e.target.files[0]) }} />
        {imgSrc && <img src={imgSrc} style={{ maxWidth:'100%', maxHeight:200, borderRadius:'var(--rs)', marginBottom:8 }} />}
        {imgBase64 && <button className="btn-primary" onClick={analyzeImage} disabled={loading}>Analizuj i dodaj transakcje ↗</button>}
      </div>

      <div className="card">
        <div className="card-title">Zapytaj AI o finanse</div>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <input type="text" value={question} onChange={e=>setQuestion(e.target.value)}
            placeholder="Zadaj pytanie o budżet..." onKeyDown={e=>e.key==='Enter'&&askAI()} />
          <button className="btn-ghost" onClick={()=>askAI()} disabled={loading}>Zapytaj ↗</button>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {QUICK_QS.map((q,i) => (
            <button key={i} className="qq" onClick={()=>askAI(q)}>
              {['Podsumowanie','Gdzie oszczędzać?','Plan na przyszły miesiąc','Analiza nawyków','Wydatki na dzieci'][i]}
            </button>
          ))}
        </div>
        <div className={`ai-resp ${loading ? 'loading' : ''}`}>{response}</div>
      </div>
    </div>
  )
}
