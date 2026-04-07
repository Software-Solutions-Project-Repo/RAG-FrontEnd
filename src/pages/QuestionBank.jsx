import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

const PAGE_SIZE = 20

function EmbeddingBadge({ hasEmbedding }) {
  if (hasEmbedding) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Embedded
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Missing
    </span>
  )
}

export default function QuestionBank() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)

    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from('question_bank')
      .select('id, question, answer, metadata, embedding, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      setError(error.message)
    } else {
      setQuestions(data ?? [])
      setTotal(count ?? 0)
    }

    setLoading(false)
  }, [page])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', deleteTarget.id)

    if (error) {
      setError(error.message)
    } else {
      setDeleteTarget(null)
      if (questions.length === 1 && page > 0) setPage(p => p - 1)
      else fetchQuestions()
    }

    setDeleting(false)
  }

  const copyId = (id) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const withEmbedding = questions.filter(q => !!q.embedding).length

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Question Bank</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm text-slate-500">{total} total</span>
            {questions.length > 0 && (
              <span className="text-sm text-slate-400">
                {withEmbedding}/{questions.length} on this page have embeddings
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/question-bank/new')}
            className="flex items-center px-4 py-2 bg-[#006064] hover:bg-[#004d50] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Question
          </button>
          <button
            onClick={async () => {
              await fetch('http://localhost:8000/embed-missing-questions', { method: 'POST' })
              fetchQuestions()
            }}
            className="flex items-center px-4 py-2 bg-[#FFB300] hover:bg-[#e6a000] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Missing Embeddings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          Loading questions…
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            No questions yet
          </h3>
          <button
            onClick={() => navigate('/questions/new')}
            className="px-4 py-2 bg-[#006064] hover:bg-[#004d50] text-white rounded-xl transition-colors"
          >
            Add Question
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs">ID</th>
                  <th className="px-4 py-3 text-left text-xs">Question</th>
                  <th className="px-4 py-3 text-left text-xs">Suggested Answer</th>
                  <th className="px-4 py-3 text-left text-xs">Embedding</th>
                  <th className="px-4 py-3 text-left text-xs">Created</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="px-4 py-3">
                      <button onClick={() => copyId(q.id)}>
                        {copiedId === q.id
                          ? "Copied!"
                          : `${q.id.slice(0, 8)}…`}
                      </button>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      {q.question}
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      {q.answer}
                    </td>

                    <td className="px-4 py-3">
                      <EmbeddingBadge hasEmbedding={!!q.embedding} />
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/question-bank/${q.id}/edit`)
                          }
                          className="text-[#006064] hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                Previous
              </button>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Question"
        message="Are you sure you want to delete this question? This cannot be undone"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
      />
    </div>
  )
}