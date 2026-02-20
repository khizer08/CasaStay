document.addEventListener("DOMContentLoaded", () => {
  const scrollContainer = document.getElementById("featureScroll");
  const arrowRight = document.getElementById("featureArrow");
  const arrowLeft = document.getElementById("featureArrowLeft");

  if (!scrollContainer || !arrowRight || !arrowLeft) return;

  const scrollAmount =
    scrollContainer.querySelector('[class*="col-"]').offsetWidth;

  arrowRight.addEventListener("click", () => {
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    if (scrollContainer.scrollLeft >= maxScroll - 5) {
      scrollContainer.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  });

  arrowLeft.addEventListener("click", () => {
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;

    if (scrollContainer.scrollLeft <= 5) {
      scrollContainer.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      scrollContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  });
});
