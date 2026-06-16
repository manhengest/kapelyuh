export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

export function isTimerExpired(endsAt: number, now: number): boolean {
  return now >= endsAt;
}
