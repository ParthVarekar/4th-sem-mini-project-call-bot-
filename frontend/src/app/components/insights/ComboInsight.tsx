import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Target,
  UtensilsCrossed,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  onBack: () => void;
}

const hourlyData = [
  { hour: '11AM', combos: 12, individual: 28 },
  { hour: '12PM', combos: 18, individual: 35 },
  { hour: '1PM', combos: 22, individual: 38 },
  { hour: '2PM', combos: 8, individual: 15 },
  { hour: '6PM', combos: 45, individual: 42 },
  { hour: '7PM', combos: 52, individual: 38 },
  { hour: '8PM', combos: 48, individual: 35 },
  { hour: '9PM', combos: 35, individual: 28 },
];

const weeklyData = [
  { day: 'Mon', revenue: 1250 },
  { day: 'Tue', revenue: 980 },
  { day: 'Wed', revenue: 1100 },
  { day: 'Thu', revenue: 1350 },
  { day: 'Fri', revenue: 2100 },
  { day: 'Sat', revenue: 2450 },
  { day: 'Sun', revenue: 1890 },
];

export const ComboInsight: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Insights
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-emerald-500" />
          Combo Meal Suggestion Strategy
        </h1>
        <p className="text-slate-400">Detailed analysis and implementation guide</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400 font-medium">+15%</span>
          </div>
          <p className="text-2xl font-bold text-white">$1,200</p>
          <p className="text-sm text-slate-400">Projected Monthly Revenue</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-medium">Peak</span>
          </div>
          <p className="text-2xl font-bold text-white">6-9 PM</p>
          <p className="text-sm text-slate-400">Best Conversion Hours</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-medium">+$8</span>
          </div>
          <p className="text-2xl font-bold text-white">$42.50</p>
          <p className="text-sm text-slate-400">Avg Combo Order Value</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-white">34%</p>
          <p className="text-sm text-slate-400">Conversion Rate</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Performance */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Combo vs Individual Orders by Hour</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1c1c24', 
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="combos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="individual" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-xs text-slate-400">Combo Orders</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded" />
              <span className="text-xs text-slate-400">Individual Orders</span>
            </div>
          </div>
        </div>

        {/* Weekly Revenue */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Weekly Combo Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1c1c24', 
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-slate-400 mt-4">
            Weekend performance is 45% higher than weekdays
          </p>
        </div>
      </div>

      {/* Implementation Steps */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Implementation Checklist</h2>
        <div className="space-y-3">
          {[
            'Enable AI auto-suggestion when customer orders 3+ individual items',
            'Train call agents to mention "Family Feast" during 6-9 PM calls',
            'Create promotional script highlighting 15-20% savings',
            'Set up SMS follow-up for customers who declined combo offer',
            'Monitor conversion metrics weekly and adjust pricing',
            'A/B test different combo configurations on weekends'
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-emerald-950/30 to-[#13131a] rounded-xl p-6 border border-emerald-500/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-2">AI-Powered Recommendations</h2>
            <p className="text-sm text-slate-300">Based on your restaurant's historical data</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-semibold text-white mb-2">🍔 Best Combo Type</h3>
            <p className="text-sm text-slate-300">
              "Family Feast" (2 Pizzas + Wings + Soda) has 87% acceptance rate. Consider promoting this heavily.
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-semibold text-white mb-2">⏰ Optimal Timing</h3>
            <p className="text-sm text-slate-300">
              Suggest combos 2-3 minutes into the call after building rapport. Don't rush the offer.
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-semibold text-white mb-2">💰 Pricing Sweet Spot</h3>
            <p className="text-sm text-slate-300">
              15-18% discount maximizes conversion without sacrificing too much margin.
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-semibold text-white mb-2">📱 Follow-Up Strategy</h3>
            <p className="text-sm text-slate-300">
              Send SMS with combo offer to customers who ordered individually 3+ times.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors shadow-lg">
          Enable Combo Suggestions
        </button>
      </div>
    </div>
  );
};
