import { useEffect, useRef, useState, type FormEvent } from 'react'
import { LoaderCircle, RotateCcw, Send, Sparkles } from 'lucide-react'
import { askStatementAssistant, type StatementChatTurn } from '../api'

export default function StatementChat() {
  const [messages, setMessages] = useState<StatementChatTurn[]>([
    { role: 'assistant', content: 'Hi! I can help make sense of the transactions in your statements.' },
  ])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chatScrollRef.current
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending) return

    const history = messages.slice(-8)
    setMessages((current) => [...current, { role: 'user', content: message }])
    setDraft('')
    setChatError(null)
    setSending(true)
    try {
      const reply = await askStatementAssistant(message, history)
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (error) {
      setChatError((error as Error).message)
    } finally {
      setSending(false)
    }
  }

  function resetChat() {
    setMessages([
      { role: 'assistant', content: 'Hi! I can help make sense of the transactions in your statements.' },
    ])
    setDraft('')
    setChatError(null)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f] text-white">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <h2 className="font-semibold text-gray-800">Statement assistant</h2>
        </div>
        <button
          type="button"
          onClick={resetChat}
          disabled={sending}
          title="Start a new chat"
          aria-label="Start a new chat"
          className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={chatScrollRef}
        aria-live="polite"
        className="min-h-44 max-h-80 space-y-3 overflow-y-auto bg-gray-50/70 p-4"
      >
        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-6 ${
                message.role === 'user'
                  ? 'bg-[#1e3a5f] text-white'
                  : 'border border-gray-200 bg-white text-gray-700'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            <span>Thinking...</span>
          </div>
        )}
        {chatError && <p className="text-sm text-red-600" role="alert">{chatError}</p>}
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {['Summarize my latest transactions', 'What did I spend most on?', 'Show my largest transaction'].map(
            (question) => (
              <button
                key={question}
                type="button"
                onClick={() => setDraft(question)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
              >
                {question}
              </button>
            ),
          )}
        </div>
      )}

      <form onSubmit={sendMessage} className="flex items-end gap-3 border-t border-gray-100 p-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          rows={2}
          maxLength={800}
          placeholder="Ask about your transactions..."
          aria-label="Message the statement assistant"
          className="min-h-11 flex-1 resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          title="Send message"
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#1e3a5f] text-white transition hover:bg-[#294b75] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </section>
  )
}