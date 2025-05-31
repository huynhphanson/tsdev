export function filterCards(cards, searchBox, locationFilter) {
  const search = searchBox.value.toLowerCase();
  const location = locationFilter.value;

  cards.forEach(card => {
    const name = card.querySelector('.card-title')?.innerText.toLowerCase() || '';
    const desc = card.querySelector('.card-description')?.innerText.toLowerCase() || '';
    const cardLocation = card.getAttribute('data-location');

    const matchSearch = name.includes(search) || desc.includes(search);
    const matchLocation = !location || cardLocation === location;

    card.style.display = matchSearch && matchLocation ? 'block' : 'none';
  });
}
