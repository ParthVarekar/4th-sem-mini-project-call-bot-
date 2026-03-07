import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, TrendingUp, TrendingDown, Users, DollarSign, Calendar, ArrowRight, Zap, Target, Star, ChevronDown, BarChart3, Clock, UtensilsCrossed, X } from 'lucide-react';
import { ComboInsight } from './insights/ComboInsight';
import { RewardsInsight } from './insights/RewardsInsight';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { aiInsightsService, AIInsightsResponse } from '../services/aiInsightsService';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  impact: string;
  metric: string;
  icon: React.ReactNode;
  color: string;
  btnText: string;
  detailedData?: {
    stats?: { label: string; value: string; trend?: string }[];
    chart?: string;
    tips?: string[];
    action?: string;
  };
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: 'Suggest Combo Meals',
    description: 'During evening peak hours (6 PM - 9 PM), customers are 30% more likely to order combos. Enable auto-suggestion to boost revenue.',
    impact: 'High Impact',
    metric: '+15% Revenue',
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    color: 'bg-emerald-500/10 border-emerald-500/20',
    btnText: 'Enable Suggestion',
    detailedData: {
      stats: [
        { label: 'Peak Hours', value: '6-9 PM', trend: '+30%' },
        { label: 'Avg Order Value', value: '$42.50', trend: '+$8' },
        { label: 'Conversion Rate', value: '34%', trend: '+12%' }
      ],
      tips: [
        'Family combos perform best on weekends',
        'Suggest combo when customer orders 3+ individual items',
        'Lunch combos peak between 11 AM - 2 PM'
      ],
      action: 'combos'
    }
  },
  {
    id: 2,
    title: 'Repeat Customer Discount',
    description: 'Identify repeat callers (3+ calls/month) and offer a 10% loyalty discount to increase retention.',
    impact: 'Medium Impact',
    metric: '+22% Retention',
    icon: <Users className="w-5 h-5 text-orange-400" />,
    color: 'bg-orange-500/10 border-orange-500/20',
    btnText: 'Setup Discount',
    detailedData: {
      stats: [
        { label: 'Repeat Customers', value: '248', trend: '+18%' },
        { label: 'Avg Lifetime Value', value: '$842', trend: '+$127' },
        { label: 'Redemption Rate', value: '67%', trend: '+9%' }
      ],
      tips: [
        'Send personalized discount codes via SMS',
        'Tier discounts: 5% (Bronze), 10% (Silver), 15% (Gold)',
        'Offer birthday rewards to increase engagement'
      ],
      action: 'rewards'
    }
  },
  {
    id: 3,
    title: 'Optimize Staffing',
    description: 'Call volume drops significantly on Tuesdays between 2 PM - 4 PM. Consider reducing staff during this window.',
    impact: 'Cost Saving',
    metric: '-$400/mo Costs',
    icon: <DollarSign className="w-5 h-5 text-amber-400" />,
    color: 'bg-amber-500/10 border-amber-500/20',
    btnText: 'View Schedule',
    detailedData: {
      stats: [
        { label: 'Low Traffic Period', value: 'Tue 2-4 PM', trend: '-45%' },
        { label: 'Potential Savings', value: '$400/mo', trend: 'Cost Cut' },
        { label: 'Current Staff', value: '5 agents', trend: 'Reduce to 3' }
      ],
      tips: [
        'Peak hours: 12-1 PM and 6-8 PM daily',
        'Weekend evenings require +2 staff members',
        'Holiday periods see 40% increase in volume'
      ]
    }
  },
  {
    id: 4,
    title: 'Update Holiday Hours',
    description: 'Upcoming holiday detected. 45% of missed calls last year were inquiries about holiday opening times.',
    impact: 'Customer Sat',
    metric: '-15% Missed Calls',
    icon: <Calendar className="w-5 h-5 text-rose-400" />,
    color: 'bg-rose-500/10 border-rose-500/20',
    btnText: 'Update Hours',
    detailedData: {
      stats: [
        { label: 'Upcoming Holidays', value: '6 events', trend: 'Next: Feb 14' },
        { label: 'Missed Call Rate', value: '45%', trend: 'Holiday Related' },
        { label: 'Potential Revenue', value: '$25K', trend: 'From holidays' }
      ],
      tips: [
        'Update hours 2 weeks before major holidays',
        'Enable auto-response for holiday inquiries',
        'Promote special holiday menus proactively'
      ],
      action: 'holidays'
    }
  }
];

