export type BiometricReferenceFace = {
  agentId: number;
  matricule: string;
  nom: string;
  prenom: string;
  fullName: string;
  descriptors: number[][];
};

const BIOMETRIC_REFERENCES_CACHE_TTL_MS = 90_000;
const BIOMETRIC_REFERENCES_CACHE_MAX_ENTRIES = 60;

type CacheEntry = {
  data: BiometricReferenceFace[];
  createdAt: number;
  expiresAt: number;
};

const referencesCacheByUser = new Map<number, CacheEntry>();

function trimBiometricReferencesCache(now = Date.now()) {
  for (const [userId, entry] of referencesCacheByUser.entries()) {
    if (entry.expiresAt <= now) {
      referencesCacheByUser.delete(userId);
    }
  }

  if (referencesCacheByUser.size <= BIOMETRIC_REFERENCES_CACHE_MAX_ENTRIES) {
    return;
  }

  const orderedByAge = [...referencesCacheByUser.entries()].sort(
    (left, right) => left[1].createdAt - right[1].createdAt
  );
  const overflow = referencesCacheByUser.size - BIOMETRIC_REFERENCES_CACHE_MAX_ENTRIES;

  for (let i = 0; i < overflow; i += 1) {
    referencesCacheByUser.delete(orderedByAge[i][0]);
  }
}

export function readBiometricReferencesCache(userId: number) {
  const now = Date.now();
  trimBiometricReferencesCache(now);

  const entry = referencesCacheByUser.get(userId);
  if (!entry || entry.expiresAt <= now) {
    if (entry) {
      referencesCacheByUser.delete(userId);
    }
    return null;
  }

  return {
    data: entry.data,
    ttlMs: Math.max(0, entry.expiresAt - now),
  };
}

export function writeBiometricReferencesCache(userId: number, data: BiometricReferenceFace[]) {
  const now = Date.now();
  trimBiometricReferencesCache(now);

  referencesCacheByUser.set(userId, {
    data,
    createdAt: now,
    expiresAt: now + BIOMETRIC_REFERENCES_CACHE_TTL_MS,
  });
}

export function invalidateBiometricReferencesCache() {
  referencesCacheByUser.clear();
}

