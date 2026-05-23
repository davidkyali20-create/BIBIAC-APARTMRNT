/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Keyboard, 
  Settings, 
  Send, 
  Smartphone, 
  Key, 
  Users, 
  Plus, 
  Trash2, 
  Terminal, 
  Copy, 
  Download, 
  Check, 
  Activity, 
  RefreshCw, 
  HelpCircle, 
  Code2, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { Contact, SmsLog, ProviderConfigStatus } from './types';
import { SmsComposer } from './components/SmsComposer';
import { ProviderStatusCard } from './components/ProviderStatusCard';
import { SmsMockupPhone } from './components/SmsMockupPhone';

// Pre-seeded professional contacts (East African and general test numbers)
const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Saruni Lenolkulal', phone: '+254711223344', group: 'Primary Care', createdAt: '2026-05-23T12:00:00Z' },
  { id: 'c2', name: 'Dennis Kiprop', phone: '+254722334455', group: 'Alert Subscribers', createdAt: '2026-05-23T12:05:00Z' },
  { id: 'c3', name: 'Zahra Welimo', phone: '+254733445566', group: 'Primary Care', createdAt: '2026-05-23T12:10:00Z' },
  { id: 'c4', name: 'Audrey Omwamba', phone: '+254744556677', group: 'Finances', createdAt: '2026-05-23T12:15:00Z' },
];

// Pre-seeded nice initial logs to look highly active and density-packed
const INITIAL_LOGS: SmsLog[] = [
  { 
    id: 'log-1', 
    recipientName: 'Saruni Lenolkulal', 
    recipientPhone: '+254711223344', 
    message: 'System Alert: Maintenance schedule initiated on local hub.', 
    provider: 'simulator', 
    status: 'delivered', 
    timestamp: '2026-05-23T20:45:00Z' 
  },
  { 
    id: 'log-2', 
    recipientName: 'Audrey Omwamba', 
    recipientPhone: '+254744556677', 
    message: 'Billing Update: Standard monthly subscription quota cleared.', 
    provider: 'simulator', 
    status: 'delivered', 
    timestamp: '2026-05-23T21:00:00Z' 
  }
];

