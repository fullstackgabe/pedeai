import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, moeda } from '@/theme'
import { useAuth } from '@/lib/auth'
import {
  addIngrediente,
  assinarPedidos,
  atualizarStatus,
  fetchIngredientesAdmin,
  fetchConfig,
  fetchPedidos,
  limparPedidos,
  marcarPago,
  removeIngrediente,
  salvarConfig,
  setIngredienteDisponivel,
} from '@/lib/repo'
import { Badge, Button, Card, SectionTitle, ShareIcon, Toggle, TrashIcon, WhatsAppIcon } from '@/components/ui'
import { Logo } from '@/components/Logo'
import type { CategoriaIngrediente, Config, Ingrediente, Pedido, StatusPedido } from '@/types'

type Aba = 'pedidos' | 'cardapio' | 'ajustes'

const STATUS_LABEL: Record<StatusPedido, string> = {
  novo: 'Novo',
  confirmado: '👍 Confirmado',
  em_preparo: '👨‍🍳 Em preparo',
  saiu_entrega: '🛵 Saiu p/ entrega',
  pronto_retirada: '📦 Pronto p/ retirada',
  concluido: '✅ Concluído',
  cancelado: '❌ Cancelado',
}

export default function Admin() {
  const router = useRouter()
  const { session, ready, signOut } = useAuth()
  const [aba, setAba] = useState<Aba>('pedidos')

  useEffect(() => {
    if (ready && !session) router.replace('/login')
  }, [ready, session])

  if (!ready || !session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingVertical: 14,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Logo iconSize={22} textSize={18} />
        <Pressable
          onPress={async () => {
            await signOut()
            router.replace('/')
          }}
          hitSlop={10}
        >
          <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13 }}>Sair</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {(
          [
            { key: 'pedidos', label: 'Pedidos' },
            { key: 'cardapio', label: 'Cardápio' },
            { key: 'ajustes', label: 'Configurações' },
          ] as { key: Aba; label: string }[]
        ).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setAba(t.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: 2.5,
              borderBottomColor: aba === t.key ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontWeight: aba === t.key ? '800' : '500', color: aba === t.key ? colors.primary : colors.textSoft, fontSize: 13 }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {aba === 'pedidos' ? <AbaPedidos /> : aba === 'cardapio' ? <AbaCardapio /> : <AbaAjustes />}
    </View>
  )
}

function AbaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'ativos' | 'finalizados'>('ativos')

  const load = useCallback(async () => {
    try {
      setPedidos(await fetchPedidos())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const unsub = assinarPedidos(load)
    const t = setInterval(load, 15000)
    return () => {
      unsub()
      clearInterval(t)
    }
  }, [load])

  const visiveis = pedidos.filter((p) =>
    filtro === 'finalizados'
      ? ['concluido', 'cancelado'].includes(p.status)
      : !['concluido', 'cancelado'].includes(p.status),
  )

  const mudar = async (p: Pedido, status: StatusPedido) => {
    setPedidos((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)))
    try {
      await atualizarStatus(p.id, status)
    } catch {
      load()
    }
  }

  const pagar = async (p: Pedido) => {
    setPedidos((prev) => prev.map((x) => (x.id === p.id ? { ...x, pago: true } : x)))
    try {
      await marcarPago(p.id)
    } catch {
      load()
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {(
          [
            { key: 'ativos', label: `Ativos (${pedidos.filter((p) => !['concluido', 'cancelado'].includes(p.status)).length})` },
            { key: 'finalizados', label: `Finalizados (${pedidos.filter((p) => ['concluido', 'cancelado'].includes(p.status)).length})` },
          ] as { key: 'ativos' | 'finalizados'; label: string }[]
        ).map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFiltro(f.key)}
            style={{
              backgroundColor: filtro === f.key ? colors.primary : colors.card,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: filtro === f.key ? colors.primary : colors.border,
            }}
          >
            <Text style={{ color: filtro === f.key ? '#fff' : colors.textSoft, fontWeight: '700', fontSize: 13 }}>{f.label}</Text>
          </Pressable>
        ))}
        {filtro === 'finalizados' && pedidos.some((x) => ['concluido', 'cancelado'].includes(x.status)) ? (
          <Pressable
            onPress={async () => {
              try {
                await limparPedidos()
                setPedidos((prev) => prev.filter((x) => !['concluido', 'cancelado'].includes(x.status)))
              } catch {
                load()
              }
            }}
            style={{
              backgroundColor: colors.red,
              borderRadius: 999,
              width: 33,
              height: 33,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 'auto',
            }}
          >
            <TrashIcon size={17} />
          </Pressable>
        ) : null}
      </View>

      {visiveis.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Text style={{ color: colors.textSoft }}>Nenhum pedido por aqui ainda.</Text>
        </Card>
      ) : (
        visiveis.map((p) => <PedidoCard key={p.id} pedido={p} onMudar={mudar} onPagar={pagar} />)
      )}
    </ScrollView>
  )
}

