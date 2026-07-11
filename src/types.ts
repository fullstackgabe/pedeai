export type Tamanho = 'P' | 'M' | 'G'

export type CategoriaIngrediente = 'carne' | 'acompanhamento'

export type Ingrediente = {
  id: string
  nome: string
  disponivel: boolean
  categoria: CategoriaIngrediente
}

export type Config = {
  preco_p: number
  preco_m: number
  preco_g: number
  taxa_entrega: number
  chave_pix: string
  nome_pix: string
  cidade_pix: string
  endereco_retirada: string
  aberto: boolean
}

export type ItemPedido = {
  tamanho: Tamanho
  ingredientes: string[]
  qtd: number
}

export type TipoPedido = 'entrega' | 'retirada'
export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao'

export type StatusPedido =
  | 'novo'
  | 'confirmado'
  | 'em_preparo'
  | 'saiu_entrega'
  | 'pronto_retirada'
  | 'concluido'
  | 'cancelado'

export type Pedido = {
  id: string
  cliente_id: string | null
  nome_cliente: string
  telefone: string
  tipo: TipoPedido
  endereco: string | null
  itens: ItemPedido[]
  forma_pagamento: FormaPagamento
  subtotal: number
  taxa_entrega: number
  total: number
  status: StatusPedido
  observacoes: string | null
  created_at: string
  pago: boolean
  mp_payment_id: string | null
  pix_copia_cola: string | null
}

export type StatusResumo = {
  status: StatusPedido
  tipo: TipoPedido
  forma_pagamento: FormaPagamento
  total: number
  created_at: string
  pago: boolean
  pix_copia_cola: string | null
  itens: ItemPedido[]
}
