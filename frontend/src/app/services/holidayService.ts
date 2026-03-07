import { apiClient, ApiResponse } from './apiClient';

export interface HolidayEvent {
    id: number;
    title: string;
    date: Date;
    type: 'holiday' | 'event' | 'maintenance' | 'custom';
    status: 'draft' | 'published';
    callVolumeImpact: number;
    aiRecommendations: string[];
    affectedSchedules: { time: string; action: string }[];
}

const mockEvents: HolidayEvent[] = [
    {
        id: 1,
        title: "Valentine's Day Special",
        date: new Date(2025, 1, 14),
        type: 'event',
        status: 'published',
        callVolumeImpact: 85,
        aiRecommendations: [
            'Staff up by 2 extra agents from 5 PM to 9 PM',
            'Enable "romantic dinner for two" IVR fast-track',
            'Promote pre-booking via SMS one week prior'
        ],
        affectedSchedules: [
            { time: '17:00 - 22:00', action: 'Extend close time by 1hr' }
        ]
    },
    {
        id: 2,
        title: "Super Bowl Sunday",
        date: new Date(2025, 1, 9),
        type: 'event',
        status: 'published',
        callVolumeImpact: 120,
        aiRecommendations: [
            'Anticipate +120% call volume for delivery orders',
            'Prepare "Game Day Family Bundle" fast-checkout',
            'Route complaints to secondary queue to keep primary queue moving'
        ],
        affectedSchedules: [
            { time: '15:00 - 20:00', action: 'Double kitchen staff' }
        ]
    }
];

export const holidayService = {
    async fetchHolidaySchedule(): Promise<HolidayEvent[]> {
        try {
            const response = await apiClient.get<ApiResponse>('/api/holidays');
            if (response.data.status === 'success') {
                return response.data.data.events.map((e: any) => ({
                    ...e,
                    date: new Date(e.date)
                })) || [];
            }
            throw new Error(response.data.message || 'Failed to fetch holidays');
        } catch (error) {
            console.error('Failed to fetch holiday schedule, using fallback data.', error);
            return [];
        }
    }
};