function PedidoCard({
  pedido: p,
  onMudar,
  onPagar,
}: {
  pedido: Pedido
  onMudar: (p: Pedido, s: StatusPedido) => void
  onPagar: (p: Pedido) => void
}) {
  const dt = new Date(p.created_at)
  const hora = `${dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  const ativo = !['concluido', 'cancelado'].includes(p.status)

  const proximo: { status: StatusPedido; label: string } | null =
    p.status === 'novo'
      ? { status: 'confirmado', label: 'Confirmar pedido' }
      : p.status === 'confirmado'
        ? { status: 'em_preparo', label: 'Iniciar preparo' }
        : p.status === 'em_preparo'
          ? p.tipo === 'entrega'
            ? { status: 'saiu_entrega', label: 'Saiu com o motoboy' }
            : { status: 'pronto_retirada', label: 'Pronto p/ retirada' }
          : p.status === 'saiu_entrega' || p.status === 'pronto_retirada'
            ? { status: 'concluido', label: 'Concluir' }
            : null

  const whatsapp = () => {
    const num = '55' + p.telefone.replace(/\D/g, '')
    Linking.openURL(`https://wa.me/${num}`)
  }

  return (
    <Card style={{ opacity: ativo ? 1 : 0.55 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontWeight: '800', color: colors.text, fontSize: 17 }}>{p.nome_cliente}</Text>
        <Text style={{ color: colors.textSoft, fontSize: 12 }}>{hora}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {p.status !== 'novo' ? <Badge text={STATUS_LABEL[p.status]} bg="#ececec" fg="#57534e" /> : null}
        {p.status !== 'saiu_entrega' && p.status !== 'pronto_retirada' ? (
          <Badge text={p.tipo === 'entrega' ? '🛵 Entrega' : '📦 Retirada'} bg="#ececec" fg="#57534e" />
        ) : null}
        <Badge
          text={p.forma_pagamento === 'pix' ? '💠 Pix' : p.forma_pagamento === 'dinheiro' ? '💵 Dinheiro' : '💳 Cartão'}
          bg="#ececec"
          fg="#57534e"
        />
        {p.forma_pagamento === 'pix' ? (
          <Badge text={p.pago ? '💰 Pago' : '⏳ Aguardando Pix'} bg="#ececec" fg="#57534e" />
        ) : null}
      </View>

      <Pressable
        onPress={whatsapp}
        disabled={!ativo}
        style={{
          backgroundColor: colors.greenSoft,
          borderRadius: 10,
          padding: 10,
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontWeight: '700', color: colors.green, fontSize: 12, marginBottom: 2 }}>CHAMAR NO WHATSAPP</Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>{p.telefone}</Text>
        </View>
        <WhatsAppIcon size={26} />
      </Pressable>

      {p.tipo === 'entrega' && p.endereco ? (
        <Pressable
          onPress={() =>
            Linking.openURL(
              'https://wa.me/?text=' +
                encodeURIComponent(`Entrega PedeAí — ${p.nome_cliente}\n📍 ${p.endereco}\n📱 ${p.telefone}`),
            )
          }
          disabled={!ativo}
          style={{
            backgroundColor: colors.blueSoft,
            borderRadius: 10,
            padding: 10,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontWeight: '700', color: colors.blue, fontSize: 12, marginBottom: 2 }}>ENDEREÇO P/ MOTOBOY</Text>
            <Text style={{ color: colors.text, fontSize: 14 }}>{p.endereco}</Text>
          </View>
          <ShareIcon size={26} />
        </Pressable>
      ) : null}

      <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }}>
        {(p.itens || []).map((it, i) => (
          <Text key={i} style={{ color: colors.text, fontSize: 14, marginBottom: 2 }}>
            {it.qtd}x Marmita {it.tamanho} — <Text style={{ color: colors.textSoft }}>{it.ingredientes.join(', ')}</Text>
          </Text>
        ))}
        {p.observacoes ? (
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4, fontStyle: 'italic' }}>Obs: {p.observacoes}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: colors.textSoft, fontSize: 13 }}>
            {moeda(Number(p.subtotal))}{Number(p.taxa_entrega) > 0 ? ` + ${moeda(Number(p.taxa_entrega))} frete` : ''}
          </Text>
          <Text style={{ fontWeight: '900', color: colors.primary, fontSize: 17 }}>{moeda(Number(p.total))}</Text>
        </View>
      </View>

      {ativo ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          {proximo ? <Button title={proximo.label} onPress={() => onMudar(p, proximo.status)} /> : null}
          {p.forma_pagamento === 'pix' && !p.pago ? (
            <Button
              title="Confirmar Pix recebido"
              variant="outline"
              onPress={() => onPagar(p)}
            />
          ) : null}
          <Button
            title="Cancelar pedido"
            variant="danger"
            style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.red }}
            onPress={() => onMudar(p, 'cancelado')}
          />
        </View>
      ) : null}
    </Card>
  )
}

