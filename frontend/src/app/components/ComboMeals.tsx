import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  UtensilsCrossed,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Edit,
  Star,
  CheckCircle,
  Package,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { comboService } from '../services/comboService';

interface ComboMeal {
  id: number;
  name: string;
  items: string[];
  price: number;
  discount: number;
  popularity: number;
  revenue: number;
  timesOrdered: number;
  targetAudience: string;
  active: boolean;
}



interface Customer {
  id: number;
  name: string;
  orders: number;
  suggestedCombo: string;
  orderHistory: string[];
  potentialRevenue: number;
}



export const ComboMeals: React.FC = () => {
  const [combos, setCombos] = useState<ComboMeal[]>([]);
  const [repeatCustomers, setRepeatCustomers] = useState<Customer[]>([]);
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

  React.useEffect(() => {
    async function loadCombos() {
      try {
        const data = await comboService.fetchComboData();
        setCombos(data.combos as any as ComboMeal[]);
        setRepeatCustomers(data.repeatCustomers as any as Customer[]);
        setAvailableMenuItems(data.availableItems || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCombos();
  }, []);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmitCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    const price = parseFloat(formData.price);
    const discount = parseInt(formData.discount) || 0;
    const mockRevenue = Math.round(price * (20 + Math.random() * 30));

    const newCombo: ComboMeal = {
      id: Date.now(),
      name: formData.name,
      items: selectedItems,
      price,
      discount,
      popularity: Math.round(50 + Math.random() * 40),
      revenue: mockRevenue,
      timesOrdered: 0,
      targetAudience: formData.targetAudience || 'All customers',
      active: true,
    };
    setCombos((prev) => [...prev, newCombo]);
    setShowNewCombo(false);
    setFormData({ name: '', price: '', discount: '', targetAudience: '' });
    setSelectedItems([]);
  };

  const calculateTotalRevenue = () => {
    return combos.reduce((sum, combo) => sum + combo.revenue, 0);
  };

  const calculateTotalOrders = () => {
    return combos.reduce((sum, combo) => sum + (combo.timesOrdered || 0), 0);
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
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Combo Meal Manager
          </h1>
          <p className="text-slate-400">Create and optimize combo deals for repeat customers</p>
        </div>
        <button
          onClick={() => setShowNewCombo(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Combo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-xs text-orange-400 font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{combos.length}</p>
          <p className="text-sm text-slate-400">Active Combos</p>
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
            <span className="text-xs text-emerald-400 font-medium">+22%</span>
          </div>
          <p className="text-2xl font-bold text-white">${(calculateTotalRevenue() / 1000).toFixed(1)}K</p>
          <p className="text-sm text-slate-400">Combo Revenue</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#13131a] border border-white/5 rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-purple-400 font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">{calculateTotalOrders()}</p>
          <p className="text-sm text-slate-400">Times Ordered</p>
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
            <span className="text-xs text-rose-400 font-medium">Avg</span>
          </div>
          <p className="text-2xl font-bold text-white">86%</p>
          <p className="text-sm text-slate-400">Customer Rating</p>
        </motion.div>
      </div>

      {/* Combo Meals Grid */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Active Combo Deals</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {combos.map((combo, idx) => (
            <motion.div
              key={combo.id || `combo-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">{combo.name}</h3>
                  <p className="text-xs text-slate-400">{combo.targetAudience}</p>
                </div>
                <button className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                {combo.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">${combo.price}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">
                    {combo.discount}% OFF
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{combo.timesOrdered} orders</p>
                  <p className="text-xs font-semibold text-emerald-400">${combo.revenue}</p>
                </div>
              </div>

              {/* Popularity Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Popularity</span>
                  <span className="text-xs font-semibold text-orange-400">{combo.popularity}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full"
                    style={{ width: `${combo.popularity}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Recommendations for Repeat Customers */}
      <div className="bg-[#13131a] border border-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          AI-Suggested Combos for Repeat Customers
        </h2>
        <div className="space-y-3">
          {repeatCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{customer.name}</h3>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                      {customer.orders} orders
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {customer.orderHistory.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white/5 text-slate-400 rounded text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    <span className="text-orange-400 font-medium">Suggested:</span> {customer.suggestedCombo}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Potential Revenue</p>
                    <p className="text-lg font-bold text-emerald-400">${customer.potentialRevenue}</p>
                  </div>
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Send Offer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-[#13131a] to-orange-950/30 rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-bold text-white mb-3">💡 Combo Optimization Tips</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>Customers who order 3+ items separately are 67% more likely to accept combo suggestions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>Family Feast performs best on Fridays and Saturdays between 6-8 PM</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>Offering 15-20% discount on combos increases conversion by 34% for repeat customers</span>
          </li>
        </ul>
      </div>

      {/* Create Combo Modal */}
      <Dialog open={showNewCombo} onOpenChange={setShowNewCombo}>
        <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Create New Combo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Build a combo meal from available menu items
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCombo} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Combo Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Weekend Special"
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Included Items</label>
              <div className="flex flex-wrap gap-2">
                {availableMenuItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedItems.includes(item)
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                  >
                    {selectedItems.includes(item) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>
              {selectedItems.length === 0 && (
                <p className="text-xs text-rose-400 mt-1">Select at least one item</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Price ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="19.99"
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="10"
                  className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Audience</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g. Families, Couples, Students"
                className="w-full px-3 py-2 bg-[#1c1c24] border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setShowNewCombo(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedItems.length === 0}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Combo
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
