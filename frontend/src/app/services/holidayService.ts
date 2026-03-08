import { ApiResponse, apiClient } from './apiClient';

export interface HolidayEvent {
  id: number;
  title: string;
  date: string;
  type: 'holiday' | 'event' | 'maintenance' | 'custom';
  status: 'draft' | 'published';
  callVolumeImpact: number;
  aiRecommendations: string[];
  affectedSchedules: { time: string; action: string }[];
  expectedRevenue?: number;
  lastYearRevenue?: number;
}

export interface HolidayPayload {
  id?: number;
  name?: string;
  title?: string;
  date: string;
  openingTime?: string;
  closingTime?: string;
  promotion?: string;
  callVolumeImpact?: number;
  expectedRevenue?: number;
  lastYearRevenue?: number;
}

export const holidayService = {
  async fetchHolidaySchedule(): Promise<HolidayEvent[]> {
    const response = await apiClient.get<ApiResponse>('/api/holidays');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch holiday schedule');
    }
    return response.data.data.events || [];
  },

  async saveHoliday(payload: HolidayPayload): Promise<HolidayEvent> {
    const response = payload.id
      ? await apiClient.put<ApiResponse>(`/api/holidays/${payload.id}`, payload)
      : await apiClient.post<ApiResponse>('/api/holidays', payload);

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to save holiday');
    }

    return response.data.data.event;
  },

  async deleteHoliday(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse>(`/api/holidays/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete holiday');
    }
  },
};
