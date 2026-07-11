import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { pedido_id, confirmar } = await req.json()
    if (!pedido_id) return json({ error: 'pedido_id obrigatório' }, 400)

    const token = Deno.env.get('MP_ACCESS_TOKEN')
    if (!token) return json({ error: 'pagamento não configurado' }, 501)

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido_id)
      .single()
    if (error || !pedido) return json({ error: 'pedido não encontrado' }, 404)
    if (pedido.forma_pagamento !== 'pix') return json({ error: 'pedido não é pix' }, 400)
    if (pedido.pago) return json({ pago: true, qr_code: pedido.pix_copia_cola })

    if (confirmar && token.startsWith('TEST-')) {
      await supabase.from('pedidos').update({ pago: true }).eq('id', pedido_id)
      return json({ pago: true, qr_code: pedido.pix_copia_cola })
    }

    if (pedido.mp_payment_id) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${pedido.mp_payment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const pay = await r.json()
      if (r.ok && pay.status === 'approved') {
        await supabase.from('pedidos').update({ pago: true }).eq('id', pedido_id)
        return json({ pago: true, qr_code: pedido.pix_copia_cola })
      }
      return json({ pago: false, qr_code: pedido.pix_copia_cola })
    }

    const resp = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': pedido_id,
      },
      body: JSON.stringify({
        transaction_amount: Number(pedido.total),
        description: `PedeAí — pedido de ${pedido.nome_cliente}`,
        payment_method_id: 'pix',
        external_reference: pedido_id,
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`,
        payer: {
          email: `cliente${String(pedido.telefone).replace(/\D/g, '')}@example.com`,
          first_name: String(pedido.nome_cliente).split(' ')[0],
        },
      }),
    })
    const pay = await resp.json()
    if (!resp.ok) {
      console.error('MP error', resp.status, JSON.stringify(pay))
      return json({ error: pay?.message || 'erro ao criar cobrança' }, 502)
    }

    const qr = pay.point_of_interaction?.transaction_data?.qr_code || null
    await supabase
      .from('pedidos')
      .update({ mp_payment_id: String(pay.id), pix_copia_cola: qr })
      .eq('id', pedido_id)

    return json({ pago: false, qr_code: qr, payment_id: pay.id })
  } catch (e) {
    console.error(e)
    return json({ error: 'erro interno' }, 500)
  }
})
