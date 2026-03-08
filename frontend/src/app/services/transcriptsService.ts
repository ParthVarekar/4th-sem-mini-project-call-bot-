import { ApiResponse, apiClient } from './apiClient';

export interface TranscriptMessage {
  sender: 'AI' | 'Customer';
  text: string;
  time: string;
}

export interface TranscriptCall {
  id: number;
  customer: string;
  phone: string;
  time: string;
  timestamp: string;
  duration: string;
  status: string;
  type: string;
  callCount: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  summary: string;
  messages: TranscriptMessage[];
}

export const transcriptsService = {
  async fetchTranscripts(): Promise<TranscriptCall[]> {
    const response = await apiClient.get<ApiResponse>('/api/transcripts');
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch transcripts');
    }
    return response.data.data.calls || [];
  },
};
