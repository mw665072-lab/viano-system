// lib/outreach-dates.ts - Date, month and clipboard helpers for the Messages (outreach) pages.
//
// The outreach API sends dates as date-only "YYYY-MM-DD" strings. `new Date("2026-12-04")` parses
// that as UTC midnight, which displays as Dec 3 in US timezones, so never build a Date from one
// directly: use parseDay / formatDay. Full ISO timestamps (recorded_at, rendered_at) are fine with
// `new Date(...)`.

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "YYYY-MM-DD" as a local-time Date (midnight in the browser's timezone). */
export function parseDay(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/** Format a "YYYY-MM-DD" date; defaults to "Dec 4, 2026". Returns the input unchanged if it isn't a date. */
export function formatDay(
    s: string,
    opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
): string {
    if (!DAY_RE.test(s)) return s;
    return parseDay(s).toLocaleDateString('en-US', opts);
}

/** Today in the browser's timezone, as "YYYY-MM-DD". */
export function todayISO(): string {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Whether `s` is a well-formed "YYYY-MM" month. */
export function isValidMonth(s: string | null | undefined): s is string {
    return !!s && MONTH_RE.test(s);
}

/**
 * Shift a "YYYY-MM" month by `delta` months: shiftMonth("2026-12", 1) === "2027-01".
 * Works on the string, so it never depends on the browser's clock or timezone.
 */
export function shiftMonth(month: string, delta: number): string {
    const [y, m] = month.split('-').map(Number);
    const index = y * 12 + (m - 1) + delta;
    const year = Math.floor(index / 12);
    const mon = index - year * 12 + 1;
    return `${String(year).padStart(4, '0')}-${String(mon).padStart(2, '0')}`;
}

/** "2026-12" as "December 2026" (or another format via `opts`). */
export function formatMonth(month: string, opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }): string {
    if (!isValidMonth(month)) return month;
    return parseDay(`${month}-01`).toLocaleDateString('en-US', opts);
}

/** "2026-12" as "December". */
export function monthName(month: string): string {
    return formatMonth(month, { month: 'long' });
}

/** Pull the first "YYYY-MM-DD" out of a string (e.g. a server message), if there is one. */
export function findDay(s: string): string | null {
    const match = s.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
}

// ---- Clipboard ----

/**
 * The text was fetched but couldn't be written to the clipboard (blocked, unsupported, or an
 * insecure context). Carries the text so the UI can show it for a manual press-and-hold copy.
 */
export class ClipboardUnavailableError extends Error {
    text: string;
    constructor(text: string) {
        super("Couldn't copy automatically.");
        this.name = 'ClipboardUnavailableError';
        this.text = text;
    }
}

function getClipboard(): Clipboard | undefined {
    return typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
}

/**
 * Copy text that has to be fetched first, in a way iOS Safari accepts.
 *
 * iOS rejects `clipboard.writeText()` called after awaiting a network request, because the tap no
 * longer counts as a user gesture. So the request starts synchronously inside the tap handler and
 * its *promise* goes into a `ClipboardItem`. Call this directly from the click handler, with no
 * `await` before it:
 *
 *     copyFromServer(() => outreachAPI.copy(id).then(r => r.text))
 *
 * Makes exactly one request. Resolves with the copied text. Rejects with the request's own error
 * (e.g. an ApiError carrying a 409 code) if the request failed, or with ClipboardUnavailableError
 * (carrying the text) if only the clipboard write failed.
 */
export async function copyFromServer(getText: () => Promise<string>): Promise<string> {
    const textPromise = getText();
    // Handled below; this only stops an "unhandled rejection" warning if we never await it.
    textPromise.catch(() => {});

    const clipboard = getClipboard();
    if (clipboard?.write && typeof ClipboardItem !== 'undefined') {
        const blob = textPromise.then(t => new Blob([t], { type: 'text/plain' }));
        blob.catch(() => {});
        try {
            await clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
            return await textPromise;
        } catch {
            // Either the request failed (re-thrown below with its real error; Chrome reports it as a
            // NotAllowedError here) or this browser refused the write: fall through to writeText.
        }
    }

    const text = await textPromise;
    if (!clipboard?.writeText) throw new ClipboardUnavailableError(text);
    try {
        await clipboard.writeText(text);
    } catch {
        throw new ClipboardUnavailableError(text);
    }
    return text;
}

/** Copy text that's already on the page. Rejects with ClipboardUnavailableError when blocked. */
export async function copyText(text: string): Promise<void> {
    const clipboard = getClipboard();
    if (!clipboard?.writeText) throw new ClipboardUnavailableError(text);
    try {
        await clipboard.writeText(text);
    } catch {
        throw new ClipboardUnavailableError(text);
    }
}

/** Select all text inside `el`, so the user can press and hold to copy it manually. */
export function selectContents(el: HTMLElement | null): void {
    if (!el || typeof window === 'undefined') return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
}
