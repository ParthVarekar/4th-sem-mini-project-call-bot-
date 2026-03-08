import { ApiResponse, apiClient } from './apiClient';

export interface CallVolume {
  time: string;
  calls: number;
}

export interface PeakHours {
  day: string;
  morning: number;
  evening: number;
}

export interface OrderTrends {
  name: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsKPIs {
  totalCalls: number;
  completedCalls: number;
  avgCallDurationSeconds: number;
  linkedOrderRevenue: number;
}

export const analyticsService = {
  async fetchAnalyticsDashboard(): Promise<{
    volume: CallVolume[];
    peaks: PeakHours[];
    trends: OrderTrends[];
    kpis: AnalyticsKPIs;
  }> {
    const response = await apiClient.get<ApiResponse>('/api/analytics');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch analytics');
    }

    return {
      volume: response.data.data.volume || [],
      peaks: response.data.data.peaks || [],
      trends: response.data.data.trends || [],
      kpis: response.data.data.kpis,
    };
  },
};
