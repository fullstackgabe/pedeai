import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'pedeai:cliente'

export type ClienteCache = {
  nome: string
  telefone: string
  endereco: string
}

export async function loadCliente(): Promise<ClienteCache | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ClienteCache) : null
  } catch {
    return null
  }
}

export async function saveCliente(c: ClienteCache) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(c))
  } catch {}
}
