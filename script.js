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
    values: [22.5, 23.9, 25.6, 28.1],
  },
  {
    id: "all_rental",
    label: "All rental properties in 20 largest MSAs (2021)",
    values: [13.7, 24.2, 29.8, 32.3],
  },
  {
    id: "institutional",
    label: "All institutional SFR properties",
    values: [11.5, 14.5, 28.2, 45.8],
  },
  {
    id: "mega",
    label: "SFR properties owned by mega investors",
    values: [7.4, 13.5, 30.3, 48.8],
  },
  {
    id: "smaller",
    label: "SFR properties owned by smaller investors",
    values: [9.0, 30.7, 22.3, 38.0],
  },
  {
    id: "local",
    label: "SFR properties owned by local investors",
    values: [20.4, 42.2, 14.3, 23.1],
  },
];

function renderMiniChart() {
  const miniSvg = document.querySelector("[data-sfr-mini-svg]");
  const miniYears = document.querySelector("[data-sfr-mini-years]");
  if (!miniSvg || !miniYears) {
    return;
  }

  const reference = vintageRows.find((row) => row.id === "institutional") ?? vintageRows[0];
  const points = reference.values.map((value, idx, list) => ({
    x: (idx / (list.length - 1)) * 280,
    y: 76 - (value / 50) * 66,
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
    <span>older stock</span>
    <span>newer stock</span>
  `;
}

function renderVintageExplorer() {
  const explorer = document.querySelector("[data-vintage-explorer]");
  if (!explorer) {
    return;
  }

  const cohortButtonsContainer = explorer.querySelector("[data-vintage-cohorts]");
  const chartContainer = explorer.querySelector("[data-vintage-chart]");
  const modeButtons = Array.from(explorer.querySelectorAll("[data-vintage-mode]"));
  const detailGroup = explorer.querySelector("[data-vintage-detail-group]");
  const detailFocus = explorer.querySelector("[data-vintage-detail-focus]");
  const detailHeadline = explorer.querySelector("[data-vintage-detail-headline]");
  const detailText = explorer.querySelector("[data-vintage-detail-text]");

  if (!cohortButtonsContainer || !chartContainer || !detailGroup || !detailFocus || !detailHeadline || !detailText) {
    return;
  }

  let selectedCohortIndex = 3;
  let activeRowId = "institutional";
  let mode = "default";

  function getActiveRow() {
    return vintageRows.find((row) => row.id === activeRowId) ?? vintageRows[0];
  }

  function updateDetail() {
    const row = getActiveRow();
    const cohort = vintageCohorts[selectedCohortIndex];
    const focusValue = row.values[selectedCohortIndex];
    const newerBias = row.values[3] - row.values[0];

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
      head.innerHTML = `
        <h3>${row.label}</h3>
        <p>${row.values[selectedCohortIndex].toFixed(1)}% in ${vintageCohorts[selectedCohortIndex].short}</p>
      `;

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

renderVintageExplorer();
renderMiniChart();
