/**
 * Pure countdown calculation utilities
 */

/**
 * Calculates remaining days, hours, minutes, seconds from target timestamp
 * @param {string|Date|number} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isExpired: boolean, totalMs: number }}
 */
export const calculateTimeRemaining = (targetDate) => {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const totalMs = target - now;

  if (isNaN(target) || totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0,
    };
  }

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs,
  };
};

/**
 * Pads numbers to two digits (e.g. 9 -> "09")
 */
export const padZero = (value) => {
  return String(value).padStart(2, '0');
};
