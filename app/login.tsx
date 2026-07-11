import { useEffect, useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/theme'
import { useAuth } from '@/lib/auth'
import { Button, Card, Field } from '@/components/ui'

export default function Login() {
  const router = useRouter()
  const { session, ready, signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  useEffect(() => {
    if (ready && session) router.replace('/admin')
  }, [ready, session])

  const entrar = async () => {
    setEntrando(true)
    setErro(null)
    const err = await signIn(email, senha)
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
        <Field
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@restaurante.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label="Senha" value={senha} onChangeText={setSenha} placeholder="••••••••" secureTextEntry />
        {erro ? <Text style={{ color: colors.red, fontWeight: '600', marginBottom: 10 }}>{erro}</Text> : null}
        <Button
          title="Entrar"
          onPress={entrar}
          loading={entrando}
          disabled={!email.includes('@') || senha.length < 6}
        />
      </Card>
    </ScrollView>
  )
}
