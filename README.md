# 🍱 PedeAí

App de pedidos de marmita para um restaurante em Curitiba. O cliente monta a marmita com os ingredientes do dia, escolhe entrega ou retirada e paga por Pix direto no app — sem precisar criar conta. A equipe do restaurante gerencia tudo em uma área restrita.

**React Native (Expo) · TypeScript · Supabase**

## Como funciona

### Cliente (sem login)
- Vê o **cardápio do dia** publicado pelo restaurante
- Monta a marmita: tamanho **P, M ou G** (cada um com limite de ingredientes) e quantos itens quiser na sacola
- Informa **nome, telefone e endereço** — salvos no aparelho para o próximo pedido
- Escolhe **entrega** (taxa fixa de R$ 10 para Curitiba e região) ou **retirada no balcão**
- Paga com **Pix no app** (QR Code + copia e cola gerados na hora), dinheiro ou cartão na entrega
- Acompanha o **status do pedido em tempo real**: recebido → em preparo → saiu para entrega / pronto para retirada → concluído

### Atendente (área restrita)
- Recebe os **pedidos em tempo real** (Supabase Realtime), com endereço destacado para repassar ao motoboy
- Avança o status de cada pedido e chama o cliente direto no WhatsApp
- Atualiza o **cardápio do dia** com um toque (liga/desliga ingredientes, adiciona novos)
- Ajusta preços, taxa de entrega, chave Pix e **abre/fecha o restaurante**

**Acesso demo:** `demo@demo.com` · `demo1234` (cadeado 🔒 no topo da tela inicial)

## Stack

- **Expo SDK 51** + **expo-router** (iOS, Android e Web com o mesmo código)
- **TypeScript** estrito
- **Supabase**: Postgres + RLS, Auth (equipe), Realtime (pedidos) e RPCs `security definer` — o cliente anônimo não tem acesso direto às tabelas com dados pessoais
- **Pix**: payload BR Code (EMV) com CRC16 gerado no app, exibido em QR Code

## Banco de dados

| Tabela | Papel |
|---|---|
| `clientes` | nome, telefone (único) e endereço — atualizado a cada pedido |
| `pedidos` | itens (jsonb), tipo, pagamento, valores e status |
| `ingredientes` | cardápio, com flag `disponivel` controlada pela equipe |
| `config` | preços P/M/G, taxa de entrega, chave Pix, aberto/fechado |

Pedidos são criados pela função `criar_pedido(...)` (security definer), que valida os dados, calcula o total no servidor e faz o upsert do cliente pelo telefone.

## Rodando local

```bash
npm install
cp .env.example .env   # preencha com seu projeto Supabase
npm run web
```

Configure um projeto Supabase com as tabelas acima, as RPCs `security definer` e um usuário para a equipe em Authentication.
