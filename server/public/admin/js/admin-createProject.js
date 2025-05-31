// Tạo mới project
export function setupCreateProject() {
  const form = document.getElementById('modelForm');
  const clientSelect = document.getElementById('clientSelect');
  const customClient = document.getElementById('customClient');

  // Hiển thị ô nhập khách hàng nếu chọn "__new"
  clientSelect.addEventListener('change', () => {
    if (clientSelect.value === '__new') {
      customClient.style.display = 'block';
    } else {
      customClient.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    if (clientSelect.value === '__new') {
      formData.set('client', customClient.value);
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('Tạo mới thất bại');
    }
  });
}
