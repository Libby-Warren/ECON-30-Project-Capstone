const chapters = document.querySelectorAll(".chapter");
const visualTitle = document.querySelector("#visual-title");
const visualDescription = document.querySelector("#visual-description");
const visualCaption = document.querySelector("#visual-caption");

function setActiveChapter(chapter) {
  chapters.forEach((item) => item.classList.toggle("active", item === chapter));

  visualTitle.textContent = chapter.dataset.visualTitle;
  visualDescription.textContent = chapter.dataset.visualDescription;
  visualCaption.textContent = chapter.dataset.visualCaption;
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
