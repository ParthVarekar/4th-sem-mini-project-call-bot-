import React, { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Clock3, DollarSign, Lightbulb, Loader2, PhoneCall } from 'lucide-react';

import { analyticsService, AnalyticsKPIs, CallVolume, OrderTrends, PeakHours } from '../services/analyticsService';
import { aiInsightsService, AIInsight } from '../services/aiInsightsService';

export const Analytics: React.FC = () => {
  const [volumeData, setVolumeData] = useState<CallVolume[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<PeakHours[]>([]);
  const [orderTrendsData, setOrderTrendsData] = useState<OrderTrends[]>([]);
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analytics, insightsData] = await Promise.all([
          analyticsService.fetchAnalyticsDashboard(),
          aiInsightsService.fetchAIGrowthInsights().catch(() => null)
        ]);
        setVolumeData(analytics.volume);
        setPeakHoursData(analytics.peaks);
        setOrderTrendsData(analytics.trends);
        setKpis(analytics.kpis);
        if (insightsData?.structured_insights) {
          setInsights(insightsData.structured_insights);
        }
      } catch (error) {
        console.error('Failed to load analytics data', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Call Analytics</h1>
        <p className="text-slate-400">Live call volume, fulfillment timing, and revenue-linked call behavior.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<PhoneCall className="h-5 w-5 text-orange-400" />} label="Total Calls" value={String(kpis?.totalCalls || 0)} />
        <KpiCard icon={<Activity className="h-5 w-5 text-emerald-400" />} label="Completed Calls" value={String(kpis?.completedCalls || 0)} />
        <KpiCard icon={<Clock3 className="h-5 w-5 text-sky-400" />} label="Avg Duration" value={`${Math.round((kpis?.avgCallDurationSeconds || 0) / 60)} min`} />
        <KpiCard icon={<DollarSign className="h-5 w-5 text-violet-400" />} label="Linked Revenue" value={`$${(kpis?.linkedOrderRevenue || 0).toFixed(2)}`} />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
        <h3 className="mb-6 text-lg font-semibold text-white">Daily Call Volume (Hourly)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }} />
              <Area type="monotone" dataKey="calls" stroke="#f97316" fillOpacity={1} fill="url(#colorCalls)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-semibold text-white">Peak Hours: Morning vs Evening</h3>
          {insights.find(i => i.type === 'peak_hour') && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">
              <Lightbulb className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <p><strong>AI Insight:</strong> Absolute peak order volume forms exactly at {insights.find(i => i.type === 'peak_hour')?.hour}:00 with a sustained {insights.find(i => i.type === 'peak_hour')?.order_count} orders over time. Stage deliveries for this window.</p>
            </div>
          )}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar name="Morning Shift" dataKey="morning" fill="#fed7aa" radius={[4, 4, 0, 0]} />
                <Bar name="Evening Shift" dataKey="evening" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#13131a] p-6 shadow-xl">
          <h3 className="mb-6 text-lg font-semibold text-white">Order Value Trends</h3>
          {insights.find(i => i.type === 'avg_order_value') && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <Lightbulb className="mr-1 mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p><strong>AI Insight:</strong> Systemic Average Order Value is currently drifting at ${insights.find(i => i.type === 'avg_order_value')?.value?.toFixed(2)}. Suggest combos during initial call greeting to up-sell.</p>
            </div>
          )}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrendsData}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }} />
                <Legend iconType="circle" />
                <Line yAxisId="left" name="Orders" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" name="Revenue ($)" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/5 bg-[#13131a] p-5 shadow-xl">
    <div className="mb-3 flex items-center justify-between">
      <div className="rounded-lg bg-white/5 p-2">{icon}</div>
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Live</span>
    </div>
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-white">{value}</p>
  </div>
);
