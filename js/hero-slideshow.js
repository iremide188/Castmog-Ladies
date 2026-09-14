/*
 * Hero background slideshow — cross-fades between team photos on the homepage hero.
 * Edit HERO_IMAGES below to change/add/remove photos.
 */
(function () {
  var HERO_IMAGES = [
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/d306592a2_d004a9706_DSC_5180.jpg",
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/7de4db201_9fd4d2b5c_DSC_5181.jpg",
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/626a84d17_0e4243df8_DSC_5192.jpg",
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/27bbe819b_163e2ff49_DSC_5193.jpg",
    "https://media.base44.com/images/public/6aa7fa4b232a4afee3f5b6f2/c13ff6370_7fa3898b8_DSC_5196.jpg"
  ];

  var SLIDE_DURATION_MS = 5000;

  function initHeroSlideshow() {
    var mount = document.getElementById("hero-slideshow");
    if (!mount || HERO_IMAGES.length === 0) return;

    HERO_IMAGES.forEach(function (url, index) {
      var slide = document.createElement("div");
      slide.className = "hero-slide" + (index === 0 ? " is-active" : "");
      slide.style.backgroundImage = "url('" + url + "')";
      mount.appendChild(slide);
    });

    if (HERO_IMAGES.length < 2) return;

    var slides = mount.querySelectorAll(".hero-slide");
    var current = 0;

    setInterval(function () {
      var next = (current + 1) % slides.length;
      slides[current].classList.remove("is-active");
      slides[next].classList.add("is-active");
      current = next;
    }, SLIDE_DURATION_MS);
  }

  document.addEventListener("DOMContentLoaded", initHeroSlideshow);
})();
