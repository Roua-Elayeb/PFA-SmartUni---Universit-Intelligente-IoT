const generateParking = () => {
  const spots = [];
  const floors = [
    { floor: 0, label: 'Parking 1', letter: 'P1' },
    { floor: 1, label: 'Parking 2', letter: 'P2' },
    { floor: 2, label: 'Parking 3', letter: 'P3' },
  ];

  floors.forEach(({ floor, letter }) => {
    for (let i = 1; i <= 12; i++) {
      spots.push({
        spotNumber: `${letter}-${String(i).padStart(2, '0')}`,
        floor,
        available: true,
      });
    }
  });
  return spots;
};