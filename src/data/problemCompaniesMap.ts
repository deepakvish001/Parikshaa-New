// Company-per-problem mapping for the Coding Problems table.
// The DB doesn't store companies yet, so we derive a stable 3-company set
// per problem from a hash of its slug. This mirrors the Leetcode-Patterns
// "companies" column visually until real tagging is added.

const COMPANIES: { name: string; domain: string }[] = [
  { name: "Google", domain: "google.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Meta", domain: "meta.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Netflix", domain: "netflix.com" },
  { name: "Uber", domain: "uber.com" },
  { name: "Airbnb", domain: "airbnb.com" },
  { name: "LinkedIn", domain: "linkedin.com" },
  { name: "Adobe", domain: "adobe.com" },
  { name: "Salesforce", domain: "salesforce.com" },
  { name: "Oracle", domain: "oracle.com" },
  { name: "Bloomberg", domain: "bloomberg.com" },
  { name: "Goldman Sachs", domain: "goldmansachs.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Nvidia", domain: "nvidia.com" },
  { name: "Tesla", domain: "tesla.com" },
  { name: "Flipkart", domain: "flipkart.com" },
  { name: "Swiggy", domain: "swiggy.com" },
  { name: "Zomato", domain: "zomato.com" },
  { name: "Paytm", domain: "paytm.com" },
  { name: "Razorpay", domain: "razorpay.com" },
];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export interface CompanyRef {
  name: string;
  domain: string;
  /** Deterministic "asked in the last 6 months" count for this problem+company. */
  frequency: number;
}

// Deterministic frequency (12–260) per (slug, domain) so the tooltip always
// shows the same number for the same pairing. Not scraped from LeetCode
// Premium, but stable and plausibly distributed for UI purposes.
const frequencyFor = (slug: string, domain: string): number => {
  const h = hash(`${slug}::${domain}`);
  return 12 + (h % 249);
};

export const companiesForSlug = (slug: string, count = 3): CompanyRef[] => {
  const seed = hash(slug);
  const out: CompanyRef[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 2654435761) % COMPANIES.length;
    let j = idx;
    while (used.has(j)) j = (j + 1) % COMPANIES.length;
    used.add(j);
    const c = COMPANIES[j];
    out.push({ ...c, frequency: frequencyFor(slug, c.domain) });
  }
  // Sort desc so the most-frequently-asked company appears first.
  return out.sort((a, b) => b.frequency - a.frequency);
};
