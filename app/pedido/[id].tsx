import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import QRCode from 'react-native-qrcode-svg'
import Svg, { Circle, Path } from 'react-native-svg'
import { colors, moeda } from '@/theme'
import { cancelarPedido, cobrancaPix, fetchConfig, receberPedido, statusPedido } from '@/lib/repo'
import { clearPedidoAtivo, savePedidoAtivo } from '@/lib/storage'
import { pixCopiaECola } from '@/lib/pix'
import { Button, Card } from '@/components/ui'
import type { Config, StatusPedido, StatusResumo } from '@/types'

const PASSOS_ENTREGA: { key: string; label: string }[] = [
  { key: 'novo', label: 'Pedido recebido' },
  { key: 'confirmado', label: 'Pedido confirmado' },
  { key: 'em_preparo', label: 'Pedido sendo preparado' },
  { key: 'saiu_entrega', label: 'Saiu para entrega' },
  { key: 'concluido', label: 'Entregue' },
]

const PASSOS_RETIRADA: { key: string; label: string }[] = [
  { key: 'novo', label: 'Pedido recebido' },
  { key: 'confirmado', label: 'Pedido confirmado' },
  { key: 'em_preparo', label: 'Pedido sendo preparado' },
  { key: 'pronto_retirada', label: 'Pronto para retirada' },
  { key: 'concluido', label: 'Retirado' },
]

const FRASES: Partial<Record<StatusPedido, string>> = {
  novo: 'Recebemos seu pedido! Aguarde o restaurante confirmar e acompanhe tudo por aqui 😉',
  confirmado: 'Pedido confirmado! Já já vai pra panela. 🍳',
  em_preparo: 'Capricho no fogão! Sua marmita está sendo preparada com carinho. 🧑‍🍳',
  saiu_entrega: 'O motoboy já saiu! Fica de olho no portão. 🛵',
  pronto_retirada: 'Prontinho! Sua marmita já tá quentinha aqui te esperando. 🍱',
  concluido: 'Pedido finalizado. Bom apetite! 😋',
}

const PIX_LIMITE_MS = 10 * 60 * 1000

