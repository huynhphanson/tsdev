export async function loadConfig() {
  const { client, slug } = parseViewerURL();
  const apiBase = import.meta.env.VITE_API_BASE;

  try {
    const res = await fetch(`${apiBase}/api/configs/${client}/${slug}`);
    
    if (!res.ok) {
      // ⛔ Redirect ngược về backend để render lỗi đúng (403 hoặc 404)
      window.location.href = `/viewer/${client}/${slug}`;
      return;
    }

    const config = await res.json();
    return config;

  } catch (err) {
    alert('Không thể kết nối tới máy chủ.');
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

function handleError(status) {
  if ([403, 404].includes(status)) {
    window.location.href = '/views/error.html';
  } else {
    alert('Lỗi không xác định.');
  }
}
