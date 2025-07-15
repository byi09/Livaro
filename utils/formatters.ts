// ------------------------------------------------------------
// |   Utility functions for formatting strings and numbers   |
// ------------------------------------------------------------

/**
 * Format a number with commas as thousands separators.
 * @param num - Number to format
 */
export function formatPrice(num: number): string {
  if (num == null || isNaN(num)) return "0";
  
  // Handle very small numbers by rounding to nearest dollar
  const rounded = Math.round(num);
  
  // Handle negative numbers
  if (rounded < 0) {
    const positive = Math.abs(rounded);
    const separated = positive.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `-$${separated}`;
  }
  
  const separated = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$${separated}`;
}

/**
 * Format a large price with M for millions and K for thousands.
 */
export function formatLargeNumber(num: number): string {
  if (num == null || isNaN(num)) return "0";
  
  // Handle negative numbers
  if (num < 0) {
    const positive = Math.abs(num);
    if (positive >= 1_000_000) {
      return `-${(positive / 1_000_000).toFixed(1)}M`;
    } else if (positive >= 1_000) {
      return `-${(positive / 1_000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  }
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format a price range as a string.
 * @param min - Minimum price
 * @param max - Maximum price
 * @return Formatted price range string
 */
export function formatPriceRange(min?: number, max?: number): string {
  const isValidMin = typeof min === "number" && !isNaN(min) && min > 0;
  const isValidMax = typeof max === "number" && !isNaN(max) && max > 0;
  if (isValidMin && isValidMax)
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  if (isValidMin) return `From ${formatPrice(min)}`;
  if (isValidMax) return `Up to ${formatPrice(max)}`;
  return "Price";
}

/**
 * Format number of bedrooms and bathrooms.
 * @param bedrooms - Number of bedrooms
 * @param bathrooms - Number of bathrooms
 * @return Formatted string
 */
export function formatBedroomsAndBathrooms(
  bedrooms?: number,
  bathrooms?: number
): string {
  // Handle undefined/null values - if either is undefined, return default
  if (bedrooms == null || bathrooms == null) {
    return "Beds & Baths";
  }
  
  // Truncate decimal values
  const numBeds = Math.floor(bedrooms);
  const numBaths = Math.floor(bathrooms);
  
  // Handle 0, 0 case
  if (numBeds === 0 && numBaths === 0) {
    return "Beds & Baths";
  }
  
  if (numBeds >= 0 && numBaths >= 0) {
    return `${numBeds}+ bd, ${numBaths}+ ba`;
  }
  return "Beds & Baths";
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalizeFirstLetter(str: string): string {
  if (str == null) return "";
  if (typeof str !== "string") return String(str);
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Remove trailing zeros from a number string.
 */
export function trimZeros(str: string): string {
  if (str == null) return "";
  if (typeof str !== "string") return String(str);
  
  // Handle multiple decimal points - return as is
  const decimalCount = (str.match(/\./g) || []).length;
  if (decimalCount > 1) {
    return str;
  }
  
  if (str.includes(".")) {
    return str.replace(/\.?0+$/, "");
  }
  return str;
}
