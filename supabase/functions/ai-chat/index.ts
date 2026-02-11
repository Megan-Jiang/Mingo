import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STEPFUN_API_KEY = Deno.env.get('STEPFUN_API_KEY')!
const BASE_URL = Deno.env.get('STEPFUN_BASE_URL') || 'https://api.stepfun.com/v1'

serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }

  const { messages, temperature = 0.3 } = await req.json()

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STEPFUN_API_KEY}`
    },
    body: JSON.stringify({
      model: 'step-1-8k',
      messages,
      temperature
    })
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})
