console.log("loaded");
const LCP_SUB_PARTS = [
  "Time to first byte",
  "Resource load delay",
  "Resource load time",
  "Element render delay",
];

let lcpSubPartMeasures = [];
let lcpElement = "";

const humanReadableTime = (lcpTiming, unit) => {
  return lcpTiming.toPrecision(4) + ` ${unit}`;
};

new PerformanceObserver((list) => {
  const lcpEntry = list.getEntries().at(-1);
  const navEntry = performance.getEntriesByType("navigation")[0];
  const lcpResEntry = performance
    .getEntriesByType("resource")
    .filter((e) => e.name === lcpEntry.url)[0];

  // Ignore LCP entries that aren't images to reduce DevTools noise.
  // Comment this line out if you want to include text entries.
  if (!lcpEntry.url) return;

  // Compute the start and end times of each LCP sub-part.
  // WARNING! If your LCP resource is loaded cross-origin, make sure to add
  // the `Timing-Allow-Origin` (TAO) header to get the most accurate results.
  const ttfb = navEntry.responseStart;
  const lcpRequestStart = Math.max(
    ttfb,
    // Prefer `requestStart` (if TOA is set), otherwise use `startTime`.
    lcpResEntry ? lcpResEntry.requestStart || lcpResEntry.startTime : 0
  );
  const lcpResponseEnd = Math.max(
    lcpRequestStart,
    lcpResEntry ? lcpResEntry.responseEnd : 0
  );
  const lcpRenderTime = Math.max(
    lcpResponseEnd,
    // Prefer `renderTime` (if TOA is set), otherwise use `loadTime`.
    lcpEntry ? lcpEntry.renderTime || lcpEntry.loadTime : 0
  );

  // Clear previous measures before making new ones.
  // Note: due to a bug this does not work in Chrome DevTools.
  performance.clearMeasures();
  // LCP_SUB_PARTS.forEach((performance) => {
  //   performance.clearMeasures;
  // });

  // Create measures for each LCP sub-part for easier
  // visualization in the Chrome DevTools Performance panel.
  lcpSubPartMeasures = [
    performance.measure(LCP_SUB_PARTS[0], {
      start: 0,
      end: ttfb,
    }),
    performance.measure(LCP_SUB_PARTS[1], {
      start: ttfb,
      end: lcpRequestStart,
    }),
    performance.measure(LCP_SUB_PARTS[2], {
      start: lcpRequestStart,
      end: lcpResponseEnd,
    }),
    performance.measure(LCP_SUB_PARTS[3], {
      start: lcpResponseEnd,
      end: lcpRenderTime,
    }),
  ];

  lcpElement = lcpEntry.element;
  let lcpVal = lcpRenderTime / 1000;

  let lcpElm = document.createElement("div");
  lcpElm.innerHTML = `<div id="lcpinfo-page"> 
    <span class="lcp-data">TTFB: ${humanReadableTime(
      lcpSubPartMeasures[0].duration,
      "ms"
    )}</span>
    <span class="lcp-data">RLD: ${humanReadableTime(
      lcpSubPartMeasures[1].duration,
      "ms"
    )}</span>
    <span class="lcp-data">RLT: ${humanReadableTime(
      lcpSubPartMeasures[2].duration,
      "ms"
    )}</span>
    <span class="lcp-data">ERD: ${humanReadableTime(
      lcpSubPartMeasures[3].duration,
      "ms"
    )}</span>
    <span class="lcp-data">LCP: ${humanReadableTime(lcpVal, "s")}</span>
    </div>`;

  document.getElementsByTagName("body")[0].prepend(lcpElm);
}).observe({ type: "largest-contentful-paint", buffered: true });

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  if (msg.from === "popup" && msg.subject === "LCPInfo") {
    response(lcpSubPartMeasures, lcpElement);
  }
});