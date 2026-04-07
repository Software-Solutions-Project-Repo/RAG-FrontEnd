import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const LS_FN_KEY = 'rag_edge_function_name'

const SOURCES = [
  { key: 'documents', label: 'Documents' },
  { key: 'questions', label: 'Questions' },
  { key: 'error_codes', label: 'Error Codes' },
]

function SourceBadge({ source }) {
  const styles = {
    documents: 'bg-slate-100 text-slate-600',
    questions: 'bg-[#006064]/10 text-[#006064]',
    error_codes: 'bg-rose-100 text-rose-700',
  }
  const labels = { documents: 'Document', questions: 'Question', error_codes: 'Error Code' }
  return (
    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[source]}`}>
      {labels[source]}
    </span>
  )
}

function SimilarityBadge({ score }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.8 ? 'bg-green-100 text-green-700' :
    score >= 0.6 ? 'bg-[#FFB300]/20 text-[#b37e00]' :
                   'bg-slate-100 text-slate-600'
  return (
    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {pct}% match
    </span>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('text') // 'text' | 'semantic'
  const [source, setSource] = useState('documents') // 'documents' | 'questions' | 'error_codes'
  const [query, setQuery] = useState('')
  const [matchCount, setMatchCount] = useState(5)
  const [metaFilter, setMetaFilter] = useState('{}')
  const [metaFilterError, setMetaFilterError] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [functionName, setFunctionName] = useState(
    () => localStorage.getItem(LS_FN_KEY) ?? ''
  )

  const saveFunctionName = (val) => {
    setFunctionName(val)
    localStorage.setItem(LS_FN_KEY, val.trim())
  }

  const handleTextSearch = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    const term = `%${query}%`

    if (source === 'documents') {
      const { data, error } = await supabase
        .from('documents')
        .select('id, content, metadata, created_at')
        .ilike('content', term)
        .limit(matchCount)
      if (error) setError(error.message)
      else setResults((data ?? []).map(r => ({ ...r, _source: 'documents' })))

    } else if (source === 'questions') {
      const { data, error } = await supabase
        .from('question_bank')
        .select('id, question, answer, metadata, created_at')
        .or(`question.ilike.${term},answer.ilike.${term}`)
        .limit(matchCount)
      if (error) setError(error.message)
      else setResults((data ?? []).map(r => ({ ...r, _source: 'questions' })))

    } else if (source === 'error_codes') {
      const { data, error } = await supabase
        .from('error_code_qa')
        .select('id, question, answer, created_at, error_codes(id, error_code, description)')
        .or(`question.ilike.${term},answer.ilike.${term}`)
        .limit(matchCount)
      if (error) setError(error.message)
      else setResults((data ?? []).map(r => ({ ...r, _source: 'error_codes' })))
    }

    setLoading(false)
  }

  const handleSemanticSearch = async () => {
    if (!functionName.trim()) {
      setError('Configure the Edge Function name in Settings first.')
      return
    }

    let filter = {}
    try {
      filter = JSON.parse(metaFilter)
      setMetaFilterError(null)
    } catch {
      setMetaFilterError('Invalid JSON')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    const { data, error } = await supabase.functions.invoke(functionName.trim(), {
      body: { query, match_count: matchCount, filter },
    })

    if (error) setError(error.message)
    else setResults((Array.isArray(data) ? data : []).map(r => ({ ...r, _source: 'documents' })))
    setLoading(false)
  }

  const handleSearch = () => {
    if (!query.trim()) return
    if (mode === 'text') handleTextSearch()
    else handleSemanticSearch()
  }

  const resetSearch = () => {
    setResults(null)
    setError(null)
  }

  const totalCount = results?.length ?? 0

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Search</h1>
          <p className="text-sm text-slate-500 mt-0.5">Text and semantic vector search</p>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
            showSettings
              ? 'bg-[#006064]/10 text-[#006064] border-[#006064]/20'
              : 'text-slate-600 border-slate-200 hover:bg-white'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-5 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Semantic Search — Edge Function</h2>
          <p className="text-xs text-slate-500 mb-3">
            The Edge Function must accept{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'{ query, match_count, filter }'}</code>{' '}
            and return{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{'[{ id, content, metadata, similarity }]'}</code>.
            It should generate the query embedding and call the{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">match_documents</code> RPC.
          </p>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-400 shrink-0">Function name:</span>
            <input
              type="text"
              value={functionName}
              onChange={(e) => saveFunctionName(e.target.value)}
              placeholder="e.g. search-documents"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006064]"
            />
          </div>
          {functionName && (
            <p className="mt-2 text-xs text-slate-400">
              Will call:{' '}
              <code className="text-slate-600">/functions/v1/{functionName}</code>
            </p>
          )}
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-4 mb-5">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { key: 'text', label: 'Text Search' },
            { key: 'semantic', label: 'Semantic Search' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMode(key); resetSearch() }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Source tabs — shown only for text search */}
        {mode === 'text' && (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {SOURCES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setSource(key); resetSearch() }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  source === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                mode === 'text'
                  ? 'Search content…'
                  : 'Describe what you\'re looking for…'
              }
              className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006064]"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#006064] hover:bg-[#004d50] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Results limit</label>
              <select
                value={matchCount}
                onChange={(e) => setMatchCount(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006064]"
              >
                {[5, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} results</option>
                ))}
              </select>
            </div>

            {mode === 'semantic' && (
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Metadata filter (JSON)
                </label>
                <input
                  type="text"
                  value={metaFilter}
                  onChange={(e) => { setMetaFilter(e.target.value); setMetaFilterError(null) }}
                  placeholder='e.g. {"source": "wiki"}'
                  className={`w-full px-3 py-2 border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#006064] ${
                    metaFilterError ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
                />
                {metaFilterError && <p className="mt-1 text-xs text-red-600">{metaFilterError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hint when semantic but no function configured */}
      {mode === 'semantic' && !functionName && !showSettings && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="font-semibold">Semantic search needs configuration.</span>{' '}
          Click{' '}
          <button onClick={() => setShowSettings(true)} className="underline font-semibold">
            Settings
          </button>{' '}
          to add your Supabase Edge Function name.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {totalCount === 0
              ? 'No results matched your query.'
              : `${totalCount} result${totalCount !== 1 ? 's' : ''} found`
            }
          </p>
          <div className="space-y-3">
            {results.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#006064]/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <SourceBadge source={item._source} />
                    {item._source === 'error_codes' && item.error_codes && (
                      <span className="font-mono text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        {item.error_codes.error_code}
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-400 truncate">{item.id}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.similarity !== undefined && (
                      <SimilarityBadge score={item.similarity} />
                    )}
                    {item._source === 'documents' && (
                      <button
                        onClick={() => navigate(`/documents/${item.id}/edit`)}
                        className="p-1.5 text-slate-400 hover:text-[#006064] hover:bg-[#006064]/5 rounded-lg transition-colors"
                        title="Edit document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {item._source === 'questions' && (
                      <button
                        onClick={() => navigate(`/question-bank/${item.id}/edit`)}
                        className="p-1.5 text-slate-400 hover:text-[#006064] hover:bg-[#006064]/5 rounded-lg transition-colors"
                        title="Edit question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Document result */}
                {item._source === 'documents' && (
                  <>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap line-clamp-5">
                      {item.content}
                    </p>
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Object.entries(item.metadata).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            <span className="font-medium">{k}</span>: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Question / Error Code result */}
                {(item._source === 'questions' || item._source === 'error_codes') && (
                  <div className="space-y-2">
                    {item._source === 'error_codes' && item.error_codes?.description && (
                      <p className="text-xs text-slate-500 italic">{item.error_codes.description}</p>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Q</span>
                      <p className="text-sm text-slate-800 leading-relaxed mt-0.5">{item.question}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">A</span>
                      <p className="text-sm text-slate-600 leading-relaxed mt-0.5 line-clamp-4">{item.answer}</p>
                    </div>
                    {item._source === 'questions' && item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(item.metadata).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            <span className="font-medium">{k}</span>: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
