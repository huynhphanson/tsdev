export async function loadConfig() {
  // Lấy slug từ URL, ví dụ: ?slug=TL8B hoặc /viewer/TL8B
  const searchParams = new URLSearchParams(window.location.search);
  let slug = searchParams.get('slug');
  if (!slug) {
    const parts = window.location.pathname.split('/');
    slug = parts[parts.length - 1] || parts[parts.length - 2]; // xử lý /viewer/slug hoặc /viewer/slug/
  }

  const res = await fetch(`/configs/${slug}.json`);
  if (!res.ok) {
    throw new Error(`Không tìm thấy cấu hình: ${slug}.json`);
  }

  return await res.json();
}
