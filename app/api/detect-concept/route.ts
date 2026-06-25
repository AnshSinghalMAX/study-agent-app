import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

type RequestBody = {
  userMessage: string
}

const SYSTEM_PROMPT = `Extract the subject and concept from the user's message.
Respond with only a JSON object with exactly two fields: subject and concept.
If the message is not about studying a concept, return {"subject": "", "concept": ""}.
Do not include any explanation, markdown, or extra text.`

export async function POST(request: NextRequest) {
  let body: RequestBody

  try {
    body = await request.json()
  } catch (_error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : ''

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  const anthropic = createAnthropic()

  const result = await generateText({
    model: anthropic.chat('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  })

  const rawText = await result.text
  let parsed: { subject: string; concept: string } = { subject: '', concept: '' }

  try {
    const json = JSON.parse(rawText.trim())

    if (typeof json === 'object' && json !== null) {
      parsed.subject = typeof json.subject === 'string' ? json.subject : ''
      parsed.concept = typeof json.concept === 'string' ? json.concept : ''
    }
  } catch (_error) {
    parsed = { subject: '', concept: '' }
  }

  return NextResponse.json(parsed)
}
