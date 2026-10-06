/* ============================================================
   KORDUN GRADNJA — main.js
   ============================================================ */

// Endpoint za kontakt formu (Google Apps Script).
// Nalepite URL ovde nakon pokretanja Skill 03 (Form Backend Setup).
const ENDPOINT = '';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initNav();
  initWordReveal();
  initScrollReveal();
  initFaq();
  initTabs();
  initForm();
  initTimeline();
  initStats();
  initFeatureCarousel();
  initWhyIcons();
});

/* ---- Godina u footeru ---- */
function initYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ---- Nav: scroll state + mobilni meni ---- */
function initNav(){
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const links = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  burger.addEventListener('click', () => {
    const open = links.classList.toggle('mobile-open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('mobile-open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }));
}

/* ---- Word reveal naslova (blur -> clear, stagger) ---- */
function initWordReveal(){
  document.querySelectorAll('[data-splitwords]').forEach(el => {
    const isSub = el.classList.contains('hero__sub') || el.classList.contains('lead');
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    if (isSub) el.classList.add('sub');
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'word pre';
      span.style.setProperty('--wi', i);
      span.textContent = w;
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  });

  if (reduce){
    document.querySelectorAll('.word').forEach(w => w.classList.replace('pre','in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.querySelectorAll('.word').forEach(w => { w.classList.remove('pre'); w.classList.add('in'); });
        io.unobserve(e.target);
      }
    });
  }, { threshold:.25 });
  document.querySelectorAll('[data-splitwords]').forEach(el => io.observe(el));
}

/* ---- Scroll reveal (reveal-up / -left / -pop) ---- */
function initScrollReveal(){
  const els = document.querySelectorAll('.reveal-up,.reveal-left,.reveal-pop');
  if (reduce){ els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold:.14, rootMargin:'0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
}

/* ---- FAQ accordion ---- */
function initFaq(){
  document.querySelectorAll('.faq__item').forEach(item => {
    item.querySelector('.faq__q').addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq__item.open').forEach(o => o !== item && o.classList.remove('open'));
      item.classList.toggle('open', !open);
    });
  });
}

/* ---- Projekti tabs ---- */
function initTabs(){
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const id = tab.dataset.tab;
    tabs.forEach(t => { t.classList.toggle('is-active', t===tab); t.setAttribute('aria-selected', t===tab?'true':'false'); });
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel===id));
  }));
}

/* ---- Kontakt forma ---- */
function initForm(){
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submit = document.getElementById('formSubmit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = ''; status.className = 'form__status';

    const req = ['ime','telefon','email'];
    for (const name of req){
      const f = form.elements[name];
      if (!f.value.trim()){ status.textContent='Molimo popunite obavezna polja (ime, telefon, email).'; status.classList.add('err'); f.focus(); return; }
    }
    const email = form.elements['email'];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)){ status.textContent='Unesite ispravnu email adresu.'; status.classList.add('err'); email.focus(); return; }

    const data = Object.fromEntries(new FormData(form).entries());

    if (!ENDPOINT){
      // Backend još nije povezan (Skill 03).
      status.textContent = 'Hvala! Forma još nije povezana sa serverom. Pozovite nas na 060/602 40 26 ili pišite na office@kordungradnja.rs.';
      status.classList.add('ok');
      form.reset();
      return;
    }

    submit.disabled = true;
    const label = submit.innerHTML;
    submit.textContent = 'Slanje...';
    try {
      await fetch(ENDPOINT, { method:'POST', body: JSON.stringify(data), headers:{'Content-Type':'text/plain;charset=utf-8'} });
      status.textContent = 'Hvala! Vaša poruka je poslata. Javićemo vam se uskoro.';
      status.classList.add('ok');
      form.reset();
    } catch (err) {
      status.textContent = 'Došlo je do greške pri slanju. Pokušajte ponovo ili nas pozovite.';
      status.classList.add('err');
    } finally {
      submit.disabled = false; submit.innerHTML = label;
    }
  });
}

