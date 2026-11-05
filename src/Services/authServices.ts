import axiosInstance, { type CustomAxiosRequestConfig } from '../interceptor';
import { CommonService } from './commonServices';

import type { 
  LoginRequest, 
  RegisterRequest, 
  VerifyUserDTO, 
  TokenRequest, 
  AuthResponse,
  UserUpdateRequest
} from '../Models/userModel';

export const AuthService = {
  Login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('Users/login', data, {
      isAuthorize: false,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  GetProfile: async (): Promise<any> => {
    const response = await axiosInstance.get('Users/profile', {
      isAuthorize: true, 
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  Register: async (data: RegisterRequest | FormData): Promise<any> => {
    return axiosInstance.post('Users/register', data, {
      isAuthorize: false,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } as CustomAxiosRequestConfig);
  },

  Verify: async (data: VerifyUserDTO): Promise<any> => {
    return axiosInstance.post('Users/verify-user', data, {
      isAuthorize: false,
    } as CustomAxiosRequestConfig);
  },

  RefreshToken: async () => {
    const payload: TokenRequest = {
      accessToken: CommonService.GetUserToken() || '',
      refreshToken: CommonService.GetRefreshToken() || '',
    };

    return axiosInstance.post('Users/refresh', payload, {
      isAuthorize: false,
    } as CustomAxiosRequestConfig);
  },

  UpdateProfile: async (id: number, payload: UserUpdateRequest) => {
    const response = await axiosInstance.put(`/Users/${id}`, payload ,{
      isAuthorize: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } as CustomAxiosRequestConfig);


    return response.data;

  },

  DeleteProfile: async (id: number) => {
    const response = await axiosInstance.delete(`/Users/${id}`, {
      isAuthorize: true,
    } as CustomAxiosRequestConfig);
    return response.data;
  },

  Logout: async () => {
    return axiosInstance.post('Users/logout', {
      refreshToken: CommonService.GetRefreshToken(),
    });
  },
};