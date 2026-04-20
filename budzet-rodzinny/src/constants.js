export const MONTHS = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień']

export const CAT_COLORS = {
  DOM:'#7F77DD', DZIECI:'#D4537E', OSZCZĘDZANIE:'#1D9E75', JEDZENIE:'#2D6A4F',
  TRANSPORT:'#378ADD', ROZRYWKA:'#EF9F27', ZDROWIE:'#D85A30', INNE:'#888780',
  PRACA:'#3C3489', PRZYCHÓD:'#4A3FC0', GUINNESS:'#A0522D', 'REMONTY I OGRÓD':'#5C8A3C'
}

export const CAT_ICONS = {
  DOM:'🏠', DZIECI:'👶', OSZCZĘDZANIE:'💰', JEDZENIE:'🛒', TRANSPORT:'🚗',
  ROZRYWKA:'🎬', ZDROWIE:'💊', INNE:'📌', PRACA:'💼', PRZYCHÓD:'💵',
  GUINNESS:'🐕', 'REMONTY I OGRÓD':'🔨'
}

export const CATEGORIES = {
  DOM:          ['Prąd','Gaz','Woda','Wywóz śmieci','Internet','Ubezpieczenie','Podatek','Czynsz','Inne domowe'],
  DZIECI:       ['Szkoła Beniamin','Judo','Talent','Angielski','Wycieczki','Korepetycje','Ubrania dzieci','Inne dzieci'],
  JEDZENIE:     ['Sklep spożywczy','Restauracja','Kawiarnia','Dowóz jedzenia','Inne jedzenie'],
  TRANSPORT:    ['Paliwo','Parking','Komunikacja miejska','Taksówka/Uber','Serwis auta','Inne transport'],
  ZDROWIE:      ['Apteka','Lekarz','Dentysta','Siłownia','Inne zdrowie'],
  ROZRYWKA:     ['Kino/Teatr','Subskrypcje','Podróże','Sport','Inne rozrywka'],
  PRACA:        ['Materiały biurowe','Szkolenie','Inne praca'],
  GUINNESS:     ['Weterynarz','Karma','Akcesoria','Inne Guinness'],
  'REMONTY I OGRÓD': ['Materiały budowlane','Usługi remontowe','Ogród i rośliny','Narzędzia','Inne remonty'],
  INNE:         ['Ubrania','Elektronika','Prezenty','Inne'],
}

export const INCOME_CATS = ['Wynagrodzenie','Premia','Freelance','Wynajem','Inwestycje','Inne przychody']
export const SAVINGS_CATS = ['wakacje','inwestycje','poduszka']
export const SAVINGS_NAMES = { wakacje:'Wakacje', inwestycje:'Inwestycje', poduszka:'Poduszka finansowa' }
export const SAVINGS_ICONS = { wakacje:'🏖️', inwestycje:'📈', poduszka:'🛡️' }
export const SAVINGS_TARGETS = { wakacje:5000, inwestycje:20000, poduszka:30000 }

export const SOURCES = ['Porters','Paulina','Damian']
export const SOURCE_ICONS = { Porters:'💳', Paulina:'👩', Damian:'👨' }

export const FX_GROUPS = ['DOM','DZIECI','JEDZENIE','TRANSPORT','ZDROWIE','ROZRYWKA',
  'PRACA','GUINNESS','REMONTY I OGRÓD','OSZCZĘDZANIE','INNE']

export const FX_DEFAULTS = {
  DOM:          { Prąd:300, Gaz:150, Woda:80, 'Wywóz śmieci':50, Internet:60, Ubezpieczenie:200, Podatek:0 },
  DZIECI:       { 'Szkoła Beniamin':0, Judo:0, Talent:0, Angielski:0, Wycieczki:0, Korepetycje:0 },
  OSZCZĘDZANIE: { Wakacje:0, Inwestycje:0, Poduszka:0 },
}

export const fmt = (n) =>
  (Math.round(n * 100) / 100).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' zł'

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })

export const today = () => new Date().toISOString().split('T')[0]
