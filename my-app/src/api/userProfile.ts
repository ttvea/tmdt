import axiosInstance from './axios';

export interface UserProfileResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string | number;
  avatar: string | null;
}

export const getUserProfile = async (id: number): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get<UserProfileResponse>(`/api/users/${id}`);
  return response.data;
};