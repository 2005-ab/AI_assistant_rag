
import { useRef, useState } from 'react'
import {
  BookOpen, Bot, CheckCircle2, ChevronDown, ChevronUp,
  FileText, FileUp, LoaderCircle, MessageSquare,
  Plus, Send, ShieldCheck, Sparkles, Trash2, User, X
} from 'lucide-react'
import './App.css'

const API = '/api'

const starterQuestions = [
  'Summarize the main points of my document.',
  'What are the key technologies mentioned?',
  'What are the main findings or conclusions?',
]

export default function App() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [messages, setMessages] = useState([])
  const [expandedSources, setExpandedSources] = useState({})
  const fileInput = useRef(null)
  const bottomRef = useRef(null)

  async function uploadPdf(event) {
    event.preventDefault()
    if (!file || uploading) return

    setUploading(true)
    setUploadStatus('')
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API}/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed.')
      }

      setUploadStatus(
        data.message || `${file.name} uploaded successfully.`
      )
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
    } catch (error) {
      setUploadError(
        `${error.message} Check that Spring Boot is running and the upload endpoint matches your backend.`
      )
    } finally {
      setUploading(false)
    }
  }

  async function askQuestion(text = question) {
    const prompt = text.trim()
    if (!prompt || asking) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
    }

    setMessages(previous => [...previous, userMessage])
    setQuestion('')
    setAsking(true)

    try {
      const response = await fetch(`${API}/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed.')
      }

      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer || 'No answer was returned.',
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ])
    } catch (error) {
      setMessages(previous => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I couldn't reach the RAG service. ${error.message}`,
          sources: [],
          error: true,
        },
      ])
    } finally {
      setAsking(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      }), 50)
    }
  }

  function newChat() {
    if (asking) return
    setMessages([])
    setExpandedSources({})
  }

  function toggleSource(messageId, sourceIndex) {
    const key = `${messageId}-${sourceIndex}`
    setExpandedSources(previous => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={event => event.preventDefault()}>
          <div className="brand-mark"><Sparkles size={21} /></div>
          <div>
            <div className="brand-name">Atlas RAG</div>
            <div className="brand-subtitle">Research workspace</div>
          </div>
        </a>

        <button className="new-chat-button" onClick={newChat} disabled={asking}>
          <Plus size={18} /> New conversation
        </button>

        <div className="sidebar-label">WORKSPACE</div>
        <div className="nav-item active">
          <MessageSquare size={17} /> Document chat
        </div>
        <div className="nav-item">
          <BookOpen size={17} /> Knowledge base
          <span className="nav-soon">PDF</span>
        </div>

        <div className="sidebar-spacer" />

        <div className="privacy-card">
          <ShieldCheck size={19} />
          <div>
            <strong>Your documents</strong>
            <p>Answers are generated from retrieved document context.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="avatar-small">AI</div>
          <div>
            <strong>Research Assistant</strong>
            <span>Local development</span>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-title">
            <div className="mobile-mark"><Sparkles size={18} /></div>
            <div>
              <strong>Document chat</strong>
              <span>Ask questions across your PDFs</span>
            </div>
          </div>
          <div className="connection-status">
            <span className="status-dot" /> API workspace
          </div>
        </header>

        <section className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon"><Sparkles size={26} /></div>
              <div className="eyebrow">YOUR DOCUMENTS, UNDERSTOOD</div>
              <h1>Research, without<br />the endless scrolling.</h1>
              <p className="welcome-description">
                Upload a PDF, ask a question, and explore answers with
                source references back to your documents.
              </p>

              <form className="upload-card" onSubmit={uploadPdf}>
                <div className="upload-card-heading">
                  <div className="upload-icon"><FileUp size={20} /></div>
                  <div>
                    <strong>Add a PDF to your workspace</strong>
                    <p>PDF documents · Max 15 MB</p>
                  </div>
                </div>

                <input
                  ref={fileInput}
                  className="file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={event => {
                    setFile(event.target.files?.[0] || null)
                    setUploadStatus('')
                    setUploadError('')
                  }}
                />

                <button
                  type="button"
                  className="file-picker"
                  onClick={() => fileInput.current?.click()}
                >
                  <FileText size={18} />
                  <span>{file ? file.name : 'Choose a PDF file'}</span>
                  {file && (
                    <X
                      size={16}
                      onClick={event => {
                        event.stopPropagation()
                        setFile(null)
                        if (fileInput.current) fileInput.current.value = ''
                      }}
                    />
                  )}
                </button>

                {file && (
                  <div className="file-size">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}

                <button
                  className="primary-button upload-button"
                  type="submit"
                  disabled={!file || uploading || file.size > 15 * 1024 * 1024}
                >
                  {uploading
                    ? <><LoaderCircle className="spin" size={17} /> Uploading…</>
                    : <><FileUp size={17} /> Upload document</>}
                </button>

                {file && file.size > 15 * 1024 * 1024 && (
                  <p className="error-text">The file exceeds the 15 MB limit.</p>
                )}
                {uploadStatus && (
                  <p className="success-text"><CheckCircle2 size={15} /> {uploadStatus}</p>
                )}
                {uploadError && <p className="error-text">{uploadError}</p>}

                <p className="upload-note">
                  Uploading stores the PDF through your existing backend.
                  Indexing may be a separate step.
                </p>
              </form>

              <div className="suggestions-heading">TRY ASKING</div>
              <div className="suggestions">
                {starterQuestions.map((item, index) => (
                  <button
                    key={item}
                    className="suggestion"
                    onClick={() => askQuestion(item)}
                    disabled={asking}
                  >
                    <span>{item}</span>
                    <Send size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="conversation">
              <div className="conversation-heading">
                <div>
                  <div className="eyebrow">CONVERSATION</div>
                  <h2>Your research session</h2>
                </div>
                <button className="clear-button" onClick={newChat} disabled={asking}>
                  <Trash2 size={15} /> Clear chat
                </button>
              </div>

              {messages.map(message => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className={`message-avatar ${message.role}`}>
                    {message.role === 'user'
                      ? <User size={18} />
                      : <Bot size={18} />}
                  </div>
                  <div className="message-body">
                    <div className="message-author">
                      {message.role === 'user' ? 'You' : 'Research Assistant'}
                    </div>
                    <div className={`message-text ${message.error ? 'error-text' : ''}`}>
                      {message.content}
                    </div>

                    {message.role === 'assistant' && message.sources?.length > 0 && (
                      <div className="sources-section">
                        <div className="sources-heading">
                          <BookOpen size={15} />
                          Sources
                          <span className="source-count">{message.sources.length}</span>
                        </div>

                        {message.sources.map((source, index) => {
                          const key = `${message.id}-${index}`
                          const expanded = !!expandedSources[key]

                          return (
                            <div className="source-card" key={key}>
                              <button
                                className="source-toggle"
                                onClick={() => toggleSource(message.id, index)}
                              >
                                <div className="source-file-icon">
                                  <FileText size={17} />
                                </div>
                                <div className="source-info">
                                  <strong>{source.filename || 'Unknown document'}</strong>
                                  <span>Page {source.page ?? 'Unknown'}</span>
                                </div>
                                {expanded
                                  ? <ChevronUp size={17} />
                                  : <ChevronDown size={17} />}
                              </button>
                              {expanded && (
                                <div className="source-content">
                                  {source.content || 'No source text was returned.'}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {asking && (
                <div className="message assistant">
                  <div className="message-avatar assistant"><Bot size={18} /></div>
                  <div className="message-body">
                    <div className="message-author">Research Assistant</div>
                    <div className="thinking">
                      <LoaderCircle className="spin" size={17} />
                      Searching documents and preparing an answer…
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </section>

        <footer className="composer-area">
          <form
            className="composer"
            onSubmit={event => {
              event.preventDefault()
              askQuestion()
            }}
          >
            <textarea
              rows={1}
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  askQuestion()
                }
              }}
              placeholder="Ask anything about your documents…"
              aria-label="Your question"
              disabled={asking}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!question.trim() || asking}
              aria-label="Send question"
            >
              {asking
                ? <LoaderCircle className="spin" size={18} />
                : <Send size={18} />}
            </button>
          </form>
          <div className="composer-disclaimer">
            <ShieldCheck size={13} />
            Answers are based on retrieved context. Verify important findings against the source.
          </div>
        </footer>
      </main>
    </div>
  )
}
