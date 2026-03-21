const TOKEN_KEY = "qrdine:token";
const USER_KEY = "qrdine:user";

const getStore = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage || null;
};

export function getToken() {
  if (typeof window === "undefined") return null;
  const store = getStore();
  if (store) {
    const sessionToken = store.getItem(TOKEN_KEY);
    if (sessionToken) return sessionToken;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  const store = getStore();
  if (store) store.setItem(TOKEN_KEY, token);
  // Avoid cross-tab logout by not sharing tokens in localStorage
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const store = getStore();
  const raw = (store && store.getItem(USER_KEY)) || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (typeof window === "undefined") return;
  const store = getStore();
  if (store) store.setItem(USER_KEY, JSON.stringify(user || null));
  // Avoid cross-tab user overwrite
  localStorage.removeItem(USER_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  const store = getStore();
  if (store) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
