export async function getCurrentPositionCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 12.9784, longitude: 77.6408 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: 12.9784, longitude: 77.6408 }),
      { timeout: 5000 }
    );
  });
}
