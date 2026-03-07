import { apiClient, ApiResponse } from './apiClient';

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
    data: Record<string, any>;
}

export async function processMessage(userMessage: string): Promise<ChefAiResponse> {
    try {
        const response = await apiClient.post<ApiResponse>('/voice/chat', {
            message: userMessage,
            session_id: 'manager_session'
        });

        if (response.data.status === 'success' && response.data.data) {
            const botData = response.data.data.response;
            if (botData) {
                const combinedReply = `${botData.analysis}\n\n💡 Tip: ${botData.recommendation}`;
                return {
                    intent: botData.intent as Intent || 'general_question',
                    reply: combinedReply,
                    data: botData.data || {}
                };
            }
        }
    } catch (error) {
        console.warn('[ChefAI] Backend API unavailable or failed:', error);
    }

    // Fallback if backend is completely down
    return {
        intent: 'general_question',
        reply: "The ChefAI intelligence engine is currently offline. Please check if the backend server is running.",
        data: {}
    };
}
