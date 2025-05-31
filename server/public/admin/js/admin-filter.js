export function filterCards(cards, searchBox, locationFilter) {
  const search = searchBox.value.toLowerCase();
  const location = locationFilter.value;

  cards.forEach(card => {
    const name = card.querySelector('strong').innerText.toLowerCase();
    const desc = card.querySelector('p').innerText.toLowerCase();
    const cardLocation = card.getAttribute('data-location');

    const matchesSearch = name.includes(search) || desc.includes(search);
    const matchesLocation = !location || cardLocation === location;

    card.style.display = (matchesSearch && matchesLocation) ? 'block' : 'none';
  });
}
