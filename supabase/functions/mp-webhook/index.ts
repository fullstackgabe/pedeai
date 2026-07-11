import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id')
    let topic = url.searchParams.get('type') || url.searchParams.get('topic')

    if (!paymentId) {
      const body = await req.json().catch(() => null)
      paymentId = body?.data?.id ? String(body.data.id) : null
      topic = topic || body?.type || null
    }

    if (!paymentId || (topic && topic !== 'payment')) {
      return new Response('ok', { status: 200 })
    }

    const token = Deno.env.get('MP_ACCESS_TOKEN')
    if (!token) return new Response('ok', { status: 200 })

    const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return new Response('ok', { status: 200 })
    const pay = await r.json()

    if (pay.status === 'approved') {
      if (pay.external_reference) {
        await supabase.from('pedidos').update({ pago: true }).eq('id', pay.external_reference)
      } else {
        await supabase.from('pedidos').update({ pago: true }).eq('mp_payment_id', String(pay.id))
      }
    }

    return new Response('ok', { status: 200 })
  } catch {
    return new Response('ok', { status: 200 })
  }
})
