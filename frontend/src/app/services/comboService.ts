import { apiClient, ApiResponse } from './apiClient';
import { ComboMeal, comboMeals as mockComboMeals } from './mockData';

export interface RepeatCustomer {
    id: number;
    name: string;
    orders: number;
    suggestedCombo: string;
    orderHistory: string[];
    potentialRevenue: number;
}

export interface ComboData {
    combos: ComboMeal[];
    repeatCustomers: RepeatCustomer[];
    availableItems: string[];
}

export const comboService = {
    async fetchComboData(): Promise<ComboData> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/combos');
            if (response.data.status === 'success') {
                return {
                    combos: response.data.data.combos || [],
                    repeatCustomers: response.data.data.repeatCustomers || [],
                    availableItems: response.data.data.availableItems || []
                };
            }
            throw new Error(response.data.message || 'Failed to fetch combos');
        } catch (error) {
            console.error('Failed to fetch combos, using fallback data.', error);
            return { combos: [], repeatCustomers: [], availableItems: [] };
        }
    },

    async updateCombo(combo: ComboMeal): Promise<boolean> {
        try {
            const response = await apiClient.post<ApiResponse>('/api/combos', combo);
            return response.data.status === 'success';
        } catch (error) {
            console.error('Failed to update combo.', error);
            return false;
        }
    }
};
