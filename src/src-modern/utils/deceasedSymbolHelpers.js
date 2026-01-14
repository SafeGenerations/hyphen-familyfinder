const GENTLE_IDS = ['soft-outline'];
const LEGACY_GENTLE_IDS = ['soft-fade'];

export const isGentleTreatment = (value) => GENTLE_IDS.includes(value);

export const normalizeDeceasedSelection = (person) => {
  if (!person || !person.isDeceased) {
    return { symbol: 'halo', gentle: 'none' };
  }

  let symbol = person.deceasedSymbol || 'halo';
  let gentle = person.deceasedGentleTreatment || 'none';

  if (LEGACY_GENTLE_IDS.includes(symbol)) {
    symbol = 'none';
  }

  if (LEGACY_GENTLE_IDS.includes(gentle)) {
    gentle = 'none';
  }

  if (isGentleTreatment(symbol)) {
    if (gentle === 'none') {
      gentle = symbol;
    }
    symbol = 'none';
  }

  if (!isGentleTreatment(gentle)) {
    gentle = 'none';
  }

  return { symbol, gentle };
};

export default normalizeDeceasedSelection;
