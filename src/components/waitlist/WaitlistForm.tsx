"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { EMAIL_MAX, PLATFORMS, STUDENTS_ONLY, isStudentEmail, isValidEmail, normalizeEmail, sourceFromLocation, type Platform } from "@/lib/waitlist";
import { SITE } from "@/lib/site";
import { joinWaitlist, saveWaitlistDetails } from "@/server/actions/waitlist";

// One signup per visit, shared by every form on the page: the form that was
// used walks through the optional question, the others just confirm.
type Signup = { id: string; email: string; school: string | null; owner: string; step: "details" | "done" };

let signup: Signup | null = null;
const listeners = new Set<() => void>();
const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => signup,
  set(next: Signup) {
    signup = next;
    listeners.forEach((l) => l());
  },
};

const SOURCE_KEY = "sidekick:source";

/**
 * Remembers where the visitor came from for the rest of the visit: the page's own source
 * (an invite link), else ?ref=, utm_* or the referring site. The first source wins:
 * document.referrer doesn't change while moving between pages, so re-reading it on /join
 * would replace a landing page's ?ref= with the referring site.
 */
function rememberSource(pageSource?: string) {
  try {
    if (sessionStorage.getItem(SOURCE_KEY)) return;
    const source = pageSource ?? sourceFromLocation(location.search, document.referrer, location.host);
    if (source) sessionStorage.setItem(SOURCE_KEY, source);
  } catch {
    // storage blocked: the signup just has no source
  }
}

function currentSource() {
  try {
    return sessionStorage.getItem(SOURCE_KEY);
  } catch {
    return null;
  }
}

export function WaitlistForm({
  tone = "light",
  buttonLabel = "Join the waitlist",
  source,
}: {
  tone?: "light" | "teal";
  buttonLabel?: string;
  /** Where signups from this page come from, when the URL doesn't say (e.g. "invite"). */
  source?: string;
}) {
  const key = useId();
  const current = useSyncExternalStore(store.subscribe, store.get, () => null);

  useEffect(() => rememberSource(source), [source]);

  if (!current) return <EmailStep owner={key} tone={tone} buttonLabel={buttonLabel} />;
  if (current.owner !== key) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-surface px-5 py-3 font-semibold text-green shadow-card">
        <CheckIcon className="size-5" /> You’re on the list. We’ll email you at launch.
      </p>
    );
  }
  return current.step === "details" ? <DetailsStep signup={current} /> : <DoneStep signup={current} />;
}

function EmailStep({ owner, tone, buttonLabel }: { owner: string; tone: "light" | "teal"; buttonLabel: string }) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const honeypot = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // The same rule the server enforces, checked here first so the answer is instant.
    const normalized = normalizeEmail(email);
    if (!isStudentEmail(normalized)) {
      setError(isValidEmail(normalized) ? STUDENTS_ONLY : "Enter a valid email address, like yourname@my.yorku.ca.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await joinWaitlist({ email, source: currentSource(), website: honeypot.current?.value });
        if (res.ok) store.set({ id: res.id, email: normalizeEmail(email), school: res.school, owner, step: "details" });
        else setError(res.error);
      } catch {
        setError("Couldn’t connect. Check your connection and try again.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="w-full max-w-lg">
      <div className="flex flex-col gap-2 rounded-[1.75rem] bg-surface p-1.5 shadow-card ring-1 ring-line transition focus-within:ring-2 focus-within:ring-green/40 sm:flex-row sm:items-center sm:rounded-full">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={EMAIL_MAX}
          placeholder="yourname@my.yorku.ca"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-note`}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-ink outline-none placeholder:text-ink-soft/60"
        />
        {/* Honeypot: hidden from people and screen readers; bots tend to fill it in. */}
        <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            Website
            <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button type="submit" disabled={pending} className="btn-primary px-6 py-3 whitespace-nowrap">
          {pending ? "Joining…" : buttonLabel}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className={`mt-3 px-2 text-sm font-semibold ${tone === "teal" ? "text-white" : "text-danger"}`}>
          {error}
        </p>
      ) : (
        <p id={`${inputId}-note`} className={`mt-3 px-2 text-sm ${tone === "teal" ? "text-white/80" : "text-ink-soft"}`}>
          For York students: join with your @my.yorku.ca email. We’ll email you when Sidekick launches, and you can leave anytime.
        </p>
      )}
    </form>
  );
}

function DetailsStep({ signup }: { signup: Signup }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => heading.current?.focus(), []);

  const finish = () => store.set({ ...signup, step: "done" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await saveWaitlistDetails({ id: signup.id, platform });
        if (res.ok) finish();
        else setError(res.error);
      } catch {
        setError("Couldn’t connect. Check your connection and try again.");
      }
    });
  };

  return (
    <div className="card w-full max-w-lg p-6 text-left text-ink">
      <h3 ref={heading} tabIndex={-1} className="flex items-center gap-2 font-serif text-2xl font-semibold outline-none">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
          <CheckIcon className="size-4" />
        </span>
        You’re on the list!
      </h3>
      <p className="mt-2 text-ink-soft">
        We’ll email <strong className="text-ink [overflow-wrap:anywhere]">{signup.email}</strong> when Sidekick launches. One optional question helps us plan
        the launch:
      </p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
        <fieldset>
          <legend className="label">Which phone do you use?</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORMS) as Platform[]).map((p) => (
              <Choice key={p} name="platform" checked={platform === p} onChange={() => setPlatform(p)}>
                {PLATFORMS[p]}
              </Choice>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending || !platform} className="btn-primary">
            {pending ? "Saving…" : "Save answer"}
          </button>
          <button type="button" onClick={finish} className="btn-ghost">
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}

function Choice({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="pill cursor-pointer border border-line bg-surface text-ink transition select-none hover:bg-green-soft has-checked:border-green has-checked:bg-green-soft has-checked:text-green has-focus-visible:ring-2 has-focus-visible:ring-green/40">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function DoneStep({ signup }: { signup: Signup }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => heading.current?.focus(), []);

  const share = async () => {
    const url = `${SITE.url}/?ref=share`;
    const text = "Sidekick is a friends-only app for York students. Join the waitlist with me:";
    try {
      if (navigator.share) {
        await navigator.share({ title: SITE.name, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // share sheet dismissed, or clipboard blocked
    }
  };

  return (
    <div className="card w-full max-w-lg p-6 text-left text-ink" role="status">
      <h3 ref={heading} tabIndex={-1} className="flex items-center gap-2 font-serif text-2xl font-semibold outline-none">
        <span className="grid size-8 place-items-center rounded-full bg-accent text-white">
          <CheckIcon className="size-4" />
        </span>
        You’re all set.
      </h3>
      <p className="mt-2 text-ink-soft">
        We’ll email <strong className="text-ink [overflow-wrap:anywhere]">{signup.email}</strong> as soon as Sidekick is ready. Sidekick is better when your friends
        are on it too.
      </p>
      <button type="button" onClick={share} className="btn-secondary mt-5">
        <ShareIcon className="size-4" /> {copied ? "Link copied" : "Share the waitlist"}
      </button>
    </div>
  );
}
