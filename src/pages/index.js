'use client'
import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Calculator, Users, Calendar, Download, Edit2,
  Check, X, ChevronLeft, ChevronRight, CreditCard, TrendingUp,
  RefreshCw, FileText, Layers, Sun,
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

// ── Utils ─────────────────────────────────────────────────────────────────────
const fmt    = (n) => Math.round(n || 0).toLocaleString('sr-RS');
const fmtM   = (m) => { if (!m) return ''; const [y, mo] = m.split('-'); return `${MONTHS[+mo - 1]} ${y}`; };
const toEur  = (rsd, r) => (rsd / (r || 117.5)).toFixed(2);
const fmtEur = (rsd, r) => `${toEur(rsd, r)} €`;
const now    = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const dim    = (y, m) => new Date(y, m + 1, 0).getDate();
const fo     = (y, m) => (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
const dw     = (y, m, d) => new Date(y, m, d).getDay();        // 0=Sun
const isSu   = (y, m, d) => dw(y, m, d) === 0;
const isSa   = (y, m, d) => dw(y, m, d) === 6;

// Standard working days = Mon–Fri of the month
const stdDays = (y, m) => {
  let c = 0;
  for (let d = 1; d <= dim(y, m); d++) { const w = dw(y, m, d); if (w >= 1 && w <= 5) c++; }
  return c;
};

// Effective worked state for a day
const effW = (y, m, d, dd) => {
  if (isSu(y, m, d)) return false;
  if (dd?.state === 'worked') return true;
  if (dd?.state === 'off') return false;
  return !isSa(y, m, d); // default: weekdays on, saturdays off
};

// Count worked days from attendance
const cntW = (y, m, eid, ym, att) => {
  let c = 0;
  for (let d = 1; d <= dim(y, m); d++) if (effW(y, m, d, att?.[eid]?.[ym]?.[d])) c++;
  return c;
};

const hasAtt = (eid, ym, att) => Object.keys(att?.[eid]?.[ym] || {}).length > 0;

// ── UI Primitives ─────────────────────────────────────────────────────────────
const s = (...rules) => Object.assign({}, ...rules);

const cardS = { background: '#fff', borderRadius: 20, border: '1px solid #EDE9E2', boxShadow: '0 1px 6px rgba(28,28,30,0.05)' };
const Card = ({ children, style, className = '' }) => (
  <div style={s(cardS, style)} className={className}>{children}</div>
);

const initials = (n = '') => n.trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();

const Avatar = ({ name, sz = 44 }) => (
  <div style={{ width: sz, height: sz, borderRadius: 13, background: `linear-gradient(145deg, ${A2} 0%, ${A} 100%)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${A}30` }}>
    <span style={{ fontFamily: MF, fontWeight: 800, fontSize: Math.max(10, sz / 3.8), color: G }}>{initials(name)}</span>
  </div>
);

const FL = ({ children }) => (
  <div style={{ fontFamily: MF, fontWeight: 700, fontSize: 10, letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: 7 }}>
    {String(children).toUpperCase()}
  </div>
);

const FI = ({ style: st, ...props }) => (
  <input
    style={s({ width: '100%', padding: '11px 15px', background: '#FAFAF9', border: '1.5px solid #E9E5DE', borderRadius: 12, fontSize: 14, fontFamily: MF, fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'all .18s', color: A }, st)}
    onFocus={e => { e.target.style.borderColor = G; e.target.style.boxShadow = `0 0 0 3px ${G}22`; e.target.style.background = '#fff'; }}
    onBlur={e => { e.target.style.borderColor = '#E9E5DE'; e.target.style.boxShadow = ''; e.target.style.background = '#FAFAF9'; }}
    {...props}
  />
);

const Field = ({ label, ...props }) => (
  <div>{label && <FL>{label}</FL>}<FI {...props} /></div>
);

const SelEl = ({ label, children, ...props }) => (
  <div>
    {label && <FL>{label}</FL>}
    <select style={{ width: '100%', padding: '11px 15px', background: '#FAFAF9', border: '1.5px solid #E9E5DE', borderRadius: 12, fontSize: 14, fontFamily: MF, fontWeight: 500, outline: 'none', color: A }} {...props}>
      {children}
    </select>
  </div>
);

const Btn = ({ children, v = 'gold', sm, style: st, ...props }) => {
  const variants = {
    gold:  { background: G, color: '#fff', border: 'none', boxShadow: `0 4px 14px ${G}50` },
    dark:  { background: A, color: '#fff', border: 'none', boxShadow: `0 4px 14px ${A}40` },
    ghost: { background: 'transparent', color: '#6B7280', border: '1.5px solid #E9E5DE', boxShadow: 'none' },
    red:   { background: 'transparent', color: '#EF4444', border: '1.5px solid #FCA5A5', boxShadow: 'none' },
  };
  return (
    <button
      style={s({ padding: sm ? '7px 13px' : '10px 20px', borderRadius: sm ? 10 : 13, fontFamily: MF, fontWeight: 700, fontSize: sm ? 12 : 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'all .18s', lineHeight: 1 }, variants[v], st)}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = ''; }}
      {...props}
    >{children}</button>
  );
};

const Tag = ({ children, color = 'gold' }) => {
  const cs = { gold: { background: GL, color: GD }, gray: { background: '#F3F4F6', color: '#6B7280' }, red: { background: '#FEF2F2', color: '#DC2626' } };
  return <span style={s({ fontFamily: MF, fontWeight: 700, fontSize: 11, padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }, cs[color])}>{children}</span>;
};

const Divider = () => <div style={{ height: 1, background: '#F0EDE7', margin: '4px 0' }} />;

