import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

type RequestBody = {
  subject: string
  concept: string
  masteryLevel: string
  overviewGist: string
  deepDiveGist: string[]
  strongAreas: string[]
  weakAreas: string[]
  nextSteps: string[]
  notes: string
}

export async function POST(request: NextRequest) {
  let body: RequestBody

  try {
    body = await request.json()
  } catch (_error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    subject,
    concept,
    masteryLevel,
    overviewGist,
    deepDiveGist,
    strongAreas,
    weakAreas,
    nextSteps,
    notes
  } = body

  if (typeof subject !== 'string' || !subject.trim()) {
    return NextResponse.json({ error: 'subject is required' }, { status: 400 })
  }
  if (typeof concept !== 'string' || !concept.trim()) {
    return NextResponse.json({ error: 'concept is required' }, { status: 400 })
  }
  if (typeof masteryLevel !== 'string') {
    return NextResponse.json({ error: 'masteryLevel must be a string' }, { status: 400 })
  }
  if (typeof overviewGist !== 'string') {
    return NextResponse.json({ error: 'overviewGist must be a string' }, { status: 400 })
  }
  if (!Array.isArray(deepDiveGist) || !deepDiveGist.every((item) => typeof item === 'string')) {
    return NextResponse.json({ error: 'deepDiveGist must be an array of strings' }, { status: 400 })
  }
  if (!Array.isArray(strongAreas) || !strongAreas.every((item) => typeof item === 'string')) {
    return NextResponse.json({ error: 'strongAreas must be an array of strings' }, { status: 400 })
  }
  if (!Array.isArray(weakAreas) || !weakAreas.every((item) => typeof item === 'string')) {
    return NextResponse.json({ error: 'weakAreas must be an array of strings' }, { status: 400 })
  }
  if (!Array.isArray(nextSteps) || !nextSteps.every((item) => typeof item === 'string')) {
    return NextResponse.json({ error: 'nextSteps must be an array of strings' }, { status: 400 })
  }
  if (typeof notes !== 'string') {
    return NextResponse.json({ error: 'notes must be a string' }, { status: 400 })
  }

  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('concepts')
      .upsert(
        {
          subject: subject.trim(),
          concept: concept.trim(),
          mastery_level: masteryLevel,
          overview_gist: overviewGist,
          deep_dive_gist: deepDiveGist,
          strong_areas: strongAreas,
          weak_areas: weakAreas,
          next_steps: nextSteps,
          notes,
          last_updated: now
        },
        { onConflict: ['subject', 'concept'] }
      )

    if (error) {
      return NextResponse.json({ error: 'Failed to save concept', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save concept API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to save concept',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
