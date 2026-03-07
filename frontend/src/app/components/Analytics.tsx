import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Calendar, Filter, Download, Loader2 } from 'lucide-react';
import { analyticsService, CallVolume, PeakHours, OrderTrends } from '../services/analyticsService';

export const Analytics: React.FC = () => {
  const [volumeData, setVolumeData] = useState<CallVolume[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<PeakHours[]>([]);
  const [orderTrendsData, setOrderTrendsData] = useState<OrderTrends[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, trendsRes] = await Promise.all([
          analyticsService.fetchCallAnalytics(),
          analyticsService.fetchOrderTrends()
        ]);
        setVolumeData(analyticsRes.volume);
        setPeakHoursData(analyticsRes.peaks);
        setOrderTrendsData(trendsRes);
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportReport = () => {
    const today = new Date().toISOString().split('T')[0];
    let csv = '';

    // Section 1: Daily Call Volume
    csv += 'Daily Call Volume (Hourly)\n';
    csv += 'Time,Calls\n';
    volumeData.forEach((row) => {
      csv += `${row.time},${row.calls}\n`;
    });
    csv += '\n';

    // Section 2: Peak Hours Comparison
    csv += 'Peak Hours: Morning vs Evening\n';
    csv += 'Day,Morning Shift,Evening Shift\n';
    peakHoursData.forEach((row) => {
      csv += `${row.day},${row.morning},${row.evening}\n`;
    });
    csv += '\n';

    // Section 3: Order Value Trends
    csv += 'Order Value Trends\n';
    csv += 'Period,Orders,Revenue ($)\n';
    orderTrendsData.forEach((row) => {
      csv += `${row.name},${row.orders},${row.revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChefAI_Call_Analytics_Report_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Analytics</h1>
          <p className="text-slate-400">Insights into your restaurant's communication patterns.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-2 bg-[#1c1c24] border border-white/5 rounded-lg text-sm font-medium text-slate-300 shadow-sm hover:bg-white/5 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>This Month</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-[#1c1c24] border border-white/5 rounded-lg text-sm font-medium text-slate-300 shadow-sm hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-600 border border-transparent rounded-lg text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Volume Chart */}
      <div className="bg-[#13131a] p-6 rounded-xl border border-white/5 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">Daily Call Volume (Hourly)</h3>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #27272a', backgroundColor: '#09090b', color: '#fff' }}
              />
              <Area type="monotone" dataKey="calls" stroke="#f97316" fillOpacity={1} fill="url(#colorCalls)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Comparison */}
        <div className="bg-[#13131a] p-6 rounded-xl border border-white/5 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Peak Hours: Morning vs Evening</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
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

        {/* Order Trends */}
        <div className="bg-[#13131a] p-6 rounded-xl border border-white/5 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Order Value Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderTrendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
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
