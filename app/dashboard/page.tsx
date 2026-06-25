import { createClient } from '@/lib/supabase'
import Navigation from '@/app/components/Navigation'
import DashboardClient from '@/app/components/DashboardClient'

type Concept = {
  id: string
  subject: string
  concept: string
  mastery_level: string
  overview_gist: string
  deep_dive_gist: string[]
  strong_areas: string[]
  weak_areas: string[]
  next_steps: string[]
  last_updated: string
}

const getSubjectColor = (subject: string): string => {
  const lowerSubject = subject.toLowerCase()
  if (lowerSubject.includes('physics')) return 'bg-blue-600'
  if (lowerSubject.includes('biology')) return 'bg-green-600'
  if (lowerSubject.includes('math')) return 'bg-purple-600'
  if (lowerSubject.includes('computer')) return 'bg-orange-600'
  if (lowerSubject.includes('chemistry')) return 'bg-red-600'
  return 'bg-slate-600'
}

const getMasteryScore = (level: string | null): number => {
  if (!level) return 0
  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'strong') return 4
  if (lowerLevel === 'proficient') return 3
  if (lowerLevel === 'developing') return 2
  if (lowerLevel === 'introduced') return 1
  return 0
}

const getMasteryBadgeColor = (level: string | null): string => {
  if (!level) return 'bg-slate-700 text-slate-300'
  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'strong') return 'bg-emerald-600 text-emerald-100'
  if (lowerLevel === 'proficient') return 'bg-sky-600 text-sky-100'
  if (lowerLevel === 'developing') return 'bg-amber-600 text-amber-100'
  if (lowerLevel === 'introduced') return 'bg-slate-600 text-slate-200'
  return 'bg-slate-700 text-slate-300'
}

export default async function Dashboard() {
  const supabase = createClient()

  const { data: concepts, error } = await supabase
    .from('concepts')
    .select('*')
    .order('last_updated', { ascending: false })

  if (error || !concepts) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-200">
            Failed to load dashboard data. Please try again.
          </div>
        </div>
      </div>
    )
  }

  const typedConcepts = concepts as Concept[]

  const totalConcepts = typedConcepts.length
  const uniqueSubjects = new Set(typedConcepts.map((c) => c.subject)).size
  const averageMasteryScore =
    totalConcepts > 0
      ? (typedConcepts.reduce((sum, c) => sum + getMasteryScore(c.mastery_level), 0) / totalConcepts / 4) * 100
      : 0

  const conceptsWithColor = typedConcepts.map((concept) => ({
    ...concept,
    subjectColor: getSubjectColor(concept.subject),
    masteryBadgeColor: getMasteryBadgeColor(concept.mastery_level),
    masteryScore: getMasteryScore(concept.mastery_level)
  }))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.1),_transparent_20%),#020617]">
      <Navigation />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">Learning dashboard</p>
              <h1 className="mt-4 text-4xl font-semibold text-white">Track progress, polish concepts</h1>
              <p className="mt-3 max-w-2xl text-slate-400">
                Your saved concepts update automatically when you capture a study session. Expand a card to review strengths, weaknesses, and next steps.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-5 py-4 text-slate-200 shadow-inner shadow-black/20">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Snapshot</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totalConcepts}</p>
              <p className="mt-1 text-sm text-slate-400">Saved concepts</p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/90 px-6 py-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Concepts</p>
            <p className="mt-3 text-3xl font-semibold text-white">{totalConcepts}</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/90 px-6 py-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Unique Subjects</p>
            <p className="mt-3 text-3xl font-semibold text-white">{uniqueSubjects}</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/90 px-6 py-6 shadow-lg shadow-slate-950/20">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Average Mastery</p>
            <p className="mt-3 text-3xl font-semibold text-white">{Math.round(averageMasteryScore)}%</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Saved concepts</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Review your learning cards</h2>
            </div>
            <p className="text-sm text-slate-500">Tap a card for details.</p>
          </div>
          <DashboardClient concepts={conceptsWithColor} />
        </div>
      </div>
    </div>
  )
}
