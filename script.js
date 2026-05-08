const chapters = document.querySelectorAll(".chapter");
const visualTitle = document.querySelector("#visual-title");
const visualDescription = document.querySelector("#visual-description");
const visualCaption = document.querySelector("#visual-caption");
const visualStage = document.querySelector(".visual-stage");

const TIMELINE_START = 2011;
const TIMELINE_END = 2025;
const CHART_WIDTH = 960;
const CHART_HEIGHT = 360;
const MARGIN = { top: 18, right: 22, bottom: 52, left: 52 };

const observedAnchors = [
  {
    year: 2011,
    sharePct: 0.3,
    low: 0.1,
    high: 0.5,
    observed: false,
    label: "Pre-scale base",
    note: "Estimated baseline from GAO evidence that no investor held 1,000+ homes in late 2011.",
    sourceShort: "GAO-24-106643",
  },
  {
    year: 2015,
    sharePct: 1.5,
    low: 1.0,
    high: 2.0,
    observed: true,
    label: "Early scale",
    note: "GAO-reviewed studies estimate 170k-300k institutional homes, roughly 1-2% of U.S. SFR stock.",
    sourceShort: "GAO-24-106643",
  },
  {
    year: 2022,
    sharePct: 3.8,
    low: 3.8,
    high: 3.8,
    observed: true,
    label: "Institutional benchmark",
    note: "Urban Institute estimate cited by Callan: 574k of 15.1M U.S. single-family rentals.",
    sourceShort: "Callan (2024) citing Urban Institute",
  },
  {
    year: 2025,
    sharePct: 4.6,
    low: 4.2,
    high: 5.0,
    observed: false,
    label: "Recent estimate",
    note: "Estimated continuation based on observed 2022 share plus private-fund SFR capital expansion through 2025.",
    sourceShort: "Interpolation + NCREIF/Houlihan Lokey context",
  },
];

const eventMarkers = [
  {
    year: 2012,
    title: "Post-crisis entry",
    note: "Large operators begin scaling scattered-home acquisitions.",
  },
  {
    year: 2017,
    title: "Public market phase",
    note: "Public REIT market deepens institutional participation.",
  },
  {
    year: 2021,
    title: "Demand acceleration",
    note: "Pandemic-era migration and rent growth pull in more institutional capital.",
  },
  {
    year: 2023,
    title: "Rate reset",
    note: "Higher-rate regime shifts focus from acquisition speed to operating discipline.",
  },
];

function interpolate(anchorA, anchorB, year, key) {
  const span = anchorB.year - anchorA.year;
  const ratio = span === 0 ? 0 : (year - anchorA.year) / span;
  return anchorA[key] + (anchorB[key] - anchorA[key]) * ratio;
}

function buildAnnualSeries() {
  const anchors = [...observedAnchors].sort((a, b) => a.year - b.year);
  const series = [];

  for (let year = TIMELINE_START; year <= TIMELINE_END; year += 1) {
    const exact = anchors.find((item) => item.year === year);
    if (exact) {
      series.push({ ...exact, year });
      continue;
    }

    const nextAnchor = anchors.find((item) => item.year > year);
    const prevAnchor = [...anchors].reverse().find((item) => item.year < year);
    if (!nextAnchor || !prevAnchor) {
      continue;
    }

    series.push({
      year,
      sharePct: interpolate(prevAnchor, nextAnchor, year, "sharePct"),
      low: interpolate(prevAnchor, nextAnchor, year, "low"),
      high: interpolate(prevAnchor, nextAnchor, year, "high"),
      observed: false,
      label: "Interpolated year",
      note: `Interpolated between ${prevAnchor.year} and ${nextAnchor.year} anchor points.`,
      sourceShort: `${prevAnchor.sourceShort}; ${nextAnchor.sourceShort}`,
    });
  }

  return series;
}

