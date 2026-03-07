import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Phone, TrendingUp, Mic, Save, Bell, Shield, Volume2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    autoReservation: true,
    autoOrderTaking: false,
    aiUpselling: true,
    callRecording: true,
    voiceType: 'Female - Friendly',
    maxHoldTime: '2 minutes'
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as any] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
           <p className="text-slate-400">Manage how your AI assistant handles calls.</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Features */}
        <div className="bg-[#13131a] rounded-xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-[#18181b]">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-orange-500" />
              Call Handling
            </h3>
            <p className="text-sm text-slate-500 mt-1">Configure automated responses and actions.</p>
          </div>
          <div className="p-6 space-y-6">
            <SettingToggle 
              label="Auto Reservation Mode" 
              description="Allow AI to check availability and book tables automatically."
              active={settings.autoReservation}
              onToggle={() => handleToggle('autoReservation')}
              icon={<Calendar className="w-5 h-5 text-orange-500" />}
            />
            <SettingToggle 
              label="Auto Order Taking" 
              description="Enable AI to take food orders and sync with POS."
              active={settings.autoOrderTaking}
              onToggle={() => handleToggle('autoOrderTaking')}
              icon={<Phone className="w-5 h-5 text-orange-500" />}
            />
             <SettingToggle 
              label="AI Upselling Suggestions" 
              description="Smartly suggest drinks, sides, or desserts during orders."
              active={settings.aiUpselling}
              onToggle={() => handleToggle('aiUpselling')}
              icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
            />
          </div>
        </div>

        {/* Voice & Behavior */}
        <div className="bg-[#13131a] rounded-xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-[#18181b]">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-orange-500" />
              Voice & Behavior
            </h3>
            <p className="text-sm text-slate-500 mt-1">Customize the AI's personality and rules.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" /> AI Voice Persona
              </label>
              <select 
                className="w-full border border-white/5 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 bg-[#1c1c24] text-white"
                value={settings.voiceType}
                onChange={(e) => setSettings({...settings, voiceType: e.target.value})}
              >
                <option>Female - Friendly (Sarah)</option>
                <option>Male - Professional (James)</option>
                <option>Neutral - Efficient (Alex)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" /> Max Hold Time
              </label>
              <select 
                className="w-full border border-white/5 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 bg-[#1c1c24] text-white"
                value={settings.maxHoldTime}
                onChange={(e) => setSettings({...settings, maxHoldTime: e.target.value})}
              >
                <option>1 minute</option>
                <option>2 minutes</option>
                <option>5 minutes</option>
                <option>Indefinite (Not Recommended)</option>
              </select>
            </div>

            <SettingToggle 
              label="Record All Calls" 
              description="Save audio and transcripts for quality assurance."
              active={settings.callRecording}
              onToggle={() => handleToggle('callRecording')}
              icon={<Shield className="w-5 h-5 text-orange-500" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, active, onToggle, icon }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-start space-x-3">
      <div className="mt-0.5 p-2 bg-[#1c1c24] rounded-lg hidden sm:block border border-white/5">
        {icon}
      </div>
      <div>
        <span className="text-sm font-medium text-white block">{label}</span>
        <span className="text-xs text-slate-500 block max-w-xs">{description}</span>
      </div>
    </div>
    <button 
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 ${active ? 'bg-orange-600' : 'bg-slate-700'}`}
      role="switch"
      aria-checked={active}
    >
      <span 
        aria-hidden="true" 
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`} 
      />
    </button>
  </div>
);
