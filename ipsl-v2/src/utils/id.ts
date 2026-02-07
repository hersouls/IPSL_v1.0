export function memberId(): string {
  return 'm_' + Date.now();
}

export function transactionId(): string {
  return 't_' + Date.now();
}

export function eventId(): string {
  return 'ev_' + (Date.now() + 1);
}

export function scheduleId(): string {
  return 'sc_' + (Date.now() + 2);
}

export function votingSessionId(): string {
  return 'vs_' + (Date.now() + 3);
}
