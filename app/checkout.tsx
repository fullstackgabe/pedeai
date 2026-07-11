import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { colors, moeda } from '@/theme'
import { criarPedido, fetchConfig } from '@/lib/repo'
import { useCart } from '@/lib/cart'
import { loadCliente, ClienteCache } from '@/lib/storage'
import { Button, Card, Field, SectionTitle } from '@/components/ui'
import type { Config, FormaPagamento, TipoPedido } from '@/types'

const PAGAMENTOS: { key: FormaPagamento; label: string; hint: string }[] = [
  { key: 'pix', label: '💠 Pix', hint: 'pague agora pelo app' },
  { key: 'dinheiro', label: '💵 Dinheiro', hint: 'na entrega ou retirada' },
  { key: 'cartao', label: '💳 Cartão', hint: 'maquininha na entrega' },
]

export default function Checkout() {
  const router = useRouter()
  const { itens, subtotal, clear } = useCart()

  const [config, setConfig] = useState<Config | null>(null)
  const [cliente, setCliente] = useState<ClienteCache | null>(null)
  const [tipo, setTipo] = useState<TipoPedido>('entrega')
  const [pagamento, setPagamento] = useState<FormaPagamento>('pix')
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      fetchConfig().then(setConfig).catch(() => setErro('Não foi possível carregar os preços.'))
      loadCliente().then((c) => {
        if (!c) {
          router.replace('/dados?voltar=checkout')
        } else {
          setCliente(c)
        }
      })
    }, []),
  )

  const taxa = tipo === 'entrega' && config ? Number(config.taxa_entrega) : 0
  const sub = config ? subtotal(config) : 0
  const total = sub + taxa

  const valido = useMemo(() => itens.length > 0 && !!cliente, [itens, cliente])

  const enviar = async () => {
    if (!valido || !cliente || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const id = await criarPedido({
        nome: cliente.nome,
        telefone: cliente.telefone,
        endereco: tipo === 'entrega' ? cliente.endereco : null,
        tipo,
        itens,
        formaPagamento: pagamento,
        observacoes: obs.trim() || undefined,
      })
      clear()
      router.replace(`/pedido/${id}`)
    } catch (e: any) {
      const msg = String(e?.message || '')
      setErro(
        msg.includes('fechado')
          ? 'O restaurante está fechado no momento.'
          : 'Não foi possível enviar o pedido. Tente novamente.',
      )
      setEnviando(false)
    }
  }

  if (itens.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ fontSize: 40 }}>🛍️</Text>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 8 }}>
          Sua sacola está vazia
        </Text>
        <Button title="Montar uma marmita" onPress={() => router.replace('/montar')} style={{ marginTop: 16 }} />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      {cliente ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }}>📍 {cliente.nome}</Text>
            <Pressable onPress={() => router.push('/dados?voltar=checkout')} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Trocar</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4 }}>{cliente.telefone}</Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 2 }}>{cliente.endereco}</Text>
        </Card>
      ) : null}

      <SectionTitle>Entrega ou retirada?</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {(
          [
            { key: 'entrega', label: '🛵 Entrega', hint: config ? `+ ${moeda(Number(config.taxa_entrega))} · Curitiba e região` : '' },
            { key: 'retirada', label: '🏪 Retirada', hint: 'sem taxa' },
          ] as { key: TipoPedido; label: string; hint: string }[]
        ).map((op) => {
          const ativo = tipo === op.key
          return (
            <Pressable
              key={op.key}
              onPress={() => setTipo(op.key)}
              style={{
                flex: 1,
                backgroundColor: ativo ? colors.primarySoft : colors.card,
                borderWidth: 1.5,
                borderColor: ativo ? colors.primary : colors.border,
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '800', color: ativo ? colors.primaryDark : colors.text }}>{op.label}</Text>
              <Text style={{ color: colors.textSoft, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{op.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      <SectionTitle>Pagamento</SectionTitle>
      <View style={{ gap: 8, marginBottom: 14 }}>
        {PAGAMENTOS.map((op) => {
          const ativo = pagamento === op.key
          return (
            <Pressable
              key={op.key}
              onPress={() => setPagamento(op.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: ativo ? colors.primarySoft : colors.card,
                borderWidth: 1.5,
                borderColor: ativo ? colors.primary : colors.border,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
              }}
            >
              <Text style={{ fontWeight: '700', color: ativo ? colors.primaryDark : colors.text }}>{op.label}</Text>
              <Text style={{ color: colors.textSoft, fontSize: 12 }}>{op.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      <Field label="Observações (opcional)" value={obs} onChangeText={setObs} placeholder="Ex: sem cebola, troco para R$ 50..." multiline />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: colors.textSoft }}>Subtotal</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{moeda(sub)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: colors.textSoft }}>Taxa de entrega</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{tipo === 'entrega' ? moeda(taxa) : 'grátis'}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>Total</Text>
          <Text style={{ fontWeight: '900', color: colors.primary, fontSize: 18 }}>{moeda(total)}</Text>
        </View>
      </Card>

      {erro ? <Text style={{ color: colors.red, fontWeight: '600', marginBottom: 10 }}>{erro}</Text> : null}

      <Button
        title={pagamento === 'pix' ? 'Enviar pedido e pagar com Pix' : 'Enviar pedido'}
        onPress={enviar}
        disabled={!valido}
        loading={enviando}
      />
    </ScrollView>
  )
}