/* ---- Suptilni count-up na hero stat brojevima ----
   (zamena za raniji scramble efekat — smireno, bez "glitch" utiska) */
function initStats(){
  const nums = document.querySelectorAll('.hero__stats .statcard__num');
  if (!nums.length) return;

  // Parsiraj "12", "7+", "100%" -> ciljni broj + prefiks/sufiks
  const parse = (txt) => {
    const m = txt.match(/^(\D*)(\d+)(\D*)$/);
    if (!m) return null;
    return { pre:m[1], target:parseInt(m[2],10), suf:m[3] };
  };

  if (reduce){ return; } // brojevi ostaju kakvi jesu u HTML-u

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const count = (el, info, delay) => {
    const dur = 1100;
    let startT = null;
    const step = (now) => {
      if (startT === null) startT = now;
      const p = Math.min(1, (now - startT) / dur);
      const val = Math.round(easeOut(p) * info.target);
      el.textContent = info.pre + val + info.suf;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = info.pre + info.target + info.suf;
    };
    setTimeout(() => requestAnimationFrame(step), delay);
  };

  // Pripremi: postavi na 0 dok kartica ne uđe u vidno polje
  const prepared = [];
  nums.forEach((el) => {
    const info = parse(el.textContent.trim());
    if (!info){ prepared.push(null); return; }
    prepared.push(info);
    el.textContent = info.pre + '0' + info.suf;
  });

  let fired = false;
  const start = () => {
    if (fired) return; fired = true;
    nums.forEach((el, i) => { if (prepared[i]) count(el, prepared[i], 120 + i * 140); });
  };

  const io = new IntersectionObserver((entries) => {
    if (entries.some(e => e.isIntersecting)){ start(); io.disconnect(); }
  }, { threshold:.4 });
  const host = document.querySelector('.hero__stats');
  if (host) io.observe(host); else start();
}

/* ---- Karusel standarda opreme (vanilla, re-skin Vantara) ---- */
function initFeatureCarousel(){
  const root = document.getElementById('featCarousel');
  if (!root) return;
  const chips = Array.from(root.querySelectorAll('.fcar__chip'));
  const cards = Array.from(root.querySelectorAll('.fcar__card'));
  const n = cards.length;
  if (!n) return;

  let step = 0, timer = null;
  const DELAY = 4500;

  const mq = window.matchMedia('(min-width:860px)');
  const dims = () => mq.matches ? { item:60, off:66 } : { item:52, off:42 };

  const wrap = (min,max,v) => { const r = max - min; return ((((v - min) % r) + r) % r) + min; };
  const idx = () => ((step % n) + n) % n;

  function render(){
    const cur = idx(), d = dims();
    chips.forEach((chip, i) => {
      const w = wrap(-n/2, n/2, i - cur);
      chip.style.setProperty('--fy', (w * d.item) + 'px');
      chip.style.opacity = Math.max(0, 1 - Math.abs(w) * 0.26).toFixed(3);
      chip.classList.toggle('is-active', i === cur);
    });
    cards.forEach((card, i) => {
      let diff = i - cur;
      if (diff >  n/2) diff -= n;
      if (diff < -n/2) diff += n;
      let x = 0, s = 0.7, r = 0, o = 0, z = 0, active = false;
      if (diff === 0){ s = 1; o = 1; z = 20; active = true; }
      else if (diff === -1){ x = -d.off; s = .82; r = -4; o = .4; z = 10; }
      else if (diff ===  1){ x =  d.off; s = .82; r =  4; o = .4; z = 10; }
      card.style.transform = `translateX(${x}px) scale(${s}) rotate(${r}deg)`;
      card.style.opacity = o;
      card.style.zIndex = z;
      card.classList.toggle('is-active', active);
    });
  }

  const next = () => { step++; render(); };
  const go = (i) => { const diff = (i - idx() + n) % n; if (diff > 0){ step += diff; render(); } };
  const play = () => { if (reduce) return; stop(); timer = setInterval(next, DELAY); };
  const stop = () => { if (timer){ clearInterval(timer); timer = null; } };

  chips.forEach(chip => chip.addEventListener('click', () => { go(parseInt(chip.dataset.i, 10)); }));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
  if (mq.addEventListener) mq.addEventListener('change', render);
  window.addEventListener('resize', render, { passive:true });

  render();

  if (!reduce){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? play() : stop());
    }, { threshold:.25 });
    io.observe(root);
  }
}

