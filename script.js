(() => {
  const WHATSAPP = '5511998097766';

  // Header: solid background after scrolling past the hero top
  const header = document.querySelector('[data-header]');
  const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Reveal on scroll
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add('is-visible'));
  }

  // Fotos das casas dentro dos cards (carregadas sob demanda)
  const galleries = window.GALLERIES || {};
  document.querySelectorAll('[data-house-slides]').forEach((track) => {
    const key = track.dataset.houseSlides;
    const photos = galleries[key];
    if (!photos) return;
    const name = key.replace('casa-', 'Casa ');
    const cover = track.dataset.cover;
    // a foto de capa vem primeiro, as demais seguem a ordem da galeria
    const ordered = [...photos.filter(([f]) => f === cover), ...photos.filter(([f]) => f !== cover)];
    track.dataset.order = JSON.stringify(ordered.map(([f]) => photos.findIndex(([g]) => g === f)));
    track.innerHTML = ordered.map(([file], i) =>
      `<img class="house-photo" src="assets/img/${key}/thumb/${file}" alt="${name}: foto ${i + 1} de ${ordered.length}" width="640" height="480" draggable="false"${i ? ' loading="lazy" decoding="async"' : ''}>`
    ).join('');
  });

  // Carrossel deslizável (toque nativo + arrastar com o mouse + setas)
  document.querySelectorAll('[data-carousel]').forEach((track) => {
    const slides = [...track.children];
    const root = track.parentElement;
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const count = root.querySelector('[data-carousel-count]');
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    if (dotsWrap) dotsWrap.innerHTML = slides.map(() => '<span></span>').join('');
    const dots = dotsWrap ? [...dotsWrap.children] : [];
    const pad = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const posOf = (i) => slides[i].offsetLeft - pad();
    const nearest = (x) => slides.reduce((best, _, i) => Math.abs(posOf(i) - x) < Math.abs(posOf(best) - x) ? i : best, 0);
    const goTo = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: posOf(i), behavior: 'smooth' });
    };

    const update = () => {
      let active = nearest(track.scrollLeft);
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) active = slides.length - 1;
      track.dataset.index = active;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
      if (count) count.textContent = `${active + 1} / ${slides.length}`;
      if (prev) prev.disabled = active === 0;
      if (next) next.disabled = active === slides.length - 1;
    };
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    update();

    prev?.addEventListener('click', () => goTo(+track.dataset.index - 1));
    next?.addEventListener('click', () => goTo(+track.dataset.index + 1));
    track.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      goTo(+track.dataset.index + (e.key === 'ArrowRight' ? 1 : -1));
    });

    let startX = 0, startScroll = 0, down = false, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || track.scrollWidth <= track.clientWidth) return;
      down = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      track.classList.remove('is-dragging');
      // avança ou volta um slide conforme a direção do arraste
      const from = nearest(startScroll);
      const delta = track.scrollLeft - startScroll;
      goTo(from + (Math.abs(delta) > 40 ? Math.sign(delta) : 0));
    });
  });

  // Booking form
  const form = document.querySelector('[data-booking-form]');
  const err = form.querySelector('[data-form-error]');
  const inEl = form.elements.entrada;
  const outEl = form.elements.saida;
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = new Date();
  inEl.min = iso(today);
  outEl.min = iso(today);
  inEl.addEventListener('change', () => {
    if (!inEl.value) return;
    const next = new Date(inEl.value + 'T12:00');
    next.setDate(next.getDate() + 1);
    outEl.min = iso(next);
    if (!outEl.value || outEl.value <= inEl.value) outEl.value = iso(next);
  });

  // "Consultar datas" on a house card preselects that house
  document.querySelectorAll('[data-house]').forEach((link) => {
    link.addEventListener('click', () => { form.elements.casa.value = link.dataset.house; });
  });

  const fmt = (v) => v.split('-').reverse().join('/');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { nome, entrada, saida, hospedes, casa, mensagem } = form.elements;
    [nome, entrada, saida].forEach((f) => f.removeAttribute('aria-invalid'));

    let problem = '';
    if (!nome.value.trim()) { problem = 'Informe seu nome.'; nome.setAttribute('aria-invalid', 'true'); }
    else if (!entrada.value || !saida.value) { problem = 'Escolha as datas de entrada e saída.'; (entrada.value ? saida : entrada).setAttribute('aria-invalid', 'true'); }
    else if (saida.value <= entrada.value) { problem = 'A data de saída precisa ser depois da entrada.'; saida.setAttribute('aria-invalid', 'true'); }

    if (problem) {
      err.textContent = problem;
      err.hidden = false;
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    err.hidden = true;

    const nights = Math.round((new Date(saida.value) - new Date(entrada.value)) / 86400000);
    const lines = [
      `Olá! Meu nome é ${nome.value.trim()} e gostaria de consultar disponibilidade no Four Waves Juquehy.`,
      ``,
      `• Entrada: ${fmt(entrada.value)}`,
      `• Saída: ${fmt(saida.value)} (${nights} ${nights === 1 ? 'noite' : 'noites'})`,
      `• Hóspedes: ${hospedes.value}`,
      `• Casa: ${casa.value}`,
    ];
    if (mensagem.value.trim()) lines.push('', mensagem.value.trim());

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  });

  // Lightbox gallery
  const lb = document.querySelector('[data-lightbox]');
  const lbImg = lb.querySelector('[data-lb-img]');
  const lbTitle = lb.querySelector('[data-lb-title]');
  const lbCount = lb.querySelector('[data-lb-count]');
  const lbThumbs = lb.querySelector('[data-lb-thumbs]');
  let current = null, index = 0, lastFocus = null;

  const show = (i) => {
    const photos = galleries[current];
    index = (i + photos.length) % photos.length;
    const [file] = photos[index];
    const name = lbTitle.textContent;
    lbImg.src = `assets/img/${current}/${file}`;
    lbImg.alt = `${name}: foto ${index + 1} de ${photos.length}`;
    lbCount.textContent = `${index + 1} / ${photos.length}`;
    lbThumbs.querySelectorAll('button').forEach((b, n) => {
      const on = n === index;
      b.setAttribute('aria-current', String(on));
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    // preload neighbours
    [index + 1, index - 1].forEach((n) => {
      const p = photos[(n + photos.length) % photos.length];
      new Image().src = `assets/img/${current}/${p[0]}`;
    });
  };

  const openGallery = (key, start = 0) => {
    if (!galleries[key]) return;
    current = key;
    lastFocus = document.activeElement;
    lbTitle.textContent = key.replace('casa-', 'Casa ');
    lbThumbs.innerHTML = galleries[key].map(([file], n) =>
      `<button type="button" aria-label="Foto ${n + 1}"><img src="assets/img/${key}/thumb/${file}" alt=""></button>`).join('');
    lb.hidden = false;
    document.body.classList.add('lb-open');
    show(start);
    lb.querySelector('[data-lb-close]').focus();
  };

  const closeGallery = () => {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('lb-open');
    lastFocus?.focus();
  };

  document.querySelectorAll('[data-gallery]').forEach((el) =>
    el.addEventListener('click', () => {
      // abre na mesma foto que está visível no card
      const track = el.closest('.house-card')?.querySelector('[data-house-slides]');
      const order = track ? JSON.parse(track.dataset.order || '[]') : [];
      openGallery(el.dataset.gallery, order[+track?.dataset.index || 0] || 0);
    }));
  lb.querySelector('[data-lb-close]').addEventListener('click', closeGallery);
  lb.querySelector('[data-lb-prev]').addEventListener('click', () => show(index - 1));
  lb.querySelector('[data-lb-next]').addEventListener('click', () => show(index + 1));
  lbThumbs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) show([...lbThumbs.children].indexOf(b));
  });
  lb.querySelector('[data-lb-stage]').addEventListener('click', (e) => { if (e.target.matches('[data-lb-stage]')) closeGallery(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeGallery();
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button')].filter((b) => b.offsetParent);
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  let touchX = null;
  lbImg.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lbImg.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  document.querySelector('[data-year]').textContent = new Date().getFullYear();
})();
