import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ConfirmModal from '../components/ConfirmModal'

function EmbeddingBadge({ hasEmbedding }) {
  return hasEmbedding ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
      Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
      Missing
    </span>
  )
}

function ErrorManager() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('error_code_qa')
      .select('id, question, answer, embedding, created_at, error_codes(id, error_code, description)')

    if (error) {
      console.error(error)
    } else {
      setRows(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('error_code_qa')
        .select('error_code_id')
        .eq('id', deleteTarget.id)
        .single()

      if (fetchError) throw fetchError

      const errorCodeId = data.error_code_id

      const { error: qaError } = await supabase
        .from('error_code_qa')
        .delete()
        .eq('id', deleteTarget.id)

      if (qaError) throw qaError

      const { error: codeError } = await supabase
        .from('error_codes')
        .delete()
        .eq('id', errorCodeId)

      if (codeError) throw codeError

      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Error Code Manager</h2>
          <p className="text-sm text-slate-500 mt-1">{rows.length} total entries</p>
        </div>
        <button
          onClick={() => navigate('/error-codes/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#006064] hover:bg-[#004d50] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          + Add Error
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Error Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Question</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Answer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Embedding</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-slate-400">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-400">No error codes yet</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition group">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.error_codes?.error_code}</td>
                  <td className="px-4 py-3 text-slate-600">{row.error_codes?.description}</td>
                  <td className="px-4 py-3 text-slate-600">{row.question}</td>
                  <td className="px-4 py-3 text-slate-700">{row.answer}</td>
                  <td className="px-4 py-3">
                    <EmbeddingBadge hasEmbedding={!!row.embedding} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => navigate(`/error-codes/${row.id}/edit`)}
                        className="text-xs text-[#006064] hover:underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        className="text-xs text-red-500 hover:underline font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Error Code"
        message={`Are you sure you want to delete error code "${deleteTarget?.error_codes?.error_code ?? ''}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
      />
    </div>
  )
}

export default ErrorManager
