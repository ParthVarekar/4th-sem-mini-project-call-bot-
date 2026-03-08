import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, DollarSign, Loader2, Package, Plus, Star, TrendingUp, Users } from 'lucide-react';

import { comboService, ComboMeal, ComboPayload, RepeatCustomer } from '../services/comboService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';

export const ComboMeals: React.FC = () => {
  const [combos, setCombos] = useState<ComboMeal[]>([]);
  const [repeatCustomers, setRepeatCustomers] = useState<RepeatCustomer[]>([]);
  const [availableMenuItems, setAvailableMenuItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCombo, setShowNewCombo] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    targetAudience: '',
  });

  useEffect(() => {
    async function loadCombos() {
      try {
        const data = await comboService.fetchComboData();
        setCombos(data.combos);
        setRepeatCustomers(data.repeatCustomers);
        setAvailableMenuItems(data.availableItems || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCombos();
  }, []);

  const totalRevenue = useMemo(() => combos.reduce((sum, combo) => sum + combo.revenue, 0), [combos]);
  const totalOrders = useMemo(() => combos.reduce((sum, combo) => sum + combo.timesOrdered, 0), [combos]);
  const averagePopularity = useMemo(() => {
    if (!combos.length) return 0;
    return Math.round(combos.reduce((sum, combo) => sum + combo.popularity, 0) / combos.length);
  }, [combos]);

  const toggleItem = (item: string) => {
    setSelectedItems((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  };

  const handleSubmitCombo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedItems.length) return;

    const payload: ComboPayload = {
      name: formData.name,
      items: selectedItems,
      price: parseFloat(formData.price),
      discount: parseInt(formData.discount || '0', 10),
      targetAudience: formData.targetAudience || 'All customers',
      active: true,
    };

    try {
      const combo = await comboService.saveCombo(payload);
      setCombos((current) => [...current.filter((entry) => entry.id !== combo.id), combo].sort((left, right) => left.id - right.id));
      setShowNewCombo(false);
      setSelectedItems([]);
      setFormData({ name: '', price: '', discount: '', targetAudience: '' });
    } catch (error) {
      console.error('Failed to save combo', error);
    }
  };

  const handleToggleCombo = async (combo: ComboMeal) => {
    try {
      const updated = await comboService.saveCombo({ ...combo, active: !combo.active });
      setCombos((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) {
      console.error('Failed to update combo', error);
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
            <Package className="h-6 w-6 text-orange-500" />
            Combo Meal Manager
          </h1>
          <p className="text-slate-400">Persisted combo bundles plus AI suggestions for your best repeat customers.</p>
        </div>
        <button onClick={() => setShowNewCombo(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600">
          <Plus className="h-4 w-4" />
          Create Combo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard icon={<Package className="h-5 w-5 text-orange-400" />} label="Active Combos" value={String(combos.filter((combo) => combo.active).length)} />
        <StatCard icon={<DollarSign className="h-5 w-5 text-emerald-400" />} label="Combo Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}K`} />
        <StatCard icon={<Users className="h-5 w-5 text-purple-400" />} label="Times Ordered" value={String(totalOrders)} />
        <StatCard icon={<Star className="h-5 w-5 text-rose-400" />} label="Avg Popularity" value={`${averagePopularity}%`} />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#13131a] p-6">
        <h2 className="mb-4 text-lg font-bold text-white">Active Combo Deals</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {combos.map((combo) => (
            <motion.div key={combo.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{combo.name}</h3>
                  <p className="text-xs text-slate-400">{combo.targetAudience}</p>
                </div>
                <button onClick={() => handleToggleCombo(combo)} className={`rounded-full px-3 py-1 text-xs font-medium ${combo.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                  {combo.active ? 'Active' : 'Paused'}
                </button>
              </div>

              <div className="mb-4 space-y-1.5">
                {combo.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">${combo.price.toFixed(2)}</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">{combo.discount}% OFF</span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{combo.timesOrdered} orders</p>
                  <p className="font-semibold text-emerald-400">${combo.revenue}</p>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Popularity</span>
                  <span className="font-semibold text-orange-400">{combo.popularity}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${combo.popularity}%` }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#13131a] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          AI-Suggested Combos for Repeat Customers
        </h2>
        <div className="space-y-3">
          {repeatCustomers.map((customer) => (
            <div key={customer.id} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="font-semibold text-white">{customer.name}</h3>
                    <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">{customer.orders} orders</span>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {customer.orderHistory.map((item) => (
                      <span key={item} className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">{item}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400"><span className="font-medium text-orange-400">Suggested:</span> {customer.suggestedCombo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Potential Revenue</p>
                  <p className="text-lg font-bold text-emerald-400">${customer.potentialRevenue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showNewCombo} onOpenChange={setShowNewCombo}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/10 bg-[#13131a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5 text-orange-500" />
              Create New Combo
            </DialogTitle>
            <DialogDescription className="text-slate-400">Build a combo meal and persist it through the backend.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCombo} className="mt-2 space-y-4">
            <Field label="Combo Name">
              <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" placeholder="e.g. Weekend Special" />
            </Field>

            <Field label="Included Items">
              <div className="flex flex-wrap gap-2">
                {availableMenuItems.map((item) => (
                  <button key={item} type="button" onClick={() => toggleItem(item)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${selectedItems.includes(item) ? 'border-orange-500/40 bg-orange-500/20 text-orange-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                    {selectedItems.includes(item) ? <CheckCircle className="mr-1 inline h-3 w-3" /> : null}
                    {item}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)">
                <input required min="1" step="0.01" type="number" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
              </Field>
              <Field label="Discount (%)">
                <input min="0" max="50" type="number" value={formData.discount} onChange={(event) => setFormData({ ...formData, discount: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none" />
              </Field>
            </div>

            <Field label="Target Audience">
              <input value={formData.targetAudience} onChange={(event) => setFormData({ ...formData, targetAudience: event.target.value })} className="w-full rounded-lg border border-white/10 bg-[#1c1c24] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-orange-500/50 focus:outline-none" placeholder="e.g. Families or students" />
            </Field>

            <DialogFooter>
              <button type="button" onClick={() => setShowNewCombo(false)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10">Cancel</button>
              <button type="submit" disabled={!selectedItems.length} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">Create Combo</button>
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
