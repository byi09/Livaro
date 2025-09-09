import {
  formatPrice,
  formatLargeNumber,
  formatPriceRange,
  formatBedroomsAndBathrooms,
  capitalizeFirstLetter,
  trimZeros
} from './formatters';

describe('formatPrice', () => {
  it('should format numbers with commas as thousands separators', () => {
    expect(formatPrice(1000)).toBe('$1,000');
    expect(formatPrice(1234567)).toBe('$1,234,567');
    expect(formatPrice(500)).toBe('$500');
    expect(formatPrice(12345678.90)).toBe('$12,345,679');
  });

  it('should handle edge cases', () => {
    expect(formatPrice(0)).toBe('$0');
    expect(formatPrice(NaN)).toBe('0');
    expect(formatPrice(undefined as any)).toBe('0');
    expect(formatPrice(null as any)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatPrice(-1000)).toBe('-$1,000');
    expect(formatPrice(-500)).toBe('-$500');
  });

  it('should handle decimal numbers by rounding', () => {
    expect(formatPrice(1000.50)).toBe('$1,001');
    expect(formatPrice(999.49)).toBe('$999');
    expect(formatPrice(1234.99)).toBe('$1,235');
  });

  it('should handle very large numbers', () => {
    expect(formatPrice(1000000000)).toBe('$1,000,000,000');
    expect(formatPrice(999999999999)).toBe('$999,999,999,999');
  });

  it('should handle very small numbers', () => {
    expect(formatPrice(0.01)).toBe('$0');
    expect(formatPrice(0.99)).toBe('$1');
  });
});

describe('formatLargeNumber', () => {
  it('should format millions correctly', () => {
    expect(formatLargeNumber(1000000)).toBe('1.0M');
    expect(formatLargeNumber(2500000)).toBe('2.5M');
    expect(formatLargeNumber(1234567)).toBe('1.2M');
    expect(formatLargeNumber(9999999)).toBe('10.0M');
  });

  it('should format thousands correctly', () => {
    expect(formatLargeNumber(1000)).toBe('1.0K');
    expect(formatLargeNumber(2500)).toBe('2.5K');
    expect(formatLargeNumber(12345)).toBe('12.3K');
    expect(formatLargeNumber(999999)).toBe('1000.0K');
  });

  it('should format small numbers without suffix', () => {
    expect(formatLargeNumber(500)).toBe('500');
    expect(formatLargeNumber(999)).toBe('999');
    expect(formatLargeNumber(1)).toBe('1');
    expect(formatLargeNumber(0)).toBe('0');
  });

  it('should handle edge cases', () => {
    expect(formatLargeNumber(0)).toBe('0');
    expect(formatLargeNumber(NaN)).toBe('0');
    expect(formatLargeNumber(undefined as any)).toBe('0');
    expect(formatLargeNumber(null as any)).toBe('0');
  });

  it('should handle negative numbers', () => {
    expect(formatLargeNumber(-1000)).toBe('-1.0K');
    expect(formatLargeNumber(-1000000)).toBe('-1.0M');
    expect(formatLargeNumber(-500)).toBe('-500');
  });

  it('should handle billions and higher', () => {
    expect(formatLargeNumber(1000000000)).toBe('1000.0M');
    expect(formatLargeNumber(1500000000)).toBe('1500.0M');
  });

  it('should handle decimal inputs', () => {
    expect(formatLargeNumber(1000.5)).toBe('1.0K');
    expect(formatLargeNumber(1500000.75)).toBe('1.5M');
  });
});

describe('formatPriceRange', () => {
  it('should format both min and max prices', () => {
    expect(formatPriceRange(1000, 2000)).toBe('$1,000 - $2,000');
    expect(formatPriceRange(500000, 750000)).toBe('$500,000 - $750,000');
    expect(formatPriceRange(100, 200)).toBe('$100 - $200');
  });

  it('should format min price only', () => {
    expect(formatPriceRange(1000)).toBe('From $1,000');
    expect(formatPriceRange(1000, undefined)).toBe('From $1,000');
    expect(formatPriceRange(1000, null as any)).toBe('From $1,000');
  });

  it('should format max price only', () => {
    expect(formatPriceRange(undefined, 2000)).toBe('Up to $2,000');
    expect(formatPriceRange(null as any, 2000)).toBe('Up to $2,000');
  });

  it('should handle no valid prices', () => {
    expect(formatPriceRange()).toBe('Price');
    expect(formatPriceRange(undefined, undefined)).toBe('Price');
    expect(formatPriceRange(0, 0)).toBe('Price');
    expect(formatPriceRange(null as any, null as any)).toBe('Price');
    expect(formatPriceRange(NaN, NaN)).toBe('Price');
  });

  it('should handle zero values correctly', () => {
    expect(formatPriceRange(0, 1000)).toBe('Up to $1,000');
    expect(formatPriceRange(1000, 0)).toBe('From $1,000');
  });

  it('should handle same min and max values', () => {
    expect(formatPriceRange(1000, 1000)).toBe('$1,000 - $1,000');
  });

  it('should handle reversed min/max (max < min)', () => {
    expect(formatPriceRange(2000, 1000)).toBe('$2,000 - $1,000');
  });

  it('should handle very large numbers', () => {
    expect(formatPriceRange(1000000, 2000000)).toBe('$1,000,000 - $2,000,000');
  });
});

