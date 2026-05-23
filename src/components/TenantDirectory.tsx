import React, { useState } from 'react';
import { Search, Trash2, MessageSquare, Plus, DollarSign, Sparkles } from 'lucide-react';
import { Contact } from '../types';

interface TenantDirectoryProps {
  contacts: Contact[];
  onDeleteTenant: (id: string) => void;
  onNavigateToSms: (tenantId: string) => void;
  onUpdateTenantBalance: (id: string, newBalance: number) => void;
}

export const TenantDirectory: React.FC<TenantDirectoryProps> = ({
  contacts,
  onDeleteTenant,
  onNavigateToSms,
  onUpdateTenantBalance,
}) => {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);

  const filteredTenants = contacts.filter(t => {
    const s = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.phone.includes(s) ||
      t.group.toLowerCase().includes(s)
    );
  });

  const handleStartEditing = (tenant: Contact) => {
    setEditingId(tenant.id);
    setTempBalance(tenant.balance.toString());
  };

  const handleSaveBalance = (id: string) => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val) && val >= 0) {
      onUpdateTenantBalance(id, val);
    }
    setEditingId(null);
  };

  const handleRecordPayment = (id: string, currentBalance: number) => {
    const val = parseFloat(paymentAmount);
    if (!isNaN(val) && val > 0) {
      const remaining = Math.max(0, currentBalance - val);
      onUpdateTenantBalance(id, remaining);
      setPaymentAmount('');
      setActivePaymentId(null);
    }
  };

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg space-y-4">
      
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-sans font-bold text-slate-100 text-base">Active Tenant Registry</h3>
          <p className="text-xs text-slate-400 mt-0.5">Filter, track rent schedules, and manage on-record communications</p>
        </div>
        
        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search tenant, unit, or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>
      </div>

      {/* Tenant Directory Table */}
      <div className="overflow-x-auto border border-[#1E293B] rounded-xl bg-black/25">
        <table className="w-full border-collapse text-left text-xs text-slate-350">
          <thead className="bg-[#0B0E14] text-slate-400 font-mono text-[10.5px] uppercase tracking-wider border-b border-[#1E293B]">
            <tr>
              <th scope="col" className="py-3.5 px-4 font-semibold">Tenant Details</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-center">Assigned Unit</th>
              <th scope="col" className="py-3.5 px-4 font-semibold">Phone Contact</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-right">Monthly Rent Rate</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-right">Balance Due</th>
              <th scope="col" className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] font-sans">
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                  No registered tenants match your search query.
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => {
                const isEditing = editingId === tenant.id;
                const isPaying = activePaymentId === tenant.id;
                
                return (
                  <tr key={tenant.id} className="hover:bg-slate-900/40 transition-colors group">
                    
                    {/* Name */}
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{tenant.name}</span>
                        {tenant.balance > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Has pending balance"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                        Joined {new Date(tenant.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    
                    {/* Unit */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 font-mono font-bold uppercase text-[10.5px] border border-indigo-500/20">
                        Unit {tenant.group}
                      </span>
                    </td>
                    
                    {/* Phone */}
                    <td className="py-4 px-4 text-slate-300 font-mono text-xs">
                      {tenant.phone}
                    </td>
                    
                    {/* Monthly Rent */}
                    <td className="py-4 px-4 text-right font-semibold text-white font-mono">
                      Ksh {tenant.rentAmount?.toLocaleString() || '0'}
                    </td>
                    
                    {/* Balance */}
                    <td className="py-4 px-4 text-right font-mono">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-500 font-mono text-[10px]">Ksh</span>
                          <input
                            type="text"
                            value={tempBalance}
                            onChange={(e) => setTempBalance(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveBalance(tenant.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="bg-[#0B0E14] border border-indigo-500 text-white text-right px-1.5 py-1 rounded w-20 text-[11px] outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveBalance(tenant.id)}
                            className="text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.5 rounded text-[9px] font-mono cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${tenant.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              Ksh {tenant.balance.toLocaleString()}
                            </span>
                            <button
                              onClick={() => handleStartEditing(tenant)}
                              className="text-slate-500 hover:text-white text-[9.5px] font-mono font-medium opacity-0 group-hover:opacity-100 transition-opacity underline cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                          
                          {/* Payment Quick settle */}
                          {tenant.balance > 0 && !isPaying && (
                            <button
                              onClick={() => {
                                setActivePaymentId(tenant.id);
                                setPaymentAmount(tenant.balance.toString());
                              }}
                              className="text-[9.5px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/20 cursor-pointer"
                            >
                              Settle Rent
                            </button>
                          )}

                          {isPaying && (
                            <div className="flex items-center justify-end gap-1 mt-1 font-sans">
                              <input
                                type="text"
                                placeholder="Pay Amt"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="bg-[#0B0E14] border border-emerald-500 text-white text-right px-1 py-0.5 rounded w-16 text-[10px] outline-none"
                              />
                              <button
                                onClick={() => handleRecordPayment(tenant.id, tenant.balance)}
                                className="text-white hover:text-white bg-emerald-600 hover:bg-emerald-500 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                              >
                                Pay
                              </button>
                              <button
                                onClick={() => setActivePaymentId(null)}
                                className="text-slate-400 hover:text-white text-[10px] px-1 font-mono cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    
                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        
                        {/* Send SMS Action */}
                        <button
                          type="button"
                          onClick={() => onNavigateToSms(tenant.id)}
                          className="flex items-center gap-1 py-1 px-2.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors shadow-sm cursor-pointer"
                          title={`Compose custom message to ${tenant.name}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Message
                        </button>
                        
                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => onDeleteTenant(tenant.id)}
                          className="p-1 px-1.5 text-slate-500 hover:text-red-400 border border-[#1E293B] hover:border-red-500/20 bg-[#0B0E14] hover:bg-red-500/5 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title={`Archive tenant assignment`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-indigo-950/15 border border-indigo-500/20 rounded-xl text-xs text-slate-400 font-sans leading-relaxed">
        <span className="font-bold text-white text-[11px] flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Professional Portfolio Management Tips
        </span>
        To message a tenant with an overdue bill, click the <strong className="text-indigo-400">Message</strong> button. The portal will automatically focus the SMS Communicator, select the tenant, and draft a high-context lease reminder via Twilio.
      </div>
      
    </div>
  );
};
