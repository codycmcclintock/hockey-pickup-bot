import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Create axios instance
const api = axios.create({
  baseURL: 'https://api.hockeypickup.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Disable SSL verification for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

interface LoginResponse {
  Data: {
    Token: string;
    User: {
      Id: string;
      Email: string;
      FirstName: string;
      LastName: string;
    };
  };
}

export const login = async (): Promise<string> => {
  try {
    const response = await api.post<LoginResponse>('/api/Auth/login', {
      UserName: process.env.USER_EMAIL,
      Password: process.env.USER_PASSWORD,
    });

    if (response.data.Data?.Token) {
      return response.data.Data.Token;
    }
    throw new Error('No token received in login response');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
