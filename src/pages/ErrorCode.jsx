import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AddErrorRow from './AddErrorRow'



function EmbeddingBadge({hasEmbedding}){
    return hasEmbedding ? (
        <span className= " inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs">
            Yes
        </span>
    ):(
         <span className= " inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-xs">
            Missing
        </span>
    )
}
function ErrorManager(){

    const[rows, SetRows] = useState([]); 
    const[loading,setLoading] = useState(true);
    const[activeAddRow, setActiveAddRow] = useState(null);
    const[editingRow, setEditingRow] = useState(null)
    const[editData, setEditData] = useState(null)



   
    const fetchData = async () => {
        setLoading(true)

      const { data, error } = await supabase
        .from('error_code_qa')
        .select('id, question, answer, embedding, created_at, error_codes(id,error_code, description)');


     if (error) {
        console.error(error);
      } else {
        SetRows(data); 
     }
      setLoading(false); 
      

      
    }
    useEffect(() => {
        fetchData(); 
    }, []) 
    
    const handleDelete = async(id) =>{
        if(!confirm('Are you sure you want to delete this?')) return;

        try{

        
           const { data, error:fetchError } = await supabase
           .from('error_code_qa')
           .select('error_code_id')
           .eq('id', id)
           .single();


        if(fetchError){
            console.error('Error getting the id to delete, ' , fetchError)
            throw fetchError
           
        }
        const errorCodeId = data.error_code_id;

        const { error: qaError} = await supabase
             .from('error_code_qa')
             .delete()
             .eq('id', id);

        if(qaError){
            console.log('Error deleting in the error_code_qa table ', qaError )
            throw qaError
        }
         const { error: codeError} = await supabase
             .from('error_codes')
             .delete()
             .eq('id', errorCodeId);

        if(codeError){
            console.log('Error deleting in the error_codes table ', codeError )
            throw codeError
        }
        fetchData()
        }
        
     catch(err){
        console.error(err);
        alert('Delete failed')
    }
    }
    

    const handleCancel = () => {
        setActiveAddRow(false)
        setEditingRow(null)
        setEditData(null)


    }
 
        return (
            
            <div className = "p-6 ">
                <div className="flex items-center justify-between mb-6">

                <div>
                <h2 className = "text-2xl font-semibold mb-4"> Error Code Manager </h2>
                <p className="text-sm  text-slate-500 mt-1">
                    {rows.length} total entries
                </p>
                </div>
                     <button 
                        onClick={() =>  setActiveAddRow(true)}
                        className = "flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold round-xl transition-colors shadow-sm" >
                            +Add Error
                        </button>
                    </div>
                    <div className = "bg-white rounded-2xl border border border-slate-200 overflow-hidden">
                  
                        <table className= "w-full text-sm">
                            <thead >
                            <tr className = "bg-slate-50 border-b border-slate-200">
                                <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Error Code </th>
                                 <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Category</th>
                                <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Question </th>
                                <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Answer</th>
                                <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Embedding </th>
                                <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Created </th>
                                 <th className = "px-4 py-3 text-left text-xs font-semibold text slate-500 uppercase"> Actions </th>
                                </tr>
                            </thead>
                            <tbody className ="divide-y divide-slate-100">
                               
                                {loading ? (
                                    <tr>
                                        <td colSpan = "6" className = "p-6 text-center text-slate-400">
                                            Loading...
                                      
                                            </td>
                                            </tr>
                                ): rows.length === 0 ?(
                                    <tr>
                                        <td colSpan = "6"className = "p-10 text-center text-slate-400">
                                            No error codes yet
                                        </td>
                                    </tr>
                                ):(
                                    <>
                                    {rows.map((row)=> (
                                        <>
                                        <tr key = {row.id} className = "hover:bg-slate-50 transition group">
                                            <td className = "px-4 py-3 font-medium text-slate-800"> {row.error_codes?.error_code}</td>
                                             <td className = "px-4 py-3 font-medium text-slate-800"> {row.error_codes?.description}</td>
                                            <td className = "px-4 py-3 font-medium text-slate-600"> {row.question}</td>
                                             <td className = "px-4 py-3 font-medium text-slate-700"> {row.answer}</td>

                                            <td className = "px-4 py-3">
                                               <EmbeddingBadge hasEmbedding={!! row.embedding}/>
                                                
                                            </td>

                                    
                                             <td className = "px-4 py-3 text-xs text-slate-400">
                                                {new Date(row.created_at).toLocaleString()}
                                            </td>

                                            
                                            <td className = "px-4 py-3">
                                                <div className = "flex gap-3 opacity-0 group-hover:opacity-100 transition">

                                                <button onClick={() =>{
                                                setEditingRow(row.id) 
                                              
                                                setEditData(row)
                                                setActiveAddRow(false) }
                                                }
                                                className="text-xs text-indigo-600 hover:underline opacity-0 group-hover:opacity-100 transition">
                                                   Edit
                                                </button>
                                                <button onClick={() =>handleDelete(row.id)}
                                                className="text-xs text-indigo-600 hover:underline opacity-0 group-hover:opacity-100 transition">
                                                   Delete
                                                </button>
                                                </div>
                                            </td>
                                      
                                            </tr>


                                            

                                             
                                                {editingRow === row.id && (
                                            
                                                    <AddErrorRow
                                                    editData ={editData}
                                                    onAdded={() => {
                                                        fetchData()
                                                      //  setEditingRow(null)
                                                       // setEditData(null)
                                                       handleCancel()
                                                    }}

                                                    onCancel = {handleCancel}
                                                    />
                                              
                                           )}
                                    </>
                                    
                                )
                                )}

                                  {activeAddRow && (
                                               
                                                <AddErrorRow 
                                             
                                                onAdded = {() => {
                                                    fetchData()
                                                //    setActiveAddRow(null)
                                                handleCancel()
                                                }}
                                                onCancel={handleCancel}
                                                />
                                               
                                            )}
                                            </>
                                        )}


                            </tbody>
                        </table>
                        </div>
                       </div>
                
          
        )
    }
export default ErrorManager;
