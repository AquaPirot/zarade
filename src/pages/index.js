'use client'
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Users, Calendar, DollarSign, Download, Edit2, Check, X } from 'lucide-react';

const fmt = (n) => Math.round(n || 0).toLocaleString('sr-RS');

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{children}</label>
);

const Field = ({ label, ...props }) => (
  <div>
    {label && <FieldLabel>{label}</FieldLabel>}
    <input className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-300" {...props} />
  </div>
);

const initials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0] || '').join('').substring(0, 2).toUpperCase();

const CashTag = ({ value }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${
    value >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
  }`}>
    {value >= 0 ? '+' : ''}{fmt(value)} RSD
  </span>
);

const Empty = ({ Icon, text }) => (
  <div className="text-center py-14">
    <Icon className="w-11 h-11 mx-auto mb-3 text-gray-200" />
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const Avatar = ({ name, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-700',
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${colors[color]}`}>
      {initials(name)}
    </div>
  );
};

// Editable inline name
const InlineName = ({ value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const save = () => { const t = val.trim(); if (t) { onSave(t); setEditing(false); } };
  useEffect(() => { setVal(value); }, [value]);
  if (editing) return (
    <div className="flex items-center gap-2">
      <input value={val} onChange={e => setVal(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        className="px-3 py-1.5 border border-blue-300 rounded-lg text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 w-52" />
      <button onClick={save} className="p-1 text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
      <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
  return (
    <button onClick={() => { setVal(value); setEditing(true); }} className="flex items-center gap-2 group">
      <h2 className="text-xl font-bold text-gray-800">{value}</h2>
      <Edit2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
    </button>
  );
};

// ─── FIRMA 1 ──────────────────────────────────────────────────────────────────
const Firma1 = ({ onNameChange }) => {
  const [name, setName] = useState('Firma 1');
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [monthDefaults, setMonthDefaults] = useState({});
  const [tab, setTab] = useState('employees');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newEmp, setNewEmp] = useState({ name: '', agreedSalary: '' });
  const [form, setForm] = useState({ employeeId: '', paidSalary: '', transport: '', bonus: '', penalty: '', note: '' });
  const [defForm, setDefForm] = useState({ minimalac: '', transport: '' });
  const [editingDef, setEditingDef] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const g = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
    const n = localStorage.getItem('f1_name') || 'Firma 1';
    setName(n); onNameChange?.(n);
    setEmployees(g('f1_employees', []));
    setRecords(g('f1_records', []));
    setMonthDefaults(g('f1_monthDefaults', {}));
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') { localStorage.setItem('f1_name', name); onNameChange?.(name); } }, [name]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f1_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f1_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f1_monthDefaults', JSON.stringify(monthDefaults)); }, [monthDefaults]);

  const currentDef = monthDefaults[month];

  useEffect(() => {
    const d = monthDefaults[month];
    setDefForm({ minimalac: d?.minimalac ?? '', transport: d?.transport ?? '' });
    setForm(f => ({ ...f, paidSalary: d?.minimalac ?? '', transport: d?.transport ?? '' }));
    setEditingDef(false);
  }, [month]);

  const saveDef = () => {
    const d = { minimalac: parseFloat(defForm.minimalac) || 0, transport: parseFloat(defForm.transport) || 0 };
    setMonthDefaults(p => ({ ...p, [month]: d }));
    setForm(f => ({ ...f, paidSalary: d.minimalac, transport: d.transport }));
    setEditingDef(false);
  };

  const addEmployee = () => {
    if (!newEmp.name.trim() || !newEmp.agreedSalary) return;
    setEmployees(p => [...p, { id: Date.now(), name: newEmp.name.trim(), agreedSalary: parseFloat(newEmp.agreedSalary) || 0 }]);
    setNewEmp({ name: '', agreedSalary: '' });
  };

  const deleteEmployee = (id) => {
    if (!window.confirm('Obrisati zaposlenog i sve zapise?')) return;
    setEmployees(p => p.filter(e => e.id !== id));
    setRecords(p => p.filter(r => r.employeeId !== id));
  };

  const resetForm = () => {
    const d = monthDefaults[month];
    setForm({ employeeId: '', paidSalary: d?.minimalac ?? '', transport: d?.transport ?? '', bonus: '', penalty: '', note: '' });
  };

  const addRecord = () => {
    if (!form.employeeId) return;
    if (records.find(r => r.employeeId === parseInt(form.employeeId) && r.month === month)) {
      alert('Već postoji zapis za ovog zaposlenog u ovom mesecu.'); return;
    }
    setRecords(p => [...p, {
      id: Date.now(), employeeId: parseInt(form.employeeId), month,
      paidSalary: parseFloat(form.paidSalary) || 0,
      transport: parseFloat(form.transport) || 0,
      bonus: parseFloat(form.bonus) || 0,
      penalty: parseFloat(form.penalty) || 0,
      note: form.note,
    }]);
    resetForm();
  };

  const deleteRecord = (id) => {
    if (!window.confirm('Obrisati zapis?')) return;
    setRecords(p => p.filter(r => r.id !== id));
  };

  const calcCash = (empId, m) => {
    const emp = employees.find(e => e.id === empId);
    const rec = records.find(r => r.employeeId === empId && r.month === m);
    if (!emp || !rec) return null;
    return (emp.agreedSalary || 0) - (rec.paidSalary || 0) - (rec.transport || 0) + (rec.bonus || 0) - (rec.penalty || 0);
  };

  const totalCash = () => employees.reduce((s, e) => s + Math.max(0, calcCash(e.id, month) ?? 0), 0);
  const monthRecs = () => records.filter(r => r.month === month);
  const allMonths = () => [...new Set(records.map(r => r.month))].sort().reverse();

  const previewCash = (() => {
    if (!form.employeeId) return null;
    const emp = employees.find(e => e.id === parseInt(form.employeeId));
    if (!emp) return null;
    return (emp.agreedSalary || 0) - (parseFloat(form.paidSalary) || 0) - (parseFloat(form.transport) || 0) + (parseFloat(form.bonus) || 0) - (parseFloat(form.penalty) || 0);
  })();

  const generatePDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.width; const mg = 20; let y = 30;
      doc.setFontSize(18); doc.setFont(undefined, 'bold');
      doc.text(`OBRACUN ZARADA - ${name.toUpperCase()}`, pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${month}   |   Datum: ${new Date().toLocaleDateString('sr-RS')}`, pw / 2, y, { align: 'center' }); y += 18;
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(37, 99, 235);
      doc.text(`UKUPNA GOTOVINA: ${fmt(totalCash())} RSD`, pw / 2, y, { align: 'center' }); y += 18; doc.setTextColor(0, 0, 0);
      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 25; }
        const rec = records.find(r => r.employeeId === emp.id && r.month === month);
        const cash = calcCash(emp.id, month);
        doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text(emp.name, mg, y); y += 7;
        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text(`Ugovorena zarada: ${fmt(emp.agreedSalary)} RSD`, mg + 4, y); y += 5;
        if (rec) {
          doc.text(`Na racun: ${fmt(rec.paidSalary)} RSD   Prevoz: ${fmt(rec.transport)} RSD`, mg + 4, y); y += 5;
          if (rec.bonus > 0) { doc.setTextColor(0, 120, 0); doc.text(`Bonus: +${fmt(rec.bonus)} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if (rec.penalty > 0) { doc.setTextColor(180, 0, 0); doc.text(`Kazna: -${fmt(rec.penalty)} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if (rec.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        } else { doc.setTextColor(160, 160, 160); doc.text('Nema unosa za ovaj mesec', mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
        doc.setFont(undefined, 'bold');
        if (cash !== null) {
          if (cash >= 0) { doc.setTextColor(0, 130, 0); doc.text(`GOTOVINA: +${fmt(cash)} RSD`, mg + 4, y); }
          else { doc.setTextColor(180, 0, 0); doc.text(`GOTOVINA: ${fmt(cash)} RSD`, mg + 4, y); }
        }
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
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <InlineName value={name} onSave={setName} />
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{employees.length} zaposlenih</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-6">
        <nav className="flex">
          {[
            { key: 'employees', label: 'Zaposleni', Icon: Users },
            { key: 'monthly', label: 'Mesečni Unos', Icon: Calendar },
            { key: 'summary', label: 'Obračun', Icon: Calculator },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5 space-y-4">

        {/* ── ZAPOSLENI ── */}
        {tab === 'employees' && (<>
          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-600 mb-4">Dodaj zaposlenog</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Field label="Ime i prezime" type="text" placeholder="npr. Marko Marković"
                value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addEmployee()} />
              <Field label="Ugovorena zarada (RSD)" type="number" placeholder="0"
                value={newEmp.agreedSalary} onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addEmployee()} />
            </div>
            <button onClick={addEmployee} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Dodaj zaposlenog
            </button>
          </Card>

          <div className="space-y-2">
            {employees.map(emp => (
              <Card key={emp.id} className="p-4 flex items-center gap-4">
                <Avatar name={emp.name} color="indigo" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{emp.name}</p>
                  <p className="text-sm text-gray-400">Ugovorena: <span className="text-gray-600 font-medium">{fmt(emp.agreedSalary)} RSD</span></p>
                </div>
                <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))}
            {employees.length === 0 && <Empty Icon={Users} text="Nema zaposlenih. Dodaj prvog zaposlenog iznad." />}
          </div>
        </>)}

        {/* ── MESEČNI UNOS ── */}
        {tab === 'monthly' && (<>
          {/* Month selector + defaults */}
          <Card className="p-5">
            <div className="flex flex-wrap gap-5 items-start">
              <div>
                <FieldLabel>Mesec</FieldLabel>
                <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                  className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <FieldLabel>Podrazumevano za {month}</FieldLabel>
                  <button onClick={() => setEditingDef(v => !v)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold -mt-1 transition-colors">
                    {editingDef ? 'Otkaži' : currentDef ? 'Izmeni' : '+ Postavi'}
                  </button>
                </div>
                {editingDef ? (
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Minimalac (RSD)</label>
                      <input type="number" value={defForm.minimalac} onChange={e => setDefForm({ ...defForm, minimalac: e.target.value })}
                        className="w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Prevoz (RSD)</label>
                      <input type="number" value={defForm.transport} onChange={e => setDefForm({ ...defForm, transport: e.target.value })}
                        className="w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <button onClick={saveDef} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Sačuvaj</button>
                  </div>
                ) : currentDef ? (
                  <div className="flex gap-5 text-sm text-gray-500">
                    <span>Minimalac: <strong className="text-gray-800">{fmt(currentDef.minimalac)} RSD</strong></span>
                    <span>Prevoz: <strong className="text-gray-800">{fmt(currentDef.transport)} RSD</strong></span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 italic">Nisu postavljene — klikni "+ Postavi"</p>
                )}
              </div>
            </div>
          </Card>

          {/* Add record form */}
          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-600 mb-4">Novi unos — {month}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <FieldLabel>Zaposleni</FieldLabel>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
                  <option value="">Izaberi zaposlenog...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <Field label="Na račun (RSD)" type="number" value={form.paidSalary}
                placeholder={currentDef ? fmt(currentDef.minimalac) : '0'}
                onChange={e => setForm({ ...form, paidSalary: e.target.value })} />
              <Field label="Prevoz (RSD)" type="number" value={form.transport}
                placeholder={currentDef ? fmt(currentDef.transport) : '0'}
                onChange={e => setForm({ ...form, transport: e.target.value })} />
              <Field label="Bonus (RSD)" type="number" value={form.bonus} placeholder="0"
                onChange={e => setForm({ ...form, bonus: e.target.value })} />
              <Field label="Kazna (RSD)" type="number" value={form.penalty} placeholder="0"
                onChange={e => setForm({ ...form, penalty: e.target.value })} />
              <Field label="Napomena" type="text" value={form.note} placeholder="..."
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            {previewCash !== null && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-400">Gotovina:</span>
                <CashTag value={previewCash} />
              </div>
            )}
            <div className="mt-4">
              <button onClick={addRecord} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> Dodaj zapis
              </button>
            </div>
          </Card>

          <div className="space-y-2">
            {monthRecs().map(rec => {
              const emp = employees.find(e => e.id === rec.employeeId);
              const cash = calcCash(rec.employeeId, rec.month);
              return (
                <Card key={rec.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={emp?.name || ''} color="indigo" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 mb-2">{emp?.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">Račun: {fmt(rec.paidSalary)} RSD</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">Prevoz: {fmt(rec.transport)} RSD</span>
                        {rec.bonus > 0 && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-xs">+{fmt(rec.bonus)} bonus</span>}
                        {rec.penalty > 0 && <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs">-{fmt(rec.penalty)} kazna</span>}
                      </div>
                      {rec.note && <p className="text-xs text-gray-400 mt-1.5">{rec.note}</p>}
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {cash !== null && <CashTag value={cash} />}
                      <button onClick={() => deleteRecord(rec.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {monthRecs().length === 0 && <Empty Icon={Calendar} text={`Nema zapisa za ${month}`} />}
          </div>
        </>)}

        {/* ── OBRAČUN ── */}
        {tab === 'summary' && (<>
          <div>
            <FieldLabel>Mesec</FieldLabel>
            <select value={month} onChange={e => setMonth(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {allMonths().map(m => <option key={m} value={m}>{m}</option>)}
              {allMonths().length === 0 && <option value={month}>{month}</option>}
            </select>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Ukupna gotovina</p>
            <p className="text-4xl font-bold tracking-tight">{fmt(totalCash())} RSD</p>
            <p className="text-blue-300 text-xs mt-2">{name} · {month}</p>
          </div>

          <div className="space-y-2">
            {employees.map(emp => {
              const rec = records.find(r => r.employeeId === emp.id && r.month === month);
              const cash = calcCash(emp.id, month);
              return (
                <Card key={emp.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} color="indigo" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400 mb-1">Ugovorena: {fmt(emp.agreedSalary)} RSD</p>
                      {rec ? (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs text-gray-400">Račun: {fmt(rec.paidSalary)}</span>
                          <span className="text-xs text-gray-400">· Prevoz: {fmt(rec.transport)}</span>
                          {rec.bonus > 0 && <span className="text-xs text-green-600">· +{fmt(rec.bonus)} bonus</span>}
                          {rec.penalty > 0 && <span className="text-xs text-red-500">· -{fmt(rec.penalty)} kazna</span>}
                        </div>
                      ) : <p className="text-xs text-gray-300 italic">nema unosa</p>}
                    </div>
                    {cash !== null && <CashTag value={cash} />}
                  </div>
                </Card>
              );
            })}
            {employees.length === 0 && <Empty Icon={Users} text="Nema zaposlenih" />}
          </div>

          <div className="flex justify-center pt-2 pb-4">
            <button onClick={generatePDF} className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg">
              <Download className="w-5 h-5" /> Preuzmi PDF izveštaj
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
};

// ─── FIRMA 2 ──────────────────────────────────────────────────────────────────
const Firma2 = ({ onNameChange }) => {
  const [name, setName] = useState('Firma 2');
  const [eurRate, setEurRate] = useState(117);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('117');
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('employees');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newEmp, setNewEmp] = useState({ name: '', agreedSalary: '', dnevnica: '' });
  const [form, setForm] = useState({ employeeId: '', numDnevnica: '', numSistema: '', note: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const g = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
    const n = localStorage.getItem('f2_name') || 'Firma 2';
    setName(n); onNameChange?.(n);
    const s = g('f2_settings', { eurRate: 117 });
    setEurRate(s.eurRate || 117); setRateInput(String(s.eurRate || 117));
    setEmployees(g('f2_employees', []));
    setRecords(g('f2_records', []));
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') { localStorage.setItem('f2_name', name); onNameChange?.(name); } }, [name]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f2_settings', JSON.stringify({ eurRate })); }, [eurRate]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f2_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('f2_records', JSON.stringify(records)); }, [records]);

  const sistemRSD = () => 10 * (eurRate || 117);

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
    if (!window.confirm('Obrisati zaposlenog i sve zapise?')) return;
    setEmployees(p => p.filter(e => e.id !== id));
    setRecords(p => p.filter(r => r.employeeId !== id));
  };

  const addRecord = () => {
    if (!form.employeeId) return;
    if (records.find(r => r.employeeId === parseInt(form.employeeId) && r.month === month)) {
      alert('Već postoji obračun za ovog zaposlenog u ovom mesecu.'); return;
    }
    setRecords(p => [...p, {
      id: Date.now(), employeeId: parseInt(form.employeeId), month,
      numDnevnica: parseFloat(form.numDnevnica) || 0,
      numSistema: parseFloat(form.numSistema) || 0,
      note: form.note,
    }]);
    setForm({ employeeId: '', numDnevnica: '', numSistema: '', note: '' });
  };

  const deleteRecord = (id) => {
    if (!window.confirm('Obrisati zapis?')) return;
    setRecords(p => p.filter(r => r.id !== id));
  };

  const calcCash = (empId, m) => {
    const emp = employees.find(e => e.id === empId);
    const rec = records.find(r => r.employeeId === empId && r.month === m);
    if (!emp || !rec) return null;
    return (emp.agreedSalary || 0)
      + (rec.numDnevnica || 0) * (emp.dnevnica || 0)
      + (rec.numSistema || 0) * sistemRSD();
  };

  const totalCash = () => employees.reduce((s, e) => s + Math.max(0, calcCash(e.id, month) ?? 0), 0);
  const monthRecs = () => records.filter(r => r.month === month);
  const allMonths = () => [...new Set(records.map(r => r.month))].sort().reverse();

  const selectedEmp = employees.find(e => e.id === parseInt(form.employeeId));
  const previewCash = selectedEmp
    ? (selectedEmp.agreedSalary || 0)
      + (parseFloat(form.numDnevnica) || 0) * (selectedEmp.dnevnica || 0)
      + (parseFloat(form.numSistema) || 0) * sistemRSD()
    : null;

  const generatePDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.width; const mg = 20; let y = 30;
      doc.setFontSize(18); doc.setFont(undefined, 'bold');
      doc.text(`OBRACUN ZARADA - ${name.toUpperCase()}`, pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${month}   |   Datum: ${new Date().toLocaleDateString('sr-RS')}`, pw / 2, y, { align: 'center' }); y += 18;
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(13, 148, 136);
      doc.text(`UKUPNA GOTOVINA: ${fmt(totalCash())} RSD`, pw / 2, y, { align: 'center' }); y += 18; doc.setTextColor(0, 0, 0);
      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 25; }
        const rec = records.find(r => r.employeeId === emp.id && r.month === month);
        const cash = calcCash(emp.id, month);
        doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.text(emp.name, mg, y); y += 7;
        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text(`Ugovorena zarada: ${fmt(emp.agreedSalary)} RSD   Ugovorena dnevnica: ${fmt(emp.dnevnica)} RSD`, mg + 4, y); y += 5;
        if (rec) {
          if (rec.numDnevnica > 0) {
            doc.setTextColor(0, 120, 0);
            doc.text(`Dnevnice: ${rec.numDnevnica} × ${fmt(emp.dnevnica)} = ${fmt(rec.numDnevnica * emp.dnevnica)} RSD`, mg + 4, y); y += 5;
            doc.setTextColor(0, 0, 0);
          }
          if (rec.numSistema > 0) {
            doc.setTextColor(0, 120, 0);
            doc.text(`Sistemi: ${rec.numSistema} × ${fmt(sistemRSD())} = ${fmt(rec.numSistema * sistemRSD())} RSD (10 EUR)`, mg + 4, y); y += 5;
            doc.setTextColor(0, 0, 0);
          }
          if (rec.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        } else { doc.setTextColor(160, 160, 160); doc.text('Nema unosa', mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
        doc.setFont(undefined, 'bold');
        if (cash !== null) { doc.setTextColor(0, 130, 0); doc.text(`GOTOVINA: +${fmt(cash)} RSD`, mg + 4, y); }
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
    <div>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <InlineName value={name} onSave={setName} />
        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{employees.length} zaposlenih</span>
      </div>

      {/* EUR rate bar */}
      <div className="px-6 py-2.5 bg-teal-50 border-b border-teal-100 flex items-center gap-2 flex-wrap text-sm">
        <span className="text-teal-600 font-medium">Kurs EUR:</span>
        {editingRate ? (
          <div className="flex items-center gap-1.5">
            <input type="number" value={rateInput} onChange={e => setRateInput(e.target.value)} autoFocus
              className="w-20 px-2 py-1 border border-teal-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            <button onClick={() => { setEurRate(parseFloat(rateInput) || 117); setEditingRate(false); }} className="p-1 text-green-600"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditingRate(false)} className="p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => { setRateInput(String(eurRate)); setEditingRate(true); }} className="flex items-center gap-1 font-bold text-teal-800 hover:text-teal-600 transition-colors">
            {eurRate} RSD <Edit2 className="w-3 h-3" />
          </button>
        )}
        <span className="text-teal-400 hidden sm:inline">·</span>
        <span className="text-teal-600">Bonus za 1 sistem = 10 EUR = <strong>{fmt(sistemRSD())} RSD</strong></span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 px-6">
        <nav className="flex">
          {[
            { key: 'employees', label: 'Zaposleni', Icon: Users },
            { key: 'monthly', label: 'Mesečni Unos', Icon: Calendar },
            { key: 'summary', label: 'Obračun', Icon: Calculator },
          ].map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all ${
                tab === key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5 space-y-4">

        {/* ── ZAPOSLENI ── */}
        {tab === 'employees' && (<>
          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-600 mb-4">Dodaj zaposlenog</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Field label="Ime i prezime" type="text" placeholder="npr. Marko Marković"
                value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addEmployee()} />
              <Field label="Ugovorena zarada (RSD)" type="number" placeholder="0"
                value={newEmp.agreedSalary} onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addEmployee()} />
              <Field label="Ugovorena dnevnica (RSD)" type="number" placeholder="0"
                value={newEmp.dnevnica} onChange={e => setNewEmp({ ...newEmp, dnevnica: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addEmployee()} />
            </div>
            <button onClick={addEmployee} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
              <Plus className="w-4 h-4" /> Dodaj zaposlenog
            </button>
          </Card>

          <div className="space-y-2">
            {employees.map(emp => (
              <Card key={emp.id} className="p-4 flex items-center gap-4">
                <Avatar name={emp.name} color="teal" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{emp.name}</p>
                  <div className="flex gap-4 text-sm text-gray-400 flex-wrap">
                    <span>Zarada: <span className="text-gray-600 font-medium">{fmt(emp.agreedSalary)} RSD</span></span>
                    <span>Dnevnica: <span className="text-gray-600 font-medium">{fmt(emp.dnevnica)} RSD</span></span>
                  </div>
                </div>
                <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </Card>
            ))}
            {employees.length === 0 && <Empty Icon={Users} text="Nema zaposlenih. Dodaj prvog zaposlenog iznad." />}
          </div>
        </>)}

        {/* ── MESEČNI UNOS ── */}
        {tab === 'monthly' && (<>
          <Card className="p-5">
            <FieldLabel>Mesec</FieldLabel>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all" />
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-600 mb-4">Novi obračun — {month}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Zaposleni</FieldLabel>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all">
                  <option value="">Izaberi zaposlenog...</option>
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
                label={`Broj ugrađenih sistema (× ${fmt(sistemRSD())} RSD)`}
                type="number" value={form.numSistema} placeholder="0"
                onChange={e => setForm({ ...form, numSistema: e.target.value })} />
              <Field label="Napomena" type="text" value={form.note} placeholder="..."
                onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>

            {/* Live breakdown */}
            {selectedEmp && (
              <div className="mt-4 bg-teal-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Zarada</span>
                  <span className="font-medium">{fmt(selectedEmp.agreedSalary)} RSD</span>
                </div>
                {(parseFloat(form.numDnevnica) || 0) > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>{form.numDnevnica} × {fmt(selectedEmp.dnevnica)} RSD dnevnica</span>
                    <span className="font-medium">+{fmt((parseFloat(form.numDnevnica) || 0) * selectedEmp.dnevnica)} RSD</span>
                  </div>
                )}
                {(parseFloat(form.numSistema) || 0) > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>{form.numSistema} × {fmt(sistemRSD())} RSD sistem</span>
                    <span className="font-medium">+{fmt((parseFloat(form.numSistema) || 0) * sistemRSD())} RSD</span>
                  </div>
                )}
                <div className="border-t border-teal-200 pt-2 flex justify-between font-bold text-teal-800">
                  <span>Ukupno gotovina</span>
                  <span>{fmt(previewCash)} RSD</span>
                </div>
              </div>
            )}

            <div className="mt-4">
              <button onClick={addRecord} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
                <Plus className="w-4 h-4" /> Dodaj obračun
              </button>
            </div>
          </Card>

          <div className="space-y-2">
            {monthRecs().map(rec => {
              const emp = employees.find(e => e.id === rec.employeeId);
              const cash = calcCash(rec.employeeId, rec.month);
              return (
                <Card key={rec.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={emp?.name || ''} color="teal" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 mb-2">{emp?.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">Zarada: {fmt(emp?.agreedSalary)} RSD</span>
                        {rec.numDnevnica > 0 && (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs">
                            {rec.numDnevnica}× dnevnica = {fmt(rec.numDnevnica * (emp?.dnevnica || 0))} RSD
                          </span>
                        )}
                        {rec.numSistema > 0 && (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs">
                            {rec.numSistema}× sistem = {fmt(rec.numSistema * sistemRSD())} RSD
                          </span>
                        )}
                      </div>
                      {rec.note && <p className="text-xs text-gray-400 mt-1.5">{rec.note}</p>}
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {cash !== null && <CashTag value={cash} />}
                      <button onClick={() => deleteRecord(rec.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {allMonths().map(m => <option key={m} value={m}>{m}</option>)}
              {allMonths().length === 0 && <option value={month}>{month}</option>}
            </select>
          </div>

          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-wider mb-1">Ukupna gotovina</p>
            <p className="text-4xl font-bold tracking-tight">{fmt(totalCash())} RSD</p>
            <p className="text-teal-300 text-xs mt-2">{name} · {month}</p>
          </div>

          <div className="space-y-2">
            {employees.map(emp => {
              const rec = records.find(r => r.employeeId === emp.id && r.month === month);
              const cash = calcCash(emp.id, month);
              return (
                <Card key={emp.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} color="teal" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800">{emp.name}</p>
                      {rec ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mt-0.5 text-gray-400">
                          <span>Zarada: {fmt(emp.agreedSalary)}</span>
                          {rec.numDnevnica > 0 && <span className="text-teal-600">{rec.numDnevnica}× dnev. +{fmt(rec.numDnevnica * emp.dnevnica)}</span>}
                          {rec.numSistema > 0 && <span className="text-teal-600">{rec.numSistema}× sist. +{fmt(rec.numSistema * sistemRSD())}</span>}
                        </div>
                      ) : <p className="text-xs text-gray-300 italic">nema obračuna</p>}
                    </div>
                    {cash !== null ? <CashTag value={cash} /> : <span className="text-xs text-gray-300">—</span>}
                  </div>
                </Card>
              );
            })}
            {employees.length === 0 && <Empty Icon={Users} text="Nema zaposlenih" />}
          </div>

          <div className="flex justify-center pt-2 pb-4">
            <button onClick={generatePDF} className="flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white font-semibold rounded-2xl hover:bg-teal-700 transition-colors shadow-lg">
              <Download className="w-5 h-5" /> Preuzmi PDF izveštaj
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PayrollApp = () => {
  const [active, setActive] = useState('f1');
  const [names, setNames] = useState({ f1: 'Firma 1', f2: 'Firma 2' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNames({
      f1: localStorage.getItem('f1_name') || 'Firma 1',
      f2: localStorage.getItem('f2_name') || 'Firma 2',
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-3xl mx-auto">
        {/* App header */}
        <div className="bg-slate-900 px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ZARADE</h1>
              <p className="text-slate-500 text-xs mt-0.5">Sistem za obračun zarada</p>
            </div>
            <span className="text-xs text-slate-600 font-medium">by AG GROUP</span>
          </div>
          {/* Company tabs */}
          <div className="flex gap-1">
            <button onClick={() => setActive('f1')}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
                active === 'f1'
                  ? 'bg-white text-blue-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              {names.f1}
            </button>
            <button onClick={() => setActive('f2')}
              className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all ${
                active === 'f2'
                  ? 'bg-white text-teal-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              {names.f2}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white shadow-sm min-h-screen rounded-b-none">
          {active === 'f1'
            ? <Firma1 onNameChange={n => setNames(p => ({ ...p, f1: n }))} />
            : <Firma2 onNameChange={n => setNames(p => ({ ...p, f2: n }))} />
          }
        </div>
      </div>
    </div>
  );
};

export default PayrollApp;
