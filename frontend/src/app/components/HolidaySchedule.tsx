import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  Plus,
  Edit,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { holidayService } from '../services/holidayService';

interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'major' | 'minor';
  status: 'upcoming' | 'planned' | 'completed';
  hours: string;
  promotion?: string;
  expectedRevenue: string;
  lastYearRevenue?: string;
}



const autoPromotions = [
  'Special Holiday Menu - 15% off all combos',
  'Family Feast Bundle - Feed 4 for $39.99',
  'Happy Hour Extended - 2 for 1 drinks',
  'Holiday Brunch Special - Free dessert with any entree',
  'Limited Edition Holiday Platter',
  'Buy One Get One - Appetizers all day',
];

const statusConfig = {
  upcoming: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: AlertCircle },
  planned: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Calendar },
  completed: { color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: CheckCircle }
};

export const HolidaySchedule: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    openingTime: '10:00',
    closingTime: '22:00',
    promotion: '',
  });

  React.useEffect(() => {
    async function loadHolidays() {
      try {
        const events = await holidayService.fetchHolidaySchedule();
        const mapped = events.map(e => ({
          id: e.id,
          name: e.title,
          date: e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          type: 'minor' as const, // Fallback mapping
          status: 'planned' as const,
          hours: e.affectedSchedules[0]?.time || '10:00 AM - 10:00 PM',
          promotion: e.aiRecommendations[0] || 'Special Holiday Menu',
          expectedRevenue: `$${((e.callVolumeImpact / 100) * 3000).toFixed(0)}`,
        }));

        // If the API returns empty or fails, use the initial mock ones
        if (mapped.length > 0) {
          setHolidays(mapped);
        } else {
          setHolidays([]);
        }
      } catch (error) {
        setHolidays([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadHolidays();
  }, []);

  const handleSubmitHoliday = (e: React.FormEvent) => {
    e.preventDefault();

    // Format date for display
    const dateObj = new Date(formData.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Format times
    const formatTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    // Auto-generate promotion if empty
    const promotion = formData.promotion.trim() || autoPromotions[Math.floor(Math.random() * autoPromotions.length)];

    // Mock expected revenue
    const expectedRevenue = `$${(1500 + Math.round(Math.random() * 4000)).toLocaleString()}`;

    const newHoliday: Holiday = {
      id: Date.now(),
      name: formData.name,
      date: formattedDate,
      type: 'minor',
      status: 'planned',
      hours: `${formatTime(formData.openingTime)} - ${formatTime(formData.closingTime)}`,
      promotion,
      expectedRevenue,
    };

    setHolidays((prev) => [...prev, newHoliday]);
    setShowAddHoliday(false);
    setFormData({ name: '', date: '', openingTime: '10:00', closingTime: '22:00', promotion: '' });
  };

  const calculateTotalRevenue = () => {
    return holidays.reduce((sum, h) => {
      const revenue = parseInt(h.expectedRevenue.replace(/[$,]/g, ''));
      return sum + revenue;
    }, 0);
  };

  const calculateGrowth = () => {
    let totalExpected = 0;
    let totalLastYear = 0;

    holidays.forEach(h => {
      if (h.lastYearRevenue) {
        totalExpected += parseInt(h.expectedRevenue.replace(/[$,]/g, ''));
        totalLastYear += parseInt(h.lastYearRevenue.replace(/[$,]/g, ''));
      }
    });

    if (totalLastYear === 0) return '0.0';
    const growth = ((totalExpected - totalLastYear) / totalLastYear) * 100;
    return growth.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-orange-500" />
            Holiday Revenue Planner
          </h1>
          <p className="text-slate-400">Optimize promotions and hours for maximum revenue</p>
        </div>
        <button
          onClick={() => setShowAddHoliday(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400 font-medium">Projected</span>
          </div>
          <p className="text-2xl font-bold text-white">${(calculateTotalRevenue() / 1000).toFixed(1)}K</p>
          <p className="text-sm text-slate-400">Total Holiday Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-medium">vs Last Year</span>
          </div>
          <p className="text-2xl font-bold text-white">+{calculateGrowth()}%</p>
          <p className="text-sm text-slate-400">Revenue Growth</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-medium">Tracked</span>
          </div>
          <p className="text-2xl font-bold text-white">{holidays.length}</p>
          <p className="text-sm text-slate-400">Holiday Events</p>
        </motion.div>
      </div>

      {/* Holiday Calendar */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">2026 Holiday Calendar</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
          >
            <option value="all">All Months</option>
            <option value="q1">Q1 (Jan-Mar)</option>
            <option value="q2">Q2 (Apr-Jun)</option>
            <option value="q3">Q3 (Jul-Sep)</option>
            <option value="q4">Q4 (Oct-Dec)</option>
          </select>
        </div>

        <div className="space-y-3">
          {holidays.map((holiday, idx) => {
            const StatusIcon = statusConfig[holiday.status].icon;

            return (
              <motion.div
                key={holiday.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${holiday.type === 'major' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                        <Star className={`w-4 h-4 ${holiday.type === 'major' ? 'text-orange-400' : 'text-blue-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{holiday.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[holiday.status].color}`}>
                            {holiday.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {holiday.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {holiday.hours}
                          </span>
                        </div>
                      </div>
                    </div>

                    {holiday.promotion && (
                      <div className="ml-12 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg inline-block">
                        <p className="text-xs text-orange-400 font-medium">🎉 {holiday.promotion}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 lg:gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{holiday.expectedRevenue}</p>
                      {holiday.lastYearRevenue && (
                        <p className="text-xs text-slate-500">vs {holiday.lastYearRevenue}</p>
                      )}
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-[#13131a] to-orange-950/30 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          AI Revenue Optimization Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">📊 Valentine's Day Prediction</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Based on historical trends, extend hours by 1 hour and promote "Couple's Combo" to increase revenue by an estimated <span className="text-emerald-400 font-bold">$400</span>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold text-white mb-2">🎄 Holiday Staffing</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Thanksgiving sees 45% higher call volume. Consider scheduling 2 additional staff members during 5-8 PM to handle increased demand.
            </p>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Dialog open={showAddHoliday} onOpenChange={setShowAddHoliday}>
        <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Add Holiday Event
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Schedule a holiday and set promotions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitHoliday} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Holiday Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Christmas Eve"
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Opening Time</label>
                <input
                  type="time"
                  required
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Closing Time</label>
                <input
                  type="time"
                  required
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Promotion <span className="text-slate-500">(leave empty to auto-generate)</span>
              </label>
              <input
                type="text"
                value={formData.promotion}
                onChange={(e) => setFormData({ ...formData, promotion: e.target.value })}
                placeholder="e.g. 20% off all orders"
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowAddHoliday(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add Holiday
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
