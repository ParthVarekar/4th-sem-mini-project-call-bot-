import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Award, Crown, Gift, Loader2, Percent, Plus, Star, Trash2, TrendingUp, Users, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { CreateDiscountPayload, Discount, LoyaltyCustomer, rewardsService } from '../services/rewardsService';

const tierColors = {
  Bronze: 'from-amber-700 to-amber-900',
  Silver: 'from-slate-400 to-slate-600',
  Gold: 'from-yellow-400 to-yellow-600',
  Platinum: 'from-purple-400 to-purple-600',
};

const tierIcons = {
  Bronze: <Award className="h-4 w-4" />,
  Silver: <Star className="h-4 w-4" />,
  Gold: <Crown className="h-4 w-4" />,
  Platinum: <Zap className="h-4 w-4" />,
};

const conditionOptions = ['New customers', 'Loyalty members', 'Repeat customers', 'All customers', 'Birthday month', 'Weekend only'];

export const Rewards: React.FC = () => {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<CreateDiscountPayload>({
    name: '',
    type: 'Percentage',
    value: '',
    conditions: 'All customers',
    usageLimit: '100',
  });

  useEffect(() => {
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

  const activeCount = discounts.filter((discount) => discount.active).length;
  const totalUsed = discounts.reduce((sum, discount) => sum + discount.used, 0);
  const estimatedRevenue = useMemo(() => {
    return customers.slice(0, 10).reduce((sum, customer) => sum + (customer.totalSpent || 0) * (customer.discount / 100), 0);
  }, [customers]);

  const handleSubmitDiscount = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const created = await rewardsService.createDiscount(formData);
      setDiscounts((current) => [...current, created]);
      setShowNewDiscount(false);
      setFormData({ name: '', type: 'Percentage', value: '', conditions: 'All customers', usageLimit: '100' });
    } catch (error) {
      console.error('Failed to create discount', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    try {
      await rewardsService.deleteDiscount(id);
      setDiscounts((current) => current.filter((discount) => discount.id !== id));
    } catch (error) {
      console.error('Failed to delete discount', error);
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
            <Gift className="h-6 w-6 text-orange-500" />
            Rewards and Discounts
          </h1>
          <p className="text-slate-400">Persisted loyalty campaigns and top customer tiers from the backend.</p>
        </div>
        <button onClick={() => setShowNewDiscount(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          New Discount
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5 text-emerald-400" />} label="Loyalty Members" value={String(customers.length)} hint="Live customer tiers" />
        <StatCard icon={<Percent className="h-5 w-5 text-orange-400" />} label="Active Discounts" value={String(activeCount)} hint="Persisted campaigns" />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-purple-400" />} label="Estimated Revenue Lift" value={`$${estimatedRevenue.toFixed(0)}`} hint="From top customers" />
        <StatCard icon={<Star className="h-5 w-5 text-rose-400" />} label="Discounts Used" value={String(totalUsed)} hint="Recorded redemptions" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#13131a] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Percent className="h-5 w-5 text-orange-500" />
            Active Discount Campaigns
          </h2>
          <div className="space-y-3">
            {discounts.map((discount) => (
              <div key={discount.id} className={`rounded-lg border p-4 transition-all ${discount.active ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-white/5 bg-white/[0.02] opacity-70'}`}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{discount.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{discount.conditions}</p>
                  </div>
                  <button onClick={() => handleDeleteDiscount(discount.id)} className="rounded p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-orange-500/20 px-2 py-1 font-bold text-orange-400">{discount.value}</span>
                    <span className="text-slate-500">{discount.type}</span>
                  </div>
                  <span className="text-slate-400">{discount.used} uses</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#13131a] p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Crown className="h-5 w-5 text-orange-500" />
            Top Loyalty Customers
          </h2>
          <div className="space-y-3">
            {customers.map((customer) => (
              <motion.div key={customer.id || customer.phone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${tierColors[customer.tier]} text-white`}>
                      {tierIcons[customer.tier]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{customer.name}</h3>
                      <p className="text-xs text-slate-400">{customer.phone}</p>
                    </div>
                  </div>
                  <span className={`rounded-full bg-gradient-to-r px-2 py-1 text-xs font-bold text-white ${tierColors[customer.tier]}`}>{customer.tier}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>{customer.callCount} visits</span>
                    <span className="font-semibold text-emerald-400">{customer.discount}% off</span>
                  </div>
                  <span>Next tier in {customer.nextTierCalls}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showNewDiscount} onOpenChange={setShowNewDiscount}>
        <DialogContent className="border border-white/10 bg-[#13131a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-orange-500" />
              Create New Discount
            </DialogTitle>
            <DialogDescription className="text-slate-400">Add a discount campaign and persist it to the backend.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDiscount} className="mt-2 space-y-4">
            <Field label="Discount Name">
              <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" placeholder="e.g. Summer Special" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount Type">
                <select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none">
                  <option>Percentage</option>
                  <option>Fixed Amount</option>
                </select>
              </Field>
              <Field label={formData.type === 'Percentage' ? 'Value (%)' : 'Value ($)'}>
                <input required min="1" type="number" value={formData.value} onChange={(event) => setFormData({ ...formData, value: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
              </Field>
            </div>
            <Field label="Applicable Conditions">
              <select value={formData.conditions} onChange={(event) => setFormData({ ...formData, conditions: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none">
                {conditionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Usage Limit">
              <input required min="1" type="number" value={formData.usageLimit} onChange={(event) => setFormData({ ...formData, usageLimit: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
            </Field>
            <DialogFooter>
              <button type="button" onClick={() => setShowNewDiscount(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10">Cancel</button>
              <button type="submit" disabled={isSaving} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60">
                {isSaving ? 'Saving...' : 'Create Discount'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) => (
  <div className="rounded-xl border border-white/5 bg-[#13131a] p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="rounded-lg bg-white/5 p-2">{icon}</div>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Live</span>
    </div>
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-500">{hint}</p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-slate-300">
    <span className="mb-1 block">{label}</span>
    {children}
  </label>
);
