import React, { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowDown, ArrowUp, DollarSign, Lightbulb, Loader2, Package, ShoppingBag, Truck } from 'lucide-react';

import { ordersService, DashboardKPIs, MenuPerformanceItem, PantryStat, RegionalActivity, WeeklyOrder, SentimentData } from '../services/ordersService';
import { aiInsightsService, AIInsight } from '../services/aiInsightsService';
import { LoyaltyCustomer, rewardsService } from '../services/rewardsService';
import { FrequentCustomerTracker } from './FrequentCustomerTracker';

const COLORS = ['#f97316', '#0ea5e9', '#94a3b8'];

export const Dashboard: React.FC = () => {
  const [weeklyOrdersData, setWeeklyOrdersData] = useState<WeeklyOrder[]>([]);
  const [regionData, setRegionData] = useState<RegionalActivity[]>([]);
  const [topLoyaltyCustomers, setTopLoyaltyCustomers] = useState<LoyaltyCustomer[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [pantryBreakdown, setPantryBreakdown] = useState<PantryStat[]>([]);
  const [menuPerformance, setMenuPerformance] = useState<MenuPerformanceItem[]>([]);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [sentimentError, setSentimentError] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardData, rewardsData, sentimentData, insightsData] = await Promise.all([
          ordersService.fetchDashboardStats(),
          rewardsService.fetchRewardsData(),
          ordersService.fetchSentiment().catch(() => null),
          aiInsightsService.fetchAIGrowthInsights().catch(() => null)
        ]);

        setWeeklyOrdersData(dashboardData.weeklyOrders);
        setRegionData(dashboardData.regionalActivity);
        setPantryBreakdown(dashboardData.pantryBreakdown);
        setMenuPerformance(dashboardData.menuPerformance);
        setKpis(dashboardData.kpis);
        setTopLoyaltyCustomers(rewardsData.customers.slice(0, 3));
        setSentiment(sentimentData);
        if (insightsData?.structured_insights) {
          setInsights(insightsData.structured_insights);
        }
        if (!sentimentData) setSentimentError(true);
      } catch (error) {
        console.error('Dashboard data load failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const strongestChannel = [...regionData].sort((left, right) => right.value - left.value)[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Restaurant Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">Live sales, pantry, and customer activity from your backend data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<ShoppingBag className="h-5 w-5 text-orange-400" />}
          label="Weekly Orders"
          value={String(kpis?.totalOrders || 0)}
          subtitle="Last 7 days"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
          label="Weekly Revenue"
          value={`$${(kpis?.totalRevenue || 0).toFixed(2)}`}
          subtitle="Tracked order revenue"
        />
        <MetricCard
          icon={<Package className="h-5 w-5 text-sky-400" />}
          label="Average Order"
          value={`$${(kpis?.avgOrderValue || 0).toFixed(2)}`}
          subtitle="Average ticket size"
        />
        <MetricCard
          icon={<Truck className="h-5 w-5 text-violet-400" />}
          label="Delivery Mix"
          value={`${kpis?.deliveryPercentage || 0}%`}
          subtitle={`${kpis?.takeoutPercentage || 0}% takeout`}
        />
        
        {sentimentError || !sentiment ? (
          <div className="rounded-2xl border border-white/5 bg-[#13131a] p-5 shadow-xl flex items-center justify-center">
            <p className="text-sm text-slate-500">No sentiment data available</p>
          </div>
        ) : (
          <MetricCard
            icon={<Activity className={`h-5 w-5 ${sentiment.score > 0 ? "text-emerald-400" : sentiment.score < 0 ? "text-rose-400" : "text-yellow-400"}`} />}
            label="Customer Sentiment"
            value={`${(Math.abs(sentiment.score) * 100).toFixed(0)}%`}
            valueColor={sentiment.score > 0 ? "text-emerald-400" : sentiment.score < 0 ? "text-rose-400" : "text-yellow-400"}
            subtitle={
              <div className="flex items-center gap-1">
                {sentiment.trend === "up" ? <ArrowUp className="h-3 w-3 text-emerald-500" /> : 
                 sentiment.trend === "down" ? <ArrowDown className="h-3 w-3 text-rose-500" /> : null}
                <span className={sentiment.trend === "up" ? "text-emerald-500" : sentiment.trend === "down" ? "text-rose-500" : "text-yellow-500"}>
                  {sentiment.trend.charAt(0).toUpperCase() + sentiment.trend.slice(1)} ({sentiment.positive}pos, {sentiment.negative}neg)
                </span>
              </div>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#13131a] p-6 shadow-xl lg:col-span-2">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Weekly Orders</h3>
          {insights.find(i => i.type === 'busiest_day') && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-200">
              <Lightbulb className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              <p><strong>AI Insight:</strong> {insights.find(i => i.type === 'busiest_day')?.day} is historically your busiest day, driving about {insights.find(i => i.type === 'busiest_day')?.order_count} orders. Optimize prep levels for this volume.</p>
            </div>
          )}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyOrdersData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#18181b' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }}
                />
                <Bar dataKey="orders" fill="#f97316" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-3xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Order Mix</h3>
          <div className="relative flex flex-1 items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={regionData} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={4} stroke="none">
                  {regionData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {strongestChannel ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-white">{strongestChannel.value}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{strongestChannel.name}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {regionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Top Loyalty Customers</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {topLoyaltyCustomers.map((customer) => (
            <FrequentCustomerTracker key={customer.id || customer.phone} customer={customer} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Pantry Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            {pantryBreakdown.map((item, index) => (
              <PantryItem key={item.label} label={item.label} value={item.value} index={index} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-500">Menu Performance</h3>
          {insights.find(i => i.type === 'popular_item') && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <Lightbulb className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p><strong>AI Insight:</strong> {JSON.parse(insights.find(i => i.type === 'popular_item')?.item || '[]').join(' & ')} is currently trending with {insights.find(i => i.type === 'popular_item')?.order_count} recent orders. Ensure ingredients are stocked.</p>
            </div>
          )}
          <div className="space-y-4">
            {menuPerformance.map((item) => (
              <MenuItem key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, subtitle, valueColor = "text-white" }: { icon: React.ReactNode; label: string; value: string; subtitle: React.ReactNode | string; valueColor?: string }) => (
  <div className="rounded-2xl border border-white/5 bg-[#13131a] p-5 shadow-xl">
    <div className="mb-4 flex items-center justify-between">
      <div className="rounded-xl bg-white/5 p-3">{icon}</div>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Live</span>
    </div>
    <p className="text-sm text-slate-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value.includes("-") ? value : (valueColor === "text-rose-400" ? `-${value}` : value)}</p>
    <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
  </div>
);

const PantryItem = ({ label, value, index }: { label: string; value: number; index: number }) => {
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-emerald-500', 'bg-blue-500'];
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1c1c24] p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <div className="mb-2 mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}%</span>
        <span className="pb-1 text-[10px] uppercase tracking-wide text-slate-500">stock ready</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#27272a]">
        <div className={`h-full rounded-full ${colors[index % colors.length]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const MenuItem = ({ item }: { item: MenuPerformanceItem }) => (
  <div className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-white/5">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-sm font-bold text-orange-400">
        {item.name.charAt(0)}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white">{item.name}</h4>
        <p className="text-xs text-slate-500">{item.category}</p>
      </div>
    </div>
    <div className="text-right">
      <span className="block text-sm font-bold text-white">{item.count}</span>
      <span className="text-[10px] text-slate-500">Orders</span>
    </div>
  </div>
);
