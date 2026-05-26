const chapters = document.querySelectorAll(".chapter");
const visualTitle = document.querySelector("#visual-title");
const visualDescription = document.querySelector("#visual-description");
const visualCaption = document.querySelector("#visual-caption");
const visualStage = document.querySelector(".visual-stage");

const vintageCohorts = [
  { id: "older_1950", label: "1950s and earlier", short: "1950s and earlier" },
  { id: "sixty_seventy", label: "1960s and 1970s", short: "1960s and 1970s" },
  { id: "eighty_ninety", label: "1980s and 1990s", short: "1980s and 1990s" },
  { id: "since_2000", label: "Since 2000", short: "Since 2000" },
];

const vintageRows = [
  {
    id: "all_sfr",
    label: "All single-family rental properties in 20 largest MSAs (2021)",
    focusSubject: "all single-family rental properties in the 20 largest MSAs",
    values: [22.5, 23.9, 25.6, 28.1],
  },
  {
    id: "all_rental",
    label: "All rental properties in 20 largest MSAs (2021)",
    focusSubject: "all rental properties in the 20 largest MSAs",
    values: [13.7, 24.2, 29.8, 32.3],
  },
  {
    id: "institutional",
    label: "All institutional SFR properties",
    focusSubject: "all institutionally-owned SFR properties",
    values: [11.5, 14.5, 28.2, 45.8],
  },
  {
    id: "mega",
    label: "SFR properties owned by mega investors",
    focusSubject: "SFR properties owned by mega investors",
    values: [7.4, 13.5, 30.3, 48.8],
  },
  {
    id: "smaller",
    label: "SFR properties owned by smaller investors",
    focusSubject: "SFR properties owned by smaller institutional investors",
    values: [9.0, 30.7, 22.3, 38.0],
  },
  {
    id: "local",
    label: "SFR properties owned by local investors",
    focusSubject: "SFR properties owned by local investors",
    values: [20.4, 42.2, 14.3, 23.1],
  },
];

function vintageCohortBuiltPhrase(cohort) {
  return cohort.id === "since_2000" ? "were built since 2000" : `were built in ${cohort.short}`;
}

const sfrShareSeries = [
  {
    year: 2011,
    share: 0,
    estimated: true,
    headline: "Pre-scale baseline",
    text: "GAO cites studies finding no investor owned 1,000+ single-family rental homes as of late 2011.",
  },
  {
    year: 2015,
    share: 1.5,
    estimated: true,
    headline: "Post-crisis accumulation",
    text: "Institutional investors collectively held an estimated 170,000–300,000 homes—roughly 1–2% of single-family rental stock.",
  },
  {
    year: 2018,
    share: 2.2,
    estimated: true,
    headline: "Interpolated growth",
    text: "Midpoint estimate between GAO-era anchors; labeled estimated for transparency.",
  },
  {
    year: 2022,
    share: 3.8,
    estimated: false,
    headline: "Urban Institute anchor",
    text: "About 574,000 of 15.1 million U.S. single-family rental homes—about 3.8%—using institutional definitions in that estimate.",
  },
  {
    year: 2024,
    share: 4.2,
    estimated: true,
    headline: "Recent trajectory (estimated)",
    text: "Illustrative continuation informed by industry reports; not a census count.",
  },
];

let activeShareYear = 2022;

