'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Calculator, Users, Calendar, DollarSign, Download } from 'lucide-react';

const PayrollApp = () => {
  const [employees, setEmployees] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('employees');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Employee form state
  const [newEmployee, setNewEmployee] = useState({ name: '', agreedSalary: '' });
  
  // Monthly record form state
  const [monthlyForm, setMonthlyForm] = useState({
    employeeId: '',
    paidSalary: '',
    transport: '',
    bonus: '',
    penalty: '',
    note: ''
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmployees = localStorage.getItem('employees');
      const savedRecords = localStorage.getItem('monthlyRecords');
      
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      }
      if (savedRecords) {
        setMonthlyRecords(JSON.parse(savedRecords));
      }
    }
  }, []);

  // Save employees to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('employees', JSON.stringify(employees));
    }
  }, [employees]);

  // Save monthly records to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('monthlyRecords', JSON.stringify(monthlyRecords));
    }
  }, [monthlyRecords]);

  // Add new employee
  const addEmployee = () => {
    if (newEmployee.name && newEmployee.agreedSalary) {
      const employee = {
        id: Date.now(),
        name: newEmployee.name,
        agreedSalary: parseFloat(newEmployee.agreedSalary) || 0
      };
      setEmployees([...employees, employee]);
      setNewEmployee({ name: '', agreedSalary: '' });
    }
  };

  // Delete employee
  const deleteEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    setMonthlyRecords(monthlyRecords.filter(record => record.employeeId !== id));
  };

  // Add monthly record
  const addMonthlyRecord = () => {
    if (monthlyForm.employeeId && monthlyForm.paidSalary !== '') {
      const record = {
        id: Date.now(),
        employeeId: parseInt(monthlyForm.employeeId),
        month: selectedMonth,
        paidSalary: parseFloat(monthlyForm.paidSalary) || 0,
        transport: parseFloat(monthlyForm.transport) || 0,
        bonus: parseFloat(monthlyForm.bonus) || 0,
        penalty: parseFloat(monthlyForm.penalty) || 0,
        note: monthlyForm.note
      };
      setMonthlyRecords([...monthlyRecords, record]);
      setMonthlyForm({
        employeeId: '',
        paidSalary: '',
        transport: '',
        bonus: '',
        penalty: '',
        note: ''
      });
    }
  };

  // Delete monthly record
  const deleteMonthlyRecord = (id) => {
    setMonthlyRecords(monthlyRecords.filter(record => record.id !== id));
  };

  // Calculate cash difference for an employee in a specific month
  const calculateCashDifference = (employeeId, month) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const record = monthlyRecords.find(rec => rec.employeeId === employeeId && rec.month === month);
    
    if (!employee || !record) return 0;
    
    const totalPaid = (record.paidSalary || 0) + (record.transport || 0);
    const adjustments = (record.bonus || 0) - (record.penalty || 0);
    const cashDifference = (employee.agreedSalary || 0) - totalPaid + adjustments;
    
    return cashDifference;
  };

  // Get total cash needed for current month
  const getTotalCashNeeded = () => {
    return employees.reduce((total, employee) => {
      const cashDiff = calculateCashDifference(employee.id, selectedMonth);
      return total + Math.max(0, cashDiff); // Only positive amounts (cash to pay)
    }, 0);
  };

  // Get monthly records for selected month
  const getCurrentMonthRecords = () => {
    return monthlyRecords.filter(record => record.month === selectedMonth);
  };

  // Get all unique months
  const getAllMonths = () => {
    const months = [...new Set(monthlyRecords.map(record => record.month))];
    return months.sort().reverse();
  };

  // Generate PDF report
  const generatePDFReport = async () => {
    try {
      // Import jsPDF dynamically
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('OBRACUN ZARADA', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Mesec: ${selectedMonth}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      doc.text(`Datum generisanja: ${new Date().toLocaleDateString('sr-RS')}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;

      // Total summary
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      const totalCash = getTotalCashNeeded();
      doc.setTextColor(128, 0, 128); // Purple color
      doc.text(`UKUPNA GOTOVINA POTREBNA: ${totalCash.toLocaleString()} RSD`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 25;
      doc.setTextColor(0, 0, 0); // Reset to black

      // Employee details
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DETALJAN PREGLED PO ZAPOSLENIMA:', margin, yPosition);
      yPosition += 15;

      employees.forEach((employee) => {
        const record = monthlyRecords.find(rec => rec.employeeId === employee.id && rec.month === selectedMonth);
        const cashDiff = calculateCashDifference(employee.id, selectedMonth);

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        // Employee name
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`${employee.name}`, margin, yPosition);
        yPosition += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);

        // Employee details
        doc.text(`Ugovorena zarada: ${(employee.agreedSalary || 0).toLocaleString()} RSD`, margin + 5, yPosition);
        yPosition += 6;

        if (record) {
          doc.text(`Zarada na racun: ${(record.paidSalary || 0).toLocaleString()} RSD`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`Prevoz: ${(record.transport || 0).toLocaleString()} RSD`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`Ukupno isplaceno: ${((record.paidSalary || 0) + (record.transport || 0)).toLocaleString()} RSD`, margin + 5, yPosition);
          yPosition += 6;
          
          if ((record.bonus || 0) > 0) {
            doc.setTextColor(0, 128, 0); // Green
            doc.text(`Bonus: +${(record.bonus || 0).toLocaleString()} RSD`, margin + 5, yPosition);
            yPosition += 6;
            doc.setTextColor(0, 0, 0);
          }
          
          if ((record.penalty || 0) > 0) {
            doc.setTextColor(255, 0, 0); // Red
            doc.text(`Kazna: -${(record.penalty || 0).toLocaleString()} RSD`, margin + 5, yPosition);
            yPosition += 6;
            doc.setTextColor(0, 0, 0);
          }

          if (record.note) {
            doc.text(`Napomena: ${record.note}`, margin + 5, yPosition);
            yPosition += 6;
          }
        } else {
          doc.setTextColor(128, 128, 128); // Gray
          doc.text('Nema unosa za ovaj mesec', margin + 5, yPosition);
          yPosition += 6;
          doc.setTextColor(0, 0, 0);
        }

        // Cash difference
        doc.setFont(undefined, 'bold');
        if (cashDiff >= 0) {
          doc.setTextColor(0, 128, 0); // Green
          doc.text(`GOTOVINA: +${cashDiff.toLocaleString()} RSD`, margin + 5, yPosition);
        } else {
          doc.setTextColor(255, 0, 0); // Red
          doc.text(`GOTOVINA: ${cashDiff.toLocaleString()} RSD`, margin + 5, yPosition);
        }
        doc.setTextColor(0, 0, 0);
        
        yPosition += 15;

        // Add separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
        yPosition += 5;
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text('by AG GROUP', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Strana ${i} od ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
      }

      // Save the PDF
      doc.save(`Obracun_Zarada_${selectedMonth.replace('-', '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Greška pri generisanju PDF-a');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header with Title */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-6 px-6">
          <h1 className="text-3xl font-bold text-center tracking-wide">ZARADE</h1>
          <p className="text-slate-300 text-center mt-2">Sistem za obračun gotovinske zarade</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <nav className="flex space-x-1 px-6 py-2">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-3 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'employees'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg transform -translate-y-1'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
              }`}
            >
              <Users className="inline w-4 h-4 mr-2" />
              Zaposleni
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-3 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'monthly'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform -translate-y-1'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
              }`}
            >
              <Calendar className="inline w-4 h-4 mr-2" />
              Mesečni Unos
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-6 rounded-t-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'summary'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg transform -translate-y-1'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 shadow-sm'
              }`}
            >
              <Calculator className="inline w-4 h-4 mr-2" />
              Obračun
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'employees' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Upravljanje Zaposlenima</h2>
              
              {/* Add Employee Form */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-6 rounded-xl mb-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-emerald-800 flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Dodaj Novog Zaposlenog
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Ime i prezime"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Ugovorena zarada (RSD)"
                    value={newEmployee.agreedSalary}
                    onChange={(e) => setNewEmployee({...newEmployee, agreedSalary: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addEmployee}
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj
                  </button>
                </div>
              </div>

              {/* Employees List */}
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{employee.name}</h4>
                      <p className="text-gray-600">Ugovorena zarada: {(employee.agreedSalary || 0).toLocaleString()} RSD</p>
                    </div>
                    <button
                      onClick={() => deleteEmployee(employee.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {employees.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nema dodanih zaposlenih</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Mesečni Unos Zarada</h2>
              
              {/* Month selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Izaberi mesec:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Monthly Record Form */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl mb-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Unos za {selectedMonth}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select
                    value={monthlyForm.employeeId}
                    onChange={(e) => setMonthlyForm({...monthlyForm, employeeId: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Izaberi zaposlenog</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Zarada na račun (RSD)"
                    value={monthlyForm.paidSalary}
                    onChange={(e) => setMonthlyForm({...monthlyForm, paidSalary: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Prevoz (RSD)"
                    value={monthlyForm.transport}
                    onChange={(e) => setMonthlyForm({...monthlyForm, transport: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Bonus (RSD)"
                    value={monthlyForm.bonus}
                    onChange={(e) => setMonthlyForm({...monthlyForm, bonus: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Kazna/Dugovanje (RSD)"
                    value={monthlyForm.penalty}
                    onChange={(e) => setMonthlyForm({...monthlyForm, penalty: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Napomena"
                    value={monthlyForm.note}
                    onChange={(e) => setMonthlyForm({...monthlyForm, note: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={addMonthlyRecord}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Zapis
                </button>
              </div>

              {/* Current Month Records */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Zapisi za {selectedMonth}</h3>
                {getCurrentMonthRecords().map((record) => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  const cashDiff = calculateCashDifference(record.employeeId, record.month);
                  
                  return (
                    <div key={record.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{employee?.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                            <div>Zarada na račun: {(record.paidSalary || 0).toLocaleString()} RSD</div>
                            <div>Prevoz: {(record.transport || 0).toLocaleString()} RSD</div>
                            <div>Bonus: {(record.bonus || 0).toLocaleString()} RSD</div>
                            <div>Kazna: {(record.penalty || 0).toLocaleString()} RSD</div>
                          </div>
                          {record.note && <p className="text-sm text-gray-500 mt-2">Napomena: {record.note}</p>}
                          <div className={`mt-2 font-semibold ${cashDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Gotovina: {cashDiff >= 0 ? '+' : ''}{cashDiff.toLocaleString()} RSD
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMonthlyRecord(record.id)}
                          className="text-red-600 hover:text-red-800 p-2 ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getCurrentMonthRecords().length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nema zapisa za izabrani mesec</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Obračun i Pregled</h2>
              
              {/* Month selector for summary */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pregled za mesec:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getAllMonths().map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                  {getAllMonths().length === 0 && (
                    <option value={selectedMonth}>{selectedMonth}</option>
                  )}
                </select>
              </div>

              {/* Total Cash Summary */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300 p-6 md:p-8 rounded-xl mb-6 shadow-lg">
                <div className="flex items-center justify-center">
                  <DollarSign className="w-8 md:w-10 h-8 md:h-10 text-purple-700 mr-3 md:mr-4" />
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-semibold text-purple-800">Ukupna Gotovina Potrebna</h3>
                    <p className="text-2xl md:text-4xl font-bold text-purple-900 mt-2">{getTotalCashNeeded().toLocaleString()} RSD</p>
                    <p className="text-sm text-purple-700 mt-1">za mesec {selectedMonth}</p>
                  </div>
                </div>
              </div>

              {/* Individual Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Individualni Pregled</h3>
                {employees.map((employee) => {
                  const record = monthlyRecords.find(rec => rec.employeeId === employee.id && rec.month === selectedMonth);
                  const cashDiff = calculateCashDifference(employee.id, selectedMonth);
                  
                  return (
                    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{employee.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Ugovorena zarada: {(employee.agreedSalary || 0).toLocaleString()} RSD</div>
                          {record && (
                            <>
                              <div className="text-gray-600">Zarada na račun: {(record.paidSalary || 0).toLocaleString()} RSD</div>
                              <div className="text-gray-600">Prevoz: {(record.transport || 0).toLocaleString()} RSD</div>
                              <div className="text-gray-600">Ukupno isplaćeno: {((record.paidSalary || 0) + (record.transport || 0)).toLocaleString()} RSD</div>
                            </>
                          )}
                        </div>
                        <div>
                          {record && (
                            <>
                              <div className="text-green-600">Bonus: {(record.bonus || 0).toLocaleString()} RSD</div>
                              <div className="text-red-600">Kazna: {(record.penalty || 0).toLocaleString()} RSD</div>
                            </>
                          )}
                          <div className={`font-semibold ${cashDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Gotovina: {cashDiff >= 0 ? '+' : ''}{cashDiff.toLocaleString()} RSD
                          </div>
                        </div>
                      </div>
                      {!record && (
                        <p className="text-gray-500 text-sm mt-2">Nema unosa za ovaj mesec</p>
                      )}
                    </div>
                  );
                })}
                {employees.length === 0 && (
                  <p className="text-gray-500 text-center py-8">Nema dodanih zaposlenih</p>
                )}
              </div>

              {/* PDF Download Button - Mobile Friendly */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={generatePDFReport}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-semibold"
                >
                  <Download className="w-6 h-6 mr-3" />
                  Preuzmi PDF Obračun
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-4 px-6 mt-8">
          <div className="text-center">
            <p className="text-slate-300 text-sm">
              by <span className="font-bold text-white tracking-wider">AG GROUP</span>
            </p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400 mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollApp;