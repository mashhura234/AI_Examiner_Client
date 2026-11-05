export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  profileImage?: File | null;
}

export interface UserProfile {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    contactNumber: string;
    address: string;
    profileImageUrl?: string;
    userStatus: number;
}

export interface VerifyUserDTO {
  userId: number;
  verificationToken?: string;
}

export interface TokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: number;
  userName: string;
  userStatus: number;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  contactNumber: string;
  address: string;
  profileImageUrl?: string | null;
}