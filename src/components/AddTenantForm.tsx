import React, { useState } from 'react';
import { PlusCircle, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { Contact } from '../types';

interface AddTenantFormProps {
  contacts: Contact[];
  availableUnits: string[];
  onAddTenant: (newTenant: Omit<Contact, 'id' | 'createdAt'>) => void;
}

export const AddTenantForm: React.FC<AddTenantFormProps> = ({
  contacts,
  availableUnits,
  onAddTenant,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [rent, setRent] = useState('1200');
  const [balance, setBalance] = useState('0');
  
  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Find units that are NOT currently assigned to other tenants
  const occupiedUnits = contacts.map(c => c.group.toUpperCase().replace('UNIT ', '').trim());
  const vacantUnits = availableUnits.filter(u => !occupiedUnits.includes(u));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Verification sanity checks
    if (!name.trim()) {
      setErrorMsg('Full legal tenant name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('A valid phone number is required.');
      return;
    }

    // Phone format recommendation
    const cleanPhone = phone.trim();
    const isValidPhone = cleanPhone.startsWith('+') || cleanPhone.startsWith('07') || cleanPhone.startsWith('01');
    if (!isValidPhone) {
      setErrorMsg('Please enter a valid phone format starting with country code (e.g. +254...) or local numbers (e.g. 07... or 01...)');
      return;
    }

    const assignedUnit = isCustomUnit ? customUnit.trim().toUpperCase() : unit;
    if (!assignedUnit) {
      setErrorMsg('Please specify unit assignment for this lease.');
      return;
    }

    // Check if unit is already occupied
    if (occupiedUnits.includes(assignedUnit)) {
      setErrorMsg(`Warning: Unit ${assignedUnit} is already leased under an active contract. Please choose a vacant unit.`);
      return;
    }

    const rentPrice = parseFloat(rent);
    if (isNaN(rentPrice) || rentPrice <= 0) {
      setErrorMsg('Monthly rent rate must be a valid positive number.');
      return;
    }

    const initialBalance = parseFloat(balance);
    if (isNaN(initialBalance) || initialBalance < 0) {
      setErrorMsg('Opening outstanding balance must be 0 or dynamic positive.');
      return;
    }

    // Success dispatch
    onAddTenant({
      name: name.trim(),
      phone: cleanPhone,
      group: assignedUnit,
      rentAmount: rentPrice,
      balance: initialBalance,
    });

    // Notify user
    setSuccessMsg(`Success! Onboarded ${name.trim()} successfully and assigned Unit ${assignedUnit} with Ksh ${rentPrice}/mo rate.`);
    
    // Reset forms
    setName('');
    setPhone('');
    setUnit('');
    setCustomUnit('');
    setIsCustomUnit(false);
    setBalance('0');
  };

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-slate-100 text-base">Onboard & Assign Tenant</h3>
          <p className="text-xs text-slate-400 mt-0.5">Register contracts, bind mobile numbers, and assign portfolio units</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        
        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Name and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Legal Name</label>
            <input
              type="text"
              placeholder="e.g. Dennis Kiprop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Contact Number</label>
            <input
              type="tel"
              placeholder="e.g. +254711223344"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Must start with country prefix code (e.g. +254)</span>
          </div>
        </div>

        {/* Housing Units Assignment */}
        <div className="p-4 bg-[#0B0E14] border border-[#1E293B] rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-mono font-bold text-indigo-400 uppercase">Unit Allocation Selection</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomUnit(!isCustomUnit);
                setUnit('');
                setCustomUnit('');
                setErrorMsg('');
              }}
              className="text-[10px] font-mono font-bold text-indigo-500 hover:text-indigo-400 underline cursor-pointer"
            >
              {isCustomUnit ? 'Choose vacant unit' : 'Enter custom unit designation'}
            </button>
          </div>

          {!isCustomUnit ? (
            <div>
              {vacantUnits.length === 0 ? (
                <div className="text-center p-4 py-6 bg-amber-500/5 border border-dashed border-amber-500/20 text-amber-400 text-xs rounded-lg">
                  ⚠️ No standard units match vacancy criteria. Use custom designation above!
                </div>
              ) : (
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose Vacant Unit --</option>
                  {vacantUnits.map(v => (
                    <option key={v} value={v}>Unit {v} (Immediate Occupation Available)</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="e.g. Suite 501, Penthouse C"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase font-mono"
              />
            </div>
          )}
        </div>

        {/* Rent rate & Starting balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly Rent Rate (Ksh)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 font-bold font-mono">Ksh</span>
              <input
                type="number"
                placeholder="25000"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-lg pl-12 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Default billing rent standard currency is Ksh</span>
          </div>

          <div>
            <label className="block text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Outstanding Opening Balance (Ksh)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 font-bold font-mono">Ksh</span>
              <input
                type="number"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-lg pl-12 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Specify outstanding arrears (Set 0 for fully paid)</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow-md transition-all mt-4 cursor-pointer"
        >
          ➕ Finalize Onboarding & Lease Agreement
        </button>
      </form>

      <div className="mt-5 p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] leading-relaxed text-slate-400 flex gap-2.5">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block">Automated Portability Notifications</span>
          Upon successfully recording this lease contract, the system registers the tenant. They instantly appear in the <strong>Tenant Directory</strong>, enabling instant billing invoice SMS broadcasts with just one click.
        </div>
      </div>
    </div>
  );
};
