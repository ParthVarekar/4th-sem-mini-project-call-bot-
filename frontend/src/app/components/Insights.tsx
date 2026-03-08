import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Lightbulb, Loader2, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';

import { aiInsightsService, AIInsight, AIInsightsResponse } from '../services/aiInsightsService';

interface RecommendationCard {
  id: string;
  title: string;
  description: string;
  metric: string;
  tone: 'up' | 'down' | 'neutral';
  action?: string;
}

const formatInsightLabel = (label?: string): string => {
  if (!label) {
    return 'This item';
  }

  const trimmed = label.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.join(' and ');
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

const formatRecommendation = (insight: AIInsight, index: number): RecommendationCard => {
  switch (insight.type) {
    case 'combo':
      return {
        id: `combo-${index}`,
        title: 'Promote a Combo Opportunity',
        description: `Customers frequently pair ${insight.items?.join(' and ')}. This is a strong bundle candidate for higher order value.`,
        metric: `${Math.round((insight.confidence || 0) * 100)}% confidence`,
        tone: 'up',
        action: 'combos',
      };
    case 'peak_hour':
      return {
        id: `peak-${index}`,
        title: 'Staff Around Peak Demand',
        description: `Order pressure spikes around ${insight.hour}:00 with about ${insight.order_count} orders. Prep and staffing should shift earlier.`,
        metric: `${insight.order_count} orders`,
        tone: 'up',
        action: 'analytics',
      };
    case 'popular_item':
      return {
        id: `popular-${index}`,
        title: 'Lean Into Best Sellers',
        description: `${formatInsightLabel(insight.item)} is outperforming the rest of the menu. Feature it in promotions and up-sell paths.`,
        metric: `${insight.order_count} orders`,
        tone: 'up',
        action: 'dashboard',
      };
    case 'avg_order_value':
      return {
        id: `aov-${index}`,
        title: 'Protect Margin and Ticket Size',
        description: `Average order value is sitting around $${insight.value}. Small combo and dessert nudges could lift this further.`,
        metric: `$${insight.value}`,
        tone: 'neutral',
        action: 'combos',
      };
    case 'busiest_day':
      return {
        id: `day-${index}`,
        title: 'Plan for Your Busiest Day',
        description: `${insight.day} consistently carries the heaviest load with ${insight.order_count} orders. Coordinate staffing and promotions around it.`,
        metric: insight.day || 'High demand',
        tone: 'up',
        action: 'holidays',
      };
    default:
      return {
        id: `generic-${index}`,
        title: 'Review Latest Insight',
        description: 'A fresh recommendation is available from the backend insight cache.',
        metric: 'Live data',
        tone: 'neutral',
      };
  }
};

export const Insights: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [insightsData, setInsightsData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        setInsightsData(await aiInsightsService.fetchAIGrowthInsights());
      } catch (error) {
        console.error('Failed to load AI insights', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadInsights();
  }, []);

  const recommendations = useMemo(() => {
    if (!insightsData?.structured_insights?.length) {
      return [];
    }
    return insightsData.structured_insights.slice(0, 6).map((insight, index) => formatRecommendation(insight, index));
  }, [insightsData]);

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Zap className="h-8 w-8 animate-pulse fill-orange-500 text-orange-500" />
          <p className="font-medium text-slate-400">Generating AI Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Zap className="h-6 w-6 fill-orange-500 text-orange-500" />
            Growth Insights
          </h1>
          <p className="text-slate-400">Live recommendations generated from the backend insight cache.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#1c1c24] px-3 py-1.5 text-sm text-slate-400 shadow-sm">
          <Target className="h-4 w-4 text-orange-500" />
          <span>Goal: Maximize Revenue</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {recommendations.map((card, index) => (
          <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="rounded-xl border border-white/10 bg-[#13131a] p-6 shadow-sm transition-all hover:bg-white/5">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg border border-white/5 bg-[#18181b] p-2">
                {card.tone === 'down' ? <TrendingDown className="h-5 w-5 text-rose-400" /> : <TrendingUp className="h-5 w-5 text-emerald-400" />}
              </div>
              <span className="rounded-full border border-white/5 bg-[#18181b] px-2.5 py-1 text-xs font-semibold text-slate-300">Live signal</span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">{card.title}</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{card.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-sm font-bold text-white">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                {card.metric}
              </div>
              {card.action && onNavigate ? (
                <button onClick={() => onNavigate(card.action!)} className="flex items-center gap-2 text-sm font-medium text-orange-500 transition-colors hover:text-orange-400">
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#13131a] to-orange-950/30 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-orange-500 p-1.5">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium uppercase tracking-wider text-orange-200">AI Monthly Summary</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold">Summary from the latest recommendation cache</h2>
          <p className="text-lg leading-relaxed text-slate-300">
            {insightsData?.recommendations || 'No recommendation summary is available yet. Run the AI training pipeline to refresh the cache.'}
          </p>
        </div>
      </div>
    </div>
  );
};
