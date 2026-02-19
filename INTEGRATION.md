# 🔗 Guía de Integración Frontend-Backend

Esta guía explica cómo conectar el frontend React con el backend API.

## 📋 Configuración del Frontend

### 1. Crear archivo de configuración API

Crear `src/config/api.ts` en el frontend:

```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  
  // Users
  USERS: '/users',
  
  // Customers
  CUSTOMERS: '/customers',
  
  // Orders
  ORDERS: '/orders',
  KANBAN_BOARD: '/orders/kanban/board',
  
  // Inventory
  PARTS: '/inventory/parts',
  TRANSFERS: '/inventory/transfers',
  
  // Invoices
  INVOICES: '/invoices',
  
  // Cash Register
  CASH_REGISTER: '/cash-register',
  
  // Stores
  STORES: '/stores',
  
  // Dashboard
  DASHBOARD: {
    KPIS: '/dashboard/kpis',
    REVENUE_CHART: '/dashboard/charts/revenue',
    ORDERS_BY_STATUS: '/dashboard/charts/orders-by-status',
    TOP_SERVICES: '/dashboard/charts/top-services',
    RECENT_ACTIVITY: '/dashboard/activity/recent',
  },
  
  // BCV
  BCV: {
    CURRENT: '/bcv/current',
    HISTORY: '/bcv/history',
    CONVERT: '/bcv/convert',
  },
};
```

### 2. Crear cliente HTTP con Axios

```bash
# Instalar axios en el frontend
npm install axios
```

Crear `src/lib/api.ts`:

```typescript
// src/lib/api.ts
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, redirigir a login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Crear servicios API

Crear `src/services/authService.ts`:

```typescript
// src/services/authService.ts
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    storeId?: string;
  };
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data.data;
  },
  
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
```

Crear `src/services/orderService.ts`:

```typescript
// src/services/orderService.ts
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

export const orderService = {
  getOrders: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get(API_ENDPOINTS.ORDERS, { params });
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`${API_ENDPOINTS.ORDERS}/${id}`);
    return response.data.data;
  },
  
  createOrder: async (data: {
    customerId: string;
    deviceId: string;
    storeId: string;
    reportedIssue: string;
    priority?: string;
    estimatedCost?: number;
  }) => {
    const response = await api.post(API_ENDPOINTS.ORDERS, data);
    return response.data.data;
  },
  
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.patch(`${API_ENDPOINTS.ORDERS}/${id}/status`, { status });
    return response.data.data;
  },
  
  getKanbanBoard: async (storeId?: string) => {
    const response = await api.get(API_ENDPOINTS.KANBAN_BOARD, { params: { storeId } });
    return response.data.data;
  },
};
```

### 4. Actualizar el Store de Zustand

Modificar `src/store/index.ts` para usar la API:

```typescript
// src/store/authStore.ts (nuevo archivo)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login({ email, password });
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('token', data.token);
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
      },
      
      fetchProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user });
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

### 5. Variables de Entorno Frontend

Crear `.env` en el frontend:

```env
# API URL
VITE_API_URL=http://localhost:3000/api

# App
VITE_APP_NAME=SERVISTECH ERP
VITE_APP_VERSION=1.0.0
```

## 🔄 Flujo de Datos

### Login
```
Usuario -> Login Form -> authService.login() -> API -> JWT Token -> Store -> LocalStorage
```

### Cargar Dashboard
```
Dashboard Mount -> dashboardService.getKPIs() -> API -> Database -> Response -> UI Update
```

### Crear Orden
```
Form Submit -> orderService.createOrder() -> API -> Database -> Response -> Kanban Update
```

## 🛡️ Manejo de Errores

Crear `src/utils/errorHandler.ts`:

```typescript
// src/utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.error || 'Invalid request';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return data.error || 'Conflict with existing data.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error || 'An error occurred.';
    }
  }
  
  if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  }
  
  return 'An unexpected error occurred.';
};
```

## 📱 Ejemplo de Uso en Componente

```tsx
// src/components/LoginForm.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { handleApiError } from '@/utils/errorHandler';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      // Error is handled in store
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

## 🚀 Deploy Completo

### 1. Backend
```bash
cd api/
docker-compose up -d
```

### 2. Frontend
```bash
cd app/
npm run build
# Deploy dist/ folder to Vercel/Netlify
```

### 3. Configurar CORS
Asegurar que `FRONTEND_URL` en el backend apunte al dominio del frontend.

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Backend
docker-compose logs -f api

# Frontend (browser console)
```

---

Para más información, consulta la documentación completa del backend en `README.md`.
