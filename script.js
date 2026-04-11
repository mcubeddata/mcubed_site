document.addEventListener("DOMContentLoaded", () => {
  // ----------- APK Architecture Auto-Detection -----------
  function detectAndroidArch() {
    const ua = navigator.userAgent.toLowerCase();
    if (!ua.includes("android")) return null;
    if (ua.includes("x86_64") || ua.includes("x86")) return "x86_64";
    // Most Android phones since ~2017 are arm64-v8a.
    // There's no reliable UA hint to distinguish arm64 vs armv7, so
    // we use Android version as a heuristic: Android 8+ → arm64.
    const match = ua.match(/android (\d+)/);
    const androidVersion = match ? parseInt(match[1]) : 0;
    return androidVersion >= 8 ? "arm64-v8a" : "armeabi-v7a";
  }

  const archMap = {
    "arm64-v8a":    { cardId: "card-arm64", badgeId: "badge-arm64", label: "ARM64-v8a (modern phones) is recommended for your device." },
    "armeabi-v7a":  { cardId: "card-armv7", badgeId: "badge-armv7", label: "ARMv7 (older phones) is recommended for your device." },
    "x86_64":       { cardId: "card-x86",   badgeId: "badge-x86",   label: "x86_64 (Chromebook / emulator) is recommended for your device." },
  };

  const detectedArch = detectAndroidArch();
  const banner = document.getElementById("recommended-banner");
  const bannerText = document.getElementById("recommended-text");

  if (detectedArch && archMap[detectedArch]) {
    const info = archMap[detectedArch];
    const card = document.getElementById(info.cardId);
    const badge = document.getElementById(info.badgeId);

    if (card) card.classList.add("recommended");
    if (badge) badge.style.display = "inline-block";
    if (banner) banner.style.display = "flex";
    if (bannerText) bannerText.textContent = info.label;
  }
  // On non-Android (desktop/iOS) just show all cards without recommendation.
  async function loadLatestReleaseMetadata() {
    const versionInfo = document.getElementById("releaseVersionInfo");
    const sizeLabels = document.querySelectorAll(".apk-size[data-asset-name]");

    try {
      const response = await fetch("https://api.github.com/repos/mcubeddata/mcubed_site/releases/latest", {
        headers: { Accept: "application/vnd.github+json" },
      });

      if (!response.ok) return;

      const release = await response.json();
      const tag = (release.tag_name || "").replace(/^v/, "");
      if (versionInfo && tag) {
        versionInfo.textContent = `Version ${tag} | Requires Android 8.0+`;
      }

      const assets = Array.isArray(release.assets) ? release.assets : [];
      const assetMap = new Map(assets.map((asset) => [asset.name, asset]));

      sizeLabels.forEach((label) => {
        const assetName = label.getAttribute("data-asset-name");
        const asset = assetMap.get(assetName);
        if (!asset || typeof asset.size !== "number") return;

        const mb = asset.size / (1024 * 1024);
        label.innerHTML = `<i class="fas fa-file-archive"></i> ${mb.toFixed(1)} MB`;
      });
    } catch (error) {
      console.warn("Failed to load latest release metadata", error);
    }
  }

  loadLatestReleaseMetadata();

  async function loadChangelog() {
    const list = document.getElementById("changelog-list");
    if (!list) return;

    try {
      const response = await fetch(
        "https://api.github.com/repos/mcubeddata/mcubed_site/releases?per_page=5",
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const releases = await response.json();
      if (!Array.isArray(releases) || releases.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">No releases yet.</p>';
        return;
      }

      list.innerHTML = releases.map((r) => {
        const tag = (r.tag_name || "Unknown").replace(/^v/, "");
        const rawBody = (r.body || "").trim();
        const body = rawBody || "No release notes available.";
        const date = r.published_at
          ? new Date(r.published_at).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            })
          : "";

        // Parse markdown into sections with headers and bullet lists
        const lines = body.replace(/\r\n/g, "\n").split("\n");
        let bodyHtml = "";
        let inList = false;
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (/^###\s/.test(trimmed)) {
            if (inList) { bodyHtml += "</ul>"; inList = false; }
            bodyHtml += `<p class="changelog-section-header">${trimmed.replace(/^###\s*/, "")}</p>`;
          } else if (/^[*\-]\s/.test(trimmed)) {
            if (!inList) { bodyHtml += "<ul>"; inList = true; }
            bodyHtml += `<li>${trimmed.replace(/^[*\-]\s*/, "")}</li>`;
          } else {
            if (inList) { bodyHtml += "</ul>"; inList = false; }
            bodyHtml += `<p>${trimmed}</p>`;
          }
        }
        if (inList) bodyHtml += "</ul>";

        return `
          <div class="glass changelog-card fade-in-up">
            <div class="changelog-card-header">
              <span class="changelog-tag"><i class="fas fa-tag"></i> v${tag}</span>
              ${date ? `<span class="changelog-date">${date}</span>` : ""}
            </div>
            <div class="changelog-body">${bodyHtml}</div>
          </div>`;
      }).join("");

      list.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    } catch (err) {
      console.warn("Failed to load changelog", err);
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Could not load release notes.</p>';
    }
  }

  loadChangelog();
  // ----------- Mobile Menu Toggle -----------
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const navLinks = document.getElementById("navLinks");
  const navOverlay = document.getElementById("navOverlay");

  function toggleMenu() {
    mobileMenuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    navOverlay.classList.toggle("active");
    document.body.style.overflow = navLinks.classList.contains("active") ? "hidden" : "";
  }

  function closeMenu() {
    mobileMenuToggle.classList.remove("active");
    navLinks.classList.remove("active");
    navOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", toggleMenu);
  }

  if (navOverlay) {
    navOverlay.addEventListener("click", closeMenu);
  }

  // Close menu when clicking a link
  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close menu on window resize if desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 992) {
      closeMenu();
    }
  });

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


