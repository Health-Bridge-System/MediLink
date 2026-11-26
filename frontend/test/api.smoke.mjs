// Non-destructive API smoke test. Run with MEDILINK_USERNAME and MEDILINK_PASSWORD
// configured in your LOCAL terminal. Does not create or modify records.
import test from 'node:test';
import assert from 'node:assert/strict';
const base=(process.env.MEDILINK_API_URL||'http://127.0.0.1:4000/api').replace(/\/$/,'');
const username=process.env.MEDILINK_USERNAME;
const password=process.env.MEDILINK_PASSWORD;
async function fetchJSON(path,{token,method='GET',body}={}){
  const res=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`}:{}) ,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
  let data=null;try{data=await res.json()}catch{}return {status:res.status,data};
}
test('API health and database',async()=>{
  const r=await fetchJSON('/system/health');assert.equal(r.status,200);assert.equal(r.data?.status,'ok');assert.equal(r.data?.database,'mysql');
});
test('unauthenticated access is rejected',async()=>{
  const r=await fetchJSON('/patients');assert.equal(r.status,401);
});
test('real username and password login + authenticated identity',async(t)=>{
  if(!username||!password){t.skip('Set MEDILINK_USERNAME and MEDILINK_PASSWORD in this local terminal');return}
  const r=await fetchJSON('/auth/login',{method:'POST',body:{username,password}});assert.equal(r.status,200);
  const token=r.data?.token||r.data?.accessToken;assert.ok(token,'Login response missing token');
  const me=await fetchJSON('/auth/me',{token});assert.equal(me.status,200);assert.ok(me.data?.role,'Identity should include role');
  const catalog=await fetchJSON('/services',{token});assert.equal(catalog.status,200);
});
