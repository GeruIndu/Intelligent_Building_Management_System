export function saveAuth(token, user) {
    localStorage.setItem('ibms_token', token);
    localStorage.setItem('ibms_user', JSON.stringify(user));
}
export function clearAuth() {
    localStorage.removeItem('ibms_token');
    localStorage.removeItem('ibms_user');
}
export function getToken() {
    return localStorage.getItem('ibms_token');
}
export function getUser() {
    const s = localStorage.getItem('ibms_user');
    return s ? JSON.parse(s) : null;
}
