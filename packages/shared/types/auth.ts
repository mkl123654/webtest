export interface RegisterDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
  avatar: string;
  bio: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  username?: string;
  avatar?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}
