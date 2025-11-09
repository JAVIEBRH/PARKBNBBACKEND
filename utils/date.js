import { format, formatDistanceToNow, isPast, isFuture, addDays, addHours, differenceInHours, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha con date-fns
 */
export const formatDateFns = (date, formatStr = 'PP', options = {}) => {
  return format(new Date(date), formatStr, {
    locale: es,
    ...options,
  });
};

/**
 * Formatea fecha relativa (hace 2 horas, hace 3 días)
 */
export const formatRelative = (date) => {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: es,
  });
};

/**
 * Verifica si una fecha ya pasó
 */
export const isDatePast = (date) => {
  return isPast(new Date(date));
};

/**
 * Verifica si una fecha es futura
 */
export const isDateFuture = (date) => {
  return isFuture(new Date(date));
};

/**
 * Suma días a una fecha
 */
export const addDaysToDate = (date, days) => {
  return addDays(new Date(date), days);
};

/**
 * Suma horas a una fecha
 */
export const addHoursToDate = (date, hours) => {
  return addHours(new Date(date), hours);
};

/**
 * Calcula diferencia en horas
 */
export const getHoursDifference = (date1, date2) => {
  return differenceInHours(new Date(date2), new Date(date1));
};

/**
 * Calcula diferencia en días
 */
export const getDaysDifference = (date1, date2) => {
  return differenceInDays(new Date(date2), new Date(date1));
};

/**
 * Verifica si dos rangos de fechas se solapan
 */
export const doDateRangesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);

  return s1 < e2 && s2 < e1;
};

/**
 * Obtiene el día de la semana (0-6)
 */
export const getDayOfWeek = (date) => {
  return new Date(date).getDay();
};

/**
 * Nombres de días de la semana
 */
export const getDayName = (dayNumber) => {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[dayNumber];
};




