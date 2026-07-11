import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, moeda, TAMANHOS } from '@/theme'
import { fetchCardapio, fetchConfig } from '@/lib/repo'
import { precoTamanho, useCart } from '@/lib/cart'
import { Button, Card, SectionTitle } from '@/components/ui'
import type { Config, Ingrediente, Tamanho } from '@/types'

export default function Montar() {
  const router = useRouter()
  const { itens, addItem } = useCart()

  const [config, setConfig] = useState<Config | null>(null)
  const [carnes, setCarnes] = useState<Ingrediente[]>([])
  const [acompanhamentos, setAcompanhamentos] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [tamanho, setTamanho] = useState<Tamanho>('M')
  const [carneId, setCarneId] = useState<string | null>(null)
  const [removidosIds, setRemovidosIds] = useState<string[]>([])
  const [salada, setSalada] = useState(true)
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
      setCarneId((atual) => (atual && cs.some((c) => c.id === atual) ? atual : cs[0]?.id || null))
      setRemovidosIds([])
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

  const toggleAcomp = (id: string) => {
    setRemovidosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const enviar = () => {
    const carneNome = carnes.find((c) => c.id === carneId)?.nome
    const acomps = acompanhamentos.filter((a) => !removidosIds.includes(a.id)).map((a) => a.nome)
    addItem({
      tamanho,
      ingredientes: [...(carneNome ? [carneNome] : []), ...acomps, ...(salada ? ['Salada'] : [])],
      qtd,
    })
    router.push('/checkout')
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const removidos = removidosIds.length

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
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
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
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
                padding: 9,
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

      <SectionTitle>2. Escolha a carne</SectionTitle>
      <Text style={{ color: colors.textSoft, marginBottom: 6, fontSize: 12 }}>Uma opção por marmita</Text>
      {carnes.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSoft }}>Sem opções de carne hoje.</Text>
        </Card>
      ) : (
        <View style={{ gap: 6, marginBottom: 12 }}>
          {carnes.map((c) => {
            const ativo = carneId === c.id
            return (
              <Pressable
                key={c.id}
                onPress={() => setCarneId(c.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: ativo ? colors.primarySoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primary : colors.border,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: ativo ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                    backgroundColor: '#fff',
                  }}
                >
                  {ativo ? (
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary }} />
                  ) : null}
                </View>
                <Text style={{ color: ativo ? colors.primaryDark : colors.text, fontWeight: '700', fontSize: 15 }}>
                  {c.nome}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <SectionTitle>3. Acompanhamentos</SectionTitle>
      <Text style={{ color: colors.textSoft, marginBottom: 6, fontSize: 12 }}>
        Tudo incluso! Toque para tirar o que você não quer{removidos > 0 ? ` · ${removidos} removido${removidos > 1 ? 's' : ''}` : ''}
      </Text>
      {acompanhamentos.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textSoft }}>O cardápio de hoje ainda não foi publicado. Puxe para atualizar.</Text>
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {acompanhamentos.map((ing) => {
            const ativo = !removidosIds.includes(ing.id)
            return (
              <Pressable
                key={ing.id}
                onPress={() => toggleAcomp(ing.id)}
                style={{
                  backgroundColor: ativo ? colors.primarySoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: ativo ? colors.primary : colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
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

      <SectionTitle>4. Deseja salada?</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {(
          [
            { key: true, label: 'Sim' },
            { key: false, label: 'Não' },
          ] as { key: boolean; label: string }[]
        ).map((op) => {
          const ativo = salada === op.key
          return (
            <Pressable
              key={op.label}
              onPress={() => setSalada(op.key)}
              style={{
                flex: 1,
                backgroundColor: ativo ? colors.primarySoft : colors.card,
                borderWidth: 1.5,
                borderColor: ativo ? colors.primary : colors.border,
                borderRadius: 14,
                paddingVertical: 9,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontWeight: '800', color: ativo ? colors.primaryDark : colors.textSoft, fontSize: 15 }}>
                {op.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
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
        title={
          config
            ? `${itens.length > 0 ? 'Adicionar e revisar' : 'Iniciar pedido'} · ${moeda(precoTamanho(config, tamanho) * qtd)}  →`
            : 'Iniciar pedido  →'
        }
        onPress={enviar}
        disabled={!config || !config.aberto || !carneId}
      />
      {itens.length > 0 ? (
        <Text style={{ color: colors.textSoft, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          Você já tem {itens.length} marmita{itens.length > 1 ? 's' : ''} no pedido — esta será adicionada junto.
        </Text>
      ) : null}
    </ScrollView>
  )
}
