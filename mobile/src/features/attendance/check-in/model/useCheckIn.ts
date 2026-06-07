import { CheckInStatus } from '@softtime/shared';

const MOCK_RESULTS = [
  { status: CheckInStatus.ON_TIME, time: '10:15' },
  { status: CheckInStatus.LATE, time: '10:30' },
  { status: CheckInStatus.EARLY_ARRIVAL, time: '09:55' },
] satisfies Array<{ status: string; time: string }>;

let cycleIndex = 0;

export function useCheckIn() {
  function getNextMockResult(): { status: string; time: string } {
    const result = MOCK_RESULTS[cycleIndex];
    cycleIndex = (cycleIndex + 1) % MOCK_RESULTS.length;
    return result;
  }

  return { getNextMockResult };
}
