import { ApiResponse, apiClient } from './apiClient';

export interface WeeklyOrder {
  name: string;
  orders: number;
}

export interface RegionalActivity {
  name: string;
  value: number;
}

export interface DashboardKPIs {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  takeoutPercentage: number;
  deliveryPercentage: number;
}

export interface PantryStat {
  label: string;
  value: number;
}

export interface MenuPerformanceItem {
  name: string;
  category: string;
  count: number;
}

export const ordersService = {
  async fetchDashboardStats(): Promise<{
    kpis: DashboardKPIs;
    weeklyOrders: WeeklyOrder[];
    regionalActivity: RegionalActivity[];
    pantryBreakdown: PantryStat[];
    menuPerformance: MenuPerformanceItem[];
  }> {
    const response = await apiClient.get<ApiResponse>('/api/dashboard/stats');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch dashboard stats');
    }

    return {
      kpis: response.data.data.kpis,
      weeklyOrders: response.data.data.weekly_orders || [],
      regionalActivity: response.data.data.regional_activity || [],
      pantryBreakdown: response.data.data.pantry_breakdown || [],
      menuPerformance: response.data.data.menu_performance || [],
    };
  },

  async fetchInventorySnapshot(): Promise<{
    pantryBreakdown: PantryStat[];
    menuPerformance: MenuPerformanceItem[];
  }> {
    const response = await apiClient.get<ApiResponse>('/api/inventory');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch inventory');
    }

    return {
      pantryBreakdown: response.data.data.pantryBreakdown || [],
      menuPerformance: response.data.data.menuPerformance || [],
    };
  },
};
