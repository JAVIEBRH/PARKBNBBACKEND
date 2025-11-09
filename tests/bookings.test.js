import { jest } from '@jest/globals';
import { canTransition, getNextStates } from '../utils/bookingState.js';
import { BOOKING_STATUS } from '../utils/constants.js';

describe('Booking State Machine', () => {
  it('should allow transition from draft to confirmed', () => {
    const result = canTransition(BOOKING_STATUS.DRAFT, BOOKING_STATUS.CONFIRMED);
    expect(result).toBe(true);
  });

  it('should not allow transition from completed to draft', () => {
    const result = canTransition(BOOKING_STATUS.COMPLETED, BOOKING_STATUS.DRAFT);
    expect(result).toBe(false);
  });

  it('should return correct next states for draft', () => {
    const nextStates = getNextStates(BOOKING_STATUS.DRAFT);
    expect(nextStates).toContain(BOOKING_STATUS.CONFIRMED);
    expect(nextStates).toContain(BOOKING_STATUS.PENDING_APPROVAL);
  });

  it('should have no next states for paid out', () => {
    const nextStates = getNextStates(BOOKING_STATUS.PAID_OUT);
    expect(nextStates).toHaveLength(0);
  });
});

