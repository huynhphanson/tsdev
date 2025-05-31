export function setupClientSelect() {
  // ===== 1. Xử lý clientSelect trong form tạo model =====
  const clientSelect = document.getElementById('clientSelect');
  const customClient = document.getElementById('customClient');
  const form = document.getElementById('modelForm');

  if (clientSelect && customClient && form) {
    clientSelect.addEventListener('change', () => {
      const isNew = clientSelect.value === '__new';
      customClient.style.display = isNew ? 'block' : 'none';
      if (!isNew) customClient.value = '';
    });

    form.addEventListener('submit', () => {
      if (clientSelect.value === '__new' && customClient.value.trim()) {
        const realClientInput = document.createElement('input');
        realClientInput.type = 'hidden';
        realClientInput.name = 'client';
        realClientInput.value = customClient.value.trim();
        form.appendChild(realClientInput);

        clientSelect.removeAttribute('name');
        customClient.removeAttribute('name');
      }
    });
  }

  // ===== 2. Xử lý dropdown phân quyền client trong bảng quản lý user =====
  document.querySelectorAll('.client-select').forEach(select => {
    select.addEventListener('change', async () => {
      const userId = select.dataset.id;
      const newClient = select.value;

      try {
        const res = await fetch(`/api/users/${userId}/update-client`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ client: newClient })
        });

        if (!res.ok) {
          alert('Cập nhật phân quyền thất bại.');
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật client:', err);
        alert('Có lỗi xảy ra.');
      }
    });
  });
}
