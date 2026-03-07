import { apiClient, ApiResponse } from './apiClient';

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

export const analyticsService = {
    async fetchCallAnalytics(): Promise<{ volume: CallVolume[]; peaks: PeakHours[] }> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/analytics');
            if (response.data.status === 'success') {
                return {
                    volume: response.data.data.volume || [],
                    peaks: response.data.data.peaks || [],
                };
            }
            throw new Error(response.data.message || 'Failed to fetch analytics');
        } catch (error) {
            console.error('Failed to fetch call analytics, using fallback data.', error);
            // Fallback data
            return {
                volume: [
                    { time: '08:00', calls: 12 }, { time: '10:00', calls: 45 },
                    { time: '12:00', calls: 89 }, { time: '14:00', calls: 67 },
                    { time: '16:00', calls: 34 }, { time: '18:00', calls: 95 },
                    { time: '20:00', calls: 110 }, { time: '22:00', calls: 56 },
                ],
                peaks: [
                    { day: 'Mon', morning: 40, evening: 90 }, { day: 'Tue', morning: 30, evening: 85 },
                    { day: 'Wed', morning: 50, evening: 95 }, { day: 'Thu', morning: 45, evening: 100 },
                    { day: 'Fri', morning: 60, evening: 120 }, { day: 'Sat', morning: 80, evening: 140 },
                    { day: 'Sun', morning: 70, evening: 110 },
                ]
            };
        }
    },

    async fetchOrderTrends(): Promise<OrderTrends[]> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/analytics');
            if (response.data.status === 'success') {
                return response.data.data.trends || [];
            }
            throw new Error(response.data.message || 'Failed to fetch trends');
        } catch (error) {
            console.error('Failed to fetch order trends, using fallback data.', error);
            return [
                { name: 'Week 1', orders: 150, revenue: 4500 },
                { name: 'Week 2', orders: 200, revenue: 5600 },
                { name: 'Week 3', orders: 180, revenue: 5100 },
                { name: 'Week 4', orders: 250, revenue: 6800 },
            ];
        }
    }
};