const Empty = ({ Icon, text }) => (
  <div style={{ textAlign: 'center', padding: '64px 20px' }}>
    <div style={{ width: 60, height: 60, borderRadius: 18, background: '#F7F4EF', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={26} color="#D6D0C4" />
    </div>
    <p style={{ fontFamily: CF, fontStyle: 'italic', color: '#9CA3AF', fontSize: 16, margin: 0 }}>{text}</p>
  </div>
);

// Inline-editable heading
const InlineName = ({ value, onSave, light = false }) => {
  const [ed, setEd] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const save = () => { const t = v.trim(); if (t) { onSave(t); setEd(false); } };
  if (ed) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEd(false); }}
        style={{ fontFamily: MF, fontWeight: 900, fontSize: 24, padding: '4px 10px', borderRadius: 10, border: `2px solid ${G}`, outline: 'none', background: light ? 'rgba(255,255,255,0.12)' : '#fff', color: light ? '#fff' : A, width: 220 }} />
      <button onClick={save} style={{ color: G, background: 'none', border: 'none', cursor: 'pointer' }}><Check size={17} /></button>
      <button onClick={() => setEd(false)} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}><X size={17} /></button>
    </div>
  );
  return (
    <button onClick={() => { setV(value); setEd(true); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: 0 }}>
      <h1 style={{ fontFamily: MF, fontWeight: 900, fontSize: 24, color: light ? '#fff' : A, margin: 0, letterSpacing: '-0.02em' }}>{value}</h1>
      <Edit2 size={14} color={light ? `${G}90` : '#C8C4BC'} />
    </button>
  );
};

