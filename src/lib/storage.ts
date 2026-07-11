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

const KEY_PEDIDO = 'pedeai:pedido-ativo'

export async function loadPedidoAtivo(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_PEDIDO)
  } catch {
    return null
  }
}

export async function savePedidoAtivo(id: string) {
  try {
    await AsyncStorage.setItem(KEY_PEDIDO, id)
  } catch {}
}

export async function clearPedidoAtivo() {
  try {
    await AsyncStorage.removeItem(KEY_PEDIDO)
  } catch {}
}
