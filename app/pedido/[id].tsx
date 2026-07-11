import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import QRCode from 'react-native-qrcode-svg'
import { colors, moeda } from '@/theme'
import { fetchConfig, statusPedido } from '@/lib/repo'
import { pixCopiaECola } from '@/lib/pix'
import { Button, Card } from '@/components/ui'
import type { Config, StatusPedido, StatusResumo } from '@/types'

const PASSOS_ENTREGA: { key: StatusPedido; label: string; emoji: string }[] = [
  { key: 'novo', label: 'Pedido recebido', emoji: '📥' },
  { key: 'em_preparo', label: 'Em preparo', emoji: '👨‍🍳' },
  { key: 'saiu_entrega', label: 'Saiu para entrega', emoji: '🛵' },
  { key: 'concluido', label: 'Entregue', emoji: '✅' },
]

const PASSOS_RETIRADA: { key: StatusPedido; label: string; emoji: string }[] = [
  { key: 'novo', label: 'Pedido recebido', emoji: '📥' },
  { key: 'em_preparo', label: 'Em preparo', emoji: '👨‍🍳' },
  { key: 'pronto_retirada', label: 'Pronto para retirada', emoji: '🛍️' },
  { key: 'concluido', label: 'Retirado', emoji: '✅' },
]

export default function AcompanharPedido() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [resumo, setResumo] = useState<StatusResumo | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const r = await statusPedido(String(id))
      if (!r) {
        setNaoEncontrado(true)
        return
      }
      setResumo(r)
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

  const passos = resumo.tipo === 'entrega' ? PASSOS_ENTREGA : PASSOS_RETIRADA
  const cancelado = resumo.status === 'cancelado'
  const idxAtual = passos.findIndex((p) => p.key === resumo.status)

  const pix =
    resumo.forma_pagamento === 'pix' && config
      ? pixCopiaECola({
          chave: config.chave_pix,
          nome: config.nome_pix,
          cidade: config.cidade_pix,
          valor: Number(resumo.total),
          txid: String(id).slice(0, 25),
        })
      : null

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 34 }}>{cancelado ? '❌' : passos[Math.max(idxAtual, 0)]?.emoji || '📥'}</Text>
        <Text style={{ fontSize: 18, fontWeight: '900', color: cancelado ? colors.red : colors.text, marginTop: 6 }}>
          {cancelado ? 'Pedido cancelado' : passos[Math.max(idxAtual, 0)]?.label || 'Pedido recebido'}
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
            return (
              <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < passos.length - 1 ? 14 : 0 }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: feito ? colors.primary : colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{feito ? '✓' : p.emoji}</Text>
                </View>
                <Text
                  style={{
                    marginLeft: 12,
                    fontWeight: atual ? '800' : '500',
                    color: feito ? colors.text : colors.textSoft,
                    fontSize: 15,
                  }}
                >
                  {p.label}
                </Text>
              </View>
            )
          })}
        </Card>
      ) : null}

      {pix && !cancelado && resumo.status !== 'concluido' ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16, marginBottom: 4 }}>
            💠 Pague com Pix
          </Text>
          <Text style={{ color: colors.textSoft, fontSize: 13, textAlign: 'center', marginBottom: 14 }}>
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
          <Text style={{ color: colors.textSoft, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            Valor: {moeda(Number(resumo.total))} · o restaurante confirma o pagamento ao receber
          </Text>
        </Card>
      ) : null}

      <Text style={{ color: colors.textSoft, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
        Esta tela atualiza sozinha a cada poucos segundos.
      </Text>
      <Button title="Fazer novo pedido" onPress={() => router.replace('/')} variant="ghost" style={{ marginTop: 8 }} />
    </ScrollView>
  )
}
