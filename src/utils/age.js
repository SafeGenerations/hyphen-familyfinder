export function formatAge(birthDate, deathDate = null, isDeceased = false) {
  if (!birthDate) return '';
  const start = new Date(birthDate);
  if (isNaN(start)) return '';
  const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
  if (isNaN(end)) return '';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return '';

  if (years <= 2) {
    if (years === 0) {
      return `${months}mo`;
    }
    return `${years}yr ${months}mo`;
  }
  return `${years} yo`;
}

export function calculateAge(birthDate, deathDate = null, isDeceased = false) {
  if (!birthDate) return '';
  const start = new Date(birthDate);
  if (isNaN(start)) return '';
  const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
  if (isNaN(end)) return '';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
  }

  return years >= 0 ? years : '';
}
