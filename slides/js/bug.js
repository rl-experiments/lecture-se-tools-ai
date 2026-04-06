/**
 * Animated SVG bug — beetle, cockroach, or ant.
 *
 * Usage:
 *   initBug()                                         // red beetle, normal speed
 *   initBug({ species:'cockroach', speed:'slow' })    // brown cockroach, sneaky
 *   initBug({ species:'ant', speed:'fast', scale:0.7 })
 *   initBug({ color:'green' })                        // green beetle (SpotBugs!)
 *
 * Returns { destroy() } to remove from DOM.
 */
var _bugId = 0;

function initBug(opts) {
  opts = opts || {};

  var id = ++_bugId;
  var species = opts.species || 'beetle';
  var color   = opts.color   || (species === 'beetle' ? 'red' : '');
  var scale   = opts.scale   || 1;
  var speedPreset = opts.speed || 'normal';

  // ── speed presets ──
  var presets = {
    slow:   { maxRun:110, maxFlee:180, runA:0.8,  runB:2.0, stopA:1.0, stopB:3.5, walkHz:8  },
    normal: { maxRun:210, maxFlee:320, runA:0.35, runB:1.1, stopA:0.4, stopB:1.8, walkHz:14 },
    fast:   { maxRun:340, maxFlee:480, runA:0.2,  runB:0.5, stopA:0.1, stopB:0.4, walkHz:22 }
  };
  var sp = presets[speedPreset] || presets.normal;

  var MAX_SPD_RUN = opts.maxRun  || sp.maxRun;
  var MAX_SPD_FLY = opts.maxFlee || sp.maxFlee;
  var FLEE_R      = opts.fleeRadius || 120;
  var PAD         = opts.pad        || 160;
  var EDGE_K      = 560000;
  var EDGE_START  = 240;
  var WALK_HZ     = sp.walkHz;

  // ── build SVG ──
  var spec = buildSpecies(species, color, id);

  // ── create DOM ──
  var host = document.createElement('div');
  Object.assign(host.style, {
    position:'fixed', top:'0', left:'0',
    pointerEvents:'none', zIndex:'9999',
    willChange:'transform'
  });

  var svgW = spec.svgW, svgH = spec.svgH;
  host.innerHTML =
    '<svg width="'+svgW+'" height="'+svgH+'" viewBox="'+spec.viewBox+'"' +
    ' xmlns="http://www.w3.org/2000/svg" overflow="visible"' +
    ' style="position:absolute;width:'+svgW+'px;height:'+svgH+'px;' +
    'top:-'+(svgH/2)+'px;left:-'+(svgW/2)+'px;overflow:visible;' +
    'will-change:transform;transform-origin:50% 50%;">' +
    spec.defs + spec.legs + spec.body + spec.antennae + '</svg>';

  document.body.appendChild(host);

  var svg  = host.querySelector('svg');
  var antL = host.querySelector('#antL-'+id);
  var antR = host.querySelector('#antR-'+id);

  // ── leg elements ──
  var legEls = {};
  var groupA = [], groupB = [];
  for (var k in spec.hips) {
    var h = spec.hips[k];
    legEls[k] = {
      u: host.querySelector('#l'+k+'_u-'+id),
      l: host.querySelector('#l'+k+'_l-'+id),
      hip: h.hip, side: h.side, row: h.row
    };
    if (h.group === 'A') groupA.push(k);
    else groupB.push(k);
  }

  var vw = function(){ return window.innerWidth; };
  var vh = function(){ return window.innerHeight; };

  // ── state ──
  var px = vw()*(.2+Math.random()*.6), py = vh()*(.2+Math.random()*.6);
  var vx = 0, vy = 0;
  var facing = Math.random()*Math.PI*2;
  var mode = 'running';
  var runTimer = 0, stopTimer = 0;
  var goalX = px+150, goalY = py+60;
  var walkPh = Math.random()*Math.PI*2;
  var antPh = Math.random()*10;
  var mx = -9999, my = -9999;
  var lastTs = performance.now();
  var rafId = 0;

  // ── helpers ──
  var rnd   = function(a,b){ return a+Math.random()*(b-a); };
  var clamp = function(v,a,b){ return Math.max(a,Math.min(b,v)); };
  var lerp  = function(a,b,t){ return a+(b-a)*t; };
  function adiff(a,b){ var d=b-a; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; }
  function slerp(c,t,dt,r){ return c+adiff(c,t)*clamp(dt*r,0,1); }
  function safePad(){ return Math.min(PAD,Math.min(vw(),vh())*0.18); }

  function pickGoal(){
    var W=vw(),H=vh(),s=safePad();
    if(Math.random()<0.58){
      var els=document.querySelectorAll('h1,h2,p,.card,.bq,.ruled');
      var cands=[];
      for(var i=0;i<els.length;i++){
        var r=els[i].getBoundingClientRect();
        var cx=r.left+r.width*(0.1+Math.random()*0.8);
        var cy=r.top+r.height*(0.1+Math.random()*0.8);
        if(cx>s&&cx<W-s&&cy>s&&cy<H-s) cands.push([cx,cy]);
      }
      if(cands.length) return cands[Math.floor(Math.random()*cands.length)];
    }
    return [rnd(s,W-s),rnd(s,H-s)];
  }

  function startRun(){
    mode='running'; runTimer=rnd(sp.runA,sp.runB);
    var g=pickGoal(); goalX=g[0]; goalY=g[1];
  }
  function startStop(){
    mode='stopped'; stopTimer=rnd(sp.stopA,sp.stopB); vx=0; vy=0;
  }
  function startFlee(){
    mode='fleeing';
    var ang=Math.atan2(py-my,px-mx)+rnd(-0.4,0.4);
    facing=ang;
    var s2=rnd(260,340); vx=Math.cos(ang)*s2; vy=Math.sin(ang)*s2;
    runTimer=rnd(0.5,1.0);
    var sp2=safePad(),W=vw(),H=vh();
    goalX=clamp(px+Math.cos(ang)*rnd(200,320),sp2,W-sp2);
    goalY=clamp(py+Math.sin(ang)*rnd(200,320),sp2,H-sp2);
  }

  { var g=pickGoal(); goalX=g[0]; goalY=g[1]; startRun(); }

  // ── leg animation ──
  var BASE_LEAN=[-0.30,0,0.30];
  var UPPER_LEN=spec.upperLen||9, LOWER_LEN=spec.lowerLen||10;

  function setLeg(key,groupPhase){
    var leg=legEls[key]; if(!leg||!leg.u) return;
    var hx=leg.hip[0],hy=leg.hip[1];
    var outDir=leg.side<0?Math.PI:0;
    var lean=BASE_LEAN[leg.row];
    var s2=Math.sin(groupPhase), sweep=s2*0.40*(-leg.side);
    var upperAng=outDir+lean+sweep;
    var kx=hx+Math.cos(upperAng)*UPPER_LEN;
    var ky=hy+Math.sin(upperAng)*UPPER_LEN;
    var liftFrac=clamp((1-Math.abs(s2))*0.35,0,1);
    var lowerAng=upperAng+leg.side*(0.55+liftFrac*0.4);
    var effectiveLen=LOWER_LEN*(1-liftFrac*0.22);
    var fx=kx+Math.cos(lowerAng)*effectiveLen;
    var fy=ky+Math.sin(lowerAng)*effectiveLen;
    leg.u.setAttribute('x2',kx.toFixed(2));
    leg.u.setAttribute('y2',ky.toFixed(2));
    leg.l.setAttribute('x1',kx.toFixed(2));
    leg.l.setAttribute('y1',ky.toFixed(2));
    leg.l.setAttribute('x2',fx.toFixed(2));
    leg.l.setAttribute('y2',fy.toFixed(2));
  }

  function animLegs(spd,dt){
    var n=clamp(spd/MAX_SPD_RUN,0,1);
    walkPh+=dt*WALK_HZ*n*Math.PI*2;
    for(var i=0;i<groupA.length;i++) setLeg(groupA[i],walkPh);
    for(var i=0;i<groupB.length;i++) setLeg(groupB[i],walkPh+Math.PI);
  }

  function animAntennae(dt,isRunning){
    if(!antL||!antR) return;
    antPh+=dt*(isRunning?6.5:2.8);
    var sweepR=isRunning?8:18;
    var bL=sweepR*Math.sin(antPh);
    var bR=-sweepR*Math.sin(antPh+0.6);
    antL.setAttribute('transform','rotate('+bL.toFixed(2)+', '+spec.antPivotL[0]+', '+spec.antPivotL[1]+')');
    antR.setAttribute('transform','rotate('+bR.toFixed(2)+', '+spec.antPivotR[0]+', '+spec.antPivotR[1]+')');
  }

  // ── main loop ──
  function frame(ts){
    rafId=requestAnimationFrame(frame);
    var dt=Math.min((ts-lastTs)/1000,0.05); lastTs=ts;
    var W=vw(),H=vh();
    var md=Math.hypot(px-mx,py-my);

    if(mode!=='fleeing'&&md<FLEE_R) startFlee();
    var isFlee=mode==='fleeing';

    if(mode==='running'||isFlee){
      runTimer-=dt;
      var goalAng=Math.atan2(goalY-py,goalX-px);
      var goalDist=Math.hypot(goalX-px,goalY-py);
      var turnRate=isFlee?9:6;
      facing=slerp(facing,goalAng,dt,turnRate);
      var approachT=isFlee?1:clamp((goalDist-30)/80,0,1);
      var thrustSpd=isFlee?MAX_SPD_FLY:MAX_SPD_RUN;
      var thrust=thrustSpd*approachT;
      vx+=Math.cos(facing)*thrust*dt*14;
      vy+=Math.sin(facing)*thrust*dt*14;
      if(goalDist<40){
        if(isFlee){mode='running';runTimer=rnd(0.3,0.7);var g=pickGoal();goalX=g[0];goalY=g[1];}
        else startStop();
      }
      if(runTimer<=0&&!isFlee) startStop();
    }

    if(mode==='stopped'){
      stopTimer-=dt;
      vx=lerp(vx,0,dt*20); vy=lerp(vy,0,dt*20);
      if(stopTimer<=0) startRun();
    }

    var spd2=Math.hypot(vx,vy);
    var frict=isFlee?0.88:0.82;
    vx*=Math.pow(frict,dt*60); vy*=Math.pow(frict,dt*60);
    var maxSpd=isFlee?MAX_SPD_FLY:MAX_SPD_RUN;
    if(spd2>maxSpd){var s3=maxSpd/spd2;vx*=s3;vy*=s3;}

    px+=vx*dt; py+=vy*dt;

    function ef(d){if(d>=EDGE_START)return 0;var dd=Math.max(d,16);return EDGE_K/(dd*dd);}
    vx+=ef(px)*dt; vx-=ef(W-px)*dt;
    vy+=ef(py)*dt; vy-=ef(H-py)*dt;
    px=clamp(px,28,W-28); py=clamp(py,28,H-28);

    var spdNow=Math.hypot(vx,vy);
    if(spdNow>15){
      var velAng=Math.atan2(vy,vx);
      facing=slerp(facing,velAng,dt,7.0);
    }

    animLegs(spdNow,dt);
    animAntennae(dt,spdNow>20);

    var rot=(facing*180/Math.PI)+90;
    svg.style.transform='rotate('+rot.toFixed(2)+'deg)';
    host.style.transform='translate('+px.toFixed(1)+'px,'+py.toFixed(1)+'px) scale('+scale+')';
  }

  // ── input ──
  function onMouse(e){mx=e.clientX;my=e.clientY;}
  function onTouch(e){mx=e.touches[0].clientX;my=e.touches[0].clientY;}
  function onTouchEnd(){mx=-9999;my=-9999;}
  window.addEventListener('mousemove',onMouse);
  window.addEventListener('touchmove',onTouch,{passive:true});
  window.addEventListener('touchend',onTouchEnd);

  rafId=requestAnimationFrame(frame);

  return {
    destroy: function(){
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove',onMouse);
      window.removeEventListener('touchmove',onTouch);
      window.removeEventListener('touchend',onTouchEnd);
      host.remove();
    }
  };
}

