'use client'
import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Calculator, Users, Calendar, Download, Edit2,
  Check, X, ChevronLeft, ChevronRight, CreditCard, TrendingUp,
  RefreshCw, FileText, AlertCircle, MapPin, Layers,
} from 'lucide-react';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const G  = '#C9A84C';
const GL = '#F3EAC8';
const GD = '#7A5C1E';
const A  = '#1C1C1E';
const A2 = '#2C2C2E';
const CR = '#F7F4EF';
const MF = "'Montserrat', sans-serif";
const CF = "'Cormorant Garamond', serif";
const MONTHS = ['Januar','Februar','Mart','April','Maj','Jun','Jul','Avgust','Septembar','Oktobar','Novembar','Decembar'];
const DAYS   = ['Pon','Uto','Sre','Čet','Pet','Sub','Ned'];
const METHOD_LABELS = { cash: 'Keš', bank: 'Račun', other: 'Ostalo' };

// ── API Layer ─────────────────────────────────────────────────────────────────
const API = '/api';
const h   = { 'Content-Type': 'application/json' };

const api = {
  // Settings
  getSettings:  ()        => fetch(`${API}/settings.php`).then(r => r.json()),
  setSetting:   (k, v)    => fetch(`${API}/settings.php`, { method:'POST', headers:h, body:JSON.stringify({key_name:k, value:String(v)}) }),

  // Employees
  getEmployees:   ()      => fetch(`${API}/employees.php`).then(r => r.json()),
  addEmployee:    (d)     => fetch(`${API}/employees.php`, { method:'POST', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  updateEmployee: (id, d) => fetch(`${API}/employees.php?id=${id}`, { method:'PUT', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  deleteEmployee: (id)    => fetch(`${API}/employees.php?id=${id}`, { method:'DELETE' }),

  // Attendance
  getAttendance:   ()  => fetch(`${API}/attendance.php`).then(r => r.json()),
  upsertAttendance:(d) => fetch(`${API}/attendance.php`, { method:'POST', headers:h, body:JSON.stringify(d) }),

  // Records
  getRecords:   ()      => fetch(`${API}/records.php`).then(r => r.json()),
  addRecord:    (d)     => fetch(`${API}/records.php`, { method:'POST', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  updateRecord: (id, d) => fetch(`${API}/records.php?id=${id}`, { method:'PUT', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  deleteRecord: (id)    => fetch(`${API}/records.php?id=${id}`, { method:'DELETE' }),

  // Payments
  getPayments:   () => fetch(`${API}/payments.php`).then(r => r.json()),
  addPayment:    (d)  => fetch(`${API}/payments.php`, { method:'POST', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  deletePayment: (id) => fetch(`${API}/payments.php?id=${id}`, { method:'DELETE' }),

  // Tereni
  getTereni:    ()      => fetch(`${API}/tereni.php`).then(r => r.json()),
  addTeren:     (d)     => fetch(`${API}/tereni.php`, { method:'POST', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  updateTeren:  (id, d) => fetch(`${API}/tereni.php?id=${id}`, { method:'PUT', headers:h, body:JSON.stringify(d) }).then(r => r.json()),
  deleteTeren:  (id)    => fetch(`${API}/tereni.php?id=${id}`, { method:'DELETE' }),

  // NBS rate
  getRate: () => fetch(`${API}/eur-rate.php`).then(r => r.json()),
};

// Convert PHP row → employee object
const toEmp = (r) => ({ id: +r.id, name: r.name, agreedSalary: parseFloat(r.agreed_salary)||0, dnevnica: parseFloat(r.dnevnica)||0, terenNaknada: parseFloat(r.teren_naknada)||0 });
// Convert PHP rows → attendance nested object
const toAtt = (rows) => {
  const att = {};
  (rows || []).forEach(a => {
    if (!att[a.employee_id]) att[a.employee_id] = {};
    if (!att[a.employee_id][a.month]) att[a.employee_id][a.month] = {};
    att[a.employee_id][a.month][a.day] = { state: a.state || null, note: a.note || '' };
  });
  return att;
};
// Convert PHP row → record object
const toRec = (r) => ({ id:+r.id, eid:+r.employee_id, month:r.month, numDnevnica:parseFloat(r.num_dnevnica)||0, numPergola:parseFloat(r.num_pergola)||0, note:r.note||'' });
// Convert PHP row → payment object
const toPay = (r) => ({ id:+r.id, eid:+r.employee_id, month:r.month, amount:parseFloat(r.amount)||0, date:r.payment_date||'', method:r.method||'cash', note:r.note||'' });
// Convert PHP row → teren object (sa ugnježdenim radnicima)
const toTeren = (r) => ({ id:+r.id, date:r.teren_date||'', month:r.month||'', location:r.location||'', note:r.note||'',
  workers:(r.workers||[]).map(w=>({ eid:+w.employee_id, name:w.name||'', systems:parseFloat(w.systems)||0 })) });

// ── Utils ─────────────────────────────────────────────────────────────────────
const fmt    = (n) => Math.round(n||0).toLocaleString('sr-RS');
const fmtM   = (m) => { if(!m)return''; const[y,mo]=m.split('-'); return`${MONTHS[+mo-1]} ${y}`; };
const toEur  = (rsd,r) => (rsd/(r||117.5)).toFixed(2);
const fmtEur = (rsd,r) => `${toEur(rsd,r)} €`;
const now    = () => { const d=new Date(); return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const dim    = (y,m) => new Date(y,m+1,0).getDate();
const fo     = (y,m) => (new Date(y,m,1).getDay()+6)%7;
const dw     = (y,m,d) => new Date(y,m,d).getDay();
const isSu   = (y,m,d) => dw(y,m,d)===0;
const isSa   = (y,m,d) => dw(y,m,d)===6;
// Broj slobodnih subota mesečno (u okviru plate)
const FREE_SAT = 2;
// Standardni radni dani (norma) = pon–pet + (sve subote − 2 slobodne). Nedelja se ne računa u normu.
const stdDays = (y,m) => {
  let wd=0, sat=0;
  for(let d=1;d<=dim(y,m);d++){ const w=dw(y,m,d); if(w>=1&&w<=5)wd++; else if(w===6)sat++; }
  return wd + Math.max(0, sat-FREE_SAT);
};
// Efektivan radni dan: 'worked' uvek radi, 'off' uvek slobodan;
// podrazumevano pon–pet rade, subota i nedelja slobodne.
const effW   = (y,m,d,dd) => { if(dd?.state==='worked')return true; if(dd?.state==='off')return false; return !isSu(y,m,d) && !isSa(y,m,d); };
const cntW   = (y,m,eid,ym,att) => { let c=0; for(let d=1;d<=dim(y,m);d++) if(effW(y,m,d,att?.[eid]?.[ym]?.[d]))c++; return c; };
const hasAtt = (eid,ym,att) => Object.keys(att?.[eid]?.[ym]||{}).length>0;
// Dnevnica za dati mesec = mesečna plata ÷ norma radnih dana
const dnevnicaFor = (salary,y,m) => { const sd=stdDays(y,m); return sd>0 ? Math.round((salary||0)/sd) : 0; };

// ── UI Primitives ─────────────────────────────────────────────────────────────
const s = (...rules) => Object.assign({}, ...rules);
const cardS = { background:'#fff', borderRadius:20, border:'1px solid #EDE9E2', boxShadow:'0 1px 6px rgba(28,28,30,0.05)' };
const Card  = ({ children, style, className='' }) => <div style={s(cardS,style)} className={className}>{children}</div>;

const initials = (n='') => n.trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
const Avatar = ({ name, sz=44 }) => (
  <div style={{ width:sz, height:sz, borderRadius:13, background:`linear-gradient(145deg,${A2},${A})`, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 12px ${A}30` }}>
    <span style={{ fontFamily:MF, fontWeight:800, fontSize:Math.max(10,sz/3.8), color:G }}>{initials(name)}</span>
  </div>
);

const FL = ({ children }) => <div style={{ fontFamily:MF, fontWeight:700, fontSize:10, letterSpacing:'0.09em', color:'#9CA3AF', marginBottom:7 }}>{String(children).toUpperCase()}</div>;
const FI = ({ style:st, ...props }) => (
  <input
    style={s({ width:'100%', padding:'11px 15px', background:'#FAFAF9', border:'1.5px solid #E9E5DE', borderRadius:12, fontSize:14, fontFamily:MF, fontWeight:500, outline:'none', boxSizing:'border-box', transition:'all .18s', color:A }, st)}
    onFocus={e=>{ e.target.style.borderColor=G; e.target.style.boxShadow=`0 0 0 3px ${G}22`; e.target.style.background='#fff'; }}
    onBlur={e=>{ e.target.style.borderColor='#E9E5DE'; e.target.style.boxShadow=''; e.target.style.background='#FAFAF9'; }}
    {...props} />
);
const Field  = ({ label, ...props }) => <div>{label&&<FL>{label}</FL>}<FI {...props}/></div>;
const SelEl  = ({ label, children, ...props }) => (
  <div>{label&&<FL>{label}</FL>}
    <select style={{ width:'100%', padding:'11px 15px', background:'#FAFAF9', border:'1.5px solid #E9E5DE', borderRadius:12, fontSize:14, fontFamily:MF, fontWeight:500, outline:'none', color:A }} {...props}>{children}</select>
  </div>
);
const Btn = ({ children, v='gold', sm, style:st, ...props }) => {
  const variants = { gold:{background:G,color:'#fff',border:'none',boxShadow:`0 4px 14px ${G}50`}, dark:{background:A,color:'#fff',border:'none',boxShadow:`0 4px 14px ${A}40`}, ghost:{background:'transparent',color:'#6B7280',border:'1.5px solid #E9E5DE',boxShadow:'none'} };
  return (
    <button style={s({ padding:sm?'7px 13px':'10px 20px', borderRadius:sm?10:13, fontFamily:MF, fontWeight:700, fontSize:sm?12:13, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, transition:'all .18s', lineHeight:1 }, variants[v], st)}
      onMouseEnter={e=>{ e.currentTarget.style.opacity='0.82'; e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform=''; }}
      {...props}>{children}</button>
  );
};
const Tag = ({ children, color='gold' }) => {
  const cs = { gold:{background:GL,color:GD}, gray:{background:'#F3F4F6',color:'#6B7280'}, red:{background:'#FEF2F2',color:'#DC2626'} };
  return <span style={s({ fontFamily:MF, fontWeight:700, fontSize:11, padding:'4px 10px', borderRadius:8, display:'inline-flex', alignItems:'center', gap:4 }, cs[color])}>{children}</span>;
};
const Divider = () => <div style={{ height:1, background:'#F0EDE7', margin:'4px 0' }}/>;
const Empty   = ({ Icon, text }) => (
  <div style={{ textAlign:'center', padding:'64px 20px' }}>
    <div style={{ width:60, height:60, borderRadius:18, background:'#F7F4EF', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={26} color="#D6D0C4"/></div>
    <p style={{ fontFamily:CF, fontStyle:'italic', color:'#9CA3AF', fontSize:16, margin:0 }}>{text}</p>
  </div>
);

// Error toast
const Toast = ({ msg, onClose }) => msg ? (
  <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#1C1C1E', color:'#fff', padding:'12px 20px', borderRadius:14, display:'flex', alignItems:'center', gap:10, zIndex:9999, boxShadow:'0 8px 30px rgba(0,0,0,0.3)', fontFamily:MF, fontSize:13, fontWeight:600 }}>
    <AlertCircle size={16} color="#EF4444"/> {msg}
    <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', marginLeft:8 }}><X size={14}/></button>
  </div>
) : null;

// Inline-editable name heading
const InlineName = ({ value, onSave, light=false }) => {
  const [ed,setEd]=useState(false); const [v,setV]=useState(value);
  useEffect(()=>setV(value),[value]);
  const save=()=>{ const t=v.trim(); if(t){onSave(t);setEd(false);} };
  if(ed) return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <input value={v} onChange={e=>setV(e.target.value)} autoFocus
        onKeyDown={e=>{ if(e.key==='Enter')save(); if(e.key==='Escape')setEd(false); }}
        style={{ fontFamily:MF, fontWeight:900, fontSize:24, padding:'4px 10px', borderRadius:10, border:`2px solid ${G}`, outline:'none', background:light?'rgba(255,255,255,0.12)':'#fff', color:light?'#fff':A, width:220 }}/>
      <button onClick={save} style={{ color:G, background:'none', border:'none', cursor:'pointer' }}><Check size={17}/></button>
      <button onClick={()=>setEd(false)} style={{ color:'#9CA3AF', background:'none', border:'none', cursor:'pointer' }}><X size={17}/></button>
    </div>
  );
  return (
    <button onClick={()=>{ setV(value); setEd(true); }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:9, padding:0 }}>
      <h1 style={{ fontFamily:MF, fontWeight:900, fontSize:24, color:light?'#fff':A, margin:0, letterSpacing:'-0.02em' }}>{value}</h1>
      <Edit2 size={14} color={light?`${G}90`:'#C8C4BC'}/>
    </button>
  );
};

const InlineSetting = ({ label, value, suffix, onSave }) => {
  const [ed,setEd]=useState(false); const [v,setV]=useState(String(value));
  const save=()=>{ const n=parseFloat(v); if(n>0){onSave(n);setEd(false);} };
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
      <span style={{ fontFamily:CF, fontStyle:'italic', color:`${G}90` }}>{label}</span>
      {ed ? (
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <input type="number" value={v} onChange={e=>setV(e.target.value)} autoFocus
            onKeyDown={e=>{ if(e.key==='Enter')save(); if(e.key==='Escape')setEd(false); }}
            style={{ width:75, padding:'4px 8px', borderRadius:8, border:`1.5px solid ${G}`, background:'rgba(255,255,255,0.1)', color:'#fff', fontFamily:MF, fontSize:13, outline:'none' }}/>
          <button onClick={save} style={{ color:G, background:'none', border:'none', cursor:'pointer' }}><Check size={14}/></button>
          <button onClick={()=>setEd(false)} style={{ color:'#9CA3AF', background:'none', border:'none', cursor:'pointer' }}><X size={14}/></button>
        </span>
      ) : (
        <button onClick={()=>{ setV(String(value)); setEd(true); }} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <span style={{ fontFamily:MF, fontWeight:700, color:'#fff' }}>{value} {suffix}</span>
          <Edit2 size={11} color={`${G}70`}/>
        </button>
      )}
    </div>
  );
};

// ── Monthly Calendar ───────────────────────────────────────────────────────────
const MonthCalendar = ({ eid, month, att, onUpdate }) => {
  const [noteDay,setNoteDay]=useState(null); const [noteVal,setNoteVal]=useState('');
  if(!month||!eid) return null;
  const [y,mo]=month.split('-').map(Number); const m0=mo-1;
  const total=dim(y,m0), offset=fo(y,m0);
  const empAtt=att?.[eid]?.[month]||{};
  const cells=[...Array(offset).fill(null), ...Array.from({length:total},(_,i)=>i+1)];
  // Klik prebacuje između "radi" i "slobodan" (2 stanja):
  //  • pon–pet: podrazumevano rade → klik = slobodan, pa nazad
  //  • subota/nedelja: podrazumevano slobodne → klik = radi, pa nazad
  const toggle=(d)=>{
    const cur=empAtt[d];
    const wknd=isSu(y,m0,d)||isSa(y,m0,d);
    const worked=effW(y,m0,d,cur);
    const next=worked?'off':'worked';
    // ako vraćamo na podrazumevano stanje, čistimo state (null)
    const isDefault=(next==='worked'&&!wknd)||(next==='off'&&wknd);
    onUpdate(eid,month,d,{...cur,state:isDefault?null:next});
  };
  const today=new Date(); const isToday=(d)=>today.getFullYear()===y&&today.getMonth()===m0&&today.getDate()===d;
  const openNote=(e,d)=>{ e.stopPropagation(); setNoteDay(d); setNoteVal(empAtt[d]?.note||''); };
  const saveNote=()=>{ onUpdate(eid,month,noteDay,{...empAtt[noteDay],note:noteVal}); setNoteDay(null); };
  const notes=Object.entries(empAtt).filter(([,dd])=>dd?.note).sort(([a],[b])=>+a-+b);
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:5 }}>
        {DAYS.map((d,i)=><div key={d} style={{ textAlign:'center', fontFamily:MF, fontWeight:700, fontSize:10, letterSpacing:'0.05em', color:i===6?'#D6D0C4':'#A8A29E' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`e${i}`}/>;
          const dd=empAtt[d]; const wknd=isSu(y,m0,d)||isSa(y,m0,d);
          const worked=effW(y,m0,d,dd); const hasNote=!!dd?.note; const td=isToday(d);
          const extra=worked&&wknd; // radna subota/nedelja = dodatni dan (van norme)
          let bg,fg,border;
          if(extra){       bg=G;        fg='#fff';    border=G; }          // radni vikend — istaknut zlatni
          else if(worked){ bg=GL;       fg=GD;        border='#E0D09E'; }  // radni dan (pon–pet)
          else{            bg='#F3F4F6'; fg='#9CA3AF'; border='#E5E7EB'; } // slobodan
          return (
            <div key={d} onClick={()=>toggle(d)}
              style={{ background:bg, border:`${td?2:1.5}px solid ${td?G:border}`, borderRadius:11, minHeight:46, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', transition:'all .15s', gap:2 }}>
              <span style={{ fontFamily:MF, fontWeight:700, fontSize:13, color:fg }}>{d}</span>
              {hasNote&&<div style={{ width:5, height:5, borderRadius:'50%', background:extra?'#fff':G, position:'absolute', top:4, right:5 }}/>}
              <button title="Napomena" onClick={e=>openNote(e,d)} style={{ position:'absolute', bottom:3, right:4, background:'none', border:'none', cursor:'pointer', color:fg, fontSize:9, opacity:0.55, lineHeight:1 }}>✎</button>
            </div>
          );
        })}
      </div>
      {noteDay&&(
        <div style={{ marginTop:14, padding:'14px 16px', borderRadius:14, background:GL, border:`1px solid ${G}50` }}>
          <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:GD, marginBottom:10 }}>Napomena — {noteDay}. {fmtM(month).toLowerCase()}</p>
          <div style={{ display:'flex', gap:8 }}>
            <FI value={noteVal} onChange={e=>setNoteVal(e.target.value)} autoFocus placeholder="npr. bonus 500 RSD, kasnjenje..."
              onKeyDown={e=>e.key==='Enter'&&saveNote()} style={{ flex:1, padding:'8px 13px', fontSize:13 }}/>
            <Btn onClick={saveNote} sm><Check size={15}/></Btn>
            <Btn v="ghost" onClick={()=>setNoteDay(null)} sm><X size={15}/></Btn>
          </div>
        </div>
      )}
      {notes.length>0&&(
        <div style={{ marginTop:14 }}>
          <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:'#A8A29E', marginBottom:8 }}>Napomene ovog meseca:</p>
          {notes.map(([d,dd])=>(
            <div key={d} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 12px', background:'#FAFAF9', borderRadius:10, marginBottom:4 }}>
              <span style={{ fontFamily:MF, fontWeight:700, fontSize:12, color:G, minWidth:28 }}>{d}.</span>
              <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:14, color:'#57534E', flex:1 }}>{dd.note}</span>
              <button onClick={()=>onUpdate(eid,month,+d,{...dd,note:''})} style={{ background:'none', border:'none', cursor:'pointer', color:'#C8C4BC', padding:0 }}><X size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Teren form fields (deljeno: dodavanje + izmena) ─────────────────────────────
const TerenFields = ({ employees, val, set, pRSD }) => {
  const setW   = (i,patch) => set({ ...val, workers: val.workers.map((w,j)=>j===i?{...w,...patch}:w) });
  const addRow = () => set({ ...val, workers:[...val.workers, { eid:'', systems:'' }] });
  const delRow = (i) => set({ ...val, workers: val.workers.filter((_,j)=>j!==i) });
  const totSys = val.workers.reduce((a,w)=>a+(parseFloat(w.systems)||0),0);
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:14 }}>
        <Field label="Datum terena" type="date" value={val.date} onChange={e=>set({ ...val, date:e.target.value })}/>
        <Field label="Lokacija" type="text" placeholder="npr. Novi Sad, Liman" value={val.location} onChange={e=>set({ ...val, location:e.target.value })}/>
        <Field label="Napomena" type="text" placeholder="..." value={val.note} onChange={e=>set({ ...val, note:e.target.value })}/>
      </div>
      <FL>Ko je išao i koliko sistema</FL>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
        {val.workers.map((w,i)=>(
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ flex:1 }}>
              <select value={w.eid} onChange={e=>setW(i,{ eid:e.target.value })}
                style={{ width:'100%', padding:'10px 13px', background:'#FAFAF9', border:'1.5px solid #E9E5DE', borderRadius:11, fontSize:13, fontFamily:MF, fontWeight:500, outline:'none', color:A }}>
                <option value="">Izaberi radnika...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ width:110 }}>
              <FI type="number" placeholder="sistema" value={w.systems} onChange={e=>setW(i,{ systems:e.target.value })} style={{ padding:'10px 12px' }}/>
            </div>
            <button onClick={()=>delRow(i)} title="Ukloni" style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:8, cursor:'pointer', color:'#EF4444', flexShrink:0 }}><X size={15}/></button>
          </div>
        ))}
      </div>
      <button onClick={addRow} style={{ background:'none', border:`1.5px dashed ${G}80`, borderRadius:11, padding:'8px 14px', cursor:'pointer', color:GD, fontFamily:MF, fontWeight:700, fontSize:12, display:'inline-flex', alignItems:'center', gap:6, marginBottom:12 }}>
        <Plus size={14}/> Dodaj radnika
      </button>
      <div style={{ background:GL, borderRadius:12, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:GD }}>Ukupno sistema: <strong style={{ fontFamily:MF, fontStyle:'normal' }}>{totSys}</strong></span>
        <span style={{ fontFamily:MF, fontWeight:700, fontSize:13, color:A }}>Bonus: {fmt(totSys*pRSD)} RSD</span>
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
const ProhorecaApp = () => {
  const [appName, setAppName]           = useState('Prohoreca');
  const [eurRate, setEurRate]           = useState(117.5);
  const [pergolaBonus, setPergolaBonus] = useState(10);
  const [employees, setEmployees]       = useState([]);
  const [attendance, setAttendance]     = useState({});
  const [records, setRecords]           = useState([]);
  const [payments, setPayments]         = useState([]);
  const [tereni, setTereni]             = useState([]);
  const [tab, setTab]                   = useState('workers');
  const [month, setMonth]               = useState(now);
  const [attEmp, setAttEmp]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [rateLoading, setRateLoading]   = useState(false);
  const [toast, setToast]               = useState('');
  const [annualYear, setAnnualYear]     = useState(()=>new Date().getFullYear());

  // Worker form
  const [newEmp, setNewEmp]   = useState({ name:'', agreedSalary:'', terenNaknada:'' });
  const [editEmp, setEditEmp] = useState(null);
  // Record form
  const [recForm, setRecForm] = useState({ eid:'', numDnevnica:'', numPergola:'', note:'' });
  const [editRec, setEditRec] = useState(null);
  // Payment form
  const [payForm, setPayForm] = useState({ eid:'', amount:'', date:'', method:'cash', note:'' });
  // Teren form
  const blankTeren = { date:'', location:'', note:'', workers:[{ eid:'', systems:'' }] };
  const [terenForm, setTerenForm] = useState(blankTeren);
  const [editTeren, setEditTeren] = useState(null);

  const showErr = (msg) => { setToast(msg); setTimeout(()=>setToast(''),4000); };

  // ── Load from server ──
  useEffect(()=>{
    const load = async () => {
      try {
        const [sett, emps, att, recs, pays, ters] = await Promise.all([
          api.getSettings(), api.getEmployees(), api.getAttendance(), api.getRecords(), api.getPayments(), api.getTereni()
        ]);
        if (sett && !sett.error) {
          setAppName(sett.app_name || 'Prohoreca');
          setEurRate(parseFloat(sett.eur_rate) || 117.5);
          setPergolaBonus(parseFloat(sett.pergola_bonus_eur) || 10);
        }
        if (Array.isArray(emps)) setEmployees(emps.map(toEmp));
        if (Array.isArray(att)) setAttendance(toAtt(att));
        if (Array.isArray(recs)) setRecords(recs.map(toRec));
        if (Array.isArray(pays)) setPayments(pays.map(toPay));
        if (Array.isArray(ters)) setTereni(ters.map(toTeren));
      } catch(e) {
        showErr('Ne mogu da se povežem sa serverom. Provjeri config.php.');
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ── Settings ──
  const handleSetAppName = async (n) => {
    setAppName(n);
    try { await api.setSetting('app_name', n); } catch { showErr('Naziv nije snimljen.'); }
  };
  const handleSetEurRate = async (r) => {
    setEurRate(r);
    try { await api.setSetting('eur_rate', r); } catch { showErr('Kurs nije snimljen.'); }
  };
  const handleSetPergolaBonus = async (b) => {
    setPergolaBonus(b);
    try { await api.setSetting('pergola_bonus_eur', b); } catch { showErr('Bonus nije snimljen.'); }
  };

  // ── NBS rate ──
  const fetchRate = async () => {
    setRateLoading(true);
    try {
      const r = await fetch('/api/eur-rate.php');
      if (r.ok) { const d = await r.json(); if(d.rate){ handleSetEurRate(d.rate); } }
    } catch {}
    setRateLoading(false);
  };

  // ── Calculations ──
  const pRSD = () => (pergolaBonus||10)*(eurRate||117.5);
  // Osnova = dnevnica(mesec) × odrađeni dani. Bez kalendara = puna plata.
  const calcBase = (eid,m) => {
    const emp=employees.find(e=>e.id===eid);
    if(!emp) return 0;
    if(!hasAtt(eid,m,attendance)) return emp.agreedSalary||0;
    const[y,mo]=m.split('-').map(Number); const m0=mo-1;
    const sd=stdDays(y,m0); if(sd<=0) return emp.agreedSalary||0;
    const wd=cntW(y,m0,eid,m,attendance);
    return Math.round((emp.agreedSalary||0)*wd/sd);
  };
  // Broj sistema (pergola) sa terena za radnika u mesecu
  const terenSystems = (eid,m) => tereni.filter(t=>t.month===m)
    .reduce((s,t)=> s + t.workers.filter(w=>w.eid===eid).reduce((a,w)=>a+(w.systems||0),0), 0);
  const terenVisits  = (eid,m) => tereni.filter(t=>t.month===m && t.workers.some(w=>w.eid===eid)).length;
  // Dodaci = pergole sa terena + ručne pergole + naknada za odlazak na teren
  const calcExtras = (eid,m) => {
    const emp=employees.find(e=>e.id===eid);
    const rec=records.find(r=>r.eid===eid&&r.month===m);
    const manual=(rec?.numPergola||0);
    const pergolaRSD=(terenSystems(eid,m)+manual)*pRSD();
    const naknadaRSD=terenVisits(eid,m)*(emp?.terenNaknada||0);
    return pergolaRSD+naknadaRSD;
  };
  const calcTotal    = (eid,m) => { const emp=employees.find(e=>e.id===eid); if(!emp)return null; return calcBase(eid,m)+calcExtras(eid,m); };
  const totalMonth   = (m) => employees.reduce((s,e)=>s+Math.max(0,calcTotal(e.id,m)??0),0);
  const totalPaid    = (eid,m) => payments.filter(p=>p.eid===eid&&p.month===m).reduce((s,p)=>s+(p.amount||0),0);

  // ── Attendance ──
  const updAtt = async (eid,m,d,dd) => {
    setAttendance(prev=>({ ...prev, [eid]:{ ...(prev[eid]||{}), [m]:{ ...(prev[eid]?.[m]||{}), [d]:dd } } }));
    try {
      await api.upsertAttendance({ employee_id:eid, month:m, day:d, state:dd.state||null, note:dd.note||'' });
    } catch { showErr('Prisustvo nije snimljeno.'); }
  };

  // ── Workers ──
  const addEmp = async () => {
    if(!newEmp.name.trim()||!newEmp.agreedSalary) return;
    try {
      const created = await api.addEmployee({ name:newEmp.name.trim(), agreed_salary:parseFloat(newEmp.agreedSalary)||0, dnevnica:0, teren_naknada:parseFloat(newEmp.terenNaknada)||0 });
      if(created?.error) return showErr(created.error);
      setEmployees(p=>[...p, toEmp(created)]);
      setNewEmp({ name:'', agreedSalary:'', dnevnica:'' });
    } catch { showErr('Radnik nije dodat.'); }
  };
  const saveEmp = async () => {
    if(!editEmp?.name.trim()) return;
    try {
      const updated = await api.updateEmployee(editEmp.id, { name:editEmp.name.trim(), agreed_salary:parseFloat(editEmp.agreedSalary)||0, dnevnica:0, teren_naknada:parseFloat(editEmp.terenNaknada)||0 });
      if(updated?.error) return showErr(updated.error);
      setEmployees(p=>p.map(e=>e.id===editEmp.id?toEmp(updated):e));
      setEditEmp(null);
    } catch { showErr('Izmjena nije snimljena.'); }
  };
  const delEmp = async (id) => {
    if(!window.confirm('Obrisati radnika i sve podatke?')) return;
    try {
      await api.deleteEmployee(id);
      setEmployees(p=>p.filter(e=>e.id!==id));
      setRecords(p=>p.filter(r=>r.eid!==id));
      setPayments(p=>p.filter(p2=>p2.eid!==id));
      setAttendance(prev=>{ const n={...prev}; delete n[id]; return n; });
    } catch { showErr('Brisanje nije uspjelo.'); }
  };

  // ── Records ──
  const addRec = async () => {
    if(!recForm.eid) return;
    const eid=parseInt(recForm.eid);
    try {
      const created = await api.addRecord({ employee_id:eid, month, num_dnevnica:parseFloat(recForm.numDnevnica)||0, num_pergola:parseFloat(recForm.numPergola)||0, note:recForm.note });
      if(created?.error) return showErr(created.error);
      setRecords(p=>[...p, toRec(created)]);
      setRecForm({ eid:'', numDnevnica:'', numPergola:'', note:'' });
    } catch { showErr('Obračun nije dodat.'); }
  };
  const saveRec = async () => {
    try {
      const updated = await api.updateRecord(editRec.id, { num_dnevnica:parseFloat(editRec.numDnevnica)||0, num_pergola:parseFloat(editRec.numPergola)||0, note:editRec.note });
      if(updated?.error) return showErr(updated.error);
      setRecords(p=>p.map(r=>r.id===editRec.id?toRec(updated):r));
      setEditRec(null);
    } catch { showErr('Izmjena nije snimljena.'); }
  };
  const delRec = async (id) => {
    if(!window.confirm('Obrisati obračun?')) return;
    try { await api.deleteRecord(id); setRecords(p=>p.filter(r=>r.id!==id)); }
    catch { showErr('Brisanje nije uspjelo.'); }
  };

  // ── Payments ──
  const addPay = async () => {
    if(!payForm.eid||!payForm.amount) return;
    try {
      const created = await api.addPayment({ employee_id:parseInt(payForm.eid), month, amount:parseFloat(payForm.amount)||0, date:payForm.date||new Date().toISOString().split('T')[0], method:payForm.method, note:payForm.note });
      if(created?.error) return showErr(created.error);
      setPayments(p=>[...p, toPay(created)]);
      setPayForm({ eid:'', amount:'', date:'', method:'cash', note:'' });
    } catch { showErr('Isplata nije evidentirana.'); }
  };
  const delPay = async (id) => {
    if(!window.confirm('Obrisati isplatu?')) return;
    try { await api.deletePayment(id); setPayments(p=>p.filter(p2=>p2.id!==id)); }
    catch { showErr('Brisanje nije uspjelo.'); }
  };

  // ── Tereni ──
  const cleanWorkers = (ws) => (ws||[]).filter(w=>w.eid).map(w=>({ employee_id:parseInt(w.eid), systems:parseFloat(w.systems)||0 }));
  const addTeren = async () => {
    if(!terenForm.date) return showErr('Unesi datum terena.');
    try {
      const created = await api.addTeren({ teren_date:terenForm.date, location:terenForm.location, note:terenForm.note, workers:cleanWorkers(terenForm.workers) });
      if(created?.error) return showErr(created.error);
      setTereni(p=>[toTeren(created), ...p]);
      setTerenForm(blankTeren);
    } catch { showErr('Teren nije dodat.'); }
  };
  const saveTeren = async () => {
    if(!editTeren?.date) return showErr('Unesi datum terena.');
    try {
      const updated = await api.updateTeren(editTeren.id, { teren_date:editTeren.date, location:editTeren.location, note:editTeren.note, workers:cleanWorkers(editTeren.workers) });
      if(updated?.error) return showErr(updated.error);
      setTereni(p=>p.map(t=>t.id===editTeren.id?toTeren(updated):t));
      setEditTeren(null);
    } catch { showErr('Izmjena nije snimljena.'); }
  };
  const delTeren = async (id) => {
    if(!window.confirm('Obrisati teren?')) return;
    try { await api.deleteTeren(id); setTereni(p=>p.filter(t=>t.id!==id)); }
    catch { showErr('Brisanje nije uspjelo.'); }
  };

  // ── PDF — monthly ──
  const genMonthPDF = async () => {
    try {
      const jsPDF=(await import('jspdf')).default;
      const doc=new jsPDF(); const pw=doc.internal.pageSize.width; const mg=20; let y=28;
      doc.setFontSize(16); doc.setFont(undefined,'bold');
      doc.text(`OBRACUN ZARADA — ${appName.toUpperCase()}`,pw/2,y,{align:'center'}); y+=8;
      doc.setFontSize(10); doc.setFont(undefined,'normal');
      doc.text(`${fmtM(month)} · Datum: ${new Date().toLocaleDateString('sr-RS')} · Kurs: ${eurRate} RSD/€ · Pergola: ${pergolaBonus} EUR`,pw/2,y,{align:'center'}); y+=16;
      doc.setFontSize(13); doc.setFont(undefined,'bold'); doc.setTextColor(100,130,30);
      doc.text(`UKUPNO: ${fmt(totalMonth(month))} RSD (${fmtEur(totalMonth(month),eurRate)})`,pw/2,y,{align:'center'}); y+=16; doc.setTextColor(0,0,0);
      employees.forEach(emp=>{
        if(y>255){doc.addPage();y=24;}
        const[yr,mo]=month.split('-').map(Number); const m0=mo-1;
        const sd=stdDays(yr,m0); const wd=hasAtt(emp.id,month,attendance)?cntW(yr,m0,emp.id,month,attendance):sd;
        const base=calcBase(emp.id,month);
        const rec=records.find(r=>r.eid===emp.id&&r.month===month);
        const total=calcTotal(emp.id,month);
        doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.text(emp.name,mg,y); y+=7;
        doc.setFontSize(9); doc.setFont(undefined,'normal');
        doc.text(`Plata: ${fmt(emp.agreedSalary)} RSD · Dnevnica: ${fmt(dnevnicaFor(emp.agreedSalary,yr,m0))} RSD`,mg+4,y); y+=5;
        doc.text(`Prisustvo: ${wd}/${sd} dana · Osnova: ${fmt(base)} RSD`,mg+4,y); y+=5;
        const sysM=terenSystems(emp.id,month);
        if(sysM>0){doc.setTextColor(0,100,0);doc.text(`Pergole (tereni): ${sysM}x ${fmt(pRSD())} = ${fmt(sysM*pRSD())} RSD`,mg+4,y);y+=5;doc.setTextColor(0,0,0);}
        if(rec?.numPergola>0){doc.setTextColor(0,100,0);doc.text(`Pergole (rucno): ${rec.numPergola}x ${fmt(pRSD())} = ${fmt(rec.numPergola*pRSD())} RSD`,mg+4,y);y+=5;doc.setTextColor(0,0,0);}
        const naknadaM=terenVisits(emp.id,month)*(emp.terenNaknada||0);
        if(naknadaM>0){doc.setTextColor(0,100,0);doc.text(`Naknada za teren: ${terenVisits(emp.id,month)}x ${fmt(emp.terenNaknada)} = ${fmt(naknadaM)} RSD`,mg+4,y);y+=5;doc.setTextColor(0,0,0);}
        doc.setFont(undefined,'bold'); doc.setTextColor(0,110,0);
        doc.text(`GOTOVINA: ${fmt(total)} RSD (${fmtEur(total,eurRate)})`,mg+4,y); y+=5;
        const paid=totalPaid(emp.id,month);
        if(paid>0){doc.setTextColor(0,0,200);doc.text(`Isplaceno: ${fmt(paid)} RSD · Ostatak: ${fmt((total||0)-paid)} RSD`,mg+4,y);y+=5;}
        doc.setTextColor(0,0,0); y+=8;
        doc.setDrawColor(220,215,200); doc.line(mg,y-4,pw-mg,y-4); y+=4;
      });
      const pgs=doc.internal.getNumberOfPages();
      for(let i=1;i<=pgs;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(160,160,160);doc.text('by AG GROUP',pw/2,doc.internal.pageSize.height-10,{align:'center'});doc.text(`${i}/${pgs}`,pw-mg,doc.internal.pageSize.height-10,{align:'right'});}
      doc.save(`${appName}_${month}.pdf`);
    } catch(err){console.error(err);}
  };

  // ── PDF — individual payslip ──
  const genPayslipPDF = async (eid, m) => {
    const emp=employees.find(e=>e.id===eid); if(!emp) return;
    try {
      const jsPDF=(await import('jspdf')).default;
      const doc=new jsPDF(); const pw=doc.internal.pageSize.width; const mg=20; let y=30;
      doc.setFillColor(28,28,30); doc.rect(0,0,pw,50,'F');
      doc.setFontSize(18); doc.setFont(undefined,'bold'); doc.setTextColor(201,168,76); doc.text(appName,mg,22);
      doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(180,180,180); doc.text('ISPLATNI LISTIC',mg,32);
      doc.setTextColor(255,255,255); doc.text(`${fmtM(m)} · ${new Date().toLocaleDateString('sr-RS')}`,pw-mg,32,{align:'right'});
      y=65;
      doc.setTextColor(0,0,0); doc.setFontSize(14); doc.setFont(undefined,'bold'); doc.text(emp.name,mg,y); y+=8;
      doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(100,100,100);
      const[yr,mo]=m.split('-').map(Number); const m0=mo-1;
      const sd=stdDays(yr,m0), wd=hasAtt(eid,m,attendance)?cntW(yr,m0,eid,m,attendance):sd;
      doc.text(`Ugovorena mesecna plata: ${fmt(emp.agreedSalary)} RSD`,mg,y); y+=5;
      doc.text(`Dnevnica (${fmtM(m)}): ${fmt(dnevnicaFor(emp.agreedSalary,yr,m0))} RSD  (${sd} radnih dana)`,mg,y); y+=14;
      const base=calcBase(eid,m);
      const rec=records.find(r=>r.eid===eid&&r.month===m);
      const drawRow=(label,value,color)=>{ if(color)doc.setTextColor(...color);else doc.setTextColor(30,30,30); doc.setFontSize(10); doc.setFont(undefined,'normal'); doc.text(label,mg,y); doc.setFont(undefined,'bold'); doc.text(value,pw-mg,y,{align:'right'}); y+=8; doc.setTextColor(30,30,30); };
      doc.setFontSize(9); doc.setTextColor(120,120,120); doc.text('OBRACUN',mg,y); y+=5;
      doc.setDrawColor(220,215,200); doc.line(mg,y,pw-mg,y); y+=5;
      drawRow(`Osnovna plata (${wd}/${sd} dana)`,`${fmt(base)} RSD`);
      const sysP=terenSystems(eid,m);
      if(sysP>0) drawRow(`Pergole (tereni): ${sysP}x ${fmt(pRSD())} RSD`,`${fmt(sysP*pRSD())} RSD`,[0,110,0]);
      if(rec?.numPergola>0) drawRow(`Pergole (rucno): ${rec.numPergola}x ${fmt(pRSD())} RSD`,`${fmt(rec.numPergola*pRSD())} RSD`,[0,110,0]);
      const naknadaPS=terenVisits(eid,m)*(emp.terenNaknada||0);
      if(naknadaPS>0) drawRow(`Naknada za teren: ${terenVisits(eid,m)}x ${fmt(emp.terenNaknada)} RSD`,`${fmt(naknadaPS)} RSD`,[0,110,0]);
      const notes=Object.entries(attendance[eid]?.[m]||{}).filter(([,dd])=>dd?.note);
      if(notes.length>0){ y+=4; doc.setFontSize(9); doc.setTextColor(120,120,120); doc.text('NAPOMENE',mg,y); y+=5; doc.line(mg,y,pw-mg,y); y+=5; notes.sort(([a],[b])=>+a-+b).forEach(([d,dd])=>{ doc.setFontSize(9); doc.setTextColor(100,90,0); doc.text(`${d}.  ${dd.note}`,mg+4,y); y+=6; }); }
      y+=6; doc.line(mg,y,pw-mg,y); y+=8;
      const total=calcTotal(eid,m)||0;
      doc.setFontSize(13); doc.setFont(undefined,'bold'); doc.setTextColor(0,110,0);
      doc.text('UKUPNO ZA ISPLATU',mg,y); doc.text(`${fmt(total)} RSD`,pw-mg,y,{align:'right'}); y+=7;
      doc.setFontSize(10); doc.setFont(undefined,'normal'); doc.setTextColor(100,150,50); doc.text(`(${fmtEur(total,eurRate)})`,pw-mg,y,{align:'right'}); y+=5;
      const paid=totalPaid(eid,m);
      if(paid>0){ doc.setTextColor(0,0,200); doc.setFontSize(10); doc.text(`Isplaceno: ${fmt(paid)} RSD`,pw-mg,y+5,{align:'right'}); doc.text(`Ostatak: ${fmt(total-paid)} RSD`,pw-mg,y+12,{align:'right'}); y+=18; }
      y+=20; doc.setDrawColor(180,180,180); doc.line(mg,y,mg+60,y); doc.line(pw-mg-60,y,pw-mg,y);
      doc.setFontSize(8); doc.setTextColor(160,160,160); doc.text('Radnik',mg+30,y+5,{align:'center'}); doc.text('Poslodavac',pw-mg-30,y+5,{align:'center'});
      doc.setFontSize(7); doc.setTextColor(180,180,180); doc.text('by AG GROUP',pw/2,doc.internal.pageSize.height-10,{align:'center'});
      doc.save(`Listic_${emp.name.replace(/\s+/g,'_')}_${m}.pdf`);
    } catch(err){console.error(err);}
  };

  // ── PDF — tereni report ──
  const genTereniPDF = async () => {
    try {
      const jsPDF=(await import('jspdf')).default;
      const doc=new jsPDF(); const pw=doc.internal.pageSize.width; const mg=20; let y=28;
      doc.setFontSize(16); doc.setFont(undefined,'bold');
      doc.text(`IZVESTAJ TERENA — ${appName.toUpperCase()}`,pw/2,y,{align:'center'}); y+=8;
      doc.setFontSize(10); doc.setFont(undefined,'normal');
      doc.text(`${fmtM(month)} · ${new Date().toLocaleDateString('sr-RS')} · Bonus pergola: ${pergolaBonus} EUR`,pw/2,y,{align:'center'}); y+=14;
      const mt=tereni.filter(t=>t.month===month);
      if(mt.length===0){
        doc.setFontSize(11); doc.setTextColor(150,150,150);
        doc.text(`Nema evidentiranih terena za ${fmtM(month)}.`,pw/2,y,{align:'center'});
      } else {
        mt.forEach((t,idx)=>{
          if(y>230){doc.addPage();y=24;}
          const totSys=t.workers.reduce((a,w)=>a+(w.systems||0),0);
          doc.setFontSize(11); doc.setFont(undefined,'bold'); doc.setTextColor(28,28,30);
          doc.text(`${idx+1}.  ${t.location||'Teren'}`,mg,y);
          doc.setFontSize(9); doc.setFont(undefined,'normal'); doc.setTextColor(100,100,100);
          doc.text(t.date?new Date(t.date).toLocaleDateString('sr-RS'):'',pw-mg,y,{align:'right'}); y+=6;
          doc.setFontSize(9); doc.setTextColor(70,70,70);
          doc.text(`Ukupno sistema: ${totSys}  ·  Bonus: ${fmt(totSys*pRSD())} RSD`,mg+4,y); y+=5;
          t.workers.forEach(w=>{
            if(y>260){doc.addPage();y=24;}
            const emp=employees.find(e=>e.id===w.eid);
            const naknada=emp?.terenNaknada||0;
            doc.setTextColor(40,40,40);
            doc.text(`  ${emp?.name||w.name||'?'}`,mg+4,y);
            doc.text(`${w.systems} sist. → ${fmt(w.systems*pRSD())} RSD${naknada>0?`  +  naknada ${fmt(naknada)} RSD`:''}`,mg+72,y); y+=5;
          });
          if(t.note){doc.setFontSize(8);doc.setTextColor(140,140,140);doc.text(`  Napomena: ${t.note}`,mg+4,y);y+=5;doc.setFontSize(9);}
          y+=4; doc.setDrawColor(220,215,200); doc.line(mg,y-2,pw-mg,y-2); y+=4;
        });
        if(y>220){doc.addPage();y=24;}
        y+=4;
        doc.setFontSize(12); doc.setFont(undefined,'bold'); doc.setTextColor(0,0,0);
        doc.text('REZIME PO RADNIKU',mg,y); y+=4;
        doc.setDrawColor(201,168,76); doc.setLineWidth(0.7); doc.line(mg,y,pw-mg,y); doc.setLineWidth(0.2); y+=8;
        employees.forEach(emp=>{
          const visits=terenVisits(emp.id,month);
          if(!visits) return;
          if(y>260){doc.addPage();y=24;}
          const sys=terenSystems(emp.id,month);
          const naknada=visits*(emp.terenNaknada||0);
          const sysBonus=sys*pRSD();
          doc.setFontSize(10); doc.setFont(undefined,'bold'); doc.setTextColor(28,28,30);
          doc.text(emp.name,mg,y);
          doc.setFont(undefined,'normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
          doc.text(`${visits} teren${visits>1?'a':''}  ·  ${sys} sistema → ${fmt(sysBonus)} RSD${naknada>0?`  ·  naknada ${fmt(naknada)} RSD`:''}`,mg+58,y); y+=5;
          doc.setFont(undefined,'bold'); doc.setTextColor(0,110,0);
          doc.text(`Ukupno: ${fmt(sysBonus+naknada)} RSD`,mg+4,y); y+=8; doc.setTextColor(0,0,0);
        });
      }
      const pgs=doc.internal.getNumberOfPages();
      for(let i=1;i<=pgs;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(160,160,160);doc.text('by AG GROUP',pw/2,doc.internal.pageSize.height-10,{align:'center'});doc.text(`${i}/${pgs}`,pw-mg,doc.internal.pageSize.height-10,{align:'right'});}
      doc.save(`${appName}_Tereni_${month}.pdf`);
    } catch(err){console.error(err);}
  };

  // ── Derived ──
  const monthRecs  = () => records.filter(r=>r.month===month);
  const monthPays  = () => payments.filter(p=>p.month===month);
  const selEmpForRec = employees.find(e=>e.id===parseInt(recForm.eid));
  const previewTotal = selEmpForRec
    ? calcBase(selEmpForRec.id,month)+(parseFloat(recForm.numPergola)||0)*pRSD()
    : null;
  const attEmpObj  = employees.find(e=>e.id===attEmp);
  const [attY,attMo0] = attEmpObj ? month.split('-').map((n,i)=>i===0?+n:+n-1) : [0,0];
  const attStd = attEmpObj ? stdDays(attY,attMo0) : 0;  // norma radnih dana (pon–pet + subote−2)
  const attHas = attEmpObj ? hasAtt(attEmpObj.id,month,attendance) : false;
  const attWkd = attEmpObj ? (attHas ? cntW(attY,attMo0,attEmpObj.id,month,attendance) : attStd) : 0;  // odrađeni
  const prevMonth=()=>{ const d=new Date(`${month}-01`); d.setMonth(d.getMonth()-1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); };
  const nextMonth=()=>{ const d=new Date(`${month}-01`); d.setMonth(d.getMonth()+1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); };

  const TABS=[
    {k:'workers',   l:'Radnici',   I:Users},
    {k:'attendance',l:'Prisustvo', I:Calendar},
    {k:'tereni',    l:'Tereni',    I:MapPin},
    {k:'payroll',   l:'Obračun',   I:Calculator},
    {k:'payments',  l:'Isplate',   I:CreditCard},
    {k:'annual',    l:'Godišnji',  I:TrendingUp},
  ];

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if(loading) return (
    <div style={{ minHeight:'100vh', background:CR, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:MF }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:16, background:GL, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <RefreshCw size={24} color={G} style={{ animation:'spin 1s linear infinite' }}/>
        </div>
        <p style={{ fontFamily:CF, fontStyle:'italic', color:'#9CA3AF', fontSize:16 }}>Učitavanje podataka...</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:CR, fontFamily:MF }}>
      <Toast msg={toast} onClose={()=>setToast('')}/>
      <div style={{ maxWidth:780, margin:'0 auto' }}>
        {/* ── HEADER ── */}
        <header style={{ background:`linear-gradient(160deg,${A} 0%,${A2} 60%,#1a2818 100%)`, padding:'28px 24px 0', borderRadius:'0 0 28px 28px', boxShadow:`0 8px 40px ${A}60` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
            <div>
              <InlineName value={appName} onSave={handleSetAppName} light/>
              <p style={{ fontFamily:CF, fontStyle:'italic', color:`${G}80`, fontSize:14, margin:'4px 0 0' }}>Bioklimatske pergole · Obračun zarada</p>
            </div>
            <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:`${G}50`, paddingTop:4 }}>by AG GROUP</span>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 28px', alignItems:'center', marginBottom:20 }}>
            <InlineSetting label="Kurs EUR" value={eurRate} suffix="RSD" onSave={handleSetEurRate}/>
            <InlineSetting label="Bonus / pergola" value={pergolaBonus} suffix="EUR" onSave={handleSetPergolaBonus}/>
            <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:`${G}70` }}>1 pergola = <strong style={{ color:G, fontFamily:MF }}>{fmt(pRSD())} RSD</strong></span>
            <button onClick={fetchRate} disabled={rateLoading} title="Preuzmi kurs sa NBS"
              style={{ background:'none', border:`1px solid ${G}40`, borderRadius:8, padding:'4px 10px', cursor:'pointer', color:rateLoading?`${G}50`:G, fontFamily:MF, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
              <RefreshCw size={12} style={{ animation:rateLoading?'spin 1s linear infinite':'none' }}/> NBS kurs
            </button>
          </div>
          <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.05)', padding:4, borderRadius:16 }}>
            {TABS.map(({k,l,I})=>(
              <button key={k} onClick={()=>setTab(k)}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'10px 4px', borderRadius:13, border:'none', cursor:'pointer', fontFamily:MF, fontWeight:700, fontSize:11, transition:'all .2s', background:tab===k?'#fff':'transparent', color:tab===k?A:'rgba(255,255,255,0.45)', boxShadow:tab===k?'0 2px 12px rgba(0,0,0,0.15)':'none' }}>
                <I size={14}/><span className="hidden sm:inline">{l}</span>
              </button>
            ))}
          </div>
        </header>

        <main style={{ padding:'20px 16px', paddingBottom:60 }}>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

          {/* ── RADNICI ── */}
          {tab==='workers'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:22 }}>
                <p style={{ fontFamily:CF, fontStyle:'italic', color:A2, fontSize:16, marginBottom:16 }}>Dodaj radnika</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
                  <Field label="Ime i prezime" type="text" placeholder="npr. Marko Marković" value={newEmp.name} onChange={e=>setNewEmp({...newEmp,name:e.target.value})} onKeyDown={e=>e.key==='Enter'&&addEmp()}/>
                  <Field label="Mesečna plata (RSD)" type="number" placeholder="0" value={newEmp.agreedSalary} onChange={e=>setNewEmp({...newEmp,agreedSalary:e.target.value})} onKeyDown={e=>e.key==='Enter'&&addEmp()}/>
                  <Field label="Naknada za teren (RSD)" type="number" placeholder="0" value={newEmp.terenNaknada} onChange={e=>setNewEmp({...newEmp,terenNaknada:e.target.value})} onKeyDown={e=>e.key==='Enter'&&addEmp()}/>
                </div>
                <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#A8A29E', margin:'0 0 14px' }}>Dnevnica se računa automatski (plata ÷ radni dani u mesecu).</p>
                <Btn onClick={addEmp}><Plus size={15}/> Dodaj radnika</Btn>
              </Card>
              {employees.map(emp=>(
                <Card key={emp.id} style={{ padding:18 }}>
                  {editEmp?.id===emp.id ? (
                    <div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:12 }}>
                        <Field label="Ime i prezime" type="text" value={editEmp.name} onChange={e=>setEditEmp(p=>({...p,name:e.target.value}))}/>
                        <Field label="Mesečna plata" type="number" value={editEmp.agreedSalary} onChange={e=>setEditEmp(p=>({...p,agreedSalary:e.target.value}))}/>
                        <Field label="Naknada za teren" type="number" value={editEmp.terenNaknada} onChange={e=>setEditEmp(p=>({...p,terenNaknada:e.target.value}))}/>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <Btn onClick={saveEmp} sm><Check size={14}/> Sačuvaj</Btn>
                        <Btn v="ghost" onClick={()=>setEditEmp(null)} sm><X size={14}/> Otkaži</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <Avatar name={emp.name}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:MF, fontWeight:800, fontSize:15, color:A, margin:'0 0 4px' }}>{emp.name}</p>
                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#78716C' }}>Plata: <strong style={{ color:A2, fontFamily:MF, fontStyle:'normal' }}>{fmt(emp.agreedSalary)} RSD</strong></span>
                          <span style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#78716C' }}>Dnevnica ({fmtM(month).split(' ')[0].toLowerCase()}): <strong style={{ color:G, fontFamily:MF, fontStyle:'normal' }}>{fmt(dnevnicaFor(emp.agreedSalary,...month.split('-').map((n,i)=>i===0?+n:+n-1)))} RSD</strong></span>
                          {(emp.terenNaknada||0)>0&&<span style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#78716C' }}>Naknada/teren: <strong style={{ color:A2, fontFamily:MF, fontStyle:'normal' }}>{fmt(emp.terenNaknada)} RSD</strong></span>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:4 }}>
                        <Btn v="ghost" sm onClick={()=>setEditEmp({id:emp.id,name:emp.name,agreedSalary:String(emp.agreedSalary),terenNaknada:String(emp.terenNaknada)})} style={{ border:'none', padding:8 }}><Edit2 size={15} color={G}/></Btn>
                        <Btn v="ghost" sm onClick={()=>delEmp(emp.id)} style={{ border:'none', padding:8 }}><Trash2 size={15} color="#EF4444"/></Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              {employees.length===0&&<Empty Icon={Users} text="Nema radnika — dodaj prvog iznad."/>}
            </div>
          )}

          {/* ── PRISUSTVO ── */}
          {tab==='attendance'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:A2 }}><ChevronLeft size={16}/></button>
                  <span style={{ fontFamily:MF, fontWeight:700, fontSize:16, color:A, flex:1, textAlign:'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:A2 }}><ChevronRight size={16}/></button>
                </div>
                <SelEl label="Radnik" value={attEmp||''} onChange={e=>setAttEmp(e.target.value?parseInt(e.target.value):null)}>
                  <option value="">Izaberi radnika...</option>
                  {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                </SelEl>
              </Card>
              {attEmpObj&&(<>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[
                    {l:'Norma dana',v:`${attStd}`,sub:'pon–pet + subote −2'},
                    {l:'Odrađeno',v:`${attWkd}`,sub:attWkd>attStd?`+${attWkd-attStd} dodatnih`:attWkd<attStd?`${attStd-attWkd} manje`:'po normi'},
                    {l:'Osnova plate',v:`${fmt(calcBase(attEmpObj.id,month))} RSD`,sub:attWkd>attStd?'iznad pune':attWkd<attStd?`pro-rata ${attWkd}/${attStd}`:'puna plata'},
                  ].map(({l,v,sub})=>(
                    <Card key={l} style={{ padding:'14px 16px', textAlign:'center' }}>
                      <p style={{ fontFamily:MF, fontWeight:700, fontSize:10, color:'#9CA3AF', letterSpacing:'0.07em', marginBottom:4 }}>{l.toUpperCase()}</p>
                      <p style={{ fontFamily:MF, fontWeight:800, fontSize:18, color:A, margin:'0 0 2px' }}>{v}</p>
                      <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:'#A8A29E', margin:0 }}>{sub}</p>
                    </Card>
                  ))}
                </div>
                <Card style={{ padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                    <Avatar name={attEmpObj.name} sz={36}/>
                    <div>
                      <p style={{ fontFamily:MF, fontWeight:800, fontSize:15, color:A, margin:0 }}>{attEmpObj.name}</p>
                      <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:'#9CA3AF', margin:0 }}>{fmtM(month)}</p>
                    </div>
                  </div>
                  <MonthCalendar eid={attEmpObj.id} month={month} att={attendance} onUpdate={updAtt}/>
                  <div style={{ display:'flex', gap:14, flexWrap:'wrap', margin:'14px 0 0', paddingTop:12, borderTop:'1px solid #F0EDE7' }}>
                    {[
                      {c:GL,   b:'#E0D09E', t:'Radni dan (pon–pet)'},
                      {c:G,    b:G,         t:'Radna subota / nedelja'},
                      {c:'#F3F4F6', b:'#E5E7EB', t:'Slobodan'},
                    ].map(({c,b,t})=>(
                      <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:MF, fontSize:11.5, color:'#78716C', fontWeight:600 }}>
                        <span style={{ width:15, height:15, borderRadius:5, background:c, border:`1.5px solid ${b}` }}/>{t}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12.5, color:'#A8A29E', margin:'10px 0 0', lineHeight:1.5 }}>
                    Dnevnica = mesečna plata ÷ {attStd} radnih dana = <strong style={{ fontFamily:MF, fontStyle:'normal', color:GD, fontWeight:600 }}>{fmt(dnevnicaFor(attEmpObj.agreedSalary,attY,attMo0))} RSD</strong>.
                    Norma već isključuje 2 slobodne subote. Pon–pet su podrazumevano radni — klikni <strong style={{ fontFamily:MF, fontStyle:'normal', color:GD, fontWeight:600 }}>radne subote i nedelje</strong> da ih označiš, a izostanak (pon–pet) da ga označiš slobodnim. Svaki radni dan = +1 dnevnica.
                  </p>
                </Card>
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <Btn onClick={()=>genPayslipPDF(attEmpObj.id,month)} v="dark"><FileText size={16}/> Isplatni listić — {attEmpObj.name}</Btn>
                </div>
              </>)}
              {!attEmpObj&&employees.length>0&&<Empty Icon={Calendar} text="Izaberi radnika da vidiš kalendar prisustva."/>}
              {employees.length===0&&<Empty Icon={Users} text="Dodaj radnike na kartici Radnici."/>}
            </div>
          )}

          {/* ── TERENI ── */}
          {tab==='tereni'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:'14px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronLeft size={16}/></button>
                  <span style={{ fontFamily:MF, fontWeight:700, fontSize:16, color:A, flex:1, textAlign:'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronRight size={16}/></button>
                </div>
              </Card>

              {employees.length===0
                ? <Empty Icon={Users} text="Prvo dodaj radnike na kartici Radnici."/>
                : (<>
                <Card style={{ padding:22 }}>
                  <p style={{ fontFamily:CF, fontStyle:'italic', color:A2, fontSize:16, marginBottom:14 }}>Novi teren — montaža</p>
                  <TerenFields employees={employees} val={terenForm} set={setTerenForm} pRSD={pRSD()}/>
                  <div style={{ marginTop:14 }}>
                    <Btn onClick={addTeren}><Plus size={15}/> Sačuvaj teren</Btn>
                  </div>
                </Card>

                {tereni.filter(t=>t.month===month).map(t=>{
                  const isEd=editTeren?.id===t.id;
                  const totSys=t.workers.reduce((a,w)=>a+(w.systems||0),0);
                  return (
                    <Card key={t.id} style={{ padding:18 }}>
                      {isEd ? (
                        <div>
                          <TerenFields employees={employees} val={editTeren} set={setEditTeren} pRSD={pRSD()}/>
                          <div style={{ display:'flex', gap:8, marginTop:14 }}>
                            <Btn onClick={saveTeren} sm><Check size={14}/> Sačuvaj</Btn>
                            <Btn v="ghost" onClick={()=>setEditTeren(null)} sm><X size={14}/> Otkaži</Btn>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                            <div style={{ width:44, height:44, borderRadius:13, background:GL, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <MapPin size={18} color={GD}/>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontFamily:MF, fontWeight:800, fontSize:15, color:A, margin:'0 0 2px' }}>{t.location||'Teren'}</p>
                              <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#9CA3AF', margin:0 }}>{t.date?new Date(t.date).toLocaleDateString('sr-RS'):''} · {totSys} sistema</p>
                            </div>
                            <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                              <Btn v="ghost" sm onClick={()=>setEditTeren({ id:t.id, date:t.date, location:t.location, note:t.note, workers:t.workers.length?t.workers.map(w=>({eid:String(w.eid),systems:String(w.systems)})):[{eid:'',systems:''}] })} style={{ border:'none', padding:7 }}><Edit2 size={14} color={G}/></Btn>
                              <Btn v="ghost" sm onClick={()=>delTeren(t.id)} style={{ border:'none', padding:7 }}><Trash2 size={14} color="#EF4444"/></Btn>
                            </div>
                          </div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:12 }}>
                            {t.workers.map((w,i)=>(
                              <Tag key={i} color="gold"><Layers size={11}/> {w.name||employees.find(e=>e.id===w.eid)?.name||'?'} · {w.systems} sist.</Tag>
                            ))}
                          </div>
                          {t.note&&<p style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:'#9CA3AF', margin:'10px 0 0' }}>{t.note}</p>}
                        </div>
                      )}
                    </Card>
                  );
                })}
                {tereni.filter(t=>t.month===month).length>0&&(
                  <div style={{ display:'flex', justifyContent:'center', paddingTop:8 }}>
                    <Btn onClick={genTereniPDF} v="dark"><Download size={17}/> Izveštaj terena PDF</Btn>
                  </div>
                )}
                {tereni.filter(t=>t.month===month).length===0&&<Empty Icon={MapPin} text={`Nema terena za ${fmtM(month)}`}/>}
              </>)}
            </div>
          )}

          {/* ── OBRAČUN ── */}
          {tab==='payroll'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:'14px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronLeft size={16}/></button>
                  <span style={{ fontFamily:MF, fontWeight:700, fontSize:16, color:A, flex:1, textAlign:'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronRight size={16}/></button>
                </div>
              </Card>
              <div style={{ background:`linear-gradient(145deg,${A} 0%,${A2} 50%,#1a2818 100%)`, borderRadius:24, padding:'28px 28px 24px', boxShadow:`0 12px 40px ${A}40` }}>
                <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:`${G}80`, margin:'0 0 4px' }}>Ukupna gotovina</p>
                <p style={{ fontFamily:MF, fontWeight:900, fontSize:38, color:'#fff', margin:'0 0 4px', letterSpacing:'-0.03em' }}>{fmt(totalMonth(month))} RSD</p>
                <p style={{ fontFamily:MF, fontWeight:600, fontSize:18, color:G, margin:'0 0 4px' }}>{fmtEur(totalMonth(month),eurRate)}</p>
                <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:`${G}60`, margin:0 }}>{appName} · {fmtM(month)}</p>
              </div>
              {employees.map(emp=>{
                const total=calcTotal(emp.id,month); const paid=totalPaid(emp.id,month);
                const[yr2,mo2]=month.split('-').map(Number); const m02=mo2-1;
                const wdCnt=hasAtt(emp.id,month,attendance)?cntW(yr2,m02,emp.id,month,attendance):stdDays(yr2,m02);
                const sdCnt=stdDays(yr2,m02);
                const sys=terenSystems(emp.id,month);
                const rec=records.find(r=>r.eid===emp.id&&r.month===month);
                const manualP=(rec?.numPergola||0);
                return (
                  <Card key={emp.id} style={{ padding:18 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      <Avatar name={emp.name} sz={40}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:MF, fontWeight:800, fontSize:15, color:A, margin:'0 0 6px' }}>{emp.name}</p>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          <Tag color="gray">Osnova: {fmt(calcBase(emp.id,month))} RSD <span style={{ color:'#9CA3AF', fontWeight:400 }}>({wdCnt}/{sdCnt}d)</span></Tag>
                          {sys>0&&<Tag color="gold"><MapPin size={11}/> {sys}× pergola = {fmt(sys*pRSD())} RSD</Tag>}
                          {manualP>0&&<Tag color="gold">{manualP}× pergola (ručno) = {fmt(manualP*pRSD())} RSD</Tag>}
                          {(emp.terenNaknada||0)>0&&terenVisits(emp.id,month)>0&&<Tag color="gold"><MapPin size={11}/> {terenVisits(emp.id,month)}× naknada = {fmt(terenVisits(emp.id,month)*(emp.terenNaknada||0))} RSD</Tag>}
                        </div>
                        {paid>0&&<p style={{ fontFamily:MF, fontSize:11, color:'#3B82F6', margin:'6px 0 0', fontWeight:600 }}>Isplaćeno: {fmt(paid)} RSD · Ostatak: {fmt((total||0)-paid)} RSD</p>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontFamily:MF, fontWeight:800, fontSize:16, color:A }}>{fmt(total)} RSD</div>
                          <div style={{ fontFamily:CF, fontStyle:'italic', fontSize:13, color:GD }}>{fmtEur(total,eurRate)}</div>
                        </div>
                        <Btn v="ghost" sm onClick={()=>genPayslipPDF(emp.id,month)} style={{ border:'none', padding:7 }}><FileText size={15} color={G}/> Listić</Btn>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {employees.length===0&&<Empty Icon={Calculator} text="Dodaj radnike na kartici Radnici."/>}
              {employees.length>0&&(
                <div style={{ display:'flex', justifyContent:'center', paddingTop:8 }}>
                  <Btn onClick={genMonthPDF} v="dark"><Download size={17}/> Mesečni PDF izveštaj</Btn>
                </div>
              )}
            </div>
          )}

          {/* ── ISPLATE ── */}
          {tab==='payments'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:'14px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <button onClick={prevMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronLeft size={16}/></button>
                  <span style={{ fontFamily:MF, fontWeight:700, fontSize:16, color:A, flex:1, textAlign:'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronRight size={16}/></button>
                </div>
              </Card>
              <Card style={{ padding:22 }}>
                <p style={{ fontFamily:CF, fontStyle:'italic', color:A2, fontSize:16, marginBottom:14 }}>Evidentiranje isplate</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:14 }}>
                  <SelEl label="Radnik" value={payForm.eid} onChange={e=>setPayForm({...payForm,eid:e.target.value})}>
                    <option value="">Izaberi...</option>
                    {employees.map(e=>{ const earned=calcTotal(e.id,month)||0; const paid=totalPaid(e.id,month); return <option key={e.id} value={e.id}>{e.name} (ostatak: {fmt(earned-paid)} RSD)</option>; })}
                  </SelEl>
                  <Field label="Iznos (RSD)" type="number" placeholder="0" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})}/>
                  <Field label="Datum" type="date" value={payForm.date} onChange={e=>setPayForm({...payForm,date:e.target.value})}/>
                  <SelEl label="Način isplate" value={payForm.method} onChange={e=>setPayForm({...payForm,method:e.target.value})}>
                    {Object.entries(METHOD_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </SelEl>
                  <Field label="Napomena" type="text" placeholder="..." value={payForm.note} onChange={e=>setPayForm({...payForm,note:e.target.value})}/>
                </div>
                <Btn onClick={addPay}><Plus size={15}/> Evidentiraj isplatu</Btn>
              </Card>
              {employees.map(emp=>{
                const earned=calcTotal(emp.id,month)||0; const paid=totalPaid(emp.id,month); const remaining=earned-paid;
                const empPays=monthPays().filter(p=>p.eid===emp.id);
                if(earned===0&&empPays.length===0) return null;
                return (
                  <Card key={emp.id} style={{ padding:18 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:empPays.length?14:0 }}>
                      <Avatar name={emp.name} sz={38}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:MF, fontWeight:800, fontSize:14, color:A, margin:'0 0 3px' }}>{emp.name}</p>
                        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:MF, fontSize:12, color:'#6B7280' }}>Za isplatu: <strong style={{ color:A }}>{fmt(earned)} RSD</strong></span>
                          <span style={{ fontFamily:MF, fontSize:12, color:'#6B7280' }}>Isplaćeno: <strong style={{ color:'#3B82F6' }}>{fmt(paid)} RSD</strong></span>
                          <span style={{ fontFamily:MF, fontSize:12, color:'#6B7280' }}>Ostatak: <strong style={{ color:remaining>0?'#EF4444':'#10B981' }}>{fmt(remaining)} RSD</strong></span>
                        </div>
                      </div>
                    </div>
                    {empPays.map(p=>(
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:'1px solid #F0EDE7' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:G, flexShrink:0 }}/>
                        <span style={{ fontFamily:MF, fontSize:12, color:A, fontWeight:600, flex:1 }}>{fmt(p.amount)} RSD</span>
                        <Tag color="gray">{METHOD_LABELS[p.method]}</Tag>
                        {p.date&&<span style={{ fontFamily:MF, fontSize:11, color:'#9CA3AF' }}>{new Date(p.date).toLocaleDateString('sr-RS')}</span>}
                        {p.note&&<span style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:'#9CA3AF', flex:1 }}>{p.note}</span>}
                        <button onClick={()=>delPay(p.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#FCA5A5' }}><X size={14}/></button>
                      </div>
                    ))}
                  </Card>
                );
              })}
              {monthPays().length===0&&employees.every(e=>(calcTotal(e.id,month)||0)===0)&&<Empty Icon={CreditCard} text={`Nema evidencije isplata za ${fmtM(month)}`}/>}
            </div>
          )}

          {/* ── GODIŠNJI ── */}
          {tab==='annual'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <Card style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:12 }}>
                <button onClick={()=>setAnnualYear(y=>y-1)} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronLeft size={16}/></button>
                <span style={{ fontFamily:MF, fontWeight:700, fontSize:16, color:A, flex:1, textAlign:'center' }}>{annualYear}. godina</span>
                <button onClick={()=>setAnnualYear(y=>y+1)} style={{ background:'none', border:'1.5px solid #E9E5DE', borderRadius:10, padding:'7px 9px', cursor:'pointer', color:A2 }}><ChevronRight size={16}/></button>
              </Card>
              {employees.map(emp=>{
                const yearTotal=Array.from({length:12},(_,i)=>{ const m=`${annualYear}-${String(i+1).padStart(2,'0')}`; return calcTotal(emp.id,m)||0; }).reduce((a,b)=>a+b,0);
                const yearPaid=payments.filter(p=>p.eid===emp.id&&p.month?.startsWith(`${annualYear}-`)).reduce((s,p)=>s+(p.amount||0),0);
                return (
                  <Card key={emp.id} style={{ padding:18 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                      <Avatar name={emp.name} sz={36}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontFamily:MF, fontWeight:800, fontSize:14, color:A, margin:'0 0 2px' }}>{emp.name}</p>
                        <p style={{ fontFamily:CF, fontStyle:'italic', fontSize:12, color:'#9CA3AF', margin:0 }}>
                          Godišnji ukupno: <strong style={{ fontFamily:MF, fontStyle:'normal', color:A }}>{fmt(yearTotal)} RSD</strong> · Isplaćeno: <strong style={{ fontFamily:MF, fontStyle:'normal', color:'#3B82F6' }}>{fmt(yearPaid)} RSD</strong>
                        </p>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                      {Array.from({length:12},(_,i)=>{
                        const m=`${annualYear}-${String(i+1).padStart(2,'0')}`;
                        const t=calcTotal(emp.id,m); const hasData=t!==null&&t>0;
                        const p=payments.filter(py=>py.eid===emp.id&&py.month===m).reduce((s,py)=>s+(py.amount||0),0);
                        return (
                          <div key={m} style={{ padding:'10px 8px', borderRadius:10, background:hasData?GL:'#FAFAF9', border:`1px solid ${hasData?'#E0D09E':'#EDE9E2'}`, textAlign:'center' }}>
                            <p style={{ fontFamily:MF, fontWeight:700, fontSize:10, color:hasData?GD:'#C8C4BC', margin:'0 0 3px' }}>{MONTHS[i].slice(0,3).toUpperCase()}</p>
                            <p style={{ fontFamily:MF, fontWeight:800, fontSize:12, color:hasData?A:'#D1D5DB', margin:0 }}>{hasData?`${fmt(t)}`:'—'}</p>
                            {p>0&&<p style={{ fontFamily:MF, fontSize:9, color:'#3B82F6', margin:'2px 0 0', fontWeight:600 }}>✓ {fmt(p)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
              {employees.length===0&&<Empty Icon={TrendingUp} text="Nema radnika za prikaz."/>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProhorecaApp;
