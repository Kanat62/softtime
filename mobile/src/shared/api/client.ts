import axios from 'axios';
import { env } from '../config/env';

export const apiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});
