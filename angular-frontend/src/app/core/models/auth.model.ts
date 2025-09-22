export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  roles: string[]; // từ BE: Set<String> -> FE dùng string[]
}

export interface MeResponse {
  id: number;
  email: string;
  roles: string[];
  name?: string | null;     // SimpleUser.name
  fullName?: string | null; // phòng khi BE trả fullName
}