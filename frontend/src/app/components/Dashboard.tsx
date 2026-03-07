import React, { useEffect, useState } from 'react';
import { Phone, PhoneMissed, DollarSign, Heart, TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal, Utensils, Truck, AlertCircle, Crown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FrequentCustomerTracker } from './FrequentCustomerTracker';
import { ordersService, WeeklyOrder, RegionalActivity, DashboardKPIs } from '../services/ordersService';
import { rewardsService, LoyaltyCustomer } from '../services/rewardsService';

const COLORS = ['#f97316', '#334155'];

export const Dashboard: React.FC = () => {
  const [weeklyOrdersData, setWeeklyOrdersData] = useState<WeeklyOrder[]>([]);
  const [regionData, setRegionData] = useState<RegionalActivity[]>([]);
  const [topLoyaltyCustomers, setTopLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, rewardsRes, kpiRes] = await Promise.all([
          ordersService.fetchWeeklyOrders(),
          rewardsService.fetchRewardsData(),
          ordersService.fetchDashboardKPIs()
        ]);
        setWeeklyOrdersData(ordersRes.weeklyOrders);
        setRegionData(ordersRes.regionalActivity);
        setTopLoyaltyCustomers(rewardsRes.customers.slice(0, 3));
        setKpis(kpiRes);
      } catch (error) {
        console.error("Dashboard data load failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Restaurant Analytics</h1>
          <p className="text-slate-400 mt-1 text-sm">Live Kitchen & Sales Performance</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-[#1c1c24] border border-white/5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Kitchen Live
          </div>
        </div>
      </div>

      {/* Top Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Orders Chart */}
        <div className="lg:col-span-2 bg-[#13131a] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="text-slate-500 hover:text-white cursor-pointer" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Weekly Orders</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#18181b' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Activity Donut */}
        <div className="bg-[#13131a] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f97316]"></div>
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Regional Activity</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-bold text-white block">{regionData.find(r => r.name === 'Dine-in')?.value || 0}%</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dine-in</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-xs text-slate-400">Dine-in: {regionData.find(r => r.name === 'Dine-in')?.value || 0}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-700"></div>
              <span className="text-xs text-slate-400">Delivery: {regionData.find(r => r.name === 'Delivery')?.value || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Loyalty Customers */}
      <div className="bg-[#13131a] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Loyalty Customers</h3>
          <Crown className="w-4 h-4 text-orange-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {topLoyaltyCustomers.map((customer, idx) => (
            <FrequentCustomerTracker key={idx} customer={customer} />
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pantry Breakdown */}
        <div className="bg-[#13131a] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pantry Breakdown</h3>
            <Utensils className="w-4 h-4 text-orange-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <PantryItem label="Vegetables" value={27} color="bg-rose-500" />
            <PantryItem label="Fruits" value={54} color="bg-orange-500" />
            <PantryItem label="Meat & Dairy" value={32} color="bg-emerald-500" />
            <PantryItem label="Dry Goods" value={59} color="bg-blue-500" />
          </div>
        </div>

        {/* Menu Performance */}
        <div className="bg-[#13131a] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Menu Performance</h3>
            <div className="flex gap-1">
              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded border border-orange-500/20">Top Selling</span>
            </div>
          </div>

          <div className="space-y-4">
            <MenuItem
              name="Caesar Salad"
              category="Starters"
              count={205}
              image="https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=100&h=100"
            />
            <MenuItem
              name="Truffle Burger"
              category="Mains"
              count={102}
              image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=100&h=100"
            />
            <MenuItem
              name="Spicy Wings"
              category="Appetizers"
              count={98}
              image="https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=100&h=100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PantryItem = ({ label, value, color }: any) => (
  <div className="bg-[#1c1c24] p-4 rounded-2xl border border-white/5">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <div className="flex items-end gap-2 mb-2">
      <span className="text-2xl font-bold text-white">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const MenuItem = ({ name, category, count, image }: any) => (
  <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group">
    <div className="flex items-center gap-3">
      <img src={image} alt={name} className="w-10 h-10 rounded-lg object-cover" />
      <div>
        <h4 className="text-sm font-semibold text-white group-hover:text-orange-500 transition-colors">{name}</h4>
        <p className="text-xs text-slate-500">{category}</p>
      </div>
    </div>
    <div className="text-right">
      <span className="text-sm font-bold text-white block">{count}</span>
      <span className="text-[10px] text-slate-500">Orders</span>
    </div>
  </div>
);
