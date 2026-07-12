import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { colors, moeda } from '@/theme'
import { criarPedido, fetchConfig } from '@/lib/repo'
import { precoTamanho, useCart } from '@/lib/cart'
import { loadCliente, savePedidoAtivo, ClienteCache } from '@/lib/storage'
import { Button, Card, Field, SectionTitle } from '@/components/ui'
import type { Config, FormaPagamento, TipoPedido } from '@/types'

const PAGAMENTOS: { key: FormaPagamento; label: string; hint: string; tipos: TipoPedido[] }[] = [
  { key: 'pix', label: '💠 Pix', hint: 'pagar pelo app', tipos: ['entrega'] },
  { key: 'cartao', label: '💳 Cartão', hint: 'pagar na retirada', tipos: ['retirada'] },
  { key: 'dinheiro', label: '💵 Dinheiro', hint: 'pagar na retirada', tipos: ['retirada'] },
]

export default function Checkout() {
  const router = useRouter()
  const { itens, subtotal, clear, removeItem } = useCart()

  const [config, setConfig] = useState<Config | null>(null)
  const [cliente, setCliente] = useState<ClienteCache | null>(null)
  const [tipo, setTipo] = useState<TipoPedido>('retirada')
  const [pagamento, setPagamento] = useState<FormaPagamento>('cartao')
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const copiarEndereco = async () => {
    if (!config?.endereco_retirada) return
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(config.endereco_retirada)
    } else {
      await Clipboard.setStringAsync(config.endereco_retirada)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

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
      await savePedidoAtivo(id)
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
    if (!enviando) {
      setTimeout(() => router.replace('/montar'), 0)
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <SectionTitle>Seu pedido</SectionTitle>
      {itens.map((item, i) => (
        <Card key={i}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }}>
              {item.qtd}x Marmita {item.tamanho === 'P' ? 'Pequena' : item.tamanho === 'M' ? 'Média' : 'Grande'}
            </Text>
            {config ? (
              <Text style={{ fontWeight: '800', color: colors.primary }}>
                {moeda(precoTamanho(config, item.tamanho) * item.qtd)}
              </Text>
            ) : null}
          </View>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 6, lineHeight: 19 }}>
            {item.ingredientes.join(' · ')}
          </Text>
          <Pressable onPress={() => removeItem(i)} hitSlop={8} style={{ marginTop: 8 }}>
            <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>✕ Remover</Text>
          </Pressable>
        </Card>
      ))}
      <Button
        title="＋ Adicionar outra marmita"
        variant="outline"
        onPress={() => router.push('/montar')}
        style={{ marginBottom: 16 }}
      />


      <SectionTitle>Entrega ou retirada?</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {(
          [
            { key: 'retirada', label: 'Retirada', hint: 'sem taxa' },
            { key: 'entrega', label: 'Entrega', hint: config ? `+ ${moeda(Number(config.taxa_entrega))}` : '' },
          ] as { key: TipoPedido; label: string; hint: string }[]
        ).map((op) => {
          const ativo = tipo === op.key
          return (
            <Pressable
              key={op.key}
              onPress={() => {
                setTipo(op.key)
                setPagamento(op.key === 'entrega' ? 'pix' : 'cartao')
              }}
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
      {tipo === 'entrega' ? (
        <Text style={{ color: colors.textSoft, fontSize: 12, marginTop: -6, marginBottom: 14 }}>
          🛵 Entregas somente para Curitiba e região.
        </Text>
      ) : config?.endereco_retirada ? (
        <Pressable
          onPress={copiarEndereco}
          hitSlop={6}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: -6, marginBottom: 14 }}
        >
          <Text numberOfLines={1} style={{ color: colors.textSoft, fontSize: 12, flexShrink: 1 }}>
            📍 {config.endereco_retirada}
          </Text>
          <Text style={{ fontSize: 15, marginLeft: 6, color: copiado ? colors.green : colors.primary, fontWeight: '700' }}>
            {copiado ? '✓' : '⧉'}
          </Text>
          {copiado ? (
            <Text style={{ color: colors.green, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>Copiado!</Text>
          ) : null}
        </Pressable>
      ) : null}

      {cliente ? (
        <>
        <SectionTitle>Seus dados</SectionTitle>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }}>{cliente.nome}</Text>
            <Pressable onPress={() => router.push('/dados?voltar=checkout')} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Trocar</Text>
            </Pressable>
          </View>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4 }}>{cliente.telefone}</Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 2 }}>{cliente.endereco}</Text>
        </Card>
        </>
      ) : null}

      <SectionTitle>Pagamento</SectionTitle>
      <View style={{ gap: 8, marginBottom: 14 }}>
        {PAGAMENTOS.filter((op) => op.tipos.includes(tipo)).map((op) => {
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

      {tipo === 'retirada' ? (
        <Text style={{ color: colors.textSoft, fontSize: 12, marginTop: -6, marginBottom: 14 }}>
          ⚠️ Não aceitamos vale-refeição nem vale-alimentação.
        </Text>
      ) : (
        <Text style={{ color: colors.textSoft, fontSize: 12, marginTop: -6, marginBottom: 14 }}>
          ⚠️ O pedido é cancelado se não pagar dentro de 10 minutos.
        </Text>
      )}

      <Field label="Observações (opcional)" value={obs} onChangeText={setObs} placeholder="Ex: sem cebola, troco para R$ 50..." multiline />

      <SectionTitle>Resumo</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: colors.textSoft }}>Subtotal</Text>
          <Text style={{ color: colors.text, fontWeight: '600' }}>{moeda(sub)}</Text>
        </View>
        {tipo === 'entrega' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: colors.textSoft }}>Taxa de entrega</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{moeda(taxa)}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }}>Total</Text>
          <Text style={{ fontWeight: '900', color: colors.primary, fontSize: 18 }}>{moeda(total)}</Text>
        </View>
      </Card>

      {erro ? <Text style={{ color: colors.red, fontWeight: '600', marginBottom: 10 }}>{erro}</Text> : null}

      <Button
        title="Enviar pedido  →"
        onPress={enviar}
        disabled={!valido}
        loading={enviando}
      />
    </ScrollView>
  )
}
