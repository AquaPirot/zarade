'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Users, Calendar, DollarSign, Download, Settings } from 'lucide-react';

// ─── Firma 1 ─────────────────────────────────────────────────────────────────

const Firma1 = () => {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState({ defaultMinimalac: 0, defaultTransport: 0 });
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newEmp, setNewEmp] = useState({ name: '', agreedSalary: '' });
  const [form, setForm] = useState({ employeeId: '', paidSalary: '', transport: '', bonus: '', penalty: '', note: '' });
  const [settingsForm, setSettingsForm] = useState({ defaultMinimalac: '', defaultTransport: '' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const e = localStorage.getItem('f1_employees');
    const r = localStorage.getItem('f1_records');
    const s = localStorage.getItem('f1_settings');
    if (e) setEmployees(JSON.parse(e));
    if (r) setRecords(JSON.parse(r));
    if (s) {
      const p = JSON.parse(s);
      setSettings(p);
      setSettingsForm({ defaultMinimalac: p.defaultMinimalac, defaultTransport: p.defaultTransport });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f1_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f1_records', JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f1_settings', JSON.stringify(settings));
  }, [settings]);

  const resetForm = (s = settings) => setForm({
    employeeId: '', paidSalary: s.defaultMinimalac || '', transport: s.defaultTransport || '', bonus: '', penalty: '', note: ''
  });

  const goToTab = (tab) => {
    if (tab === 'monthly') resetForm();
    setActiveTab(tab);
  };

  const addEmployee = () => {
    if (!newEmp.name.trim() || !newEmp.agreedSalary) return;
    setEmployees([...employees, { id: Date.now(), name: newEmp.name.trim(), agreedSalary: parseFloat(newEmp.agreedSalary) }]);
    setNewEmp({ name: '', agreedSalary: '' });
  };

  const deleteEmployee = (id) => {
    if (!window.confirm('Obrisati zaposlenog i sve njegove zapise?')) return;
    setEmployees(employees.filter(e => e.id !== id));
    setRecords(records.filter(r => r.employeeId !== id));
  };

  const addRecord = () => {
    if (!form.employeeId) return;
    const exists = records.find(r => r.employeeId === parseInt(form.employeeId) && r.month === selectedMonth);
    if (exists) { alert('Već postoji zapis za ovog zaposlenog u ovom mesecu.'); return; }
    setRecords([...records, {
      id: Date.now(),
      employeeId: parseInt(form.employeeId),
      month: selectedMonth,
      paidSalary: parseFloat(form.paidSalary) || 0,
      transport: parseFloat(form.transport) || 0,
      bonus: parseFloat(form.bonus) || 0,
      penalty: parseFloat(form.penalty) || 0,
      note: form.note
    }]);
    resetForm();
  };

  const deleteRecord = (id) => {
    if (!window.confirm('Obrisati zapis?')) return;
    setRecords(records.filter(r => r.id !== id));
  };

  const calcCash = (empId, month) => {
    const emp = employees.find(e => e.id === empId);
    const rec = records.find(r => r.employeeId === empId && r.month === month);
    if (!emp || !rec) return null;
    return (emp.agreedSalary || 0) - (rec.paidSalary || 0) - (rec.transport || 0) + (rec.bonus || 0) - (rec.penalty || 0);
  };

  const totalCash = () => employees.reduce((sum, emp) => {
    const c = calcCash(emp.id, selectedMonth);
    return sum + Math.max(0, c ?? 0);
  }, 0);

  const monthRecords = () => records.filter(r => r.month === selectedMonth);
  const allMonths = () => [...new Set(records.map(r => r.month))].sort().reverse();

  const saveSettings = () => {
    const s = { defaultMinimalac: parseFloat(settingsForm.defaultMinimalac) || 0, defaultTransport: parseFloat(settingsForm.defaultTransport) || 0 };
    setSettings(s);
    resetForm(s);
    alert('Sačuvano.');
  };

  const generatePDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.width;
      const mg = 20;
      let y = 30;

      doc.setFontSize(18); doc.setFont(undefined, 'bold');
      doc.text('OBRACUN ZARADA - FIRMA 1', pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${selectedMonth}   |   Datum: ${new Date().toLocaleDateString('sr-RS')}`, pw / 2, y, { align: 'center' }); y += 18;

      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(100, 0, 130);
      doc.text(`UKUPNA GOTOVINA: ${totalCash().toLocaleString()} RSD`, pw / 2, y, { align: 'center' });
      y += 18; doc.setTextColor(0, 0, 0);

      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 25; }
        const rec = records.find(r => r.employeeId === emp.id && r.month === selectedMonth);
        const cash = calcCash(emp.id, selectedMonth);

        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text(emp.name, mg, y); y += 7;
        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text(`Ugovorena zarada: ${(emp.agreedSalary || 0).toLocaleString()} RSD`, mg + 4, y); y += 5;

        if (rec) {
          doc.text(`Na racun: ${(rec.paidSalary || 0).toLocaleString()} RSD   Prevoz: ${(rec.transport || 0).toLocaleString()} RSD`, mg + 4, y); y += 5;
          if ((rec.bonus || 0) > 0) { doc.setTextColor(0, 120, 0); doc.text(`Bonus: +${rec.bonus.toLocaleString()} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if ((rec.penalty || 0) > 0) { doc.setTextColor(200, 0, 0); doc.text(`Kazna: -${rec.penalty.toLocaleString()} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if (rec.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        } else {
          doc.setTextColor(150, 150, 150); doc.text('Nema unosa za ovaj mesec', mg + 4, y); y += 5; doc.setTextColor(0, 0, 0);
        }

        doc.setFont(undefined, 'bold');
        if (cash !== null && cash >= 0) { doc.setTextColor(0, 130, 0); doc.text(`GOTOVINA: +${(cash).toLocaleString()} RSD`, mg + 4, y); }
        else if (cash !== null) { doc.setTextColor(200, 0, 0); doc.text(`GOTOVINA: ${(cash).toLocaleString()} RSD`, mg + 4, y); }
        else { doc.setTextColor(150, 150, 150); doc.text('GOTOVINA: —', mg + 4, y); }
        doc.setTextColor(0, 0, 0); y += 12;
        doc.setDrawColor(210, 210, 210); doc.line(mg, y - 4, pw - mg, y - 4); y += 4;
      });

      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('by AG GROUP', pw / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`${i}/${pages}`, pw - mg, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      doc.save(`Firma1_${selectedMonth.replace('-', '_')}.pdf`);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { key: 'settings', label: 'Podešavanja', Icon: Settings, activeClass: 'bg-orange-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'employees', label: 'Zaposleni', Icon: Users, activeClass: 'bg-emerald-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'monthly', label: 'Mesečni Unos', Icon: Calendar, activeClass: 'bg-blue-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'summary', label: 'Obračun', Icon: Calculator, activeClass: 'bg-purple-500 text-white shadow-lg -translate-y-0.5' },
  ];

  return (
    <div>
      <div className="bg-slate-50 border-b border-slate-200">
        <nav className="flex flex-wrap gap-1 px-4 py-2">
          {tabs.map(({ key, label, Icon, activeClass }) => (
            <button key={key} onClick={() => goToTab(key)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-150 ${activeTab === key ? activeClass : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'}`}>
              <Icon className="inline w-4 h-4 mr-1" />{label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5">

        {/* PODEŠAVANJA */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Podrazumevane vrednosti — Firma 1</h2>
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl max-w-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Podrazumevani minimalac (RSD)</label>
                <input type="number" value={settingsForm.defaultMinimalac}
                  onChange={e => setSettingsForm({ ...settingsForm, defaultMinimalac: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Podrazumevani prevoz (RSD)</label>
                <input type="number" value={settingsForm.defaultTransport}
                  onChange={e => setSettingsForm({ ...settingsForm, defaultTransport: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400" />
              </div>
              <button onClick={saveSettings} className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-medium">
                Sačuvaj
              </button>
              <p className="text-xs text-gray-400">Ove vrednosti se automatski popunjavaju pri novom unosu, ali mogu da se promene po potrebi.</p>
            </div>
          </div>
        )}

        {/* ZAPOSLENI */}
        {activeTab === 'employees' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Zaposleni — Firma 1</h2>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Ime i prezime" value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400" />
                <input type="number" placeholder="Ugovorena zarada (RSD)" value={newEmp.agreedSalary}
                  onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400" />
                <button onClick={addEmployee} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-1" /> Dodaj
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">Ugovorena: {(emp.agreedSalary || 0).toLocaleString()} RSD</p>
                  </div>
                  <button onClick={() => deleteEmployee(emp.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {employees.length === 0 && <p className="text-gray-400 text-center py-8">Nema zaposlenih</p>}
            </div>
          </div>
        )}

        {/* MESEČNI UNOS */}
        {activeTab === 'monthly' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Mesečni Unos — Firma 1</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Mesec: </label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                  <option value="">Izaberi zaposlenog</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <div className="relative">
                  <input type="number"
                    placeholder={`Na račun (RSD)`}
                    value={form.paidSalary}
                    onChange={e => setForm({ ...form, paidSalary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                  {settings.defaultMinimalac > 0 && (
                    <span className="absolute right-2 top-2 text-xs text-gray-400">def: {(settings.defaultMinimalac).toLocaleString()}</span>
                  )}
                </div>
                <div className="relative">
                  <input type="number"
                    placeholder="Prevoz (RSD)"
                    value={form.transport}
                    onChange={e => setForm({ ...form, transport: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                  {settings.defaultTransport > 0 && (
                    <span className="absolute right-2 top-2 text-xs text-gray-400">def: {(settings.defaultTransport).toLocaleString()}</span>
                  )}
                </div>
                <input type="number" placeholder="Bonus (RSD)" value={form.bonus}
                  onChange={e => setForm({ ...form, bonus: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                <input type="number" placeholder="Kazna (RSD)" value={form.penalty}
                  onChange={e => setForm({ ...form, penalty: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                <input type="text" placeholder="Napomena" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
              </div>
              {form.employeeId && (() => {
                const emp = employees.find(e => e.id === parseInt(form.employeeId));
                if (!emp) return null;
                const preview = (emp.agreedSalary || 0)
                  - (parseFloat(form.paidSalary) || 0)
                  - (parseFloat(form.transport) || 0)
                  + (parseFloat(form.bonus) || 0)
                  - (parseFloat(form.penalty) || 0);
                return (
                  <div className={`mt-3 text-sm font-semibold ${preview >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    Gotovina: {preview >= 0 ? '+' : ''}{preview.toLocaleString()} RSD
                  </div>
                );
              })()}
              <button onClick={addRecord} className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Dodaj Zapis
              </button>
            </div>
            <div className="space-y-2">
              {monthRecords().map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const cash = calcCash(rec.employeeId, rec.month);
                return (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{emp?.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <span>Na račun: {rec.paidSalary.toLocaleString()} RSD</span>
                          <span>Prevoz: {rec.transport.toLocaleString()} RSD</span>
                          {rec.bonus > 0 && <span className="text-green-600">Bonus: +{rec.bonus.toLocaleString()} RSD</span>}
                          {rec.penalty > 0 && <span className="text-red-500">Kazna: -{rec.penalty.toLocaleString()} RSD</span>}
                        </div>
                        {rec.note && <p className="text-xs text-gray-400 mt-1">{rec.note}</p>}
                        <p className={`font-semibold mt-1 ${(cash ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Gotovina: {(cash ?? 0) >= 0 ? '+' : ''}{(cash ?? 0).toLocaleString()} RSD
                        </p>
                      </div>
                      <button onClick={() => deleteRecord(rec.id)} className="text-red-400 hover:text-red-600 p-2 ml-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {monthRecords().length === 0 && <p className="text-gray-400 text-center py-8">Nema zapisa za {selectedMonth}</p>}
            </div>
          </div>
        )}

        {/* OBRAČUN */}
        {activeTab === 'summary' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Obračun — Firma 1</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Mesec: </label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg">
                {allMonths().map(m => <option key={m} value={m}>{m}</option>)}
                {allMonths().length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
              </select>
            </div>
            <div className="bg-purple-100 border border-purple-300 p-6 rounded-xl mb-4 text-center">
              <DollarSign className="w-10 h-10 text-purple-600 mx-auto mb-1" />
              <p className="text-base font-semibold text-purple-800">Ukupna Gotovina Potrebna</p>
              <p className="text-4xl font-bold text-purple-900 mt-1">{totalCash().toLocaleString()} RSD</p>
              <p className="text-sm text-purple-500 mt-1">{selectedMonth}</p>
            </div>
            <div className="space-y-2 mb-6">
              {employees.map(emp => {
                const rec = records.find(r => r.employeeId === emp.id && r.month === selectedMonth);
                const cash = calcCash(emp.id, selectedMonth);
                return (
                  <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-800">{emp.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 text-gray-500">
                      <span>Ugovorena: {(emp.agreedSalary || 0).toLocaleString()} RSD</span>
                      {rec ? (
                        <>
                          <span>Na račun: {rec.paidSalary.toLocaleString()} RSD</span>
                          <span>Prevoz: {rec.transport.toLocaleString()} RSD</span>
                          {rec.bonus > 0 && <span className="text-green-600">Bonus: +{rec.bonus.toLocaleString()} RSD</span>}
                          {rec.penalty > 0 && <span className="text-red-500">Kazna: -{rec.penalty.toLocaleString()} RSD</span>}
                        </>
                      ) : <span className="text-gray-400 italic">nema unosa</span>}
                    </div>
                    <p className={`font-bold mt-1 ${(cash ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      Gotovina: {(cash ?? 0) >= 0 ? '+' : ''}{(cash ?? 0).toLocaleString()} RSD
                    </p>
                  </div>
                );
              })}
              {employees.length === 0 && <p className="text-gray-400 text-center py-8">Nema zaposlenih</p>}
            </div>
            <div className="flex justify-center">
              <button onClick={generatePDF} className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 flex items-center font-semibold shadow-lg">
                <Download className="w-5 h-5 mr-2" /> Preuzmi PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Firma 2 ─────────────────────────────────────────────────────────────────

const Firma2 = () => {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState({ eurRate: 117 });
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newEmp, setNewEmp] = useState({ name: '', agreedSalary: '' });
  const [form, setForm] = useState({ employeeId: '', paidSalary: '', dnevnica: '', sistemBonus: false, note: '' });
  const [settingsForm, setSettingsForm] = useState({ eurRate: '117' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const e = localStorage.getItem('f2_employees');
    const r = localStorage.getItem('f2_records');
    const s = localStorage.getItem('f2_settings');
    if (e) setEmployees(JSON.parse(e));
    if (r) setRecords(JSON.parse(r));
    if (s) { const p = JSON.parse(s); setSettings(p); setSettingsForm({ eurRate: p.eurRate }); }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f2_employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f2_records', JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('f2_settings', JSON.stringify(settings));
  }, [settings]);

  const addEmployee = () => {
    if (!newEmp.name.trim() || !newEmp.agreedSalary) return;
    setEmployees([...employees, { id: Date.now(), name: newEmp.name.trim(), agreedSalary: parseFloat(newEmp.agreedSalary) }]);
    setNewEmp({ name: '', agreedSalary: '' });
  };

  const deleteEmployee = (id) => {
    if (!window.confirm('Obrisati zaposlenog i sve zapise?')) return;
    setEmployees(employees.filter(e => e.id !== id));
    setRecords(records.filter(r => r.employeeId !== id));
  };

  const addRecord = () => {
    if (!form.employeeId) return;
    const exists = records.find(r => r.employeeId === parseInt(form.employeeId) && r.month === selectedMonth);
    if (exists) { alert('Već postoji zapis za ovog zaposlenog u ovom mesecu.'); return; }
    setRecords([...records, {
      id: Date.now(),
      employeeId: parseInt(form.employeeId),
      month: selectedMonth,
      paidSalary: parseFloat(form.paidSalary) || 0,
      dnevnica: parseFloat(form.dnevnica) || 0,
      sistemBonus: form.sistemBonus,
      note: form.note
    }]);
    setForm({ employeeId: '', paidSalary: '', dnevnica: '', sistemBonus: false, note: '' });
  };

  const deleteRecord = (id) => {
    if (!window.confirm('Obrisati zapis?')) return;
    setRecords(records.filter(r => r.id !== id));
  };

  const sistemBonusRSD = () => 10 * (settings.eurRate || 117);

  const calcCash = (empId, month) => {
    const emp = employees.find(e => e.id === empId);
    const rec = records.find(r => r.employeeId === empId && r.month === month);
    if (!emp || !rec) return null;
    return (emp.agreedSalary || 0) + (rec.dnevnica || 0) + (rec.sistemBonus ? sistemBonusRSD() : 0) - (rec.paidSalary || 0);
  };

  const totalCash = () => employees.reduce((sum, emp) => {
    const c = calcCash(emp.id, selectedMonth);
    return sum + Math.max(0, c ?? 0);
  }, 0);

  const monthRecords = () => records.filter(r => r.month === selectedMonth);
  const allMonths = () => [...new Set(records.map(r => r.month))].sort().reverse();

  const saveSettings = () => {
    setSettings({ eurRate: parseFloat(settingsForm.eurRate) || 117 });
    alert('Sačuvano.');
  };

  const generatePDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.width;
      const mg = 20;
      let y = 30;

      doc.setFontSize(18); doc.setFont(undefined, 'bold');
      doc.text('OBRACUN ZARADA - FIRMA 2', pw / 2, y, { align: 'center' }); y += 8;
      doc.setFontSize(11); doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${selectedMonth}   |   Datum: ${new Date().toLocaleDateString('sr-RS')}`, pw / 2, y, { align: 'center' }); y += 18;

      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 110, 110);
      doc.text(`UKUPNA GOTOVINA: ${totalCash().toLocaleString()} RSD`, pw / 2, y, { align: 'center' });
      y += 18; doc.setTextColor(0, 0, 0);

      employees.forEach(emp => {
        if (y > 255) { doc.addPage(); y = 25; }
        const rec = records.find(r => r.employeeId === emp.id && r.month === selectedMonth);
        const cash = calcCash(emp.id, selectedMonth);

        doc.setFontSize(11); doc.setFont(undefined, 'bold');
        doc.text(emp.name, mg, y); y += 7;
        doc.setFont(undefined, 'normal'); doc.setFontSize(9);
        doc.text(`Ugovorena zarada: ${(emp.agreedSalary || 0).toLocaleString()} RSD`, mg + 4, y); y += 5;

        if (rec) {
          if (rec.paidSalary > 0) { doc.text(`Na racun: ${rec.paidSalary.toLocaleString()} RSD`, mg + 4, y); y += 5; }
          if (rec.dnevnica > 0) { doc.setTextColor(0, 120, 0); doc.text(`Dnevnica: +${rec.dnevnica.toLocaleString()} RSD`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if (rec.sistemBonus) { doc.setTextColor(0, 120, 0); doc.text(`Namesten sistem: +${sistemBonusRSD().toLocaleString()} RSD (10 EUR)`, mg + 4, y); y += 5; doc.setTextColor(0, 0, 0); }
          if (rec.note) { doc.text(`Napomena: ${rec.note}`, mg + 4, y); y += 5; }
        } else {
          doc.setTextColor(150, 150, 150); doc.text('Nema unosa za ovaj mesec', mg + 4, y); y += 5; doc.setTextColor(0, 0, 0);
        }

        doc.setFont(undefined, 'bold');
        if (cash !== null && cash >= 0) { doc.setTextColor(0, 130, 0); doc.text(`GOTOVINA: +${cash.toLocaleString()} RSD`, mg + 4, y); }
        else if (cash !== null) { doc.setTextColor(200, 0, 0); doc.text(`GOTOVINA: ${cash.toLocaleString()} RSD`, mg + 4, y); }
        else { doc.setTextColor(150, 150, 150); doc.text('GOTOVINA: —', mg + 4, y); }
        doc.setTextColor(0, 0, 0); y += 12;
        doc.setDrawColor(210, 210, 210); doc.line(mg, y - 4, pw - mg, y - 4); y += 4;
      });

      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('by AG GROUP', pw / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`${i}/${pages}`, pw - mg, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      doc.save(`Firma2_${selectedMonth.replace('-', '_')}.pdf`);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { key: 'settings', label: 'Podešavanja', Icon: Settings, activeClass: 'bg-orange-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'employees', label: 'Zaposleni', Icon: Users, activeClass: 'bg-emerald-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'monthly', label: 'Mesečni Unos', Icon: Calendar, activeClass: 'bg-teal-500 text-white shadow-lg -translate-y-0.5' },
    { key: 'summary', label: 'Obračun', Icon: Calculator, activeClass: 'bg-teal-700 text-white shadow-lg -translate-y-0.5' },
  ];

  return (
    <div>
      <div className="bg-slate-50 border-b border-slate-200">
        <nav className="flex flex-wrap gap-1 px-4 py-2">
          {tabs.map(({ key, label, Icon, activeClass }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-all duration-150 ${activeTab === key ? activeClass : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm'}`}>
              <Icon className="inline w-4 h-4 mr-1" />{label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-5">

        {/* PODEŠAVANJA */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Podešavanja — Firma 2</h2>
            <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl max-w-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs EUR → RSD</label>
                <input type="number" value={settingsForm.eurRate}
                  onChange={e => setSettingsForm({ ...settingsForm, eurRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400" />
                <p className="text-xs text-gray-400 mt-1">Koristi se za bonus od 10 EUR za namešten sistem (trenutno: {(10 * (settings.eurRate || 117)).toLocaleString()} RSD)</p>
              </div>
              <button onClick={saveSettings} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 font-medium">
                Sačuvaj
              </button>
            </div>
          </div>
        )}

        {/* ZAPOSLENI */}
        {activeTab === 'employees' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Zaposleni — Firma 2</h2>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="Ime i prezime" value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400" />
                <input type="number" placeholder="Ugovorena zarada (RSD)" value={newEmp.agreedSalary}
                  onChange={e => setNewEmp({ ...newEmp, agreedSalary: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addEmployee()}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400" />
                <button onClick={addEmployee} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-1" /> Dodaj
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">Ugovorena: {(emp.agreedSalary || 0).toLocaleString()} RSD</p>
                  </div>
                  <button onClick={() => deleteEmployee(emp.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {employees.length === 0 && <p className="text-gray-400 text-center py-8">Nema zaposlenih</p>}
            </div>
          </div>
        )}

        {/* MESEČNI UNOS */}
        {activeTab === 'monthly' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Mesečni Unos — Firma 2</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Mesec: </label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400">
                  <option value="">Izaberi zaposlenog</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <input type="number" placeholder="Na račun (RSD, opciono)" value={form.paidSalary}
                  onChange={e => setForm({ ...form, paidSalary: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400" />
                <input type="number" placeholder="Dnevnica (RSD)" value={form.dnevnica}
                  onChange={e => setForm({ ...form, dnevnica: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400" />
                <input type="text" placeholder="Napomena" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400" />
                <label className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-green-50 col-span-1 md:col-span-2 lg:col-span-2">
                  <input type="checkbox" checked={form.sistemBonus}
                    onChange={e => setForm({ ...form, sistemBonus: e.target.checked })}
                    className="w-5 h-5 accent-teal-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Namešten sistem
                    <span className="ml-2 text-teal-600 font-semibold">+10 EUR = {sistemBonusRSD().toLocaleString()} RSD</span>
                  </span>
                </label>
              </div>
              {form.employeeId && (() => {
                const emp = employees.find(e => e.id === parseInt(form.employeeId));
                if (!emp) return null;
                const preview = (emp.agreedSalary || 0)
                  + (parseFloat(form.dnevnica) || 0)
                  + (form.sistemBonus ? sistemBonusRSD() : 0)
                  - (parseFloat(form.paidSalary) || 0);
                return (
                  <div className={`mt-3 text-sm font-semibold ${preview >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    Gotovina: {preview >= 0 ? '+' : ''}{preview.toLocaleString()} RSD
                  </div>
                );
              })()}
              <button onClick={addRecord} className="mt-3 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Dodaj Zapis
              </button>
            </div>
            <div className="space-y-2">
              {monthRecords().map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const cash = calcCash(rec.employeeId, rec.month);
                return (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{emp?.name}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          {rec.paidSalary > 0 && <span>Na račun: {rec.paidSalary.toLocaleString()} RSD</span>}
                          {rec.dnevnica > 0 && <span className="text-green-600">Dnevnica: +{rec.dnevnica.toLocaleString()} RSD</span>}
                          {rec.sistemBonus && <span className="text-teal-600 font-medium">Namešten sistem: +{sistemBonusRSD().toLocaleString()} RSD</span>}
                        </div>
                        {rec.note && <p className="text-xs text-gray-400 mt-1">{rec.note}</p>}
                        <p className={`font-semibold mt-1 ${(cash ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Gotovina: {(cash ?? 0) >= 0 ? '+' : ''}{(cash ?? 0).toLocaleString()} RSD
                        </p>
                      </div>
                      <button onClick={() => deleteRecord(rec.id)} className="text-red-400 hover:text-red-600 p-2 ml-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {monthRecords().length === 0 && <p className="text-gray-400 text-center py-8">Nema zapisa za {selectedMonth}</p>}
            </div>
          </div>
        )}

        {/* OBRAČUN */}
        {activeTab === 'summary' && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">Obračun — Firma 2</h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">Mesec: </label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="ml-2 px-3 py-2 border border-gray-300 rounded-lg">
                {allMonths().map(m => <option key={m} value={m}>{m}</option>)}
                {allMonths().length === 0 && <option value={selectedMonth}>{selectedMonth}</option>}
              </select>
            </div>
            <div className="bg-teal-100 border border-teal-300 p-6 rounded-xl mb-4 text-center">
              <DollarSign className="w-10 h-10 text-teal-600 mx-auto mb-1" />
              <p className="text-base font-semibold text-teal-800">Ukupna Gotovina Potrebna</p>
              <p className="text-4xl font-bold text-teal-900 mt-1">{totalCash().toLocaleString()} RSD</p>
              <p className="text-sm text-teal-500 mt-1">{selectedMonth}</p>
            </div>
            <div className="space-y-2 mb-6">
              {employees.map(emp => {
                const rec = records.find(r => r.employeeId === emp.id && r.month === selectedMonth);
                const cash = calcCash(emp.id, selectedMonth);
                return (
                  <div key={emp.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-800">{emp.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1 text-gray-500">
                      <span>Ugovorena: {(emp.agreedSalary || 0).toLocaleString()} RSD</span>
                      {rec ? (
                        <>
                          {rec.paidSalary > 0 && <span>Na račun: {rec.paidSalary.toLocaleString()} RSD</span>}
                          {rec.dnevnica > 0 && <span className="text-green-600">Dnevnica: +{rec.dnevnica.toLocaleString()} RSD</span>}
                          {rec.sistemBonus && <span className="text-teal-600 font-medium">Namešten sistem: +{sistemBonusRSD().toLocaleString()} RSD</span>}
                        </>
                      ) : <span className="text-gray-400 italic">nema unosa</span>}
                    </div>
                    <p className={`font-bold mt-1 ${(cash ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      Gotovina: {(cash ?? 0) >= 0 ? '+' : ''}{(cash ?? 0).toLocaleString()} RSD
                    </p>
                  </div>
                );
              })}
              {employees.length === 0 && <p className="text-gray-400 text-center py-8">Nema zaposlenih</p>}
            </div>
            <div className="flex justify-center">
              <button onClick={generatePDF} className="bg-teal-600 text-white px-8 py-3 rounded-xl hover:bg-teal-700 flex items-center font-semibold shadow-lg">
                <Download className="w-5 h-5 mr-2" /> Preuzmi PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Glavna aplikacija ────────────────────────────────────────────────────────

const PayrollApp = () => {
  const [activeCompany, setActiveCompany] = useState('firma1');

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-5 px-6">
          <h1 className="text-3xl font-bold text-center tracking-wide">ZARADE</h1>
          <p className="text-slate-300 text-center mt-1 text-sm">Sistem za obračun gotovinske zarade</p>
        </div>

        {/* Company selector */}
        <div className="bg-slate-800 px-6 py-3 flex gap-2">
          <button
            onClick={() => setActiveCompany('firma1')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-150 ${
              activeCompany === 'firma1' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}>
            Firma 1
          </button>
          <button
            onClick={() => setActiveCompany('firma2')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-150 ${
              activeCompany === 'firma2' ? 'bg-teal-500 text-white shadow-md' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}>
            Firma 2
          </button>
        </div>

        {activeCompany === 'firma1' ? <Firma1 /> : <Firma2 />}

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-4 px-6">
          <div className="text-center">
            <p className="text-slate-300 text-sm">by <span className="font-bold text-white tracking-wider">AG GROUP</span></p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollApp;