function renderSfrShareTimeline() {
  const root = document.querySelector("[data-sfr-timeline]");
  if (!root) {
    return;
  }

  const svg = root.querySelector("[data-sfr-svg]");
  const yearButtons = root.querySelector("[data-sfr-years]");
  const detailYear = root.querySelector("[data-sfr-detail-year]");
  const detailValue = root.querySelector("[data-sfr-detail-value]");
  const detailFlag = root.querySelector("[data-sfr-detail-flag]");
  const detailHeadline = root.querySelector("[data-sfr-detail-headline]");
  const detailText = root.querySelector("[data-sfr-detail-text]");

  if (!svg || !yearButtons || !detailYear || !detailValue || !detailFlag || !detailHeadline || !detailText) {
    return;
  }

  const width = 520;
  const height = 260;
  const pad = { top: 24, right: 20, bottom: 36, left: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxShare = 5.5;
  const years = sfrShareSeries.map((d) => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  const x = (year) => pad.left + ((year - minYear) / (maxYear - minYear)) * plotW;
  const y = (share) => pad.top + plotH - (share / maxShare) * plotH;

  const points = sfrShareSeries.map((d) => ({ ...d, px: x(d.year), py: y(d.share) }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].px.toFixed(1)} ${(pad.top + plotH).toFixed(1)} L ${points[0].px.toFixed(1)} ${(pad.top + plotH).toFixed(1)} Z`;

  const gridY = [0, 1, 2, 3, 4, 5].map((v) => {
    const gy = y(v);
    return `<line class="sfr-grid-line" x1="${pad.left}" y1="${gy}" x2="${width - pad.right}" y2="${gy}" />`;
  });

  const gridX = years.map((year) => {
    const gx = x(year);
    return `<line class="sfr-grid-line is-vertical" x1="${gx}" y1="${pad.top}" x2="${gx}" y2="${pad.top + plotH}" />`;
  });

  const eventLines = `
    <line class="sfr-event-line" x1="${x(2011)}" y1="${pad.top}" x2="${x(2011)}" y2="${pad.top + plotH}" />
    <text class="sfr-event-text" x="${x(2011) + 4}" y="${pad.top + 12}">Crisis era</text>
    <line class="sfr-event-line" x1="${x(2022)}" y1="${pad.top}" x2="${x(2022)}" y2="${pad.top + plotH}" />
    <text class="sfr-event-text" x="${x(2022) + 4}" y="${pad.top + 12}">Urban est.</text>
  `;

  const dots = points
    .map(
      (p) =>
        `<circle class="sfr-focus-dot" data-year="${p.year}" cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="5" />`
    )
    .join("");

  const focus = points.find((p) => p.year === activeShareYear) ?? points[points.length - 1];

  svg.innerHTML = `
    ${gridY.join("")}
    ${gridX.join("")}
    <path class="sfr-band" d="${areaPath}" />
    <path class="sfr-area" d="${areaPath}" />
    <path class="sfr-line" d="${linePath}" />
    ${eventLines}
    <line class="sfr-focus-line" x1="${focus.px}" y1="${pad.top}" x2="${focus.px}" y2="${pad.top + plotH}" />
    ${dots}
    <text fill="rgba(212,175,55,0.55)" font-size="10" x="${pad.left - 8}" y="${y(0) + 4}" text-anchor="end">0%</text>
    <text fill="rgba(212,175,55,0.55)" font-size="10" x="${pad.left - 8}" y="${y(3.8) + 4}" text-anchor="end">~4%</text>
  `;

  yearButtons.innerHTML = "";
  sfrShareSeries.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sfr-year-button ${d.year === activeShareYear ? "is-active" : ""}`;
    btn.textContent = String(d.year);
    btn.addEventListener("click", () => {
      activeShareYear = d.year;
      renderSfrShareTimeline();
    });
    yearButtons.append(btn);
  });

  const active = sfrShareSeries.find((d) => d.year === activeShareYear) ?? sfrShareSeries[0];
  detailYear.textContent = String(active.year);
  detailValue.textContent = `${active.share.toFixed(1)}% of U.S. SFR stock`;
  detailFlag.textContent = active.estimated ? "Estimated" : "Observed anchor";
  detailFlag.classList.toggle("is-estimated", active.estimated);
  detailHeadline.textContent = active.headline;
  detailText.textContent = active.text;
}

