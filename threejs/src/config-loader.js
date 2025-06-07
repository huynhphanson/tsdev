export async function loadConfig() {
  const { client, slug } = parseViewerURL();
  const apiBase = import.meta.env.VITE_API_BASE;

  try {
    const res = await fetch(`${apiBase}/api/configs/${client}/${slug}`);
    
    if (!res.ok) {
      // Chuyển hướng sang trang lỗi kèm client & slug
      window.location.href = `/views/error.html?client=${client}&slug=${slug}`;
      return; // ⛔ Dừng tại đây luôn, không throw
    }

    const config = await res.json();
    return config;

  } catch (err) {
    // Không dùng res trong catch được → sửa fallback
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
