import { ApiResponse, apiClient } from './apiClient';

export interface ComboMeal {
  id: number;
  name: string;
  items: string[];
  price: number;
  discount: number;
  popularity: number;
  revenue: number;
  timesOrdered: number;
  targetAudience: string;
  active: boolean;
}

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

export interface ComboPayload {
  id?: number;
  name: string;
  items: string[];
  price: number;
  discount: number;
  targetAudience: string;
  active?: boolean;
  popularity?: number;
  revenue?: number;
  timesOrdered?: number;
}

export const comboService = {
  async fetchComboData(): Promise<ComboData> {
    const response = await apiClient.get<ApiResponse>('/api/combos');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch combos');
    }

    return {
      combos: response.data.data.combos || [],
      repeatCustomers: response.data.data.repeatCustomers || [],
      availableItems: response.data.data.availableItems || [],
    };
  },

  async saveCombo(payload: ComboPayload): Promise<ComboMeal> {
    const response = payload.id
      ? await apiClient.patch<ApiResponse>(`/api/combos/${payload.id}`, payload)
      : await apiClient.post<ApiResponse>('/api/combos', payload);

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to save combo');
    }

    return response.data.data.combo;
  },
};