// ═══════════════════════════════════════════
//  SPECIES SVG BUILDERS
// ═══════════════════════════════════════════

function buildSpecies(species, color, id) {
  if (species === 'cockroach') return svgCockroach(id);
  if (species === 'ant')       return svgAnt(id);
  return svgBeetle(color, id);
}

// ── BEETLE (ladybug) ──────────────────────
function svgBeetle(color, id) {
  var colors = {
    red:     { a:'#ff5722', b:'#e53935', c:'#b71c1c', d:'#7f0000', stroke:'#6d0000', spots:'#1a0000' },
    green:   { a:'#81c784', b:'#4caf50', c:'#2e7d32', d:'#1b5e20', stroke:'#1b5e20', spots:'#0a3d0a' },
    stealth: { a:'#666',    b:'#444',    c:'#2a2a2a', d:'#111',    stroke:'#222',     spots:'#000'    }
  };
  var c = colors[color] || colors.red;

  var defs =
    '<defs>' +
    '<radialGradient id="gB-'+id+'" cx="42%" cy="36%" r="60%">' +
      '<stop offset="0%" stop-color="'+c.a+'"/>' +
      '<stop offset="40%" stop-color="'+c.b+'"/>' +
      '<stop offset="85%" stop-color="'+c.c+'"/>' +
      '<stop offset="100%" stop-color="'+c.d+'"/>' +
    '</radialGradient>' +
    '<radialGradient id="gP-'+id+'" cx="50%" cy="35%" r="58%">' +
      '<stop offset="0%" stop-color="#2a2a2a"/>' +
      '<stop offset="100%" stop-color="#0a0a0a"/>' +
    '</radialGradient>' +
    '<filter id="sh-'+id+'" x="-15%" y="-15%" width="130%" height="130%">' +
      '<feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#000" flood-opacity=".30"/>' +
    '</filter>' +
    '</defs>';

  var legs =
    '<g stroke="#1a0a00" stroke-width="1.5" stroke-linecap="round">' +
    '<line id="lFL_u-'+id+'" x1="36" y1="36"/><line id="lFL_l-'+id+'"/>' +
    '<line id="lML_u-'+id+'" x1="31" y1="44"/><line id="lML_l-'+id+'"/>' +
    '<line id="lRL_u-'+id+'" x1="34" y1="54"/><line id="lRL_l-'+id+'"/>' +
    '<line id="lFR_u-'+id+'" x1="54" y1="36"/><line id="lFR_l-'+id+'"/>' +
    '<line id="lMR_u-'+id+'" x1="59" y1="44"/><line id="lMR_l-'+id+'"/>' +
    '<line id="lRR_u-'+id+'" x1="56" y1="54"/><line id="lRR_l-'+id+'"/>' +
    '</g>';

  var body =
    '<g filter="url(#sh-'+id+')">' +
    '<path d="M45,32 C32,32 22,38 20,50 C18,62 26,72 38,74 C41,74.8 43,75 45,75 C47,75 49,74.8 52,74 C64,72 72,62 70,50 C68,38 58,32 45,32Z" fill="url(#gB-'+id+')" stroke="'+c.stroke+'" stroke-width="0.6"/>' +
    '<line x1="45" y1="33" x2="45" y2="74.5" stroke="'+c.stroke+'" stroke-width="0.9" opacity=".7"/>' +
    '<circle cx="33" cy="46" r="4.5" fill="'+c.spots+'" opacity=".88"/>' +
    '<circle cx="33" cy="60" r="3.8" fill="'+c.spots+'" opacity=".82"/>' +
    '<circle cx="38" cy="70" r="2.8" fill="'+c.spots+'" opacity=".72"/>' +
    '<circle cx="57" cy="46" r="4.5" fill="'+c.spots+'" opacity=".88"/>' +
    '<circle cx="57" cy="60" r="3.8" fill="'+c.spots+'" opacity=".82"/>' +
    '<circle cx="52" cy="70" r="2.8" fill="'+c.spots+'" opacity=".72"/>' +
    '<ellipse cx="37" cy="40" rx="7" ry="4" fill="white" opacity=".14" transform="rotate(-18 37 40)"/>' +
    '</g>' +
    // pronotum
    '<path d="M45,20 C35,20 26,24 25,31 C24.5,35 28,33 32,32 C36,31.5 40,31 45,31 C50,31 54,31.5 58,32 C62,33 65.5,35 65,31 C64,24 55,20 45,20Z" fill="url(#gP-'+id+')" stroke="#000" stroke-width="0.5" filter="url(#sh-'+id+')"/>' +
    '<ellipse cx="34" cy="26" rx="3" ry="2" fill="white" opacity=".22" transform="rotate(20 34 26)"/>' +
    '<ellipse cx="56" cy="26" rx="3" ry="2" fill="white" opacity=".22" transform="rotate(-20 56 26)"/>' +
    // head
    '<ellipse cx="45" cy="13" rx="10.5" ry="9" fill="#111" stroke="#000" stroke-width="0.4" filter="url(#sh-'+id+')"/>' +
    '<ellipse cx="38.5" cy="11.5" rx="3.5" ry="3" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>' +
    '<ellipse cx="51.5" cy="11.5" rx="3.5" ry="3" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>' +
    '<circle cx="37.8" cy="10.8" r="1.4" fill="#4caf50" opacity=".7"/>' +
    '<circle cx="50.8" cy="10.8" r="1.4" fill="#4caf50" opacity=".7"/>' +
    '<circle cx="37.2" cy="10.2" r=".55" fill="white" opacity=".55"/>' +
    '<circle cx="50.2" cy="10.2" r=".55" fill="white" opacity=".55"/>' +
    '<path d="M41,18 Q39,20.5 37,21" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>' +
    '<path d="M49,18 Q51,20.5 53,21" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>';

  var antennae =
    '<g id="antL-'+id+'"><path d="M41,6 Q34,0 30,-6" fill="none" stroke="#1a0a00" stroke-width="1.1" stroke-linecap="round"/><circle cx="29.5" cy="-7" r="1.8" fill="#2a1400"/></g>' +
    '<g id="antR-'+id+'"><path d="M49,6 Q56,0 60,-6" fill="none" stroke="#1a0a00" stroke-width="1.1" stroke-linecap="round"/><circle cx="60.5" cy="-7" r="1.8" fill="#2a1400"/></g>';

  return {
    viewBox:'0 0 90 80', svgW:90, svgH:80,
    defs:defs, legs:legs, body:body, antennae:antennae,
    upperLen:9, lowerLen:10,
    antPivotL:[41,6], antPivotR:[49,6],
    hips:{
      FL:{hip:[36,36],side:-1,row:0,group:'A'},
      ML:{hip:[31,44],side:-1,row:1,group:'B'},
      RL:{hip:[34,54],side:-1,row:2,group:'A'},
      FR:{hip:[54,36],side: 1,row:0,group:'B'},
      MR:{hip:[59,44],side: 1,row:1,group:'A'},
      RR:{hip:[56,54],side: 1,row:2,group:'B'}
    }
  };
}

