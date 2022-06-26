const humanReadableTime = (lcpTiming) => {
  return lcpTiming.toPrecision(4) + " ms";
};

const calculateLcp = (info) => {
  document.getElementById("ttfb").textContent = humanReadableTime(
    info[0].duration
  );
  document.getElementById("rld").textContent = humanReadableTime(
    info[1].duration
  );
  document.getElementById("rlt").textContent = humanReadableTime(
    info[2].duration
  );
  document.getElementById("erd").textContent = humanReadableTime(
    info[3].duration
  );
  let lcp = ((info[3].duration + info[3].startTime) / 1000).toFixed(3);
  document.getElementById("lcp-total").textContent = lcp + " seconds";
  console.log(lcp);

  if (lcp < 2.5) {
    document.getElementById("lcp-total").style.backgroundColor = "green";
    document.getElementById("lcp-total").style.color = "white";
  } else {
    document.getElementById("lcp-total").style.backgroundColor = "red";
    document.getElementById("lcp-total").style.color = "white";
  }
};

// Update the relevant fields with the new data.
const setLCPInfo = (info) => {
  // if (info != undefined) {
  try {
    calculateLcp(info);
  } catch {}
  // }
};

chrome.tabs.query(
  {
    active: true,
    currentWindow: true,
  },
  (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { from: "popup", subject: "LCPInfo" },
      setLCPInfo
    );
  }
);
