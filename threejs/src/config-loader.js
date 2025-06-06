export async function loadConfig() {
  const { client, slug } = parseViewerURL();
  const apiBase = import.meta.env.VITE_API_BASE; // Lấy từ .env

  try {
    const res = await fetch(`${apiBase}/api/configs/${client}/${slug}`);
    if (!res.ok) throw new Error(`[loadConfig] Không tìm thấy config: ${client}/${slug}`);
    const config = await res.json();
    return config;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function parseViewerURL() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);

  // Đảm bảo đúng với URL kiểu: /viewer/:client/:slug/
  const viewerIndex = pathSegments.indexOf('viewer');
  return {
    client: pathSegments[viewerIndex + 1],
    slug: pathSegments[viewerIndex + 2],
  };
}
