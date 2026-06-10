import React, { useState, useEffect } from 'react';
import TopologyMap from './TopologyMap';
import { ArrowLeft, UserPlus, Calendar, Plus, RefreshCw, XCircle, Trash2, ShieldAlert, Award, FileText, BarChart } from 'lucide-react';

export default function DemoPatientManagement({ onBack }) {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [activeRole, setActiveRole] = useState('RECEPTIONIST');
  const [activeFlow, setActiveFlow] = useState(null);
  const [apiLogs, setApiLogs] = useState([]);

  // Mock Database State
  const [patients, setPatients] = useState([
    { id: 'pat-1', name: 'John Doe', email: 'john.doe@example.com', dob: '1988-12-10', address: '742 Evergreen Terr' },
    { id: 'pat-2', name: 'Jane Smith', email: 'jane.smith@example.com', dob: '1992-04-23', address: '123 Fake Street' }
  ]);

  const [appointments, setAppointments] = useState([
    { id: 'app-1', patientId: 'pat-1', patientName: 'John Doe', doctor: 'Dr. House', date: '2026-06-12', startTime: '09:00', endTime: '10:00', fee: 150 }
  ]);

  const [billingAccounts, setBillingAccounts] = useState({
    'pat-1': { balance: 150, transactions: [{ type: 'CHARGE', amount: 150, desc: 'Appt app-1 Scheduled' }] },
    'pat-2': { balance: 0, transactions: [] }
  });

  const [kafkaLogs, setKafkaLogs] = useState([
    { timestamp: new Date().toISOString(), service: 'patient-service', event: 'PATIENT_REGISTERED', detail: 'Patient John Doe (pat-1) created' },
    { timestamp: new Date().toISOString(), service: 'billing-service', event: 'BILLING_ACCOUNT_PROVISIONED', detail: 'Account pat-1 created with balance 0' },
    { timestamp: new Date().toISOString(), service: 'appointment-service', event: 'APPOINTMENT_CREATED', detail: 'Appt app-1 scheduled for 09:00' }
  ]);

  // Form states
  const [newPatient, setNewPatient] = useState({ name: '', email: '', dob: '', address: '' });
  const [newAppt, setNewAppt] = useState({ patientId: 'pat-1', doctor: 'Dr. House', date: '2026-06-12', startTime: '10:30', duration: '60', fee: '150' });
  const [selectedPatientId, setSelectedPatientId] = useState('pat-1');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. House');

  // Trigger flow highlight and auto-clear
  const triggerFlow = (flowName) => {
    setActiveFlow(flowName);
    const timer = setTimeout(() => setActiveFlow(null), 2500);
    return () => clearTimeout(timer);
  };

  const addApiLog = (method, url, requestBody, status, responseBody) => {
    const log = {
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      requestBody: requestBody ? JSON.stringify(requestBody, null, 2) : null,
      status,
      responseBody: JSON.stringify(responseBody, null, 2)
    };
    setApiLogs(prev => [log, ...prev].slice(0, 15));
  };

  // 1. RECEPTIONIST ACTIONS
  const handleRegisterPatient = (e) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.email) return;

    const patId = `pat-${Date.now()}`;
    const patientObj = { id: patId, ...newPatient };
    
    // Topology Animation
    triggerFlow('register');

    // Simulate API Call
    addApiLog('POST', 'http://localhost:4007/api/patients', patientObj, 201, {
      message: "Patient registered successfully",
      patientId: patId,
      billingProvisioned: true,
      billingAccount: { id: patId, balance: 0.0 }
    });

    // Update Mock Database
    setPatients(prev => [...prev, patientObj]);
    setBillingAccounts(prev => ({
      ...prev,
      [patId]: { balance: 0, transactions: [] }
    }));
    setKafkaLogs(prev => [
      { timestamp: new Date().toISOString(), service: 'patient-service', event: 'PATIENT_REGISTERED', detail: `Registered ${patientObj.name}` },
      { timestamp: new Date().toISOString(), service: 'billing-service', event: 'BILLING_ACCOUNT_PROVISIONED', detail: `Zero-balance gRPC billing account created for ${patId}` },
      ...prev
    ]);

    setNewPatient({ name: '', email: '', dob: '', address: '' });
    setSelectedPatientId(patId);
  };

  const parseTimeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatMinutesToTime = (minNum) => {
    const h = Math.floor(minNum / 60).toString().padStart(2, '0');
    const m = (minNum % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    const startMin = parseTimeToMinutes(newAppt.startTime);
    const durationMin = parseInt(newAppt.duration);
    const endMin = startMin + durationMin;
    const date = newAppt.date;
    const doctor = newAppt.doctor;
    const fee = parseFloat(newAppt.fee);

    // Overlap math check: (newStart < existingEnd) AND (existingStart < newEnd)
    const isOverlap = appointments.some(appt => {
      if (appt.date !== date || appt.doctor !== doctor) return false;
      const apptStart = parseTimeToMinutes(appt.startTime);
      const apptEnd = parseTimeToMinutes(appt.endTime);
      return (startMin < apptEnd) && (apptStart < endMin);
    });

    if (isOverlap) {
      triggerFlow('conflict');
      addApiLog('POST', 'http://localhost:4007/api/appointments', { ...newAppt, startMin, endMin }, 400, {
        error: "CONFLICT_SCHEDULE",
        message: `Doctor ${doctor} has a schedule conflict on ${date} between ${newAppt.startTime} and ${formatMinutesToTime(endMin)}`
      });
      return;
    }

    // Book appointment
    triggerFlow('schedule');
    const apptId = `app-${Date.now()}`;
    const selectedPat = patients.find(p => p.id === newAppt.patientId);

    const apptObj = {
      id: apptId,
      patientId: newAppt.patientId,
      patientName: selectedPat ? selectedPat.name : 'Unknown',
      doctor,
      date,
      startTime: newAppt.startTime,
      endTime: formatMinutesToTime(endMin),
      fee
    };

    addApiLog('POST', 'http://localhost:4007/api/appointments', apptObj, 201, {
      message: "Appointment booked & billing charged successfully",
      appointmentId: apptId,
      feeCharged: fee
    });

    setAppointments(prev => [...prev, apptObj]);
    
    // Update Billing Ledger
    setBillingAccounts(prev => {
      const acc = prev[newAppt.patientId] || { balance: 0, transactions: [] };
      return {
        ...prev,
        [newAppt.patientId]: {
          balance: acc.balance + fee,
          transactions: [...acc.transactions, { type: 'CHARGE', amount: fee, desc: `Charged Appt ${apptId} Scheduled` }]
        }
      };
    });

    // Kafka
    setKafkaLogs(prev => [
      { timestamp: new Date().toISOString(), service: 'appointment-service', event: 'APPOINTMENT_CREATED', detail: `Booked appt ${apptId} with ${doctor} ($${fee})` },
      { timestamp: new Date().toISOString(), service: 'billing-service', event: 'ACCOUNT_CHARGED', detail: `Charged pat account ${newAppt.patientId} total $${fee}` },
      ...prev
    ]);
  };

  const handleCancelAppointment = (apptId) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    triggerFlow('cancel');

    addApiLog('DELETE', `http://localhost:4007/api/appointments/${apptId}`, null, 200, {
      message: "Appointment canceled & 100% refund applied",
      refundApplied: appt.fee
    });

    setAppointments(prev => prev.filter(a => a.id !== apptId));
    setBillingAccounts(prev => {
      const acc = prev[appt.patientId] || { balance: 0, transactions: [] };
      return {
        ...prev,
        [appt.patientId]: {
          balance: Math.max(0, acc.balance - appt.fee),
          transactions: [...acc.transactions, { type: 'REFUND', amount: appt.fee, desc: `Refund Appt ${apptId} Cancelled` }]
        }
      };
    });

    setKafkaLogs(prev => [
      { timestamp: new Date().toISOString(), service: 'appointment-service', event: 'APPOINTMENT_DELETED', detail: `Canceled appt ${apptId}` },
      { timestamp: new Date().toISOString(), service: 'billing-service', event: 'ACCOUNT_REFUNDED', detail: `Refunded $${appt.fee} to ${appt.patientId}` },
      ...prev
    ]);
  };

  const handleAdjustFee = (apptId, newFee) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    const delta = newFee - appt.fee;
    triggerFlow('schedule');

    addApiLog('PUT', `http://localhost:4007/api/appointments/${apptId}/fee`, { fee: newFee }, 200, {
      message: "Appointment fee adjusted",
      oldFee: appt.fee,
      newFee: newFee,
      billingDifference: delta
    });

    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, fee: newFee } : a));
    setBillingAccounts(prev => {
      const acc = prev[appt.patientId] || { balance: 0, transactions: [] };
      const transactionType = delta > 0 ? 'CHARGE_ADJUSTMENT' : 'CREDIT_ADJUSTMENT';
      const absDelta = Math.abs(delta);
      return {
        ...prev,
        [appt.patientId]: {
          balance: Math.max(0, acc.balance + delta),
          transactions: [...acc.transactions, { type: transactionType, amount: absDelta, desc: `Adjusted Appt ${apptId} fee from $${appt.fee} to $${newFee}` }]
        }
      };
    });

    setKafkaLogs(prev => [
      { timestamp: new Date().toISOString(), service: 'appointment-service', event: 'APPOINTMENT_FEE_UPDATED', detail: `Adjusted appt ${apptId} fee to $${newFee}` },
      { timestamp: new Date().toISOString(), service: 'billing-service', event: delta > 0 ? 'ACCOUNT_CHARGED' : 'ACCOUNT_REFUNDED', detail: `Adjusted ledger by $${delta}` },
      ...prev
    ]);
  };

  return (
    <div className="page-container">
      {/* Navigation and Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Demo Connection:</span>
            <button
              onClick={() => {
                setIsLiveMode(!isLiveMode);
                addApiLog('SYSTEM', 'Toggled Mode', null, 200, { liveMode: !isLiveMode });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isLiveMode ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-cyan-400 animate-pulse' : 'bg-violet-400'}`}></span>
              {isLiveMode ? 'Live (API Gateway)' : 'Mock (In-Browser)'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Controller Form / Simulator */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* RBAC Mode Tabs */}
          <div className="glass p-2 flex gap-1">
            {['RECEPTIONIST', 'PATIENT', 'PHYSICIAN', 'ADMIN'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  triggerFlow('auth');
                  addApiLog('AUTH', `Switched role boundary to ${role}`, null, 200, { currentRole: role });
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all ${
                  activeRole === role ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Tab Views */}
          {activeRole === 'RECEPTIONIST' && (
            <div className="glass p-6 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Receptionist Clinical Operations
              </h3>

              {/* Patient Intake Form */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-violet-400" />
                  1. Clinical Patient Intake (Synchronous Provisioning)
                </h4>
                <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Patient Name"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="w-full"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full"
                    required
                  />
                  <input
                    type="date"
                    placeholder="DOB"
                    value={newPatient.dob}
                    onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })}
                    className="w-full"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="w-full"
                  />
                  <button type="submit" className="md:col-span-2 btn-primary justify-center text-xs">
                    Register Intake & Provision Billing
                  </button>
                </form>
              </div>

              {/* Book Appointment Form */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-400" />
                  2. Intelligent Conflict-Free Scheduling (Durational Overlap Checks)
                </h4>
                <form onSubmit={handleBookAppointment} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-400 font-mono">Patient</label>
                    <select
                      value={newAppt.patientId}
                      onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                      className="w-full text-xs"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-mono">Physician</label>
                    <select
                      value={newAppt.doctor}
                      onChange={(e) => setNewAppt({ ...newAppt, doctor: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="Dr. House">Dr. House</option>
                      <option value="Dr. Strange">Dr. Strange</option>
                      <option value="Dr. Watson">Dr. Watson</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-mono">Date</label>
                    <input
                      type="date"
                      value={newAppt.date}
                      onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-mono">Start Time</label>
                    <input
                      type="time"
                      value={newAppt.startTime}
                      onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-mono">Duration (Min)</label>
                    <select
                      value={newAppt.duration}
                      onChange={(e) => setNewAppt({ ...newAppt, duration: e.target.value })}
                      className="w-full text-xs"
                    >
                      <option value="30">30 Min</option>
                      <option value="60">60 Min</option>
                      <option value="90">90 Min</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-mono">Fee ($)</label>
                    <input
                      type="number"
                      value={newAppt.fee}
                      onChange={(e) => setNewAppt({ ...newAppt, fee: e.target.value })}
                      className="w-full text-xs"
                    />
                  </div>
                  <button type="submit" className="col-span-2 md:col-span-3 btn-primary justify-center text-xs mt-2">
                    Validate Schedule & Charge Account
                  </button>
                </form>
              </div>

              {/* Schedule conflicts visualization */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Physician Schedule Block Visualizer</h4>
                <div className="h-16 bg-slate-950/60 rounded border border-white/5 relative flex overflow-hidden">
                  <div className="absolute inset-0 flex justify-between px-2 text-[9px] text-slate-500 items-end font-mono">
                    <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span>
                  </div>
                  {/* Map existing appointments */}
                  {appointments.filter(a => a.doctor === newAppt.doctor && a.date === newAppt.date).map(appt => {
                    const start = parseTimeToMinutes(appt.startTime);
                    const end = parseTimeToMinutes(appt.endTime);
                    const pctLeft = ((start - 480) / 480) * 100;
                    const pctWidth = ((end - start) / 480) * 100;
                    return (
                      <div
                        key={appt.id}
                        className="absolute top-2 h-8 bg-indigo-500/20 border border-indigo-500/40 text-[10px] p-1 text-indigo-300 font-semibold rounded flex items-center justify-between"
                        style={{ left: `${pctLeft}%`, width: `${pctWidth}%` }}
                      >
                        <span className="truncate">{appt.patientName}</span>
                        <span>{appt.startTime}</span>
                      </div>
                    );
                  })}
                  {/* Proposed appointment */}
                  {(() => {
                    const start = parseTimeToMinutes(newAppt.startTime);
                    const duration = parseInt(newAppt.duration);
                    const end = start + duration;
                    const pctLeft = ((start - 480) / 480) * 100;
                    const pctWidth = (duration / 480) * 100;
                    if (pctLeft < 0 || pctLeft > 100) return null;
                    return (
                      <div
                        className="absolute top-2 h-8 bg-violet-500/40 border border-violet-500 animate-pulse text-[10px] p-1 text-violet-200 font-semibold rounded flex items-center justify-between"
                        style={{ left: `${pctLeft}%`, width: `${pctWidth}%` }}
                      >
                        <span>(PROPOSED)</span>
                        <span>{newAppt.startTime}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeRole === 'PATIENT' && (
            <div className="glass p-6 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Patient Financial Statement Dashboard
              </h3>

              <div className="flex gap-4 items-center">
                <span className="text-sm text-slate-400">Select Patient Profile:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="py-1.5 px-3"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Ledger Statement */}
              {(() => {
                const bill = billingAccounts[selectedPatientId] || { balance: 0, transactions: [] };
                const pat = patients.find(p => p.id === selectedPatientId);
                const appts = appointments.filter(a => a.patientId === selectedPatientId);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/25 p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-xs text-slate-500 font-mono">PATIENT METADATA</span>
                      <span className="text-lg font-bold mt-2 text-white">{pat?.name}</span>
                      <span className="text-xs text-slate-400 mt-1 truncate">{pat?.email}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{pat?.address || 'No Address'}</span>
                    </div>

                    <div className="bg-black/25 p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-xs text-slate-500 font-mono">LEDGER ACCOUNT BALANCE</span>
                      <span className="text-3xl font-extrabold mt-2 text-emerald-400">${bill.balance.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">Status: Provisioned (Active)</span>
                    </div>

                    <div className="bg-black/25 p-4 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-xs text-slate-500 font-mono">SCHEDULED APPOINTMENTS</span>
                      <span className="text-3xl font-extrabold mt-2 text-indigo-400">{appts.length}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">Duration-Locked</span>
                    </div>

                    {/* Transaction History Table */}
                    <div className="md:col-span-3 bg-white/5 rounded-xl border border-white/5 p-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Billing Account Transaction Ledger</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-white/5 text-slate-500 pb-2">
                              <th className="pb-2">Type</th>
                              <th className="pb-2 text-right">Amount</th>
                              <th className="pb-2 pl-4">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bill.transactions.map((tx, idx) => (
                              <tr key={idx} className="border-b border-white/5 py-2">
                                <td className={`py-2.5 font-bold ${
                                  tx.type.includes('CHARGE') ? 'text-amber-400' : 'text-emerald-400'
                                }`}>{tx.type}</td>
                                <td className="py-2.5 text-right font-bold">${tx.amount.toFixed(2)}</td>
                                <td className="py-2.5 pl-4 text-slate-400">{tx.desc}</td>
                              </tr>
                            ))}
                            {bill.transactions.length === 0 && (
                              <tr>
                                <td colSpan="3" className="py-4 text-center text-slate-500 italic">No ledger entries recorded. Balance zero.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeRole === 'PHYSICIAN' && (
            <div className="glass p-6 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Physician Agenda Workspace
              </h3>

              <div className="flex gap-4 items-center">
                <span className="text-sm text-slate-400">Select Doctor Portal:</span>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="py-1.5 px-3"
                >
                  <option value="Dr. House">Dr. House</option>
                  <option value="Dr. Strange">Dr. Strange</option>
                  <option value="Dr. Watson">Dr. Watson</option>
                </select>
              </div>

              {/* List Agenda */}
              <div className="flex flex-col gap-3">
                {appointments.filter(a => a.doctor === selectedDoctor).map(appt => (
                  <div key={appt.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs text-indigo-400 font-mono font-semibold">{appt.date} • {appt.startTime} - {appt.endTime}</span>
                      <h4 className="text-lg font-bold text-white mt-1">{appt.patientName}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Appt ID: {appt.id} | Consult Fee: ${appt.fee}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          const newFee = prompt("Enter adjusted fee ($):", appt.fee);
                          if (newFee) handleAdjustFee(appt.id, parseFloat(newFee));
                        }}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        Adjust Fee
                      </button>
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="btn-secondary py-1 px-3 text-xs hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40"
                      >
                        Cancel Appt
                      </button>
                    </div>
                  </div>
                ))}
                {appointments.filter(a => a.doctor === selectedDoctor).length === 0 && (
                  <div className="text-center py-10 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-slate-500 italic">No appointments scheduled for {selectedDoctor} on this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeRole === 'ADMIN' && (
            <div className="glass p-6 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart className="w-5 h-5 text-indigo-400" />
                Kafka Analytics Dashboard (analytics-service)
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">TOTAL CLIENTS</span>
                  <p className="text-2xl font-bold text-white mt-1">{patients.length}</p>
                </div>
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">APPOINTMENTS</span>
                  <p className="text-2xl font-bold text-white mt-1">{appointments.length}</p>
                </div>
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">GROSS LEDGER</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ${Object.values(billingAccounts).reduce((sum, item) => sum + item.balance, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-black/25 p-3 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">KAFKA AUDITS</span>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{kafkaLogs.length}</p>
                </div>
              </div>

              {/* Kafka Log Feed */}
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-xs text-cyan-400 font-mono font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block animate-pulse"></span>
                  KAFKA EVENT CONFLICT/AUDIT TOPICS
                </span>
                <div className="h-60 overflow-y-auto flex flex-col gap-1.5 pr-2 font-mono text-[11px]">
                  {kafkaLogs.map((log, index) => (
                    <div key={index} className="border-b border-white/5 pb-1.5">
                      <span className="text-slate-500">[{log.timestamp.slice(11, 19)}]</span>{' '}
                      <span className="text-violet-400">{log.service}:</span>{' '}
                      <span className="text-emerald-400 font-semibold">{log.event}</span>{' '}
                      <span className="text-slate-300">→ {log.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Architecture & Console Log */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <TopologyMap activeFlow={activeFlow} />

          {/* Console Log Screen */}
          <div className="glass p-4 bg-slate-950/90 flex flex-col border border-white/10 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-indigo-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                HTTP REST API GATEWAY LOG CONSOLE
              </span>
              <button
                onClick={() => setApiLogs([])}
                className="text-[10px] font-mono text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="h-96 overflow-y-auto flex flex-col gap-4 font-mono text-[11px] pr-2">
              {apiLogs.map((log, index) => (
                <div key={index} className="bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center text-xs pb-1.5 border-b border-white/5 mb-2">
                    <span className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        log.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.method === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                        log.method === 'PUT' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>{log.method}</span>
                      <span className="text-slate-400 truncate">{log.url}</span>
                    </span>
                    <span className={`font-bold ${log.status < 300 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.status}
                    </span>
                  </div>

                  {log.requestBody && (
                    <div className="mb-2">
                      <div className="text-[10px] text-slate-500 mb-0.5">REQUEST BODY:</div>
                      <pre className="text-slate-300 overflow-x-auto max-w-full bg-slate-950 p-2 rounded border border-white/5">{log.requestBody}</pre>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] text-slate-500 mb-0.5">RESPONSE BODY:</div>
                    <pre className="text-slate-300 overflow-x-auto max-w-full bg-slate-950 p-2 rounded border border-white/5">{log.responseBody}</pre>
                  </div>
                </div>
              ))}

              {apiLogs.length === 0 && (
                <div className="text-center py-20 text-slate-500 italic">
                  Run role actions in the left panel to watch real-time API transactions logging here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
