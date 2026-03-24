// Web Vitals constants and thresholds

export const VITALS = {
  LCP: {
    good: 2500,
    unit: "ms",
    name: "Largest Contentful Paint",
    audit: "largest-contentful-paint",
  },
  FCP: {
    good: 1800,
    unit: "ms",
    name: "First Contentful Paint",
    audit: "first-contentful-paint",
  },
  CLS: {
    good: 0.1,
    unit: "",
    name: "Cumulative Layout Shift",
    audit: "cumulative-layout-shift",
  },
  TBT: {
    good: 200,
    unit: "ms",
    name: "Total Blocking Time",
    audit: "total-blocking-time",
  },
  SI: {
    good: 3400,
    unit: "ms",
    name: "Speed Index",
    audit: "speed-index",
  },
  TTFB: {
    good: 800,
    unit: "ms",
    name: "Time to First Byte",
    audit: "server-response-time",
  },
};
