const USER_KEY = "user";
const TOKEN_KEY = "auth_token";

export function readJson(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUser() {
  return readJson(USER_KEY, null);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function writeSession(user, token) {
  writeJson(USER_KEY, user);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("role");
}

export function getUserStorageKey(key) {
  const user = getUser();
  const identity = user?.email?.trim().toLowerCase() || "anonymous";
  return `twinday:${identity}:${key}`;
}
