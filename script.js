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
  nav.id = 'menu';
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

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

  document.querySelector('[data-year]').textContent = new Date().getFullYear();
})();
