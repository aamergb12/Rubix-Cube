import { useMemo, useState } from 'react'


export function useCube(){
const [seed, setSeed] = useState(0)
const reset = ()=> setSeed(s=>s+1)


const scramble = (n=20)=>{
// For now, just reset — we’ll wire to real scramble after logic commit
setSeed(s=>s+1)
}


const undo = ()=>{}
const canUndo = false


return useMemo(()=>({ reset, scramble, undo, canUndo, seed }),[seed])
}
