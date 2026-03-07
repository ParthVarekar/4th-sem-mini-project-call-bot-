import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp,
  DollarSign,
  Percent,
  Gift,
  Crown,
  Star,
  Award,
  Zap,
  CheckCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  onBack: () => void;
}

const tierDistribution = [
  { name: 'Bronze', value: 45, color: '#d97706' },
  { name: 'Silver', value: 30, color: '#94a3b8' },
  { name: 'Gold', value: 18, color: '#eab308' },
  { name: 'Platinum', value: 7, color: '#a855f7' },
];

const monthlyRetention = [
  { month: 'Jan', retained: 82, churned: 18 },
  { month: 'Feb', retained: 85, churned: 15 },
  { month: 'Mar', retained: 88, churned: 12 },
  { month: 'Apr', retained: 90, churned: 10 },
  { month: 'May', retained: 92, churned: 8 },
  { month: 'Jun', retained: 94, churned: 6 },
];

export const RewardsInsight: React.FC<Props> = ({ onBack }) => {
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
          <Gift className="w-6 h-6 text-orange-500" />
          Repeat Customer Loyalty Program
        </h1>
        <p className="text-slate-400">Build lasting relationships with automatic rewards</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-medium">+22%</span>
          </div>
          <p className="text-2xl font-bold text-white">248</p>
          <p className="text-sm text-slate-400">Loyalty Members</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400 font-medium">+$127</span>
          </div>
          <p className="text-2xl font-bold text-white">$842</p>
          <p className="text-sm text-slate-400">Avg Lifetime Value</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-medium">+9%</span>
          </div>
          <p className="text-2xl font-bold text-white">67%</p>
          <p className="text-sm text-slate-400">Redemption Rate</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400 font-medium">High</span>
          </div>
          <p className="text-2xl font-bold text-white">94%</p>
          <p className="text-sm text-slate-400">Retention Rate</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Customer Tier Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1c1c24', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {tierDistribution.map((tier) => (
              <div key={tier.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: tier.color }} />
                <span className="text-xs text-slate-400">{tier.name}: {tier.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Trend */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Monthly Retention Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyRetention}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1c1c24', 
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="retained" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churned" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-slate-400 mt-4">
            Loyalty program improved retention by 22% in 6 months
          </p>
        </div>
      </div>

      {/* Tier Benefits */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Loyalty Tier Structure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white">Bronze</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">1-10 orders</p>
            <p className="text-lg font-bold text-amber-400 mb-2">5% OFF</p>
            <ul className="space-y-1">
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Auto-applied discount
              </li>
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Birthday reward
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-slate-300" />
              <span className="font-bold text-white">Silver</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">11-20 orders</p>
            <p className="text-lg font-bold text-slate-300 mb-2">10% OFF</p>
            <ul className="space-y-1">
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                All Bronze benefits
              </li>
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Free delivery
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">Gold</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">21-30 orders</p>
            <p className="text-lg font-bold text-yellow-400 mb-2">15% OFF</p>
            <ul className="space-y-1">
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                All Silver benefits
              </li>
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Priority support
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Platinum</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">31+ orders</p>
            <p className="text-lg font-bold text-purple-400 mb-2">20% OFF</p>
            <ul className="space-y-1">
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                All Gold benefits
              </li>
              <li className="text-xs text-slate-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                Exclusive menu access
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Implementation Steps */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Setup Guide</h2>
        <div className="space-y-3">
          {[
            'Configure automatic tier assignment based on call history',
            'Enable real-time discount calculation during calls',
            'Set up SMS notifications when customers reach new tiers',
            'Create personalized discount codes for each tier',
            'Train AI to mention loyalty status during calls',
            'Monitor redemption rates and adjust tier thresholds'
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
              <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-300">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="bg-gradient-to-br from-orange-950/30 to-[#13131a] rounded-xl p-6 border border-orange-500/20">
        <h2 className="text-lg font-bold text-white mb-4">Expected ROI Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Increased Retention</p>
            <p className="text-2xl font-bold text-emerald-400">+22%</p>
            <p className="text-xs text-slate-300 mt-2">Customers stay 3.5x longer</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Higher Order Frequency</p>
            <p className="text-2xl font-bold text-orange-400">+35%</p>
            <p className="text-xs text-slate-300 mt-2">Loyalty members order more often</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-slate-400 mb-2">Revenue Impact</p>
            <p className="text-2xl font-bold text-purple-400">$4.2K/mo</p>
            <p className="text-xs text-slate-300 mt-2">Additional monthly revenue</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-lg">
          Activate Loyalty Program
        </button>
      </div>
    </div>
  );
};