// ── COCKROACH ─────────────────────────────
function svgCockroach(id) {
  var defs =
    '<defs>' +
    '<radialGradient id="gCR-'+id+'" cx="45%" cy="30%" r="65%">' +
      '<stop offset="0%" stop-color="#8d6e4a"/>' +
      '<stop offset="35%" stop-color="#6d4c2a"/>' +
      '<stop offset="70%" stop-color="#4a3018"/>' +
      '<stop offset="100%" stop-color="#2a1a0a"/>' +
    '</radialGradient>' +
    '<filter id="sh-'+id+'" x="-15%" y="-15%" width="130%" height="130%">' +
      '<feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity=".25"/>' +
    '</filter>' +
    '</defs>';

  var legs =
    '<g stroke="#2a1600" stroke-width="1.2" stroke-linecap="round">' +
    '<line id="lFL_u-'+id+'" x1="30" y1="32"/><line id="lFL_l-'+id+'"/>' +
    '<line id="lML_u-'+id+'" x1="27" y1="44"/><line id="lML_l-'+id+'"/>' +
    '<line id="lRL_u-'+id+'" x1="29" y1="56"/><line id="lRL_l-'+id+'"/>' +
    '<line id="lFR_u-'+id+'" x1="50" y1="32"/><line id="lFR_l-'+id+'"/>' +
    '<line id="lMR_u-'+id+'" x1="53" y1="44"/><line id="lMR_l-'+id+'"/>' +
    '<line id="lRR_u-'+id+'" x1="51" y1="56"/><line id="lRR_l-'+id+'"/>' +
    '</g>';

  var body =
    // abdomen (long oval)
    '<g filter="url(#sh-'+id+')">' +
    '<ellipse cx="40" cy="48" rx="16" ry="28" fill="url(#gCR-'+id+')" stroke="#2a1a0a" stroke-width="0.5"/>' +
    // abdomen stripe
    '<line x1="40" y1="22" x2="40" y2="74" stroke="#3a2010" stroke-width="0.7" opacity=".5"/>' +
    // sheen
    '<ellipse cx="35" cy="38" rx="6" ry="12" fill="white" opacity=".08" transform="rotate(-8 35 38)"/>' +
    '</g>' +
    // pronotum (shield)
    '<ellipse cx="40" cy="20" rx="14" ry="10" fill="#5a3a1e" stroke="#3a2010" stroke-width="0.5" filter="url(#sh-'+id+')"/>' +
    '<ellipse cx="37" cy="17" rx="4" ry="3" fill="white" opacity=".10" transform="rotate(-10 37 17)"/>' +
    // head
    '<ellipse cx="40" cy="9" rx="8" ry="6" fill="#2a1a0a" stroke="#1a0a00" stroke-width="0.4" filter="url(#sh-'+id+')"/>' +
    // eyes
    '<circle cx="36" cy="7.5" r="2" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>' +
    '<circle cx="44" cy="7.5" r="2" fill="#1a3a1a" stroke="#000" stroke-width="0.3"/>' +
    '<circle cx="35.5" cy="7" r=".8" fill="#6a6" opacity=".6"/>' +
    '<circle cx="43.5" cy="7" r=".8" fill="#6a6" opacity=".6"/>';

  var antennae =
    '<g id="antL-'+id+'"><path d="M36,4 Q28,-6 18,-18" fill="none" stroke="#2a1600" stroke-width="0.9" stroke-linecap="round"/><circle cx="17.5" cy="-19" r="1.2" fill="#2a1400"/></g>' +
    '<g id="antR-'+id+'"><path d="M44,4 Q52,-6 62,-18" fill="none" stroke="#2a1600" stroke-width="0.9" stroke-linecap="round"/><circle cx="62.5" cy="-19" r="1.2" fill="#2a1400"/></g>';

  return {
    viewBox:'0 0 80 80', svgW:80, svgH:80,
    defs:defs, legs:legs, body:body, antennae:antennae,
    upperLen:10, lowerLen:12,
    antPivotL:[36,4], antPivotR:[44,4],
    hips:{
      FL:{hip:[30,32],side:-1,row:0,group:'A'},
      ML:{hip:[27,44],side:-1,row:1,group:'B'},
      RL:{hip:[29,56],side:-1,row:2,group:'A'},
      FR:{hip:[50,32],side: 1,row:0,group:'B'},
      MR:{hip:[53,44],side: 1,row:1,group:'A'},
      RR:{hip:[51,56],side: 1,row:2,group:'B'}
    }
  };
}

