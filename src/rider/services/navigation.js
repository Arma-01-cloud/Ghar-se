export function navigateToStore(storeAddress, storeName) {
  const query = encodeURIComponent(`${storeName}, ${storeAddress}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(mapsUrl, '_blank');
}

export function navigateToCustomer(customerAddress) {
  const query = encodeURIComponent(customerAddress);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(mapsUrl, '_blank');
}

export function callCustomer(phone) {
  window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
}