// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();

//togglers-functionality
let taxSwitch = document.getElementById("switchCheckDefault");

taxSwitch.addEventListener("click", () => {
  let taxInfo = document.getElementsByClassName("tax-info");
  for (info of taxInfo) {
    if (info.style.display != "inline") {
      info.style.display = "inline";
    } else {
      info.style.display = "none";
    }
  }
});

//arrow-btn-next-icon-functionality
const filters = document.getElementById("filters");
const arrowBtn = document.querySelector(".arrow-btn");
const filterItems = document.querySelectorAll("#filters .filter");

let currentPage = 0;

function getIconsPerView() {
  const filterWidth = filters.clientWidth;
  const iconWidth =
    filterItems[0].offsetWidth +
    parseInt(getComputedStyle(filterItems[0]).marginRight);

  return Math.max(1, Math.floor(filterWidth / iconWidth));
}

arrowBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const iconsPerView = getIconsPerView();
  const maxPage = Math.ceil(filterItems.length / iconsPerView) - 1;

  currentPage = Math.min(currentPage, maxPage);

  if (currentPage < maxPage) {
    currentPage++;
  } else {
    currentPage = 0;
  }

  const scrollAmount =
    currentPage *
    iconsPerView *
    (filterItems[0].offsetWidth +
      parseInt(getComputedStyle(filterItems[0]).marginRight));

  filters.scrollTo({
    left: scrollAmount,
    behavior: "smooth",
  });
});

function updateArrowVisibility() {
  if (filters.scrollWidth > filters.clientWidth) {
    arrowBtn.style.display = "flex";
  } else {
    arrowBtn.style.display = "none";
  }
}

window.addEventListener("load", () => {
  requestAnimationFrame(updateArrowVisibility);
});
window.addEventListener("resize", () => {
  currentPage = 0;
  filters.scrollTo({ left: 0 });
  updateArrowVisibility();
});
