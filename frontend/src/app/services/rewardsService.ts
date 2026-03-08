import { ApiResponse, apiClient } from './apiClient';

export interface LoyaltyCustomer {
  id?: number;
  phone: string;
  name: string;
  callCount: number;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  discount: number;
  autoApply: boolean;
  nextTierCalls: number;
  points?: number;
  totalSpent?: number;
}

export interface Discount {
  id: number;
  name: string;
  type: string;
  value: string;
  conditions: string;
  active: boolean;
  used: number;
  usageLimit?: number;
}

export interface RewardsData {
  customers: LoyaltyCustomer[];
  discounts: Discount[];
}

export interface CreateDiscountPayload {
  name: string;
  type: string;
  value: string;
  conditions: string;
  usageLimit: string;
}

export const rewardsService = {
  async fetchRewardsData(): Promise<RewardsData> {
    const response = await apiClient.get<ApiResponse>('/api/rewards');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch rewards data');
    }

    return {
      customers: response.data.data.customers || [],
      discounts: response.data.data.discounts || [],
    };
  },

  async createDiscount(payload: CreateDiscountPayload): Promise<Discount> {
    const response = await apiClient.post<ApiResponse>('/api/rewards/discounts', payload);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to create discount');
    }
    return response.data.data.discount;
  },

  async deleteDiscount(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/api/rewards/discounts/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete discount');
    }
  },
};
