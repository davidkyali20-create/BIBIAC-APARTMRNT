import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Smartphone, CheckCircle, AlertTriangle, MessageSquare, RefreshCw, Key } from 'lucide-react';
import { Contact, SmsLog, ProviderConfigStatus } from '../types';
import { SmsMockupPhone } from './SmsMockupPhone';

interface SmsPanelProps {
  contacts: Contact[];
  smsLogs: SmsLog[];
  selectedTenantId: string | null;
  onClearSelectedTenant: () => void;
  onSendSms: (recipientName: string, recipientPhone: string, message: string, channel: 'twilio' | 'simulator') => Promise<boolean>;
  suggestSmsText: (prompt: string, tone: string) => Promise<string | null>;
  configuredStatus: ProviderConfigStatus;
}

export const SmsPanel: React.FC<SmsPanelProps> = ({
  contacts,
  smsLogs,
  selectedTenantId,
  onClearSelectedTenant,
  onSendSms,
  suggestSmsText,
  configuredStatus,
}) => {
  // Navigation internal types
  const [recipientMode, setRecipientMode] = useState<'saved' | 'manual'>('saved');
  
  // Custom manual recipients
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // Selected saved tenant ID
  const [tenantId, setTenantId] = useState('');

  // Core message content
  const [messageText, setMessageText] = useState('');

  // Delivery settings
  const [channel, setChannel] = useState<'twilio' | 'simulator'>('simulator');
  
  // Copilot assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('Friendly');
  const [drafting, setDrafting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Submission feedback
  const [sending, setSending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<{ success: boolean; text: string } | null>(null);

  // Auto-sync when preselected tenant triggers from directory
  useEffect(() => {
    if (selectedTenantId) {
      setRecipientMode('saved');
      setTenantId(selectedTenantId);
    }
  }, [selectedTenantId]);

  // Compute selected tenant details
  const activeTenant = contacts.find(c => c.id === tenantId);

  // Sync back state changes for the phone mockup
  const currentRecipientName = recipientMode === 'saved' 
    ? (activeTenant ? activeTenant.name : 'Choose Tenant') 
    : (manualName || 'Manual Recipient');

  const currentRecipientPhone = recipientMode === 'saved' 
    ? (activeTenant ? activeTenant.phone : '') 
    : (manualPhone || '');

  // Presets designed for property managers
  const PRESET_TEMPLATES = [
    {
      label: '📅 Rent Due Reminder',
      text: (t: Contact | undefined) => {
        const name = t ? t.name.split(' ')[0] : 'Resident';
        const unit = t ? t.group : '[Unit]';
        const balance = t ? t.balance : '0';
        return `Dear ${name}, your monthly rent schedule of Ksh ${t?.rentAmount || '25,000'} for Unit ${unit} is due. Current balance is Ksh ${balance}. Please settle by the 1st. Thank you!`;
      }
    },
    {
      label: '🧾 Payment Confirmation',
      text: (t: Contact | undefined) => {
        const name = t ? t.name.split(' ')[0] : 'Resident';
        const unit = t ? t.group : '[Unit]';
        return `Payment Acknowledged: Hi ${name}, we have successfully received your rent payment for Unit ${unit}. Your account balance is settled. Enjoy your home!`;
      }
    },
    {
      label: '🛠️ Building Maintenance',
      text: (t: Contact | undefined) => {
        const unit = t ? t.group : 'your unit';
        return `Advisory Notice: Standard building maintenance is scheduled for tomorrow between 9 AM and 1 PM. Team members will access Unit ${unit}. Contact us any time.`;
      }
    }
  ];

  const handleApplyPreset = (presetTextFunc: (t: Contact | undefined) => string) => {
    setDeliveryStatus(null);
    setMessageText(presetTextFunc(activeTenant));
  };

  const handleAiDraftSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setDrafting(true);
    setAiError('');
    setDeliveryStatus(null);

    // Formulate a robust prompt to represent tenant data
    let tenantContext = '';
    if (activeTenant) {
      tenantContext = ` to tenant ${activeTenant.name} living in Unit ${activeTenant.group} who has a rent balance of Ksh ${activeTenant.balance} on a monthly rate of Ksh ${activeTenant.rentAmount}`;
    }

    const compiledPrompt = `${aiPrompt}${tenantContext}`;

    try {
      const suggestion = await suggestSmsText(compiledPrompt, aiTone);
      if (suggestion) {
        setMessageText(suggestion);
        setAiPrompt('');
      } else {
        setAiError('Could not connect to AI Copilot. Check if your AI credentials are set.');
      }
    } catch (err) {
      setAiError('Connection failure invoking AI assistant.');
    } finally {
      setDrafting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryStatus(null);

    let targetName = '';
    let targetPhone = '';

    if (recipientMode === 'saved') {
      if (!activeTenant) {
        setDeliveryStatus({ success: false, text: 'Please select a tenant from the directory selection.' });
        return;
      }
      targetName = activeTenant.name;
      targetPhone = activeTenant.phone;
    } else {
      if (!manualPhone.trim()) {
        setDeliveryStatus({ success: false, text: 'Please specified a valid mobile phone number.' });
        return;
      }
      targetName = manualName.trim() || 'Custom Contact';
      targetPhone = manualPhone.trim();
    }

    if (!messageText.trim()) {
      setDeliveryStatus({ success: false, text: 'Please write or generate your notification message text.' });
      return;
    }

    setSending(true);
    try {
      const outcome = await onSendSms(targetName, targetPhone, messageText, channel);
      if (outcome) {
        setDeliveryStatus({ 
          success: true, 
          text: `Lease notification successfully transmitted. Status: DELIVERED (${channel === 'twilio' ? 'via Twilio live route' : 'Simulated Sandbox Delivery'})` 
        });
        setMessageText(''); // clear on success
      } else {
        setDeliveryStatus({ 
          success: false, 
          text: `Message dispatch failed. Please verify carrier credentials if using hard cellular networks.` 
        });
      }
    } catch (err) {
      setDeliveryStatus({ success: false, text: 'Unexpected error forwarding message channel.' });
    } finally {
      setSending(false);
    }
  };

  const clearDirectSelection = () => {
    onClearSelectedTenant();
    setTenantId('');
    setDeliveryStatus(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Column: Form Controls (Col Span 7) */}
      <div className="lg:col-span-7 space-y-5">
        
        {/* Connection Mode Alert banner */}
        {!configuredStatus.twilioConfigured && channel === 'twilio' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl flex items-center gap-2.5 leading-relaxed font-sans">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Twilio Credentials Not Connected</span>: Since live API secret keys are missing, messages sent through Twilio will trigger an error. Toggle to <strong className="underline">Simulated Network</strong> below to test live deliveries!
            </div>
          </div>
        )}

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-sans font-bold text-slate-100 text-base">SMS Communications Hub</h3>
              <p className="text-xs text-slate-400 mt-0.5">Send high-delivery lease notifications, rent receipts, or event alerts</p>
            </div>
            
            {/* Connection Channel state badges */}
            <div className="flex gap-2">
              <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${configuredStatus.twilioConfigured ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800/50 text-slate-500 border-slate-700'}`}>
                Twilio: {configuredStatus.twilioConfigured ? 'LIVE' : 'UNCONFIGURED'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4 font-sans">
            
            {/* Feedback Alerts */}
            {deliveryStatus && (
              <div className={`p-3.5 rounded-lg text-xs leading-normal flex items-start gap-2.5 border ${
                deliveryStatus.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {deliveryStatus.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{deliveryStatus.text}</span>
              </div>
            )}

            {/* Recipient Mode Selectors */}
            <div>
              <div className="flex justify-between items-center mb-1.5Packed">
                <label className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Recipient</label>
                {selectedTenantId && (
                  <button 
                    type="button" 
                    onClick={clearDirectSelection}
                    className="text-[10px] text-red-400 hover:text-red-300 font-mono underline"
                  >
                    Clear direct focus focus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 bg-[#0B0E14] p-1 rounded-lg border border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => { setRecipientMode('saved'); setDeliveryStatus(null); }}
                  className={`py-1.5 text-xs font-semibold rounded-md uppercase tracking-wider transition-all cursor-pointer ${recipientMode === 'saved' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Saved Tenant List
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipientMode('manual'); setDeliveryStatus(null); }}
                  className={`py-1.5 text-xs font-semibold rounded-md uppercase tracking-wider transition-all cursor-pointer ${recipientMode === 'manual' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Manual Number Entry
                </button>
              </div>
            </div>

            {/* Recipients Conditional Fields */}
            {recipientMode === 'saved' ? (
              <div className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-xl">
                {contacts.length === 0 ? (
                  <p className="text-xs text-amber-500 italic text-center py-2">No active tenants registered. Onboard a tenant in the Add/Assign tab first!</p>
                ) : (
                  <div>
                    <select
                      value={tenantId}
                      onChange={(e) => { setTenantId(e.target.value); setDeliveryStatus(null); }}
                      className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Tenant (Name • Unit) --</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Unit {c.group}) • Balance Due: ${c.balance}
                        </option>
                      ))}
                    </select>
                    {activeTenant && (
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-indigo-950/20 px-3 py-1.5 rounded border border-indigo-500/20 font-mono">
                        <span>Phone: {activeTenant.phone}</span>
                        <span>Rent amount: ${activeTenant.rentAmount}/mo</span>
                        <span className={activeTenant.balance > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          Arrears: ${activeTenant.balance}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Recipient name (optional)"
                    value={manualName}
                    onChange={(e) => { setManualName(e.target.value); setDeliveryStatus(null); }}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Recipient phone (e.g. +254...)"
                    value={manualPhone}
                    onChange={(e) => { setManualPhone(e.target.value); setDeliveryStatus(null); }}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-slate-600"
                  />
                </div>
              </div>
            )}

            {/* Quick Presets */}
            {recipientMode === 'saved' && (
              <div>
                <span className="block text-[10.5px] font-mono font-bold text-slate-500 uppercase mb-1.5">Apply Standard Templates:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(tmpl.text)}
                      className="text-[10px] bg-[#0B0E14] hover:bg-slate-800 border border-[#1E293B] text-slate-300 rounded-md px-2.5 py-1 font-mono transition-colors cursor-pointer"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Body Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Message Content</label>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                  {messageText.length} characters / {messageText.length <= 160 ? '1 part' : `${Math.ceil(messageText.length / 160)} parts`}
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={450}
                placeholder="Type your notification description here or use the professional presets / AI Co-pilot..."
                value={messageText}
                onChange={(e) => { setMessageText(e.target.value); setDeliveryStatus(null); }}
                className="w-full bg-[#0B0E14] border border-[#1E293B] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Select Channel Route */}
            <div>
              <label className="text-[10.5px] font-mono font-bold text-slate-450 uppercase tracking-wider block mb-2">Delivery Channels Configuration</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                <label className={`border rounded-xl p-3 flex items-center gap-2.5 cursor-pointer transition-all ${channel === 'simulator' ? 'border-emerald-500/50 bg-emerald-500/5 text-white' : 'border-[#1E293B] hover:bg-[#0B0E14] text-slate-400'}`}>
                  <input
                    type="radio"
                    name="network-channel-select"
                    value="simulator"
                    checked={channel === 'simulator'}
                    onChange={() => { setChannel('simulator'); setDeliveryStatus(null); }}
                    className="accent-emerald-500 h-3.5 w-3.5"
                  />
                  <div>
                    <span className="font-bold text-xs uppercase leading-none block text-slate-200">Simulated Network</span>
                    <span className="text-[10px] text-slate-550 leading-tight block mt-1">Instant dashboard test previews (Free sandbox)</span>
                  </div>
                </label>

                <label className={`border rounded-xl p-3 flex items-center gap-2.5 cursor-pointer transition-all ${channel === 'twilio' ? 'border-indigo-500/50 bg-indigo-500/5 text-white' : 'border-[#1E293B] hover:bg-[#0B0E14] text-slate-400'} ${!configuredStatus.twilioConfigured ? 'opacity-65' : ''}`}>
                  <input
                    type="radio"
                    name="network-channel-select"
                    value="twilio"
                    checked={channel === 'twilio'}
                    onChange={() => { setChannel('twilio'); setDeliveryStatus(null); }}
                    className="accent-indigo-500 h-3.5 w-3.5"
                  />
                  <div>
                    <span className="font-bold text-xs uppercase leading-none block text-slate-200 flex items-center gap-1">
                      Twilio Live Route {!configuredStatus.twilioConfigured && '⚠️'}
                    </span>
                    <span className="text-[10px] text-slate-550 leading-tight block mt-1">Connects actual carriers using environment key overrides</span>
                  </div>
                </label>

              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-sans font-bold py-3 rounded-lg text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Broadcasting Lease Alert...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Dispatch SMS Notification
                </>
              )}
            </button>

          </form>
        </div>

        {/* AI Co-pilot Drawer */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="font-sans font-bold text-white text-xs uppercase tracking-wider">AI Communication Assistant</h4>
            <span className="text-[9px] font-mono bg-purple-500/15 text-purple-400 px-1.5 rounded uppercase">Gemini-3.5</span>
          </div>

          <form onSubmit={handleAiDraftSms} className="space-y-3 font-sans">
            {aiError && (
              <p className="text-[11px] text-red-400 font-mono italic bg-red-500/5 border border-red-500/15 p-2 rounded">{aiError}</p>
            )}
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Describe in natural words what you wish to communicate, select a tone, and Gemini will engineer an optimized 160-character SMS copy incorporating any active tenant details.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Warning to clear water trash pile outside balcony door before inspection..."
                className="flex-1 bg-[#0B0E14] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="bg-[#0B0E14] border border-[#1E293B] rounded-lg px-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Friendly">Friendly</option>
                <option value="Firm">Firm</option>
                <option value="Urgent">Urgent</option>
                <option value="Celebratory">Celebratory</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={drafting || !aiPrompt.trim()}
              className="w-full bg-purple-950/40 hover:bg-purple-900 border border-purple-800/40 hover:border-purple-500 text-purple-300 font-sans font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {drafting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Drafting professional copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Draft with AI Co-pilot
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Device phone mockup viewer (Col Span 5) */}
      <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-5 xl:col-start-8 xl:fixed xl:right-8 xl:top-28 xl:w-[320px] z-10">
        
        {/* Render Device Mockup */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 shadow-lg flex justify-center items-center">
          <SmsMockupPhone
            recipientName={currentRecipientName}
            recipientPhone={currentRecipientPhone}
            messageText={messageText}
            provider={channel === 'twilio' ? 'twilio' : 'simulator'}
            simulatingDelivery={sending}
          />
        </div>

        {/* Dynamic logs of communications in-app */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 shadow-lg flex flex-col max-h-[220px]">
          <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block mb-2.5">Outbox Delivery History Logs</span>
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[160px] pr-1">
            {smsLogs.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic font-sans py-3 text-center">No messages sent in this session yet.</p>
            ) : (
              smsLogs.map((log) => (
                <div key={log.id} className="bg-[#0B0E14] border border-[#1E293B] p-2.5 rounded-lg text-[10.5px] leading-relaxed">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white shrink-0">{log.recipientName}</span>
                    <span className={`text-[9px] font-bold px-1 py-0.2 rounded font-mono uppercase shrink-0 ${
                      log.status === 'delivered' || log.status === 'sent' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {log.status === 'delivered' || log.status === 'sent' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <p className="text-slate-400 break-words">{log.message}</p>
                  <div className="text-[9px] text-slate-600 mt-1 flex justify-between font-mono">
                    <span>{log.recipientPhone} via {log.provider}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
