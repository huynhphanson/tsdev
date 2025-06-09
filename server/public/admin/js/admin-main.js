import { setupShareToggle, setupClientAccessToggle } from './admin-shareToggle.js';
import { deleteModel } from './admin-deleteModel.js';
import { filterCards } from './admin-filter.js';
import { setupClientSelect } from './admin-clientSelect.js';
import { setupEditModel } from './admin-editModel.js';
import { setupCreateProject } from './admin-createProject.js';
import { setupUserDelete } from './admin-deleteUser.js';
import { initSortableGallery } from './admin-sortModels.js';

window.deleteModel = deleteModel;

document.addEventListener('DOMContentLoaded', () => {
  const searchBox = document.getElementById('searchBox');
  const locationFilter = document.getElementById('locationFilter');
  const cards = document.querySelectorAll('.card');

  const trigger = () => filterCards(cards, searchBox, locationFilter);

  searchBox.addEventListener('input', trigger);
  locationFilter.addEventListener('change', trigger);

  setupShareToggle();
  setupClientAccessToggle();
  
  setupClientSelect();
  setupEditModel();
  setupCreateProject();

  setupUserDelete();
  
  initSortableGallery();
});

document.querySelectorAll('.client-select').forEach(select => {
  select.addEventListener('change', async () => {
    const userId = select.dataset.id;
    const client = select.value;

    const res = await fetch(`/api/users/${userId}/client`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client })
    });

    if (res.ok) {
      console.log('✅ Cập nhật client thành công');
    } else {
      alert('❌ Cập nhật client thất bại');
    }
  });
});
