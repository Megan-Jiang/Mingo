import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STEPFUN_API_KEY = Deno.env.get('STEPFUN_API_KEY')!
const BASE_URL = Deno.env.get('STEPFUN_BASE_URL') || 'https://api.stepfun.com/v1'
const WHISPER_MODEL = Deno.env.get('STEPFUN_WHISPER_MODEL') || 'step-asr'

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

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  const transcriptionData = new FormData()
  transcriptionData.append('model', WHISPER_MODEL)
  transcriptionData.append('response_format', 'json')
  transcriptionData.append('file', file)

  const response = await fetch(`${BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STEPFUN_API_KEY}`
    },
    body: transcriptionData
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
})
