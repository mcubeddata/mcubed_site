document.addEventListener("DOMContentLoaded", () => {
  // ----------- Navbar Scroll Effect -----------
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // ----------- Intersection Observer for Scroll Animations -----------
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        // Optional: Stop observing once faded in to prevent re-triggering
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with .fade-in-up class
  document.querySelectorAll(".fade-in-up").forEach((element) => {
    observer.observe(element);
  });

  // ----------- Smooth Scrolling for Anchor Links -----------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        // Adjust for navbar height
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // ----------- Mouse Move Parallax Effect on Blobs (Optional Wow Factor) -----------
  const blobs = document.querySelectorAll(".blob");

  document.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    blobs.forEach((blob, index) => {
      const speed = (index + 1) * 20;
      const xOffset = (window.innerWidth / 2 - e.pageX) / speed;
      const yOffset = (window.innerHeight / 2 - e.pageY) / speed;

      blob.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
  });
});
