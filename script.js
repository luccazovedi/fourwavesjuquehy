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
  const galleries = window.GALLERIES || {};
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

  const openGallery = (key) => {
    if (!galleries[key]) return;
    current = key;
    lastFocus = document.activeElement;
    lbTitle.textContent = key.replace('casa-', 'Casa ');
    lbThumbs.innerHTML = galleries[key].map(([file], n) =>
      `<button type="button" aria-label="Foto ${n + 1}"><img src="assets/img/${key}/thumb/${file}" alt=""></button>`).join('');
    lb.hidden = false;
    document.body.classList.add('lb-open');
    show(0);
    lb.querySelector('[data-lb-close]').focus();
  };

  const closeGallery = () => {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('lb-open');
    lastFocus?.focus();
  };

  document.querySelectorAll('[data-gallery]').forEach((el) =>
    el.addEventListener('click', () => openGallery(el.dataset.gallery)));
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
