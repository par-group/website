// The dashboard's waitlist filters, read from and written to the page's query
// string, so a filtered list can be bookmarked, shared and downloaded as is.

import { PLATFORMS } from "@/lib/waitlist";

export const PAGE_SIZE = 50;
/**
 * The `source` filter value for signups that came with no ?ref, utm_* or referring
 * site. Stored sources can't contain parentheses (cleanSource), so it can't clash.
 */
export const NO_SOURCE = "(none)";
const SEARCH_MAX = 100;

export const SCHOOL_FILTERS = { york: "York University", other: "Another school", none: "Not answered" } as const;
export const PHONE_FILTERS = { ...PLATFORMS, none: "Not answered" } as const;

export type SignupFilters = {
  /** Text the email, school or source contains. */
  q: string;
  /** An exact source, or NO_SOURCE. */
  source: string | null;
  school: keyof typeof SCHOOL_FILTERS | null;
  platform: keyof typeof PHONE_FILTERS | null;
  /** 1-based. */
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
const oneOf = <K extends string>(value: string, options: Record<K, unknown>): K | null => (Object.hasOwn(options, value) ? (value as K) : null);

export function parseSignupFilters(params: Params): SignupFilters {
  const page = Number.parseInt(first(params.page), 10);
  return {
    q: first(params.q).slice(0, SEARCH_MAX),
    source: first(params.source) || null,
    school: oneOf(first(params.school), SCHOOL_FILTERS),
    platform: oneOf(first(params.platform), PHONE_FILTERS),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** The query string for a set of filters (page 1 is left out), e.g. for links and the download. */
export function signupFiltersQuery(filters: Partial<SignupFilters>): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.source) params.set("source", filters.source);
  if (filters.school) params.set("school", filters.school);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const isFiltered = (f: SignupFilters) => !!(f.q || f.source || f.school || f.platform);
