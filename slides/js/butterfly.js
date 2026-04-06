/**
 * Animated SVG Blue Morpho butterfly that roams the page and flees from the cursor.
 *
 * Usage:
 *   import { initButterfly } from './butterfly.js';
 *   const bf = initButterfly();          // default options
 *   const bf = initButterfly({ fleeRadius: 150 });
 *   bf.destroy();                        // remove from DOM
 */
function initButterfly(opts = {}) {
  // ── tunables (overridable) ──
  const PERCHED_ONLY = !!opts.perched;
  const FLEE_R       = opts.fleeRadius  || 115;
  const PAD          = opts.pad         || 220;
  const WING_HZ      = opts.wingHz      || 7.2;
  const WING_HZ_REST = opts.wingHzRest  || 0.68;
  const BASE_SCALE   = opts.scale       || 1;

  const OX = 80, OY = 59;

  // ── create DOM ──
  const host = document.createElement('div');
  host.id = 'butterfly-host';
  Object.assign(host.style, {
    position: 'fixed', top: '0', left: '0',
    pointerEvents: 'none', zIndex: '9999',
    willChange: 'transform'
  });

  host.innerHTML = `
<svg id="bf-svg" width="148" height="114" viewBox="0 0 160 120"
     xmlns="http://www.w3.org/2000/svg" overflow="visible"
     style="position:absolute;width:148px;height:114px;top:-57px;left:-74px;
            overflow:visible;will-change:transform;transform-origin:50% 50%;">
  <defs>
    <radialGradient id="bfgLF" cx="36%" cy="36%" r="68%">
      <stop offset="0%"   stop-color="#b3e5fc"/>
      <stop offset="12%"  stop-color="#4dd0e1"/>
      <stop offset="38%"  stop-color="#0097a7"/>
      <stop offset="68%"  stop-color="#006064"/>
      <stop offset="100%" stop-color="#002e33"/>
    </radialGradient>
    <radialGradient id="bfgRF" cx="64%" cy="36%" r="68%">
      <stop offset="0%"   stop-color="#b3e5fc"/>
      <stop offset="12%"  stop-color="#4dd0e1"/>
      <stop offset="38%"  stop-color="#0097a7"/>
      <stop offset="68%"  stop-color="#006064"/>
      <stop offset="100%" stop-color="#002e33"/>
    </radialGradient>
    <radialGradient id="bfgLH" cx="34%" cy="44%" r="64%">
      <stop offset="0%"   stop-color="#80deea"/>
      <stop offset="32%"  stop-color="#00acc1"/>
      <stop offset="72%"  stop-color="#006064"/>
      <stop offset="100%" stop-color="#002e33"/>
    </radialGradient>
    <radialGradient id="bfgRH" cx="66%" cy="44%" r="64%">
      <stop offset="0%"   stop-color="#80deea"/>
      <stop offset="32%"  stop-color="#00acc1"/>
      <stop offset="72%"  stop-color="#006064"/>
      <stop offset="100%" stop-color="#002e33"/>
    </radialGradient>
    <filter id="bfIri" color-interpolation-filters="sRGB" x="-5%" y="-5%" width="110%" height="110%">
      <feColorMatrix id="bf-hm" type="hueRotate" values="0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.04"/>
        <feFuncB type="linear" slope="1.08"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <!-- LEFT WINGS -->
  <g id="bf-lw">
    <path d="M80,65 Q60,68 40,79 Q20,89 18,104 Q22,115 42,111
             Q64,106 75,88 Q80,77 80,70Z"
          fill="url(#bfgLH)" stroke="#001a1a" stroke-width=".8"/>
    <g fill="none" stroke="#004d55" stroke-width=".42" opacity=".65">
      <path d="M80,67 Q63,74 42,85"/>
      <path d="M80,68 Q62,80 42,97"/>
      <path d="M80,69 Q66,88 58,107"/>
      <path d="M54,83 Q54,92 57,103"/>
      <path d="M45,87 Q44,97 45,106"/>
    </g>
    <circle cx="34" cy="95" r="7.2" fill="#001414" opacity=".88"/>
    <circle cx="34" cy="95" r="4.6" fill="#00838f"/>
    <circle cx="34" cy="95" r="2.2" fill="#001414"/>
    <circle cx="32.5" cy="93.5" r="1.0" fill="white" opacity=".5"/>
    <path d="M46,110 Q44,118 49,121" fill="none" stroke="#002e33" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M80,65 Q60,68 40,79 Q20,89 18,104 Q22,115 42,111"
          fill="none" stroke="#001010" stroke-width="3.0" opacity=".72"/>
    <g fill="white" opacity=".85">
      <ellipse cx="22" cy="101" rx="1.6" ry="1.0" transform="rotate(-32 22 101)"/>
      <ellipse cx="28" cy="109" rx="1.5" ry="1.0" transform="rotate(-20 28 109)"/>
      <ellipse cx="39" cy="112" rx="1.4" ry="1.0"/>
    </g>
    <path d="M80,52 Q65,35 47,21 Q29,10 11,15 Q1,25 3,42
             Q6,59 24,66 Q52,73 80,67Z"
          fill="url(#bfgLF)" stroke="#001a1a" stroke-width=".8" filter="url(#bfIri)"/>
    <g fill="none" stroke="#004d55" stroke-width=".44" opacity=".70">
      <path d="M80,60 Q60,48 37,27"/>
      <path d="M80,60 Q58,52 27,43"/>
      <path d="M80,60 Q54,58 17,56"/>
      <path d="M80,62 Q56,65 19,69"/>
      <path d="M52,37 Q50,50 50,63"/>
      <path d="M37,33 Q36,46 34,59"/>
      <path d="M27,45 Q26,54 26,63"/>
    </g>
    <path d="M80,52 Q65,35 47,21 Q29,10 11,15 Q1,25 3,42 Q6,59 24,66"
          fill="none" stroke="#001010" stroke-width="3.5" opacity=".80"/>
    <g fill="white" opacity=".92">
      <ellipse cx="8"  cy="24" rx="2.2" ry="1.4" transform="rotate(-26 8 24)"/>
      <ellipse cx="4"  cy="33" rx="2.0" ry="1.3" transform="rotate(-15 4 33)"/>
      <ellipse cx="4"  cy="41" rx="1.8" ry="1.2"/>
      <ellipse cx="7"  cy="50" rx="1.7" ry="1.1"/>
      <ellipse cx="14" cy="57" rx="1.5" ry="1.0"/>
      <ellipse cx="19" cy="23" rx="1.4" ry="1.0" transform="rotate(-14 19 23)"/>
      <ellipse cx="31" cy="15" rx="1.4" ry="1.0" transform="rotate(-8 31 15)"/>
    </g>
  </g>

  <!-- RIGHT WINGS -->
  <g id="bf-rw">
    <path d="M80,65 Q100,68 120,79 Q140,89 142,104 Q138,115 118,111
             Q96,106 85,88 Q80,77 80,70Z"
          fill="url(#bfgRH)" stroke="#001a1a" stroke-width=".8"/>
    <g fill="none" stroke="#004d55" stroke-width=".42" opacity=".65">
      <path d="M80,67 Q97,74 118,85"/>
      <path d="M80,68 Q98,80 118,97"/>
      <path d="M80,69 Q94,88 102,107"/>
      <path d="M106,83 Q106,92 103,103"/>
      <path d="M115,87 Q116,97 115,106"/>
    </g>
    <circle cx="126" cy="95" r="7.2" fill="#001414" opacity=".88"/>
    <circle cx="126" cy="95" r="4.6" fill="#00838f"/>
    <circle cx="126" cy="95" r="2.2" fill="#001414"/>
    <circle cx="124.5" cy="93.5" r="1.0" fill="white" opacity=".5"/>
    <path d="M114,110 Q116,118 111,121" fill="none" stroke="#002e33" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M80,65 Q100,68 120,79 Q140,89 142,104 Q138,115 118,111"
          fill="none" stroke="#001010" stroke-width="3.0" opacity=".72"/>
    <g fill="white" opacity=".85">
      <ellipse cx="138" cy="101" rx="1.6" ry="1.0" transform="rotate(32 138 101)"/>
      <ellipse cx="132" cy="109" rx="1.5" ry="1.0" transform="rotate(20 132 109)"/>
      <ellipse cx="121" cy="112" rx="1.4" ry="1.0"/>
    </g>
    <path d="M80,52 Q95,35 113,21 Q131,10 149,15 Q159,25 157,42
             Q154,59 136,66 Q108,73 80,67Z"
          fill="url(#bfgRF)" stroke="#001a1a" stroke-width=".8" filter="url(#bfIri)"/>
    <g fill="none" stroke="#004d55" stroke-width=".44" opacity=".70">
      <path d="M80,60 Q100,48 123,27"/>
      <path d="M80,60 Q102,52 133,43"/>
      <path d="M80,60 Q106,58 143,56"/>
      <path d="M80,62 Q104,65 141,69"/>
      <path d="M108,37 Q110,50 110,63"/>
      <path d="M123,33 Q124,46 126,59"/>
      <path d="M133,45 Q134,54 134,63"/>
    </g>
    <path d="M80,52 Q95,35 113,21 Q131,10 149,15 Q159,25 157,42 Q154,59 136,66"
          fill="none" stroke="#001010" stroke-width="3.5" opacity=".80"/>
    <g fill="white" opacity=".92">
      <ellipse cx="152" cy="24" rx="2.2" ry="1.4" transform="rotate(26 152 24)"/>
      <ellipse cx="156" cy="33" rx="2.0" ry="1.3" transform="rotate(15 156 33)"/>
      <ellipse cx="156" cy="41" rx="1.8" ry="1.2"/>
      <ellipse cx="153" cy="50" rx="1.7" ry="1.1"/>
      <ellipse cx="146" cy="57" rx="1.5" ry="1.0"/>
      <ellipse cx="141" cy="23" rx="1.4" ry="1.0" transform="rotate(14 141 23)"/>
      <ellipse cx="129" cy="15" rx="1.4" ry="1.0" transform="rotate(8 129 15)"/>
    </g>
  </g>

  <!-- BODY -->
  <g id="bf-body">
    <path d="M80,63 Q83.5,71 83,84 Q82,94 80,98 Q78,94 77,84 Q76.5,71 80,63Z"
          fill="#111" stroke="#2e2e2e" stroke-width=".4"/>
    <g fill="none" stroke="#3a3a3a" stroke-width=".5" opacity=".45">
      <path d="M77.5,68 Q80,69.5 82.5,68"/>
      <path d="M77,72 Q80,74 83,72"/>
      <path d="M77,76 Q80,78 83,76"/>
      <path d="M77,80 Q80,82 83,80"/>
      <path d="M77.5,84 Q80,85.5 82.5,84"/>
      <path d="M78,88 Q80,89.5 82,88"/>
    </g>
    <ellipse cx="80" cy="60" rx="5.2" ry="6.2" fill="#0e0e0e"/>
    <ellipse cx="79" cy="58" rx="2.1" ry="2.6" fill="#1e1e1e" opacity=".55"/>
    <circle cx="80" cy="52.5" r="5.8" fill="#0c0c0c"/>
    <ellipse cx="76.2" cy="51.3" rx="2.3" ry="2.1" fill="#1a4d70"/>
    <ellipse cx="83.8" cy="51.3" rx="2.3" ry="2.1" fill="#1a4d70"/>
    <circle cx="75.4" cy="50.4" r="1.0" fill="#7ec8e3" opacity=".75"/>
    <circle cx="83.0" cy="50.4" r="1.0" fill="#7ec8e3" opacity=".75"/>
    <circle cx="74.9" cy="49.9" r=".45" fill="white" opacity=".55"/>
    <circle cx="82.5" cy="49.9" r=".45" fill="white" opacity=".55"/>
    <path d="M78.4,47.8 Q71.5,37 65,21" fill="none" stroke="#1c1c1c" stroke-width=".95" stroke-linecap="round"/>
    <path d="M81.6,47.8 Q88.5,37 95,21" fill="none" stroke="#1c1c1c" stroke-width=".95" stroke-linecap="round"/>
    <ellipse cx="64.5" cy="19.5" rx="3.0" ry="2.1" fill="#111" transform="rotate(-24 64.5 19.5)"/>
    <ellipse cx="95.5" cy="19.5" rx="3.0" ry="2.1" fill="#111" transform="rotate(24 95.5 19.5)"/>
  </g>
</svg>`;

  document.body.appendChild(host);

  const svg = host.querySelector('#bf-svg');
  const lw  = host.querySelector('#bf-lw');
  const rw  = host.querySelector('#bf-rw');
  const hm  = host.querySelector('#bf-hm');

  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;

  // ── resolve perched position ──
  function perchedPos() {
    if (opts.anchor) {
      const el = document.querySelector(opts.anchor);
      if (el) {
        const r = el.getBoundingClientRect();
        return [r.left + (opts.anchorOffsetX||0), r.top + (opts.anchorOffsetY||0)];
      }
    }
    return [vw()*(opts.x||0.5), vh()*(opts.y||0.5)];
  }

  // ── state ──
  const pp = PERCHED_ONLY ? perchedPos() : null;
  let px = PERCHED_ONLY ? pp[0] : vw()*0.30;
  let py = PERCHED_ONLY ? pp[1] : vh()*0.28;
  let vx = PERCHED_ONLY ? 0 : 20;
  let vy = PERCHED_ONLY ? 0 : -15;
  let facing = PERCHED_ONLY ? (opts.facing||0) : Math.atan2(vy, vx);

  let mode = PERCHED_ONLY ? 'perched' : 'flying';
  let perchedT = 0, perchedDur = PERCHED_ONLY ? Infinity : 0;

  let wingPh = 0;
  let wasDown = false;
  let beatSide = 1;

  let phase = 'flap';    // flap | glide
  let beatsDone = 0, beatsNeeded = 4;
  let glideLeft = 0;

  let goalX = px + 200, goalY = py + 50;

  let bankAngle = 0;
  let zScale = 1.0;

  let mx = -9999, my = -9999;
  let lastTs = performance.now();
  let rafId = 0;

  // ── helpers ──
  const rnd   = (a,b)   => a + Math.random()*(b-a);
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
  const lerp  = (a,b,t) => a + (b-a)*t;
  function adiff(a,b){ let d=b-a; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; }
  function slerp(c,t,dt,r){ return c + adiff(c,t)*clamp(dt*r,0,1); }

  function safePad() { return Math.min(PAD, Math.min(vw(),vh())*0.22); }

  function pickGoal() {
    const W=vw(), H=vh(), sp=safePad();
    if (Math.random() < 0.62) {
      const els = document.querySelectorAll('h1,h2,p,.card,.bq');
      const cands = [];
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width*(0.2+Math.random()*0.6);
        const cy = r.top  + r.height*(0.15+Math.random()*0.35);
        if (cx>sp && cx<W-sp && cy>sp && cy<H-sp) cands.push([cx,cy]);
      }
      if (cands.length) return cands[Math.floor(Math.random()*cands.length)];
    }
    return [rnd(sp, W-sp), rnd(sp, H-sp)];
  }

  function drawWings(deg) {
    lw.style.transformOrigin = `${OX}px ${OY}px`;
    rw.style.transformOrigin = `${OX}px ${OY}px`;
    lw.style.transform = `perspective(480px) rotateY(${deg}deg)`;
    rw.style.transform = `perspective(480px) rotateY(${-deg}deg)`;
  }

  function startBurst(n) {
    phase = 'flap';
    beatsDone = 0;
    beatsNeeded = n || Math.round(rnd(3,6));
  }

  function takeOff() {
    mode = 'flying';
    vy -= rnd(90,150);
    vx += Math.cos(facing) * rnd(40,80);
    startBurst(3);
    const g = pickGoal(); goalX=g[0]; goalY=g[1];
  }

  function flee() {
    mode = 'fleeing';
    const ang = Math.atan2(py-my, px-mx) + rnd(-0.45,0.45);
    const spd = rnd(200,270);
    vx = Math.cos(ang)*spd;
    vy = Math.sin(ang)*spd - rnd(55,95);
    facing = ang;
    bankAngle = 0;
    startBurst(12);
    const W=vw(), H=vh(), sp=safePad();
    goalX = clamp(px+Math.cos(ang)*rnd(220,320), sp, W-sp);
    goalY = clamp(py+Math.sin(ang)*rnd(220,320), sp, H-sp);
  }

  if (!PERCHED_ONLY) { const g=pickGoal(); goalX=g[0]; goalY=g[1]; startBurst(); }

  // ── main loop ──
  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min((ts-lastTs)/1000, 0.05);
    lastTs = ts;
    const W=vw(), H=vh();
    const md = Math.hypot(px-mx, py-my);

    /* ═══ PERCHED ═══ */
    if (mode === 'perched') {
      perchedT += dt;
      bankAngle = lerp(bankAngle, 0, dt*4);
      vx = lerp(vx, 0, dt*8);
      vy = lerp(vy, 0, dt*8);

      // re-anchor on each frame so resize keeps it in place
      if (PERCHED_ONLY) { const ap = perchedPos(); px = ap[0]; py = ap[1]; }

      wingPh += dt * WING_HZ_REST * Math.PI*2;
      const open = Math.pow((Math.cos(wingPh)+1)*0.5, 0.55);
      drawWings((1-open)*38);
      if (hm) hm.setAttribute('values', (Math.sin(wingPh*0.1)*12).toFixed(1));
      svg.style.filter = `drop-shadow(1px 3px 6px rgba(0,0,0,.18)) brightness(${(0.88+open*0.14).toFixed(3)})`;
      svg.style.transform  = `rotate(${((facing*180/Math.PI)+90).toFixed(2)}deg)`;
      host.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${BASE_SCALE})`;

      if (!PERCHED_ONLY) {
        if (md < FLEE_R) flee();
        else if (perchedT >= perchedDur) takeOff();
      }
      return;
    }

    /* ═══ FLYING / FLEEING ═══ */
    if (mode !== 'fleeing' && md < FLEE_R) flee();

    wingPh += dt * WING_HZ * Math.PI*2;
    const isDown  = Math.sin(wingPh) > 0;
    const open01  = Math.pow((Math.cos(wingPh)+1)*0.5, 0.32);
    const beatNow = isDown && !wasDown;
    wasDown = isDown;

    const goalDist = Math.hypot(goalX-px, goalY-py);
    const isFlee   = mode === 'fleeing';

    const approachT = isFlee ? 1.0 : clamp((goalDist - 40) / 120, 0, 1);

    if (beatNow) {
      if (Math.random() > 0.12) beatSide = -beatSide;

      if (phase === 'flap') {
        beatsDone++;

        const goalAng  = Math.atan2(goalY-py, goalX-px);
        const velAng   = Math.hypot(vx,vy) > 5 ? Math.atan2(vy,vx) : facing;
        const biasFrac = isFlee ? 0.50 : (0.06 + clamp(goalDist/800,0,1)*0.08);
        const impDir   = velAng + adiff(velAng, goalAng) * biasFrac;

        const fwdStr = approachT * (isFlee ? rnd(280,360) : rnd(85,135));
        vx += Math.cos(impDir) * fwdStr;
        vy += Math.sin(impDir) * fwdStr;

        const liftStr = approachT * (isFlee ? rnd(100,160) : rnd(45,80));
        vy -= liftStr;

        const latPerp = facing + Math.PI/2;
        const latStr  = approachT * (isFlee ? rnd(30,65) : rnd(25,110));
        const lateralKick = latStr * beatSide;
        vx += Math.cos(latPerp) * lateralKick;
        vy += Math.sin(latPerp) * lateralKick;

        bankAngle += -beatSide * latStr * 0.30;
        bankAngle  = clamp(bankAngle, -38, 38);

        if (beatsDone >= beatsNeeded) {
          phase     = 'glide';
          glideLeft = isFlee ? rnd(0.08,0.22) : rnd(0.22,0.60);
        }
      }
    }

    if (!isDown && phase === 'flap') {
      const brakeFactor = Math.pow(0.80, dt * WING_HZ);
      vx *= brakeFactor;
      vy *= brakeFactor;
    }

    if (phase === 'glide') {
      vy += 170 * dt;
      const drag = Math.pow(0.58, dt * 4.0);
      vx *= drag;
      vy *= drag;
      glideLeft -= dt;
      if (glideLeft <= 0) startBurst();
    }

    const spd = Math.hypot(vx, vy);
    const safeMax = isFlee ? 420 : 320;
    if (spd > safeMax) { const s=safeMax/spd; vx*=s; vy*=s; }

    px += vx * dt;
    py += vy * dt;

    if (goalDist < 55) {
      if (isFlee) {
        mode = 'flying'; startBurst();
        const g=pickGoal(); goalX=g[0]; goalY=g[1];
      } else if (Math.random() < 0.72) {
        mode = 'perched'; perchedT=0; perchedDur=rnd(2.0,6.5);
        vx=0; vy=0; bankAngle=0;
      } else {
        startBurst();
        const g=pickGoal(); goalX=g[0]; goalY=g[1];
      }
    }

    // edge repulsion
    const EDGE_START = 280;
    const EDGE_K     = 680000;
    function edgeForce(dist) {
      if (dist >= EDGE_START) return 0;
      const d = Math.max(dist, 18);
      return EDGE_K / (d * d);
    }
    vx += edgeForce(px)     * dt;
    vx -= edgeForce(W - px) * dt;
    vy += edgeForce(py)     * dt;
    vy -= edgeForce(H - py) * dt;

    if (px < 30)   px = 30;
    if (px > W-30) px = W-30;
    if (py < 30)   py = 30;
    if (py > H-30) py = H-30;

    const spdNow = Math.hypot(vx, vy);
    if (spdNow > 6) {
      const velAng    = Math.atan2(vy, vx);
      const trackRate = phase === 'glide' ? 1.6 : 0.55;
      facing = slerp(facing, velAng, dt, trackRate);
    }

    bankAngle = lerp(bankAngle, 0, dt * 5.5);
    bankAngle = clamp(bankAngle, -38, 38);

    const targetZ = 1.0 + (py - H*0.5) / (H * 4.5);
    zScale = lerp(zScale, clamp(targetZ, 0.90, 1.12), dt*3);

    drawWings((1-open01)*64);
    if (hm) hm.setAttribute('values', (Math.sin(wingPh*0.1)*16).toFixed(1));
    const br = 0.87 + open01*0.15;
    svg.style.filter = `drop-shadow(1px 3px 6px rgba(0,0,0,.20)) brightness(${br.toFixed(3)})`;

    const rot = (facing*180/Math.PI) + 90;
    const finalScale = zScale * BASE_SCALE;
    svg.style.transform  = `rotate(${rot.toFixed(2)}deg) rotate(${bankAngle.toFixed(2)}deg) scale(${finalScale.toFixed(4)})`;
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

