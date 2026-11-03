// Burung hidup: terbang mengikuti kursor (fisika pegas), kepak sayap, bank/pitch, kedip, mata melirik kursor.
const Bird = (() => {
  const SVG = `<svg viewBox="0 0 120 90" width="96" height="72" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
<defs><radialGradient id="bB" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#60a5fa"/><stop offset=".6" stop-color="#2563eb"/><stop offset="1" stop-color="#1e3a8a"/></radialGradient>
<linearGradient id="bW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e40af"/></linearGradient>
<linearGradient id="bF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7e0"/><stop offset="1" stop-color="#fcd9a0"/></linearGradient></defs>
<g id="bk"><g id="bt" transform="translate(40 50)"><path d="M0 0 L-34 -8 Q-38 -2 -32 2 Z" fill="#1e3a8a"/><path d="M0 2 L-36 6 Q-38 12 -30 12 Z" fill="#1d4ed8"/><path d="M0 -2 L-30 -18 Q-36 -12 -28 -8 Z" fill="#1e40af"/></g>
<g id="lg" stroke="#b45309" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M58 60 L56 73 M56 73 l-4 2 M56 73 l4 2"/><path d="M68 60 L68 73 M68 73 l-4 2 M68 73 l4 2"/></g>
<g id="wf" transform="translate(66 38)" opacity=".7"><g id="wfa"><path d="M0 -3 C-14 -14 -34 -12 -50 -3 C-36 0 -26 6 -12 9Z" fill="#1e3a8a"/></g></g>
<ellipse cx="62" cy="49" rx="27" ry="16" fill="url(#bB)" transform="rotate(-8 62 49)"/><path d="M50 55 Q68 68 90 52 Q86 62 66 66 Q54 64 50 55Z" fill="url(#bF)"/>
<g id="hd"><circle cx="87" cy="38" r="12" fill="url(#bB)"/><path d="M80 44 Q90 52 99 43 Q95 50 88 50Z" fill="url(#bF)"/><path d="M97 35 L113 40 L97 44 Z" fill="#f59e0b"/><path d="M97 40 L112 40.6 L97 44 Z" fill="#b45309"/>
<circle cx="90" cy="35" r="3.6" fill="#fff"/><circle id="pp" cx="91" cy="35" r="2" fill="#0f172a"/><circle cx="91.6" cy="34.2" r=".7" fill="#fff"/><ellipse id="lid" cx="90" cy="35" rx="3.8" ry="0" fill="#1e40af"/></g>
<g id="wn" transform="translate(64 40)"><g id="wna"><path d="M0 -4 C-14 -16 -36 -14 -54 -3 C-38 0 -28 6 -12 10Z" fill="url(#bW)"/><g stroke="#1e3a8a" stroke-width="1.2" fill="none" opacity=".7"><path d="M-20 0 L-52 -3"/><path d="M-18 3 L-46 3"/><path d="M-14 6 L-38 9"/><path d="M-22 -5 L-46 -10"/></g></g></g></g></svg>`;
  let el, S = { x: 0, y: 0, vx: 0, vy: 0, dir: 1, ph: 0 }, m = { x: innerWidth / 2, y: innerHeight / 2, t: 0 }, last = 0, on = true, nb = 2, blink = 0, run = false;
  const q = id => el.querySelector('#' + id), cl = (v, a, b) => Math.max(a, Math.min(b, v)), RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function frame(t) {
    if (!on) { run = false; return; } requestAnimationFrame(frame);
    const dt = Math.min(.033, (t - last) / 1000 || .016); last = t;
    const idle = (t - m.t) > 3000, tx = m.x - 58 + Math.cos(t / 700) * 8, ty = m.y - 50 + Math.sin(t / 560) * 6;
    S.vx += ((tx - S.x) * 16 - S.vx * 5.2) * dt; S.vy += ((ty - S.y) * 16 - S.vy * 5.2) * dt; S.x += S.vx * dt; S.y += S.vy * dt;
    const sp = Math.hypot(S.vx, S.vy); if (Math.abs(S.vx) > 30) S.dir = S.vx > 0 ? 1 : -1; else if (sp < 30) S.dir = m.x > S.x ? 1 : -1;
    const fly = sp > 40, hov = !idle || fly, f = fly ? 9 + Math.min(sp / 90, 5) : hov ? 7 : 1.2; S.ph += dt * f * 6.283;
    const amp = RM ? .4 : 1, s = Math.sin(S.ph), A = hov ? (fly ? 12 + 58 * s : 18 + 48 * s) * amp : -2 + 3 * s;
    q('wna').setAttribute('transform', `rotate(${A}) scale(1 ${hov ? .75 + .25 * Math.abs(Math.cos(S.ph)) : .85})`);
    q('wfa').setAttribute('transform', `rotate(${A * .8 + 8}) scale(1 .8)`);
    q('bt').setAttribute('transform', `translate(40 50) rotate(${cl(S.vy * -.04, -14, 14) + Math.sin(S.ph / 2) * 3})`);
    const bob = hov ? Math.sin(S.ph) * 2.2 : 0, ang = Math.atan2(m.y - S.y, (m.x - S.x) * S.dir);
    q('bk').setAttribute('transform', `translate(0 ${bob})`);
    q('hd').setAttribute('transform', `rotate(${cl(ang * 8, -12, 12)} 80 44)`);
    q('pp').setAttribute('cx', 91 + Math.cos(ang) * 1.1); q('pp').setAttribute('cy', 35 + Math.sin(ang) * 1.1);
    q('lg').setAttribute('opacity', fly ? 0 : hov ? .85 : 1);
    if (t > nb) { blink = t + 130; nb = t + 2200 + Math.random() * 3200; } q('lid').setAttribute('ry', t < blink ? 3.6 : 0);
    el.style.transform = `translate3d(${S.x - 48}px,${S.y - 36}px,0) scale(${S.dir},1) rotate(${cl(S.vy * .05, -24, 24)}deg)`;
  }
  function go() { if (!run && on) { run = true; last = performance.now(); requestAnimationFrame(frame); } }
  function pt(e) { m.x = e.clientX; m.y = e.clientY; m.t = performance.now(); }
  return {
    init() {
      try { on = localStorage.getItem('sa_bird') !== '0'; } catch (e) {}
      el = document.createElement('div'); el.setAttribute('aria-hidden', 'true'); el.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:9999;will-change:transform;filter:drop-shadow(0 6px 5px rgba(15,23,42,.25));' + (on ? '' : 'display:none');
      el.innerHTML = SVG; document.body.appendChild(el); S.x = m.x; S.y = m.y;
      addEventListener('pointermove', pt, { passive: true }); addEventListener('pointerdown', pt, { passive: true });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); }); go();
    },
    toggle() { on = !on; el.style.display = on ? '' : 'none'; try { localStorage.setItem('sa_bird', on ? '1' : '0'); } catch (e) {} go(); return on; }
  };
})();
