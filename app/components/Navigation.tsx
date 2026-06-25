import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="border-b border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-2xl font-semibold text-white transition hover:text-sky-300"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20">
              S
            </span>
            Study Agent
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-slate-800/70 bg-slate-900/80 px-4 py-2 text-slate-200 transition hover:border-sky-500 hover:bg-slate-800 hover:text-white"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-800/70 bg-slate-900/80 px-4 py-2 text-slate-200 transition hover:border-sky-500 hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
