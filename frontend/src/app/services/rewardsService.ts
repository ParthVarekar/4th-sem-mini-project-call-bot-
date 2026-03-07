import { apiClient, ApiResponse } from './apiClient';

export interface LoyaltyCustomer {
    phone: string;
    name: string;
    callCount: number;
    tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
    discount: number;
    autoApply: boolean;
    nextTierCalls: number;
}

export interface Discount {
    id: number;
    name: string;
    type: string;
    value: string;
    conditions: string;
    active: boolean;
    used: number;
}

export interface RewardsData {
    customers: LoyaltyCustomer[];
    discounts: Discount[];
}

export const rewardsService = {
    async fetchRewardsData(): Promise<RewardsData> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/rewards');
            if (response.data.status === 'success') {
                return {
                    customers: response.data.data.customers || [],
                    discounts: response.data.data.discounts || []
                };
            }
            throw new Error(response.data.message || 'Failed to fetch rewards data');
        } catch (error) {
            console.error('Failed to fetch rewards, using fallback data.', error);
            return { customers: [], discounts: [] };
        }
    }
};
