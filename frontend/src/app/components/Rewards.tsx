import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Gift,
  Percent,
  Star,
  Users,
  TrendingUp,
  Clock,
  Award,
  Plus,
  Edit,
  Trash2,
  Crown,
  Zap,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { rewardsService, LoyaltyCustomer } from '../services/rewardsService';

interface Customer {
  id: number;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  lastVisit: string;
}

interface Discount {
  id: number;
  name: string;
  type: string;
  value: string;
  conditions: string;
  active: boolean;
  used: number;
}

const tierColors = {
  Bronze: 'from-amber-700 to-amber-900',
  Silver: 'from-slate-400 to-slate-600',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-purple-400 to-purple-600'
};

const tierIcons = {
  Bronze: <Award className="w-4 h-4" />,
  Silver: <Star className="w-4 h-4" />,
  Gold: <Crown className="w-4 h-4" />,
  Platinum: <Zap className="w-4 h-4" />
};

const conditionOptions = ['New customers', 'Loyalty members', 'Repeat customers', 'All customers', 'Birthday month', 'Weekend only'];

export const Rewards: React.FC = () => {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Percentage',
    value: '',
    conditions: 'All customers',
    usageLimit: '100',
  });

  React.useEffect(() => {
    async function loadRewards() {
      try {
        const data = await rewardsService.fetchRewardsData();
        setCustomers(data.customers);
        setDiscounts(data.discounts);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRewards();
  }, []);

  const handleSubmitDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const newDiscount: Discount = {
      id: Date.now(),
      name: formData.name,
      type: formData.type,
      value: formData.type === 'Percentage' ? `${formData.value}%` : `$${formData.value}`,
      conditions: formData.conditions,
      active: true,
      used: 0,
    };
    setDiscounts((prev) => [...prev, newDiscount]);
    setShowNewDiscount(false);
    setFormData({ name: '', type: 'Percentage', value: '', conditions: 'All customers', usageLimit: '100' });
  };

  const handleDeleteDiscount = (id: number) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  };

  const activeCount = discounts.filter((d) => d.active).length;
  const totalUsed = discounts.reduce((sum, d) => sum + d.used, 0);

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
            <Gift className="w-6 h-6 text-orange-500" />
            Rewards & Discounts
          </h1>
          <p className="text-slate-400">Manage customer loyalty programs and discount campaigns</p>
        </div>
        <button
          onClick={() => setShowNewDiscount(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Discount
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-400 font-medium">+12%</span>
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
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Percent className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-sm text-slate-400">Active Discounts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-medium">+8%</span>
          </div>
          <p className="text-2xl font-bold text-white">$4.2K</p>
          <p className="text-sm text-slate-400">Rewards Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Star className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-xs text-rose-400 font-medium">94%</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsed}</p>
          <p className="text-sm text-slate-400">Discounts Used</p>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Discounts */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-orange-500" />
            Active Discount Campaigns
          </h2>
          <div className="space-y-3">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className={`p-4 rounded-lg border transition-all ${discount.active
                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                  : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{discount.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{discount.conditions}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-bold">
                      {discount.value}
                    </span>
                    <span className="text-xs text-slate-500">{discount.type}</span>
                  </div>
                  <span className="text-xs text-slate-400">{discount.used} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-orange-500" />
            Top Loyalty Customers
          </h2>
          <div className="space-y-3">
            {customers.map((customer, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tierColors[customer.tier]} flex items-center justify-center text-white`}>
                      {tierIcons[customer.tier]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{customer.name}</h3>
                      <p className="text-xs text-slate-400">{customer.phone}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 bg-gradient-to-r ${tierColors[customer.tier]} rounded-full text-xs font-bold text-white`}>
                    {customer.tier}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>{customer.callCount} calls</span>
                    <span className="text-emerald-400 font-semibold">{customer.discount}% discount</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Star className="w-3 h-3" />
                    Next: {customer.nextTierCalls} calls
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier System Overview */}
      <div className="bg-gradient-to-br from-[#13131a] to-purple-950/30 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-bold text-white mb-4">Loyalty Tier System</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-white">Bronze</span>
            </div>
            <p className="text-xs text-slate-400 mb-1">1-10 visits</p>
            <p className="text-sm font-semibold text-amber-400">5% discount</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-slate-300" />
              <span className="font-bold text-white">Silver</span>
            </div>
            <p className="text-xs text-slate-400 mb-1">11-20 visits</p>
            <p className="text-sm font-semibold text-slate-300">10% discount</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">Gold</span>
            </div>
            <p className="text-xs text-slate-400 mb-1">21-30 visits</p>
            <p className="text-sm font-semibold text-yellow-400">15% discount</p>
          </div>
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white">Platinum</span>
            </div>
            <p className="text-xs text-slate-400 mb-1">31+ visits</p>
            <p className="text-sm font-semibold text-purple-400">20% discount + perks</p>
          </div>
        </div>
      </div>

      {/* New Discount Modal */}
      <Dialog open={showNewDiscount} onOpenChange={setShowNewDiscount}>
        <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Create New Discount
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new discount campaign for your customers
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDiscount} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Discount Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Summer Special"
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option>Percentage</option>
                  <option>Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Value {formData.type === 'Percentage' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'Percentage' ? '10' : '5'}
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Applicable Conditions</label>
              <select
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
              >
                {conditionOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Usage Limit</label>
              <input
                type="number"
                required
                min="1"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowNewDiscount(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Discount
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
