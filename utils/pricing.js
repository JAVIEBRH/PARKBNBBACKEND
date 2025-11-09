import { diffInHours, diffInDays } from './dateTime.js';

export const calculateBasePrice = (startDate, endDate, hourlyRate, dailyRate) => {
  const hours = diffInHours(startDate, endDate);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (dailyRate && days > 0) {
    const dayPrice = days * dailyRate;
    const hourPrice = remainingHours * hourlyRate;
    return dayPrice + hourPrice;
  }

  return hours * hourlyRate;
};

export const applySpecialPricing = (basePrice, specials, startDate, endDate) => {
  if (!specials || specials.length === 0) return basePrice;

  let adjustedPrice = basePrice;

  for (const special of specials) {
    if (isDateInRange(startDate, endDate, special.startDate, special.endDate)) {
      if (special.type === 'percentage') {
        adjustedPrice = adjustedPrice * (1 + special.value / 100);
      } else if (special.type === 'fixed') {
        adjustedPrice = adjustedPrice + special.value;
      } else if (special.type === 'override') {
        adjustedPrice = special.value;
      }
    }
  }

  return adjustedPrice;
};

export const calculateServiceFee = (basePrice) => {
  const feePercentage = parseFloat(process.env.SERVICE_FEE_PERCENTAGE || '15') / 100;
  return basePrice * feePercentage;
};

export const calculateTotal = (basePrice, serviceFee, discount = 0) => {
  return basePrice + serviceFee - discount;
};

export const calculateHostPayout = (basePrice) => {
  const serviceFee = calculateServiceFee(basePrice);
  return basePrice - serviceFee;
};

export const estimatePrice = (listing, startDate, endDate, coupon = null) => {
  const basePrice = calculateBasePrice(
    startDate,
    endDate,
    listing.pricing.hourlyRate,
    listing.pricing.dailyRate
  );

  const adjustedPrice = applySpecialPricing(
    basePrice,
    listing.pricing.specials,
    startDate,
    endDate
  );

  const serviceFee = calculateServiceFee(adjustedPrice);

  let discount = 0;
  if (coupon && coupon.isValid) {
    if (coupon.type === 'percentage') {
      discount = adjustedPrice * (coupon.value / 100);
    } else if (coupon.type === 'fixed') {
      discount = coupon.value;
    }
  }

  const total = calculateTotal(adjustedPrice, serviceFee, discount);
  const hostPayout = calculateHostPayout(adjustedPrice);

  return {
    basePrice: Math.round(adjustedPrice * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    hostPayout: Math.round(hostPayout * 100) / 100,
  };
};

export const calculateOverstayCharge = (hourlyRate, overstayHours) => {
  const multiplier = parseFloat(process.env.OVERSTAY_RATE_MULTIPLIER || '1.5');
  return hourlyRate * multiplier * overstayHours;
};

const isDateInRange = (checkStart, checkEnd, rangeStart, rangeEnd) => {
  return checkStart < rangeEnd && checkEnd > rangeStart;
};

