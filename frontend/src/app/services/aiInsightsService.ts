import { apiClient, ApiResponse } from './apiClient';

export interface AIInsight {
    type: 'combo' | 'peak_hour' | 'popular_item' | 'avg_order_value' | 'busiest_day';
    // Base properties and dynamic depending on type
    items?: string[];
    support?: number;
    confidence?: number;
    hour?: number;
    order_count?: number;
    item?: string;
    value?: number;
    day?: string;
}

export interface AIInsightsResponse {
    source: string;
    status: string;
    recommendations: string;
    structured_insights: AIInsight[];
}

export const aiInsightsService = {
    async fetchAIGrowthInsights(): Promise<AIInsightsResponse | null> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/ai/insights');
            if (response.data.status === 'success') {
                return response.data.data as AIInsightsResponse;
            }
            // In case the API returns the raw object directly
            const rawData = response.data as any;
            if (rawData.source && rawData.structured_insights) {
                return rawData as AIInsightsResponse;
            }
            throw new Error(response.data.message || 'Failed to fetch AI insights');
        } catch (error) {
            console.error('Failed to fetch AI insights. AI Recommendations will not be fully populated until backend is available.', error);
            return null;
        }
    }
};
