import { baseApi } from './baseApi';
import { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  nombre?: string;
  apellido?: string;
  email?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    // Refresh token
    refreshToken: builder.mutation<{ token: string }, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    // Get current user (me)
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    // Change password
    changePassword: builder.mutation<{ message: string }, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    // Update profile
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdateProfileMutation,
} = authApi;
