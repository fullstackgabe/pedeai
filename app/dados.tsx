import { useEffect, useState } from 'react'
import { Platform, Pressable, ScrollView, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { colors, fmtTelefone } from '@/theme'
import { loadCliente, saveCliente } from '@/lib/storage'
import { Button, Card, Field } from '@/components/ui'

export default function Dados() {
  const router = useRouter()
  const { voltar } = useLocalSearchParams<{ voltar?: string }>()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [jaCadastrado, setJaCadastrado] = useState(false)
  const [localizando, setLocalizando] = useState(false)
  const [erroLoc, setErroLoc] = useState<string | null>(null)
  const [usouLocalizacao, setUsouLocalizacao] = useState(false)

  useEffect(() => {
    loadCliente().then((c) => {
      if (c) {
        setNome(c.nome)
        setTelefone(c.telefone)
        setEndereco(c.endereco)
        setJaCadastrado(true)
      }
    })
  }, [])

  const usarLocalizacao = async () => {
    setLocalizando(true)
    setErroLoc(null)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErroLoc('Permissão de localização negada. Digite o endereço manualmente.')
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
      const { latitude, longitude } = pos.coords
      let end = ''
      if (Platform.OS === 'web') {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=pt-BR`,
        )
        const d = await r.json()
        const a = d?.address || {}
        end = [
          [a.road, a.house_number].filter(Boolean).join(', '),
          a.suburb || a.neighbourhood,
          a.city || a.town || a.village,
        ]
          .filter(Boolean)
          .join(' - ')
      } else {
        const [g] = await Location.reverseGeocodeAsync({ latitude, longitude })
        if (g) {
          end = [
            [g.street, g.streetNumber].filter(Boolean).join(', '),
            g.district,
            g.city || g.subregion,
          ]
            .filter(Boolean)
            .join(' - ')
        }
      }
      if (end) {
        setEndereco(end)
        setErroLoc(null)
        setUsouLocalizacao(true)
      } else {
        setErroLoc('Não conseguimos identificar o endereço. Digite manualmente.')
      }
    } catch {
      setErroLoc('Não foi possível pegar sua localização. Digite manualmente.')
    } finally {
      setLocalizando(false)
    }
  }

  const valido =
    nome.trim().length >= 2 && telefone.replace(/\D/g, '').length >= 10 && endereco.trim().length >= 8

  const salvar = async () => {
    if (!valido) return
    await saveCliente({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() })
    if (voltar === 'checkout') {
      router.back()
    } else {
      router.push('/montar')
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingTop: 24 }}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
          {jaCadastrado ? 'Confirma seus dados? ✅' : 'Antes de começar 👋'}
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 13, marginBottom: 16 }}>
          {jaCadastrado
            ? 'Confira se as informações estão corretas.\nAssim seu pedido chega rapidinho e sem contratempos.'
            : 'Precisamos só do básico para o restaurante falar com você e entregar seu pedido.'}
        </Text>
        <Field label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" />
        <Field
          label="WhatsApp"
          value={telefone}
          onChangeText={(t) => setTelefone(fmtTelefone(t))}
          placeholder="(41) 99999-9999"
          keyboardType="phone-pad"
        />
        <Field
          label="Endereço"
          value={endereco}
          onChangeText={(t) => {
            setEndereco(t)
            setUsouLocalizacao(false)
          }}
          placeholder="Rua, número, bairro e complemento"
          multiline
          labelRight={
            <Pressable onPress={usarLocalizacao} hitSlop={8} disabled={localizando}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {localizando ? 'Localizando...' : '📍 Usar minha localização atual'}
              </Text>
            </Pressable>
          }
        />
        {erroLoc ? (
          <Text style={{ color: colors.red, fontSize: 12, marginTop: -8, marginBottom: 10 }}>{erroLoc}</Text>
        ) : usouLocalizacao ? (
          <Text style={{ color: '#b45309', fontSize: 12, marginTop: -8, marginBottom: 10 }}>
            Confirme o número da casa antes de continuar.
          </Text>
        ) : null}
        <Button
          title={jaCadastrado ? 'Tudo certo, continuar  →' : 'Salvar e continuar  →'}
          onPress={salvar}
          disabled={!valido}
        />
      </Card>
    </ScrollView>
  )
}
