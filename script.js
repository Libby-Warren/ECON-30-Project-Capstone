const chapters = document.querySelectorAll(".chapter");
const visualTitle = document.querySelector("#visual-title");
const visualDescription = document.querySelector("#visual-description");
const visualCaption = document.querySelector("#visual-caption");
const visualStage = document.querySelector(".visual-stage");

const sfrTimelineData = [
  {
    year: 2011,
    value: 0.2,
    valueLabel: "Pre-scale era (<1% proxy)",
    title: "Pre-scale institutional SFR",
    summary:
      "GAO-reviewed studies report no single investor owning 1,000+ SFR homes as of late 2011, before institutional scale-up.",
    source: "Source: GAO-24-106643 (late-2011 market structure).",
  },
  {
    year: 2015,
    value: 1.5,
    valueLabel: "1-2% of U.S. SFR stock",
    title: "Early portfolio scale appears",
    summary:
      "By 2015, institutional investors that entered after the financial crisis collectively held an estimated 170,000-300,000 SFR homes.",
    source: "Source: GAO-24-106643 (2015 estimate, 170k-300k homes).",
  },
  {
    year: 2022,
    value: 3.8,
    valueLabel: "3.8% benchmark",
    title: "Institutional share benchmark rises",
    summary:
      "Callan cites Urban Institute data estimating institutional ownership at roughly 574,000 of 15.1 million U.S. SFR homes in June 2022.",
    source: "Source: Callan (2024) citing Urban Institute data.",
  },
  {
    year: 2025,
    value: 5.5,
    valueLabel: "$7.5B private-fund SFR exposure",
    title: "Private-fund allocation deepens",
    summary:
      "NCREIF-tracked private-fund SFR market value is reported at $7.5B in Q2 2025, indicating continued institutional capital formation.",
    source: "Source: NCREIF figures cited by Houlihan Lokey SFR update (Aug 2025).",
  },
];

function getPointPosition(index, length) {
  if (length <= 1) {
    return 50;
  }
  return (index / (length - 1)) * 100;
}

function getPointHeight(value, maxValue) {
  const floor = 8;
  const ceiling = 88;
  return floor + (value / maxValue) * (ceiling - floor);
}

function renderTimeline(mainTimeline, detailEls) {
  if (!mainTimeline) {
    return;
  }

  const pointsContainer = mainTimeline.querySelector("[data-sfr-points]");
  if (!pointsContainer) {
    return;
  }

  const maxValue = Math.max(...sfrTimelineData.map((item) => item.value));
  const positions = sfrTimelineData.map((item, index) => {
    const x = getPointPosition(index, sfrTimelineData.length);
    const y = getPointHeight(item.value, maxValue);
    return { x, y };
  });

  const shapeCoords = positions
    .map((point) => `${point.x.toFixed(2)}% ${100 - point.y}%`)
    .join(", ");
  const axisLine = mainTimeline.querySelector(".sfr-axis-line");
  if (axisLine) {
    axisLine.style.setProperty("--line-shape", `${shapeCoords}, 100% 100%, 0 100%`);
  }

  pointsContainer.innerHTML = "";

  let activeIndex = 0;

  const updateDetail = (index) => {
    activeIndex = index;
    const activeItem = sfrTimelineData[index];

    pointsContainer.querySelectorAll(".sfr-point").forEach((point, pointIndex) => {
      point.classList.toggle("is-active", pointIndex === index);
      point.setAttribute("aria-pressed", pointIndex === index ? "true" : "false");
    });

    detailEls.year.textContent = `${activeItem.year}`;
    detailEls.value.textContent = activeItem.valueLabel;
    detailEls.title.textContent = activeItem.title;
    detailEls.summary.textContent = activeItem.summary;
    detailEls.source.textContent = activeItem.source;
  };

  sfrTimelineData.forEach((item, index) => {
    const point = document.createElement("button");
    point.type = "button";
    point.className = "sfr-point";
    point.style.setProperty("--x", positions[index].x.toFixed(2));
    point.style.setProperty("--y", positions[index].y.toFixed(2));
    point.style.setProperty("--size", (4 + (item.value / maxValue) * 8).toFixed(2));
    point.setAttribute("aria-label", `${item.year}: ${item.valueLabel}. ${item.title}`);
    point.setAttribute("aria-pressed", "false");
    point.innerHTML = `
      <span class="sfr-point-dot" aria-hidden="true"></span>
      <span class="sfr-point-label" aria-hidden="true">${item.year}</span>
    `;

    point.addEventListener("click", () => updateDetail(index));
    point.addEventListener("focus", () => updateDetail(index));
    point.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const next = Math.min(sfrTimelineData.length - 1, activeIndex + 1);
        pointsContainer.querySelectorAll(".sfr-point")[next].focus();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const prev = Math.max(0, activeIndex - 1);
        pointsContainer.querySelectorAll(".sfr-point")[prev].focus();
      }
    });

    pointsContainer.append(point);
  });

  updateDetail(0);
}

function renderMiniTimeline() {
  const miniTrack = document.querySelector("[data-sfr-mini-track]");
  if (!miniTrack) {
    return;
  }

  miniTrack.innerHTML = sfrTimelineData
    .map(
      (item) => `
      <p class="sfr-mini-point">
        ${item.year}
        <strong>${item.valueLabel}</strong>
      </p>
    `
    )
    .join("");
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

const timelineEl = document.querySelector("[data-sfr-timeline]");
const detailEls = {
  year: document.querySelector("[data-sfr-detail-year]"),
  value: document.querySelector("[data-sfr-detail-value]"),
  title: document.querySelector("[data-sfr-detail-title]"),
  summary: document.querySelector("[data-sfr-detail-summary]"),
  source: document.querySelector("[data-sfr-detail-source]"),
};

if (timelineEl && Object.values(detailEls).every(Boolean)) {
  renderTimeline(timelineEl, detailEls);
}

renderMiniTimeline();
