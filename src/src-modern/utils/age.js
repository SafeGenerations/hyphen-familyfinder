export function calculateAge(birthDate, deathDate = null, isDeceased = false) {
  if (!birthDate) return null;
  
  try {
    const birth = new Date(birthDate);
    const end = isDeceased && deathDate ? new Date(deathDate) : new Date();
    
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}