export default function AcompanharPedido() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const navigation = useNavigation()

  const [resumo, setResumo] = useState<StatusResumo | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [mpQr, setMpQr] = useState<string | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [recebendo, setRecebendo] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const cobrancaPedida = useRef(false)
  const ativoRef = useRef(true)
  const cancelAuto = useRef(false)
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const pulso = useRef(new Animated.Value(1)).current
  const carga = useRef(new Animated.Value(0)).current
  const fadePago = useRef(new Animated.Value(1)).current
  const [pagoVisivel, setPagoVisivel] = useState(true)
  const fadeIniciado = useRef(false)

  useEffect(() => {
    if (resumo?.pago && resumo.forma_pagamento === 'pix' && !fadeIniciado.current) {
      fadeIniciado.current = true
      const t = setTimeout(() => {
        Animated.timing(fadePago, { toValue: 0, duration: 600, useNativeDriver: true }).start(() =>
          setPagoVisivel(false),
        )
      }, 1500)
      return () => clearTimeout(t)
    }
  }, [resumo?.pago, resumo?.forma_pagamento, fadePago])

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    anim.start()
    const animLinha = Animated.loop(
      Animated.sequence([
        Animated.timing(carga, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(carga, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    animLinha.start()
    return () => {
      anim.stop()
      animLinha.stop()
    }
  }, [pulso, carga])

  useEffect(() => {
    const unsub = (navigation as any).addListener?.('beforeRemove', (e: any) => {
      if (ativoRef.current) e.preventDefault()
    })
    return unsub
  }, [navigation])

  const load = useCallback(async () => {
    if (!id) return
    try {
      const r = await statusPedido(String(id))
      if (!r) {
        setNaoEncontrado(true)
        ativoRef.current = false
        clearPedidoAtivo()
        return
      }
      setResumo(r)
      const ativo = !['concluido', 'cancelado'].includes(r.status)
      ativoRef.current = ativo
      if (ativo) {
        savePedidoAtivo(String(id))
      } else {
        clearPedidoAtivo()
      }
      if (r.forma_pagamento === 'pix' && !r.pago && !r.pix_copia_cola && !cobrancaPedida.current) {
        cobrancaPedida.current = true
        const cob = await cobrancaPix(String(id))
        if (cob?.qr_code) setMpQr(cob.qr_code)
        if (cob?.pago) load()
      }
    } catch {}
  }, [id])

  useEffect(() => {
    load()
    fetchConfig().then(setConfig).catch(() => {})
    timer.current = setInterval(load, 8000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [load])

  if (naoEncontrado) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ fontSize: 40 }}>🤔</Text>
        <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>Pedido não encontrado</Text>
        <Button title="Voltar ao início" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
      </View>
    )
  }

  if (!resumo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const isPix = resumo.forma_pagamento === 'pix'
  const passos = resumo.tipo === 'entrega' ? PASSOS_ENTREGA : PASSOS_RETIRADA
  const cancelado = resumo.status === 'cancelado'
  const concluido = resumo.status === 'concluido'
  const idxAtual = passos.findIndex((p) => p.key === resumo.status)

  const pixPendente = isPix && !resumo.pago && resumo.status === 'novo'
  const restanteMs = pixPendente
    ? Math.max(0, new Date(resumo.created_at).getTime() + PIX_LIMITE_MS - agora)
    : 0
  const restanteFmt = `${String(Math.floor(restanteMs / 60000)).padStart(2, '0')}:${String(Math.floor((restanteMs % 60000) / 1000)).padStart(2, '0')}`

  if (pixPendente && restanteMs <= 0 && !cancelAuto.current) {
    cancelAuto.current = true
    cancelarPedido(String(id))
      .then(() => {
        ativoRef.current = false
        clearPedidoAtivo()
        load()
      })
      .catch(() => {})
  }

  const pix = resumo.pix_copia_cola || mpQr ||
    (resumo.forma_pagamento === 'pix' && config
      ? pixCopiaECola({
          chave: config.chave_pix,
          nome: config.nome_pix,
          cidade: config.cidade_pix,
          valor: Number(resumo.total),
          txid: String(id).slice(0, 25),
        })
      : null)

  const copiar = async () => {
    if (!pix) return
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(pix)
    } else {
      await Clipboard.setStringAsync(pix)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const verificarPagamento = async () => {
    setVerificando(true)
    await cobrancaPix(String(id), true)
    await load()
    setVerificando(false)
  }

  const cancelar = async () => {
    setCancelando(true)
    try {
      await cancelarPedido(String(id))
      ativoRef.current = false
      clearPedidoAtivo()
      await load()
    } catch {}
    setCancelando(false)
  }

  if (pixPendente && pix) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        <Stack.Screen options={{ title: 'Pagamento' }} />
        <Card style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: pulso }] }}>
            <Svg width={60} height={60} viewBox="0 0 60 60">
              <Circle cx={30} cy={30} r={30} fill={colors.primarySoft} />
              <Circle cx={30} cy={30} r={22} fill={colors.primary} />
              <Circle cx={30} cy={30} r={13} stroke="#fff" strokeWidth={3.5} fill="none" />
              <Path d="M30 24v6.5l4.5 3" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Animated.View>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginTop: 8 }}>
            Aguardando pagamento
          </Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4 }}>
            Total: {moeda(Number(resumo.total))} · {resumo.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
          </Text>
          <View
            style={{
              backgroundColor: colors.primarySoft,
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginTop: 10,
            }}
          >
            <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 13 }}>
              {restanteFmt} para pagar
            </Text>
          </View>
        </Card>
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: colors.text, fontSize: 18, marginBottom: 4 }}>
            💠 Pague com Pix
          </Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            Escaneie o QR Code ou copie o código abaixo
          </Text>
          <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <QRCode value={pix} size={190} />
          </View>
          <Pressable
            onPress={copiar}
            style={{
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 10,
              marginTop: 14,
              width: '100%',
            }}
          >
            <Text numberOfLines={2} style={{ color: colors.textSoft, fontSize: 11 }}>
              {pix}
            </Text>
          </Pressable>
          <Button
            title={copiado ? '✓ Código copiado!' : 'Copiar código Pix'}
            onPress={copiar}
            variant={copiado ? 'outline' : 'primary'}
            style={{ marginTop: 10, alignSelf: 'stretch' }}
          />
          <Button
            title="Confirmar pagamento"
            onPress={verificarPagamento}
            loading={verificando}
            variant="ghost"
            style={{ marginTop: 4, alignSelf: 'stretch' }}
          />
        </Card>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: 'Acompanhar pedido' }} />
      <Card style={{ alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ scale: cancelado || concluido ? 1 : pulso }] }}>
          <Svg width={60} height={60} viewBox="0 0 60 60">
            <Circle cx={30} cy={30} r={30} fill={cancelado ? colors.redSoft : colors.greenSoft} />
            <Circle cx={30} cy={30} r={22} fill={cancelado ? colors.red : colors.green} />
            {cancelado ? (
              <Path d="M23 23l14 14M37 23l-14 14" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" />
            ) : (
              <Path d="M21 30.5l6.5 6.5L39.5 24" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
          </Svg>
        </Animated.View>
        <Text style={{ fontSize: 18, fontWeight: '900', color: cancelado ? colors.red : colors.text, marginTop: 8 }}>
          {cancelado
            ? 'Pedido cancelado'
            : pixPendente
              ? 'Aguardando pagamento'
              : passos[Math.max(idxAtual, 0)]?.label || 'Pedido recebido'}
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4 }}>
          Total: {moeda(Number(resumo.total))} · {resumo.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
        </Text>
      </Card>

      {!cancelado ? (
        <Card>
          {passos.map((p, i) => {
            const feito = idxAtual >= i
            const atual = idxAtual === i
            const linhaFeita = idxAtual > i
            return (
              <View key={p.key} style={{ flexDirection: 'row' }}>
                <View style={{ alignItems: 'center', marginRight: 12 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: feito ? colors.green : '#e7e5e4',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '900', color: feito ? '#fff' : '#a8a29e' }}>✓</Text>
                  </View>
                  {i < passos.length - 1 ? (
                    <View
                      style={{
                        width: 2.5,
                        flex: 1,
                        minHeight: 18,
                        backgroundColor: linhaFeita ? colors.green : '#e7e5e4',
                        overflow: 'hidden',
                        borderRadius: 2,
                      }}
                    >
                      {i === idxAtual ? (
                        <Animated.View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: colors.green,
                            transformOrigin: 'top',
                            transform: [{ scaleY: carga }],
                          }}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontWeight: atual ? '800' : '500',
                    color: feito ? colors.text : colors.textSoft,
                    fontSize: 15,
                    paddingBottom: i < passos.length - 1 ? 22 : 0,
                    paddingTop: 4,
                  }}
                >
                  {p.label}
                </Text>
              </View>
            )
          })}
        </Card>
      ) : null}

      {!cancelado && (pixPendente || FRASES[resumo.status]) ? (
        <Text style={{ color: colors.textSoft, fontSize: 13, textAlign: 'center', marginBottom: 14, paddingHorizontal: 10, lineHeight: 19 }}>
          {pixPendente ? '⏱ Tempo estimado: mínimo de 30 minutos' : FRASES[resumo.status]}
        </Text>
      ) : null}

      {resumo.status === 'novo' && resumo.forma_pagamento !== 'pix' ? (
        <Button
          title="Cancelar pedido"
          variant="danger"
          loading={cancelando}
          onPress={cancelar}
          style={{ marginBottom: 14 }}
        />
      ) : null}

      {resumo.status === 'saiu_entrega' ? (
        <Button
          title="Recebi meu pedido ✓"
          loading={recebendo}
          onPress={async () => {
            setRecebendo(true)
            try {
              await receberPedido(String(id))
              ativoRef.current = false
              clearPedidoAtivo()
              await load()
            } catch {}
            setRecebendo(false)
          }}
          style={{ marginBottom: 14 }}
        />
      ) : null}

      {resumo.tipo === 'retirada' && !cancelado && config?.endereco_retirada ? (
        <Pressable
          onPress={() =>
            Linking.openURL(
              'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(config.endereco_retirada),
            )
          }
          style={({ pressed }) => ({
            backgroundColor: colors.blueSoft,
            borderWidth: 1.5,
            borderColor: colors.blue,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 16 }}>Ir para o endereço  →</Text>
        </Pressable>
      ) : null}

      {pix && !resumo.pago && !cancelado && !concluido ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16, marginBottom: 4 }}>
            💠 Pague com Pix
          </Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, textAlign: 'center', marginBottom: 8 }}>
            Escaneie o QR Code ou copie o código abaixo
          </Text>
          {pixPendente ? (
            <View
              style={{
                backgroundColor: restanteMs < 60000 ? colors.redSoft : colors.primarySoft,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: restanteMs < 60000 ? colors.red : colors.primaryDark, fontWeight: '800', fontSize: 13 }}>
                ⏳ {restanteFmt} para pagar
              </Text>
            </View>
          ) : null}
          <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <QRCode value={pix} size={190} />
          </View>
          <Pressable
            onPress={copiar}
            style={{
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 10,
              marginTop: 14,
              width: '100%',
            }}
          >
            <Text numberOfLines={2} style={{ color: colors.textSoft, fontSize: 11 }}>
              {pix}
            </Text>
          </Pressable>
          <Button
            title={copiado ? '✓ Código copiado!' : 'Copiar código Pix'}
            onPress={copiar}
            variant={copiado ? 'outline' : 'primary'}
            style={{ marginTop: 10, alignSelf: 'stretch' }}
          />
          <Button
            title="Confirmar pagamento"
            onPress={verificarPagamento}
            loading={verificando}
            variant="ghost"
            style={{ marginTop: 4, alignSelf: 'stretch' }}
          />
        </Card>
      ) : null}

      {resumo.pago && resumo.forma_pagamento === 'pix' && !cancelado && pagoVisivel ? (
        <Animated.View style={{ opacity: fadePago }}>
          <Card style={{ backgroundColor: colors.greenSoft, borderColor: colors.green, alignItems: 'center' }}>
            <Text style={{ color: colors.green, fontWeight: '900', fontSize: 15 }}>Pagamento confirmado ✓</Text>
          </Card>
        </Animated.View>
      ) : null}

      {cancelado || concluido ? (
        <Button title="Fazer novo pedido" onPress={() => router.replace('/')} variant="outline" style={{ marginTop: 4 }} />
      ) : null}
    </ScrollView>
  )
}
