/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Send, Sparkles, UserCheck, Keyboard, Check, AlertTriangle } from 'lucide-react';
import { Contact, SmsLog, ProviderConfigStatus } from '../types';

interface SmsComposerProps {
  contacts: Contact[];
  onSmsSent: (logs: SmsLog[]) => void;
  configuredStatus: ProviderConfigStatus;
  onActiveRecipientChange: (name: string, phone: string, text: string, provider: 'twilio' | 'africastalking' | 'simulator') => void;
}

export const SmsComposer: React.FC<SmsComposerProps> = ({
  contacts,
  onSmsSent,
  configuredStatus,
  onActiveRecipientChange,
}) => {
  // Sending & gateway states
  const [provider, setProvider] = useState<'twilio' | 'africastalking' | 'simulator'>('simulator');
  const [targetType, setTargetType] = useState<'individual' | 'group' | 'manual'>('manual');
  
  // Recipients states
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  // Message states
  const [message, setMessage] = useState('');
  
  // Gemini states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<string>('Professional');
  const [drafting, setDrafting] = useState(false);
  const [aiError, setAiError] = useState('');

  // Bulk submission states
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Group listings computed from contacts list
  const groupsList = Array.from(new Set(contacts.map(c => c.group).filter(Boolean)));

  // Real-time character counter math (standard SMS length is 160 characters)
  const charCount = message.length;
  const numSegments = charCount === 0 ? 0 : Math.ceil(charCount / 160);

  // Synchronize state changes to update the mockup phone immediately
  useEffect(() => {
    let name = 'Selected Recipient';
    let phone = 'No Phone Number';

    if (targetType === 'manual') {
      name = manualName || 'Manual Recipient';
      phone = manualPhone || 'No Phone';
    } else if (targetType === 'individual') {
      const match = contacts.find(c => c.id === selectedContactId);
      if (match) {
        name = match.name;
        phone = match.phone;
      } else {
        name = 'Select a Contact';
        phone = '---';
      }
    } else if (targetType === 'group') {
      const groupCount = contacts.filter(c => c.group === selectedGroup).length;
      name = `Group: ${selectedGroup || 'Select Group'}`;
      phone = `${groupCount} contacts targeted`;
    }

    onActiveRecipientChange(name, phone, message, provider);
  }, [manualPhone, manualName, selectedContactId, selectedGroup, targetType, message, provider, contacts]);

  // Submit request to Gemini helper route on the Express server
  const handleAiDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setDrafting(true);
    setAiError('');
    try {
      const res = await fetch('/api/gemini/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, tone: aiTone }),
      });

      const data = await res.json();
      if (res.ok && data.suggestion) {
        setMessage(data.suggestion);
        setAiPrompt(''); // clear ai draft prompt
      } else {
        setAiError(data.error || 'Could not draft. Make sure GEMINI_API_KEY is active.');
      }
    } catch (err: any) {
      setAiError('Network error connecting to Gemini assistant.');
    } finally {
      setDrafting(false);
    }
  };

  // Dispatch campaign send request to the Express server route
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessCount(null);

    // Formulate target recipient list
    let targets: { name: string; phone: string }[] = [];

    if (targetType === 'manual') {
      if (!manualPhone.trim()) {
        setErrorMsg('Please specify recipient phone number.');
        return;
      }
      targets = [{ name: manualName || 'Manual Entry', phone: manualPhone }];
    } else if (targetType === 'individual') {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (!contact) {
        setErrorMsg('Please select a valid contact.');
        return;
      }
      targets = [{ name: contact.name, phone: contact.phone }];
    } else if (targetType === 'group') {
      if (!selectedGroup) {
        setErrorMsg('Please select a target group.');
        return;
      }
      targets = contacts
        .filter(c => c.group === selectedGroup)
        .map(c => ({ name: c.name, phone: c.phone }));

      if (targets.length === 0) {
        setErrorMsg('Selected group currently contains zero saved contacts.');
        return;
      }
    }

    if (!message.trim()) {
      setErrorMsg('Message body text cannot be empty.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: targets,
          message,
          provider,
        }),
      });

      const data = await res.json();
      if (res.ok && data.results) {
        onSmsSent(data.results);
        const successes = data.results.filter((resItem: any) => resItem.status !== 'failed').length;
        setSuccessCount(successes);
        
        // Reset message context on success
        setMessage('');
        setManualPhone('');
        setManualName('');
      } else {
        setErrorMsg(data.error || 'Server rejected SMS broadcast campaign request.');
      }
    } catch (err: any) {
      setErrorMsg('Network anomaly occurred during gateway transmission proxy.');
    } finally {
      setSending(false);
    }
  };

  // Helper template inserters
  const insertTemplateText = (text: string) => {
    setMessage(text);
  };

  const isProviderConfigured = () => {
    if (provider === 'twilio') return configuredStatus.twilioConfigured;
    if (provider === 'africastalking') return configuredStatus.africasTalkingConfigured;
    return true; // simulator is always configured
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1: COMPOSER ACTION BOX */}
      <div id="sms-composer-panel" className="bg-[#111827] rounded border border-[#1E293B] p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard className="w-4 h-4 text-emerald-400" />
          <h2 className="font-mono font-bold text-emerald-400 text-xs uppercase tracking-widest">04 / Interactive SMS Broadcaster</h2>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-3.5">
          {/* Target Audience Tabs */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Target Recipients</label>
            <div className="grid grid-cols-3 gap-1 bg-[#0B0E14] p-1 rounded border border-[#1E293B]">
              <button
                id="tab-recv-manual"
                type="button"
                onClick={() => setTargetType('manual')}
                className={`py-1 text-[11px] font-mono uppercase font-semibold rounded transition-all ${targetType === 'manual' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Manual Entry
              </button>
              <button
                id="tab-recv-saved"
                type="button"
                onClick={() => setTargetType('individual')}
                className={`py-1 text-[11px] font-mono uppercase font-semibold rounded transition-all ${targetType === 'individual' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Saved Contact
              </button>
              <button
                id="tab-recv-group"
                type="button"
                onClick={() => setTargetType('group')}
                className={`py-1 text-[11px] font-mono uppercase font-semibold rounded transition-all ${targetType === 'group' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Bulk Group
              </button>
            </div>
          </div>

          {/* Conditional Target Input Nodes */}
          <div className="p-3 bg-[#0B0E14] border border-[#1E293B] rounded">
            {targetType === 'manual' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Recipient Name</label>
                  <input
                    id="input-manual-name"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    id="input-manual-phone"
                    type="tel"
                    placeholder="e.g. +254712345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}

            {targetType === 'individual' && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Choose Saved Recipient</label>
                {contacts.length === 0 ? (
                  <p className="text-[11px] text-amber-500 italic font-mono">No contacts registered. Register contacts in the local store first!</p>
                ) : (
                  <select
                    id="select-saved-contact"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="" className="bg-[#111827] text-white">-- Choose Contact --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#111827] text-white">
                        {c.name} ({c.phone}) [{c.group || 'No Group'}]
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {targetType === 'group' && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Select Segment/Group</label>
                {groupsList.length === 0 ? (
                  <p className="text-[11px] text-amber-500 italic font-mono">No segments exist. Add group tags to your contacts below!</p>
                ) : (
                  <select
                    id="select-target-group"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1E293B] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="" className="bg-[#111827] text-white">-- Select Segment --</option>
                    {groupsList.map(g => {
                      const count = contacts.filter(c => c.group === g).length;
                      return (
                        <option key={g} value={g} className="bg-[#111827] text-white">
                          {g} ({count} subscribers)
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* SMS Body */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">SMS Campaign Message</label>
              <div id="sms-limits-label" className="text-[10px] font-mono text-slate-400 flex gap-2">
                <span>{charCount} chars</span>
                <span className={numSegments > 1 ? 'text-amber-500 font-bold' : 'text-emerald-400'}>
                  {numSegments} {numSegments > 1 ? 'parts' : 'part'}
                </span>
              </div>
            </div>
            <textarea
              id="txt-sms-body"
              rows={3}
              maxLength={480}
              placeholder="Type your alert message here... Or use the AI helper below to compose an optimized template."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#1E293B] rounded p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed font-mono"
            />
            {charCount > 160 && (
              <p className="text-[10px] text-amber-500 font-mono mt-0.5">
                ⚠️ Carrier splits content into {numSegments} billing segments.
              </p>
            )}
          </div>

          {/* Preset templates Quick Insertion tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[9px] font-mono text-slate-500 tracking-wider shrink-0 uppercase">Presets:</span>
            {[
              { label: '⚠️ System Alert', text: 'URGENT: Periodic system maintenance is scheduled on Sunday, May 24th from 2AM to 5AM UTC. Some systems will be offline.' },
              { label: '📅 Clinic Visit', text: 'Reminder: You have a scheduled appointment tomorrow at 10:00 AM at BIBIAC Clinic. Reply to confirm or reschedule.' },
              { label: '📦 Delivery Update', text: 'Hi, your BIBIAC order #82924 has been processed and is out for delivery. Track details at system portal.' },
            ].map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertTemplateText(tmpl.text)}
                className="text-[9px] font-mono border border-[#1E293B] bg-[#0B0E14] hover:bg-emerald-550/10 hover:border-emerald-500/30 text-slate-300 rounded px-2 py-0.5 transition-colors whitespace-nowrap"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          {/* Route Config Gateways */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">SMS Transport Gateway</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className={`border rounded p-2 flex items-center gap-2 cursor-pointer transition-all ${provider === 'simulator' ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-[#1E293B] hover:bg-[#0B0E14] text-slate-400'}`}>
                <input
                  type="radio"
                  name="sms-provider-group"
                  value="simulator"
                  checked={provider === 'simulator'}
                  onChange={() => setProvider('simulator')}
                  className="accent-emerald-500 h-3 w-3"
                />
                <div className="leading-tight">
                  <p className="font-mono font-bold text-[10px] uppercase">SMS Simulator</p>
                  <p className="text-[9px] text-slate-500">Free sandbox routing</p>
                </div>
              </label>

              <label className={`border rounded p-2 flex items-center gap-2 cursor-pointer transition-all ${provider === 'twilio' ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-[#1E293B] hover:bg-[#0B0E14] text-slate-400'} ${!configuredStatus.twilioConfigured ? 'opacity-50' : ''}`}>
                <input
                  type="radio"
                  name="sms-provider-group"
                  value="twilio"
                  checked={provider === 'twilio'}
                  onChange={() => setProvider('twilio')}
                  className="accent-emerald-500 h-3 w-3"
                />
                <div className="leading-tight">
                  <p className="font-mono font-bold text-[10px] uppercase flex items-center gap-1">
                    Twilio {!configuredStatus.twilioConfigured && '⚠️'}
                  </p>
                  <p className="text-[9px] text-slate-500">Global delivery hook</p>
                </div>
              </label>

              <label className={`border rounded p-2 flex items-center gap-2 cursor-pointer transition-all ${provider === 'africastalking' ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-[#1E293B] hover:bg-[#0B0E14] text-slate-400'} ${!configuredStatus.africasTalkingConfigured ? 'opacity-50' : ''}`}>
                <input
                  type="radio"
                  name="sms-provider-group"
                  value="africastalking"
                  checked={provider === 'africastalking'}
                  onChange={() => setProvider('africastalking')}
                  className="accent-emerald-500 h-3 w-3"
                />
                <div className="leading-tight">
                  <p className="font-mono font-bold text-[10px] uppercase flex items-center gap-1">
                    Africa's Talk {!configuredStatus.africasTalkingConfigured && '⚠️'}
                  </p>
                  <p className="text-[9px] text-slate-500">Continental gateway</p>
                </div>
              </label>
            </div>

            {/* Warning if credentials absent */}
            {!isProviderConfigured() && (
              <div className="mt-2 bg-amber-950/20 border border-amber-900/50 rounded p-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-400 leading-normal font-mono">
                  <strong className="font-bold">GATEWAY LOCKED:</strong> No active credentials in Secrets Panel on left bar. Use **SMS Simulator** or insert variables.
                </p>
              </div>
            )}
          </div>

          {/* Action button triggers loading send states */}
          <div className="pt-1 flex flex-col gap-2">
            <button
              id="btn-broadcast-sms"
              type="submit"
              disabled={sending || (!isProviderConfigured() && provider !== 'simulator')}
              className={`w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold font-mono uppercase tracking-widest rounded transition-all cursor-pointer ${
                sending ? 'opacity-50 cursor-wait' : ''
              }`}
            >
              <Send className="w-3.5 h-3.5 inline mr-1.5" />
              {sending ? 'Broadcasting SMS...' : 'Broadcast Notification Campaign'}
            </button>

            {/* Local status feedback messages */}
            {errorMsg && (
              <div id="error-alert-box" className="p-2.5 bg-red-950/30 border border-red-900/50 rounded text-[11px] text-red-400 leading-relaxed font-mono">
                ❌ FAIL // {errorMsg}
              </div>
            )}

            {successCount !== null && (
              <div id="success-alert-box" className="p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                SUCCESS // Campaign processed for {successCount} subscribers!
              </div>
            )}
          </div>
        </form>
      </div>

      {/* SECTION 2: SMART SUGGEST ACCORDION WRAPPED IN THEME */}
      {configuredStatus.geminiConfigured && (
        <div id="gemini-smart-copilot" className="bg-[#111827] border border-[#1E293B] rounded p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <h3 className="font-mono font-bold text-purple-400 text-xs uppercase tracking-widest">AI Copywriting Assistant (Gemini)</h3>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal font-mono">
            Explain the intent of your notification project, select a tone, and let Gemini generate an optimized 160-char alert text block.
          </p>

          <form onSubmit={handleAiDraft} className="space-y-2.5">
            <div className="flex gap-2">
              <input
                id="input-ai-prompt"
                type="text"
                placeholder="e.g. alert clients that clinic will close early tomorrow"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-[#0B0E14] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-purple-500 font-mono"
              />
              <select
                id="select-ai-tone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="bg-[#0B0E14] border border-[#1E293B] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="Professional" className="bg-[#111827]">💼 Professional</option>
                <option value="Alert/Urgent" className="bg-[#111827]">🚨 Urgent</option>
                <option value="Promotional/Exciting" className="bg-[#111827]">💎 Promo</option>
                <option value="Casual/Friendly" className="bg-[#111827]">🤝 Friendly</option>
              </select>
            </div>

            <button
              id="btn-ai-compose"
              type="submit"
              disabled={drafting || !aiPrompt.trim()}
              className="w-full py-1.5 bg-purple-900 border border-purple-800 hover:bg-purple-800 text-white text-[10px] font-bold font-mono uppercase tracking-widest rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {drafting ? 'Composing...' : 'Rewrite with Gemini Flash'}
            </button>

            {aiError && (
              <p className="text-[10px] text-red-400 italic bg-red-950/20 border border-red-900/50 p-1.5 rounded font-mono">
                ⚠️ COMPILATION_FAIL: {aiError}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
