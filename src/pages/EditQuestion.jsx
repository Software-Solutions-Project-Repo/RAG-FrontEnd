import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EditQuestion() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [metadata, setMetadata] = useState('{}')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchQuestion()
  }, [])

  const fetchQuestion = async () => {
    const { data, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      setError(error.message)
    } else {
      setQuestion(data.question || '')
      setAnswer(data.answer || '')
      setMetadata(JSON.stringify(data.metadata || {}, null, 2))
    }

    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError(null)

    let parsedMetadata = {}

    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {}
    } catch {
      setError('Metadata must be valid JSON')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('question_bank')
      .update({
        question,
        answer,
        metadata: parsedMetadata
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      const apiBase = import.meta.env.VITE_INGEST_API_URL
      if (apiBase) {
        await fetch(`${apiBase}/embed-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, question, answer, metadata: parsedMetadata })
        })
      }

      navigate('/question-bank')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        Loading question...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">
        Edit Question
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block text-sm font-medium mb-2">
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border rounded-xl p-3"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Suggested Answer
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full border rounded-xl p-3"
            rows={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Metadata
          </label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            className="w-full border rounded-xl p-3 font-mono text-sm"
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#006064] hover:bg-[#004d50] text-white rounded-xl transition-colors"
          >
            {saving ? 'Saving…' : 'Update Question'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/question-bank')}
            className="px-4 py-2 border rounded-xl"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  )
}