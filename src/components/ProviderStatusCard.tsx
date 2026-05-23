/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Settings, Smartphone, Key } from 'lucide-react';
import { ProviderConfigStatus } from '../types';

interface ProviderStatusCardProps {
  status: ProviderConfigStatus;
  loading: boolean;
  onRefresh: () => void;
}

export const ProviderStatusCard: React.FC<ProviderStatusCardProps> = ({
  status,
  loading,
  onRefresh,
}) => {
  return (
    <div id="provider-status-container" className="bg-[#111827] rounded border border-[#1E293B] p-4 flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-mono font-bold text-emerald-400 text-xs uppercase tracking-widest">02 / SMS Gateway Status</h3>
          <p className="text-[10px] text-slate-500 font-mono">Simulated and actual route terminals</p>
        </div>
        <button
          id="btn-refresh-status"
          onClick={onRefresh}
          disabled={loading}
          className="p-1 px-1.5 rounded border border-[#1E293B] bg-[#0B0E14] hover:border-emerald-500/30 text-slate-400 hover:text-white transition-all"
          title="Refresh connection status"
        >
          <Settings className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2.5">
        {/* Simulator - Always Active */}
        <div id="status-row-simulator" className="flex items-center justify-between p-2 rounded bg-emerald-950/25 border border-emerald-900/40 font-mono">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-900/50 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-[10px] leading-tight text-white uppercase">SMS Simulator Terminal</p>
              <p className="text-[9px] text-emerald-400 leading-none mt-0.5">Fully Active • Default Fallback</p>
            </div>
          </div>
          <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
            ● Ready
          </span>
        </div>

        {/* Twilio */}
        <div id="status-row-twilio" className="flex items-center justify-between p-2 rounded bg-[#0B0E14] border border-[#1E293B] font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${status.twilioConfigured ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-850 text-slate-600'}`}>
              <Key className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-[10px] leading-tight text-white uppercase">Twilio Gateway Link</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">
                {status.twilioConfigured ? 'Configured & live' : 'API secrets not loaded'}
              </p>
            </div>
          </div>
          {status.twilioConfigured ? (
            <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
              ● Live
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-slate-800/10 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#1E293B]">
              ○ Silent
            </span>
          )}
        </div>

        {/* Africa's Talking */}
        <div id="status-row-africastalking" className="flex items-center justify-between p-2 rounded bg-[#0B0E14] border border-[#1E293B] font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${status.africasTalkingConfigured ? 'bg-amber-900/50 text-amber-400' : 'bg-slate-850 text-slate-600'}`}>
              <Key className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-[10px] leading-tight text-white uppercase">Africa's Talking Link</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5">
                {status.africasTalkingConfigured ? 'Configured & live' : 'API secrets not loaded'}
              </p>
            </div>
          </div>
          {status.africasTalkingConfigured ? (
            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
              ● Live
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-slate-800/10 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#1E293B]">
              ○ Silent
            </span>
          )}
        </div>

        {/* Gemini Content Assistant */}
        <div id="status-row-gemini" className="flex items-center justify-between p-2 rounded bg-[#0B0E14] border border-[#1E293B] font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded flex items-center justify-center ${status.geminiConfigured ? 'bg-purple-900/50 text-purple-400' : 'bg-slate-850 text-slate-600'}`}>
              <Settings className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-[10px] leading-tight text-white uppercase">Gemini Copywriter Link</p>
              <p className="text-[9px] text-slate-500 leading-none mt-0.5 font-mono">
                {status.geminiConfigured ? 'Suggested drafting ready' : 'Key missing'}
              </p>
            </div>
          </div>
          {status.geminiConfigured ? (
            <span className="flex items-center gap-1 bg-purple-500/10 text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
              ● Active
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-slate-800/10 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#1E293B]">
              ○ Inactive
            </span>
          )}
        </div>
      </div>

      {!status.twilioConfigured && !status.africasTalkingConfigured && (
        <div id="gateway-hint-box" className="mt-3.5 bg-blue-950/20 border border-blue-900/40 rounded p-2.5 font-mono">
          <p className="text-[10px] text-blue-400 leading-relaxed font-bold">
            💡 SIMULATED MODE ENABLED:
          </p>
          <p className="text-[9.5px] text-slate-400 leading-normal mt-0.5">
            Gateways default to simulated broadcast mode. Set environment variables on the left panel "Secrets" list to run physical campaign networks.
          </p>
        </div>
      )}
    </div>
  );
};
