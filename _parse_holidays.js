const fs=require('fs');
const txt=fs.readFileSync('holidays_my.ics','utf8').replace(/\r\n[ \t]/g,'');
const blocks=txt.split('BEGIN:VEVENT').slice(1).map(b=>b.split('END:VEVENT')[0]);
const events=[];
for(const b of blocks){
  const lines=b.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  let dt=''; let name=''; let desc='';
  for(const line of lines){
    if(line.startsWith('DTSTART')){ const i=line.indexOf(':'); if(i>=0) dt=line.slice(i+1).trim(); }
    if(line.startsWith('SUMMARY')){ const i=line.indexOf(':'); if(i>=0) name=line.slice(i+1).trim(); }
    if(line.startsWith('DESCRIPTION')){ const i=line.indexOf(':'); if(i>=0) desc=line.slice(i+1).trim(); }
  }
  if(!/^\d{8}$/.test(dt) || !dt.startsWith('2026')) continue;
  name=name.replace(/\\,/g,',').replace(/\\n/g,' ').trim();
  desc=desc.replace(/\\,/g,',').replace(/\\n/g,' ').trim();
  events.push({date:`${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}`,name,desc});
}
const uniq=[]; const seen=new Set();
events.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
for(const e of events){ const k=e.date+'|'+e.name; if(seen.has(k)) continue; seen.add(k); uniq.push(e); }
console.log('count',uniq.length);
console.log(JSON.stringify(uniq.slice(0,30),null,2));
fs.writeFileSync('holidays_my_2026.json', JSON.stringify(uniq,null,2));
