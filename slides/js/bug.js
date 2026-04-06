/**
 * Animated SVG beetle that roams the page and flees from the cursor.
 *
 * Usage:
 *   import { initBug } from './bug.js';
 *   initBug();                       // default options
 *   initBug({ fleeRadius: 150 });    // override tunables
 *   const bug = initBug();
 *   bug.destroy();                   // remove bug from DOM
 */
export function initBug(opts = {}) {
  'use strict';

  // ── tunables (overridable) ──
  const FLEE_R      = opts.fleeRadius  || 120;
  const PAD         = opts.pad         || 160;
  const MAX_SPD_RUN = opts.maxRun      || 210;
  const MAX_SPD_FLY = opts.maxFlee     || 320;
  const EDGE_K      = opts.edgeK       || 560000;
  const EDGE_START  = opts.edgeStart   || 240;

  // ── create DOM ──
  const host = document.createElement('div');
  host.id = 'bug-host';
  Object.assign(host.style, {
    position: 'fixed', top: '0', left: '0',
    pointerEvents: 'none', zIndex: '9999',
    willChange: 'transform'
  });

  host.innerHTML = `
<svg id="bug-svg" width="90" height="80" viewBox="0 0 90 80"
     xmlns="http://www.w3.org/2000/svg" overflow="visible"
     style="position:absolute;width:90px;height:80px;top:-40px;left:-45px;
            overflow:visible;will-change:transform;transform-origin:50% 50%;">
  <defs>
    <radialGradient id="bgBody" cx="42%" cy="36%" r="60%">
      <stop offset="0%"   stop-color="#ff5722"/>
      <stop offset="40%"  stop-color="#e53935"/>
      <stop offset="85%"  stop-color="#b71c1c"/>
      <stop offset="100%" stop-color="#7f0000"/>
    </radialGradient>
    <radialGradient id="bgPro" cx="50%" cy="35%" r="58%">
      <stop offset="0%"   stop-color="#2a2a2a"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
    <filter id="bgShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#000" flood-opacity=".30"/>
    </filter>
  </defs>

  <!-- legs -->
  <g id="bug-legs" stroke="#1a0a00" stroke-width="1.5" stroke-linecap="round">
    <line id="blFL_u" x1="36" y1="36"/>
    <line id="blML_u" x1="31" y1="44"/>
    <line id="blRL_u" x1="34" y1="54"/>
    <line id="blFR_u" x1="54" y1="36"/>
    <line id="blMR_u" x1="59" y1="44"/>
    <line id="blRR_u" x1="56" y1="54"/>
    <line id="blFL_l"/><line id="blML_l"/><line id="blRL_l"/>
    <line id="blFR_l"/><line id="blMR_l"/><line id="blRR_l"/>
  </g>

  <!-- elytra -->
  <g filter="url(#bgShadow)">
    <path d="M45,32 C32,32 22,38 20,50 C18,62 26,72 38,74
             C41,74.8 43,75 45,75 C47,75 49,74.8 52,74
             C64,72 72,62 70,50 C68,38 58,32 45,32 Z"
          fill="url(#bgBody)" stroke="#6d0000" stroke-width="0.6"/>
    <line x1="45" y1="33" x2="45" y2="74.5"
          stroke="#6d0000" stroke-width="0.9" opacity=".7"/>
    <circle cx="33" cy="46" r="4.5" fill="#1a0000" opacity=".88"/>
    <circle cx="33" cy="60" r="3.8" fill="#1a0000" opacity=".82"/>
    <circle cx="38" cy="70" r="2.8" fill="#1a0000" opacity=".72"/>
    <circle cx="57" cy="46" r="4.5" fill="#1a0000" opacity=".88"/>
    <circle cx="57" cy="60" r="3.8" fill="#1a0000" opacity=".82"/>
    <circle cx="52" cy="70" r="2.8" fill="#1a0000" opacity=".72"/>
    <ellipse cx="37" cy="40" rx="7" ry="4"
             fill="white" opacity=".14" transform="rotate(-18 37 40)"/>
  </g>

  <!-- pronotum -->
  <path d="M45,20 C35,20 26,24 25,31 C24.5,35 28,33 32,32
           C36,31.5 40,31 45,31 C50,31 54,31.5 58,32
           C62,33 65.5,35 65,31 C64,24 55,20 45,20 Z"
        fill="url(#bgPro)" stroke="#000" stroke-width="0.5" filter="url(#bgShadow)"/>
  <ellipse cx="34" cy="26" rx="3" ry="2" fill="white" opacity=".22" transform="rotate(20 34 26)"/>
  <ellipse cx="56" cy="26" rx="3" ry="2" fill="white" opacity=".22" transform="rotate(-20 56 26)"/>

  <!-- head -->
  <ellipse cx="45" cy="13" rx="10.5" ry="9"
           fill="#111" stroke="#000" stroke-width="0.4" filter="url(#bgShadow)"/>
  <ellipse cx="38.5" cy="11.5" rx="3.5" ry="3" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>
  <ellipse cx="51.5" cy="11.5" rx="3.5" ry="3" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>
  <circle cx="37.8" cy="10.8" r="1.4" fill="#4caf50" opacity=".7"/>
  <circle cx="50.8" cy="10.8" r="1.4" fill="#4caf50" opacity=".7"/>
  <circle cx="37.2" cy="10.2" r=".55" fill="white" opacity=".55"/>
  <circle cx="50.2" cy="10.2" r=".55" fill="white" opacity=".55"/>
  <path d="M41,18 Q39,20.5 37,21" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M49,18 Q51,20.5 53,21" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>

  <!-- antennae -->
  <g id="bug-antL">
    <path d="M41,6 Q34,0 30,-6" fill="none" stroke="#1a0a00" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="29.5" cy="-7" r="1.8" fill="#2a1400"/>
  </g>
  <g id="bug-antR">
    <path d="M49,6 Q56,0 60,-6" fill="none" stroke="#1a0a00" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="60.5" cy="-7" r="1.8" fill="#2a1400"/>
  </g>
</svg>`;

  document.body.appendChild(host);

  const svg  = host.querySelector('#bug-svg');
  const antL = host.querySelector('#bug-antL');
  const antR = host.querySelector('#bug-antR');

  // ── leg elements ──
  const legEls = {
    FL: { u: host.querySelector('#blFL_u'), l: host.querySelector('#blFL_l'), hip:[36,36], side:-1, row:0 },
    ML: { u: host.querySelector('#blML_u'), l: host.querySelector('#blML_l'), hip:[31,44], side:-1, row:1 },
    RL: { u: host.querySelector('#blRL_u'), l: host.querySelector('#blRL_l'), hip:[34,54], side:-1, row:2 },
    FR: { u: host.querySelector('#blFR_u'), l: host.querySelector('#blFR_l'), hip:[54,36], side: 1, row:0 },
    MR: { u: host.querySelector('#blMR_u'), l: host.querySelector('#blMR_l'), hip:[59,44], side: 1, row:1 },
    RR: { u: host.querySelector('#blRR_u'), l: host.querySelector('#blRR_l'), hip:[56,54], side: 1, row:2 },
  };
  const groupA = ['FL','MR','RL'];
  const groupB = ['FR','ML','RR'];

  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;

  // ── state ──
  let px = vw()*0.35, py = vh()*0.40;
  let vx = 0, vy = 0;
  let facing = 0;
  let mode = 'running';
  let runTimer = 0, stopTimer = 0;
  let goalX = px + 150, goalY = py + 60;
  let walkPh = 0;
  let antPh = 0;
  let mx = -9999, my = -9999;
  let lastTs = performance.now();
  let rafId = 0;

  // ── helpers ──
  const rnd   = (a,b)   => a + Math.random()*(b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
  const lerp  = (a,b,t) => a + (b-a)*t;
  function adiff(a,b){ let d=b-a; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; }
  function slerp(c,t,dt,r){ return c + adiff(c,t)*clamp(dt*r,0,1); }
  function safePad() { return Math.min(PAD, Math.min(vw(),vh())*0.18); }

  function pickGoal() {
    const W=vw(), H=vh(), sp=safePad();
    if (Math.random() < 0.58) {
      const els = document.querySelectorAll('h1,h2,p,.card,.bq,.ruled');
      const cands = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width*(0.1+Math.random()*0.8);
        const cy = r.top  + r.height*(0.1+Math.random()*0.8);
        if (cx>sp && cx<W-sp && cy>sp && cy<H-sp) cands.push([cx,cy]);
      }
      if (cands.length) return cands[Math.floor(Math.random()*cands.length)];
    }
    return [rnd(sp, W-sp), rnd(sp, H-sp)];
  }

  function startRun() {
    mode = 'running';
    runTimer = rnd(0.35, 1.1);
    const g = pickGoal(); goalX=g[0]; goalY=g[1];
  }

  function startStop() {
    mode = 'stopped';
    stopTimer = rnd(0.4, 1.8);
    vx = 0; vy = 0;
  }

  function startFlee() {
    mode = 'fleeing';
    const ang = Math.atan2(py-my, px-mx) + rnd(-0.4,0.4);
    facing = ang;
    const spd = rnd(260, 340);
    vx = Math.cos(ang)*spd;
    vy = Math.sin(ang)*spd;
    runTimer = rnd(0.5, 1.0);
    const sp=safePad(), W=vw(), H=vh();
    goalX = clamp(px+Math.cos(ang)*rnd(200,320), sp, W-sp);
    goalY = clamp(py+Math.sin(ang)*rnd(200,320), sp, H-sp);
  }

  // ── leg animation ──
  const WALK_HZ = 14;
  const BASE_LEAN = [-0.30, 0, 0.30];
  const UPPER_LEN = 9, LOWER_LEN = 10;

  function setLeg(key, groupPhase) {
    const leg = legEls[key];
    const [hx, hy] = leg.hip;
    const outDir = leg.side < 0 ? -Math.PI/2 : Math.PI/2;
    const lean = BASE_LEAN[leg.row];
    const s = Math.sin(groupPhase);
    const sweep = s * 0.40;
    const upperAng = outDir + lean + sweep;
    const kx = hx + Math.cos(upperAng) * UPPER_LEN;
    const ky = hy + Math.sin(upperAng) * UPPER_LEN;
    const liftFrac = clamp((1 - Math.abs(s)) * 0.35, 0, 1);
    const lowerAng = upperAng + leg.side * (0.55 + liftFrac * 0.4);
    const effectiveLen = LOWER_LEN * (1 - liftFrac * 0.22);
    const fx = kx + Math.cos(lowerAng) * effectiveLen;
    const fy = ky + Math.sin(lowerAng) * effectiveLen;

    leg.u.setAttribute('x2', kx.toFixed(2));
    leg.u.setAttribute('y2', ky.toFixed(2));
    leg.l.setAttribute('x1', kx.toFixed(2));
    leg.l.setAttribute('y1', ky.toFixed(2));
    leg.l.setAttribute('x2', fx.toFixed(2));
    leg.l.setAttribute('y2', fy.toFixed(2));
  }

  function animLegs(spd, dt) {
    const normalised = clamp(spd / MAX_SPD_RUN, 0, 1);
    walkPh += dt * WALK_HZ * normalised * Math.PI * 2;
    for (const k of groupA) setLeg(k, walkPh);
    for (const k of groupB) setLeg(k, walkPh + Math.PI);
  }

  function animAntennae(dt, isRunning) {
    antPh += dt * (isRunning ? 6.5 : 2.8);
    const sweepR = isRunning ? 8 : 18;
    const baseL =  sweepR * Math.sin(antPh);
    const baseR = -sweepR * Math.sin(antPh + 0.6);
    antL.setAttribute('transform', `rotate(${baseL.toFixed(2)}, 41, 6)`);
    antR.setAttribute('transform', `rotate(${baseR.toFixed(2)}, 49, 6)`);
  }

  // ── main loop ──
  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min((ts-lastTs)/1000, 0.05);
    lastTs = ts;
    const W=vw(), H=vh();
    const md = Math.hypot(px-mx, py-my);

    if (mode !== 'fleeing' && md < FLEE_R) startFlee();

    const isFlee = mode === 'fleeing';

    if (mode === 'running' || isFlee) {
      runTimer -= dt;
      const goalAng = Math.atan2(goalY-py, goalX-px);
      const goalDist = Math.hypot(goalX-px, goalY-py);
      const turnRate = isFlee ? 9 : 6;
      facing = slerp(facing, goalAng, dt, turnRate);
      const approachT = isFlee ? 1 : clamp((goalDist-30)/80, 0, 1);
      const thrustSpd = isFlee ? MAX_SPD_FLY : MAX_SPD_RUN;
      const thrust    = thrustSpd * approachT;
      vx += Math.cos(facing) * thrust * dt * 14;
      vy += Math.sin(facing) * thrust * dt * 14;

      if (goalDist < 40) {
        if (isFlee) { mode='running'; runTimer=rnd(0.3,0.7); const g=pickGoal(); goalX=g[0]; goalY=g[1]; }
        else        { startStop(); }
      }
      if (runTimer <= 0 && !isFlee) startStop();
    }

    if (mode === 'stopped') {
      stopTimer -= dt;
      vx = lerp(vx, 0, dt*20);
      vy = lerp(vy, 0, dt*20);
      if (stopTimer <= 0) startRun();
    }

    const spd = Math.hypot(vx, vy);
    const frict = isFlee ? 0.88 : 0.82;
    vx *= Math.pow(frict, dt*60);
    vy *= Math.pow(frict, dt*60);

    const maxSpd = isFlee ? MAX_SPD_FLY : MAX_SPD_RUN;
    if (spd > maxSpd) { const s=maxSpd/spd; vx*=s; vy*=s; }

    px += vx*dt;
    py += vy*dt;

    function ef(d){ if(d>=EDGE_START) return 0; const dd=Math.max(d,16); return EDGE_K/(dd*dd); }
    vx += ef(px)   * dt;
    vx -= ef(W-px) * dt;
    vy += ef(py)   * dt;
    vy -= ef(H-py) * dt;
    px = clamp(px, 28, W-28);
    py = clamp(py, 28, H-28);

    const spdNow = Math.hypot(vx, vy);
    if (spdNow > 15) {
      const velAng = Math.atan2(vy, vx);
      facing = slerp(facing, velAng, dt, 7.0);
    }

    animLegs(spdNow, dt);
    animAntennae(dt, spdNow > 20);

    const rot = (facing * 180/Math.PI) + 90;
    svg.style.transform  = `rotate(${rot.toFixed(2)}deg)`;
    host.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`;
  }

  // ── input listeners ──
  function onMouse(e) { mx=e.clientX; my=e.clientY; }
  function onTouch(e) { mx=e.touches[0].clientX; my=e.touches[0].clientY; }
  function onTouchEnd(){ mx=-9999; my=-9999; }

  window.addEventListener('mousemove', onMouse);
  window.addEventListener('touchmove', onTouch, {passive:true});
  window.addEventListener('touchend',  onTouchEnd);

  // ── start ──
  { const g=pickGoal(); goalX=g[0]; goalY=g[1]; startRun(); }
  rafId = requestAnimationFrame(frame);

  // ── public API ──
  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend',  onTouchEnd);
      host.remove();
    }
  };
}
