import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/theme'
import { fetchConfig, statusPedido } from '@/lib/repo'
import { clearPedidoAtivo, loadPedidoAtivo } from '@/lib/storage'
import { Button } from '@/components/ui'
import { Logo } from '@/components/Logo'
import type { Config } from '@/types'

export default function Home() {
  const router = useRouter()
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {})
    loadPedidoAtivo().then(async (id) => {
      if (!id) return
      try {
        const r = await statusPedido(id)
        if (r && !['concluido', 'cancelado'].includes(r.status)) {
          router.replace(`/pedido/${id}`)
        } else {
          clearPedidoAtivo()
        }
      } catch {}
    })
  }, [])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 18,
          paddingVertical: 14,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Logo iconSize={24} textSize={18} />
        <Pressable onPress={() => router.push('/login')} hitSlop={12} style={{ opacity: 0.35 }}>
          <Text style={{ fontSize: 17 }}>🔒</Text>
        </Pressable>
      </View>

      <Image
        source={require('../assets/hero.jpg')}
        style={{ width: '100%', height: 300 }}
        resizeMode="cover"
      />

      <View style={{ flex: 1, padding: 24, paddingTop: 26 }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: colors.text, lineHeight: 36 }}>
          Marmita caseira
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
          Feita na hora, com ingredientes fresquinhos selecionados todo dia.
        </Text>

        <View style={{ flex: 1 }} />

        {config && !config.aberto ? (
          <Text style={{ color: colors.red, fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 18 }}>
            🔴 Estamos fechados no momento
          </Text>
        ) : null}

        <Button
          title="Fazer meu pedido  →"
          onPress={() => router.push('/dados')}
          style={{ marginTop: 20, paddingVertical: 16 }}
        />
      </View>
    </ScrollView>
  )
}
