import { filterCards } from "./home-filter.js";
import { initViewerAccessCheck } from "./checkViewerPermission.js";

document.addEventListener('DOMContentLoaded', () => {
  const searchBox = document.getElementById('searchBox');
  const locationFilter = document.getElementById('locationFilter');
  const cards = document.querySelectorAll('.card');

  const trigger = () => filterCards(cards, searchBox, locationFilter);

  searchBox.addEventListener('input', trigger);
  locationFilter.addEventListener('change', trigger);
});

const avatarToggle = document.getElementById('avatarToggle');
const logoutDropdown = document.getElementById('logoutDropdown');

initViewerAccessCheck();

if (avatarToggle && logoutDropdown) {
  avatarToggle.addEventListener('click', () => {
    logoutDropdown.style.display = logoutDropdown.style.display === 'block' ? 'none' : 'block';
  });

  // Ẩn dropdown khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!avatarToggle.contains(e.target) && !logoutDropdown.contains(e.target)) {
      logoutDropdown.style.display = 'none';
    }
  });
  
}