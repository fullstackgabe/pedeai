import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, moeda } from '@/theme'
import { fetchConfig } from '@/lib/repo'
import { Button } from '@/components/ui'
import type { Config } from '@/types'

export default function Home() {
  const router = useRouter()
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => {})
  }, [])

  const chips = [
    config ? (config.aberto ? '🟢 Aberto agora' : '🔴 Fechado no momento') : null,
    config ? `🛵 Entrega ${moeda(Number(config.taxa_entrega))}` : '🛵 Entrega em Curitiba',
    '💠 Pix direto no app',
  ].filter(Boolean) as string[]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ flexGrow: 1 }}>
      <View>
        <Image
          source={require('../assets/hero.jpg')}
          style={{ width: '100%', height: 330 }}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingTop: 16,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.primary }}>🍱 PedeAí</Text>
          </View>
          <Pressable
            onPress={() => router.push('/login')}
            hitSlop={12}
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 999,
              width: 34,
              height: 34,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}
          >
            <Text style={{ fontSize: 15 }}>🔒</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, padding: 24, paddingTop: 26 }}>
        <Text style={{ fontSize: 30, fontWeight: '900', color: colors.text, lineHeight: 36 }}>
          Marmita caseira,{'\n'}do seu jeito
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 16, lineHeight: 24, marginTop: 12 }}>
          Todo dia uma seleção fresquinha de ingredientes. Escolha o tamanho, tire o que não
          quiser, pague no Pix pelo app e receba em casa ou retire no balcão.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          {chips.map((c) => (
            <View
              key={c}
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 13 }}>{c}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Button
          title="Ver opções do dia  →"
          onPress={() => router.push('/dados')}
          style={{ marginTop: 26, paddingVertical: 16 }}
        />
        <Text style={{ color: colors.textSoft, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          Sem cadastro, sem complicação — do pedido à entrega em poucos toques.
        </Text>
      </View>
    </ScrollView>
  )
}
