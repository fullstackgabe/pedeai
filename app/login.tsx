import { useEffect, useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/theme'
import { useAuth } from '@/lib/auth'
import { Button, Card, Field } from '@/components/ui'

const DEMO_EMAIL = 'demo@demo.com'
const DEMO_SENHA = 'demo1234'

export default function Login() {
  const router = useRouter()
  const { session, ready, signIn } = useAuth()

  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    if (ready && session) router.replace('/admin')
  }, [ready, session])

  const entrar = async () => {
    setEntrando(true)
    setErro(null)
    const err = await signIn(DEMO_EMAIL, DEMO_SENHA)
    if (err) {
      setErro(err)
      setEntrando(false)
    } else {
      router.replace('/admin')
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingTop: 30 }}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
          Acesso da equipe
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 13, marginBottom: 16 }}>
          Área restrita para gerenciar pedidos e o cardápio do dia.
        </Text>
        <Field label="E-mail" value={DEMO_EMAIL} onChangeText={() => {}} editable={false} />
        <Field label="Senha" value={DEMO_SENHA} onChangeText={() => {}} secureTextEntry editable={false} />
        {erro ? <Text style={{ color: colors.red, fontWeight: '600', marginBottom: 10 }}>{erro}</Text> : null}
        <Button title="Entrar" onPress={entrar} loading={entrando} />
      </Card>
    </ScrollView>
  )
}