// --- Mock Full Report Data ---
const fullReportData = {
  monthlyCallVolume: [
    { month: 'Oct 2025', calls: 1820 },
    { month: 'Nov 2025', calls: 2150 },
    { month: 'Dec 2025', calls: 2480 },
    { month: 'Jan 2026', calls: 2340 },
    { month: 'Feb 2026', calls: 2690 },
  ],
  topCombos: [
    { name: 'Family Feast', orders: 412, revenue: '$17.7K' },
    { name: 'Date Night Special', orders: 287, revenue: '$17.2K' },
    { name: 'Lunch Express', orders: 634, revenue: '$8.2K' },
    { name: 'Game Day Bundle', orders: 198, revenue: '$13.9K' },
  ],
  revenueGrowth: { current: '$68.4K', previous: '$57.8K', growth: '+18.3%' },
  satisfaction: { score: 4.6, responses: 1284, nps: 72 },
};

type InsightView = 'main' | 'combo' | 'rewards';

export const Insights: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<InsightView>('main');
  const [showFullReport, setShowFullReport] = useState(false);
  const [insightsData, setInsightsData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadInsights() {
      try {
        const data = await aiInsightsService.fetchAIGrowthInsights();
        setInsightsData(data);
      } catch (error) {
        console.error("Failed to load AI insights", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInsights();
  }, []);

  const handleActionClick = (action?: string) => {
    if (action === 'combos') {
      setCurrentView('combo');
    } else if (action === 'rewards') {
      setCurrentView('rewards');
    } else if (action && onNavigate) {
      onNavigate(action);
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
  };

  // Show detailed views
  if (currentView === 'combo') {
    return <ComboInsight onBack={handleBackToMain} />;
  }

  if (currentView === 'rewards') {
    return <RewardsInsight onBack={handleBackToMain} />;
  }

  const dynamicRecommendations = React.useMemo(() => {
    const baseRecs = [...recommendations];
    if (!insightsData?.structured_insights) return baseRecs;

    // Inject dynamic data into the hardcoded templates
    const combos = insightsData.structured_insights.filter(i => i.type === 'combo');
    const peakHours = insightsData.structured_insights.filter(i => i.type === 'peak_hour');
    const popularItems = insightsData.structured_insights.filter(i => i.type === 'popular_item');

    if (combos.length > 0) {
      baseRecs[0].description = `AI suggests combining ${combos[0].items?.join(' and ')} to boost your AOV.`;
      baseRecs[0].detailedData!.stats![0].value = `${Math.round((combos[0].confidence || 0) * 100)}% Conversion`;
    }

    if (peakHours.length > 0) {
      const topPeak = peakHours.reduce((a, b) => (a.order_count || 0) > (b.order_count || 0) ? a : b);
      baseRecs[2].description = `Peak traffic detected at ${topPeak.hour}:00 with ${topPeak.order_count} orders. Optimize your kitchen staffing for this period.`;
      baseRecs[2].detailedData!.stats![0].value = `${topPeak.hour}:00 Peak`;
    }

    return baseRecs;
  }, [insightsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Zap className="w-8 h-8 text-orange-500 animate-pulse fill-orange-500" />
          <p className="text-slate-400 font-medium">Generating AI Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500 fill-orange-500" />
            Growth Insights
          </h1>
          <p className="text-slate-400">AI-driven recommendations to grow your business.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-[#1c1c24] px-3 py-1.5 rounded-full border border-white/5 shadow-sm">
          <Target className="w-4 h-4 text-orange-500" />
          <span>Goal: Maximize Revenue</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dynamicRecommendations.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-xl border ${item.color} shadow-sm hover:bg-white/5 transition-all relative overflow-hidden`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#18181b] p-2 rounded-lg shadow-sm border border-white/5">
                {item.icon}
              </div>
              <span className="px-2.5 py-1 bg-[#18181b] rounded-full text-xs font-semibold text-slate-300 border border-white/5">
                {item.impact}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {item.description}
            </p>

            <div className="flex items-center justify-between mt-auto mb-4">
              <div className="flex items-center gap-1.5 text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                {item.metric.includes('+') ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
                {item.metric}
              </div>
              <button
                onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                className="flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors group"
              >
                {expandedCard === item.id ? 'Hide Details' : 'View Details'}
                <ChevronDown className={`w-4 h-4 transform transition-transform ${expandedCard === item.id ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Expandable Details */}
            <AnimatePresence>
              {expandedCard === item.id && item.detailedData && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    {/* Stats Grid */}
                    {item.detailedData.stats && (
                      <div className="grid grid-cols-3 gap-3">
                        {item.detailedData.stats.map((stat, i) => (
                          <div key={i} className="bg-[#18181b] p-3 rounded-lg border border-white/5">
                            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                            <p className="text-sm font-bold text-white">{stat.value}</p>
                            {stat.trend && (
                              <p className="text-xs text-emerald-400 mt-1">{stat.trend}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tips */}
                    {item.detailedData.tips && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quick Tips</p>
                        {item.detailedData.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    {item.detailedData.action && (
                      <button
                        onClick={() => handleActionClick(item.detailedData?.action)}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {item.btnText}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* AI Summary Section */}
      <div className="bg-gradient-to-br from-[#13131a] to-orange-950/30 rounded-xl p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Star className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-orange-500 rounded-md">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <span className="text-orange-200 text-sm font-medium uppercase tracking-wider">AI Monthly Summary</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">You're doing great! 🚀</h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            {insightsData?.recommendations
              ? insightsData.recommendations
              : `Based on last month's data, your restaurant has improved call handling efficiency by `}
            {!insightsData?.recommendations && <span className="text-white font-bold">18%</span>}
            {!insightsData?.recommendations && `. Implementing the "Combo Meals" suggestion could add an estimated `}
            {!insightsData?.recommendations && <span className="text-white font-bold">$1,200</span>}
            {!insightsData?.recommendations && ` to your monthly revenue.`}
          </p>
          <button
            onClick={() => setShowFullReport(true)}
            className="bg-white text-orange-900 px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg"
          >
            View Full Report
          </button>
        </div>
      </div>

      {/* Full Report Modal */}
      <Dialog open={showFullReport} onOpenChange={setShowFullReport}>
        <DialogContent className="bg-[#13131a] border border-white/10 text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              AI Monthly Performance Report
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Comprehensive analytics for your restaurant operations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Monthly Call Volume */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" /> Monthly Call Volume
              </h4>
              <div className="space-y-2">
                {fullReportData.monthlyCallVolume.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20">{m.month}</span>
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                        style={{ width: `${(m.calls / 3000) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white w-12 text-right">{m.calls.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Combos */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" /> Top Performing Combos
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {fullReportData.topCombos.map((c, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{c.orders} orders</p>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{c.revenue}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Growth */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-400" /> Revenue Growth
              </h4>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{fullReportData.revenueGrowth.current}</p>
                  <p className="text-xs text-slate-400 mt-1">vs {fullReportData.revenueGrowth.previous} last month</p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-bold">
                  {fullReportData.revenueGrowth.growth}
                </span>
              </div>
            </div>

            {/* Customer Satisfaction */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-400" /> Customer Satisfaction
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-400">{fullReportData.satisfaction.score}</p>
                  <p className="text-xs text-slate-400 mt-1">Avg Rating</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{fullReportData.satisfaction.responses.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">Responses</p>
                </div>
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-400">{fullReportData.satisfaction.nps}</p>
                  <p className="text-xs text-slate-400 mt-1">NPS Score</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
