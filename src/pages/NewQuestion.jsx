import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NewQuestion() {
  const navigate = useNavigate()

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [metadata, setMetadata] = useState('{}')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

    const { data, error } = await supabase
      .from('question_bank')
      .insert([
        {
          question,
          answer,
          metadata: parsedMetadata
        }
      ])
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      await fetch('http://localhost:8000/embed-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, question, answer, metadata: parsedMetadata })
      })

      navigate('/question-bank')
    }

    setSaving(false)
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Add Question</h1>

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
            required
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Metadata (JSON optional)
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
          >
            {saving ? 'Saving…' : 'Create Question'}
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