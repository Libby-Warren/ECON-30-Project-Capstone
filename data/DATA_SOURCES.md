# Data sources — institutional SFR share

This folder holds **published-statistics** series for the capstone site and analysis.  
**Primary file:** `sfr_institutional_share_extended.csv` (multiple series, 2001–2024).  
**Legacy file:** `sfr_institutional_share.csv` (sparse national timeline used by early `script.js` anchors).

---

## Series in `sfr_institutional_share_extended.csv`

### 1. `large_institutional_sfr_stock` (main capstone line)

**Question it answers:** What share of **US single-family rental housing stock** is owned by **large, post-crisis institutional** operators?

| Field | Detail |
|--------|--------|
| **Definition** | National **stock** share (homes held as rentals), not annual purchase share. After 2022 aligned with Urban **≥100 homes**; earlier years use **GAO-reviewed** large-investor counts (including **1,000+** framing through ~2015). |
| **Denominator** | All **one-unit rental** homes nationally (~**15.1 million** in Urban 2023). |
| **Observed anchors** | **2011: 0%** (GAO); **2015: ~1–2%** → **1.5%** midpoint; **2022: 3.8%** (Urban: 574,000 / 15.1M). |
| **Estimated years** | **2005–2010:** 0% (sector not at scale). **2012–2014, 2016–2021, 2023–2024:** linear interpolation/extrapolation between anchors (see notes column). |

**Do not confuse with:** purchase-flow shares (Mills **1–2%** of all SF **buys** in 2012–2014) — separate series `buy_to_rent_purchase_share`.

### 2. `mega_1000plus_sfr_stock`

**2022 only:** ~**3.0%** national (GAO: ~450,000 homes, investors with **1,000+** units). Stricter than Urban **≥100** (3.8%).

### 3. `rhfs_nonindividual_sfr_property`

**Question it answers:** What share of **SFR rental properties** are owned by **non-individual** entities (Census owner type)?

| Year | Share | Source |
|------|-------|--------|
| 2001 | 17.3% | Residential Finance Survey (RFS) |
| 2015 | 24.5% | Rental Housing Finance Survey (RHFS) |

**Caveat (JCHS):** Many “mom-and-pop” landlords hold title in **LLCs**, so this **overstates** true institutionalization and is **not comparable** to `large_institutional_sfr_stock`. **2012 RHFS** did not report single-family units in the same way (JCHS footnote).

### 4. `buy_to_rent_purchase_share`

**2012–2014:** ~**1.5%** of all US **single-family home purchases** (Mills et al. midpoint of 1–2%). Measures **flow**, not **stock**.

---

## Other project data

| File | Source | Use |
|------|--------|-----|
| `urban_vintage_figure5.csv` | Urban Institute 2023, Figure 5 (20 largest MSAs, 2021) | Build-era mix: institutional vs mega vs local |
| `sfr_institutional_share.csv` | Subset of `large_institutional_sfr_stock` | Backward-compatible 5-row timeline |

---

## Published PDFs (repo: `Academic Papers/`)

- **GAO-24-106643** / **GAO-2026** — national and metro institutional shares  
- **Urban Institute (2023)** — 3.8% national, Table 1, metro counts  
- **Mills, Molloy & Zarutskie (FEDS 2015-084)** — buy-to-rent emergence  
- **JCHS RHFS blog** — 2001 / 2015 non-individual SFR property shares  

---

## Interpolation method (transparent)

For `large_institutional_sfr_stock` **estimated** rows:

1. **2011 → 2015:** linear from **0%** to **1.5%**  
2. **2015 → 2022:** linear from **1.5%** to **3.8%**  
3. **2022 → 2024:** linear from **3.8%** to **4.2%** (2024 national stock share not directly published; metro trends in GAO-2026 support continued growth)

Formula between knots \((y_0, s_0)\) and \((y_1, s_1)\):  
\(s_y = s_0 + (s_1 - s_0) \times \frac{y - y_0}{y_1 - y_0}\)

---

## Stanford / CoreLogic (optional extension)

Papers (Mills, Urban, Gu et al.) use **CoreLogic** deed/tax data. Stanford GSB library may provide access for **annual reconstruction**; not required if using this published-statistics file.

---

## Citation snippets for write-up

- National **3.8%** (2022): Urban Institute, *A Profile of Institutional Investor–Owned Single-Family Rental Properties* (2023).  
- **0%** late 2011, **~1–2%** by 2015: GAO-24-106643.  
- **17.3% → 24.5%** (2001 → 2015) SFR **properties**: JCHS, “Who Owns Rental Properties, and is it Changing?” (RHFS).  
- Buy-to-rent **1–2% of purchases** (2012–2014): Mills, Molloy & Zarutskie, *Real Estate Economics* / FEDS 2015-084.
