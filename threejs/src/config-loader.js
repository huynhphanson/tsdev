export async function loadConfig() {
  const { client, slug } = parseViewerURL();

  try {
    const res = await fetch(`/configs/${client}/${slug}.json`);
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

  const last = pathSegments.length;
  return {
    client: pathSegments[last - 3],
    slug: pathSegments[last - 2],
  };
}
