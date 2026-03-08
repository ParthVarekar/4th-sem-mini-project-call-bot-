import { ApiResponse, apiClient } from './apiClient';

export type Intent =
  | 'financial_analysis'
  | 'menu_performance'
  | 'combo_recommendation'
  | 'customer_rewards'
  | 'discount_strategy'
  | 'peak_hours_analysis'
  | 'customer_insights'
  | 'marketing_recommendations'
  | 'operational_recommendations'
  | 'dashboard_help'
  | 'general_question'
  | string;

export interface ChefAiResponse {
  intent: Intent;
  reply: string;
  data: Record<string, unknown>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export async function processMessage(userMessage: string): Promise<ChefAiResponse> {
  try {
    const response = await apiClient.post<ApiResponse>('/voice/chat', {
      message: userMessage,
      session_id: 'manager_session',
    });

    if (response.data.status === 'success' && response.data.data) {
      const botData = response.data.data.response;
      if (botData) {
        const baseReply = String(botData.reply || botData.analysis || '').trim();
        const followUp = String(botData.recommendation || '').trim();
        const combinedReply =
          followUp && baseReply && !baseReply.includes(followUp)
            ? `${baseReply}\n\n${followUp}`
            : baseReply || followUp;

        return {
          intent: (botData.intent as Intent) || 'general_question',
          reply: combinedReply || 'I do not have enough information to answer that clearly yet.',
          data: botData.data || {},
        };
      }
    }
  } catch (error) {
    console.warn('[ChefAI] Backend API unavailable or failed:', error);
  }

  return {
    intent: 'general_question',
    reply: 'The ChefAI intelligence engine is currently offline. Please check whether the backend server is running.',
    data: {},
  };
}

export async function fetchConversationHistory(): Promise<ConversationMessage[]> {
  try {
    const response = await apiClient.get<ApiResponse>('/voice/history/manager_session');
    if (response.data.status !== 'success') {
      return [];
    }
    return response.data.data.messages || [];
  } catch {
    return [];
  }
}
