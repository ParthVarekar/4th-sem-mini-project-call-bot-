import React from 'react';
import { motion } from 'motion/react';
import { Crown, Gift, TrendingUp, Zap, Award } from 'lucide-react';

interface FrequentCustomer {
  phone: string;
  name: string;
  callCount: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  discount: number;
  autoApply: boolean;
  nextTierCalls: number;
}

interface Props {
  customer: FrequentCustomer;
  compact?: boolean;
}

const tierConfig = {
  Bronze: {
    color: 'from-amber-700 to-amber-900',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: Award
  },
  Silver: {
    color: 'from-slate-400 to-slate-600',
    textColor: 'text-slate-300',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    icon: Gift
  },
  Gold: {
    color: 'from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: Crown
  },
  Platinum: {
    color: 'from-purple-400 to-purple-600',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    icon: Zap
  }
};

export const FrequentCustomerTracker: React.FC<Props> = ({ customer, compact = false }) => {
  const config = tierConfig[customer.tier];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
        <Icon className={`w-4 h-4 ${config.textColor}`} />
        <span className="text-xs font-semibold text-white">
          {customer.tier} • {customer.discount}% OFF Auto-Applied
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">{customer.name}</h3>
            <p className="text-xs text-slate-400">{customer.phone}</p>
          </div>
        </div>
        <span className={`px-3 py-1 bg-gradient-to-r ${config.color} rounded-full text-xs font-bold text-white`}>
          {customer.tier}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Calls:</span>
          <span className="font-semibold text-white">{customer.callCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Loyalty Discount:</span>
          <span className={`font-bold ${config.textColor}`}>{customer.discount}%</span>
        </div>
        {customer.nextTierCalls > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-slate-400 mb-2">
              {customer.nextTierCalls} more calls to next tier
            </p>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                style={{ width: `${((customer.callCount % 10) / 10) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {customer.autoApply && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Auto-discount active on this call</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
