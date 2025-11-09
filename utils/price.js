/**
 * Calcula el precio base según duración
 */
export const calculateBasePrice = (startDate, endDate, hourlyRate, dailyRate = null) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  const hours = diffMs / (1000 * 60 * 60);

  if (dailyRate && hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return days * dailyRate + remainingHours * hourlyRate;
  }

  return hours * hourlyRate;
};

/**
 * Calcula el service fee (comisión de la plataforma)
 */
export const calculateServiceFee = (basePrice, feePercentage = 15) => {
  return basePrice * (feePercentage / 100);
};

/**
 * Calcula el payout para el host
 */
export const calculateHostPayout = (basePrice, feePercentage = 15) => {
  const serviceFee = calculateServiceFee(basePrice, feePercentage);
  return basePrice - serviceFee;
};

/**
 * Aplica descuento
 */
export const applyDiscount = (price, discount) => {
  if (discount.type === 'percentage') {
    return price * (discount.value / 100);
  }
  return Math.min(discount.value, price);
};

/**
 * Calcula el total de una reserva
 */
export const calculateBookingTotal = (
  startDate,
  endDate,
  hourlyRate,
  dailyRate = null,
  discount = null,
  feePercentage = 15
) => {
  const basePrice = calculateBasePrice(startDate, endDate, hourlyRate, dailyRate);
  const serviceFee = calculateServiceFee(basePrice, feePercentage);
  const discountAmount = discount ? applyDiscount(basePrice, discount) : 0;
  const total = basePrice + serviceFee - discountAmount;
  const hostPayout = calculateHostPayout(basePrice, feePercentage);

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    serviceFee: Math.round(serviceFee * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    hostPayout: Math.round(hostPayout * 100) / 100,
  };
};

/**
 * Redondea precio a 2 decimales
 */
export const roundPrice = (price) => {
  return Math.round(price * 100) / 100;
};

/**
 * Valida que el precio sea válido
 */
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0;
};