export default function App() {
  // Operational state
  const [activeTab, setActiveTab] = useState<'control' | 'workspace'>('control');
  const [sidebarStep, setSidebarStep] = useState<number>(4); // 1 = workspace, 2 = credentials, 3 = installer, 4 = live / executor
  
  // Data State
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('bibiac_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [smsLogs, setSmsLogs] = useState<SmsLog[]>(() => {
    const saved = localStorage.getItem('bibiac_sms_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Providers credential info (Simulates local flask variables + updates real backend if verified)
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('bibiac_credentials');
    return saved ? JSON.parse(saved) : {
      twilioSid: '',
      twilioToken: '',
      twilioNumber: '',
      atUsername: '',
      atApiKey: '',
      atSenderId: ''
    };
  });

  // Active status of real backend deployment credentials
  const [configuredStatus, setConfiguredStatus] = useState<ProviderConfigStatus>({
    twilioConfigured: false,
    africasTalkingConfigured: false,
    geminiConfigured: false,
  });

  const [statusLoading, setStatusLoading] = useState(false);

  // Active phone viewer preview
  const [activeMockup, setActiveMockup] = useState({
    recipientName: 'Select/Enter Contact',
    recipientPhone: '+254 XXX XXXXXX',
    messageText: '',
    provider: 'simulator' as 'twilio' | 'africastalking' | 'simulator',
  });

  const [simulatingPhoneDelivery, setSimulatingPhoneDelivery] = useState(false);

  // New client contact forms
  const [newContact, setNewContact] = useState({ name: '', phone: '', group: 'General' });
  const [searchContactText, setSearchContactText] = useState('');

  // Codes viewer select inside Workspace Box 1
  const [selectedFileCode, setSelectedFileCode] = useState<'app.py' | 'templates/index.html' | 'README.md'>('app.py');
  const [copiedFileIndex, setCopiedFileIndex] = useState(false);

  // Installer log simulation States
  const [installerState, setInstallerState] = useState<'idle' | 'installing' | 'done'>('idle');
  const [installerLogs, setInstallerLogs] = useState<string[]>([
    'Awaiting installation execution trigger...',
  ]);

  // Runtime local server simulator states
  const [runtimeStatus, setRuntimeStatus] = useState<'offline' | 'starting' | 'online'>('offline');
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([
    'Local system daemon inactive. Launch below to review output logs.',
  ]);

  // Set up local files for copying
  const generateAppPyCode = () => {
    return `"""
BIBIAC System - Local Python SMS Gateways Controller
Filename: app.py
Created for: davidkyali20@gmail.com
"""

import os
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# Configured API Credentials (dynamically filled in Bibiac SMS Console)
TWILIO_ACCOUNT_SID = "${credentials.twilioSid || 'TWILIO_ACCOUNT_SID_HERE'}"
TWILIO_AUTH_TOKEN = "${credentials.twilioToken || 'TWILIO_AUTH_TOKEN_HERE'}"
TWILIO_PHONE_NUMBER = "${credentials.twilioNumber || 'TWILIO_PHONE_NUMBER_HERE'}"

AT_USERNAME = "${credentials.atUsername || 'AT_USERNAME_HERE'}"
AT_API_KEY = "${credentials.atApiKey || 'AT_API_KEY_HERE'}"
AT_SENDER_ID = "${credentials.atSenderId || 'AT_SENDER_ID_HERE'}"

@app.route('/')
def home():
    # Direct reference to templates/index.html
    return render_template('index.html')

@app.route('/api/sms/send', methods=['POST'])
def send_sms():
    data = request.get_json() or {}
    recipients = data.get('recipients', [])
    message = data.get('message', '')
    provider = data.get('provider', 'simulator')
    
    results = []
    
    for rec in recipients:
        phone = rec.get('phone', '')
        name = rec.get('name', '')
        
        if not phone:
            continue
            
        if provider == 'twilio':
            if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
                results.append({
                    "recipientName": name,
                    "recipientPhone": phone,
                    "status": "failed",
                    "errorMessage": "Twilio Credentials Missing"
                })
                continue
                
            # Send requests
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
                auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                payload = {
                    "To": phone,
                    "From": TWILIO_PHONE_NUMBER,
                    "Body": message
                }
                res = requests.post(url, auth=auth, data=payload)
                if res.status_code == 201:
                    results.append({"recipientName": name, "recipientPhone": phone, "status": "sent"})
                else:
                    results.append({"recipientName": name, "recipientPhone": phone, "status": "failed", "errorMessage": res.json().get('message', 'HTTP Error')})
            except Exception as e:
                results.append({"recipientName": name, "recipientPhone": phone, "status": "failed", "errorMessage": str(e)})
                
        elif provider == 'africastalking':
            if not AT_USERNAME or not AT_API_KEY:
                results.append({
                    "recipientName": name,
                    "recipientPhone": phone,
                    "status": "failed",
                    "errorMessage": "Africa's Talking Credentials Missing"
                })
                continue
                
            try:
                is_sandbox = AT_USERNAME.lower() == "sandbox"
                url = "https://api.sandbox.africastalking.com/version1/messaging" if is_sandbox else "https://api.africastalking.com/version1/messaging"
                headers = {
                    "apiKey": AT_API_KEY,
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                payload = {
                    "username": AT_USERNAME,
                    "to": phone,
                    "message": message
                }
                if AT_SENDER_ID:
                    payload["from"] = AT_SENDER_ID
                res = requests.post(url, headers=headers, data=payload)
                if res.status_code == 201:
                    results.append({"recipientName": name, "recipientPhone": phone, "status": "sent"})
                else:
                    results.append({"recipientName": name, "recipientPhone": phone, "status": "failed", "errorMessage": res.text})
            except Exception as e:
                results.append({"recipientName": name, "recipientPhone": phone, "status": "failed", "errorMessage": str(e)})
        else:
            # Simulated GSM delivery
            results.append({"recipientName": name, "recipientPhone": phone, "status": "delivered"})
            
    return jsonify({"results": results})

if __name__ == '__main__':
    print("---------------------------------------------")
    print(" BIBIAC Local Gateway Hub Online     ")
    print(" Listening on http://localhost:5000         ")
    print(" Press CTRL+C to close pipeline             ")
    print("---------------------------------------------")
    app.run(host='0.0.0.0', port=5000, debug=True)
`;
  };

  const generateIndexHtmlCode = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BIBIAC local gateway panel</title>
    <!-- Tailwind CSS dynamic import -->
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0B0E14] text-slate-300 font-sans min-h-screen">
    <div class="max-w-4xl mx-auto p-6 space-y-6">
        <header class="border-b border-gray-800 pb-4 flex justify-between items-center">
            <div>
                <h1 class="text-emerald-400 font-mono font-bold tracking-widest text-lg">BIBIAC_LOCAL // SMS REMOTE</h1>
                <p class="text-[11px] text-slate-500 font-mono">Status: CONNECTED TO LOCALHOST:5000</p>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs">LOCAL LINK</span>
        </header>

        <main class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Composer -->
            <section class="bg-[#111827] border border-gray-800 rounded p-5 space-y-4">
                <h2 class="text-emerald-400 font-bold uppercase font-mono text-sm">Send SMS Queue</h2>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-mono mb-1 text-slate-400">Recipient Phone</label>
                        <input id="to-phone" type="text" placeholder="+254711..." class="w-full bg-[#0B0E14] border border-gray-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500">
                    </div>
                    <div>
                        <label class="block text-xs font-mono mb-1 text-slate-400">Recipient Name</label>
                        <input id="to-name" type="text" placeholder="Dennis Kiprop" class="w-full bg-[#0B0E14] border border-gray-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500">
                    </div>
                    <div>
                        <label class="block text-xs font-mono mb-1 text-slate-400">Content Body</label>
                        <textarea id="to-body" rows="3" placeholder="Local test broadcast alerts..." class="w-full bg-[#0B0E14] border border-gray-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-mono mb-1 text-slate-400">SMS Gateway Link</label>
                        <select id="to-provider" class="w-full bg-[#0B0E14] border border-gray-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500">
                            <option value="simulator">SMS Simulator Sandbox</option>
                            <option value="twilio">Twilio Account Integration</option>
                            <option value="africastalking">Africa's Talking Integration</option>
                        </select>
                    </div>
                    <button id="send-btn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold uppercase text-xs py-2 rounded. mt-2 tracking-widest transition-colors">Broadcast SMS</button>
                    <div id="status-fb" class="text-xs font-mono mt-2 hidden text-emerald-400"></div>
                </div>
            </section>

            <!-- Logs -->
            <section class="bg-[#111827] border border-gray-800 rounded p-5 flex flex-col">
                <h2 class="text-emerald-400 font-bold uppercase font-mono text-sm mb-4">Gsm Broadcast Logs</h2>
                <div id="logs-list" class="flex-1 bg-black/40 border border-gray-800 p-3 rounded font-mono text-xs overflow-y-auto max-h-[300px] space-y-2">
                    <p class="text-slate-500 italic">No broadcasts logged local database yet...</p>
                </div>
            </section>
        </main>
    </div>

    <script>
        document.getElementById('send-btn').addEventListener('click', async () => {
            const phone = document.getElementById('to-phone').value;
            const name = document.getElementById('to-name').value;
            const message = document.getElementById('to-body').value;
            const provider = document.getElementById('to-provider').value;
            const fb = document.getElementById('status-fb');
            
            if(!phone || !message) {
                alert('Specify phone and message body!');
                return;
            }
            
            fb.classList.remove('hidden');
            fb.textContent = "Processing network request...";
            fb.className = "text-xs font-mono mt-2 text-amber-500";
            
            try {
                const res = await fetch('/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipients: [{ name, phone }],
                        message,
                        provider
                    })
                });
                const data = await res.json();
                if(res.ok && data.results) {
                    const status = data.results[0].status;
                    const error = data.results[0].errorMessage || '';
                    
                    fb.textContent = "Status: " + status.toUpperCase() + (error ? " // Error: " + error : "");
                    fb.className = "text-xs font-mono mt-2 " + (status === 'failed' ? "text-red-400" : "text-emerald-400");
                    
                    // Add to logs
                    const logs = document.getElementById('logs-list');
                    if(logs.innerText.includes('No broadcasts')) {
                        logs.innerHTML = '';
                    }
                    const line = document.createElement('div');
                    line.className = "border-b border-gray-800 pb-1.5 text-[11px]";
                    line.innerHTML = \`<span class="text-indigo-400">\${phone}</span> | Status: <span class="\${status === 'failed' ? 'text-red-400':'text-emerald-400'}">\${status}</span><br><span class="text-slate-500">\${message}</span>\`;
                    logs.prepend(line);
                } else {
                    fb.textContent = "HTTP Proxy Failure";
                    fb.className = "text-xs font-mono mt-2 text-red-400";
                }
            } catch (err) {
                fb.textContent = "Fatal Connection Failure";
                fb.className = "text-xs font-mono mt-2 text-red-400";
            }
        });
    </script>
</body>
</html>
`;
  };

  const generateReadmeCode = () => {
    return `# BIBIAC SMS Portal - Local Integration Quick Start Guide

Ensure you layout your local workstation exactly as described in BIBIAC deployment control:

## 1. Directory Structure Setup
Create a main root folder on your terminal:
\`\`\`bash
mkdir bibiac_system
cd bibiac_system
mkdir templates
\`\`\`

Place the generated codes exactly into their respective positions:
- **app.py** goes into direct root \`bibiac_system/\`
- **index.html** goes inside the subfolder \`bibiac_system/templates/\`

## 2. Install Python Dependencies
Open your computer's terminal, navigate to your root folder, and execute:
\`\`\`bash
pip install flask requests
\`\`\`

## 3. Run and Deploy Local Gateway
Initiate your local development python worker:
\`\`\`bash
python app.py
\`\`\`

Open your browser and navigate to the local portal:
👉 **http://localhost:5000**
`;
  };

  // Synchronise files to save
  useEffect(() => {
    localStorage.setItem('bibiac_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('bibiac_sms_logs', JSON.stringify(smsLogs));
  }, [smsLogs]);

  useEffect(() => {
    localStorage.setItem('bibiac_credentials', JSON.stringify(credentials));
  }, [credentials]);

  // Request credentials verification status from actual server
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setConfiguredStatus(data);
      }
    } catch (err) {
      console.error('Could not load integration environment status.', err);
    } finally {
      setStatusLoading(false);
    }
  };

  // On mount check statuses and load logs
  useEffect(() => {
    fetchStatus();
  }, []);

  // Update real status when workspace inputs modify (helps keep simulator real)
  const syncCredentialsToLocalStorage = () => {
    // Save to local client storage
    localStorage.setItem('bibiac_credentials', JSON.stringify(credentials));
    
    // Simulate updating gateway links
    const twilioConfigured = !!(credentials.twilioSid && credentials.twilioToken && credentials.twilioNumber);
    const africasTalkingConfigured = !!(credentials.atUsername && credentials.atApiKey);
    
    setConfiguredStatus(prev => ({
      ...prev,
      twilioConfigured,
      africasTalkingConfigured
    }));
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev: any) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  // Propagate custom simulator sender preview context
  const handleActiveRecipientChange = (
    name: string,
    phone: string,
    text: string,
    provider: 'twilio' | 'africastalking' | 'simulator'
  ) => {
    setActiveMockup({
      recipientName: name,
      recipientPhone: phone,
      messageText: text,
      provider,
    });
  };

  // Callback once campaign dispatches results from server
  const handleSmsSentDone = (newResults: SmsLog[]) => {
    setSimulatingPhoneDelivery(true);
    // Visual timeout that mocks cellular uplink sequence delay
    setTimeout(() => {
      setSimulatingPhoneDelivery(false);
      setSmsLogs(prev => [...newResults, ...prev]);
    }, 1200);
  };

  // Add Contact Logic
  const handleAddContact = (e: FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) return;

    const added: Contact = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      group: newContact.group.trim() || 'General',
      createdAt: new Date().toISOString(),
    };

    setContacts(prev => [added, ...prev]);
    setNewContact({ name: '', phone: '', group: 'General' });
  };

  // Delete Contact
  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  // Copy to clipboard helper
  const handleCopyCodeText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFileIndex(true);
    setTimeout(() => setCopiedFileIndex(false), 2000);
  };

  // Trigger downloader for copy code to computer
  const triggerFileDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pip log simulator countdowns
  const triggerSimulationPip = () => {
    setInstallerState('installing');
    setInstallerLogs([
      '$ cd bibiac_system',
      '$ pip install flask requests twilio africastalking',
      'Collecting Flask...',
      '  Downloading Flask-3.0.0-py3-none-any.whl (99 kB)   [━━━━━━━━━━━━━━━━] 100%',
      'Collecting requests...',
      '  Downloading requests-2.31.0-py3-none-any.whl (62 kB) [━━━━━━━━━━━━━━━━] 100%',
      'Collecting twilio...',
      '  Downloading twilio-8.10.0-py2.py3-none-any.whl (1.7 MB) [━━━╸━━━━━━━━━━━━] 25%'
    ]);

    setTimeout(() => {
      setInstallerLogs(prev => [
        ...prev,
        '  Downloading twilio-8.10.0-py2.py3-none-any.whl (1.7 MB) [━━━━━━━━━━━━━━━━] 100%',
        'Collecting africastalking...',
        '  Downloading africastalking-1.2.5-py3-none-any.whl (15 kB)'
      ]);
    }, 1000);

    setTimeout(() => {
      setInstallerLogs(prev => [
        ...prev,
        'Installing collected packages: MarkupSafe, Jinja2, Werkzeug, itsdangerous, Flask, certifi, charset-normalizer, idna, urllib3, requests, PyJWT, twilio, africastalking',
        'Successfully installed Flask-3.0.0 Requests-2.31.0 Twilio-8.10.0 AfricasTalking-1.2.5',
        'STATUS // PACKAGE COMPILER FULLY CONFIGURED GREEN'
      ]);
      setInstallerState('done');
      if (sidebarStep === 3) {
        setSidebarStep(4); // Advance sequence automatically
      }
    }, 2500);
  };

  // Python app server log simulators
  const triggerPythonServerStart = () => {
    setRuntimeStatus('starting');
    setRuntimeLogs([
      '$ python app.py',
      'INFO:  Initializing BIBIAC Gateway system loop...',
      'INFO:  Validating twilio cells...',
      credentials.twilioSid ? 'INFO:  Twilio auth loaded successfully ✅' : 'WARN:  Twilio configured in sandbox mode, missing secrets API credentials.',
      'INFO:  Starting local WSGI Flask thread daemon...'
    ]);

    setTimeout(() => {
      setRuntimeLogs(prev => [
        ...prev,
        '---------------------------------------------',
        ' * Serving Flask app "app" (lazy loading)',
        ' * Environment: local pipeline developer mode',
        ' * Debug mode: on',
        ' * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)',
        ' * Restarting with stat',
        ' * Debugger is active!',
        '---------------------------------------------'
      ]);
      setRuntimeStatus('online');
    }, 1500);
  };

  const stopPythonServerSimulator = () => {
    setRuntimeStatus('offline');
    setRuntimeLogs(['$ KeyboardInterrupt', 'Flask server thread stopped. Local process dead.']);
  };

  // Selected code text block
  const getCurrentCodeContent = () => {
    if (selectedFileCode === 'app.py') return generateAppPyCode();
    if (selectedFileCode === 'templates/index.html') return generateIndexHtmlCode();
    return generateReadmeCode();
  };

  const filteredContacts = contacts.filter(c => {
    const query = searchContactText.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.phone.includes(query) || c.group.toLowerCase().includes(query);
  });

  return (
    <div className="bg-[#0B0E14] text-slate-300 min-h-screen flex flex-col font-sans overflow-x-hidden select-none select-text pb-10">
      
      {/* HEADER BAR CONSOLE */}
      <header id="control-header-panel" className="h-14 border-b border-[#1E293B] bg-[#111827] flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
          <span className="font-mono text-sm tracking-widest text-white uppercase font-bold">BIBIAC_SYSTEM // SMS PORTAL CONTROL</span>
        </div>

        {/* Gateway Connection Active Badge */}
        <div className="flex gap-2 font-mono">
          <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded border border-emerald-500/20 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            CLOUD CONSOLE SBOX ACTIVE
          </span>
        </div>

        <div className="hidden md:flex gap-6 text-[11px] font-mono uppercase tracking-tighter opacity-75">
          <span className="text-slate-500">Host: <span className="text-slate-300">AIS-SANDBOX:3000</span></span>
          <span className="text-slate-500">Status: <span className="text-emerald-400">● READY</span></span>
          <span className="text-slate-500">Target: <span className="text-indigo-400">1.0.4-BETA</span></span>
        </div>
      </header>

      {/* CORE FRAME CONTAINER - SIDEBAR + MAIN PANEL */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        
        {/* PIPELINE SIDEBAR (Setup pipeline steps status guide) */}
        <aside id="pipeline-sidebar-panel" className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#1E293B] bg-[#0F172A] p-5 flex flex-col gap-6 shrink-0 z-10">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 font-mono">Internal Cloud Sandbox Status</p>
            <div className="relative border-l-2 border-[#1E293B] ml-2 space-y-6">
              
              {/* Step 1 */}
              <div className="relative pl-5">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 bg-[#0F172A] flex items-center justify-center border-emerald-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
                <p className="text-xs font-mono font-bold uppercase leading-tight text-emerald-400">01. Vite + Express Core</p>
                <p className="text-[10px] text-slate-500 font-mono">Running Node.js Live Daemon</p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-5">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 bg-[#0F172A] flex items-center justify-center border-emerald-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
                <p className="text-xs font-mono font-bold uppercase leading-tight text-emerald-400">02. API Gateway proxy</p>
                <p className="text-[10px] text-slate-500 font-mono">Natively routed under /api/*</p>
              </div>

              {/* Step 3 */}
              <div className="relative pl-5">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 bg-[#0F172A] flex items-center justify-center border-emerald-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
                <p className="text-xs font-mono font-bold uppercase leading-tight text-emerald-400">03. SMS Core Simulator</p>
                <p className="text-[10px] text-slate-500 font-mono">Active fully in-browser fallback</p>
              </div>

              {/* Step 4 */}
              <div className="relative pl-5">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 bg-[#0F172A] flex items-center justify-center border-emerald-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                </div>
                <p className="text-xs font-mono font-bold uppercase leading-tight text-emerald-400">04. Workspace Frame</p>
                <p className="text-[10px] text-slate-500 font-mono">Live render sandbox ready</p>
              </div>

            </div>
          </div>

          <hr className="border-[#1E293B] my-2" />

          {/* Quick Active metrics */}
          <div className="space-y-3 font-mono">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Database Stats</p>
            <div className="bg-[#111827] rounded p-2.5 border border-[#1E293B] text-[11px] space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Contacts:</span>
                <span className="text-white font-bold">{contacts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Campaigns Logged:</span>
                <span className="text-white font-bold">{smsLogs.length}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-400">Simulator Status:</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="mt-auto hidden lg:block text-[10px] font-mono text-slate-500 italic">
            <p>Signed In As:</p>
            <p className="text-slate-300 non-italic mt-0.5 font-bold">davidkyali20@gmail.com</p>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT STAGE */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {/* TAB 1: OPERATIONAL TERMINAL CLIENT (PORTAL) */}
          {activeTab === 'control' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Composer & Gateways Status Card) - col span 5 */}
              <div className="xl:col-span-5 space-y-6">
                
                {/* Gateway config indicator */}
                <ProviderStatusCard 
                  status={configuredStatus} 
                  loading={statusLoading} 
                  onRefresh={fetchStatus} 
                />

                {/* SMS Broadcast template dispatcher component */}
                <SmsComposer 
                  contacts={contacts} 
                  configuredStatus={configuredStatus} 
                  onSmsSent={handleSmsSentDone} 
                  onActiveRecipientChange={handleActiveRecipientChange} 
                />

              </div>

              {/* Middle/Right Column (Phone preview & Contact Manager) - col span 7 */}
              <div className="xl:col-span-7 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:space-y-0">
                
                {/* Contact Book list */}
                <div className="bg-[#111827] rounded border border-[#1E293B] p-4 flex flex-col shadow-sm">
                  <div className="flex items-center gap-2 mb-3 justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-mono font-bold text-emerald-400 text-xs uppercase tracking-widest">03 / Contacts Database</h3>
                    </div>
                  </div>

                  {/* Add Customer Contact Form */}
                  <form onSubmit={handleAddContact} className="p-2.5 bg-[#0B0E14] border border-[#1E293B] rounded mb-4 space-y-2">
                    <p className="text-[9.5px] font-mono uppercase font-bold text-slate-500">Add Subscriber Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Dennis" 
                        required 
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[11px] font-mono text-white outline-none"
                      />
                      <input 
                        type="tel" 
                        placeholder="e.g. +254711..." 
                        required 
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[11px] font-mono text-white outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={newContact.group}
                        onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                        className="flex-1 bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-1.5 text-[11px] font-mono text-slate-300"
                      >
                        <option value="General">General</option>
                        <option value="Alert Subscribers">Alerts</option>
                        <option value="Billing">Billing</option>
                        <option value="Primary Care">Primary Care</option>
                        <option value="Staff">Staff</option>
                      </select>
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono uppercase text-[10px] font-bold px-3 py-1 rounded flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </form>

                  {/* Search Bar filter */}
                  <div className="relative mb-2.5">
                    <input 
                      type="text" 
                      placeholder="Search name, category, or cell..." 
                      value={searchContactText}
                      onChange={(e) => setSearchContactText(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-[#1E293B] rounded p-1 px-2.5 pl-7 text-[10px] font-mono text-slate-300 placeholder-slate-600 outline-none"
                    />
                    <span className="absolute left-2.5 top-2 text-slate-600 font-mono text-[9px]">🔍</span>
                  </div>

                  {/* Simple Contacts listing */}
                  <div className="flex-1 rounded border border-[#1E293B] bg-[#0B0E14] overflow-hidden">
                    <div className="max-h-[290px] overflow-y-auto font-mono text-xs divide-y divide-[#1E293B]">
                      {filteredContacts.length === 0 ? (
                        <p className="p-4 text-center text-slate-500 italic text-[11px]">No contacts registered or matched search.</p>
                      ) : (
                        filteredContacts.map(c => (
                          <div key={c.id} className="p-2 hover:bg-[#111827]/40 flex justify-between items-center group transition-colors">
                            <div className="overflow-hidden leading-tight">
                              <p className="font-bold text-white text-[11px] truncate flex items-center gap-1.5">
                                {c.name}
                                <span className="text-[8px] bg-indigo-950 text-indigo-400 border border-indigo-900/50 px-1 py-0.2 rounded font-semibold uppercase tracking-widest">{c.group}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">{c.phone}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteContact(c.id)}
                              className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete recipient contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Smartphone Viewer Preview Device Frame */}
                <div className="p-4 bg-[#111827] border border-[#1E293B] rounded flex flex-col shadow-sm items-center justify-center">
                  <SmsMockupPhone 
                    recipientName={activeMockup.recipientName}
                    recipientPhone={activeMockup.recipientPhone}
                    messageText={activeMockup.messageText}
                    provider={activeMockup.provider}
                    simulatingDelivery={simulatingPhoneDelivery}
                  />
                </div>

              </div>

              {/* Full-width scrolling database logs */}
              <div id="logs-collection-table" className="xl:col-span-12 bg-[#111827] border border-[#1E293B] rounded p-4 shadow-sm flex flex-col font-mono text-xs">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-emerald-400 uppercase tracking-widest">05 / Direct SMS Gsm Output Queue</h3>
                  </div>
                  <button 
                    onClick={() => setSmsLogs([])}
                    disabled={smsLogs.length === 0}
                    className="text-[10px] text-slate-500 hover:text-red-400 font-mono border border-[#1E293B] hover:border-red-900/30 bg-[#0B0E14] px-2 py-1 rounded transition-colors disabled:opacity-40"
                  >
                    Clear Queues
                  </button>
                </div>

                <div className="border border-[#1E293B] rounded bg-black/40 overflow-x-auto">
                  <table className="w-full text-left font-mono border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#0B0E14] border-b border-[#1E293B] text-slate-400 select-none">
                        <th className="p-2.5">Date & Time (UTC)</th>
                        <th className="p-2.5">Recipient Address</th>
                        <th className="p-2.5">Gateway</th>
                        <th className="p-2.5">Payload Content</th>
                        <th className="p-2.5">Carrier Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {smsLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-600 italic">
                            Awaiting SMS broadcasts... Queues present zero loaded communications packets.
                          </td>
                        </tr>
                      ) : (
                        smsLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-900/40 text-slate-300">
                            <td className="p-2.5 whitespace-nowrap text-slate-500">
                              {new Date(log.timestamp).toLocaleString().replace(',', '')}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="font-bold text-slate-200">{log.recipientName}</span>
                              <span className="block text-[10px] text-slate-500">{log.recipientPhone}</span>
                            </td>
                            <td className="p-2.5 whitespace-nowrap max-w-xs truncate">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.provider === 'twilio' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' : log.provider === 'africastalking' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-slate-800 text-slate-400'}`}>
                                {log.provider}
                              </span>
                            </td>
                            <td className="p-2.5 min-w-[240px] break-words text-slate-400 font-sans tracking-wide">
                              {log.message}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className={`inline-block font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${log.status === 'delivered' || log.status === 'sent' ? 'text-emerald-400 bg-emerald-950/20' : 'text-red-400 bg-red-950/20'}`}>
                                {log.status === 'delivered' || log.status === 'sent' ? '● ' + log.status.toUpperCase() : '○ ERR: ' + (log.errorMessage || 'FAILED')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DEVELOPMENT WORKSPACE PIPELINE WALKTHROUGH (4-BOX LAYOUT) */}
          {activeTab === 'workspace' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
              
              {/* BOX 1: PROJECT WORKSPACE FILE EXPLORER */}
              <section className="bg-[#111827] border border-[#1E293B] rounded p-4 flex flex-col min-h-[380px] shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-[#1E293B] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">📦</span>
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">01 / Project Workspace Structure</h3>
                  </div>
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">WALKTHROUGH ACTIVE</span>
                </div>

                <div className="flex gap-4 flex-1">
                  
                  {/* File explorer visual column */}
                  <div className="w-1/3 border-r border-[#1E293B] pr-3 font-mono text-xs select-none space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Folder Tree</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>📂</span>
                        <span className="truncate">bibiac_system</span>
                      </div>
                      
                      {/* Nested templates directory */}
                      <div className="ml-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <span>📂</span>
                          <span className="truncate">templates</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedFileCode('templates/index.html'); setSidebarStep(1); }}
                          className={`ml-5 flex items-center gap-1.5 text-left w-full truncate py-0.5 ${selectedFileCode === 'templates/index.html' ? 'text-blue-400 font-bold underline' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                          <span>📄</span>
                          <span className="truncate">index.html</span>
                        </button>
                      </div>

                      {/* File at root app.py */}
                      <button 
                        onClick={() => { setSelectedFileCode('app.py'); setSidebarStep(1); }}
                        className={`ml-4 flex items-center gap-1.5 text-left w-full truncate py-0.5 ${selectedFileCode === 'app.py' ? 'text-emerald-400 font-bold underline' : 'text-slate-500 hover:text-slate-350'}`}
                      >
                        <span>📄</span>
                        <span className="truncate">app.py</span>
                      </button>

                      {/* README info block */}
                      <button 
                        onClick={() => { setSelectedFileCode('README.md'); setSidebarStep(1); }}
                        className={`ml-4 flex items-center gap-1.5 text-left w-full truncate py-0.5 ${selectedFileCode === 'README.md' ? 'text-indigo-400 font-bold underline' : 'text-slate-500 hover:text-slate-350'}`}
                      >
                        <span>📄</span>
                        <span className="truncate">README.md</span>
                      </button>

                    </div>
                  </div>

                  {/* Complete Copy-paste viewer page file details */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="bg-[#0B0E14] border border-[#1E293B] rounded p-2 flex justify-between items-center text-[10px] font-mono select-none">
                      <span className="text-slate-400">Viewing: <strong className="text-white">{selectedFileCode}</strong></span>
                      <div className="flex gap-2">
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyCodeText(getCurrentCodeContent())}
                          className="flex items-center gap-1 hover:text-white text-slate-400 transition-colors"
                          title="Copy file text"
                        >
                          {copiedFileIndex ? <span className="text-emerald-400 font-bold">Copied!</span> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                        {/* Download button */}
                        <button
                          onClick={() => triggerFileDownload(selectedFileCode.split('/').pop() || '', getCurrentCodeContent())}
                          className="flex items-center gap-1 hover:text-white text-slate-400 transition-colors"
                          title="Download file to computer"
                        >
                          <Download className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>

                    {/* Pre scroll code display block */}
                    <div className="flex-1 mt-2 bg-black/40 border border-white/5 rounded p-3 font-mono text-[10.5px] text-[#A6ACCD] overflow-y-auto max-h-[290px] leading-relaxed select-text">
                      <pre className="whitespace-pre">{getCurrentCodeContent()}</pre>
                    </div>
                  </div>

                </div>

                <p className="mt-3 text-[10px] text-slate-500 leading-normal italic select-none font-mono">
                  💡 Setup: Place python file <strong className="text-emerald-400 select-all">app.py</strong> directly at root folder, and HTML file <strong className="text-blue-400 select-all font-bold">index.html</strong> inside a secondary custom folder named "templates".
                </p>
              </section>

              {/* BOX 2: SMS GATEWAY AUTH CREDENTIALS INPUTS Form */}
              <section id="developer-credentials-box" className="bg-[#111827] border border-[#1E293B] py-4 rounded p-4 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex justify-between items-center mb-2.5 border-b border-[#1E293B] pb-2.5">
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#38BDF8]">02 / SMS Gateway Authentication Pipelines</h3>
                    <span className="text-[9px] font-mono bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/25 font-bold px-2 py-0.5 rounded">CREDENTIAL LINK</span>
                  </div>

                  <p className="text-[10px] text-slate-400 mb-3 font-mono leading-relaxed">
                    Insert your credentials below. They dynamically compile into the code shown inside Box 1 and enable physical mobile device routing simulations!
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    
                    {/* Twilio Sid / Token / Number fields */}
                    <div id="wrapper-input-twilio" className="border border-[#1E293B] rounded p-2.5 bg-[#0B0E14] space-y-2">
                      <p className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">Option A: Twilio Gateway Credentials</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Account SID</label>
                          <input 
                            type="text" 
                            placeholder="ACxxxxxxxxxxxxxxxxxx" 
                            value={credentials.twilioSid}
                            onChange={(e) => { handleCredentialChange('twilioSid', e.target.value); setSidebarStep(2); }}
                            className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">AUTH Token</label>
                          <input 
                            type="password" 
                            placeholder="••••••••••••••••" 
                            value={credentials.twilioToken}
                            onChange={(e) => { handleCredentialChange('twilioToken', e.target.value); setSidebarStep(2); }}
                            className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Sender Mobile Number (Twilio Direct Caller ID)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +14155552671" 
                          value={credentials.twilioNumber}
                          onChange={(e) => { handleCredentialChange('twilioNumber', e.target.value); setSidebarStep(2); }}
                          className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                        />
                      </div>
                    </div>

                    {/* Africa's Talking Credentials */}
                    <div id="wrapper-input-africastalking" className="border border-[#1E293B] rounded p-2.5 bg-[#0B0E14] space-y-2">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Option B: Africa's Talking Credentials</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">API Username</label>
                          <input 
                            type="text" 
                            placeholder="e.g. sandbox or username" 
                            value={credentials.atUsername}
                            onChange={(e) => { handleCredentialChange('atUsername', e.target.value); setSidebarStep(2); }}
                            className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">API Secret Key</label>
                          <input 
                            type="password" 
                            placeholder="••••••••••••••••" 
                            value={credentials.atApiKey}
                            onChange={(e) => { handleCredentialChange('atApiKey', e.target.value); setSidebarStep(2); }}
                            className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[8.5px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Sender ID / Code (Optional Shortcode)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2043 or MyBrand" 
                          value={credentials.atSenderId}
                          onChange={(e) => { handleCredentialChange('atSenderId', e.target.value); setSidebarStep(2); }}
                          className="w-full bg-[#111827] border border-[#1E293B] focus:border-emerald-500 rounded p-1 px-2 text-[10px] text-slate-300 font-mono outline-none"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <button 
                  onClick={syncCredentialsToLocalStorage}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-mono uppercase text-[10px] font-bold py-2 rounded tracking-widest transition-all cursor-pointer"
                >
                  Verify and Lock Setup Variables
                </button>
              </section>

              {/* BOX 3: PACKAGE INSTALLER TERMINAL LOGS  */}
              <section id="developer-installer-box" className="bg-[#111827] border border-[#1E293B] rounded p-4 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-[#1E293B] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">📦</span>
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-500">03 / Dependency Package Installer</h3>
                  </div>
                  <div className="flex gap-1.5 select-none">
                    <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500/20"></div>
                  </div>
                </div>

                <div className="flex-1 bg-black text-[#A6ACCD] font-mono text-[11.5px] p-3 rounded overflow-y-auto max-h-[220px] leading-relaxed select-text flex flex-col gap-1 min-h-[160px] border border-[#1E293B]">
                  {installerLogs.map((line, idx) => (
                    <div key={idx} className={line.startsWith('$') ? 'text-emerald-400 font-semibold' : line.startsWith('STATUS') ? 'text-emerald-500 font-bold bg-emerald-950/25 p-1 rounded border border-emerald-900/30' : 'opacity-70'}>
                      {line}
                    </div>
                  ))}
                  {installerState === 'installing' && <div className="animate-pulse text-amber-400">[COLLECTING REMOTE DOCKER WHL REPOSITORIES...]</div>}
                </div>

                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={triggerSimulationPip}
                    disabled={installerState === 'installing'}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-mono font-bold uppercase text-[10.5px] py-2 rounded tracking-wider transition-colors cursor-pointer"
                  >
                    {installerState === 'idle' ? 'Simulate pip installer requirements' : installerState === 'installing' ? 'Installing packages...' : 'Re-run Simulated requirements installer'}
                  </button>
                </div>
              </section>

              {/* BOX 4: LOCAL RUNTIME PROCESS MONITOR SERVER TERMINAL */}
              <section id="developer-process-box" className="bg-[#111827] border border-[#1E293B] rounded p-4 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-[#1E293B] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]">🏁</span>
                    <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#10B981]">04 / Local Python app.py Server daemon</h3>
                  </div>
                  <span className={`text-[9px] font-mono font-bold border px-1.5 py-0.2 rounded uppercase ${runtimeStatus === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' : runtimeStatus === 'starting' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800/20 text-slate-500 border-[#1E293B]'}`}>
                    {runtimeStatus === 'online' ? '● System online' : runtimeStatus === 'starting' ? '○ Starting...' : '○ Server offline'}
                  </span>
                </div>

                <div className="flex-1 bg-black text-slate-300 font-mono text-[11px] p-3 rounded overflow-y-auto max-h-[220px] leading-relaxed select-text min-h-[160px] border border-[#1E293B] space-y-1">
                  {runtimeLogs.map((log, i) => (
                    <div key={i} className={log.startsWith('$') ? 'text-emerald-400 font-bold' : log.includes('online') || log.includes('online') ? 'text-emerald-400' : log.startsWith('INFO:') ? 'text-blue-400' : 'opacity-70'}>
                      {log}
                    </div>
                  ))}
                  {runtimeStatus === 'starting' && <div className="text-amber-400 animate-pulse">Running startup diagnostics compiler...</div>}
                </div>

                <div className="mt-4 flex gap-2">
                  {runtimeStatus === 'offline' ? (
                    <button 
                      onClick={triggerPythonServerStart}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold uppercase text-[10.5px] py-2 rounded tracking-wider transition-all cursor-pointer flex justify-center items-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 inline" /> Run python app.py
                    </button>
                  ) : (
                    <button 
                      onClick={stopPythonServerSimulator}
                      className="flex-1 bg-red-800 hover:bg-red-700 text-white font-mono font-bold uppercase text-[10.5px] py-2 rounded tracking-wider transition-all cursor-pointer flex justify-center items-center gap-2"
                    >
                      ☠️ Terminate Server Local thread
                    </button>
                  )}
                </div>
              </section>

            </div>
          )}

        </main>
      </div>

      {/* FOOTER BAR CONSOLE */}
      <footer id="control-footer-panel" className="h-10 bg-[#0B0E14] border-t border-[#1E293B] px-6 flex items-center justify-between text-[10px] font-mono shrink-0 select-none">
        <div className="flex gap-6">
          <span className="text-slate-500">Allocated Swap: <span className="text-slate-300">244MB / 8192MB</span></span>
          <span className="text-slate-500">Cpu Load: <span className="text-slate-300">1.2%</span></span>
          <span className="text-slate-500">Gsm Gateway Thread: <span className="text-emerald-400 font-bold">ACTIVE</span></span>
        </div>
        <div className="flex gap-4">
          <span className="text-emerald-500 font-bold">● CLOUD SECURE DEPLOYMENT</span>
          <span className="text-slate-500">PATH: ~/dev/bibiac_system</span>
        </div>
      </footer>

    </div>
  );
}
