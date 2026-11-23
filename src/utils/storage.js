const USER_KEY = "user";

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

export function getUserStorageKey(key) {
  const user = getUser();
  const identity = user?.email?.trim().toLowerCase() || "anonymous";
  return `twinday:${identity}:${key}`;
}
