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

// Hàm lấy thông tin hồ sơ
export const getUserProfile = async (id: number): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get<UserProfileResponse>(`/api/users/${id}`);
  return response.data;
};

// Hàm cập nhật thông tin hồ sơ
export const updateUserProfile = async (userId: number, formData: any): Promise<string> => {
  const response = await axiosInstance.put(`/api/users/${userId}`, formData);
  return response.data;
};

// Hàm update avatar
export const uploadAvatar = async (userId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`/api/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
