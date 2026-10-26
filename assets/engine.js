// CIRCUIT BENT — real render engine for the marketing site.
// This is the actual shader and damage simulation from reference/shader.glsl,
// adapted from reference/circuit-bend-lab.html so the site's live fragments
// are genuine renders, not a mockup standing in for the product.

const VS = `attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
const FS = `precision highp float;varying vec2 vUv;uniform sampler2D uTex;uniform vec2 uRes;
uniform float uTime,uFrame,uSplit,uMix;
uniform float uScreen,uScan;
uniform float uMirror,uGrid;
uniform vec4 uPip;
uniform float uStripe,uStripeF,uStripeBend,uWob,uMelt,uEnergy;
uniform float uMode,uNeon,uHue;
uniform float uFull,uLineP,uLineAmt,uLineT,uBlockY,uBlockH,uBlockShift,uRoll,uSyncBar,uStreak,uCrush;
uniform vec3 uR0,uR1,uR2;
uniform vec4 uSeamY,uSeamShift;
uniform float uBandwidth,uDot,uGrain;
float h1(float n){return fract(sin(n*12.9898)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float vn(float x){float i=floor(x);float f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
float vn2(vec2 x){vec2 i=floor(x);vec2 f=fract(x);f=f*f*(3.-2.*f);float a=h2(i);float b=h2(i+vec2(1.,0.));float c=h2(i+vec2(0.,1.));float d=h2(i+vec2(1.,1.));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 x){return (vn2(x)-.5)*1.1+(vn2(x*2.3+7.1)-.5)*.6+(vn2(x*5.1+3.7)-.5)*.3;}
vec3 tex(vec2 q){q=clamp(q,0.,1.);return texture2D(uTex,vec2(q.x,1.-q.y)).rgb;}
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
float region(vec3 r,float y){if(r.z<=0.||r.y<=.001)return 0.;float d=abs(y-r.x);return r.z*(1.-clamp((d-r.y*.55)/(r.y*.45),0.,1.));}
vec3 pal(float t){return .5+.5*cos(6.2832*(vec3(1.)*t+vec3(uHue,uHue+.33,uHue+.67)));}
vec3 grade(vec3 c,float m,float Yw){
  float Y=clamp(luma(c),0.,1.);vec3 C=c-Y;
  if(m<.5)return c;
  if(m<1.5){return mix(vec3(.015,.012,.03),vec3(.92,.89,1.),pow(Y,1.05))+C*.12;}
  if(m<2.5){float y=pow(Y,.55);vec3 o=vec3(y)+C*2.;float red=max(0.,c.r-max(c.g,c.b));o+=vec3(red*.7,-red*.15,red*.25);o+=vec3(-.04,.05,.01)*(1.-y);return o;}
  if(m<3.5){float y=.26+.55*pow(Y,.65);return vec3(y)+C*.07;}
  if(m<4.5){float y=.08+.84*pow(1.-Y,.9);return mix(vec3(.02,.015,.03),vec3(.93,.9,1.),y)-C*.15;}
  if(m<5.5){float g=clamp(pow(Y,.5)*1.25+max(Yw-.55,0.)*1.2,0.,1.);return vec3(.18,1.,.42)*g+vec3(.02,.05,.03);}
  float y=.06+.88*pow(Y,.85);vec3 o=vec3(y)+C*1.15;o.r+=max(0.,c.r-max(c.g,c.b))*.35;return o;
}
void main(){
  vec2 p=vec2(vUv.x,1.-vUv.y);
  if(uSplit>.5&&p.x<.5){vec3 s=tex(p);if(abs(p.x-.5)<1.5/uRes.x)s=vec3(1.);gl_FragColor=vec4(s,1.);return;}
  vec2 sp=p;
  vec2 q=sp;
  if((uMirror>.5&&uMirror<1.5)||uMirror>2.5)q.x=q.x<.5?q.x:1.-q.x;
  if(uMirror>1.5)q.y=q.y<.5?q.y:1.-q.y;
  if(uGrid>1.5)q=fract(q*uGrid);
  float pipB=0.;
  if(uPip.z>0.){vec2 r=(sp-uPip.xy)/uPip.zw;
    if(r.x>=0.&&r.x<=1.&&r.y>=0.&&r.y<=1.){q=r;vec2 b=min(r,1.-r)*uPip.zw;pipB=1.-step(.006,min(b.x,b.y));}}
  float L=480.;float yR=fract(q.y+uRoll);float line=floor(yR*L);
  float seamR=fract(1.-uRoll);float dR=abs(sp.y-seamR);dR=min(dR,1.-dR);float bar=uSyncBar>0.?1.-step(uSyncBar,dR):0.;
  float m=clamp(uFull+region(uR0,sp.y)+region(uR1,sp.y)+region(uR2,sp.y),0.,1.);
  float tw=uTime+2.5*vn(uTime*.35)+1.2*vn(uTime*1.1+4.);
  float env=vn2(vec2(yR*5.+3.,tw*.45));env=.12+1.1*env*env*env;
  float n=fbm(vec2(line*.03,tw*1.9));
  float tq=floor(tw*(1.5+2.*vn(uTime*.5)));
  float nb=floor(mix(3.,12.,h1(tq*1.7)));float jb=floor(yR*nb);
  float jump=(h1(jb*7.1+tq*3.3)-.5)*.07*step(.82,h1(jb*3.3+tq*1.9));
  float wob=uWob*(n*.024*env+jump)+uWob*m*.035*fbm(vec2(yR*18.,tw*3.));
  float shift=0.;float sepL=0.;float smear=0.;
  for(int i=0;i<4;i++){
    float sy=uSeamY[i];
    if(sy>=0.){float act=step(.001,abs(uSeamShift[i]));
      if(yR>sy)shift+=uSeamShift[i];
      float dd=yR-sy;
      sepL=max(sepL,(1.-step(1.5/L,abs(dd)))*act);
      smear=max(smear,step(0.,dd)*(1.-step(4./L,dd))*act);}
  }
  float lr=h1(line*1.31+uLineT);
  float ls=step(lr,uLineP*(.25+.75*m))*(h1(line*7.13+uLineT*1.7)-.5)*2.*uLineAmt;
  float blockS=step(uBlockY,yR)*step(yR,uBlockY+uBlockH)*uBlockShift;
  float xb=q.x+wob+shift+ls+blockS;
  float y0=luma(tex(vec2(xb,yR)));
  xb+=uMelt*(y0-.5)*.08*(1.+uEnergy);
  vec2 s2=vec2(xb,yR);
  if(smear>.5)s2.x=min(s2.x,.15+.7*h1(line+uLineT));
  if(abs(ls)>0.&&h1(line*3.7+uLineT)>.6)s2.x=min(s2.x,.3+.6*h1(line+uLineT*3.));
  float bw=uBandwidth*.0035+.0004;
  vec3 cN=tex(s2)*.5+tex(s2+vec2(bw,0.))*.25+tex(s2-vec2(bw,0.))*.25;
  vec3 cW=vec3(0.);float ws=0.;
  for(int i=-4;i<=4;i++){float fi=float(i);float w=exp(-fi*fi/8.);cW+=tex(s2+vec2(fi*bw*2.2,0.))*w;ws+=w;}
  cW/=ws;
  vec3 c=vec3(luma(cN))+(cW-luma(cW));
  float Y=luma(c);
  float sF=uStripeF*(1.+.3*fbm(vec2(yR*1.5+9.,tw*.15)));
  float ph=6.2832*yR*sF+uStripeBend*Y*6.2832+fbm(vec2(s2.x*4.+yR*2.,tw*.5))*3.2*(.3+uWob)+tw*.8;
  float v=Y+.42*sin(ph);float sfw=.025+uBandwidth*.05;
  float stv=smoothstep(.5-sfw,.5+sfw,v);
  c=mix(c,vec3(stv)+(c-Y)*.5,uStripe);
  float st=0.;
  if(uStreak>0.&&m>.01){
    for(int i=1;i<=8;i++){float fi=float(i);float l=luma(tex(s2-vec2(fi*.006,0.)));st=max(st,smoothstep(.55,.85,l)*(1.-fi/9.));}
    float dashLen=40.+80.*h1(line*.17+uLineT);
    st*=step(.45,h1(line*.913+floor(s2.x*dashLen+h1(line)*7.)*1.37+uLineT*.1))*uStreak*m;
  }
  vec3 g=grade(c,uMode,luma(cW));
  if(uNeon>0.){float Yg=luma(g);g=mix(g,pal(Yg)*smoothstep(.08,.35,Yg)*1.15,uNeon);}
  g+=vec3(st)*1.1;
  g+=(h1(floor(sp.y*6.)+floor(uLineT*.25))-.5)*.4*m*uEnergy;
  float dc=mod(gl_FragCoord.x+gl_FragCoord.y+uFrame,2.)*2.-1.;
  float dotA=uDot*(.5+m);
  g+=dc*dotA*.05*(.3+luma(g));
  g*=1.-dotA*.08*step(.5,mod(line,2.));
  float gr=uGrain*(uMode>4.5&&uMode<5.5?.22:.12)*(.6+m*.8);
  g+=(h2(gl_FragCoord.xy+fract(uTime*7.31)*91.)-.5)*gr;
  float ck=uCrush*m;
  if(ck<0.){float k=-ck;g=max(g-k*.8,0.)*(1.+k*1.2);}else{g=1.-(1.-g)*(1.-ck*.85);}
  g*=1.-sepL*.9;g*=1.-pipB;
  g=mix(g,vec3(.02),bar);
  if(uScreen>.5){
    float sl=.5+.5*cos(sp.y*240.*6.2832);
    g*=1.-uScan*.45*(1.-sl);
    float tri=mod(gl_FragCoord.x,3.);
    vec3 mk=vec3(tri<1.?1.:.78,(tri>=1.&&tri<2.)?1.:.78,tri>=2.?1.:.78);
    g*=mix(vec3(1.),mk,uScan*.35);
    g+=max(luma(cW)-.6,0.)*.35*uScan;
  }
  g=clamp(g,0.,1.);
  if(!(g.r>=0.&&g.r<=1.))g.r=tex(p).r;if(!(g.g>=0.&&g.g<=1.))g.g=tex(p).g;if(!(g.b>=0.&&g.b<=1.))g.b=tex(p).b;
  gl_FragColor=vec4(mix(tex(p),g,uMix),1.);
}`;

export const MODES = { Clean: 0, Lavender: 1, Hot: 2, Mono: 3, Invert: 4, Night: 5, Color: 6 };

export const BASE = {
  destr: .45, stripe: 0, sfreq: 22, sbend: .6, wob: .4, melt: .2, neon: 0, hue: .62,
  lines: .4, tear: .2, roll: .2, streak: .3, region: .5, crush: 0, grid: 1, stut: .1,
  hmax: 6, scan: .5, bw: .6, dot: .3, grain: .35, mix: 1,
  mode: MODES.Lavender, autoTone: false, screen: false, pip: false, mirror: 0,
};

// The 8 shipped presets — SPEC.md section 8, verbatim overrides.
export const PRESETS = [
  { name: 'Contour', desc: 'Rippling stripe fields', v: { stripe: .85, sfreq: 22, sbend: .6, wob: .55, melt: .3, screen: true } },
  { name: 'Melt', desc: 'Everything slides sideways', v: { stripe: .45, sfreq: 14, sbend: 1.1, wob: .9, melt: .9, destr: .55 } },
  { name: 'Rescan', desc: 'Heavy CRT scanlines', v: { stripe: .3, wob: .35, melt: .2, screen: true, scan: .9, destr: .3, mode: MODES.Mono } },
  { name: 'Negative', desc: 'Inverted stripe fields', v: { stripe: .75, sfreq: 30, sbend: .9, wob: .6, melt: .4, mode: MODES.Invert, destr: .5 } },
  { name: 'Grid', desc: 'Multi tiles with a PIP box', v: { stripe: .7, grid: 3, pip: true, wob: .45, destr: .5 } },
  { name: 'Neon Face', desc: 'False color on black', v: { stripe: .15, neon: .9, hue: .08, wob: .5, melt: .5, crush: -.25, destr: .5, mode: MODES.Lavender } },
  { name: 'Comeback', desc: 'Mirror and color breaks', v: { stripe: 0, mode: MODES.Hot, autoTone: true, mirror: 2, lines: .7, tear: .8, region: .8, roll: .4, destr: .6, wob: .25, melt: .15, stut: .3 } },
  { name: 'Wrecked', desc: 'Destruction at full', v: { destr: 1, stripe: .7, wob: 1, melt: 1, lines: 1, tear: 1, roll: .8, streak: 1, region: 1, stut: .6, autoTone: true, screen: true } },
];

function mulberry(a) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Creates one live, independent instance of the real engine on `canvas`, sourced from `videoEl`.
// Returns { setParams(partial), applyPreset(preset), setPlaying(bool), destroy() }.
export function createCircuitBend(canvas, videoEl) {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true }) || canvas.getContext('experimental-webgl');
  if (!gl) return null;

  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const U = {}; 'uTime uFrame uSplit uMix uRes uScreen uScan uMirror uGrid uPip uStripe uStripeF uStripeBend uWob uMelt uEnergy uMode uNeon uHue uFull uLineP uLineAmt uLineT uBlockY uBlockH uBlockShift uRoll uSyncBar uStreak uCrush uR0 uR1 uR2 uSeamY uSeamShift uBandwidth uDot uGrain'.split(' ').forEach(n => U[n] = gl.getUniformLocation(pr, n));
  gl.uniform1i(gl.getUniformLocation(pr, 'uTex'), 0);

  const ui = Object.assign({}, BASE);
  let fixedMode = ui.mode, mirror = ui.mirror, autoTone = ui.autoTone, screenOn = ui.screen, pipOn = ui.pip;
  let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = (Math.random() * 1e9) | 0, rng = mulberry(seed);
  const gauss = () => { const u = rng() || 1e-9, v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };
  const logn = (med, sig) => med * Math.exp(sig * gauss());
  function pick(w) { let s = 0; for (const k in w) s += w[k]; let r = rng() * s; for (const k in w) { r -= w[k]; if (r <= 0) return +k; } return +Object.keys(w)[0]; }

  const E = {
    family: 'mono', famLeft: 0, tone: MODES.Lavender, runDur: 1, runLeft: 0, wreck: false, energy: .4, full: 0,
    roll: 0, rollSpeed: 0, rollOn: false, crushSign: 0,
    regions: [{ c: .3, h: .1, s: 0, v: 0 }, { c: .6, h: .1, s: 0, v: 0 }, { c: .8, h: .1, s: 0, v: 0 }],
    seams: [0, 1, 2, 3].map(() => ({ y: -1, shift: 0, target: 0 })),
    lineT: 1, lineNext: 0, block: { y: 0, h: 0, s: 0, left: 0 }, pip: { x: .55, y: .1, w: .35, h: .35 }, pipNext: 0,
  };
  function newFamily() { E.famLeft = clamp(logn(30, .8), 4, 180) / 1; }
  function newRun() {
    E.runDur = clamp(logn(1.2, 1.36), .2, 45); E.runLeft = E.runDur;
    E.wreck = rng() < .12 + .2 * ui.destr;
    if (autoTone) {
      const w = E.family === 'mono' ? { 1: .45, 4: .3, 3: .25 } : { 2: .5, 6: .5 };
      E.tone = pick(w);
    }
    E.rollOn = E.wreck && rng() < .4; E.rollSpeed = rng() < .4 ? 0 : (rng() - .5) * 1.4; E.roll = E.rollOn ? rng() : 0;
    E.crushSign = E.wreck && rng() < .3 ? (rng() < .5 ? -1 : 1) : 0;
    E.full = E.wreck && rng() < .35 ? .6 + rng() * .4 : 0;
  }
  function stepEnergy(dt, target) {
    const tau = 1.5; E.energy += (target - E.energy) * dt / tau + 0.5 * Math.sqrt(Math.max(dt, 0)) * gauss();
    if (rng() < dt * 0.2 * (.3 + ui.destr)) E.energy += .4 + rng() * .4;
    if (!Number.isFinite(E.energy)) E.energy = .4;
    E.energy = clamp(E.energy, 0, 1);
  }
  function stepDamage(dt) {
    const en = E.energy;
    for (const r of E.regions) {
      r.c += r.v * dt; r.s -= dt * (0.4 + rng() * 0.4);
      if (r.s <= 0 && rng() < dt * en * 2.2) { r.c = rng(); r.h = .04 + rng() * .22; r.s = .6 + rng() * .6; r.v = (rng() - .5) * .08; }
      r.s = Math.max(0, r.s);
    }
    for (const s of E.seams) {
      if (s.y < 0) { if (rng() < dt * en * 0.9) { const z = rng(); s.y = z < .35 ? rng() * .08 : z < .65 ? .92 + rng() * .07 : .35 + rng() * .3; s.target = (rng() - .5) * .25; } }
      else { s.y = clamp(s.y + (rng() - .5) * dt * .03, 0, 1); if (rng() < dt * 1.2) s.target = (rng() - .5) * .25 * (.4 + en); if (rng() < dt * (0.35 + (1 - en) * .6)) s.y = -1; }
      s.shift += (s.target - s.shift) * Math.min(1, dt * 25);
      if (s.y < 0) s.shift *= .5;
    }
    E.lineNext -= dt; if (E.lineNext <= 0) { E.lineT = rng() * 100; E.lineNext = (1 + (rng() * 6 | 0)) / 30; }
    const b = E.block; b.left -= dt;
    if (b.left <= 0) { b.h = 0; b.s = 0; if (rng() < dt * en * 1.5) { b.y = rng(); b.h = (4 + rng() * 52) / 480; b.s = (rng() - .5) * .2; b.left = (1 + rng() * 8) / 30; } }
    if (E.rollOn) E.roll = (E.roll + E.rollSpeed * dt + 1) % 1;
    E.pipNext -= dt; if (E.pipNext <= 0) { const w = .25 + rng() * .2; E.pip = { x: rng() * (1 - w), y: rng() * (1 - w * 1.1), w, h: w * 1.05 }; E.pipNext = 2 + rng() * 4; }
  }
  function step(dt) {
    E.runLeft -= dt; E.famLeft -= dt;
    if (E.runLeft <= 0) { if (E.famLeft <= 0) { E.family = E.family === 'mono' ? 'color' : 'mono'; newFamily(); } newRun(); }
    stepEnergy(dt, clamp(.12 + .75 * ui.destr + (E.wreck ? .3 : 0), 0, 1));
    stepDamage(dt);
    if (E.full > 0) E.full = Math.max(0, E.full - dt * .6);
  }
  newFamily(); newRun();

  function setParams(partial) {
    Object.assign(ui, partial);
    if (partial.mode !== undefined) fixedMode = partial.mode;
    if (partial.mirror !== undefined) mirror = partial.mirror;
    if (partial.autoTone !== undefined) autoTone = partial.autoTone;
    if (partial.screen !== undefined) screenOn = partial.screen;
    if (partial.pip !== undefined) pipOn = partial.pip;
  }
  function applyPreset(preset) { setParams(Object.assign({}, BASE, preset.v)); }

  let last = performance.now(), t = 0, frame = 0;
  let raf = null;

  function upload() {
    if (videoEl && videoEl.readyState >= 2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, videoEl);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function frameBody(now) {
    if (gl.isContextLost()) return;
    let dt = (now - last) / 1000; last = now; if (!(dt > 0)) dt = 0; if (dt > .1) dt = .1;
    resize();
    if (playing) { t += dt; frame++; step(dt); }
    upload();
    const D = ui.destr, en = E.energy, dm = .3 + 1.4 * D;
    const mode = autoTone ? E.tone : fixedMode;
    const wr = E.wreck ? 1 : .4;
    const reg = E.regions.map(r => [r.c, r.h, clamp(r.s * ui.region * dm, 0, 1.5)]);
    const sy = E.seams.map(s => s.y), ss = E.seams.map(s => s.y < 0 ? 0 : s.shift * ui.tear * dm * (E.wreck ? 1 : .5));
    const lineP = clamp((.02 + .18 * en) * ui.lines * dm * wr, 0, .6);
    const roll = E.rollOn ? E.roll * ui.roll : 0; const bar = E.rollOn && ui.roll > 0 ? .035 * Math.max(ui.roll, .3) : 0;
    const crush = E.crushSign ? E.crushSign * Math.max(.4, Math.abs(ui.crush)) * Math.min(1, dm) : ui.crush;
    const full = E.full * Math.min(1, dm);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uTime, t); gl.uniform1f(U.uFrame, frame); gl.uniform1f(U.uSplit, 0); gl.uniform1f(U.uMix, ui.mix);
    gl.uniform1f(U.uScreen, screenOn ? 1 : 0); gl.uniform1f(U.uScan, ui.scan);
    gl.uniform1f(U.uMirror, mirror); gl.uniform1f(U.uGrid, ui.grid);
    gl.uniform4f(U.uPip, E.pip.x, E.pip.y, pipOn ? E.pip.w : 0, E.pip.h);
    gl.uniform1f(U.uStripe, ui.stripe); gl.uniform1f(U.uStripeF, ui.sfreq); gl.uniform1f(U.uStripeBend, ui.sbend);
    gl.uniform1f(U.uWob, clamp(ui.wob * (.6 + .9 * D) * (.7 + .6 * en), 0, 2)); gl.uniform1f(U.uMelt, ui.melt * (.5 + D) * (.6 + .8 * en)); gl.uniform1f(U.uEnergy, en);
    gl.uniform1f(U.uMode, mode); gl.uniform1f(U.uNeon, ui.neon); gl.uniform1f(U.uHue, ui.hue);
    gl.uniform1f(U.uFull, full); gl.uniform1f(U.uLineP, lineP); gl.uniform1f(U.uLineAmt, .026 + .04 * en); gl.uniform1f(U.uLineT, E.lineT);
    gl.uniform1f(U.uBlockY, E.block.y); gl.uniform1f(U.uBlockH, E.block.h * Math.min(1, ui.lines * dm)); gl.uniform1f(U.uBlockShift, E.block.s * ui.lines);
    gl.uniform1f(U.uRoll, roll); gl.uniform1f(U.uSyncBar, bar); gl.uniform1f(U.uStreak, ui.streak * (.2 + en) * dm); gl.uniform1f(U.uCrush, crush);
    gl.uniform3fv(U.uR0, reg[0]); gl.uniform3fv(U.uR1, reg[1]); gl.uniform3fv(U.uR2, reg[2]);
    gl.uniform4fv(U.uSeamY, sy); gl.uniform4fv(U.uSeamShift, ss);
    gl.uniform1f(U.uBandwidth, ui.bw); gl.uniform1f(U.uDot, ui.dot); gl.uniform1f(U.uGrain, ui.grain);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frameBody);
  }
  raf = requestAnimationFrame(frameBody);

  return {
    setParams, applyPreset,
    setPlaying(v) { playing = v; },
    destroy() { if (raf) cancelAnimationFrame(raf); const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); },
  };
}
