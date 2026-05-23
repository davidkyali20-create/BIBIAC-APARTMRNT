/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  PlusCircle, 
  MessageSquare, 
  TrendingUp, 
  Sparkles,
  CreditCard,
  RefreshCw, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Contact, SmsLog, ProviderConfigStatus } from './types';
import { DashboardSummary } from './components/DashboardSummary';
import { TenantDirectory } from './components/TenantDirectory';
import { AddTenantForm } from './components/AddTenantForm';
import { SmsPanel } from './components/SmsPanel';

// Pre-seeded professional property rent units and contracts
const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Saruni Lenolkulal', phone: '+254711223344', group: '1B-01', rentAmount: 1200, balance: 0, createdAt: '2026-05-23T12:00:00Z' },
  { id: 'c2', name: 'Dennis Kiprop', phone: '+254722334455', group: 'BS-1', rentAmount: 950, balance: 350, createdAt: '2026-05-23T12:05:00Z' },
  { id: 'c3', name: 'Zahra Welimo', phone: '+254733445566', group: '1B-02', rentAmount: 1500, balance: 1500, createdAt: '2026-05-23T12:10:00Z' },
  { id: 'c4', name: 'Audrey Omwamba', phone: '+254744556677', group: 'SR-1', rentAmount: 1100, balance: 0, createdAt: '2026-05-23T12:15:00Z' },
  { id: 'c5', name: 'Michael Vance', phone: '+14155552671', group: '1B-03', rentAmount: 1800, balance: 150, createdAt: '2026-05-23T12:20:00Z' },
];

const INITIAL_LOGS: SmsLog[] = [
  { 
    id: 'log-1', 
    recipientName: 'Saruni Lenolkulal', 
    recipientPhone: '+254711223344', 
    message: 'Dear Saruni, your monthly rent of $1,200 for Unit 1B-01 has been successfully recorded. Enjoy your home!', 
    provider: 'simulator', 
    status: 'delivered', 
    timestamp: '2026-05-23T20:45:00Z' 
  },
  { 
    id: 'log-2', 
    recipientName: 'Zahra Welimo', 
    recipientPhone: '+254733445566', 
    message: 'Dear Zahra, your rent of $1,500 for Unit 1B-02 is due. Current arrears: $1,500. Please clear by 1st.', 
    provider: 'simulator', 
    status: 'delivered', 
    timestamp: '2026-05-23T21:00:00Z' 
  }
];

// Defined fixed standard apartment units mapped to our properties
// 2 Single Rooms (SR-1, SR-2), 2 Bedsitters (BS-1, BS-2), and 21 One Bedroom units (1B-01 to 1B-21)
const AVAILABLE_UNITS = [
  'SR-1', 'SR-2', 
  'BS-1', 'BS-2', 
  '1B-01', '1B-02', '1B-03', '1B-04', '1B-05', 
  '1B-06', '1B-07', '1B-08', '1B-09', '1B-10', 
  '1B-11', '1B-12', '1B-13', '1B-14', '1B-15', 
  '1B-16', '1B-17', '1B-18', '1B-19', '1B-20', 
  '1B-21'
];

