import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, BarChart3, Lightbulb, Target, TrendingDown, TrendingUp, Zap,
  X, ShoppingBag, Users, AlertTriangle, Rocket, Settings2, Heart
} from 'lucide-react';

import { aiInsightsService, AIInsightsResponse, InsightCard } from '../services/aiInsightsService';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  combo: { icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  operations: { icon: Settings2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  loyalty: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  product: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  issue: { icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  growth: { icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
};

export const Insights: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [insightsData, setInsightsData] = useState<AIInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<InsightCard | null>(null);

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

  const cards: InsightCard[] = useMemo(() => {
    if (insightsData?.insight_cards?.length) {
      return insightsData.insight_cards.slice(0, 6);
    }
    // Fallback: build cards from structured_insights
    if (insightsData?.structured_insights?.length) {
      return insightsData.structured_insights.slice(0, 6).map((ins, i) => {
        switch (ins.type) {
          case 'combo':
            return { title: `Bundle ${ins.items?.join(' + ')}`, category: 'combo' as const, description: `Customers frequently order ${ins.items?.join(' and ')} together. Create a combo deal to boost order value.`, metric: `${Math.round((ins.confidence || 0) * 100)}% confidence` };
          case 'peak_hour':
            return { title: `Staff Up at ${ins.hour}:00`, category: 'operations' as const, description: `Peak ordering hour has ${ins.order_count} orders. Ensure full staff coverage.`, metric: `${ins.order_count} orders` };
          case 'popular_item':
            return { title: `Promote ${ins.item}`, category: 'product' as const, description: `'${ins.item}' is a top performer with ${ins.order_count} orders.`, metric: `${ins.order_count} orders` };
          case 'avg_order_value':
            return { title: 'Increase Average Order', category: 'growth' as const, description: `Average order value is $${ins.value}. Add-on suggestions at checkout can lift this.`, metric: `$${ins.value}` };
          case 'busiest_day':
            return { title: `Plan for ${ins.day}`, category: 'operations' as const, description: `${ins.day} is the busiest day with ${ins.order_count} orders.`, metric: `${ins.order_count} orders` };
          default:
            return { title: 'Review Insight', category: 'growth' as const, description: 'A recommendation is available.', metric: 'Live' };
        }
      });
    }
    return [];
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <Zap className="h-6 w-6 fill-orange-500 text-orange-500" />
            Growth Insights
          </h1>
          <p className="text-slate-400">AI-powered recommendations across combos, operations, loyalty, and growth.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#1c1c24] px-3 py-1.5 text-sm text-slate-400 shadow-sm">
          <Target className="h-4 w-4 text-orange-500" />
          <span>Source: {insightsData?.source || 'unknown'}</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const config = CATEGORY_CONFIG[card.category] || CATEGORY_CONFIG.growth;
          const Icon = config.icon;
          return (
            <motion.div
              key={`${card.category}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => setExpandedCard(card)}
              className={`cursor-pointer rounded-xl border ${config.border} bg-[#13131a] p-5 shadow-sm transition-all hover:scale-[1.02] hover:bg-white/5`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-lg ${config.bg} p-2`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <span className={`rounded-full ${config.bg} ${config.color} border ${config.border} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider`}>
                  {card.category}
                </span>
              </div>
              <h3 className="mb-2 text-base font-bold text-white">{card.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-400 line-clamp-2">{card.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-sm font-bold text-white">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  {card.metric}
                </div>
                <span className="text-xs text-slate-500">Click to expand</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setExpandedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#13131a] p-8 shadow-2xl"
            >
              {(() => {
                const config = CATEGORY_CONFIG[expandedCard.category] || CATEGORY_CONFIG.growth;
                const Icon = config.icon;
                return (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${config.bg} p-2.5`}>
                          <Icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <span className={`rounded-full ${config.bg} ${config.color} border ${config.border} px-3 py-1 text-xs font-semibold uppercase tracking-wider`}>
                          {expandedCard.category}
                        </span>
                      </div>
                      <button onClick={() => setExpandedCard(null)} className="p-1.5 text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <h2 className="mb-4 text-xl font-bold text-white">{expandedCard.title}</h2>
                    <p className="mb-6 text-sm leading-relaxed text-slate-300">{expandedCard.description}</p>
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs text-slate-500">Key Metric</p>
                        <p className="text-lg font-bold text-white">{expandedCard.metric}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Monthly Summary */}
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
            {insightsData?.recommendations || 'No recommendation summary available. Run the AI training pipeline to refresh.'}
          </p>
        </div>
      </div>
    </div>
  );
};
