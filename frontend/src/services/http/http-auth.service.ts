import { apiClient } from './api-client';

export interface CurrentUserResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export const AuthService = {
  me: async () => {
    return apiClient.get<CurrentUserResponse>('/auth/me');
  },
};
