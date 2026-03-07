import axios, { AxiosResponse, AxiosError } from 'axios';

const BASE_URL = 'http://127.0.0.1:5000';

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data: T;
    message?: string;
    meta?: Record<string, any>;
}

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Assume successful response conforms to ApiResponse
        return response;
    },
    (error: AxiosError) => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
    }
);
