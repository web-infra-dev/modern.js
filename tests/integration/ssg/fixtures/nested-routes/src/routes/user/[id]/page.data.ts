// Test dynamic route data loading for SSG
const fs = require('fs');

export const loader = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  // Simulate data fetching based on user ID
  const userData = {
    1: 'User 1: John Doe',
    2: 'User 2: Jane Smith',
    3: 'User 3: Bob Johnson',
  };

  return userData[id] || `User ${id}: Unknown User`;
};
