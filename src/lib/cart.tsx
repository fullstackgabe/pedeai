import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { Config, ItemPedido } from '@/types'

type CartContextValue = {
  itens: ItemPedido[]
  addItem: (item: ItemPedido) => void
  removeItem: (index: number) => void
  clear: () => void
  subtotal: (config: Config) => number
}

const CartContext = createContext<CartContextValue>({
  itens: [],
  addItem: () => {},
  removeItem: () => {},
  clear: () => {},
  subtotal: () => 0,
})

export const useCart = () => useContext(CartContext)

export const precoTamanho = (config: Config, tamanho: ItemPedido['tamanho']) =>
  tamanho === 'P' ? Number(config.preco_p) : tamanho === 'M' ? Number(config.preco_m) : Number(config.preco_g)

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemPedido[]>([])

  const value = useMemo<CartContextValue>(
    () => ({
      itens,
      addItem: (item) => setItens((prev) => [...prev, item]),
      removeItem: (index) => setItens((prev) => prev.filter((_, i) => i !== index)),
      clear: () => setItens([]),
      subtotal: (config) =>
        itens.reduce((acc, it) => acc + precoTamanho(config, it.tamanho) * it.qtd, 0),
    }),
    [itens],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