/* ---- Ikonice "koje se slažu" u sekciji Razlozi da nam verujete ---- */
function initWhyIcons(){
  const icons = document.querySelectorAll('.why__ico');
  if (!icons.length) return;
  if (reduce){ icons.forEach(i => i.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:.5 });
  icons.forEach(i => io.observe(i));
}

/* ---- GSAP pinned horizontalni timeline "Naš put" ---- */
function initTimeline(){
  const section = document.querySelector('.timeline');
  const track = document.getElementById('tlTrack');
  const line = document.getElementById('tlLine');
  if (!section || !track) return;

  const mobile = window.innerWidth < 600;

  // Mobilni: statični vertikalni timeline umesto pinned horizontalnog scrolla
  // (smooth, bez "bagovanja", animacija uvek vidljiva do kraja)
  if (mobile){
    section.classList.add('tl-static');
    const items = section.querySelectorAll('.tl-item, .timeline__intro');
    if (reduce){ items.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.18, rootMargin:'0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
    return;
  }

  if (typeof gsap === 'undefined') return;

  const ids = ['2023','2024','2025','2026'];
  const topIds = ['2023','2024'];

  if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  const hasSplit = typeof SplitText !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);

  if (reduce){
    gsap.set(line, { width:'98%' });
    ids.forEach(id => { gsap.set(`.jl-${id}`,{scaleY:1}); gsap.set(`.jd-${id}`,{scale:1}); });
    return;
  }
  const slidePercent = mobile ? -57 : -62;

  // Horizontalni klizač vezan za scroll
  gsap.timeline({
    scrollTrigger:{ trigger:section, start:'top top', end: mobile?'82% 50%':'92% bottom', scrub:true },
    defaults:{ ease:'none' }
  }).fromTo(track, { xPercent:0 }, { xPercent:slidePercent });

  // Centralna osa
  gsap.to(line, {
    width: mobile?'65%':'98%', ease:'none',
    scrollTrigger:{ trigger:section, start: mobile?'top 30%':'top 25%', end: mobile?'80% 50%':'92% bottom', scrub:true }
  });

  // Priprema stem/tačka
  ids.forEach(id => {
    const down = !topIds.includes(id);
    gsap.set(`.jl-${id}`, { scaleY:0, transformOrigin: down?'top top':'bottom bottom' });
    gsap.set(`.jd-${id}`, { scale:0 });
  });

  // Split tekst (ako plugin postoji)
  const splits = [];
  function lines(sel){
    if (hasSplit){ const s = new SplitText(sel,{type:'lines',mask:'lines'}); splits.push(s); return s.lines; }
    return [document.querySelector(sel)];
  }

  const positions = mobile
    ? [[24,36],[38,50],[52,64],[66,78]]
    : [[8,30],[22,46],[40,64],[58,84]];

  ids.forEach((id, i) => {
    const [a,b] = positions[i];
    const tl = gsap.timeline({ scrollTrigger:{ trigger:section, start:`${a}% 30%`, end:`${b}% 50%`, scrub:true } });
    tl.to(`.jl-${id}`, { scaleY:1, duration:.4 })
      .to(`.jd-${id}`, { scale:1, duration:.4 }, '<')
      .fromTo(lines(`.title-${id}`), { yPercent:120 }, { yPercent:0, duration:1, stagger:.03, ease:'power2.out' }, '-=.2')
      .fromTo(lines(`.description-${id}`), { yPercent:120 }, { yPercent:0, duration:1, stagger:.02, ease:'power2.out' }, '<');
  });

  window.addEventListener('resize', () => ScrollTrigger.refresh());
}
