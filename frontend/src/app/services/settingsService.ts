import { ApiResponse, apiClient } from './apiClient';

export interface AppSettings {
  autoReservation: boolean;
  autoOrderTaking: boolean;
  aiUpselling: boolean;
  callRecording: boolean;
  voiceType: string;
  maxHoldTime: string;
}

export const settingsService = {
  async fetchSettings(): Promise<AppSettings> {
    const response = await apiClient.get<ApiResponse>('/api/settings');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch settings');
    }
    return response.data.data.settings;
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const response = await apiClient.put<ApiResponse>('/api/settings', settings);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to save settings');
    }
    return response.data.data.settings;
  },
};
