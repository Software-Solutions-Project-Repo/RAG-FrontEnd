import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'


export default function AddErrorCode() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [code, setCode] = useState('')
  const [desc, setDesc] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [errorCodeId, setErrorCodeId] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    const fetchRow = async () => {
      const { data, error } = await supabase
        .from('error_code_qa')
        .select('id, question, answer, error_codes(id, error_code, description)')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setCode(data.error_codes?.error_code || '')
        setDesc(data.error_codes?.description || '')
        setQuestion(data.question || '')
        setAnswer(data.answer || '')
        setErrorCodeId(data.error_codes?.id || null)
      }
      setLoading(false)
    }
    fetchRow()
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const apiBase = import.meta.env.VITE_INGEST_API_URL
      if (!apiBase) throw new Error('VITE_INGEST_API_URL is not set. Add it to your .env file.')

      let qaId

      if (isEdit) {
        // Update error_codes row
        if (errorCodeId) {
          const { error: codeErr } = await supabase
            .from('error_codes')
            .update({ error_code: code, description: desc })
            .eq('id', errorCodeId)
          if (codeErr) throw new Error(codeErr.message)
        }

        // Update error_code_qa row
        const { error: qaErr } = await supabase
          .from('error_code_qa')
          .update({ question, answer })
          .eq('id', id)
        if (qaErr) throw new Error(qaErr.message)

        qaId = id
      } else {
        // Insert into error_codes first
        const { data: codeData, error: codeErr } = await supabase
          .from('error_codes')
          .insert([{ error_code: code, description: desc }])
          .select()
          .single()
        if (codeErr) throw new Error(codeErr.message)

        // Insert into error_code_qa with the new error_code_id
        const { data: qaData, error: qaErr } = await supabase
          .from('error_code_qa')
          .insert([{ question, answer, error_code_id: codeData.id }])
          .select()
          .single()
        if (qaErr) throw new Error(qaErr.message)

        qaId = qaData.id
      }

      // Generate and store the embedding
      const res = await fetch(`${apiBase}/embed-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qaId, error_code: code, description: desc, question, answer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Embedding failed')

      navigate('/error-codes')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading…
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => navigate('/error-codes')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Error Code' : 'Add Error Code'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Error Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="E.g. ERR001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category / Description</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="E.g. Network Error"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Answer</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            rows={6}
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isEdit ? 'Updating…' : 'Saving…'}
              </>
            ) : (
              isEdit ? 'Update Error Code' : 'Add Error Code'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/error-codes')}
            className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
