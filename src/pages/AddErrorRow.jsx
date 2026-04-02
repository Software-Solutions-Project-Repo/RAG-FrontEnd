import {useState, useEffect} from 'react'
import { supabase} from '../lib/supabase'

export default function AddErrorRow({onAdded, onCancel, ErrorCodeId,editData}){
    const[code, setCode] = useState('')
    const[desc, setDesc] = useState('')
    const[question, setQuestion] = useState('')
    const[loading,setLoading] = useState(false)
    const[answer, setAnswer] = useState('')


 const isEdit = !! editData

useEffect(() => {
    if(editData){

        setCode(editData.error_codes?.error_code || '')
        setDesc(editData.error_codes?.description || '')
          setQuestion(editData.question || '')
         setAnswer(editData.answer || '')
    }
}, 
[editData])



    const handleAdd = async() => {
        if(!code || !question || !answer) {
            alert('Error code, Question  and Answer are required')
            return
        }

        setLoading(true)

        try{
            const apiBase = import.meta.env.VITE_INGEST_API_URL

            console.log('API BASE:', apiBase)

            const res = await fetch(`${apiBase}/embed-error`,{
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body:JSON.stringify({
                    error_code: code,
                    description: desc, 
                    answer:answer, 
                    question: question,
                }), 
            })
            const data = await res.json()
            console.log('API RESPONSE:', data)
            if(!res.ok){
              // const body = await res.json().catch(() => ({}))
                throw new Error(data.detail || 'Embedding failed')
            }

          
            setCode('')
            setDesc('')
            setAnswer('')
            setQuestion('')

            onAdded()

        }catch(err){
            console.error(`Add Error failed: ${err.message || err}`)
            alert(`Failed to add error: ${err.message || err}`)
           }finally{
            setLoading(false)
           }
        }
            


         
        
        return(
           // <tr className = "bg-indigo-50/40 border-t border-b border-indigo-100">
           <tr className = "hover:bg-slate-50 transition ">
               


            <td className = "px-4 py-3">
                <input className = "w-full bg-transparent text-sm text-slate-700 placeholder-slate-400  focus:outline-none"
                placeholder = "E.g. ERR001"
                value= {code}
                onChange= {(e) => setCode(e.target.value)}
                />
            </td>
             <td className = "px-4 py-3">
                <input className = "w-full bg-transparent text-sm text-slate-700 placeholder-slate-400  focus:outline-none"
                placeholder = "Description"
                value = {desc}
                onChange= {(e) => setDesc(e.target.value)}
                />
             </td>
             <td className = "px-4 py-3">
                <input className = "w-full bg-transparent text-sm text-slate-700 placeholder-slate-400  focus:outline-none"
                placeholder = "Question"
                value = {question}
                onChange= {(e) => setQuestion(e.target.value)}
                />
             </td>
                  <td className = "px-4 py-3">
                <input className = " w-full bg-transparent text-sm text-slate-700 placeholder-slate-400  focus:outline-none"
                   placeholder = "Answer"
                  value = {answer}
                  onChange= {(e) => setAnswer(e.target.value)}
                />
                            </td>
                <td className = "px-4 py-3">
                    {loading ? (
                        <span className ="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">
                            Generating...
                        </span> 
                        ):(
                            <span className = "text-xs px-2 py-1 rounded bg-slate-100 text-slate-500">
                                Pending
                            </span>
                            )}
                    </td>
                <td className = "px-4 py-3 text-slate-400 text-sm">-</td>
                <td className = "px-4 py-3">
                    <div className= "flex items-center gap-3">
                    <button 
                    onClick = { handleAdd}
                    disabled = {loading }
                    className= "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition disabled:opacity-50">
                        {isEdit? 'Update' : 'Add'}

                    </button>
                    <button
                    onClick = {onCancel}
                    className = "px-3 py-1.5 bg-slate-200  hover:bg-slate_300 text-xs rounded-md transition">
                        Cancel
                    </button>
                    </div>
                </td>
           </tr>

        )

}
           