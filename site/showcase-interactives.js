/**
 * Chapter 3 — National dot timeline (data/sfr_institutional_share_extended.csv)
 */
(function () {
  const CSV_URL = "data/sfr_institutional_share_extended.csv";
  const METRO_URL = "data/metro_institutional_sfr_share.csv";
  const SHARE_CAP = 4.5;
  const METRO_SHARE_CAP = 25;
  const METRO_ORDER = ["Jacksonville", "Atlanta", "Charlotte", "Phoenix"];
  const ERAS = [
    { start: 2005, end: 2011, label: "Pre-scale" },
    { start: 2012, end: 2015, label: "Buy-to-rent wave" },
    { start: 2016, end: 2022, label: "Portfolio build-out" },
    { start: 2023, end: 2024, label: "Continued growth" },
  ];
  const MILESTONE_YEARS = [2011, 2015, 2022, 2024];

  let stockSeries = [];

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const parts = [];
      let cur = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQ = !inQ;
          continue;
        }
        if (ch === "," && !inQ) {
          parts.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      parts.push(cur);
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (parts[i] || "").trim();
      });
      return row;
    });
  }

  function bySeries(rows, name) {
    return rows
      .filter((r) => r.series === name)
      .map((r) => ({
        year: Number(r.year),
        share: Number(r.share_pct),
        estimated: String(r.estimated).toLowerCase() === "true",
        source: r.source,
        notes: r.notes,
      }))
      .sort((a, b) => a.year - b.year);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function shareAtYear(series, year) {
    if (!series.length) return 0;
    if (year <= series[0].year) return series[0].share;
    if (year >= series[series.length - 1].year) return series[series.length - 1].share;
    for (let i = 0; i < series.length - 1; i++) {
      const a = series[i];
      const b = series[i + 1];
      if (year >= a.year && year <= b.year) {
        const t = (year - a.year) / (b.year - a.year);
        return lerp(a.share, b.share, t);
      }
    }
    return series[series.length - 1].share;
  }

  function parseMetroRows(rows) {
    const metros = {};
    rows
      .filter((r) => r.metro && r.metro !== "National")
      .forEach((r) => {
        if (!metros[r.metro]) metros[r.metro] = [];
        metros[r.metro].push({
          year: Number(r.year),
          share: Number(r.institutional_share_sfr_pct),
          state: r.state,
          source: r.source,
          notes: r.notes,
        });
      });
    Object.keys(metros).forEach((m) => metros[m].sort((a, b) => a.year - b.year));
    return metros;
  }

  function metroShareAtYear(points, year) {
    if (!points || !points.length) return { share: null, source: "", notes: "", interpolated: false, beforeAnchor: false };

    if (points.length === 1) {
      const p = points[0];
      if (year < p.year) {
        return { share: null, source: p.source, notes: p.notes, interpolated: false, beforeAnchor: true, anchorYear: p.year };
      }
      return { share: p.share, source: p.source, notes: p.notes, interpolated: false, beforeAnchor: false, anchorYear: p.year };
    }

    if (year <= points[0].year) {
      return {
        share: points[0].share,
        source: points[0].source,
        notes: points[0].notes,
        interpolated: year < points[0].year,
        beforeAnchor: year < points[0].year,
        anchorYear: points[0].year,
      };
    }
    if (year >= points[points.length - 1].year) {
      const p = points[points.length - 1];
      return { share: p.share, source: p.source, notes: p.notes, interpolated: false, beforeAnchor: false, anchorYear: p.year };
    }

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      if (year >= a.year && year <= b.year) {
        const t = (year - a.year) / (b.year - a.year);
        return {
          share: lerp(a.share, b.share, t),
          source: `${a.source}; ${b.source}`,
          notes: a.notes || b.notes,
          interpolated: true,
          beforeAnchor: false,
          anchorYear: year,
        };
      }
    }

    const p = points[points.length - 1];
    return { share: p.share, source: p.source, notes: p.notes, interpolated: false, beforeAnchor: false };
  }

  function pointAtYear(series, year) {
    const share = shareAtYear(series, year);
    let best = series[0];
    let d = Math.abs(year - best.year);
    series.forEach((p) => {
      const dd = Math.abs(year - p.year);
      if (dd < d) {
        d = dd;
        best = p;
      }
    });
    return { share, estimated: best.estimated, source: best.source, notes: best.notes, anchorYear: best.year };
  }

  function initNationalDot(series, metroMap) {
    const root = document.querySelector("[data-lab='national-dot']");
    if (!root) return;

    const canvas = root.querySelector("[data-dot-canvas]");
    const metroListEl = root.querySelector("[data-dot-metro-list]");
    const metroNameEl = root.querySelector("[data-dot-metro-name]");
    const metroOdometer = root.querySelector("[data-dot-metro-odometer]");
    const metroBarFill = root.querySelector("[data-dot-metro-bar-fill]");
    const metroCaption = root.querySelector("[data-dot-metro-caption]");
    const compareNat = root.querySelector("[data-dot-compare-nat]");
    const compareMetro = root.querySelector("[data-dot-compare-metro]");
    const compareRatio = root.querySelector("[data-dot-compare-ratio]");
    const odometer = root.querySelector("[data-dot-odometer]");
    const yearLabel = root.querySelector("[data-dot-year]");
    const playheadYear = root.querySelector("[data-dot-playhead-year]");
    const flag = root.querySelector("[data-dot-flag]");
    const caption = root.querySelector("[data-dot-caption]");
    const detailPct = root.querySelector("[data-dot-detail-pct]");
    const slider = root.querySelector("[data-dot-slider]");
    const estToggle = root.querySelector("[data-dot-est-toggle]");
    const barFill = root.querySelector("[data-dot-bar-fill]");
    const timelineFill = root.querySelector("[data-dot-timeline-fill]");
    const playhead = root.querySelector("[data-dot-timeline-playhead]");
    const ticksEl = root.querySelector("[data-dot-timeline-ticks]");
    const milestonesEl = root.querySelector("[data-dot-milestones]");

    if (!series.length || !slider || !canvas) {
      console.error("National dot: missing data or DOM nodes");
      return;
    }

    const minY = series[0].year;
    const maxY = series[series.length - 1].year;
    slider.min = String(minY);
    slider.max = String(maxY);
    slider.step = "1";
    slider.value = "2022";

    const ctx = canvas.getContext("2d");
    const COLS = 64;
    const ROWS = 36;
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        cells.push({
          c,
          r,
          order: idx / (COLS * ROWS) + (Math.sin(c * 0.4 + r * 0.3) + 1) * 0.02,
        });
      }
    }
    cells.sort((a, b) => a.order - b.order);

    let showEst = true;
    let targetYear = 2022;
    let animShare = shareAtYear(series, 2022);
    let selectedMetro = METRO_ORDER.find((m) => metroMap[m]) || Object.keys(metroMap)[0] || "";
    let animMetroShare = 0;

    function yearProgress(y) {
      return (y - minY) / (maxY - minY);
    }

    function buildTicks() {
      ticksEl.innerHTML = series
        .filter((p) => (p.year - minY) % 2 === 0 || !p.estimated)
        .map((p) => {
          const pct = yearProgress(p.year) * 100;
          return `<button type="button" class="dot-tick ${p.estimated ? "is-est" : "is-obs"}" style="left:${pct}%" data-year="${p.year}" title="${p.year}: ${p.share}%">
            <span class="dot-tick-year">${p.year}</span>
            <span class="dot-tick-val">${p.share}%</span>
          </button>`;
        })
        .join("");
      ticksEl.querySelectorAll(".dot-tick").forEach((btn) => {
        btn.addEventListener("click", () => setYear(Number(btn.dataset.year)));
      });
    }

    function buildMilestones() {
      milestonesEl.innerHTML = MILESTONE_YEARS.filter((y) => y >= minY && y <= maxY)
        .map((y) => {
          const p = series.find((s) => s.year === y);
          if (!p) return "";
          const pct = yearProgress(y) * 100;
          return `<button type="button" class="dot-milestone ${p.estimated ? "is-est" : "is-obs"}" style="left:${pct}%" data-year="${y}">
            <span class="dot-milestone-dot"></span>
            <span class="dot-milestone-label">${y}</span>
            <span class="dot-milestone-share">${p.share}%</span>
          </button>`;
        })
        .join("");
      milestonesEl.querySelectorAll(".dot-milestone").forEach((btn) => {
        btn.addEventListener("click", () => setYear(Number(btn.dataset.year)));
      });
    }

    function buildMetroList() {
      if (!metroListEl) return;
      const metros = METRO_ORDER.filter((m) => metroMap[m]);
      metroListEl.innerHTML = metros
        .map((metro) => {
          const pts = metroMap[metro];
          const latest = pts[pts.length - 1];
          const state = latest.state || "";
          return `<button type="button" class="dot-metro-btn" role="option" data-metro="${metro}" aria-selected="false">
            <span class="dot-metro-btn-name">${metro}${state ? `, ${state}` : ""}</span>
            <span class="dot-metro-btn-badge">${latest.share}% <em>${latest.year}</em></span>
          </button>`;
        })
        .join("");

      metroListEl.querySelectorAll(".dot-metro-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedMetro = btn.dataset.metro;
          metroListEl.querySelectorAll(".dot-metro-btn").forEach((b) => {
            const on = b.dataset.metro === selectedMetro;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-selected", on ? "true" : "false");
          });
          updateMetroPanel(Math.round(targetYear), shareAtYear(series, Math.round(targetYear)));
        });
      });

      const first = metroListEl.querySelector(`[data-metro="${selectedMetro}"]`);
      if (first) {
        first.classList.add("is-active");
        first.setAttribute("aria-selected", "true");
      }
    }

    function updateMetroPanel(y, nationalShare) {
      if (!selectedMetro || !metroMap[selectedMetro]) return;

      const pts = metroMap[selectedMetro];
      const latest = pts[pts.length - 1];
      const meta = metroShareAtYear(pts, y);
      const targetMetro = meta.share;

      if (targetMetro != null) {
        animMetroShare = lerp(animMetroShare, targetMetro, 0.14);
        if (Math.abs(animMetroShare - targetMetro) < 0.02) animMetroShare = targetMetro;
      }

      metroNameEl.textContent = `${selectedMetro}, ${latest.state || ""}`.replace(/, $/, "");
      compareNat.textContent = nationalShare.toFixed(2) + "%";

      if (targetMetro == null || meta.beforeAnchor) {
        metroOdometer.textContent = "—";
        compareMetro.textContent = "—";
        metroBarFill.style.width = "0%";
        compareRatio.textContent = `No ${selectedMetro} anchor before ${meta.anchorYear || latest.year}. Drag timeline to ${meta.anchorYear || latest.year}+.`;
        metroCaption.textContent = pts.length === 1
          ? `Single observed anchor: ${latest.share}% in ${latest.year} (GAO / Urban).`
          : `First anchor: ${pts[0].share}% (${pts[0].year}).`;
        return;
      }

      const mShare = animMetroShare;
      metroOdometer.textContent = mShare.toFixed(1);
      compareMetro.textContent = mShare.toFixed(1) + "%";
      metroBarFill.style.width = Math.min(100, (mShare / METRO_SHARE_CAP) * 100) + "%";

      const ratio = nationalShare > 0 ? (mShare / nationalShare).toFixed(1) : "—";
      compareRatio.textContent =
        ratio !== "—"
          ? `About ${ratio}× the national stock share in ${y}—local concentration is the story.`
          : "";

      const interpNote = meta.interpolated ? " Interpolated between metro anchors." : "";
      const note = meta.notes ? `${meta.notes} ` : "";
      metroCaption.textContent = `${note}${interpNote}Source: ${meta.source}.`.trim();
    }

    function syncUI() {
      const y = Math.round(targetYear);
      const share = shareAtYear(series, y);
      const progress = yearProgress(y);
      const pct = (progress * 100).toFixed(2) + "%";

      if (timelineFill) timelineFill.style.width = pct;
      if (playhead) playhead.style.left = pct;
      if (barFill) barFill.style.width = Math.min(100, (share / SHARE_CAP) * 100) + "%";

      ticksEl?.querySelectorAll(".dot-tick").forEach((t) => {
        t.classList.toggle("is-current", Number(t.dataset.year) === y);
      });
      milestonesEl?.querySelectorAll(".dot-milestone").forEach((m) => {
        m.classList.toggle("is-current", Number(m.dataset.year) === y);
      });
    }

    function setYear(year) {
      targetYear = Math.round(Math.min(maxY, Math.max(minY, year)));
      slider.value = String(targetYear);
      syncUI();
    }

    function updateLabels(y, share, meta) {
      const yearInt = Math.round(y);
      odometer.textContent = share.toFixed(2);
      yearLabel.textContent = String(yearInt);
      playheadYear.textContent = String(yearInt);
      detailPct.textContent = share.toFixed(2);
      flag.textContent = meta.estimated ? "Estimated" : "Observed anchor";
      flag.className = "showcase-flag " + (meta.estimated ? "is-est" : "is-obs");
      const note = meta.notes ? `${meta.notes} ` : "";
      caption.textContent = `${note}Source: ${meta.source}.`;
      root.classList.toggle("dot--estimated-year", meta.estimated && showEst);
      updateMetroPanel(yearInt, share);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const yearInt = Math.round(targetYear);
      const share = animShare;
      // Grid shows literal percent of stock: 4% => ~4% gold squares.
      const goldFrac = Math.min(1, Math.max(0, share / 100));
      const meta = pointAtYear(series, yearInt);
      const estFade = !showEst && meta.estimated ? 0.45 : 1;
      const pulse = 0.92 + 0.08 * Math.sin(Date.now() / 700);
      const cellW = w / COLS;
      const cellH = h / ROWS;
      const gap = 1.2;

      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, w, h);

      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
      vignette.addColorStop(0, "rgba(212, 175, 55, 0.05)");
      vignette.addColorStop(1, "transparent");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      const goldCount = Math.floor(cells.length * goldFrac);

      cells.forEach((cell, i) => {
        const isGold = i < goldCount;
        const x = cell.c * cellW + gap * 0.5;
        const y = cell.r * cellH + gap * 0.5;
        const rw = cellW - gap;
        const rh = cellH - gap;

        if (isGold) {
          const shimmer = 0.55 + 0.35 * pulse * estFade;
          ctx.fillStyle = `rgba(212, 175, 55, ${shimmer})`;
          ctx.shadowColor = "rgba(212, 175, 55, 0.35)";
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(244, 241, 234, 0.055)";
        }
        ctx.fillRect(x, y, rw, rh);
      });
      ctx.shadowBlur = 0;

      updateLabels(yearInt, share, meta);
    }

    function loop() {
      const yearInt = Math.round(targetYear);
      const targetShare = shareAtYear(series, yearInt);
      animShare = lerp(animShare, targetShare, 0.12);
      if (Math.abs(animShare - targetShare) < 0.002) animShare = targetShare;

      syncUI();
      draw();
      requestAnimationFrame(loop);
    }

    function onSliderInput() {
      targetYear = Math.round(Number(slider.value));
      slider.value = String(targetYear);
      syncUI();
    }

    slider.addEventListener("input", onSliderInput);
    slider.addEventListener("change", onSliderInput);

    const scrubber = root.querySelector("[data-dot-timeline-scrubber]");
    scrubber?.addEventListener("click", (e) => {
      if (e.target === slider) return;
      const rail = scrubber.querySelector(".dot-timeline-rail");
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setYear(Math.round(minY + t * (maxY - minY)));
    });

    estToggle?.addEventListener("change", () => {
      showEst = estToggle.checked;
      buildTicks();
      syncUI();
    });

    buildMetroList();
    buildTicks();
    buildMilestones();
    resize();
    window.addEventListener("resize", resize);
    setYear(2022);
    loop();
  }

  function initLabNav() {
    const links = document.querySelectorAll(".showcase-lab-link");
    const labs = document.querySelectorAll(".showcase-lab");
    if (!labs.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!vis) return;
        const id = vis.target.id;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${id}`));
      },
      { threshold: 0.25, rootMargin: "-20% 0px -40% 0px" }
    );
    labs.forEach((l) => obs.observe(l));
  }

  async function loadData() {
    const [main, metroText] = await Promise.all([
      fetch(CSV_URL).then((r) => r.text()),
      fetch(METRO_URL).then((r) => r.text()),
    ]);
    const rows = parseCsv(main);
    stockSeries = bySeries(rows, "large_institutional_sfr_stock");
    const metroMap = parseMetroRows(parseCsv(metroText));
    initNationalDot(stockSeries, metroMap);
  }

  loadData().catch((err) => {
    console.error("Showcase data load failed", err);
    document.querySelectorAll("[data-showcase-error]").forEach((el) => {
      el.hidden = false;
      el.textContent = "Could not load CSV data. Run from a local server (e.g. python3 -m http.server 8080).";
    });
  });
  initLabNav();
})();
