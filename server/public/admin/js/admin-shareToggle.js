export function setupShareToggle() {
  if (window.__shareToggleAttached) return;
  window.__shareToggleAttached = true;

  document.addEventListener('change', async e => {
    const input = e.target.closest('.share-toggle');
    if (!input) return;

    const client = input.dataset.client;
    const slug = input.dataset.slug;
    if (!client || !slug) return;

    input.disabled = true;

    try {
      const res = await fetch(`/api/projects/${client}/${slug}/toggle-share`, { method: 'PATCH' });
      if (res.ok) {
        const data = await res.json();
        input.checked = data.shared; // luôn sync theo backend
      } else {
        console.error('Toggle share failed:', await res.text());
        alert('Cập nhật chia sẻ thất bại');
      }
    } catch (err) {
      console.error('Lỗi chia sẻ:', err);
      input.checked = !input.checked;
    } finally {
      input.disabled = false;
    }
  });
}

export function setupClientAccessToggle() {
  document.querySelectorAll('.client-access-toggle').forEach(input => {
    input.addEventListener('change', async () => {
      const client = input.dataset.client;
      const slug = input.dataset.slug;
      const enabled = input.checked;

      if (!client || !slug) return;

      const res = await fetch(`/api/projects/${client}/${slug}/client-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientAccess: enabled })
      });
      if (!res.ok) {
        alert('Cập nhật quyền client thất bại');
        input.checked = !enabled;
      }
    });
  });
}