function AbaCardapio() {
  const [itens, setItens] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState('')
  const [novaCat, setNovaCat] = useState<CategoriaIngrediente>('acompanhamento')
  const [salvando, setSalvando] = useState(false)

  const load = useCallback(async () => {
    try {
      setItens(await fetchIngredientesAdmin())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ultimaCarne = useRef<string | null>(null)

  const toggle = async (ing: Ingrediente) => {
    if (ing.categoria === 'carne' && !ing.disponivel) {
      const ligadas = itens.filter((x) => x.categoria === 'carne' && x.disponivel)
      if (ligadas.length >= 2) {
        const sai = ligadas.find((x) => x.id === ultimaCarne.current) || ligadas[ligadas.length - 1]
        setItens((prev) =>
          prev.map((x) =>
            x.id === sai.id ? { ...x, disponivel: false } : x.id === ing.id ? { ...x, disponivel: true } : x,
          ),
        )
        ultimaCarne.current = ing.id
        try {
          await setIngredienteDisponivel(sai.id, false)
          await setIngredienteDisponivel(ing.id, true)
        } catch {
          load()
        }
        return
      }
      ultimaCarne.current = ing.id
    }
    setItens((prev) => prev.map((x) => (x.id === ing.id ? { ...x, disponivel: !x.disponivel } : x)))
    try {
      await setIngredienteDisponivel(ing.id, !ing.disponivel)
    } catch {
      load()
    }
  }

  const adicionar = async () => {
    if (novo.trim().length < 2 || salvando) return
    setSalvando(true)
    try {
      await addIngrediente(novo, novaCat)
      setNovo('')
      await load()
    } catch {}
    setSalvando(false)
  }

  const remover = async (ing: Ingrediente) => {
    try {
      await removeIngrediente(ing.id)
      setItens((prev) => prev.filter((x) => x.id !== ing.id))
    } catch {
      load()
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const disponiveis = itens.filter((i) => i.disponivel).length
  const grupos: { titulo: string; lista: Ingrediente[] }[] = [
    { titulo: 'Carnes (cliente escolhe 1)', lista: itens.filter((i) => i.categoria === 'carne') },
    { titulo: 'Acompanhamentos (todos inclusos)', lista: itens.filter((i) => i.categoria !== 'carne') },
  ]

  const linha = (ing: Ingrediente) => (
    <View
      key={ing.id}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: ing.disponivel ? colors.text : '#a8a29e', fontWeight: '600', flex: 1 }}>
        {ing.nome}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Toggle value={ing.disponivel} onValueChange={() => toggle(ing)} activeColor={colors.primary} />
        <Pressable onPress={() => remover(ing)} hitSlop={10}>
          <Text style={{ color: colors.red, fontSize: 15 }}>✕</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15, marginBottom: 8 }}>
        Escolha o que deseja adicionar
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        {(
          [
            { key: 'acompanhamento', label: 'Acompanhamento' },
            { key: 'carne', label: 'Carne' },
          ] as { key: CategoriaIngrediente; label: string }[]
        ).map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setNovaCat(c.key)}
            style={{
              backgroundColor: novaCat === c.key ? colors.primarySoft : colors.card,
              borderWidth: 1.5,
              borderColor: novaCat === c.key ? colors.primary : colors.border,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: novaCat === c.key ? colors.primaryDark : colors.textSoft, fontWeight: '700', fontSize: 12 }}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <TextInput
          value={novo}
          onChangeText={setNovo}
          placeholder="Nova opção..."
          placeholderTextColor={colors.textSoft}
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
            color: colors.text,
          }}
        />
        <Button title="+" onPress={adicionar} loading={salvando} style={{ paddingHorizontal: 20 }} />
      </View>

      {grupos.map((g) => (
        <View key={g.titulo} style={{ marginBottom: 14 }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15, marginBottom: 8 }}>{g.titulo}</Text>
          {g.lista.length === 0 ? (
            <Text style={{ color: colors.textSoft, fontSize: 13, marginBottom: 8 }}>Nenhum item.</Text>
          ) : (
            g.lista.map(linha)
          )}
        </View>
      ))}
    </ScrollView>
  )
}

