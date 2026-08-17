export const colors = {
  primary: '#ea580c',
  primaryDark: '#c2410c',
  primarySoft: '#ffedd5',
  bg: '#fff7ed',
  card: '#ffffff',
  text: '#431407',
  textSoft: '#9a6a53',
  border: '#fed7aa',
  green: '#16a34a',
  greenSoft: '#dcfce7',
  red: '#dc2626',
  redSoft: '#fee2e2',
  blue: '#2563eb',
  blueSoft: '#dbeafe',
}

export const TAMANHOS: { key: 'P' | 'M' | 'G'; label: string; hint: string }[] = [
  { key: 'P', label: 'Pequena', hint: 'mata a fome' },
  { key: 'M', label: 'Média', hint: 'a clássica' },
  { key: 'G', label: 'Grande', hint: 'reforçada' },
]

export const moeda = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`

export const fmtTelefone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