function scaleX(year) {
  const usableWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  return MARGIN.left + ((year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * usableWidth;
}

function scaleY(value) {
  const yMax = 6;
  const usableHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  return MARGIN.top + (1 - value / yMax) * usableHeight;
}

function toLinePath(points) {
  if (!points.length) {
    return "";
  }
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function toAreaPath(points) {
  if (!points.length) {
    return "";
  }
  const baselineY = scaleY(0);
  const start = `M ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)}`;
  const topLine = points.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const end = `L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  return `${start} ${topLine} ${end}`;
}

function toBandPath(points) {
  if (!points.length) {
    return "";
  }
  const upper = points.map((point) => `L ${point.x.toFixed(2)} ${point.yHigh.toFixed(2)}`).join(" ");
  const lower = [...points]
    .reverse()
    .map((point) => `L ${point.x.toFixed(2)} ${point.yLow.toFixed(2)}`)
    .join(" ");
  return `M ${points[0].x.toFixed(2)} ${points[0].yHigh.toFixed(2)} ${upper} ${lower} Z`;
}

function renderMiniChart(series) {
  const miniSvg = document.querySelector("[data-sfr-mini-svg]");
  const miniYears = document.querySelector("[data-sfr-mini-years]");
  if (!miniSvg || !miniYears) {
    return;
  }

  const points = series.map((row) => ({
    x: ((row.year - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 280,
    y: 76 - (row.sharePct / 6) * 66,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `M ${points[0].x.toFixed(2)} 76 ${points
    .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")} L ${points[points.length - 1].x.toFixed(2)} 76 Z`;

  miniSvg.querySelector("[data-sfr-mini-area]").setAttribute("d", areaPath);
  miniSvg.querySelector("[data-sfr-mini-line]").setAttribute("d", linePath);
  miniYears.innerHTML = `
    <span>${TIMELINE_START}</span>
    <span>${TIMELINE_END}</span>
  `;
}

function renderTimeline(series, eventData) {
  const chart = document.querySelector("[data-sfr-chart]");
  if (!chart) {
    return;
  }

  const gridGroup = chart.querySelector("[data-sfr-grid]");
  const eventGroup = chart.querySelector("[data-sfr-events]");
  const linePath = chart.querySelector("[data-sfr-line]");
  const areaPath = chart.querySelector("[data-sfr-area]");
  const bandPath = chart.querySelector("[data-sfr-band]");
  const axisYears = chart.querySelector("[data-sfr-year-buttons]");
  const focusDot = chart.querySelector("[data-sfr-focus-dot]");
  const focusLine = chart.querySelector("[data-sfr-focus-line]");
  const svg = chart.querySelector("[data-sfr-svg]");

  const detailYear = chart.querySelector("[data-sfr-detail-year]");
  const detailValue = chart.querySelector("[data-sfr-detail-value]");
  const detailTitle = chart.querySelector("[data-sfr-detail-title]");
  const detailSummary = chart.querySelector("[data-sfr-detail-summary]");
  const detailSource = chart.querySelector("[data-sfr-detail-source]");
  const detailFlag = chart.querySelector("[data-sfr-detail-flag]");

  if (
    !gridGroup ||
    !eventGroup ||
    !linePath ||
    !areaPath ||
    !bandPath ||
    !axisYears ||
    !focusDot ||
    !focusLine ||
    !svg ||
    !detailYear ||
    !detailValue ||
    !detailTitle ||
    !detailSummary ||
    !detailSource ||
    !detailFlag
  ) {
    return;
  }

  const points = series.map((row) => ({
    ...row,
    x: scaleX(row.year),
    y: scaleY(row.sharePct),
    yLow: scaleY(row.low),
    yHigh: scaleY(row.high),
  }));

  linePath.setAttribute("d", toLinePath(points));
  areaPath.setAttribute("d", toAreaPath(points));
  bandPath.setAttribute("d", toBandPath(points));

  gridGroup.innerHTML = "";
  for (let tick = 0; tick <= 6; tick += 1) {
    const y = scaleY(tick);
    const horizontal = document.createElementNS("http://www.w3.org/2000/svg", "line");
    horizontal.setAttribute("x1", `${MARGIN.left}`);
    horizontal.setAttribute("x2", `${CHART_WIDTH - MARGIN.right}`);
    horizontal.setAttribute("y1", `${y}`);
    horizontal.setAttribute("y2", `${y}`);
    horizontal.setAttribute("class", "sfr-grid-line");
    gridGroup.append(horizontal);
  }

  for (let year = TIMELINE_START; year <= TIMELINE_END; year += 2) {
    const x = scaleX(year);
    const vertical = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vertical.setAttribute("x1", `${x}`);
    vertical.setAttribute("x2", `${x}`);
    vertical.setAttribute("y1", `${MARGIN.top}`);
    vertical.setAttribute("y2", `${CHART_HEIGHT - MARGIN.bottom}`);
    vertical.setAttribute("class", "sfr-grid-line is-vertical");
    gridGroup.append(vertical);
  }

  eventGroup.innerHTML = "";
  eventData.forEach((eventItem) => {
    const x = scaleX(eventItem.year);
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
    marker.setAttribute("x1", `${x}`);
    marker.setAttribute("x2", `${x}`);
    marker.setAttribute("y1", `${MARGIN.top}`);
    marker.setAttribute("y2", `${CHART_HEIGHT - MARGIN.bottom}`);
    marker.setAttribute("class", "sfr-event-line");
    eventGroup.append(marker);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", `${x + 4}`);
    label.setAttribute("y", `${MARGIN.top + 14}`);
    label.setAttribute("class", "sfr-event-text");
    label.textContent = `${eventItem.year} ${eventItem.title}`;
    eventGroup.append(label);
  });

  let activeIndex = points.findIndex((row) => row.year === 2022);
  if (activeIndex < 0) {
    activeIndex = points.length - 1;
  }

  const yearButtons = [];

  const updateDetail = (index, focusButton = false) => {
    activeIndex = Math.max(0, Math.min(points.length - 1, index));
    const active = points[activeIndex];

    focusDot.setAttribute("cx", `${active.x}`);
    focusDot.setAttribute("cy", `${active.y}`);
    focusLine.setAttribute("x1", `${active.x}`);
    focusLine.setAttribute("x2", `${active.x}`);

    detailYear.textContent = `${active.year}`;
    detailValue.textContent = `${active.sharePct.toFixed(1)}% institutional SFR share`;
    detailTitle.textContent = active.label;
    detailSummary.textContent = active.note;
    detailSource.textContent = `Source: ${active.sourceShort}`;
    detailFlag.textContent = active.observed ? "Observed" : "Estimated";
    detailFlag.classList.toggle("is-estimated", !active.observed);

    yearButtons.forEach((button, idx) => {
      const isActive = idx === activeIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (focusButton) {
      yearButtons[activeIndex].focus();
    }
  };

  axisYears.innerHTML = "";
  points.forEach((point, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sfr-year-button";
    button.textContent = `${point.year}`;
    button.setAttribute("aria-label", `Show SFR share for ${point.year}`);
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => updateDetail(index));
    button.addEventListener("focus", () => updateDetail(index));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        updateDetail(index + 1, true);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        updateDetail(index - 1, true);
      }
    });
    axisYears.append(button);
    yearButtons.push(button);
  });

  const svgPointToYearIndex = (clientX) => {
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = rect.width ? x / rect.width : 0;
    const clamped = Math.max(0, Math.min(1, ratio));
    const year = TIMELINE_START + clamped * (TIMELINE_END - TIMELINE_START);
    return Math.round(year - TIMELINE_START);
  };

  svg.addEventListener("mousemove", (event) => {
    updateDetail(svgPointToYearIndex(event.clientX));
  });
  svg.addEventListener("touchmove", (event) => {
    if (event.touches[0]) {
      updateDetail(svgPointToYearIndex(event.touches[0].clientX));
    }
  });

  updateDetail(activeIndex);
}

function setActiveChapter(chapter) {
  chapters.forEach((item) => item.classList.toggle("active", item === chapter));
  visualTitle.textContent = chapter.dataset.visualTitle;
  visualDescription.textContent = chapter.dataset.visualDescription;
  visualCaption.textContent = chapter.dataset.visualCaption;
  if (visualStage) {
    visualStage.classList.toggle("show-sfr-mini", chapter.dataset.visualType === "sfr-timeline");
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visibleEntry) {
      setActiveChapter(visibleEntry.target);
    }
  },
  {
    root: null,
    threshold: [0.35, 0.55, 0.75],
    rootMargin: "-20% 0px -30% 0px",
  }
);

chapters.forEach((chapter) => observer.observe(chapter));

const annualSeries = buildAnnualSeries();
renderTimeline(annualSeries, eventMarkers);
renderMiniChart(annualSeries);