function AbaAjustes() {
  const [config, setConfig] = useState<Config | null>(null)
  const [form, setForm] = useState({ preco_p: '', preco_m: '', preco_g: '', taxa_entrega: '', chave_pix: '', nome_pix: '', cidade_pix: '', endereco_retirada: '' })
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    fetchConfig().then((c) => {
      setConfig(c)
      setForm({
        preco_p: String(c.preco_p),
        preco_m: String(c.preco_m),
        preco_g: String(c.preco_g),
        taxa_entrega: String(c.taxa_entrega),
        chave_pix: c.chave_pix,
        nome_pix: c.nome_pix,
        cidade_pix: c.cidade_pix,
        endereco_retirada: c.endereco_retirada,
      })
    })
  }, [])

  if (!config) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const num = (s: string) => Number(String(s).replace(',', '.'))
  const numerosOk = [form.preco_p, form.preco_m, form.preco_g, form.taxa_entrega].every((v) => !isNaN(num(v)) && num(v) >= 0)

  const salvar = async () => {
    if (!numerosOk || salvando) return
    setSalvando(true)
    try {
      await salvarConfig({
        preco_p: num(form.preco_p),
        preco_m: num(form.preco_m),
        preco_g: num(form.preco_g),
        taxa_entrega: num(form.taxa_entrega),
        chave_pix: form.chave_pix.trim(),
        nome_pix: form.nome_pix.trim(),
        cidade_pix: form.cidade_pix.trim(),
        endereco_retirada: form.endereco_retirada.trim(),
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    } catch {}
    setSalvando(false)
  }

  const alternarAberto = async (v: boolean) => {
    setConfig({ ...config, aberto: v })
    try {
      await salvarConfig({ aberto: v })
    } catch {}
  }

  const campo = (label: string, key: keyof typeof form, kb: 'decimal-pad' | 'default' = 'decimal-pad') => (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 6, fontSize: 14 }}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
        keyboardType={kb}
        placeholderTextColor={colors.textSoft}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 11,
          fontSize: 15,
          color: colors.text,
        }}
      />
    </View>
  )

  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 15 }}>
            {config.aberto ? '🟢 Restaurante aberto' : '🔴 Restaurante fechado'}
          </Text>
        </View>
        <Toggle value={config.aberto} onValueChange={alternarAberto} />
      </Card>

      <SectionTitle>Preços</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>{campo('Pequena (R$)', 'preco_p')}</View>
        <View style={{ flex: 1 }}>{campo('Média (R$)', 'preco_m')}</View>
        <View style={{ flex: 1 }}>{campo('Grande (R$)', 'preco_g')}</View>
      </View>
      {campo('Taxa de entrega (R$)', 'taxa_entrega')}

      <SectionTitle>Pix</SectionTitle>
      {campo('Chave Pix', 'chave_pix', 'default')}
      {campo('Nome do recebedor', 'nome_pix', 'default')}
      {campo('Cidade', 'cidade_pix', 'default')}

      <SectionTitle>Retirada</SectionTitle>
      {campo('Endereço do restaurante', 'endereco_retirada', 'default')}

      <Button title={salvo ? '✓ Salvo!' : 'Salvar configurações'} onPress={salvar} loading={salvando} disabled={!numerosOk} />
    </ScrollView>
  )
}
