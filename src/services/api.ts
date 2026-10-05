const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('sbop_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('sbop_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('sbop_token');
}

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred during request');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profile: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  changePassword: (passwords: any) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(passwords) }),

  // Users / Admin
  getUsers: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  approveUser: (id: number) => request(`/users/${id}/approve`, { method: 'PUT' }),
  rejectUser: (id: number) => request(`/users/${id}/reject`, { method: 'PUT' }),
  updateUserRole: (id: number, data: any) => request(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id: number) => request(`/users/${id}/reset-password`, { method: 'POST' }),
  deleteUser: (id: number) => request(`/users/${id}`, { method: 'DELETE' }),

  // Departments
  getDepartments: () => request('/departments'),

  // Checklist Templates
  getChecklistTemplates: (deptCode: string, layer?: string) => {
    const query = layer ? `?layer=${encodeURIComponent(layer)}` : '';
    return request(`/checklist/templates/${deptCode}${query}`);
  },
  createChecklistTemplate: (data: any) =>
    request('/checklist/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateChecklistTemplate: (id: number, data: any) =>
    request(`/checklist/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChecklistTemplate: (id: number) =>
    request(`/checklist/templates/${id}`, { method: 'DELETE' }),

  // Inspections
  getInspections: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inspections${query ? `?${query}` : ''}`);
  },
  getInspection: (id: number) => request(`/inspections/${id}`),
  getInspectionCodes: (deptCode: string, year: number, month: number) =>
    request(`/inspections/codes?department=${encodeURIComponent(deptCode)}&year=${year}&month=${month}`),
  getPriorLayers: (deptCode: string, year: number, month: number, code?: string) => {
    let url = `/inspections/prior-layers?department=${encodeURIComponent(deptCode)}&year=${year}&month=${month}`;
    if (code) url += `&code=${encodeURIComponent(code)}`;
    return request(url);
  },
  getCodeHistory: (params: { department?: string; year?: number; month?: number; code: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/inspections/code-history?${query}`);
  },
  createInspection: (data: any) => request('/inspections', { method: 'POST', body: JSON.stringify(data) }),
  deleteInspection: (id: number) => request(`/inspections/${id}`, { method: 'DELETE' }),
  updateInspectionItems: (id: number, items: any[]) =>
    request(`/inspections/${id}/items`, { method: 'PUT', body: JSON.stringify({ items }) }),


  // Upload Photo to Cloudflare R2
  uploadImage: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('image', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload photo');
    }
    return data as { imageUrl: string; imageKey: string; storage: string };
  },

  // Email Notification Logs
  getEmailLogs: () => request('/email/logs'),
  sendCustomEmail: (emailData: any) => request('/email/send-alert', { method: 'POST', body: JSON.stringify(emailData) }),

  // In-App Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
  clearReadNotifications: () => request('/notifications/clear-read', { method: 'POST' }),
  sendNotification: (data: { userId?: number; title: string; message: string; type?: string; link?: string }) =>
    request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  getUsersDirectory: () => request('/users/directory'),

  // Admin Dashboard & Export
  getDashboardStats: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/stats${query ? `?${query}` : ''}`);
  },
  getExportData: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/export/data${query ? `?${query}` : ''}`);
  },
  deleteDefect: (id: number) => request(`/defects/${id}`, { method: 'DELETE' }),
};

export function normalizeImageUrl(url?: string | null): string {
  if (!url) return '';
  // If it's already a relative /api/r2/ path, return as is
  if (url.startsWith('/api/r2/')) return url;
  // If it's a full R2 S3 storage domain or direct worker domain, convert to /api/r2/...
  if (url.includes('r2.cloudflarestorage.com/r2sbop/')) {
    const key = url.split('r2.cloudflarestorage.com/r2sbop/')[1];
    return `/api/r2/${key}`;
  }
  return url;
}

