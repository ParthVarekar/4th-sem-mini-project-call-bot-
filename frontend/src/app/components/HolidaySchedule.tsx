import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, CalendarDays, DollarSign, Loader2, Plus, Trash2, TrendingUp } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { HolidayEvent, holidayService } from '../services/holidayService';

export const HolidaySchedule: React.FC = () => {
  const [holidays, setHolidays] = useState<HolidayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    openingTime: '10:00',
    closingTime: '22:00',
    promotion: '',
  });

  useEffect(() => {
    async function loadHolidays() {
      try {
        setHolidays(await holidayService.fetchHolidaySchedule());
      } catch (error) {
        console.error('Failed to load holidays', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHolidays();
  }, []);

  const totalProjectedRevenue = useMemo(() => holidays.reduce((sum, holiday) => sum + (holiday.expectedRevenue || 0), 0), [holidays]);
  const growth = useMemo(() => {
    const lastYear = holidays.reduce((sum, holiday) => sum + (holiday.lastYearRevenue || 0), 0);
    if (!lastYear) return 0;
    return ((totalProjectedRevenue - lastYear) / lastYear) * 100;
  }, [holidays, totalProjectedRevenue]);

  const handleSubmitHoliday = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const holiday = await holidayService.saveHoliday(formData);
      setHolidays((current) => [...current, holiday].sort((left, right) => left.date.localeCompare(right.date)));
      setShowAddHoliday(false);
      setFormData({ name: '', date: '', openingTime: '10:00', closingTime: '22:00', promotion: '' });
    } catch (error) {
      console.error('Failed to save holiday', error);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await holidayService.deleteHoliday(id);
      setHolidays((current) => current.filter((holiday) => holiday.id !== id));
    } catch (error) {
      console.error('Failed to delete holiday', error);
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <CalendarDays className="h-6 w-6 text-orange-500" />
            Holiday Revenue Planner
          </h1>
          <p className="text-slate-400">Persisted holiday schedules, projected revenue, and staffing tips from the backend.</p>
        </div>
        <button onClick={() => setShowAddHoliday(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          Add Holiday
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<DollarSign className="h-5 w-5 text-emerald-400" />} label="Projected Revenue" value={`$${(totalProjectedRevenue / 1000).toFixed(1)}K`} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-orange-400" />} label="Growth vs Last Year" value={`${growth.toFixed(1)}%`} />
        <StatCard icon={<Calendar className="h-5 w-5 text-purple-400" />} label="Tracked Events" value={String(holidays.length)} />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#13131a] p-6">
        <h2 className="mb-6 text-lg font-bold text-white">Holiday Calendar</h2>
        <div className="space-y-3">
          {holidays.map((holiday, index) => (
            <motion.div key={holiday.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-white">{holiday.title}</h3>
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">{holiday.type}</span>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>{holiday.date}</span>
                    <span>{holiday.affectedSchedules[0]?.time || 'Hours TBD'}</span>
                    <span>{holiday.callVolumeImpact}% impact</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    {holiday.aiRecommendations.map((tip) => (
                      <p key={tip}>{tip}</p>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">${holiday.expectedRevenue || 0}</p>
                    <p className="text-xs text-slate-500">vs ${holiday.lastYearRevenue || 0} last year</p>
                  </div>
                  {holiday.type === 'custom' ? (
                    <button onClick={() => handleDeleteHoliday(holiday.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-rose-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-gradient-to-br from-[#13131a] to-orange-950/30 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">AI Revenue Optimization Tips</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {holidays.slice(0, 2).map((holiday) => (
            <div key={holiday.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 font-semibold text-white">{holiday.title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{holiday.aiRecommendations[0] || 'Promote the event early and align staffing with expected demand.'}</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showAddHoliday} onOpenChange={setShowAddHoliday}>
        <DialogContent className="border border-white/10 bg-[#13131a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-orange-500" />
              Add Holiday Event
            </DialogTitle>
            <DialogDescription className="text-slate-400">Schedule a holiday and persist it through the backend.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitHoliday} className="mt-2 space-y-4">
            <Field label="Holiday Name">
              <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" placeholder="e.g. Christmas Eve" />
            </Field>
            <Field label="Date">
              <input required type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Opening Time">
                <input required type="time" value={formData.openingTime} onChange={(event) => setFormData({ ...formData, openingTime: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
              </Field>
              <Field label="Closing Time">
                <input required type="time" value={formData.closingTime} onChange={(event) => setFormData({ ...formData, closingTime: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
              </Field>
            </div>
            <Field label="Promotion">
              <input value={formData.promotion} onChange={(event) => setFormData({ ...formData, promotion: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" placeholder="e.g. 20% off all family meals" />
            </Field>
            <DialogFooter>
              <button type="button" onClick={() => setShowAddHoliday(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10">Cancel</button>
              <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600">Add Holiday</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/5 bg-[#13131a] p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="rounded-lg bg-white/5 p-2">{icon}</div>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Live</span>
    </div>
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-slate-300">
    <span className="mb-1 block">{label}</span>
    {children}
  </label>
);
