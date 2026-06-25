"use client"

import { useEffect, useRef, useState } from 'react'
import Navigation from '@/app/components/Navigation'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  subject?: string
  concept?: string
  status: 'pending' | 'done' | 'error'
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
}

type SavePayload = {
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

const parseArrayBlock = (text: string, label: string) => {
  const regex = new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=\\n(?:[A-Za-z ]+[:\\s]|$))`, 'i')
  const match = text.match(regex)

  if (!match || !match[1]) {
    return []
  }

  return match[1]
    .split(/\\r?\\n/)
    .map((line) => line.replace(/^[-*•\\s]*/g, '').trim())
    .filter(Boolean)
}

const parseTextBlock = (text: string, label: string) => {
  const regex = new RegExp(`${label}[:\\s]*([\\s\\S]*?)(?=\\n(?:[A-Za-z ]+[:\\s]|$))`, 'i')
  const match = text.match(regex)
  return match?.[1]?.trim() ?? ''
}

const extractSavePayload = (subject: string, concept: string, text: string): SavePayload => {
  const masteryLevel = parseTextBlock(text, 'mastery level') || 'Introduced'
  const overviewGist = parseTextBlock(text, 'overview gist') || parseTextBlock(text, 'overview') || text.slice(0, 220).trim()
  const deepDiveGist = parseArrayBlock(text, 'deep dive gist')
  const strongAreas = parseArrayBlock(text, 'strong areas')
  const weakAreas = parseArrayBlock(text, 'weak areas')
  const nextSteps = parseArrayBlock(text, 'next steps')
  const notes = parseTextBlock(text, 'notes') || text.trim()

  return {
    subject,
    concept,
    masteryLevel,
    overviewGist,
    deepDiveGist,
    strongAreas,
    weakAreas,
    nextSteps,
    notes
  }
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const appendMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message])
  }

  const updateMessage = (id: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((current) => current.map((message) => (message.id === id ? updater(message) : message)))
  }

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const userMessage = input.trim()
    if (!userMessage || isSending) return

    setInput('')
    setIsSending(true)

    const userEntry: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userMessage,
      status: 'done'
    }

    appendMessage(userEntry)

    const assistantId = `assistant-${Date.now()}`
    appendMessage({
      id: assistantId,
      role: 'assistant',
      text: '',
      status: 'pending',
      saveStatus: 'idle'
    })

    try {
      const detectResponse = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage })
      })

      if (!detectResponse.ok) {
        const errorText = await detectResponse.text().catch(() => '')
        setErrorMessage(
          errorText
            ? `Concept detection failed: ${errorText}`
            : 'Failed to detect concept. Please try again.'
        )
        updateMessage(assistantId, (message) => ({
          ...message,
          text: 'Concept detection failed. Please try again.',
          status: 'error'
        }))
        return
      }

      const detectData = await detectResponse.json()
      const subject = typeof detectData.subject === 'string' ? detectData.subject.trim() : ''
      const concept = typeof detectData.concept === 'string' ? detectData.concept.trim() : ''

      updateMessage(assistantId, (message) => ({ ...message, subject, concept }))

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, subject, concept })
      })

      if (!chatResponse.ok || !chatResponse.body) {
        const errorText = await chatResponse.text().catch(() => '')
        updateMessage(assistantId, (message) => ({
          ...message,
          text: 'Sorry, something went wrong while fetching the response.',
          status: 'error'
        }))
        setErrorMessage(
          errorText
            ? `Chat response failed: ${errorText}`
            : 'Failed to load chat response. Please try again.'
        )
        return
      }

      const reader = chatResponse.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        updateMessage(assistantId, (message) => ({ ...message, text: assistantText }))
      }

      updateMessage(assistantId, (message) => ({ ...message, text: assistantText, status: 'done' }))
    } catch (error) {
      console.error('Send error:', error)
      updateMessage(assistantId, (message) => ({
        ...message,
        text: 'Failed to send your message. Please try again.',
        status: 'error'
      }))
      setErrorMessage('Failed to send your message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveConcept = async (message: ChatMessage) => {
    if (!message.subject || !message.concept) return

    updateMessage(message.id, (current) => ({ ...current, saveStatus: 'saving' }))

    const payload = extractSavePayload(message.subject, message.concept, message.text)

    const response = await fetch('/api/save-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      updateMessage(message.id, (current) => ({ ...current, saveStatus: 'saved' }))
    } else {
      updateMessage(message.id, (current) => ({ ...current, saveStatus: 'error' }))
      setErrorMessage('Failed to save progress. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.12),_transparent_20%),#020617] text-slate-100">
      <Navigation />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative mb-6 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/30">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/20 to-transparent blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-sky-300/80">Study Agent</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Guided learning chat</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Ask a question, detect the subject and concept, then stream a teaching response. Save structured progress to your learning concepts.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/70 px-5 py-4 text-slate-200 shadow-inner shadow-black/20 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Single-user demo</p>
              <p className="mt-1 text-sm text-slate-300">No auth. Simple concept tracking.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-5 py-4 text-sm text-slate-300 shadow-lg shadow-slate-950/20">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Fast detection</p>
              <p className="mt-2 font-semibold text-white">Subject & concept extraction</p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-5 py-4 text-sm text-slate-300 shadow-lg shadow-slate-950/20">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Structured guidance</p>
              <p className="mt-2 font-semibold text-white">Overview, strengths, weakness, next steps</p>
            </div>
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-5 py-4 text-sm text-slate-300 shadow-lg shadow-slate-950/20">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300/80">Learning flow</p>
              <p className="mt-2 font-semibold text-white">Ask, review, save, repeat</p>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden rounded-[2rem] border border-slate-800/80 bg-slate-900/95 shadow-2xl shadow-slate-950/30">
          <div className="flex min-h-[calc(100vh-240px)] flex-col overflow-hidden px-4 py-4 sm:px-6">
            <div className="mb-4 flex flex-col gap-4 rounded-[1.75rem] border border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-200">Chat history</p>
                <p className="mt-1 text-xs text-slate-500">Messages are streamed live and can be saved as concept progress.</p>
              </div>
              <span className="rounded-full border border-slate-800/70 bg-slate-900/80 px-3 py-1 text-xs text-slate-400">
                {messages.length} message{messages.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 pb-4" ref={messagesEndRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[92%] rounded-[2rem] border px-5 py-4 shadow-sm ${message.role === 'user' ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-slate-100 border-sky-600/70' : 'bg-slate-800/95 text-slate-100 border-slate-700/80'}`}>
                      {message.role === 'assistant' && (
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="rounded-full bg-slate-700/90 px-2 py-1 text-slate-300">Assistant</span>
                          {message.subject && message.concept ? (
                            <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-slate-300">
                              {message.subject} · {message.concept}
                            </span>
                          ) : (
                            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-rose-300">
                              Concept not detected
                            </span>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.text || (message.status === 'pending' ? 'Streaming response…' : '')}</p>

                      {message.role === 'assistant' && message.status === 'pending' && (
                        <div className="mt-3 rounded-3xl bg-slate-800/80 px-3 py-2 text-xs text-slate-400">Loading...</div>
                      )}

                      {message.role === 'assistant' && message.status === 'error' && (
                        <div className="mt-3 rounded-3xl bg-rose-500/10 px-3 py-2 text-xs text-rose-200">Response failed.</div>
                      )}

                      {message.role === 'assistant' && message.subject && message.concept && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveConcept(message)}
                            disabled={message.saveStatus === 'saving' || message.saveStatus === 'saved'}
                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
                          >
                            {message.saveStatus === 'saving'
                              ? 'Saving…'
                              : message.saveStatus === 'saved'
                              ? 'Saved'
                              : 'Save progress'}
                          </button>
                          {message.saveStatus === 'saved' && <span className="text-xs text-sky-300">Progress saved.</span>}
                          {message.saveStatus === 'error' && <span className="text-xs text-rose-300">Save failed.</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSend} className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row">
              <label htmlFor="message" className="sr-only">Type your message</label>
              <input
                id="message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask something like, 'Help me understand calculus limits'"
                className="min-h-[56px] flex-1 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="inline-flex h-14 items-center justify-center rounded-3xl bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                Send
              </button>
            </form>

            {errorMessage && <div className="mt-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}
          </div>
        </section>
      </div>
    </div>
  )
}
