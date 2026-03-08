import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Loader2, Mic, Phone, Save, Shield, TrendingUp, Volume2 } from 'lucide-react';

import { AppSettings, settingsService } from '../services/settingsService';

const defaultSettings: AppSettings = {
  autoReservation: true,
  autoOrderTaking: false,
  aiUpselling: true,
  callRecording: true,
  voiceType: 'Female - Friendly (Sarah)',
  maxHoldTime: '2 minutes',
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setSettings(await settingsService.fetchSettings());
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleToggle = (key: keyof Pick<AppSettings, 'autoReservation' | 'autoOrderTaking' | 'aiUpselling' | 'callRecording'>) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await settingsService.saveSettings(settings);
      setSettings(saved);
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Configuration</h1>
          <p className="text-slate-400">Persisted assistant behavior settings for call handling and voice rules.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2 rounded-lg bg-orange-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-orange-700 disabled:opacity-60">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#13131a] shadow-xl">
          <div className="border-b border-white/5 bg-[#18181b] p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Phone className="h-5 w-5 text-orange-500" />
              Call Handling
            </h3>
            <p className="mt-1 text-sm text-slate-500">Configure automated responses and call actions.</p>
          </div>
          <div className="space-y-6 p-6">
            <SettingToggle label="Auto Reservation Mode" description="Allow the AI to handle reservation requests automatically." active={settings.autoReservation} onToggle={() => handleToggle('autoReservation')} icon={<Calendar className="h-5 w-5 text-orange-500" />} />
            <SettingToggle label="Auto Order Taking" description="Enable AI-assisted ordering workflows during inbound calls." active={settings.autoOrderTaking} onToggle={() => handleToggle('autoOrderTaking')} icon={<Phone className="h-5 w-5 text-orange-500" />} />
            <SettingToggle label="AI Upselling Suggestions" description="Suggest side dishes, drinks, and dessert opportunities during active calls." active={settings.aiUpselling} onToggle={() => handleToggle('aiUpselling')} icon={<TrendingUp className="h-5 w-5 text-orange-500" />} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/5 bg-[#13131a] shadow-xl">
          <div className="border-b border-white/5 bg-[#18181b] p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Mic className="h-5 w-5 text-orange-500" />
              Voice and Behavior
            </h3>
            <p className="mt-1 text-sm text-slate-500">Persist the assistant voice persona and guardrails.</p>
          </div>
          <div className="space-y-6 p-6">
            <Field label="AI Voice Persona" icon={<Volume2 className="h-4 w-4 text-slate-500" />}>
              <select value={settings.voiceType} onChange={(event) => setSettings({ ...settings, voiceType: event.target.value })} className="w-full rounded-lg border border-white/5 bg-[#1c1c24] p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                <option>Female - Friendly (Sarah)</option>
                <option>Male - Professional (James)</option>
                <option>Neutral - Efficient (Alex)</option>
              </select>
            </Field>

            <Field label="Max Hold Time" icon={<Bell className="h-4 w-4 text-slate-500" />}>
              <select value={settings.maxHoldTime} onChange={(event) => setSettings({ ...settings, maxHoldTime: event.target.value })} className="w-full rounded-lg border border-white/5 bg-[#1c1c24] p-2.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                <option>1 minute</option>
                <option>2 minutes</option>
                <option>5 minutes</option>
                <option>Indefinite (Not Recommended)</option>
              </select>
            </Field>

            <SettingToggle label="Record All Calls" description="Save call histories so transcripts and QA records remain available." active={settings.callRecording} onToggle={() => handleToggle('callRecording')} icon={<Shield className="h-5 w-5 text-orange-500" />} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, active, onToggle, icon }: { label: string; description: string; active: boolean; onToggle: () => void; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-start space-x-3">
      <div className="mt-0.5 hidden rounded-lg border border-white/5 bg-[#1c1c24] p-2 sm:block">{icon}</div>
      <div>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block max-w-xs text-xs text-slate-500">{description}</span>
      </div>
    </div>
    <button onClick={onToggle} className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ${active ? 'bg-orange-600' : 'bg-slate-700'}`} role="switch" aria-checked={active}>
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
      {icon}
      {label}
    </label>
    {children}
  </div>
);
