import { useEffect, useState } from 'react'
import { ScrollView, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
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

  const valido =
    nome.trim().length >= 2 && telefone.replace(/\D/g, '').length >= 10 && endereco.trim().length >= 8

  const salvar = async () => {
    if (!valido) return
    await saveCliente({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() })
    router.replace(voltar === 'checkout' ? '/checkout' : '/montar')
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 18, paddingTop: 24 }}>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
          {jaCadastrado ? 'Confirma seus dados? ✅' : 'Antes de começar 👋'}
        </Text>
        <Text style={{ color: colors.textSoft, fontSize: 13, marginBottom: 16 }}>
          {jaCadastrado
            ? 'Confere se está tudo certo — é para esse endereço e contato que vai o pedido. Pode corrigir o que precisar.'
            : 'Precisamos só do básico para o restaurante falar com você e entregar seu pedido. Fica salvo no aparelho — você não digita de novo.'}
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
          onChangeText={setEndereco}
          placeholder="Rua, número, bairro e complemento"
          multiline
        />
        <Button
          title={jaCadastrado ? 'Tá certo, continuar  →' : 'Salvar e continuar  →'}
          onPress={salvar}
          disabled={!valido}
        />
      </Card>
    </ScrollView>
  )
}
