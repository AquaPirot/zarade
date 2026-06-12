'use client'
import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Calculator, Users, Calendar, Download, Edit2, Check, X,
  Layers, Sun,
} from 'lucide-react';

const fmt = (n) => Math.round(n || 0).toLocaleString('sr-RS');

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm ${className}`}>{children}</div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{children}</label>
);

const Field = ({ label, ...props }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <input className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all placeholder-slate-300" {...props} />
  </div>
);

const initials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0] || '').join('').substring(0, 2).toUpperCase();

const Avatar = ({ name }) => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
    {initials(name)}
  </div>
);

const CashTag = ({ value }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
    value >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
  }`}>
    {value >= 0 ? '+' : ''}{fmt(value)} RSD
  </span>
);

const Empty = ({ Icon, text }) => (
  <div className="text-center py-14">
    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <p className="text-sm text-slate-400">{text}</p>
  </div>
);

// Click-to-edit inline value (company name, settings)
const InlineName = ({ value, onSave, light = false }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  const save = () => { const t = val.trim(); if (t) { onSave(t); setEditing(false); } };
  if (editing) return (
    <div className="flex items-center gap-2">
      <input value={val} onChange={e => setVal(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="px-3 py-1.5 border border-emerald-300 rounded-lg text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 w-56 text-slate-800" />
      <button onClick={save} className="p-1 text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
      <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-300"><X className="w-4 h-4" /></button>
    </div>
  );
  return (
    <button onClick={() => { setVal(value); setEditing(true); }} className="flex items-center gap-2 group">
      <h1 className={`text-2xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-800'}`}>{value}</h1>
      <Edit2 className={`w-3.5 h-3.5 transition-colors ${light ? 'text-emerald-400/50 group-hover:text-emerald-300' : 'text-slate-300 group-hover:text-emerald-500'}`} />
    </button>
  );
};

// Small editable numeric setting in the header bar
const InlineSetting = ({ label, value, suffix, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  const save = () => { const n = parseFloat(val); if (n > 0) { onSave(n); setEditing(false); } };
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-emerald-200/70">{label}</span>
      {editing ? (
        <span className="flex items-center gap-1">
          <input type="number" value={val} onChange={e => setVal(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="w-20 px-2 py-0.5 rounded-lg text-sm bg-white/10 border border-emerald-400/40 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          <button onClick={save} className="p-0.5 text-emerald-300"><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => setEditing(false)} className="p-0.5 text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </span>
      ) : (
        <button onClick={() => { setVal(String(value)); setEditing(true); }}
          className="flex items-center gap-1 font-bold text-white hover:text-emerald-300 transition-colors">
          {value} {suffix} <Edit2 className="w-3 h-3 opacity-50" />
        </button>
      )}
    </div>
  );
};

const KPI = ({ Icon, label, value, sub }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-800 tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  </Card>
);

// ─── APP ──────────────────────────────────────────────────────────────────────
const ProhorecaApp = () => {
  const [name, setName] = useState('Prohoreca');
  const [eurRate, setEurRate] = useState(117.5);
  const [pergolaBonus, setPergolaBonus] = useState(10); // EUR po pergoli
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('employees');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newEmp, setNewEmp] = useState({ name: '', agreedSalary: '', dnevnica: '' });
  const [editingEmp, setEditingEmp] = useState(null);
  const [form, setForm] = useState({ employeeId: '', numDnevnica: '', numPergola: '', note: '' });
  const [editingRecord, setEditingRecord] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const g = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
    setName(localStorage.getItem('pro_name') || 'Prohoreca');
    const s = g('pro_settings', { eurRate: 117.5, pergolaBonus: 10 });
    setEurRate(s.eurRate || 117.5);
    setPergolaBonus(s.pergolaBonus || 10);
    setEmployees(g('pro_employees', []));
    setRecords(g('pro_records', []));
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem('pro_name', name); }, [name, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_settings', JSON.stringify({ eurRate, pergolaBonus })); }, [eurRate, pergolaBonus, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_employees', JSON.stringify(employees)); }, [employees, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem('pro_records', JSON.stringify(records)); }, [records, loaded]);

  const pergolaRSD = () => (pergolaBonus || 0) * (eurRate || 117.5);
  const toEur = (rsd) => (rsd / (eurRate || 117.5)).toFixed(2);
  const fmtEur = (rsd) => `${toEur(rsd)} €`;

  // ── zaposleni ──
  const addEmployee = () => {
    if (!newEmp.name.trim() || !newEmp.agreedSalary) return;
    setEmployees(p => [...p, {
      id: Date.now(), name: newEmp.name.trim(),
      agreedSalary: parseFloat(newEmp.agreedSalary) || 0,
      dnevnica: parseFloat(newEmp.dnevnica) || 0,
    }]);
    setNewEmp({ name: '', agreedSalary: '', dnevnica: '' });
  };

  const deleteEmployee = (id) => {
    if (!window.confirm('Obrisati zaposlenog i sve njegove obračune?')) return;
    setEmployees(p => p.filter(e => e.id !== id));
    setRecords(p => p.filter(r => r.employeeId !== id));
  };

  const startEmpEdit = (emp) => setEditingEmp({
    id: emp.id, name: emp.name,
    agreedSalary: String(emp.agreedSalary), dnevnica: String(emp.dnevnica),
  });

  const saveEmpEdit = () => {
    if (!editingEmp.name.trim()) return;
    setEmployees(p => p.map(e => e.id === editingEmp.id ? {
      ...e, name: editingEmp.name.trim(),
      agreedSalary: parseFloat(editingEmp.agreedSalary) || 0,
      dnevnica: parseFloat(editingEmp.dnevnica) || 0,
    } : e));
    setEditingEmp(null);
  };

  // ── obračuni ──
  const addRecord = () => {
    if (!form.employeeId) return;
    if (records.find(r => r.employeeId === parseInt(form.employeeId) && r.month === month)) {
      alert('Već postoji obračun za ovog radnika u ovom mesecu.'); return;
    }
    setRecords(p => [...p, {
      id: Date.now(), employeeId: parseInt(form.employeeId), month,
      numDnevnica: parseFloat(form.numDnevnica) || 0,
      numPergola: parseFloat(form.numPergola) || 0,
      note: form.note,
    }]);
    setForm({ employeeId: '', numDnevnica: '', numPergola: '', note: '' });
  };

  const deleteRecord = (id) => {
    if (!window.confirm('Obrisati obračun?')) return;
    setRecords(p => p.filter(r => r.id !== id));
  };

  const startEdit = (rec) => setEditingRecord({
    id: rec.id,
    numDnevnica: String(rec.numDnevnica),
    numPergola: String(rec.numPergola),
    note: rec.note,
  });

  const saveEdit = () => {
    setRecords(p => p.map(r => r.id === editingRecord.id ? {
      ...r,
      numDnevnica: parseFloat(editingRecord.numDnevnica) || 0,
      numPergola: parseFloat(editingRecord.numPergola) || 0,
      note: editingRecord.note,
    } : r));
    setEditingRecord(null);
  };

  const calcCash = (empId, m) => {
    const emp = employees.find(e => e.id === empId);
    const rec = records.find(r => r.employeeId === empId && r.month === m);
    if (!emp || !rec) return null;
    return (emp.agreedSalary || 0)
      + (rec.numDnevnica || 0) * (emp.dnevnica || 0)
      + (rec.numPergola || 0) * pergolaRSD();
  };

  const totalCash = () => employees.reduce((s, e) => s + Math.max(0, calcCash(e.id, month) ?? 0), 0);
  const monthRecs = () => records.filter(r => r.month === month);
  const allMonths = () => [...new Set(records.map(r => r.month))].sort().reverse();
  const monthStat = (key) => monthRecs().reduce((s, r) => s + (r[key] || 0), 0);

  const selectedEmp = employees.find(e => e.id === parseInt(form.employeeId));
  const previewCash = selectedEmp
    ? (selectedEmp.agreedSalary || 0)
      + (parseFloat(form.numDnevnica) || 0) * (selectedEmp.dnevnica || 0)
      + (parseFloat(form.numPergola) || 0) * pergolaRSD()
    : null;

  const generatePDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.width; const mg = 20; let y = 30;
      doc.setFontSize(18); doc.setFont(undefined, 'bold');
      doc.text(`OBRACUN ZARADA - ${name.toUpperCase()}`, pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${month}   |   Datum: ${new Date().toLocaleDateString('sr-RS')}`, pw / 2, y, { align: 'center' }); y += 18;
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(5, 150, 105);
      doc.text(`UKUPNA GOTOVINA: ${fmt(totalCash())} RSD  (${fmtEur(totalCash())})`, pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      doc.text(`Kurs: 1 EUR = ${eurRate} RSD   |   Bonus po pergoli: ${pergolaBonus} EUR = ${fmt(pergolaRSD())} RSD`, pw / 2, y, { align: 'center' }); y += 14;
      doc.setTextColor(0, 0, 0);
      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 25; }
        const rec = records.find(r => r.employeeId === emp.id && r.month === month);
        const cash = calcCash(emp.id, month);
        doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text(emp.name, mg, y); y += 7;
        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text(`Fiksna plata: ${fmt(emp.agreedSalary)} RSD   Dnevnica: ${fmt(emp.dnevnica)} RSD`, mg + 4, y); y += 5;
        if (rec) {
          if (rec.numDnevnica > 0) {
            doc.setTextColor(0, 120, 0);
            doc.text(`Dnevnice: ${rec.numDnevnica} x ${fmt(emp.dnevnica)} = ${fmt(rec.numDnevnica * emp.dnevnica)} RSD`, mg + 4, y); y += 5;
            doc.setTextColor(0, 0, 0);
          }
          if (rec.numPergola > 0) {
            doc.setTextColor(0, 120, 0);
            doc.text(`Pergole: ${rec.numPergola} x ${fmt(pergolaRSD())} = ${fmt(rec.numPergola * pergolaRSD())} RSD (${pergolaBonus} EUR/kom)`, mg + 4, y); y += 5;
            doc.setTextColor(0, 0, 0);
          }
          if (rec.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        } else { doc.setTextColor(160, 160, 160); doc.text('Nema obracuna', mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
        doc.setFont(undefined, 'bold');
        if (cash !== null) { doc.setTextColor(0, 130, 0); doc.text(`GOTOVINA: +${fmt(cash)} RSD  (${fmtEur(cash)})`, mg + 4, y); }
        doc.setTextColor(0, 0, 0); y += 12;
        doc.setDrawColor(220, 220, 220); doc.line(mg, y - 4, pw - mg, y - 4); y += 4;
      });
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
        doc.text('by AG GROUP', pw / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`${i}/${pages}`, pw - mg, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      doc.save(`${name}_${month.replace('-', '_')}.pdf`);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <header className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 px-6 pt-7 pb-6 sm:rounded-b-3xl shadow-xl">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
            <div>
              <InlineName value={name} onSave={setName} light />
              <p className="text-emerald-200/60 text-xs mt-1">Obračun zarada · fiksna plata + dnevnice + pergole</p>
            </div>
            <span className="text-[11px] text-emerald-200/40 font-medium pt-1">by AG GROUP</span>
          </div>

          {/* Settings */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
            <InlineSetting label="Kurs EUR" value={eurRate} suffix="RSD" onSave={setEurRate} />
            <InlineSetting label="Bonus / pergola" value={pergolaBonus} suffix="EUR" onSave={setPergolaBonus} />
            <span className="text-xs text-emerald-300/70">1 pergola = <strong className="text-emerald-200">{fmt(pergolaRSD())} RSD</strong></span>
          </div>

          {/* Tabs — segmented control */}
          <div className="flex gap-1 bg-white/5 backdrop-blur p-1 rounded-2xl">
            {[
              { key: 'employees', label: 'Radnici', Icon: Users },
              { key: 'monthly', label: 'Mesečni unos', Icon: Calendar },
              { key: 'summary', label: 'Obračun', Icon: Calculator },
            ].map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === key
                    ? 'bg-white text-emerald-800 shadow-md'
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="p-4 sm:p-5 space-y-4 pb-16">

          {/* ── RADNICI ── */}
          {tab === 'employees' && (<>
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-600 mb-4">Dodaj radnika</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <Field label="Ime i prezime" type="text" placeholder="npr. Marko Marković"
                  value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()} />
                <Field label="Fiksna plata (RSD)" type="number" placeholder="0"
                  value={newEmp.agreedSalary} onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()} />
                <Field label="Dnevnica (RSD)" type="number" placeholder="0"
                  value={newEmp.dnevnica} onChange={e => setNewEmp({ ...newEmp, dnevnica: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()} />
              </div>
              <button onClick={addEmployee} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Dodaj radnika
              </button>
            </Card>

            <div className="space-y-2">
              {employees.map(emp => (
                <Card key={emp.id} className="p-4">
                  {editingEmp?.id === emp.id ? (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        <Field label="Ime i prezime" type="text" value={editingEmp.name}
                          onChange={e => setEditingEmp(p => ({ ...p, name: e.target.value }))} />
                        <Field label="Fiksna plata (RSD)" type="number" value={editingEmp.agreedSalary}
                          onChange={e => setEditingEmp(p => ({ ...p, agreedSalary: e.target.value }))} />
                        <Field label="Dnevnica (RSD)" type="number" value={editingEmp.dnevnica}
                          onChange={e => setEditingEmp(p => ({ ...p, dnevnica: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEmpEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                          <Check className="w-3.5 h-3.5" /> Sačuvaj
                        </button>
                        <button onClick={() => setEditingEmp(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200">
                          <X className="w-3.5 h-3.5" /> Otkaži
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Avatar name={emp.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{emp.name}</p>
                        <div className="flex gap-4 text-sm text-slate-400 flex-wrap">
                          <span>Plata: <span className="text-slate-600 font-medium">{fmt(emp.agreedSalary)} RSD</span></span>
                          <span>Dnevnica: <span className="text-slate-600 font-medium">{fmt(emp.dnevnica)} RSD</span></span>
                        </div>
                      </div>
                      <button onClick={() => startEmpEdit(emp)} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Card>
              ))}
              {employees.length === 0 && <Empty Icon={Users} text="Nema radnika. Dodaj prvog radnika iznad." />}
            </div>
          </>)}

          {/* ── MESEČNI UNOS ── */}
          {tab === 'monthly' && (<>
            <Card className="p-5">
              <FieldLabel>Mesec</FieldLabel>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all" />
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-600 mb-4">Novi obračun — {month}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Radnik</FieldLabel>
                  <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all">
                    <option value="">Izaberi radnika...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} (dnev: {fmt(e.dnevnica)} RSD)</option>
                    ))}
                  </select>
                </div>
                <Field
                  label={selectedEmp ? `Broj dnevnica (× ${fmt(selectedEmp.dnevnica)} RSD)` : 'Broj dnevnica'}
                  type="number" value={form.numDnevnica} placeholder="0"
                  onChange={e => setForm({ ...form, numDnevnica: e.target.value })} />
                <Field
                  label={`Broj pergola (× ${fmt(pergolaRSD())} RSD)`}
                  type="number" value={form.numPergola} placeholder="0"
                  onChange={e => setForm({ ...form, numPergola: e.target.value })} />
                <Field label="Napomena" type="text" value={form.note} placeholder="..."
                  onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>

              {/* Live breakdown */}
              {selectedEmp && (
                <div className="mt-4 bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Fiksna plata</span>
                    <span className="font-medium tabular-nums">{fmt(selectedEmp.agreedSalary)} RSD</span>
                  </div>
                  {(parseFloat(form.numDnevnica) || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{form.numDnevnica} × {fmt(selectedEmp.dnevnica)} RSD dnevnica</span>
                      <span className="font-medium tabular-nums">+{fmt((parseFloat(form.numDnevnica) || 0) * selectedEmp.dnevnica)} RSD</span>
                    </div>
                  )}
                  {(parseFloat(form.numPergola) || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{form.numPergola} × {fmt(pergolaRSD())} RSD pergola</span>
                      <span className="font-medium tabular-nums">+{fmt((parseFloat(form.numPergola) || 0) * pergolaRSD())} RSD</span>
                    </div>
                  )}
                  <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-emerald-800">
                    <span>Ukupno gotovina</span>
                    <div className="text-right">
                      <div className="tabular-nums">{fmt(previewCash)} RSD</div>
                      <div className="text-emerald-500 font-normal text-xs">{fmtEur(previewCash)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <button onClick={addRecord} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> Dodaj obračun
                </button>
              </div>
            </Card>

            <div className="space-y-2">
              {monthRecs().map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const cash = calcCash(rec.employeeId, rec.month);
                const isEditing = editingRecord?.id === rec.id;
                return (
                  <Card key={rec.id} className="p-4">
                    {isEditing ? (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-3">{emp?.name}</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                          <Field
                            label={emp ? `Dnevnice (× ${fmt(emp.dnevnica)} RSD)` : 'Broj dnevnica'}
                            type="number" value={editingRecord.numDnevnica}
                            onChange={e => setEditingRecord(p => ({ ...p, numDnevnica: e.target.value }))} />
                          <Field
                            label={`Pergole (× ${fmt(pergolaRSD())} RSD)`}
                            type="number" value={editingRecord.numPergola}
                            onChange={e => setEditingRecord(p => ({ ...p, numPergola: e.target.value }))} />
                          <Field label="Napomena" type="text" value={editingRecord.note}
                            onChange={e => setEditingRecord(p => ({ ...p, note: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                            <Check className="w-3.5 h-3.5" /> Sačuvaj
                          </button>
                          <button onClick={() => setEditingRecord(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200">
                            <X className="w-3.5 h-3.5" /> Otkaži
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <Avatar name={emp?.name || ''} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 mb-2">{emp?.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">Plata: {fmt(emp?.agreedSalary)} RSD</span>
                            {rec.numDnevnica > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs">
                                {rec.numDnevnica}× dnevnica = {fmt(rec.numDnevnica * (emp?.dnevnica || 0))} RSD
                              </span>
                            )}
                            {rec.numPergola > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs">
                                {rec.numPergola}× pergola = {fmt(rec.numPergola * pergolaRSD())} RSD
                              </span>
                            )}
                          </div>
                          {rec.note && <p className="text-xs text-slate-400 mt-1.5">{rec.note}</p>}
                        </div>
                        <div className="flex items-start gap-1 flex-shrink-0">
                          {cash !== null && (
                            <div className="text-right">
                              <CashTag value={cash} />
                              <div className="text-xs text-slate-400 mt-0.5 text-right">{fmtEur(cash)}</div>
                            </div>
                          )}
                          <button onClick={() => startEdit(rec)} className="p-1.5 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRecord(rec.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              {monthRecs().length === 0 && <Empty Icon={Calendar} text={`Nema obračuna za ${month}`} />}
            </div>
          </>)}

          {/* ── OBRAČUN ── */}
          {tab === 'summary' && (<>
            <div>
              <FieldLabel>Mesec</FieldLabel>
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {allMonths().map(m => <option key={m} value={m}>{m}</option>)}
                {allMonths().length === 0 && <option value={month}>{month}</option>}
              </select>
            </div>

            {/* Hero total */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-emerald-100/70 text-xs font-semibold uppercase tracking-wider mb-1">Ukupna gotovina</p>
              <p className="text-4xl font-bold tracking-tight tabular-nums">{fmt(totalCash())} RSD</p>
              <p className="text-emerald-100 text-lg font-semibold mt-1 tabular-nums">{fmtEur(totalCash())}</p>
              <p className="text-emerald-200/60 text-xs mt-2">{name} · {month} · kurs {eurRate} RSD/€</p>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KPI Icon={Users} label="Obračunato" value={`${monthRecs().length} / ${employees.length}`} sub="radnika" />
              <KPI Icon={Sun} label="Dnevnice" value={fmt(monthStat('numDnevnica'))} sub="ukupno u mesecu" />
              <KPI Icon={Layers} label="Pergole" value={fmt(monthStat('numPergola'))} sub={`× ${fmt(pergolaRSD())} RSD`} />
            </div>

            <div className="space-y-2">
              {employees.map(emp => {
                const rec = records.find(r => r.employeeId === emp.id && r.month === month);
                const cash = calcCash(emp.id, month);
                return (
                  <Card key={emp.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{emp.name}</p>
                        {rec ? (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-0.5 text-slate-400">
                            <span>Plata: {fmt(emp.agreedSalary)}</span>
                            {rec.numDnevnica > 0 && <span className="text-emerald-600">{rec.numDnevnica}× dnev. +{fmt(rec.numDnevnica * emp.dnevnica)}</span>}
                            {rec.numPergola > 0 && <span className="text-emerald-600">{rec.numPergola}× perg. +{fmt(rec.numPergola * pergolaRSD())}</span>}
                          </div>
                        ) : <p className="text-xs text-slate-300 italic">nema obračuna</p>}
                      </div>
                      {cash !== null ? (
                        <div className="text-right flex-shrink-0">
                          <CashTag value={cash} />
                          <div className="text-xs text-slate-400 mt-0.5">{fmtEur(cash)}</div>
                        </div>
                      ) : <span className="text-xs text-slate-300">—</span>}
                    </div>
                  </Card>
                );
              })}
              {employees.length === 0 && <Empty Icon={Users} text="Nema radnika" />}
            </div>

            <div className="flex justify-center pt-2 pb-4">
              <button onClick={generatePDF} className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg">
                <Download className="w-5 h-5" /> Preuzmi PDF izveštaj
              </button>
            </div>
          </>)}
        </main>
      </div>
    </div>
  );
};

export default ProhorecaApp;
