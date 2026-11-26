// Pure, defensive display and validation helpers. No simulated clinical data.
export const text = value => value == null ? '' : String(value).trim();
export const lower = value => text(value).toLocaleLowerCase();
export const matches = (row, query, keys) => {
 const q=lower(query);if (!q) return true;
 return (keys||[]).some(key=>lower(typeof key==='function'?key(row):row?.[key]).includes(q));
};
export const staffName = row => text(row?.fullName)||text(row?.name)||text(row?.user?.fullName)||text(row?.account?.fullName)|| (row?.id!=null?`Staff #${row.id}`:'Not provided');
export const patientName = row => text(row?.fullName)||text(row?.name)|| (row?.id!=null?`Patient #${row.id}`:'Not provided');
export const moneyValue = row => {
 const raw=row?.totalAmount??row?.total??row?.price;
 return raw==null?'Not supplied':(Number.isFinite(Number(raw))?Number(raw).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):text(raw));
};
export const resultsFromAnalytes = (analytes,values) => {
 if(!Array.isArray(analytes)||!analytes.length)throw new Error('No analytes defined for this laboratory panel.');
 return analytes.map(a=>{
  const raw=text(values?.[a.testName]);if(!raw)throw new Error(`Enter a measurement for ${a.testName}.`);
  const n=Number(raw);if(!Number.isFinite(n))throw new Error(`${a.testName} must be a finite number.`);
  return {testName:a.testName,value:n};
 });
};
export const safeOrderSelection = (patientId, serviceIds) => {
 const id=Number(patientId);if(!Number.isSafeInteger(id)||id<1)throw new Error('Choose a patient.');
 const ids=[...new Set(serviceIds.map(Number))];
 if(!ids.length||ids.some(n=>!Number.isSafeInteger(n)||n<1))throw new Error('Choose one or more valid diagnostic services.');
 return {patientId:id,serviceIds:ids};
};
