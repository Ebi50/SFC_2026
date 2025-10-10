const API_BASE = '/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Lese Response-Text EINMAL (vermeidet bodyUsed-Fehler)
    const text = await response.text();
    
    // Parse JSON wenn vorhanden
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.error('Response Text:', text);
      console.error('Response Status:', response.status);
      console.error('Response Headers:', response.headers);
      
      // Für DELETE-Requests ohne Body ist das normal
      if (response.ok && response.status === 200 && text === '') {
        data = { success: true };
      } else {
        data = { error: 'Invalid JSON response', rawText: text };
      }
    }

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `Request failed: ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

export const authApi = {
  login: (password: string) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  
  getStatus: () => apiRequest('/auth/status'),
};

export const participantsApi = {
  getAll: () => apiRequest('/participants'),
  
  getOne: (id: string) => apiRequest(`/participants/${id}`),
  
  create: (participant: any) => apiRequest('/participants', {
    method: 'POST',
    body: JSON.stringify(participant),
  }),
  
  update: (id: string, participant: any) => apiRequest(`/participants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(participant),
  }),
  
  delete: (id: string) => apiRequest(`/participants/${id}`, {
    method: 'DELETE',
  }),
  
  import: (participants: any[]) => apiRequest('/participants/import', {
    method: 'POST',
    body: JSON.stringify(participants),
  }),
};

export const eventsApi = {
  getAll: () => apiRequest('/events'),
  
  create: (event: any) => apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(event),
  }),
  
  update: (id: string, event: any) => apiRequest(`/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  }),
  
  delete: (id: string) => apiRequest(`/events/${id}`, {
    method: 'DELETE',
  }),
  
  getResults: (id: string) => apiRequest(`/events/${id}/results`),
  
  saveResults: (id: string, results: any[]) => apiRequest(`/events/${id}/results`, {
    method: 'POST',
    body: JSON.stringify(results),
  }),
  
  getTeams: (id: string) => apiRequest(`/events/${id}/teams`),
  
  saveTeams: (id: string, teams: any[], teamMembers: any[]) => apiRequest(`/events/${id}/teams`, {
    method: 'POST',
    body: JSON.stringify({ teams, teamMembers }),
  }),
};

export const reglementApi = {
  upload: async (file: File, seasonYear: number) => {
    const formData = new FormData();
    formData.append('reglement', file);
    formData.append('seasonYear', seasonYear.toString());
    
    const response = await fetch(`${API_BASE}/reglement/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }
    
    return response.json();
  },
  
  exists: (seasonYear: number) => apiRequest(`/reglement/exists/${seasonYear}`),
  
  getAll: () => apiRequest('/reglement/all'),
  
  getDownloadUrl: (seasonYear: number) => `${API_BASE}/reglement/download/${seasonYear}`,
};

export const settingsApi = {
  get: () => apiRequest('/settings'),
  
  update: (settings: any) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  
  getForSeason: (year: number) => apiRequest(`/settings/season/${year}`),
  
  updateForSeason: (year: number, settings: any) => apiRequest(`/settings/season/${year}`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  
  incrementViews: () => apiRequest('/settings/increment-views', {
    method: 'POST',
  }),
};

export const seasonsApi = {
  getAll: () => apiRequest('/seasons'),
  
  create: (year: number) => apiRequest('/seasons', {
    method: 'POST',
    body: JSON.stringify({ year }),
  }),
};
