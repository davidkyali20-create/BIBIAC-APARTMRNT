import React from 'react';
import { TrendingUp, AlertTriangle, Home, DollarSign, Send, CheckCircle } from 'lucide-react';
import { Contact } from '../types';

interface DashboardSummaryProps {
  contacts: Contact[];
  availableUnits: string[];
  onNavigateToSmsWithTenant: (tenantId: string) => void;
  onNavigateToSmsBulk: (unpaidTenants: { name: string; phone: string }[]) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  contacts,
  availableUnits,
  onNavigateToSmsWithTenant,
  onNavigateToSmsBulk,
}) => {
  // Compute portfolio stats
  const totalTenants = contacts.length;
  
  const totalRentPotential = contacts.reduce((sum, c) => sum + (c.rentAmount || 0), 0);
  const totalPendingBalance = contacts.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalRentCollected = Math.max(0, totalRentPotential - totalPendingBalance);

  // Occupied units vs vacant units
  // Any contact.group is their unit (e.g., "A1")
  const occupiedUnits = Array.from(new Set(contacts.map(c => c.group.toUpperCase().replace('UNIT ', '').trim())));
  const totalUnitsCount = availableUnits.length;
  const occupiedUnitsCount = availableUnits.filter(u => occupiedUnits.includes(u)).length;
  const vacantUnits = availableUnits.filter(u => !occupiedUnits.includes(u));

  // Get list of tenants with pending balances for quick reminders
  const unpaidTenants = contacts.filter(c => (c.balance || 0) > 0);

  const rentCollectedPercent = totalRentPotential > 0 ? Math.round((totalRentCollected / totalRentPotential) * 100) : 100;
  const occupancyPercent = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Upper Grid: 3 Hero KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Rent Collected */}
        <div className="bg-[#111827] border border-[#1E293B] hover:border-emerald-500/30 transition-all rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase tracking-wider font-semibold">Total Revenue Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-sans font-bold tracking-tight text-white">
              Ksh {totalRentCollected.toLocaleString()}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">Of Ksh {totalRentPotential.toLocaleString()} invoice total</span>
              <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{rentCollectedPercent}%</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${rentCollectedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Balances */}
        <div className="bg-[#111827] border border-[#1E293B] hover:border-amber-500/30 transition-all rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase tracking-wider font-semibold">Pending Lease Balances</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-sans font-bold tracking-tight text-white">
              Ksh {totalPendingBalance.toLocaleString()}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">{unpaidTenants.length} tenants with overdue fees</span>
              {totalPendingBalance > 0 && (
                <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">Needs Review</span>
              )}
            </div>
            {/* Overdue alert indicator */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${totalRentPotential > 0 ? (totalPendingBalance / totalRentPotential) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Occupancy Status */}
        <div className="bg-[#111827] border border-[#1E293B] hover:border-indigo-500/30 transition-all rounded-xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl transform translate-x-4 -translate-y-4 group-hover:bg-indigo-500/10 transition-all"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 font-mono text-xs uppercase tracking-wider font-semibold">Portfolio Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-sans font-bold tracking-tight text-white">
              {occupiedUnitsCount} / {totalUnitsCount} Units
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">{vacantUnits.length} apartments vacant and waiting</span>
              <span className="text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">{occupancyPercent}% Occupied</span>
            </div>
            {/* Occupancy Rate indicator */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${occupancyPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Bottom Section: Overdue Tenant Action Panel + Vacancy Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Unpaid Overdue Action Board */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-sans font-bold text-slate-100 text-sm">Revenue Collection Watchlist</h4>
              <p className="text-xs text-slate-400 mt-0.5">Quickly contact tenants holding outstanding monthly balances</p>
            </div>
            {unpaidTenants.length > 0 && (
              <button
                type="button"
                onClick={() => onNavigateToSmsBulk(unpaidTenants.map(t => ({ name: t.name, phone: t.phone })))}
                className="text-[10.5px] font-mono uppercase bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-white font-bold p-1 px-3 border border-amber-500/30 rounded transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" /> Remind All ({unpaidTenants.length})
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {unpaidTenants.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">Outstanding balances cleared!</p>
                <p className="text-[11px]">All portfolio invoices are fully settled.</p>
              </div>
            ) : (
              unpaidTenants.map((tenant) => (
                <div key={tenant.id} className="bg-[#0B0E14] border border-[#1E293B] hover:border-slate-700 rounded-lg p-3 flex justify-between items-center transition-all group">
                  <div className="leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-bold">{tenant.name}</span>
                      <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 px-1.5 rounded uppercase font-semibold">Unit {tenant.group}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>{tenant.phone}</span>
                      <span className="text-slate-600">•</span>
                      <span>Rate: Ksh {tenant.rentAmount}/mo</span>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-amber-400 text-xs font-bold font-mono">Ksh {tenant.balance.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-500 font-mono">Unpaid</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToSmsWithTenant(tenant.id)}
                      className="bg-[#111827] border border-[#1E293B] group-hover:border-indigo-500 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white p-1.5 rounded-lg transition-all"
                      title={`Send rent reminder to ${tenant.name}`}
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vacancy Status Map Column */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg flex flex-col">
          <div className="mb-4 pb-3 border-b border-slate-800 flex justify-between items-end">
            <div>
              <h4 className="font-sans font-bold text-slate-100 text-sm">Leasing Directory Map</h4>
              <p className="text-xs text-slate-400 mt-0.5">Visual map of apartment occupation and fast vacancies</p>
            </div>
            {/* Tiny Map Legend */}
            <div className="flex gap-2 text-[8px] font-mono uppercase font-bold">
              <span className="flex items-center gap-1 text-sky-400"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> SR</span>
              <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> BS</span>
              <span className="flex items-center gap-1 text-violet-400"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span> 1B</span>
            </div>
          </div>

          {/* Grid Map represent each unit */}
          <div className="grid grid-cols-5 gap-3 mb-5">
            {availableUnits.map((unitNum) => {
              const occupant = contacts.find(c => c.group.toUpperCase().replace('UNIT ', '').trim() === unitNum);
              const isSR = unitNum.startsWith('SR-');
              const isBS = unitNum.startsWith('BS-');
              
              // Custom colors based on house classification
              let borderClass = 'border-slate-800 hover:border-slate-600';
              let bgClass = 'bg-[#0B0E14] text-slate-500';
              let typeLabelColor = 'text-slate-500';
              let badgeText = isSR ? 'Single Room' : isBS ? 'Bedsitter' : '1 Bedroom';

              if (occupant) {
                if (isSR) {
                  borderClass = 'border-sky-500/30';
                  bgClass = 'bg-sky-950/20 text-sky-400';
                  typeLabelColor = 'text-sky-400';
                } else if (isBS) {
                  borderClass = 'border-amber-500/30';
                  bgClass = 'bg-amber-950/20 text-amber-400';
                  typeLabelColor = 'text-amber-400';
                } else {
                  borderClass = 'border-indigo-500/30';
                  bgClass = 'bg-indigo-950/20 text-indigo-400';
                  typeLabelColor = 'text-indigo-400';
                }
              }

              return (
                <div 
                  key={unitNum} 
                  className={`border rounded-lg p-2 text-center transition-all relative group leading-none flex flex-col justify-center items-center h-14 ${borderClass} ${bgClass}`}
                >
                  <span className="font-mono font-bold text-xs">{unitNum}</span>
                  <span className={`text-[8px] uppercase font-bold tracking-tight mt-1 ${occupant ? typeLabelColor : 'text-slate-500/80'}`}>
                    {occupant ? 'Leased' : 'Vacant'}
                  </span>
                  
                  {/* Hover tooltip for occupants */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#1E293B] text-white text-[10px] p-2.5 rounded shadow-xl border border-slate-700 w-44 pointer-events-none opacity-0 group-hover:opacity-100 transition-all z-20 font-sans text-left leading-normal">
                    <p className="font-bold flex justify-between">
                      <span>{unitNum}</span>
                      <span className="text-[8px] text-slate-400 uppercase font-mono">{badgeText}</span>
                    </p>
                    {occupant ? (
                      <>
                        <p className="text-white text-[11px] mt-1.5 font-semibold">• {occupant.name}</p>
                        <p className="text-slate-400 text-[9px] mt-1">Phone: {occupant.phone}</p>
                        <p className="text-slate-400 text-[9px]">Rent Rate: Ksh {occupant.rentAmount}/mo</p>
                        <p className={`text-[9px] font-bold ${occupant.balance > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                          Due: Ksh {occupant.balance}
                        </p>
                      </>
                    ) : (
                      <p className="text-emerald-400 text-[9px] mt-1 italic">Immediate availability - click Add Tab to lease</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-auto bg-[#0B0E14] border border-[#1E293B] rounded-lg p-3 text-xs leading-relaxed space-y-1 text-slate-400">
            <p className="font-bold text-white flex items-center gap-1.5 mb-1.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block"></span>
              Lease Insights (17 Units Total Classification)
            </p>
            <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-800/60 mb-1.5">
              <div className="bg-[#111827] p-1.5 rounded text-center border border-slate-800/60">
                <span className="text-[9px] text-sky-400/80 uppercase font-bold block">Single Rooms</span>
                <span className="font-mono font-bold text-[11px] text-white">
                  {availableUnits.filter(u => u.startsWith('SR-') && occupiedUnits.includes(u)).length} / 2 leased
                </span>
              </div>
              <div className="bg-[#111827] p-1.5 rounded text-center border border-slate-800/60">
                <span className="text-[9px] text-amber-400/80 uppercase font-bold block">Bedsitters</span>
                <span className="font-mono font-bold text-[11px] text-white">
                  {availableUnits.filter(u => u.startsWith('BS-') && occupiedUnits.includes(u)).length} / 2 leased
                </span>
              </div>
              <div className="bg-[#111827] p-1.5 rounded text-center border border-slate-800/60">
                <span className="text-[9px] text-indigo-400/80 uppercase font-bold block">1-Bedrooms</span>
                <span className="font-mono font-bold text-[11px] text-white">
                  {availableUnits.filter(u => u.startsWith('1B-') && occupiedUnits.includes(u)).length} / 13 leased
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Overall Occupied (Assigned):</span>
              <span className="font-bold text-white font-mono">{occupiedUnitsCount} of 17</span>
            </div>
            <div className="flex justify-between">
              <span>Overall Vacant (Lease-Ready):</span>
              <span className="font-bold text-emerald-400 font-mono">{vacantUnits.length} of 17</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
