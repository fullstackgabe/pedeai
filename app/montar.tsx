import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, moeda, TAMANHOS } from '@/theme'
import { fetchCardapio, fetchConfig } from '@/lib/repo'
import { precoTamanho, useCart } from '@/lib/cart'
import { Badge, Button, Card, SectionTitle } from '@/components/ui'
import type { Config, Ingrediente, Tamanho } from '@/types'

export default function Montar() {
  const router = useRouter()
  const { itens, addItem, removeItem, subtotal } = useCart()

  const [config, setConfig] = useState<Config | null>(null)
  const [carnes, setCarnes] = useState<Ingrediente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [tamanho, setTamanho] = useState<Tamanho>('M')
  const [carne, setCarne] = useState<string | null>(null)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [qtd, setQtd] = useState(1)

  const load = useCallback(async () => {
    try {
      setErro(null)
      const [cfg, card] = await Promise.all([fetchConfig(), fetchCardapio()])
      setConfig(cfg)
      const cs = card.filter((i) => i.categoria === 'carne')
      const acs = card.filter((i) => i.categoria !== 'carne')
      setCarnes(cs)
      setAcompanhamentos(acs)
      setCarne((atual) => (atual && cs.some((c) => c.nome === atual) ? atual : cs[0]?.nome || null))
      setSelecionados(acs.map((a) => a.nome))
    } catch {
      setErro('Não foi possível carregar o cardápio. Tente novamente.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleAcomp = (nome: string) => {
    setSelecionados((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome],
    )
  }

  const adicionar = () => {
    const ingredientes = [...(carne ? [carne] : []), ...selecionados]
    addItem({ tamanho, ingredientes, qtd })
    setQtd(1)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const removidos = acompanhamentos.filter((a) => !selecionados.includes(a.nome)).length

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
    >
      {erro ? (
        <Card style={{ backgroundColor: colors.redSoft, borderColor: colors.red }}>
          <Text style={{ color: colors.red, fontWeight: '600' }}>{erro}</Text>
          <Button title="Tentar de novo" onPress={() => { setLoading(true); load() }} variant="ghost" />
        </Card>
      ) : null}

      {config && !config.aberto ? (
        <Card style={{ backgroundColor: colors.redSoft, borderColor: colors.red }}>
          <Text style={{ color: colors.red, fontWeight: '800', fontSize: 16 }}>Estamos fechados agora 😴</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>Volte mais tarde para fazer seu pedido.</Text>
        </Card>
      ) : null}

      <SectionTitle>1. Escolha o tamanho</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
        {TAMANHOS.map((t) => {
          const ativo = tamanho === t.key
          return (
            <Pressable
              key={t.key}
              onPress={() => setTamanho(t.key)}
              style={{
                flex: 1,
                backgroundColor: ativo ? colors.primary : colors.card,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: ativo ? colors.primary : colors.border,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 22, fontWeight: '900', color: ativo ? '#fff' : colors.primary }}>{t.key}</Text>
              <Text style={{ fontWeight: '700', color: ativo ? '#fff' : colors.text, fontSize: 13 }}>{t.label}</Text>
              <Text style={{ color: ativo ? '#ffedd5' : colors.textSoft, fontSize: 12, marginTop: 2 }}>
                {config ? moeda(precoTamanho(config, t.key)) : '—'}
              </Text>
              <Text style={{ color: ativo ? '#ffedd5' : colors.textSoft, fontSize: 11 }}>{t.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      <SectionTitle>2. Escolha a carne 🥩</SectionTitle>
      <Text style={{ color: colors.textSoft, marginBottom: 10, fontSize: 13 }}>Uma opção por marmita</Text>
      {carnes.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSoft }}>Sem opções de carne hoje.</Text>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {carnes.map((c) => {
            const ativo = carne === c.nome
            return (
              <Pressable
                key={c.id}
                onPress={() => setCarne(c.nome)}
                style={{
                  backgroundColor: ativo ? colors.primary : colors.card,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primary : colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                }}
              >
                <Text style={{ color: ativo ? '#fff' : colors.text, fontWeight: '700', fontSize: 14 }}>
                  {ativo ? '● ' : '○ '}{c.nome}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <SectionTitle>3. Acompanhamentos</SectionTitle>
      <Text style={{ color: colors.textSoft, marginBottom: 10, fontSize: 13 }}>
        Tudo incluso! Toque para tirar o que você não quer{removidos > 0 ? ` · ${removidos} removido${removidos > 1 ? 's' : ''}` : ''}
      </Text>
      {acompanhamentos.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSoft }}>O cardápio de hoje ainda não foi publicado. Puxe para atualizar.</Text>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {acompanhamentos.map((ing) => {
            const ativo = selecionados.includes(ing.nome)
            return (
              <Pressable
                key={ing.id}
                onPress={() => toggleAcomp(ing.nome)}
                style={{
                  backgroundColor: ativo ? colors.primarySoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primary : colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  opacity: ativo ? 1 : 0.55,
                }}
              >
                <Text
                  style={{
                    color: ativo ? colors.primaryDark : colors.textSoft,
                    fontWeight: ativo ? '700' : '500',
                    fontSize: 14,
                    textDecorationLine: ativo ? 'none' : 'line-through',
                  }}
                >
                  {ativo ? '✓ ' : ''}{ing.nome}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>Quantidade</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => setQtd((q) => Math.max(1, q - 1))}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>−</Text>
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, minWidth: 24, textAlign: 'center' }}>{qtd}</Text>
          <Pressable
            onPress={() => setQtd((q) => Math.min(20, q + 1))}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primaryDark }}>+</Text>
          </Pressable>
        </View>
      </View>

      <Button
        title={config ? `Adicionar à sacola · ${moeda(precoTamanho(config, tamanho) * qtd)}` : 'Adicionar à sacola'}
        onPress={adicionar}
        disabled={!config || !config.aberto || !carne}
      />

      {itens.length > 0 && config ? (
        <View style={{ marginTop: 26 }}>
          <SectionTitle>🛍️ Sua sacola</SectionTitle>
          {itens.map((item, i) => (
            <Card key={i} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge text={`${item.qtd}x Marmita ${item.tamanho}`} bg={colors.primarySoft} fg={colors.primaryDark} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontWeight: '800', color: colors.text }}>
                    {moeda(precoTamanho(config, item.tamanho) * item.qtd)}
                  </Text>
                  <Pressable onPress={() => removeItem(i)} hitSlop={10}>
                    <Text style={{ color: colors.red, fontSize: 16 }}>✕</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={{ color: colors.textSoft, marginTop: 6, fontSize: 13 }}>
                {item.ingredientes.join(' · ')}
              </Text>
            </Card>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Subtotal</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary }}>{moeda(subtotal(config))}</Text>
          </View>
          <Button title="Continuar →" onPress={() => router.push('/checkout')} />
        </View>
      ) : null}
    </ScrollView>
  )
}
