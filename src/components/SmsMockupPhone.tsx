/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Smartphone, Wifi, Battery, ChevronLeft, ShieldAlert } from 'lucide-react';

interface SmsMockupPhoneProps {
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  provider: 'twilio' | 'africastalking' | 'simulator';
  simulatingDelivery: boolean;
}

export const SmsMockupPhone: React.FC<SmsMockupPhoneProps> = ({
  recipientName,
  recipientPhone,
  messageText,
  provider,
  simulatingDelivery,
}) => {
  // Simple time generator for phone status bar
  const formatTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getProviderLabel = () => {
    switch (provider) {
      case 'twilio':
        return 'via Twilio Network';
      case 'africastalking':
        return "via Africa's Talking Network";
      default:
        return 'via SMS Simulator';
    }
  };

  const hasContent = messageText.trim().length > 0;

  return (
    <div id="sms-mockup-phone-section" className="flex flex-col items-center">
      <div className="w-full text-center mb-3">
        <h4 className="font-sans font-semibold text-gray-800 text-xs uppercase tracking-wider">Device Mockup Preview</h4>
        <p className="text-[10px] text-gray-500 mt-0.5">Real-time smartphone composition viewport</p>
      </div>

      {/* Styled Smartphone Device Frame */}
      <div id="viewport-phone-wrapper" className="relative w-[280px] h-[540px] rounded-[38px] border-[8px] border-slate-900 bg-slate-100 shadow-xl overflow-hidden flex flex-col font-sans select-none">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 absolute right-3"></div>
        </div>

        {/* Top Status Indicators */}
        <div className="bg-slate-900 text-white text-[10px] px-5 pt-7 pb-2 flex justify-between items-center z-10 font-sans tracking-tight">
          <span className="font-semibold">{formatTime()}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] opacity-75">{getProviderLabel()}</span>
            <Wifi className="w-2.5 h-2.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Messaging App Header */}
        <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2 z-10 shadow-sm">
          <ChevronLeft className="w-4 h-4 text-indigo-600 cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-700">
            {recipientName ? recipientName.slice(0, 2).toUpperCase() : 'B'}
          </div>
          <div className="overflow-hidden leading-tight">
            <h5 className="font-sans font-semibold text-gray-900 text-xs truncate">
              {recipientName || 'Select/Enter Contact'}
            </h5>
            <p className="text-[9px] text-gray-400 truncate mt-0.5">
              {recipientPhone || '+254 XXX XXXXXX'}
            </p>
          </div>
        </div>

        {/* Contact Status Ribbon */}
        <div className="bg-slate-50 border-b border-gray-100 px-3 py-1 font-mono text-[8px] text-gray-500 flex justify-between items-center">
          <span>Routing: <span className="font-bold text-indigo-600 uppercase">{provider}</span></span>
          <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></div> Idle Terminal</span>
        </div>

        {/* Simulated Phone Messaging Thread Screen */}
        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto flex flex-col justify-end gap-3.5 relative">
          
          {/* Welcome/Guidance Bubble */}
          <div className="text-center my-auto px-4 text-gray-400">
            {!hasContent && (
              <div className="space-y-2 py-4">
                <Smartphone className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
                <p className="text-[10px] leading-relaxed">
                  Start drafting a campaign or text block. What you type in the SMS composer window will render immediately here!
                </p>
              </div>
            )}
          </div>

          {/* Delivery Simulation Floating Overlay */}
          {simulatingDelivery && (
            <div className="absolute inset-0 bg-white/80 z-25 flex flex-col justify-center items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="text-center font-sans">
                <p className="font-semibold text-xs text-gray-900">Broadcasting SMS...</p>
                <p className="text-[9px] text-gray-500 mt-1">Initiating GSM Uplink Protocol</p>
              </div>
            </div>
          )}

          {/* Incoming Message Bubble */}
          {hasContent && (
            <div className="flex flex-col gap-1 items-end max-w-[85%] self-end">
              <div className="bg-indigo-600 text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-none shadow-sm leading-relaxed tracking-normal font-sans break-words text-left">
                {messageText}
              </div>
              <span className="text-[8px] text-gray-400 mr-1.5 flex items-center gap-1 font-mono">
                {getProviderLabel()} • Just Now
              </span>
            </div>
          )}

          {/* Small placeholder footer like real screen */}
          <div className="text-center text-[9px] text-gray-300 border-t border-gray-100/50 pt-2 font-mono">
            ••• Encrypted Broadcast •••
          </div>
        </div>

        {/* Bottom Typing Bar Mockup */}
        <div className="bg-white px-3 py-2.5 border-t border-gray-100 flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 flex items-center justify-between">
            <input 
              type="text" 
              placeholder="iMessage / SMS thread" 
              disabled 
              className="bg-transparent text-[11px] text-gray-800 outline-none w-full"
            />
          </div>
          <button disabled className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-400 font-bold text-xs flex items-center justify-center">
            Send
          </button>
        </div>

        {/* iOS style home indicator bar */}
        <div className="bg-white pb-2 pt-1 flex justify-center">
          <div className="w-24 h-1 bg-slate-800 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