function renderVintageExplorer() {
  const explorer = document.querySelector("[data-vintage-explorer]");
  if (!explorer) {
    return;
  }

  const cohortButtonsContainer = explorer.querySelector("[data-vintage-cohorts]");
  const chartContainer = explorer.querySelector("[data-vintage-chart]");
  const chartFocus = explorer.querySelector("[data-vintage-chart-focus]");
  const modeButtons = Array.from(explorer.querySelectorAll("[data-vintage-mode]"));
  const detailGroup = explorer.querySelector("[data-vintage-detail-group]");
  const detailFocus = explorer.querySelector("[data-vintage-detail-focus]");
  const detailHeadline = explorer.querySelector("[data-vintage-detail-headline]");
  const detailText = explorer.querySelector("[data-vintage-detail-text]");

  if (
    !cohortButtonsContainer ||
    !chartContainer ||
    !chartFocus ||
    !detailGroup ||
    !detailFocus ||
    !detailHeadline ||
    !detailText
  ) {
    return;
  }

  let selectedCohortIndex = 3;
  let activeRowId = "institutional";
  let mode = "default";

  function getActiveRow() {
    return vintageRows.find((row) => row.id === activeRowId) ?? vintageRows[0];
  }

  function updateChartFocus() {
    const row = getActiveRow();
    const cohort = vintageCohorts[selectedCohortIndex];
    const focusValue = row.values[selectedCohortIndex];
    const subject = row.focusSubject ?? row.label;
    chartFocus.textContent = `${focusValue.toFixed(1)}% of ${subject} ${vintageCohortBuiltPhrase(cohort)}`;
  }

  function updateDetail() {
    const row = getActiveRow();
    const cohort = vintageCohorts[selectedCohortIndex];
    const focusValue = row.values[selectedCohortIndex];
    const newerBias = row.values[3] - row.values[0];

    updateChartFocus();
    detailGroup.textContent = row.label;
    detailFocus.textContent = `${cohort.short}: ${focusValue.toFixed(1)}%`;
    detailHeadline.textContent =
      newerBias >= 0 ? "Leans toward newer built stock" : "Leans toward older built stock";
    detailText.textContent = `Difference between Since 2000 and 1950s-and-earlier cohorts: ${
      newerBias >= 0 ? "+" : ""
    }${newerBias.toFixed(1)} percentage points.`;
  }

  function renderCohortButtons() {
    cohortButtonsContainer.innerHTML = "";
    vintageCohorts.forEach((cohort, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `vintage-cohort ${index === selectedCohortIndex ? "is-active" : ""}`;
      button.textContent = cohort.short;
      button.setAttribute("aria-pressed", index === selectedCohortIndex ? "true" : "false");
      button.addEventListener("click", () => {
        selectedCohortIndex = index;
        if (mode === "highlight") {
          renderRows();
        } else {
          renderCohortButtons();
          renderRows();
        }
      });
      cohortButtonsContainer.append(button);
    });
  }

  function renderRows() {
    const displayRows = [...vintageRows];
    if (mode === "highlight") {
      displayRows.sort((a, b) => b.values[selectedCohortIndex] - a.values[selectedCohortIndex]);
    }

    chartContainer.innerHTML = "";
    displayRows.forEach((row) => {
      const rowEl = document.createElement("article");
      rowEl.className = `vintage-row ${row.id === activeRowId ? "is-active" : ""}`;

      const head = document.createElement("div");
      head.className = "vintage-row-head";
      head.innerHTML = `<h3>${row.label}</h3>`;

      const stackButton = document.createElement("button");
      stackButton.type = "button";
      stackButton.className = "vintage-stack";
      stackButton.setAttribute(
        "aria-label",
        `${row.label}. ${vintageCohorts[selectedCohortIndex].short} share is ${row.values[
          selectedCohortIndex
        ].toFixed(1)} percent.`
      );

      row.values.forEach((value, segmentIndex) => {
        const segment = document.createElement("span");
        segment.className = `vintage-segment cohort-${segmentIndex} ${
          segmentIndex === selectedCohortIndex ? "is-highlighted" : "is-muted"
        }`;
        segment.style.width = `${value}%`;
        segment.innerHTML = `<em>${value.toFixed(1)}%</em>`;
        stackButton.append(segment);
      });

      stackButton.addEventListener("click", () => {
        activeRowId = row.id;
        renderRows();
        updateDetail();
      });
      stackButton.addEventListener("mouseenter", () => {
        activeRowId = row.id;
        renderRows();
        updateDetail();
      });

      rowEl.append(head, stackButton);
      chartContainer.append(rowEl);
    });

    renderCohortButtons();
    updateDetail();
  }

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.getAttribute("data-vintage-mode") || "default";
      modeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderRows();
    });
  });

  renderRows();
}

function setActiveChapter(chapter) {
  chapters.forEach((item) => item.classList.toggle("active", item === chapter));
  visualTitle.textContent = chapter.dataset.visualTitle;
  visualDescription.textContent = chapter.dataset.visualDescription;
  visualCaption.textContent = chapter.dataset.visualCaption;

  if (!visualStage) {
    return;
  }

  const visualType = chapter.dataset.visualType || "fragmented";
  visualStage.classList.remove(
    "show-sfr-timeline",
    "show-sfr-mini",
    "show-process",
    "show-financing",
    "show-stress"
  );

  if (visualType === "sfr-timeline") {
    visualStage.classList.add("show-sfr-timeline");
    renderSfrShareTimeline();
  } else if (visualType === "process") {
    visualStage.classList.add("show-process");
  } else if (visualType === "financing") {
    visualStage.classList.add("show-financing");
  } else if (visualType === "stress") {
    visualStage.classList.add("show-stress");
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

if (chapters.length && visualTitle) {
  chapters.forEach((chapter) => observer.observe(chapter));
}

function initNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const menuClose = document.querySelector(".menu-close");
  const overlay = document.getElementById("menu-overlay");
  const exploreLinks = document.querySelectorAll(".explore-panel a, .menu-overlay a");

  const closeMenu = () => {
    if (!overlay || !menuToggle) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  const openMenu = () => {
    if (!overlay || !menuToggle) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  menuToggle?.addEventListener("click", () => {
    if (overlay?.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuClose?.addEventListener("click", closeMenu);
  exploreLinks.forEach((link) => link.addEventListener("click", closeMenu));

  const sections = [
    "question",
    "story",
    "mission",
    "platform",
    "interactives",
    "lab-national-dot",
    "vintage",
    "progress",
    "takeaways",
    "sources",
  ];
  const navMap = {
    question: 0,
    story: 1,
    mission: 2,
    platform: 3,
    interactives: 4,
    vintage: 4,
    "lab-national-dot": 4,
    progress: 5,
    takeaways: 6,
    limits: 6,
    sources: 7,
  };

  const panelLinks = document.querySelectorAll(".explore-panel a");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.id;
      const idx = navMap[id];
      if (idx === undefined) return;
      panelLinks.forEach((link, i) => link.classList.toggle("is-active", i === idx));
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.15, 0.35] }
  );

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  if (panelLinks[0]) panelLinks[0].classList.add("is-active");

  document.querySelectorAll('.ticker a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    });
  });
}

initNavigation();
renderVintageExplorer();
renderSfrShareTimeline();
