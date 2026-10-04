import { httpRequest } from './httpClient';
import type { LoginResponse } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — autenticación mínima (US-11).
// /api/auth/login es la única ruta de negocio pública del backend.

export const authApi = {
  login: (email: string, password: string) =>
    httpRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
};
