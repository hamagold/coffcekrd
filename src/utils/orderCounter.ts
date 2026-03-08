/**
 * Returns the next daily order number (resets at midnight).
 * Uses localStorage with a date key to track daily counter.
 */
export const getNextDailyOrderNumber = (): string => {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const storedDate = localStorage.getItem('plc_order_date');
  
  let counter: number;
  if (storedDate === today) {
    counter = parseInt(localStorage.getItem('plc_order_counter') || '0') + 1;
  } else {
    // New day — reset counter
    counter = 1;
    localStorage.setItem('plc_order_date', today);
  }
  
  localStorage.setItem('plc_order_counter', String(counter));
  return String(counter).padStart(3, '0');
};
