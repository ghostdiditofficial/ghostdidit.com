/* GhostDidit — preview build. Small, dependency-free. */

/*
 * TODO (booking): paste the real webhook URL here once the n8n / OpenClaw
 * "GhostDidit Lead" workflow exists on the G15 (or a form service like
 * Formspree). The form POSTs JSON to it. While this is '' the form does not
 * send anything; it shows the fallback note instead.
 */
const BOOKING_ENDPOINT = '';

/* No phone number on the site, ever (Jeff 11/18): the form + Instagram DMs are the only ways in. */
const BOOKING_FALLBACK =
  'Online booking is almost ready. For now, send a DM on Instagram @djghosthtx. Your details were not sent.';

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Cold open: the letterbox bars animate away in CSS (.bar). */

  /* Year in footer */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());

  /* Mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
  }

  /* Scroll reveals */
  var revs = document.querySelectorAll('.rev');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add('in'); });
  }

  /* "On air" label: the Kick stream runs most nights (no fixed day), so the labels stay generic. */
  document.querySelectorAll('.js-onair').forEach(function (el) { el.textContent = 'Most nights'; });
  document.querySelectorAll('.js-onair-long').forEach(function (el) { el.textContent = 'Live most nights'; });

  /* Houston Pokes wheel: draw wire spokes */
  var spokes = document.querySelector('.w-spokes');
  if (spokes) {
    var ns = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 30; i++) {
      var a = (i / 30) * Math.PI * 2;
      var b = a + (i % 2 ? 0.5 : -0.5); /* crossed lacing */
      var l = document.createElementNS(ns, 'line');
      l.setAttribute('x1', (100 + 16 * Math.cos(b)).toFixed(1));
      l.setAttribute('y1', (100 + 16 * Math.sin(b)).toFixed(1));
      l.setAttribute('x2', (100 + 72 * Math.cos(a)).toFixed(1));
      l.setAttribute('y2', (100 + 72 * Math.sin(a)).toFixed(1));
      spokes.appendChild(l);
    }
  }

  /* YouTube click-to-load facade (privacy-enhanced domain, nothing loads before the click) */
  var yt = document.getElementById('yt');
  if (yt) {
    var btn = yt.querySelector('.yt-facade');
    btn.addEventListener('click', function () {
      var list = encodeURIComponent(yt.getAttribute('data-list'));
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/videoseries?list=' + list + '&autoplay=1&rel=0';
      f.title = 'iGrind Film Dept. playlist on YouTube';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      btn.replaceWith(f);
      f.focus();
    });
  }

  /* Booking form */
  var form = document.getElementById('book-form');
  var status = document.getElementById('form-status');
  if (form && status) {
    var say = function (msg, cls) {
      status.textContent = msg;
      status.className = 'form-status' + (cls ? ' ' + cls : '');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* honeypot */
      if (form.website && form.website.value) { say('Thanks!', 'ok'); form.reset(); return; }

      /* validation */
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (el) {
        var bad = !String(el.value || '').trim();
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        say('Please fill in the highlighted fields.', 'err');
        firstBad.focus();
        return;
      }

      if (!BOOKING_ENDPOINT) {
        say(BOOKING_FALLBACK, '');
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'website') data[k] = v; });
      data.source = 'ghostdidit.com';
      data.submitted_at = new Date().toISOString();

      var submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      say('Sending...', '');

      fetch(BOOKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        say('Got it. Ghost will get back to you soon.', 'ok');
        form.reset();
      }).catch(function () {
        say('That did not go through. Please try again in a minute, or send a DM on Instagram @djghosthtx.', 'err');
      }).finally(function () {
        submit.disabled = false;
      });
    });
  }
})();
