import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, fmtTelefone, moeda } from '@/theme'
import { criarPedido, fetchConfig } from '@/lib/repo'
import { precoTamanho, useCart } from '@/lib/cart'
import { loadCliente, saveCliente } from '@/lib/storage'
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
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [tipo, setTipo] = useState<TipoPedido>('entrega')
  const [pagamento, setPagamento] = useState<FormaPagamento>('pix')
  const [obs, setObs] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => setErro('Não foi possível carregar os preços.'))
    loadCliente().then((c) => {
      if (c) {
        setNome(c.nome)
        setTelefone(c.telefone)
        setEndereco(c.endereco)
      }
    })
  }, [])

  const taxa = tipo === 'entrega' && config ? Number(config.taxa_entrega) : 0
  const sub = config ? subtotal(config) : 0
  const total = sub + taxa

  const valido = useMemo(() => {
    if (itens.length === 0) return false
    if (nome.trim().length < 2) return false
    if (telefone.replace(/\D/g, '').length < 10) return false
    if (tipo === 'entrega' && endereco.trim().length < 8) return false
    return true
  }, [itens, nome, telefone, tipo, endereco])

  const enviar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setErro(null)
    try {
      await saveCliente({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() })
      const id = await criarPedido({
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: tipo === 'entrega' ? endereco.trim() : null,
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
        <Button title="Montar uma marmita" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <SectionTitle>Seus dados</SectionTitle>
      <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" />
      <Field
        label="Telefone (WhatsApp)"
        value={telefone}
        onChangeText={(t) => setTelefone(fmtTelefone(t))}
        placeholder="(41) 99999-9999"
        keyboardType="phone-pad"
      />

      <SectionTitle>Entrega ou retirada?</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {(
          [
            { key: 'entrega', label: '🛵 Entrega', hint: config ? `+ ${moeda(Number(config.taxa_entrega))}` : '' },
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
              <Text style={{ color: colors.textSoft, fontSize: 12, marginTop: 2 }}>{op.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      {tipo === 'entrega' ? (
        <>
          <Field
            label="Endereço de entrega"
            value={endereco}
            onChangeText={setEndereco}
            placeholder="Rua, número, bairro e complemento"
            multiline
          />
          <Text style={{ color: colors.textSoft, fontSize: 12, marginTop: -8, marginBottom: 14 }}>
            Entregamos em Curitiba e região · taxa fixa {config ? moeda(Number(config.taxa_entrega)) : 'R$ 10,00'}
          </Text>
        </>
      ) : null}

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

      {erro ? (
        <Text style={{ color: colors.red, fontWeight: '600', marginBottom: 10 }}>{erro}</Text>
      ) : null}

      <Button
        title={pagamento === 'pix' ? 'Enviar pedido e pagar com Pix' : 'Enviar pedido'}
        onPress={enviar}
        disabled={!valido}
        loading={enviando}
      />
      <Text style={{ color: colors.textSoft, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
        Seus dados ficam salvos neste aparelho para o próximo pedido.
      </Text>
    </ScrollView>
  )
}
