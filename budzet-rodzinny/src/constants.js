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
  DOM:          ['Prąd','Gaz','Woda','Wywóz śmieci','Internet','Ubezpieczenie','Podatek','Czynsz','Remonty','Ogród'],
  DZIECI:       ['Montessori','Angielski Benio','Same Judo','Talent','Wycieczki','Korepetycje','Pozostałe'],
  JEDZENIE:     ['Sklep spożywczy','Restauracja'],
  TRANSPORT:    ['Paliwo','Komunikacja miejska','Taksówka/Uber','Serwis auta'],
  ZDROWIE:      ['Apteka','Lekarz'],
  ROZRYWKA:     ['Kino/Teatr','Subskrypcje','Podróże'],
  GUINNESS:     ['Weterynarz'],
  INNE:         ['Ubrania','Elektronika','Prezenty','Inne'],
}

export const INCOME_CATS = ['Wynagrodzenie','Inwestycje','Inne przychody']
export const SAVINGS_CATS = ['wakacje','inwestycje','poduszka']
export const SAVINGS_NAMES = { wakacje:'Wakacje', inwestycje:'Inwestycje', poduszka:'Poduszka finansowa' }
export const SAVINGS_ICONS = { wakacje:'🏖️', inwestycje:'📈', poduszka:'🛡️' }
export const SAVINGS_TARGETS = { wakacje:5000, inwestycje:20000, poduszka:30000 }

export const SOURCES = ['Porters','Paulina','Damian']
export const SOURCE_ICONS = { Porters:'💳', Paulina:'👩', Damian:'👨' }

export const FX_GROUPS = ['DOM','DZIECI','JEDZENIE','TRANSPORT','ZDROWIE',
  'ROZRYWKA','GUINNESS','OSZCZĘDZANIE','INNE']

export const fmt = (n) =>
  (Math.round(n * 100) / 100).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' zł'

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })

export const today = () => new Date().toISOString().split('T')[0]
