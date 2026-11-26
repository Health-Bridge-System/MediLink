// Same-origin API client. No simulated responses, no localStorage and no persistent PHI cache.
export async function api(path,{token,method='GET',body,signal}={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  const abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});
  try {
    const res=await fetch(`/api${path}`,{
      method,credentials:'same-origin',signal:controller.signal,
      headers:{...(token?{Authorization:`Bearer ${token}`}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},
      ...(body!==undefined?{body:JSON.stringify(body)}:{})
    });
    const text=await res.text();let content=null;
    try{content=text?JSON.parse(text):null}catch{content=text}
    if(!res.ok){
      const errors=Array.isArray(content?.details)?content.details.map(x=>`${x.path||x.field||'field'}: ${x.message||'invalid'}`).join('; '):'';
      const e=new Error([content?.message||content?.error||`HTTP ${res.status}`,errors].filter(Boolean).join(' — '));
      e.status=res.status;throw e;
    }
    return content;
  } catch(e){if(e.name==='AbortError')throw new Error('Request timed out or was cancelled');throw e}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
export const urlQuery = (params) => {const p=new URLSearchParams();Object.entries(params).forEach(([k,v])=>{if(v!==''&&v!==null&&v!==undefined)p.set(k,String(v))});const q=p.toString();return q?`?${q}`:'';};
