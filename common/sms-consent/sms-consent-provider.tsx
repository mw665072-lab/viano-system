"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  authAPI,
  isAuthenticated,
  getCurrentUserId,
  SMS_CONSENT_TEXT,
  getFriendlyErrorMessage,
} from "@/lib/api";

interface SmsConsentContextValue {
  /** Whether the agent currently consents to automated property-alert texts. */
  consent: boolean;
  /** True while the initial consent state is being read from the backend. */
  loading: boolean;
  /** True while a consent change is being written. */
  saving: boolean;
  /** Friendly error from the most recent failed toggle, if any. */
  error: string | null;
  /** Flip consent and persist it (optimistic, with rollback on failure). */
  toggleConsent: () => Promise<void>;
  /** Reflect a consent value applied elsewhere (e.g. re-affirm after a phone change). */
  setConsentValue: (value: boolean) => void;
  /** Re-read the authoritative consent state from the backend. */
  refresh: () => Promise<void>;
}

const SmsConsentContext = createContext<SmsConsentContextValue | undefined>(undefined);

/**
 * Single source of truth for the agent's TCPA SMS-consent state so every control
 * that shows/toggles "Text Alerts" (sidebar, profile, ...) stays in lockstep in
 * real time. Backed by the same `/sms-consent` endpoint the profile page used.
 */
export function SmsConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The user we last synced consent for — lets us refetch on login / account switch
  // while avoiding a redundant call on every in-app navigation.
  const syncedUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined" || !isAuthenticated()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const user = await authAPI.getUser();
      setConsent(!!user.sms_consent);
    } catch {
      // Best-effort: keep the last known value if the read fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isAuthenticated()) {
      // Signed out (or on a public page): reset so a later sign-in refetches.
      syncedUserIdRef.current = null;
      setConsent(false);
      setLoading(false);
      return;
    }

    const uid = getCurrentUserId();
    if (uid && uid === syncedUserIdRef.current) return; // already synced for this user
    syncedUserIdRef.current = uid;
    refresh();
  }, [pathname, refresh]);

  const toggleConsent = useCallback(async () => {
    if (saving || loading) return;

    const next = !consent;
    setSaving(true);
    setError(null);
    // Optimistic flip so the switch feels responsive.
    setConsent(next);

    try {
      // On opt-in send the exact disclosure for the audit trail; on opt-out send null
      // so the backend keeps the previously stored text.
      const result = await authAPI.setSmsConsent({
        consent: next,
        consent_text: next ? SMS_CONSENT_TEXT : null,
      });
      // Reflect the backend's authoritative value rather than trusting local state.
      setConsent(result.sms_consent);
    } catch (err) {
      // Roll back the optimistic flip on failure.
      setConsent(!next);
      setError(getFriendlyErrorMessage(err, "Failed to update text alerts"));
    } finally {
      setSaving(false);
    }
  }, [saving, loading, consent]);

  const setConsentValue = useCallback((value: boolean) => {
    setConsent(value);
  }, []);

  return (
    <SmsConsentContext.Provider
      value={{ consent, loading, saving, error, toggleConsent, setConsentValue, refresh }}
    >
      {children}
    </SmsConsentContext.Provider>
  );
}

export function useSmsConsent(): SmsConsentContextValue {
  const ctx = useContext(SmsConsentContext);
  if (!ctx) {
    // Safe no-op fallback so a consumer rendered outside the provider won't crash.
    return {
      consent: false,
      loading: false,
      saving: false,
      error: null,
      toggleConsent: async () => {},
      setConsentValue: () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
