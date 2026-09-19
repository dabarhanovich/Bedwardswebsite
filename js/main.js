/* ============================================================
   Site behavior: theme toggle, mobile menu, header shadow,
   active nav, scroll reveal, service-card prefill, quote form,
   Google/Yelp review chips, service-area map, work photo lightbox.
   Leaflet is loaded from CDN only for the service-area map.
   Loaded at the end of <body>.
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* Assigned after the service-area map initializes. */
  let syncMapTheme = () => {};

  /* ---------- Theme toggle (persists to localStorage) ---------- */
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const syncThemeBtn = () => themeBtn.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    syncThemeBtn();
    syncMapTheme();
  });
  // Follow system changes only if the user hasn't chosen manually
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) {
      root.classList.toggle('dark', e.matches);
      syncThemeBtn();
      syncMapTheme();
    }
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn  = $('#menu-toggle');
  const menu     = $('#mobile-menu');
  const openIcon = $('.menu-open-icon', menuBtn);
  const closeIcon= $('.menu-close-icon', menuBtn);

  const setMenu = (open) => {
    menu.dataset.open = String(open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    openIcon.classList.toggle('hidden', open);
    closeIcon.classList.toggle('hidden', !open);
    document.body.style.overflow = open && window.innerWidth < 1024 ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(menu.dataset.open !== 'true'));
  $$('.mobile-link').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || menu.dataset.open !== 'true') return;
    if ($('#work-lightbox')?.open) return;
    setMenu(false);
    menuBtn.focus();
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });

  /* ---------- Header border/shadow after scroll ---------- */
  const header = $('#site-header');
  const onScroll = () => {
    const scrolled = window.scrollY > 8;
    header.classList.toggle('border-line', scrolled);
    header.classList.toggle('shadow-card', scrolled);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Active nav link on scroll ---------- */
  const navLinks = $$('.nav-link');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => navObserver.observe(s));
  }

  /* ---------- Reveal on scroll (one-time, lightweight) ---------- */
  const reveals = $$('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObserver.observe(el));
  }

  /* ---------- Service cards preselect the form dropdown ---------- */
  const serviceSelect = $('#service');
  $$('.service-cta').forEach(a => {
    a.addEventListener('click', () => {
      const val = a.dataset.service;
      const opt = Array.from(serviceSelect.options).find(o => o.text === val);
      if (opt) serviceSelect.value = opt.value;
    });
  });

  /* ---------- Quote form: validation + submit ---------- */
  const form = $('#quote-form');
  const success = $('#form-success');
  const failure = $('#form-failure');
  const submitBtn = $('button[type="submit"]', form);
  const label = $('.submit-label', submitBtn);
  const spinner = $('.submit-spinner', submitBtn);

  const validators = {
    name:    v => v.trim().length >= 2,
    phone:   v => v.replace(/\D/g, '').length >= 10,
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    service: v => v !== '',
  };

  const setFieldState = (field, ok) => {
    field.setAttribute('aria-invalid', String(!ok));
    const err = $('#' + field.id + '-error');
    if (err) err.classList.toggle('hidden', ok);
  };

  // Validate on blur; clear errors as the user fixes them
  Object.keys(validators).forEach(id => {
    const field = $('#' + id);
    field.addEventListener('blur', () => setFieldState(field, validators[id](field.value)));
    field.addEventListener('input', () => { if (field.getAttribute('aria-invalid') === 'true') setFieldState(field, validators[id](field.value)); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    success.classList.add('hidden'); failure.classList.add('hidden');

    // Honeypot: silently drop bot submissions
    if ($('#company').value) { form.reset(); return; }

    let firstInvalid = null;
    Object.keys(validators).forEach(id => {
      const field = $('#' + id);
      const ok = validators[id](field.value);
      setFieldState(field, ok);
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    // Loading state
    submitBtn.disabled = true; label.textContent = 'Sending…'; spinner.classList.remove('hidden');

    try {
      const endpoint = form.getAttribute('action');
      if (endpoint && endpoint !== '#') {
        // Real submission (e.g. Formspree): expects a JSON-friendly endpoint
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error('Bad response');
      } else {
        // No endpoint configured yet — simulate success so the UI can be reviewed
        await new Promise(r => setTimeout(r, 700));
        console.warn('Quote form: set the form `action` to your endpoint before launch.');
      }
      form.reset();
      success.classList.remove('hidden');
    } catch (err) {
      failure.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false; label.textContent = 'Send quote request'; spinner.classList.add('hidden');
    }
  });

  /* ---------- Google / Yelp review chips ---------- */
  const reviewsSection = $('#reviews');
  if (reviewsSection) {
    const CACHE_KEY = 'lng-google-place-stats';
    const CACHE_MS = 12 * 60 * 60 * 1000;

    const parseRating = (value) => {
      const n = Number.parseFloat(value);
      return Number.isFinite(n) && n > 0 && n <= 5 ? n : null;
    };
    const parseCount = (value) => {
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const isHttpUrl = (value) => /^https?:\/\//i.test(value || '');
    const isProfileUrl = (url, platform) => {
      if (!isHttpUrl(url)) return false;
      if (platform === 'google') return /\/maps\/place|cid=|maps\.app\.goo\.gl|g\.page\//i.test(url);
      if (platform === 'yelp') return /\/biz\//i.test(url);
      return false;
    };
    const formatCount = (count) => count === 1 ? '1 review' : count.toLocaleString() + ' reviews';
    const starFill = (rating) => Math.max(0, Math.min(100, (rating / 5) * 100));

    const setCardLink = (card, url) => {
      if (!card || !isHttpUrl(url)) return;
      card.href = url;
    };

    const paintScore = (prefix, rating, count) => {
      const score = $('[data-' + prefix + '-score]', reviewsSection);
      const blurb = $('[data-' + prefix + '-blurb]', reviewsSection);
      const stars = $('[data-' + prefix + '-stars]', reviewsSection);
      const ratingEl = $('[data-' + prefix + '-rating-display]', reviewsSection);
      const countEl = $('[data-' + prefix + '-count-display]', reviewsSection);
      if (!rating) return;
      if (stars) {
        stars.style.setProperty('--star-fill', String(starFill(rating)));
        stars.parentElement.setAttribute('aria-label', rating.toFixed(1) + ' out of 5 on ' + (prefix === 'google' ? 'Google' : 'Yelp'));
      }
      if (ratingEl) ratingEl.textContent = rating.toFixed(1);
      if (countEl) countEl.textContent = count ? formatCount(count) : '';
      if (score) {
        score.classList.remove('hidden');
        score.classList.add('flex');
      }
      if (blurb) blurb.classList.add('hidden');
    };

    const updateJsonLd = (googleUrl, yelpUrl, rating, count) => {
      const ld = $('script[type="application/ld+json"]');
      if (!ld) return;
      try {
        const data = JSON.parse(ld.textContent);
        const sameAs = [];
        if (isProfileUrl(googleUrl, 'google')) sameAs.push(googleUrl);
        if (isProfileUrl(yelpUrl, 'yelp')) sameAs.push(yelpUrl);
        if (sameAs.length) data.sameAs = sameAs;
        if (rating && count) {
          data.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: rating.toFixed(1),
            reviewCount: String(count),
            bestRating: '5',
            worstRating: '1'
          };
        }
        ld.textContent = JSON.stringify(data, null, 2);
      } catch (err) { /* leave existing JSON-LD alone */ }
    };

    const loadMaps = (key) => {
      const maps = window.google && window.google.maps;
      if (maps && (typeof maps.importLibrary === 'function' || maps.places)) {
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const callback = '__lngMapsReady';
        window[callback] = () => resolve();
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&v=weekly&libraries=places&callback=' + callback;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error('Maps script failed to load'));
        document.head.appendChild(script);
      });
    };

    const readCachedGoogle = () => {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (!cached || Date.now() - cached.ts > CACHE_MS) return null;
        return cached;
      } catch (err) {
        return null;
      }
    };

    const writeCachedGoogle = (stats) => {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...stats }));
      } catch (err) { /* private mode */ }
    };

    const fetchGoogleStats = async (placeId, apiKey) => {
      const cached = readCachedGoogle();
      if (cached && cached.placeId === placeId) {
        return { rating: cached.rating, count: cached.count, url: cached.url };
      }
      await loadMaps(apiKey);
      let stats = null;
      const maps = window.google.maps;
      if (typeof maps.importLibrary === 'function') {
        const { Place } = await maps.importLibrary('places');
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ['rating', 'userRatingCount', 'googleMapsURI'] });
        stats = { rating: place.rating, count: place.userRatingCount, url: place.googleMapsURI };
      } else {
        stats = await new Promise((resolve, reject) => {
          const svc = new maps.places.PlacesService(document.createElement('div'));
          svc.getDetails({ placeId: placeId, fields: ['rating', 'user_ratings_total', 'url'] }, (place, status) => {
            if (status !== 'OK' || !place) {
              reject(new Error(String(status)));
              return;
            }
            resolve({ rating: place.rating, count: place.user_ratings_total, url: place.url });
          });
        });
      }
      writeCachedGoogle({ placeId, ...stats });
      return stats;
    };

    const googleCard = $('#google-reviews-card');
    const yelpCard = $('#yelp-reviews-card');
    const footerGoogle = $('#footer-google');
    const footerYelp = $('#footer-yelp');
    const yelpEmbeds = $('#yelp-embeds');

    let googleUrl = reviewsSection.dataset.googleUrl || (googleCard && googleCard.href) || '';
    let yelpUrl = reviewsSection.dataset.yelpUrl || (yelpCard && yelpCard.href) || '';
    let googleRating = parseRating(reviewsSection.dataset.googleRating);
    let googleCount = parseCount(reviewsSection.dataset.googleCount);
    const yelpRating = parseRating(reviewsSection.dataset.yelpRating);
    const yelpCount = parseCount(reviewsSection.dataset.yelpCount);
    const placeId = (reviewsSection.dataset.googlePlaceId || '').trim();
    const mapsKey = (reviewsSection.dataset.googleMapsKey || '').trim();

    setCardLink(googleCard, googleUrl);
    setCardLink(yelpCard, yelpUrl);
    setCardLink(footerGoogle, googleUrl);
    setCardLink(footerYelp, yelpUrl);
    paintScore('google', googleRating, googleCount);
    paintScore('yelp', yelpRating, yelpCount);

    if (yelpEmbeds && yelpEmbeds.childElementCount) {
      yelpEmbeds.hidden = false;
      yelpEmbeds.classList.remove('hidden');
    }

    const applyGoogleLive = (stats) => {
      if (!stats) return;
      if (stats.rating) googleRating = parseRating(stats.rating) || googleRating;
      if (stats.count) googleCount = parseCount(stats.count) || googleCount;
      if (isHttpUrl(stats.url)) {
        googleUrl = stats.url;
        setCardLink(googleCard, googleUrl);
        setCardLink(footerGoogle, googleUrl);
      }
      paintScore('google', googleRating, googleCount);
      updateJsonLd(googleUrl, yelpUrl, googleRating || yelpRating, googleCount || yelpCount);
    };

    updateJsonLd(googleUrl, yelpUrl, googleRating || yelpRating, googleCount || yelpCount);

    if (placeId && mapsKey) {
      fetchGoogleStats(placeId, mapsKey).then(applyGoogleLive).catch(() => {
        console.warn('Reviews: Google Places lookup failed. Check the Place ID and Maps JavaScript API key.');
      });
    }
  }

  /* ---------- Service-area map (Yelp coverage polygon) ---------- */
  const mapEl = $('#service-area-map');
  if (mapEl && typeof window.L !== 'undefined') {
    const reduceMotionMap = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coverage = [
      [44.276699, -123.816709],
      [44.200024, -123.260791],
      [44.200024, -121.793895],
      [44.683425, -121.733286],
      [45.285174, -121.733286],
      [45.285174, -123.725771],
      [44.721270, -123.816709],
    ];
    const tileUrl = (dark) => dark
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    const tileAttrib = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';

    const map = L.map(mapEl, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
      zoomAnimation: !reduceMotionMap,
      fadeAnimation: !reduceMotionMap,
      markerZoomAnimation: !reduceMotionMap,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);

    const addTiles = (dark) => L.tileLayer(tileUrl(dark), {
      attribution: tileAttrib,
      maxZoom: dark ? 16 : 19,
    }).addTo(map);

    let tiles = addTiles(root.classList.contains('dark'));

    const rgbToken = (name) => getComputedStyle(root).getPropertyValue(name).trim().replace(/\s+/g, ' ');
    const coverageLayer = L.polygon(coverage, {
      color: 'rgb(' + rgbToken('--accent-500') + ')',
      weight: 2,
      fillColor: 'rgb(' + rgbToken('--accent-500') + ')',
      fillOpacity: 0.22,
      interactive: false,
    }).addTo(map);

    const fitCoverage = () => {
      if (mapEl.offsetWidth < 8 || mapEl.offsetHeight < 8) return false;
      map.invalidateSize({ animate: false });
      map.fitBounds(coverageLayer.getBounds(), { padding: [18, 18], animate: false, maxZoom: 9 });
      return true;
    };

    const paintCoverage = () => {
      const fill = 'rgb(' + rgbToken('--accent-500') + ')';
      coverageLayer.setStyle({ color: fill, fillColor: fill });
    };

    syncMapTheme = () => {
      const dark = root.classList.contains('dark');
      tiles.remove();
      tiles = addTiles(dark);
      paintCoverage();
    };

    let fitted = fitCoverage();
    const refreshSize = () => {
      map.invalidateSize({ animate: false });
      if (!fitted) fitted = fitCoverage();
    };
    window.addEventListener('resize', refreshSize);
    if ('ResizeObserver' in window) {
      new ResizeObserver(refreshSize).observe(mapEl);
    }
    const revealHost = mapEl.closest('.reveal');
    if (revealHost) {
      if (revealHost.classList.contains('is-visible')) {
        requestAnimationFrame(refreshSize);
      } else if ('MutationObserver' in window) {
        const mo = new MutationObserver(() => {
          if (revealHost.classList.contains('is-visible')) {
            refreshSize();
            mo.disconnect();
          }
        });
        mo.observe(revealHost, { attributes: true, attributeFilter: ['class'] });
      }
    }
  }

  /* ---------- Work photo lightbox ---------- */
  const lightbox = $('#work-lightbox');
  if (lightbox) {
    const lightboxImg = $('#work-lightbox-img', lightbox);
    const lightboxCaption = $('#work-lightbox-caption', lightbox);
    const photos = $$('[data-work-photo]');
    let index = 0;

    const showPhoto = (i) => {
      if (!photos.length) return;
      index = (i + photos.length) % photos.length;
      const btn = photos[index];
      const img = $('img', btn);
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      const label = $('.work-photo-label', btn)?.textContent.trim() || '';
      lightboxCaption.textContent = label;
      lightboxCaption.hidden = !label;
      if (!lightbox.open) lightbox.showModal();
    };

    photos.forEach((btn, i) => {
      btn.addEventListener('click', () => showPhoto(i));
    });

    const closeBtn = $('[data-work-close]', lightbox);
    const prevBtn = $('[data-work-prev]', lightbox);
    const nextBtn = $('[data-work-next]', lightbox);
    if (closeBtn) closeBtn.addEventListener('click', () => lightbox.close());
    if (prevBtn) prevBtn.addEventListener('click', () => showPhoto(index - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showPhoto(index + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('keydown', (e) => {
      if (!lightbox.open) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); showPhoto(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showPhoto(index + 1); }
    });
  }

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
