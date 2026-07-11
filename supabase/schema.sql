-- PedeAí — schema inicial
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null unique,
  endereco text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  disponivel boolean not null default true,
  categoria text not null default 'acompanhamento' check (categoria in ('carne','acompanhamento')),
  created_at timestamptz not null default now()
);

create table public.config (
  id int primary key default 1 check (id = 1),
  preco_p numeric not null default 18,
  preco_m numeric not null default 22,
  preco_g numeric not null default 26,
  taxa_entrega numeric not null default 10,
  chave_pix text not null default 'pedeai@demo.com.br',
  nome_pix text not null default 'Restaurante PedeAi',
  cidade_pix text not null default 'Curitiba',
  aberto boolean not null default true
);
insert into public.config (id) values (1);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id),
  nome_cliente text not null,
  telefone text not null,
  tipo text not null check (tipo in ('entrega','retirada')),
  endereco text,
  itens jsonb not null,
  forma_pagamento text not null check (forma_pagamento in ('pix','dinheiro','cartao')),
  subtotal numeric not null,
  taxa_entrega numeric not null default 0,
  total numeric not null,
  status text not null default 'novo' check (status in ('novo','em_preparo','saiu_entrega','pronto_retirada','concluido','cancelado')),
  observacoes text,
  pago boolean not null default false,
  mp_payment_id text,
  pix_copia_cola text,
  created_at timestamptz not null default now()
);
create index pedidos_status_idx on public.pedidos (status);
create index pedidos_created_idx on public.pedidos (created_at desc);

-- RLS
alter table public.clientes enable row level security;
alter table public.ingredientes enable row level security;
alter table public.config enable row level security;
alter table public.pedidos enable row level security;

-- cardápio e config são públicos (sem PII)
create policy ingredientes_select_public on public.ingredientes for select using (true);
create policy config_select_public on public.config for select using (true);

-- atendente (autenticada) gerencia tudo
create policy clientes_all_auth on public.clientes for all to authenticated using (true) with check (true);
create policy pedidos_select_auth on public.pedidos for select to authenticated using (true);
create policy pedidos_update_auth on public.pedidos for update to authenticated using (true) with check (true);
create policy ingredientes_all_auth on public.ingredientes for all to authenticated using (true) with check (true);
create policy config_update_auth on public.config for update to authenticated using (true) with check (true);

-- cliente anônimo NÃO acessa tabelas direto: usa RPCs security definer
create or replace function public.criar_pedido(
  p_nome text,
  p_telefone text,
  p_endereco text,
  p_tipo text,
  p_itens jsonb,
  p_forma_pagamento text,
  p_observacoes text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_cliente_id uuid;
  v_config record;
  v_subtotal numeric := 0;
  v_taxa numeric := 0;
  v_item jsonb;
  v_preco numeric;
  v_id uuid;
begin
  if p_tipo not in ('entrega','retirada') then raise exception 'tipo inválido'; end if;
  if p_forma_pagamento not in ('pix','dinheiro','cartao') then raise exception 'pagamento inválido'; end if;
  if coalesce(trim(p_nome),'') = '' or coalesce(trim(p_telefone),'') = '' then raise exception 'nome e telefone obrigatórios'; end if;
  if p_tipo = 'entrega' and coalesce(trim(p_endereco),'') = '' then raise exception 'endereço obrigatório para entrega'; end if;
  if jsonb_array_length(p_itens) < 1 then raise exception 'pedido vazio'; end if;

  select * into v_config from config where id = 1;
  if not v_config.aberto then raise exception 'restaurante fechado'; end if;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_preco := case v_item->>'tamanho'
      when 'P' then v_config.preco_p
      when 'M' then v_config.preco_m
      when 'G' then v_config.preco_g
      else null end;
    if v_preco is null then raise exception 'tamanho inválido'; end if;
    v_subtotal := v_subtotal + v_preco * greatest(coalesce((v_item->>'qtd')::int, 1), 1);
  end loop;

  if p_tipo = 'entrega' then v_taxa := v_config.taxa_entrega; end if;

  insert into clientes (nome, telefone, endereco)
  values (trim(p_nome), trim(p_telefone), nullif(trim(p_endereco), ''))
  on conflict (telefone) do update
    set nome = excluded.nome,
        endereco = coalesce(excluded.endereco, clientes.endereco),
        updated_at = now()
  returning id into v_cliente_id;

  insert into pedidos (cliente_id, nome_cliente, telefone, tipo, endereco, itens, forma_pagamento, subtotal, taxa_entrega, total, observacoes)
  values (v_cliente_id, trim(p_nome), trim(p_telefone), p_tipo, nullif(trim(p_endereco),''), p_itens, p_forma_pagamento, v_subtotal, v_taxa, v_subtotal + v_taxa, nullif(trim(p_observacoes),''))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.status_pedido(p_id uuid)
returns table (status text, tipo text, forma_pagamento text, total numeric, created_at timestamptz, pago boolean, pix_copia_cola text)
language sql security definer set search_path = public stable
as $$
  select status, tipo, forma_pagamento, total, created_at, pago, pix_copia_cola from pedidos where id = p_id;
$$;

revoke all on function public.criar_pedido from public;
revoke all on function public.status_pedido from public;
grant execute on function public.criar_pedido to anon, authenticated;
grant execute on function public.status_pedido to anon, authenticated;

-- realtime para a atendente acompanhar pedidos novos
alter publication supabase_realtime add table public.pedidos;

-- seed do cardápio
insert into public.ingredientes (nome, disponivel, categoria) values
  ('Arroz branco', true, 'acompanhamento'),
  ('Arroz integral', true, 'acompanhamento'),
  ('Feijão carioca', true, 'acompanhamento'),
  ('Feijão preto', true, 'acompanhamento'),
  ('Frango à parmegiana', true, 'carne'),
  ('Carne de panela', true, 'carne'),
  ('Strogonoff de frango', false, 'carne'),
  ('Bisteca suína', false, 'carne'),
  ('Peixe frito', false, 'carne'),
  ('Macarrão ao alho e óleo', true, 'acompanhamento'),
  ('Farofa', true, 'acompanhamento'),
  ('Batata frita', true, 'acompanhamento'),
  ('Purê de batata', false, 'acompanhamento'),
  ('Ovo frito', true, 'acompanhamento'),
  ('Salada verde', true, 'acompanhamento'),
  ('Legumes refogados', true, 'acompanhamento'),
  ('Banana à milanesa', false, 'acompanhamento');
