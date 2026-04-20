const ONLINE_TTL_MS = 120_000;

type SessionPresenceEntry = {
  userId: number;
  lastSeenAt: number;
};

const presenceByUserId = new Map<number, SessionPresenceEntry>();

function cleanupExpired(now = Date.now()) {
  for (const [userId, entry] of presenceByUserId.entries()) {
    if (now - entry.lastSeenAt > ONLINE_TTL_MS) {
      presenceByUserId.delete(userId);
    }
  }
}

export function touchUserSession(userId: number, at = Date.now()) {
  cleanupExpired(at);
  presenceByUserId.set(userId, {
    userId,
    lastSeenAt: at,
  });
}

export function markUserOffline(userId: number) {
  presenceByUserId.delete(userId);
}

export function getOnlineSessionMap(now = Date.now()) {
  cleanupExpired(now);
  return new Map(presenceByUserId);
}

export function isUserOnline(userId: number, now = Date.now()) {
  cleanupExpired(now);
  const entry = presenceByUserId.get(userId);
  if (!entry) return false;
  return now - entry.lastSeenAt <= ONLINE_TTL_MS;
}

