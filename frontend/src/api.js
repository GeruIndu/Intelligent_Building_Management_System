const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

async function request(path, options = {}) {
    const headers = options.headers || {};
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('ibms_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) throw new Error(data?.error || data || res.statusText);
    return data;
}

export default {
    // auth
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

    // users
    getUsers: () => request('/users', { method: 'GET' }),
    getMe: () => request('/users/me', { method: 'GET' }),
    updateUser: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

    // floors
    getFloors: () => request('/floors', { method: 'GET' }),
    createFloor: (body) => request('/floors', { method: 'POST', body: JSON.stringify(body) }),
    updateFloor: (id, body) => request(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteFloor: (id) => request(`/floors/${id}`, { method: 'DELETE' }),

    // spaces
    getSpaces: (q = '') => request(`/spaces${q ? '?' + q : ''}`, { method: 'GET' }),
    createSpace: (body) => request('/spaces', { method: 'POST', body: JSON.stringify(body) }),
    updateSpace: (id, body) => request(`/spaces/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteSpace: (id) => request(`/spaces/${id}`, { method: 'DELETE' }),

    // access logs
    createLog: (body) => request('/access-logs', { method: 'POST', body: JSON.stringify(body) }),
    getLogs: (q = '') => request(`/access-logs${q ? '?' + q : ''}`, { method: 'GET' }),
    updateLog: (id, body) => request(`/access-logs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteLog: (id) => request(`/access-logs/${id}`, { method: 'DELETE' }),

    // Admin permissions
    createPermission: (body) => request('/permissions', { method: 'POST', body: JSON.stringify(body) }),
    listPermissions: (q = '') => request(`/permissions${q ? '?' + q : ''}`, { method: 'GET' }),
    getPermission: (id) => request(`/permissions/${id}`, { method: 'GET' }),
    updatePermission: (id, body) => request(`/permissions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deletePermission: (id) => request(`/permissions/${id}`, { method: 'DELETE' }),

    // in src/api.js (add to default export)
    heartbeat: (body) => request('/access-logs/heartbeat', { method: 'POST', body: JSON.stringify(body) }),
    closeLog: (body) => request('/access-logs/close', { method: 'POST', body: JSON.stringify(body) }),

    dashboardSummary: () => request('/dashboard/summary', { method: 'GET' }),

};