// Inline-editable numeric setting (in header)
const InlineSetting = ({ label, value, suffix, onSave }) => {
  const [ed, setEd] = useState(false);
  const [v, setV] = useState(String(value));
  const save = () => { const n = parseFloat(v); if (n > 0) { onSave(n); setEd(false); } };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span style={{ fontFamily: CF, fontStyle: 'italic', color: `${G}90` }}>{label}</span>
      {ed ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input type="number" value={v} onChange={e => setV(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEd(false); }}
            style={{ width: 75, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${G}`, background: 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: MF, fontSize: 13, outline: 'none' }} />
          <button onClick={save} style={{ color: G, background: 'none', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
          <button onClick={() => setEd(false)} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </span>
      ) : (
        <button onClick={() => { setV(String(value)); setEd(true); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          <span style={{ fontFamily: MF, fontWeight: 700, color: '#fff' }}>{value} {suffix}</span>
          <Edit2 size={11} color={`${G}70`} />
        </button>
      )}
    </div>
  );
};

// ── Monthly Calendar ───────────────────────────────────────────────────────────
const MonthCalendar = ({ eid, month, att, onUpdate }) => {
  const [noteDay, setNoteDay] = useState(null);
  const [noteVal, setNoteVal] = useState('');

  if (!month || !eid) return null;
  const [y, mo] = month.split('-').map(Number);
  const m0 = mo - 1;
  const total = dim(y, m0);
  const offset = fo(y, m0);
  const empAtt = att?.[eid]?.[month] || {};
  const cells = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];

  const toggle = (d) => {
    if (isSu(y, m0, d)) return;
    const cur = empAtt[d];
    const next = cur?.state === 'worked' ? 'off' : cur?.state === 'off' ? null : 'worked';
    onUpdate(eid, month, d, { ...cur, state: next });
  };

  const today = new Date();
  const isToday = (d) => today.getFullYear() === y && today.getMonth() === m0 && today.getDate() === d;

  const openNote = (e, d) => { e.stopPropagation(); setNoteDay(d); setNoteVal(empAtt[d]?.note || ''); };
  const saveNote = () => { onUpdate(eid, month, noteDay, { ...empAtt[noteDay], note: noteVal }); setNoteDay(null); };

  const notes = Object.entries(empAtt).filter(([, dd]) => dd?.note).sort(([a], [b]) => +a - +b);

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontFamily: MF, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', color: i === 6 ? '#D6D0C4' : i === 5 ? G : '#A8A29E' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dd = empAtt[d];
          const su = isSu(y, m0, d), sa = isSa(y, m0, d);
          const worked = effW(y, m0, d, dd);
          const override = dd?.state !== null && dd?.state !== undefined;
          const hasNote = !!dd?.note;
          const td = isToday(d);

          let bg, fg, border;
          if (su) { bg = '#F8F7F4'; fg = '#D6D0C4'; border = '#EFECE6'; }
          else if (worked) {
            bg = override ? G : GL; fg = override ? '#fff' : GD; border = override ? G : '#E0D09E';
          } else {
            bg = override ? '#F3F4F6' : (sa ? '#FAFAF9' : '#F5F3EF');
            fg = override ? '#9CA3AF' : '#C8C4BC';
            border = override ? '#E5E7EB' : '#ECEAE5';
          }

          return (
            <div key={d}
              onClick={() => toggle(d)}
              style={{ background: bg, border: `${td ? 2 : 1.5}px solid ${td ? G : border}`, borderRadius: 11, minHeight: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: su ? 'default' : 'pointer', position: 'relative', transition: 'all .15s', gap: 2 }}>
              <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 13, color: fg }}>{d}</span>
              {hasNote && <div style={{ width: 5, height: 5, borderRadius: '50%', background: G, position: 'absolute', top: 4, right: 5 }} />}
              {!su && (
                <button
                  title="Napomena"
                  onClick={e => openNote(e, d)}
                  style={{ position: 'absolute', bottom: 3, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: fg, fontSize: 9, opacity: 0.55, lineHeight: 1 }}>✎</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note input */}
      {noteDay && (
        <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: GL, border: `1px solid ${G}50` }}>
          <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: GD, marginBottom: 10 }}>
            Napomena — {noteDay}. {fmtM(month).toLowerCase()}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <FI value={noteVal} onChange={e => setNoteVal(e.target.value)} autoFocus
              placeholder="npr. bonus 500 RSD, kasnjenje, odsustvo..."
              onKeyDown={e => e.key === 'Enter' && saveNote()} style={{ flex: 1, padding: '8px 13px', fontSize: 13 }} />
            <Btn onClick={saveNote} sm><Check size={15} /></Btn>
            <Btn v="ghost" onClick={() => setNoteDay(null)} sm><X size={15} /></Btn>
          </div>
        </div>
      )}

      {/* Notes list */}
      {notes.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: '#A8A29E', marginBottom: 8 }}>Napomene ovog meseca:</p>
          {notes.map(([d, dd]) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#FAFAF9', borderRadius: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 12, color: G, minWidth: 28 }}>{d}.</span>
              <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 14, color: '#57534E', flex: 1 }}>{dd.note}</span>
              <button onClick={() => onUpdate(eid, month, +d, { ...dd, note: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C8C4BC', padding: 0 }}><X size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────────────
const ProhorecaApp = () => {
  const [appName, setAppName]         = useState('Prohoreca');
  const [eurRate, setEurRate]         = useState(117.5);
  const [pergolaBonus, setPergolaBonus] = useState(10);
  const [employees, setEmployees]     = useState([]);
  const [attendance, setAttendance]   = useState({});
  const [records, setRecords]         = useState([]);
  const [payments, setPayments]       = useState([]);
  const [tab, setTab]                 = useState('workers');
  const [month, setMonth]             = useState(now);
  const [attEmp, setAttEmp]           = useState(null);
  const [loaded, setLoaded]           = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateSource, setRateSource]   = useState('');

  // Worker form state
  const [newEmp, setNewEmp]           = useState({ name: '', agreedSalary: '', dnevnica: '' });
  const [editEmp, setEditEmp]         = useState(null);

  // Record form state
  const [recForm, setRecForm]         = useState({ eid: '', numDnevnica: '', numPergola: '', note: '' });
  const [editRec, setEditRec]         = useState(null);

  // Payment form state
  const [payForm, setPayForm]         = useState({ eid: '', amount: '', date: '', method: 'cash', note: '' });

  // Payslip modal
  const [payslipEid, setPayslipEid]   = useState(null);
  const [payslipMonth, setPayslipMonth] = useState(null);

  // Annual
  const [annualYear, setAnnualYear]   = useState(() => new Date().getFullYear());

  // ── Load ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const g = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
    setAppName(localStorage.getItem('pro_name') || 'Prohoreca');
    const ss = g('pro_settings', {});
    setEurRate(ss.eurRate || 117.5);
    setPergolaBonus(ss.pergolaBonus || 10);
    setEmployees(g('pro_employees', []));
    setAttendance(g('pro_attendance', {}));
    setRecords(g('pro_records', []));
    setPayments(g('pro_payments', []));
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem('pro_name', appName); }, [appName, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_settings', JSON.stringify({ eurRate, pergolaBonus })); }, [eurRate, pergolaBonus, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_employees', JSON.stringify(employees)); }, [employees, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_attendance', JSON.stringify(attendance)); }, [attendance, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_records', JSON.stringify(records)); }, [records, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_payments', JSON.stringify(payments)); }, [payments, loaded]);

  // ── Auto NBS rate ──
  const fetchRate = async () => {
    setRateLoading(true);
    try {
      const r = await fetch('/api/eur-rate');
      if (r.ok) { const d = await r.json(); setEurRate(d.rate); setRateSource(d.source); }
    } catch {}
    setRateLoading(false);
  };

  // ── Calculations ──
  const pRSD = () => (pergolaBonus || 10) * (eurRate || 117.5);

  const calcBase = (eid, m) => {
    const emp = employees.find(e => e.id === eid);
    if (!emp) return 0;
    if (!hasAtt(eid, m, attendance)) return emp.agreedSalary || 0;
    const [y, mo] = m.split('-').map(Number);
    const m0 = mo - 1;
    const sd = stdDays(y, m0);
    const wd = cntW(y, m0, eid, m, attendance);
    return sd > 0 ? Math.round((emp.agreedSalary || 0) * wd / sd) : (emp.agreedSalary || 0);
  };

  const calcExtras = (eid, m) => {
    const emp = employees.find(e => e.id === eid);
    const rec = records.find(r => r.eid === eid && r.month === m);
    if (!emp || !rec) return 0;
    return (rec.numDnevnica || 0) * (emp.dnevnica || 0) + (rec.numPergola || 0) * pRSD();
  };

  const calcTotal = (eid, m) => {
    const emp = employees.find(e => e.id === eid);
    if (!emp) return null;
    return calcBase(eid, m) + calcExtras(eid, m);
  };

  const totalMonth = (m) => employees.reduce((s, e) => s + Math.max(0, calcTotal(e.id, m) ?? 0), 0);

  const totalPaid = (eid, m) => payments.filter(p => p.eid === eid && p.month === m).reduce((s, p) => s + (p.amount || 0), 0);

  // ── Attendance update ──
  const updAtt = (eid, m, d, dd) => setAttendance(prev => ({
    ...prev,
    [eid]: { ...(prev[eid] || {}), [m]: { ...(prev[eid]?.[m] || {}), [d]: dd } }
  }));

  // ── Workers CRUD ──
  const addEmp = () => {
    if (!newEmp.name.trim() || !newEmp.agreedSalary) return;
    setEmployees(p => [...p, { id: Date.now(), name: newEmp.name.trim(), agreedSalary: parseFloat(newEmp.agreedSalary) || 0, dnevnica: parseFloat(newEmp.dnevnica) || 0 }]);
    setNewEmp({ name: '', agreedSalary: '', dnevnica: '' });
  };
  const saveEmp = () => {
    if (!editEmp?.name.trim()) return;
    setEmployees(p => p.map(e => e.id === editEmp.id ? { ...e, name: editEmp.name.trim(), agreedSalary: parseFloat(editEmp.agreedSalary) || 0, dnevnica: parseFloat(editEmp.dnevnica) || 0 } : e));
    setEditEmp(null);
  };
  const delEmp = (id) => {
    if (!window.confirm('Obrisati radnika i sve podatke?')) return;
    setEmployees(p => p.filter(e => e.id !== id));
    setRecords(p => p.filter(r => r.eid !== id));
    setPayments(p => p.filter(p2 => p2.eid !== id));
    setAttendance(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // ── Records CRUD ──
  const addRec = () => {
    if (!recForm.eid) return;
    const eid = parseInt(recForm.eid);
    if (records.find(r => r.eid === eid && r.month === month)) { alert('Već postoji obračun za ovog radnika u ovom mesecu.'); return; }
    setRecords(p => [...p, { id: Date.now(), eid, month, numDnevnica: parseFloat(recForm.numDnevnica) || 0, numPergola: parseFloat(recForm.numPergola) || 0, note: recForm.note }]);
    setRecForm({ eid: '', numDnevnica: '', numPergola: '', note: '' });
  };
  const saveRec = () => {
    setRecords(p => p.map(r => r.id === editRec.id ? { ...r, numDnevnica: parseFloat(editRec.numDnevnica) || 0, numPergola: parseFloat(editRec.numPergola) || 0, note: editRec.note } : r));
    setEditRec(null);
  };
  const delRec = (id) => { if (window.confirm('Obrisati obračun?')) setRecords(p => p.filter(r => r.id !== id)); };

  // ── Payments CRUD ──
  const addPay = () => {
    if (!payForm.eid || !payForm.amount) return;
    setPayments(p => [...p, { id: Date.now(), eid: parseInt(payForm.eid), month, amount: parseFloat(payForm.amount) || 0, date: payForm.date || new Date().toISOString().split('T')[0], method: payForm.method, note: payForm.note }]);
    setPayForm({ eid: '', amount: '', date: '', method: 'cash', note: '' });
  };
  const delPay = (id) => { if (window.confirm('Obrisati isplatu?')) setPayments(p => p.filter(p2 => p2.id !== id)); };

  // ── PDF — monthly report ──
  const genMonthPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.width; const mg = 20; let y = 28;
      doc.setFontSize(16); doc.setFont(undefined, 'bold');
      doc.text(`OBRACUN ZARADA — ${appName.toUpperCase()}`, pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      doc.text(`${fmtM(month)} · Datum: ${new Date().toLocaleDateString('sr-RS')} · Kurs: ${eurRate} RSD/€ · Pergola: ${pergolaBonus} EUR`, pw / 2, y, { align: 'center' }); y += 16;
      doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(100, 130, 30);
      doc.text(`UKUPNO: ${fmt(totalMonth(month))} RSD (${fmtEur(totalMonth(month), eurRate)})`, pw / 2, y, { align: 'center' }); y += 16; doc.setTextColor(0, 0, 0);
      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 24; }
        const [yr, mo] = month.split('-').map(Number); const m0 = mo - 1;
        const sd = stdDays(yr, m0);
        const wd = hasAtt(emp.id, month, attendance) ? cntW(yr, m0, emp.id, month, attendance) : sd;
        const base = calcBase(emp.id, month);
        const rec = records.find(r => r.eid === emp.id && r.month === month);
        const total = calcTotal(emp.id, month);
        doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text(emp.name, mg, y); y += 7;
        doc.setFontSize(9); doc.setFont(undefined, 'normal');
        doc.text(`Ugovorena plata: ${fmt(emp.agreedSalary)} RSD · Dnevnica: ${fmt(emp.dnevnica)} RSD`, mg + 4, y); y += 5;
        doc.text(`Prisustvo: ${wd}/${sd} dana · Osnova: ${fmt(base)} RSD`, mg + 4, y); y += 5;
        if (rec?.numDnevnica > 0) { doc.setTextColor(0, 100, 0); doc.text(`Dnevnice: ${rec.numDnevnica}× ${fmt(emp.dnevnica)} = ${fmt(rec.numDnevnica * emp.dnevnica)} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
        if (rec?.numPergola > 0) { doc.setTextColor(0, 100, 0); doc.text(`Pergole: ${rec.numPergola}× ${fmt(pRSD())} = ${fmt(rec.numPergola * pRSD())} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
        if (rec?.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        doc.setFont(undefined, 'bold'); doc.setTextColor(0, 110, 0);
        doc.text(`GOTOVINA: ${fmt(total)} RSD (${fmtEur(total, eurRate)})`, mg + 4, y); y += 5;
        const paid = totalPaid(emp.id, month);
        if (paid > 0) { doc.setTextColor(0, 0, 200); doc.text(`Isplaceno: ${fmt(paid)} RSD · Ostatak: ${fmt((total || 0) - paid)} RSD`, mg + 4, y); y += 5; }
        doc.setTextColor(0, 0, 0); y += 8;
        doc.setDrawColor(220, 215, 200); doc.line(mg, y - 4, pw - mg, y - 4); y += 4;
      });
      const pgs = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pgs; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
        doc.text('by AG GROUP', pw / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`${i}/${pgs}`, pw - mg, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      doc.save(`${appName}_${month}.pdf`);
    } catch (err) { console.error(err); }
  };

  // ── PDF — individual payslip ──
  const genPayslipPDF = async (eid, m) => {
    const emp = employees.find(e => e.id === eid);
    if (!emp) return;
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.width; const mg = 20; let y = 30;
      // Header
      doc.setFillColor(28, 28, 30); doc.rect(0, 0, pw, 50, 'F');
      doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(201, 168, 76);
      doc.text(appName, mg, 22);
      doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(180, 180, 180);
      doc.text('ISPLATNI LISTIC', mg, 32);
      doc.setTextColor(255, 255, 255);
      doc.text(`${fmtM(m)} · ${new Date().toLocaleDateString('sr-RS')}`, pw - mg, 32, { align: 'right' });
      y = 65;
      // Worker info
      doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.setFont(undefined, 'bold');
      doc.text(emp.name, mg, y); y += 8;
      doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
      doc.text(`Ugovorena mesecna plata: ${fmt(emp.agreedSalary)} RSD`, mg, y); y += 5;
      doc.text(`Ugovorena dnevnica: ${fmt(emp.dnevnica)} RSD`, mg, y); y += 14;
      // Attendance
      const [yr, mo] = m.split('-').map(Number); const m0 = mo - 1;
      const sd = stdDays(yr, m0);
      const wd = hasAtt(eid, m, attendance) ? cntW(yr, m0, eid, m, attendance) : sd;
      const base = calcBase(eid, m);
      const rec = records.find(r => r.eid === eid && r.month === m);
      // Table
      const drawRow = (label, value, color) => {
        if (color) doc.setTextColor(...color); else doc.setTextColor(30, 30, 30);
        doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.text(label, mg, y);
        doc.setFont(undefined, 'bold'); doc.text(value, pw - mg, y, { align: 'right' }); y += 8;
        doc.setTextColor(30, 30, 30);
      };
      doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text('OBRACUN', mg, y); y += 5;
      doc.setDrawColor(220, 215, 200); doc.line(mg, y, pw - mg, y); y += 5;
      drawRow(`Osnovna plata (${wd}/${sd} dana)`, `${fmt(base)} RSD`);
      if (rec?.numDnevnica > 0) drawRow(`Dnevnice: ${rec.numDnevnica}× ${fmt(emp.dnevnica)} RSD`, `${fmt(rec.numDnevnica * emp.dnevnica)} RSD`, [0, 110, 0]);
      if (rec?.numPergola > 0) drawRow(`Pergole: ${rec.numPergola}× ${fmt(pRSD())} RSD`, `${fmt(rec.numPergola * pRSD())} RSD`, [0, 110, 0]);
      // Day notes
      const notes = Object.entries(attendance[eid]?.[m] || {}).filter(([, dd]) => dd?.note);
      if (notes.length > 0) {
        y += 4; doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text('NAPOMENE', mg, y); y += 5;
        doc.line(mg, y, pw - mg, y); y += 5;
        notes.sort(([a], [b]) => +a - +b).forEach(([d, dd]) => {
          doc.setFontSize(9); doc.setTextColor(100, 90, 0); doc.text(`${d}.  ${dd.note}`, mg + 4, y); y += 6;
        });
      }
      // Total
      y += 6; doc.line(mg, y, pw - mg, y); y += 8;
      const total = calcTotal(eid, m) || 0;
      doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 110, 0);
      doc.text('UKUPNO ZA ISPLATU', mg, y);
      doc.text(`${fmt(total)} RSD`, pw - mg, y, { align: 'right' }); y += 7;
      doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 150, 50);
      doc.text(`(${fmtEur(total, eurRate)})`, pw - mg, y, { align: 'right' }); y += 5;
      const paid = totalPaid(eid, m);
      if (paid > 0) {
        doc.setTextColor(0, 0, 200); doc.setFont(undefined, 'normal'); doc.setFontSize(10);
        doc.text(`Isplaceno: ${fmt(paid)} RSD`, pw - mg, y + 5, { align: 'right' });
        doc.text(`Ostatak: ${fmt(total - paid)} RSD`, pw - mg, y + 12, { align: 'right' });
        y += 18;
      }
      // Signature
      y += 20;
      doc.setDrawColor(180, 180, 180); doc.line(mg, y, mg + 60, y); doc.line(pw - mg - 60, y, pw - mg, y);
      doc.setFontSize(8); doc.setTextColor(160, 160, 160);
      doc.text('Radnik', mg + 30, y + 5, { align: 'center' });
      doc.text('Poslodavac', pw - mg - 30, y + 5, { align: 'center' });
      // Footer
      doc.setFontSize(7); doc.setTextColor(180, 180, 180);
      doc.text('by AG GROUP', pw / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.save(`Listic_${emp.name.replace(/\s+/g,'_')}_${m}.pdf`);
    } catch (err) { console.error(err); }
  };

  // ── Derived ──
  const monthRecs = () => records.filter(r => r.month === month);
  const monthPays = () => payments.filter(p => p.month === month);
  const selEmpForRec = employees.find(e => e.id === parseInt(recForm.eid));
  const previewTotal = selEmpForRec
    ? calcBase(selEmpForRec.id, month)
      + (parseFloat(recForm.numDnevnica) || 0) * (selEmpForRec.dnevnica || 0)
      + (parseFloat(recForm.numPergola) || 0) * pRSD()
    : null;

  const attEmpObj = employees.find(e => e.id === attEmp);
  const [attY, attMo0] = attEmpObj ? month.split('-').map((n, i) => i === 0 ? +n : +n - 1) : [0, 0];
  const attStd = attEmpObj ? stdDays(attY, attMo0) : 0;
  const attWkd = attEmpObj ? cntW(attY, attMo0, attEmpObj.id, month, attendance) : 0;

  // Navigation helpers
  const prevMonth = () => { const d = new Date(`${month}-01`); d.setMonth(d.getMonth() - 1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); };
  const nextMonth = () => { const d = new Date(`${month}-01`); d.setMonth(d.getMonth() + 1); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); };

  const TABS = [
    { k: 'workers',    l: 'Radnici',    I: Users },
    { k: 'attendance', l: 'Prisustvo',  I: Calendar },
    { k: 'payroll',    l: 'Obračun',    I: Calculator },
    { k: 'payments',   l: 'Isplate',    I: CreditCard },
    { k: 'annual',     l: 'Godišnji',   I: TrendingUp },
  ];

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: CR, fontFamily: MF }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <header style={{ background: `linear-gradient(160deg, ${A} 0%, ${A2} 60%, #1a2818 100%)`, padding: '28px 24px 0', borderRadius: '0 0 28px 28px', boxShadow: `0 8px 40px ${A}60` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <InlineName value={appName} onSave={setAppName} light />
              <p style={{ fontFamily: CF, fontStyle: 'italic', color: `${G}80`, fontSize: 14, margin: '4px 0 0' }}>
                Bioklimatske pergole · Obračun zarada
              </p>
            </div>
            <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: `${G}50`, paddingTop: 4 }}>by AG GROUP</span>
          </div>

          {/* Settings row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', alignItems: 'center', marginBottom: 20 }}>
            <InlineSetting label="Kurs EUR" value={eurRate} suffix="RSD" onSave={setEurRate} />
            <InlineSetting label="Bonus / pergola" value={pergolaBonus} suffix="EUR" onSave={setPergolaBonus} />
            <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: `${G}70` }}>
              1 pergola = <strong style={{ color: G, fontFamily: MF }}>{fmt(pRSD())} RSD</strong>
            </span>
            <button onClick={fetchRate} disabled={rateLoading}
              title={rateSource ? `Poslednji izvor: ${rateSource}` : 'Preuzmi kurs sa NBS'}
              style={{ background: 'none', border: `1px solid ${G}40`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: rateLoading ? `${G}50` : G, fontFamily: MF, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RefreshCw size={12} style={{ animation: rateLoading ? 'spin 1s linear infinite' : 'none' }} /> NBS kurs
            </button>
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 16 }}>
            {TABS.map(({ k, l, I }) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 4px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: MF, fontWeight: 700, fontSize: 11, transition: 'all .2s', letterSpacing: '0.01em',
                  background: tab === k ? '#fff' : 'transparent',
                  color: tab === k ? A : `rgba(255,255,255,0.45)`,
                  boxShadow: tab === k ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
                }}>
                <I size={14} /><span className="hidden sm:inline">{l}</span>
              </button>
            ))}
          </div>
        </header>

        <main style={{ padding: '20px 16px', paddingBottom: 60 }}>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

          {/* ── RADNICI ── */}
          {tab === 'workers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card style={{ padding: 22 }}>
                <p style={{ fontFamily: CF, fontStyle: 'italic', color: A2, fontSize: 16, marginBottom: 16 }}>Dodaj radnika</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <Field label="Ime i prezime" type="text" placeholder="npr. Marko Marković"
                    value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addEmp()} />
                  <Field label="Mesečna plata (RSD)" type="number" placeholder="0"
                    value={newEmp.agreedSalary} onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addEmp()} />
                  <Field label="Dnevnica (RSD)" type="number" placeholder="0"
                    value={newEmp.dnevnica} onChange={e => setNewEmp({ ...newEmp, dnevnica: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && addEmp()} />
                </div>
                <Btn onClick={addEmp}><Plus size={15} /> Dodaj radnika</Btn>
              </Card>

              {employees.map(emp => (
                <Card key={emp.id} style={{ padding: 18 }}>
                  {editEmp?.id === emp.id ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
                        <Field label="Ime i prezime" type="text" value={editEmp.name} onChange={e => setEditEmp(p => ({ ...p, name: e.target.value }))} />
                        <Field label="Mesečna plata" type="number" value={editEmp.agreedSalary} onChange={e => setEditEmp(p => ({ ...p, agreedSalary: e.target.value }))} />
                        <Field label="Dnevnica" type="number" value={editEmp.dnevnica} onChange={e => setEditEmp(p => ({ ...p, dnevnica: e.target.value }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn onClick={saveEmp} sm><Check size={14} /> Sačuvaj</Btn>
                        <Btn v="ghost" onClick={() => setEditEmp(null)} sm><X size={14} /> Otkaži</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Avatar name={emp.name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 15, color: A, margin: '0 0 4px' }}>{emp.name}</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: '#78716C' }}>Plata: <strong style={{ color: A2, fontFamily: MF, fontStyle: 'normal' }}>{fmt(emp.agreedSalary)} RSD</strong></span>
                          <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: '#78716C' }}>Dnevnica: <strong style={{ color: A2, fontFamily: MF, fontStyle: 'normal' }}>{fmt(emp.dnevnica)} RSD</strong></span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn v="ghost" sm onClick={() => setEditEmp({ id: emp.id, name: emp.name, agreedSalary: String(emp.agreedSalary), dnevnica: String(emp.dnevnica) })} style={{ border: 'none', padding: '8px' }}><Edit2 size={15} color={G} /></Btn>
                        <Btn v="ghost" sm onClick={() => delEmp(emp.id)} style={{ border: 'none', padding: '8px' }}><Trash2 size={15} color="#EF4444" /></Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              {employees.length === 0 && <Empty Icon={Users} text="Nema radnika — dodaj prvog iznad." />}
            </div>
          )}

          {/* ── PRISUSTVO ── */}
          {tab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Month nav + worker select */}
              <Card style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: A2 }}><ChevronLeft size={16} /></button>
                  <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 16, color: A, flex: 1, textAlign: 'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: A2 }}><ChevronRight size={16} /></button>
                </div>
                <SelEl label="Radnik" value={attEmp || ''} onChange={e => setAttEmp(e.target.value ? parseInt(e.target.value) : null)}>
                  <option value="">Izaberi radnika...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </SelEl>
              </Card>

              {attEmpObj && (
                <>
                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { l: 'Radnih dana', v: `${attStd}`, sub: 'standard (pon–pet)' },
                      { l: 'Odrađeno', v: `${attWkd}`, sub: `od ${attStd} dana` },
                      { l: 'Osnova plate', v: `${fmt(calcBase(attEmpObj.id, month))} RSD`, sub: attWkd < attStd ? `pro-rata ${attWkd}/${attStd}` : 'puna plata' },
                    ].map(({ l, v, sub }) => (
                      <Card key={l} style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <p style={{ fontFamily: MF, fontWeight: 700, fontSize: 10, color: '#9CA3AF', letterSpacing: '0.07em', marginBottom: 4 }}>{l.toUpperCase()}</p>
                        <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 18, color: A, margin: '0 0 2px' }}>{v}</p>
                        <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: '#A8A29E', margin: 0 }}>{sub}</p>
                      </Card>
                    ))}
                  </div>

                  <Card style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <Avatar name={attEmpObj.name} sz={36} />
                      <div>
                        <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 15, color: A, margin: 0 }}>{attEmpObj.name}</p>
                        <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: '#9CA3AF', margin: 0 }}>{fmtM(month)}</p>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
                        <Tag color="gold">⬛ odrađen</Tag>
                        <Tag color="gray">□ odsustvo</Tag>
                      </div>
                    </div>
                    <MonthCalendar eid={attEmpObj.id} month={month} att={attendance} onUpdate={updAtt} />
                  </Card>

                  {/* Individual payslip button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Btn onClick={() => genPayslipPDF(attEmpObj.id, month)} v="dark">
                      <FileText size={16} /> Isplatni listić — {attEmpObj.name}
                    </Btn>
                  </div>
                </>
              )}

              {!attEmpObj && employees.length > 0 && <Empty Icon={Calendar} text="Izaberi radnika da vidiš kalendar prisustva." />}
              {employees.length === 0 && <Empty Icon={Users} text="Dodaj radnike na kartici Radnici." />}
            </div>
          )}

          {/* ── OBRAČUN ── */}
          {tab === 'payroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Month nav */}
              <Card style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronLeft size={16} /></button>
                  <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 16, color: A, flex: 1, textAlign: 'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronRight size={16} /></button>
                </div>
              </Card>

              {/* Hero total */}
              <div style={{ background: `linear-gradient(145deg, ${A} 0%, ${A2} 50%, #1a2818 100%)`, borderRadius: 24, padding: '28px 28px 24px', boxShadow: `0 12px 40px ${A}40` }}>
                <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: `${G}80`, margin: '0 0 4px' }}>Ukupna gotovina</p>
                <p style={{ fontFamily: MF, fontWeight: 900, fontSize: 38, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.03em' }}>{fmt(totalMonth(month))} RSD</p>
                <p style={{ fontFamily: MF, fontWeight: 600, fontSize: 18, color: G, margin: '0 0 4px' }}>{fmtEur(totalMonth(month), eurRate)}</p>
                <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: `${G}60`, margin: 0 }}>{appName} · {fmtM(month)}</p>
              </div>

              {/* Add record form */}
              <Card style={{ padding: 22 }}>
                <p style={{ fontFamily: CF, fontStyle: 'italic', color: A2, fontSize: 16, marginBottom: 14 }}>Novi obračun — {fmtM(month)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <SelEl label="Radnik" value={recForm.eid} onChange={e => setRecForm({ ...recForm, eid: e.target.value })}>
                    <option value="">Izaberi radnika...</option>
                    {employees.filter(e => !records.find(r => r.eid === e.id && r.month === month)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </SelEl>
                  <Field label={selEmpForRec ? `Dnevnice (× ${fmt(selEmpForRec.dnevnica)} RSD)` : 'Broj dnevnica'} type="number" value={recForm.numDnevnica} placeholder="0" onChange={e => setRecForm({ ...recForm, numDnevnica: e.target.value })} />
                  <Field label={`Pergole (× ${fmt(pRSD())} RSD)`} type="number" value={recForm.numPergola} placeholder="0" onChange={e => setRecForm({ ...recForm, numPergola: e.target.value })} />
                  <Field label="Napomena" type="text" value={recForm.note} placeholder="..." onChange={e => setRecForm({ ...recForm, note: e.target.value })} />
                </div>
                {selEmpForRec && (
                  <div style={{ background: GL, borderRadius: 14, padding: '14px 18px', marginBottom: 14 }}>
                    {[
                      ['Osnova plate', `${fmt(calcBase(selEmpForRec.id, month))} RSD`],
                      (parseFloat(recForm.numDnevnica) || 0) > 0 && [`${recForm.numDnevnica}× dnevnica`, `+${fmt((parseFloat(recForm.numDnevnica)||0) * selEmpForRec.dnevnica)} RSD`],
                      (parseFloat(recForm.numPergola) || 0) > 0 && [`${recForm.numPergola}× pergola`, `+${fmt((parseFloat(recForm.numPergola)||0) * pRSD())} RSD`],
                    ].filter(Boolean).map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: GD, marginBottom: 4 }}>
                        <span style={{ fontFamily: CF, fontStyle: 'italic' }}>{l}</span>
                        <span style={{ fontFamily: MF, fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 13, color: A }}>Ukupno</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: MF, fontWeight: 800, fontSize: 15, color: A }}>{fmt(previewTotal)} RSD</div>
                        <div style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: GD }}>{fmtEur(previewTotal, eurRate)}</div>
                      </div>
                    </div>
                  </div>
                )}
                <Btn onClick={addRec}><Plus size={15} /> Dodaj obračun</Btn>
              </Card>

              {/* Records list */}
              {monthRecs().map(rec => {
                const emp = employees.find(e => e.id === rec.eid);
                const total = calcTotal(rec.eid, month);
                const paid = totalPaid(rec.eid, month);
                const isEd = editRec?.id === rec.id;
                const [yr2, mo2] = month.split('-').map(Number); const m02 = mo2 - 1;
                const wdCnt = hasAtt(rec.eid, month, attendance) ? cntW(yr2, m02, rec.eid, month, attendance) : stdDays(yr2, m02);
                const sdCnt = stdDays(yr2, m02);
                return (
                  <Card key={rec.id} style={{ padding: 18 }}>
                    {isEd ? (
                      <div>
                        <p style={{ fontFamily: MF, fontWeight: 700, fontSize: 14, color: A, marginBottom: 12 }}>{emp?.name}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
                          <Field label="Dnevnice" type="number" value={editRec.numDnevnica} onChange={e => setEditRec(p => ({ ...p, numDnevnica: e.target.value }))} />
                          <Field label="Pergole" type="number" value={editRec.numPergola} onChange={e => setEditRec(p => ({ ...p, numPergola: e.target.value }))} />
                          <Field label="Napomena" type="text" value={editRec.note} onChange={e => setEditRec(p => ({ ...p, note: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn onClick={saveRec} sm><Check size={14} /> Sačuvaj</Btn>
                          <Btn v="ghost" onClick={() => setEditRec(null)} sm><X size={14} /></Btn>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <Avatar name={emp?.name || ''} sz={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 15, color: A, margin: '0 0 6px' }}>{emp?.name}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <Tag color="gray">Osnova: {fmt(calcBase(rec.eid, month))} RSD <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({wdCnt}/{sdCnt}d)</span></Tag>
                            {rec.numDnevnica > 0 && <Tag color="gold">{rec.numDnevnica}× dnevnica = {fmt(rec.numDnevnica * (emp?.dnevnica || 0))} RSD</Tag>}
                            {rec.numPergola > 0 && <Tag color="gold">{rec.numPergola}× pergola = {fmt(rec.numPergola * pRSD())} RSD</Tag>}
                          </div>
                          {rec.note && <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: '#9CA3AF', margin: '6px 0 0' }}>{rec.note}</p>}
                          {paid > 0 && <p style={{ fontFamily: MF, fontSize: 11, color: '#3B82F6', margin: '4px 0 0', fontWeight: 600 }}>Isplaćeno: {fmt(paid)} RSD · Ostatak: {fmt((total || 0) - paid)} RSD</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: MF, fontWeight: 800, fontSize: 16, color: A }}>{fmt(total)} RSD</div>
                            <div style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 13, color: GD }}>{fmtEur(total, eurRate)}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Btn v="ghost" sm onClick={() => genPayslipPDF(rec.eid, month)} style={{ border: 'none', padding: 7 }}><FileText size={14} color={G} /></Btn>
                            <Btn v="ghost" sm onClick={() => setEditRec({ id: rec.id, numDnevnica: String(rec.numDnevnica), numPergola: String(rec.numPergola), note: rec.note })} style={{ border: 'none', padding: 7 }}><Edit2 size={14} color={G} /></Btn>
                            <Btn v="ghost" sm onClick={() => delRec(rec.id)} style={{ border: 'none', padding: 7 }}><Trash2 size={14} color="#EF4444" /></Btn>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {monthRecs().length === 0 && <Empty Icon={Calculator} text={`Nema obračuna za ${fmtM(month)}`} />}

              {/* PDF button */}
              {monthRecs().length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                  <Btn onClick={genMonthPDF} v="dark"><Download size={17} /> Mesečni PDF izveštaj</Btn>
                </div>
              )}
            </div>
          )}

          {/* ── ISPLATE ── */}
          {tab === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={prevMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronLeft size={16} /></button>
                  <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 16, color: A, flex: 1, textAlign: 'center' }}>{fmtM(month)}</span>
                  <button onClick={nextMonth} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronRight size={16} /></button>
                </div>
              </Card>

              <Card style={{ padding: 22 }}>
                <p style={{ fontFamily: CF, fontStyle: 'italic', color: A2, fontSize: 16, marginBottom: 14 }}>Evidentiranje isplate</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <SelEl label="Radnik" value={payForm.eid} onChange={e => setPayForm({ ...payForm, eid: e.target.value })}>
                    <option value="">Izaberi...</option>
                    {employees.map(e => {
                      const earned = calcTotal(e.id, month) || 0;
                      const paid = totalPaid(e.id, month);
                      return <option key={e.id} value={e.id}>{e.name} (ostatak: {fmt(earned - paid)} RSD)</option>;
                    })}
                  </SelEl>
                  <Field label="Iznos (RSD)" type="number" placeholder="0" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
                  <Field label="Datum" type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} />
                  <SelEl label="Način isplate" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                    {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </SelEl>
                  <Field label="Napomena" type="text" placeholder="..." value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} />
                </div>
                <Btn onClick={addPay}><Plus size={15} /> Evidentiraj isplatu</Btn>
              </Card>

              {/* Summary per worker */}
              {employees.map(emp => {
                const earned = calcTotal(emp.id, month) || 0;
                const paid = totalPaid(emp.id, month);
                const remaining = earned - paid;
                const empPays = monthPays().filter(p => p.eid === emp.id);
                if (earned === 0 && empPays.length === 0) return null;
                return (
                  <Card key={emp.id} style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: empPays.length ? 14 : 0 }}>
                      <Avatar name={emp.name} sz={38} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 14, color: A, margin: '0 0 3px' }}>{emp.name}</p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: MF, fontSize: 12, color: '#6B7280' }}>Za isplatu: <strong style={{ color: A }}>{fmt(earned)} RSD</strong></span>
                          <span style={{ fontFamily: MF, fontSize: 12, color: '#6B7280' }}>Isplaćeno: <strong style={{ color: '#3B82F6' }}>{fmt(paid)} RSD</strong></span>
                          <span style={{ fontFamily: MF, fontSize: 12, color: '#6B7280' }}>Ostatak: <strong style={{ color: remaining > 0 ? '#EF4444' : '#10B981' }}>{fmt(remaining)} RSD</strong></span>
                        </div>
                      </div>
                    </div>
                    {empPays.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #F0EDE7' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: G, flexShrink: 0 }} />
                        <span style={{ fontFamily: MF, fontSize: 12, color: A, fontWeight: 600, flex: 1 }}>{fmt(p.amount)} RSD</span>
                        <Tag color="gray">{METHOD_LABELS[p.method]}</Tag>
                        {p.date && <span style={{ fontFamily: MF, fontSize: 11, color: '#9CA3AF' }}>{new Date(p.date).toLocaleDateString('sr-RS')}</span>}
                        {p.note && <span style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: '#9CA3AF', flex: 1 }}>{p.note}</span>}
                        <button onClick={() => delPay(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5' }}><X size={14} /></button>
                      </div>
                    ))}
                  </Card>
                );
              })}
              {monthPays().length === 0 && employees.every(e => (calcTotal(e.id, month) || 0) === 0) && (
                <Empty Icon={CreditCard} text={`Nema evidencije isplata za ${fmtM(month)}`} />
              )}
            </div>
          )}

          {/* ── GODIŠNJI ── */}
          {tab === 'annual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setAnnualYear(y => y - 1)} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronLeft size={16} /></button>
                <span style={{ fontFamily: MF, fontWeight: 700, fontSize: 16, color: A, flex: 1, textAlign: 'center' }}>{annualYear}. godina</span>
                <button onClick={() => setAnnualYear(y => y + 1)} style={{ background: 'none', border: `1.5px solid #E9E5DE`, borderRadius: 10, padding: '7px 9px', cursor: 'pointer', color: A2 }}><ChevronRight size={16} /></button>
              </Card>

              {employees.map(emp => {
                const yearTotal = Array.from({ length: 12 }, (_, i) => {
                  const m = `${annualYear}-${String(i + 1).padStart(2, '0')}`;
                  return calcTotal(emp.id, m) || 0;
                }).reduce((a, b) => a + b, 0);
                const yearPaid = payments.filter(p => p.eid === emp.id && p.month?.startsWith(`${annualYear}-`)).reduce((s, p) => s + (p.amount || 0), 0);
                return (
                  <Card key={emp.id} style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <Avatar name={emp.name} sz={36} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 14, color: A, margin: '0 0 2px' }}>{emp.name}</p>
                        <p style={{ fontFamily: CF, fontStyle: 'italic', fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                          Godišnji ukupno: <strong style={{ fontFamily: MF, fontStyle: 'normal', color: A }}>{fmt(yearTotal)} RSD</strong> · Isplaćeno: <strong style={{ fontFamily: MF, fontStyle: 'normal', color: '#3B82F6' }}>{fmt(yearPaid)} RSD</strong>
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {Array.from({ length: 12 }, (_, i) => {
                        const m = `${annualYear}-${String(i + 1).padStart(2, '0')}`;
                        const t = calcTotal(emp.id, m);
                        const p = payments.filter(py => py.eid === emp.id && py.month === m).reduce((s, py) => s + (py.amount || 0), 0);
                        const hasData = t !== null && t > 0;
                        return (
                          <div key={m} style={{ padding: '10px 8px', borderRadius: 10, background: hasData ? GL : '#FAFAF9', border: `1px solid ${hasData ? '#E0D09E' : '#EDE9E2'}`, textAlign: 'center' }}>
                            <p style={{ fontFamily: MF, fontWeight: 700, fontSize: 10, color: hasData ? GD : '#C8C4BC', margin: '0 0 3px' }}>{MONTHS[i].slice(0, 3).toUpperCase()}</p>
                            <p style={{ fontFamily: MF, fontWeight: 800, fontSize: 12, color: hasData ? A : '#D1D5DB', margin: 0 }}>{hasData ? `${fmt(t)}` : '—'}</p>
                            {p > 0 && <p style={{ fontFamily: MF, fontSize: 9, color: '#3B82F6', margin: '2px 0 0', fontWeight: 600 }}>✓ {fmt(p)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
              {employees.length === 0 && <Empty Icon={TrendingUp} text="Nema radnika za prikaz." />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProhorecaApp;
