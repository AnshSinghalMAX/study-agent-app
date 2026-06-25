'use client'

import { useState } from 'react'

type ConceptWithColor = {
  id: string
  subject: string
  concept: string
  mastery_level: string
  last_updated: string
  strong_areas: string[]
  weak_areas: string[]
  next_steps: string[]
  subjectColor: string
  masteryBadgeColor: string
  masteryScore: number
}

type Props = {
  concepts: ConceptWithColor[]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DashboardClient({ concepts }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (concepts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-6 py-12 text-center">
        <p className="text-slate-400">No concepts yet. Start learning in the Chat!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {concepts.map((concept) => (
        <button
          key={concept.id}
          onClick={() => setExpandedId(expandedId === concept.id ? null : concept.id)}
          className="text-left transition-all"
        >
          <div className={`rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20 hover:border-slate-700 hover:bg-slate-800/90 transition-all ${expandedId === concept.id ? 'ring-2 ring-sky-500' : ''}`}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <span className={`${concept.subjectColor} rounded-full px-3 py-1 text-xs font-semibold text-white`}>
                {concept.subject}
              </span>
              <span className={`${concept.masteryBadgeColor} rounded-full px-3 py-1 text-xs font-semibold`}>
                {concept.mastery_level || 'Not Set'}
              </span>
            </div>

            <h3 className="mb-3 text-lg font-bold text-white">{concept.concept}</h3>

            <div className="mb-4">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{Math.round((concept.masteryScore / 4) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-600 transition-all"
                  style={{ width: `${(concept.masteryScore / 4) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">Updated {formatDate(concept.last_updated)}</p>

            {expandedId === concept.id && (
              <div className="mt-6 space-y-4 border-t border-slate-700 pt-4">
                {concept.strong_areas && concept.strong_areas.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Strong Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {concept.strong_areas.map((area, idx) => (
                        <span key={idx} className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs text-emerald-300 border border-emerald-500/30">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {concept.weak_areas && concept.weak_areas.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Weak Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {concept.weak_areas.map((area, idx) => (
                        <span key={idx} className="rounded-full bg-rose-600/20 px-3 py-1 text-xs text-rose-300 border border-rose-500/30">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {concept.next_steps && concept.next_steps.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Next Steps</p>
                    <div className="flex flex-wrap gap-2">
                      {concept.next_steps.map((step, idx) => (
                        <span key={idx} className="rounded-full bg-sky-600/20 px-3 py-1 text-xs text-sky-300 border border-sky-500/30">
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