describe('formatBedroomsAndBathrooms', () => {
  it('should format bedrooms and bathrooms correctly', () => {
    expect(formatBedroomsAndBathrooms(2, 1)).toBe('2+ bd, 1+ ba');
    expect(formatBedroomsAndBathrooms(3, 2)).toBe('3+ bd, 2+ ba');
    expect(formatBedroomsAndBathrooms(1, 1)).toBe('1+ bd, 1+ ba');
    expect(formatBedroomsAndBathrooms(5, 3)).toBe('5+ bd, 3+ ba');
  });

  it('should handle undefined values', () => {
    expect(formatBedroomsAndBathrooms(undefined, undefined)).toBe('Beds & Baths');
    expect(formatBedroomsAndBathrooms(0, 0)).toBe('Beds & Baths');
    expect(formatBedroomsAndBathrooms(null as any, null as any)).toBe('Beds & Baths');
  });

  it('should handle partial values', () => {
    expect(formatBedroomsAndBathrooms(2, 0)).toBe('2+ bd, 0+ ba');
    expect(formatBedroomsAndBathrooms(0, 1)).toBe('0+ bd, 1+ ba');
    expect(formatBedroomsAndBathrooms(3, undefined)).toBe('Beds & Baths');
    expect(formatBedroomsAndBathrooms(undefined, 2)).toBe('Beds & Baths');
  });

  it('should handle studio apartments (0 bedrooms)', () => {
    expect(formatBedroomsAndBathrooms(0, 1)).toBe('0+ bd, 1+ ba');
    expect(formatBedroomsAndBathrooms(0, 2)).toBe('0+ bd, 2+ ba');
  });

  it('should handle large numbers', () => {
    expect(formatBedroomsAndBathrooms(10, 8)).toBe('10+ bd, 8+ ba');
    expect(formatBedroomsAndBathrooms(15, 12)).toBe('15+ bd, 12+ ba');
  });

  it('should handle decimal inputs by truncating', () => {
    expect(formatBedroomsAndBathrooms(2.5 as any, 1.5 as any)).toBe('2+ bd, 1+ ba');
    expect(formatBedroomsAndBathrooms(3.9 as any, 2.1 as any)).toBe('3+ bd, 2+ ba');
  });
});

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
    expect(capitalizeFirstLetter('world')).toBe('World');
    expect(capitalizeFirstLetter('apartment')).toBe('Apartment');
    expect(capitalizeFirstLetter('real estate')).toBe('Real estate');
  });

  it('should handle edge cases', () => {
    expect(capitalizeFirstLetter('')).toBe('');
    expect(capitalizeFirstLetter('a')).toBe('A');
    expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
    expect(capitalizeFirstLetter('hELLO')).toBe('HELLO');
  });

  it('should handle special characters', () => {
    expect(capitalizeFirstLetter('1hello')).toBe('1hello');
    expect(capitalizeFirstLetter('!hello')).toBe('!hello');
    expect(capitalizeFirstLetter(' hello')).toBe(' hello');
    expect(capitalizeFirstLetter('\nhello')).toBe('\nhello');
  });

  it('should handle non-string inputs gracefully', () => {
    expect(capitalizeFirstLetter(null as any)).toBe('');
    expect(capitalizeFirstLetter(undefined as any)).toBe('');
    expect(capitalizeFirstLetter(123 as any)).toBe('123');
  });

  it('should handle unicode characters', () => {
    expect(capitalizeFirstLetter('émile')).toBe('Émile');
    expect(capitalizeFirstLetter('ñoño')).toBe('Ñoño');
  });

  it('should preserve whitespace and special formatting', () => {
    expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
    expect(capitalizeFirstLetter('hello\tworld')).toBe('Hello\tworld');
    expect(capitalizeFirstLetter('hello\nworld')).toBe('Hello\nworld');
  });
});

describe('trimZeros', () => {
  it('should remove trailing zeros after decimal', () => {
    expect(trimZeros('1.00')).toBe('1');
    expect(trimZeros('1.50')).toBe('1.5');
    expect(trimZeros('1.230')).toBe('1.23');
    expect(trimZeros('123.4000')).toBe('123.4');
    expect(trimZeros('0.50')).toBe('0.5');
  });

  it('should handle numbers without decimals', () => {
    expect(trimZeros('100')).toBe('100');
    expect(trimZeros('42')).toBe('42');
    expect(trimZeros('0')).toBe('0');
    expect(trimZeros('1')).toBe('1');
  });

  it('should handle edge cases', () => {
    expect(trimZeros('0.00')).toBe('0');
    expect(trimZeros('.00')).toBe('');
    expect(trimZeros('')).toBe('');
    expect(trimZeros('.')).toBe('.');
  });

  it('should handle numbers with only significant decimals', () => {
    expect(trimZeros('1.23')).toBe('1.23');
    expect(trimZeros('45.67')).toBe('45.67');
    expect(trimZeros('0.01')).toBe('0.01');
    expect(trimZeros('99.99')).toBe('99.99');
  });

  it('should handle multiple decimal points gracefully', () => {
    expect(trimZeros('1.2.3')).toBe('1.2.3');
    expect(trimZeros('1..0')).toBe('1..0');
  });

  it('should handle very long decimal strings', () => {
    expect(trimZeros('1.0000000000')).toBe('1');
    expect(trimZeros('123.45000000')).toBe('123.45');
    expect(trimZeros('0.123000000')).toBe('0.123');
  });

  it('should handle non-string inputs', () => {
    expect(trimZeros(null as any)).toBe('');
    expect(trimZeros(undefined as any)).toBe('');
    expect(trimZeros(123.45 as any)).toBe('123.45');
  });

  it('should handle decimal-only strings', () => {
    expect(trimZeros('.5')).toBe('.5');
    expect(trimZeros('.50')).toBe('.5');
    expect(trimZeros('.123')).toBe('.123');
    expect(trimZeros('.1000')).toBe('.1');
  });

  it('should handle negative numbers', () => {
    expect(trimZeros('-1.00')).toBe('-1');
    expect(trimZeros('-123.4500')).toBe('-123.45');
    expect(trimZeros('-0.50')).toBe('-0.5');
  });
}); 