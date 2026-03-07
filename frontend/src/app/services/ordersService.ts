import { apiClient, ApiResponse } from './apiClient';

export interface WeeklyOrder {
    name: string;
    orders: number;
}

export interface RegionalActivity {
    name: string;
    value: number;
}

export interface DashboardKPIs {
    totalOrders?: number;
    totalRevenue?: number;
    dineInPercentage?: number;
    avgOrderValue?: number;
}

export const ordersService = {
    async fetchDashboardKPIs(): Promise<DashboardKPIs> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/dashboard/stats');
            if (response.data.status === 'success') {
                return response.data.data.kpis || {};
            }
            throw new Error(response.data.message || 'Failed to fetch KPIs');
        } catch (error) {
            console.error('Failed to fetch KPIs, using empty fallback.', error);
            return {};
        }
    },

    async fetchWeeklyOrders(): Promise<{ weeklyOrders: WeeklyOrder[]; regionalActivity: RegionalActivity[] }> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/dashboard/stats');
            if (response.data.status === 'success') {
                return {
                    weeklyOrders: response.data.data.weekly_orders || [],
                    regionalActivity: response.data.data.regional_activity || []
                };
            }
            throw new Error(response.data.message || 'Failed to fetch weekly orders');
        } catch (error) {
            console.error('Failed to fetch weekly orders, using fallback data.', error);
            return {
                weeklyOrders: [
                    { name: 'Mon', orders: 40 }, { name: 'Tue', orders: 30 },
                    { name: 'Wed', orders: 20 }, { name: 'Thu', orders: 27 },
                    { name: 'Fri', orders: 18 }, { name: 'Sat', orders: 23 },
                    { name: 'Sun', orders: 34 },
                ],
                regionalActivity: [
                    { name: 'Dine-in', value: 66 },
                    { name: 'Delivery', value: 34 },
                ]
            };
        }
    }
};
