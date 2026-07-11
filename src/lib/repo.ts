import { supabase } from '@/lib/supabase'
import type {
  CategoriaIngrediente,
  Config,
  FormaPagamento,
  Ingrediente,
  ItemPedido,
  Pedido,
  StatusPedido,
  StatusResumo,
  TipoPedido,
} from '@/types'

export async function fetchConfig(): Promise<Config> {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single()
  if (error) throw error
  return data as Config
}

export async function fetchCardapio(): Promise<Ingrediente[]> {
  const { data, error } = await supabase
    .from('ingredientes')
    .select('id, nome, disponivel, categoria')
    .eq('disponivel', true)
    .order('nome')
  if (error) throw error
  return (data || []) as Ingrediente[]
}

export async function criarPedido(input: {
  nome: string
  telefone: string
  endereco: string | null
  tipo: TipoPedido
  itens: ItemPedido[]
  formaPagamento: FormaPagamento
  observacoes?: string
}): Promise<string> {
  const { data, error } = await supabase.rpc('criar_pedido', {
    p_nome: input.nome,
    p_telefone: input.telefone,
    p_endereco: input.endereco,
    p_tipo: input.tipo,
    p_itens: input.itens,
    p_forma_pagamento: input.formaPagamento,
    p_observacoes: input.observacoes || null,
  })
  if (error) throw error
  return data as string
}

export async function statusPedido(id: string): Promise<StatusResumo | null> {
  const { data, error } = await supabase.rpc('status_pedido', { p_id: id })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return (row as StatusResumo) || null
}

export async function cobrancaPix(
  pedidoId: string,
): Promise<{ pago?: boolean; qr_code?: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('mp-pix', {
      body: { pedido_id: pedidoId },
    })
    if (error) return null
    return data as { pago?: boolean; qr_code?: string }
  } catch {
    return null
  }
}

export async function fetchPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data || []) as Pedido[]
}

export async function atualizarStatus(id: string, status: StatusPedido) {
  const { error } = await supabase.from('pedidos').update({ status }).eq('id', id)
  if (error) throw error
}

export async function marcarPago(id: string) {
  const { error } = await supabase.from('pedidos').update({ pago: true }).eq('id', id)
  if (error) throw error
}

export function assinarPedidos(onChange: () => void) {
  const channel = supabase
    .channel('pedidos-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function fetchIngredientesAdmin(): Promise<Ingrediente[]> {
  const { data, error } = await supabase
    .from('ingredientes')
    .select('id, nome, disponivel, categoria')
    .order('nome')
  if (error) throw error
  return (data || []) as Ingrediente[]
}

export async function setIngredienteDisponivel(id: string, disponivel: boolean) {
  const { error } = await supabase.from('ingredientes').update({ disponivel }).eq('id', id)
  if (error) throw error
}

export async function addIngrediente(nome: string, categoria: CategoriaIngrediente) {
  const { error } = await supabase
    .from('ingredientes')
    .insert({ nome: nome.trim(), disponivel: true, categoria })
  if (error) throw error
}

export async function removeIngrediente(id: string) {
  const { error } = await supabase.from('ingredientes').delete().eq('id', id)
  if (error) throw error
}

export async function salvarConfig(patch: Partial<Config>) {
  const { error } = await supabase.from('config').update(patch).eq('id', 1)
  if (error) throw error
}
