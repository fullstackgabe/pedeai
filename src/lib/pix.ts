const emv = (id: string, value: string) => id + String(value.length).padStart(2, '0') + value

const crc16 = (payload: string) => {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, "")

export function pixCopiaECola(opts: {
  chave: string
  nome: string
  cidade: string
  valor: number
  txid?: string
}) {
  const nome = semAcento(opts.nome).slice(0, 25)
  const cidade = semAcento(opts.cidade).toUpperCase().slice(0, 15)
  const txid = (opts.txid || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***'
  const payload =
    emv('00', '01') +
    emv('26', emv('00', 'BR.GOV.BCB.PIX') + emv('01', opts.chave)) +
    emv('52', '0000') +
    emv('53', '986') +
    emv('54', opts.valor.toFixed(2)) +
    emv('58', 'BR') +
    emv('59', nome) +
    emv('60', cidade) +
    emv('62', emv('05', txid)) +
    '6304'
  return payload + crc16(payload)
}
