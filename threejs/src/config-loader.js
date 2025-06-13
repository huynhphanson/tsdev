export async function loadConfig() {
  const { client, slug } = parseViewerURL();
  const apiBase = import.meta.env.VITE_API_BASE;
  const fallbackURL = import.meta.env.VITE_FALLBACK_URL;

  if (!client || !slug) {
    window.location.href = fallbackURL;
    return;
  }

  try {
    const res = await fetch(`${apiBase}/api/configs/${client}/${slug}`, {
      credentials: 'include',
    });

    if ([403, 404, 423].includes(res.status)) {
      window.location.href = `${apiBase}/viewer/${client}/${slug}`;
      return;
    }

    if (!res.ok) {
      window.location.href = fallbackURL;
      return;
    }

    return await res.json();

  } catch (err) {
    alert('Không thể kết nối tới máy chủ!');
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