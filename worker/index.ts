interface Env {
  EMAIL: SendEmail
  CONTACT_TO: string
  ALLOWED_ORIGINS?: string
}

interface ContactPayload {
  name?: string
  email?: string
  quest?: string
  website?: string
}

const RATE_LIMIT = new Map<string, number>()
const RATE_WINDOW_MS = 60_000

function corsHeaders(origin: string | null, allowed: string[]): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function getAllowedOrigins(env: Env): string[] {
  const defaults = [
    'https://herooflegend.com',
    'https://www.herooflegend.com',
    'http://localhost:8787',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
  if (env.ALLOWED_ORIGINS) {
    return [...defaults, ...env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())]
  }
  return defaults
}

function validatePayload(body: ContactPayload): string | null {
  if (body.website) return 'Invalid submission.'

  const name = body.name?.trim()
  const email = body.email?.trim()
  const quest = body.quest?.trim()

  if (!name || name.length < 2 || name.length > 100) {
    return 'Adventurer name is required (2–100 characters).'
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return 'A valid return path (email) is required.'
  }
  if (!quest || quest.length < 10 || quest.length > 2000) {
    return 'Tell us about your quest (10–2000 characters).'
  }
  return null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function handleContact(
  request: Request,
  env: Env,
  origin: string | null,
): Promise<Response> {
  const allowed = getAllowedOrigins(env)
  const cors = corsHeaders(origin, allowed)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })
  }

  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown'
  const now = Date.now()
  const lastRequest = RATE_LIMIT.get(clientIp)
  if (lastRequest && now - lastRequest < RATE_WINDOW_MS) {
    return Response.json(
      { error: 'Too many quests. Rest a moment and try again.' },
      { status: 429, headers: cors },
    )
  }
  RATE_LIMIT.set(clientIp, now)

  let body: ContactPayload
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400, headers: cors })
  }

  const validationError = validatePayload(body)
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400, headers: cors })
  }

  const name = body.name!.trim()
  const email = body.email!.trim()
  const quest = body.quest!.trim()

  try {
    await env.EMAIL.send({
      to: env.CONTACT_TO,
      from: { email: 'noreply@herooflegend.com', name: 'Hero of Legend' },
      replyTo: email,
      subject: `New quest from ${name}`,
      text: `Adventurer: ${name}\nReturn Path: ${email}\n\nQuest:\n${quest}`,
      html: `
        <h2>New Quest Logged</h2>
        <p><strong>Adventurer:</strong> ${escapeHtml(name)}</p>
        <p><strong>Return Path:</strong> ${escapeHtml(email)}</p>
        <hr>
        <p><strong>What quest are they on?</strong></p>
        <p>${escapeHtml(quest).replace(/\n/g, '<br>')}</p>
      `,
    })
  } catch (err) {
    console.error('Email send failed:', err)
    return Response.json(
      { error: 'The hero could not receive your quest. Try again later.' },
      { status: 500, headers: cors },
    )
  }

  return Response.json({ success: true }, { status: 200, headers: cors })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    if (url.pathname === '/api/contact') {
      return handleContact(request, env, origin)
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>