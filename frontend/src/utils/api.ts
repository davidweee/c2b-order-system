const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  login: async (phone: string, code: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    return res.json();
  },
  sendCode: async (phone: string) => {
    const res = await fetch(`${API_BASE}/api/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },
  getOrders: async (token: string) => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  createOrder: async (token: string, data: any) => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateOrder: async (token: string, id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getOrder: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  submitOrder: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE}/api/orders/${id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  revokeOrder: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE}/api/orders/${id}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  uploadImage: async (token: string, formData: FormData) => {
    const res = await fetch(`${API_BASE}/api/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return res.json();
  },
  adminLogin: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },
  adminGetUsers: async (token: string) => {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  adminGetOrders: async (token: string) => {
    const res = await fetch(`${API_BASE}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  adminGetOrder: async (token: string, id: number) => {
    const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
  adminUpdateOrder: async (token: string, id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