export default function App() {
  // Navigation active state
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tenants' | 'onboard' | 'sms'>('dashboard');
  
  // Contacts and logs state
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('bibiac_contacts_v3');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => {
    const saved = localStorage.getItem('bibiac_sms_logs_v3');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Twilio/Gemini capabilities configuration statuses from server side
  const [configuredStatus, setConfiguredStatus] = useState<ProviderConfigStatus>({
    twilioConfigured: false,
    africasTalkingConfigured: false,
    geminiConfigured: false,
  });

  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Sync state modifications to local storage on trigger
  useEffect(() => {
    localStorage.setItem('bibiac_contacts_v2', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('bibiac_sms_logs_v2', JSON.stringify(smsLogs));
  }, [smsLogs]);

  // Read backend server config on application cold start
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setConfiguredStatus({
          twilioConfigured: !!data.twilioConfigured,
          africasTalkingConfigured: !!data.africasTalkingConfigured,
          geminiConfigured: !!data.geminiConfigured,
        });
      }
    } catch (err) {
      console.error('Failure reaching API status indicators:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Onboard Tenant
  const handleAddTenant = (newTenant: Omit<Contact, 'id' | 'createdAt'>) => {
    const fresh: Contact = {
      ...newTenant,
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setContacts(prev => [fresh, ...prev]);
  };

  // Terminate Lease Contract
  const handleDeleteTenant = (id: string) => {
    if (confirm('Are you sure you want to terminate this tenant lease contract? Outstanding balances will be archived.')) {
      setContacts(prev => prev.filter(c => c.id !== id));
      if (selectedTenantId === id) {
        setSelectedTenantId(null);
      }
    }
  };

  // Adjust balance dues or Record payments on rent schedule
  const handleUpdateTenantBalance = (id: string, newBalance: number) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, balance: newBalance } : c));
  };

  // Trigger SMS carrier delivery via backend
  const handleSendSms = async (
    recipientName: string, 
    recipientPhone: string, 
    message: string, 
    channel: 'twilio' | 'simulator'
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName,
          recipientPhone,
          message,
          provider: channel
        })
      });

      if (res.ok) {
        const data = await res.json();
        const freshLog: SmsLog = {
          id: `log-${Date.now()}`,
          recipientName,
          recipientPhone,
          message,
          provider: channel,
          status: 'sent',
          timestamp: new Date().toISOString()
        };
        setSmsLogs(prev => [freshLog, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Critical failure during SMS broadcast:', err);
      return false;
    }
  };

  // Gemini suggested content generation
  const handleSuggestSms = async (prompt: string, tone: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/gemini/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tone })
      });

      if (res.ok) {
        const data = await res.json();
        return data.suggestion || null;
      }
      return null;
    } catch (err) {
      console.error('AI assistant suggest request failure:', err);
      return null;
    }
  };

  // Quick navigation hooks
  const handleNavigateToSms = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setActiveSection('sms');
  };

  const handleNavigateToSmsBulk = (unpaidTenants: { name: string; phone: string }[]) => {
    if (unpaidTenants.length > 0) {
      // Message the first unpaid tenant directly
      const matching = contacts.find(c => c.phone === unpaidTenants[0].phone);
      if (matching) {
        setSelectedTenantId(matching.id);
      }
    }
    setActiveSection('sms');
  };

  return (
    <div className="bg-[#0B0E14] text-slate-300 min-h-screen flex flex-col font-sans select-none select-text">
      
      {/* Upper Navigation Row Header */}
      <header id="control-header-panel" className="h-16 border-b border-[#1E293B] bg-[#111827] flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-sm tracking-tight text-white uppercase leading-none">BIBIAC</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1">SaaS Portfolio Manager</p>
          </div>
        </div>

        {/* Status indicator buttons / live metrics */}
        <div className="flex items-center gap-4">
          
          {/* Cloud Sandbox status */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            PORTAL CONNECTIVITY: READY
          </div>

          <button
            onClick={fetchStatus}
            disabled={statusLoading}
            className="p-1 px-2 text-slate-400 hover:text-white border border-[#1E293B] hover:border-indigo-500/30 bg-[#111827] rounded-lg text-xs flex items-center gap-1.5 transition-all outline-none cursor-pointer"
            title="Refresh integration config links metadata"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
            <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider hidden md:inline">Check Services</span>
          </button>
        </div>
      </header>

      {/* Main Core View Area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Modern Sidebar Navigation */}
        <aside id="pipeline-sidebar-panel" className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#111827]/80 p-5 flex flex-col gap-6 shrink-0 justify-between">
          <div className="space-y-6">
            
            {/* Sidebar title */}
            <div>
              <p className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-2">Workspace Navigation</p>
              <h2 className="text-xs text-slate-450 leading-relaxed font-sans">Toggle sheets, registers, and dispatch networks using standard tabs:</h2>
            </div>

            {/* Links and interactive buttons */}
            <nav className="space-y-1.5">
              
              {/* Tab 1: Dashboard Summary */}
              <button
                onClick={() => { setActiveSection('dashboard'); setSelectedTenantId(null); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-sans text-xs group cursor-pointer ${
                  activeSection === 'dashboard' 
                    ? 'bg-indigo-600 text-white font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className={`w-4 h-4 ${activeSection === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span>Dashboard Summary</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === 'dashboard' ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-60 translate-x-0'}`} />
              </button>

              {/* Tab 2: Tenant Registry */}
              <button
                onClick={() => { setActiveSection('tenants'); setSelectedTenantId(null); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-sans text-xs group cursor-pointer ${
                  activeSection === 'tenants' 
                    ? 'bg-indigo-600 text-white font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${activeSection === 'tenants' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span>Tenant Directory</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-mono px-1.5 rounded font-bold ${activeSection === 'tenants' ? 'bg-indigo-700 text-indigo-200' : 'bg-[#0B0E14] text-slate-400'}`}>
                    {contacts.length}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === 'tenants' ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-60 translate-x-0'}`} />
                </div>
              </button>

              {/* Tab 3: Onboard Form */}
              <button
                onClick={() => { setActiveSection('onboard'); setSelectedTenantId(null); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-sans text-xs group cursor-pointer ${
                  activeSection === 'onboard' 
                    ? 'bg-indigo-600 text-white font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className={`w-4 h-4 ${activeSection === 'onboard' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span>Add/Assign Tenant</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === 'onboard' ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-60 translate-x-0'}`} />
              </button>

              {/* Tab 4: SMS Communicator */}
              <button
                onClick={() => setActiveSection('sms')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-sans text-xs group cursor-pointer ${
                  activeSection === 'sms' 
                    ? 'bg-indigo-600 text-white font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className={`w-4 h-4 ${activeSection === 'sms' ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span>SMS Communications</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === 'sms' ? 'translate-x-0.5 opacity-100' : 'opacity-0 group-hover:opacity-60 translate-x-0'}`} />
              </button>

            </nav>
          </div>

          {/* Sidebar Account Indicator Footer (Non technical) */}
          <div className="pt-4 border-t border-slate-800 shrink-0 font-sans mt-8 lg:mt-0">
            <span className="text-[10px] text-slate-500 block">Operator Signed In:</span>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-mono font-bold">👤</div>
              <span className="text-[11px] text-slate-350 font-bold truncate">davidkyali20@gmail.com</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Panel Content Stage */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#0B0E14] min-h-0">
          
          {/* Render Dashboard Summary */}
          {activeSection === 'dashboard' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Portfolio Dashboard</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live aggregated rental income, payment status, and vacancy rate statistics</p>
              </div>
              <DashboardSummary
                contacts={contacts}
                availableUnits={AVAILABLE_UNITS}
                onNavigateToSmsWithTenant={handleNavigateToSms}
                onNavigateToSmsBulk={handleNavigateToSmsBulk}
              />
            </div>
          )}

          {/* Render Tenant Registry Directory */}
          {activeSection === 'tenants' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Tenants Directory</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Active leases and current balances on-file</p>
              </div>
              <TenantDirectory
                contacts={contacts}
                onDeleteTenant={handleDeleteTenant}
                onNavigateToSms={handleNavigateToSms}
                onUpdateTenantBalance={handleUpdateTenantBalance}
              />
            </div>
          )}

          {/* Render Onboard Form */}
          {activeSection === 'onboard' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Add/Assign Tenant</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Initialize fresh contracts, set rental tariffs, and select vacant items</p>
              </div>
              <AddTenantForm
                contacts={contacts}
                availableUnits={AVAILABLE_UNITS}
                onAddTenant={handleAddTenant}
              />
            </div>
          )}

          {/* Render Communications Hub */}
          {activeSection === 'sms' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">SMS Communications</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">Draft custom messages, leverage AI templates, and trigger Twilio broadcasts</p>
              </div>
              <SmsPanel
                contacts={contacts}
                smsLogs={smsLogs}
                selectedTenantId={selectedTenantId}
                onClearSelectedTenant={() => setSelectedTenantId(null)}
                onSendSms={handleSendSms}
                suggestSmsText={handleSuggestSms}
                configuredStatus={configuredStatus}
              />
            </div>
          )}

        </main>

      </div>
      
    </div>
  );
}
