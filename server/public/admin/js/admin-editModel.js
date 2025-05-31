export function setupEditModel() {
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  const cancelBtn = document.getElementById('cancelEdit');

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const client = btn.dataset.client;
      const slug = btn.dataset.slug;

      const res = await fetch(`/api/projects/${client}/${slug}`);
      if (!res.ok) return alert('Không tìm thấy mô hình');

      const project = await res.json();
      modal.classList.add('open');

      form.dataset.client = client;
      form.dataset.slug = slug;

      form.elements['name'].value = project.name;
      form.elements['slug'].value = project.slug;
      form.elements['description'].value = project.description;
      form.elements['location'].value = project.location;
    });
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const client = form.dataset.client;
    const slug = form.dataset.slug;
    const formData = new FormData(form);

    const res = await fetch(`/api/projects/${client}/${slug}`, {
      method: 'PUT',
      body: formData
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('Cập nhật thất bại');
    }
  });
}
