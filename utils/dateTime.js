export const addHours = (date, hours) => {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + hours);
  return newDate;
};

export const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export const diffInHours = (date1, date2) => {
  return Math.abs(date2 - date1) / 36e5;
};

export const diffInDays = (date1, date2) => {
  return Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
};

export const isOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

export const roundToNearestHour = (date) => {
  const newDate = new Date(date);
  newDate.setMinutes(0, 0, 0);
  return newDate;
};

export const formatDuration = (hours) => {
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