// ── ANT ───────────────────────────────────
function svgAnt(id) {
  var defs =
    '<defs>' +
    '<filter id="sh-'+id+'" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000" flood-opacity=".22"/>' +
    '</filter>' +
    '</defs>';

  var legs =
    '<g stroke="#1a0a00" stroke-width="1.0" stroke-linecap="round">' +
    '<line id="lFL_u-'+id+'" x1="22" y1="26"/><line id="lFL_l-'+id+'"/>' +
    '<line id="lML_u-'+id+'" x1="20" y1="32"/><line id="lML_l-'+id+'"/>' +
    '<line id="lRL_u-'+id+'" x1="21" y1="38"/><line id="lRL_l-'+id+'"/>' +
    '<line id="lFR_u-'+id+'" x1="38" y1="26"/><line id="lFR_l-'+id+'"/>' +
    '<line id="lMR_u-'+id+'" x1="40" y1="32"/><line id="lMR_l-'+id+'"/>' +
    '<line id="lRR_u-'+id+'" x1="39" y1="38"/><line id="lRR_l-'+id+'"/>' +
    '</g>';

  var body =
    // gaster (abdomen — large rear)
    '<g filter="url(#sh-'+id+')">' +
    '<ellipse cx="30" cy="48" rx="9" ry="11" fill="#1a1a1a" stroke="#0a0a0a" stroke-width="0.4"/>' +
    '<ellipse cx="28" cy="44" rx="3" ry="4" fill="white" opacity=".06"/>' +
    '</g>' +
    // petiole (thin waist)
    '<ellipse cx="30" cy="36" rx="3" ry="3.5" fill="#222" stroke="#111" stroke-width="0.3"/>' +
    // thorax
    '<ellipse cx="30" cy="28" rx="7" ry="7" fill="#1e1e1e" stroke="#0a0a0a" stroke-width="0.4" filter="url(#sh-'+id+')"/>' +
    // head
    '<circle cx="30" cy="16" r="6.5" fill="#111" stroke="#000" stroke-width="0.3" filter="url(#sh-'+id+')"/>' +
    // eyes
    '<circle cx="27" cy="14.5" r="1.8" fill="#2a2a2a" stroke="#000" stroke-width="0.2"/>' +
    '<circle cx="33" cy="14.5" r="1.8" fill="#2a2a2a" stroke="#000" stroke-width="0.2"/>' +
    '<circle cx="26.6" cy="14" r=".6" fill="#555" opacity=".6"/>' +
    '<circle cx="32.6" cy="14" r=".6" fill="#555" opacity=".6"/>' +
    // mandibles
    '<path d="M28,20 Q26,22 24,22.5" fill="none" stroke="#222" stroke-width="1" stroke-linecap="round"/>' +
    '<path d="M32,20 Q34,22 36,22.5" fill="none" stroke="#222" stroke-width="1" stroke-linecap="round"/>';

  var antennae =
    // elbowed antennae (geniculate) — scape then funicle
    '<g id="antL-'+id+'">' +
      '<path d="M28,11 L22,5" fill="none" stroke="#1a0a00" stroke-width="0.9" stroke-linecap="round"/>' +
      '<path d="M22,5 Q18,1 15,-3" fill="none" stroke="#1a0a00" stroke-width="0.7" stroke-linecap="round"/>' +
      '<circle cx="14.5" cy="-3.5" r="1.2" fill="#1a0a00"/>' +
    '</g>' +
    '<g id="antR-'+id+'">' +
      '<path d="M32,11 L38,5" fill="none" stroke="#1a0a00" stroke-width="0.9" stroke-linecap="round"/>' +
      '<path d="M38,5 Q42,1 45,-3" fill="none" stroke="#1a0a00" stroke-width="0.7" stroke-linecap="round"/>' +
      '<circle cx="45.5" cy="-3.5" r="1.2" fill="#1a0a00"/>' +
    '</g>';

  return {
    viewBox:'0 0 60 64', svgW:60, svgH:64,
    defs:defs, legs:legs, body:body, antennae:antennae,
    upperLen:7, lowerLen:8,
    antPivotL:[28,11], antPivotR:[32,11],
    hips:{
      FL:{hip:[22,26],side:-1,row:0,group:'A'},
      ML:{hip:[20,32],side:-1,row:1,group:'B'},
      RL:{hip:[21,38],side:-1,row:2,group:'A'},
      FR:{hip:[38,26],side: 1,row:0,group:'B'},
      MR:{hip:[40,32],side: 1,row:1,group:'A'},
      RR:{hip:[39,38],side: 1,row:2,group:'B'}
    }
  };
}
