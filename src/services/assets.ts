const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").trim() || "/api";

function getApiOrigin() {
  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    return "";
  }

  return new URL(apiBaseUrl).origin;
}

export function resolveAssetUrl(value?: string | null, fallback = "/utils/logo.png") {
  const assetPath = String(value ?? "").trim();

  if (!assetPath) {
    return fallback;
  }

  if (
    assetPath.startsWith("http://") ||
    assetPath.startsWith("https://") ||
    assetPath.startsWith("data:") ||
    assetPath.startsWith("blob:")
  ) {
    return assetPath;
  }

  if (assetPath.startsWith("/media/")) {
    const apiOrigin = getApiOrigin();
    return apiOrigin ? `${apiOrigin}${assetPath}` : assetPath;
  }

  return assetPath;
}
