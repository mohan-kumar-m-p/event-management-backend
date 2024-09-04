export function calculateAge(dob: Date): number {
  const cutoffDate = new Date('2024-12-31');
  const birthDate = new Date(dob);
  let age = cutoffDate.getFullYear() - birthDate.getFullYear();
  const monthDifference = cutoffDate.getMonth() - birthDate.getMonth();

  // Check if the current date is before the athlete's birthday this year
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && cutoffDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}
