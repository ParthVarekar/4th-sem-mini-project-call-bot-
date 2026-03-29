import { apiClient, ApiResponse } from './apiClient';

export interface AIInsight {
    type: 'combo' | 'peak_hour' | 'popular_item' | 'avg_order_value' | 'busiest_day';
    items?: string[];
    support?: number;
    confidence?: number;
    hour?: number;
    order_count?: number;
    item?: string;
    value?: number;
    day?: string;
}

export interface InsightCard {
    title: string;
    category: 'combo' | 'operations' | 'loyalty' | 'product' | 'issue' | 'growth';
    description: string;
    metric: string;
}

export interface AIInsightsResponse {
    source: string;
    status: string;
    recommendations: string;
    structured_insights: AIInsight[];
    insight_cards?: InsightCard[];
}

export const aiInsightsService = {
    async fetchAIGrowthInsights(): Promise<AIInsightsResponse | null> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/ai/insights');
            const rawData = response.data as any;
            if (rawData?.source && Array.isArray(rawData?.structured_insights)) {
                return rawData as AIInsightsResponse;
            }
            if (rawData?.status === 'success' && rawData?.data) {
                return rawData.data as AIInsightsResponse;
            }
            throw new Error(response.data.message || 'Failed to fetch AI insights');
        } catch (error) {
            console.error('Failed to fetch AI insights.', error);
            return null;
        }
    }
};
