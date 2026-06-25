import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

type ConceptRow = {
  mastery_level: string | null
  weak_areas: string | null
  strong_areas: string | null
}

type RequestBody = {
  userMessage: string
  subject?: string
  concept?: string
}

function buildSystemPrompt(row: ConceptRow | null, subject: string, concept: string) {
  const subjectContext = subject && concept ? `Subject: ${subject}. Concept: ${concept}.` : 'No subject or concept context was provided.'

  if (!row) {
    return [`You are a helpful tutor teaching a learner from first principles.`,
      `Use Mode A: beginner friendly, analogy-first, and define all terms as you introduce them.`,
      `Keep the explanation concrete, gentle, and easy to follow.`,
      subjectContext,
      `If the learner asks for examples, provide simple, clear analogies.`
    ].join(' ')
  }

  const contextParts: string[] = []
  if (row.weak_areas) {
    contextParts.push(`Weak areas: ${row.weak_areas}.`)
  }
  if (row.strong_areas) {
    contextParts.push(`Strong areas: ${row.strong_areas}.`)
  }

  const sharedContext = [`Provide guidance for the learner with these details:`, subjectContext, ...contextParts].join(' ')

  const masteryLevel = row.mastery_level?.toLowerCase() ?? ''

  if (masteryLevel === 'introduced' || masteryLevel === 'developing') {
    return [`You are a thoughtful tutor who references prior knowledge, mentions weak areas, and moves at a moderate pace.`,
      `Use Mode B: reference what the learner may already know, call out weak areas gently, and avoid rushing.`,
      sharedContext,
      `Balance support with challenge, and reinforce key ideas as you teach.`
    ].join(' ')
  }

  if (masteryLevel === 'proficient' || masteryLevel === 'strong') {
    return [`You are an advanced instructor focusing on nuance and deeper understanding.`,
      `Use Mode C: be technical, skip basic definitions, and concentrate on subtle distinctions and advanced insights.`,
      sharedContext,
      `Assume the learner already understands the fundamentals and focus on what makes this topic interesting or tricky.`
    ].join(' ')
  }

  return [`You are a tutor with a flexible style.`,
    `When mastery is unclear, default to Mode A: beginner friendly, analogy-first, and define terms clearly.`,
    sharedContext
  ].join(' ')
}

export async function POST(request: NextRequest) {
  let body: RequestBody

  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const userMessage = typeof body.userMessage === 'string' ? body.userMessage : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const concept = typeof body.concept === 'string' ? body.concept.trim() : ''

  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  let row: ConceptRow | null = null

  try {
    if (subject && concept) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('concepts')
        .select('mastery_level, weak_areas, strong_areas')
        .eq('subject', subject)
        .eq('concept', concept)
        .maybeSingle()

      if (error) {
        return NextResponse.json(
          { error: 'Supabase query failed', details: error.message },
          { status: 500 }
        )
      }

      row = data ?? null
    }

    const systemPrompt = buildSystemPrompt(row, subject, concept)
    const anthropic = createAnthropic()

    const textStreamResult = await streamText({
      model: anthropic.chat('claude-sonnet-4-5'),
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })

    if (!textStreamResult?.textStream) {
      throw new Error('No text stream returned from AI provider')
    }

    return new Response(textStreamResult.textStream, {
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
