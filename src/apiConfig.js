const configuredApiBase = import.meta.env.VITE_API_BASE_URL || "";

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (configuredApiBase) {
    return `${configuredApiBase.replace(/\/$/, "")}${normalizedPath}`;
  }

  if (import.meta.env.DEV) {
    return `http://localhost:3001${normalizedPath}`;
  }

  return normalizedPath;
}
