import React, {useEffect, useRef, useState, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {ArrowDown, AudioLines, CalendarDays, CarFront, ChevronRight, Crosshair, Gauge, LockKeyhole, MapPin, Play, Radio, ScanLine, UnlockKeyhole, Zap} from 'lucide-react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {FloatingLogo, GoldenTicket, GuestMission, VideoFlashback, useThemeMusic} from './invitation.jsx';
import {roadStops, stopIndex} from './route.js';
import './style.css';

const Scene = lazy(() => import('./scene.jsx'));
gsap.registerPlugin(ScrollTrigger);
const target = Date.parse('2026-11-27T19:30:00+05:30');
const countdownStart = Date.parse('2026-11-01T00:00:00+05:30');
function read(key) { try {return localStorage.getItem(key)} catch {return null} }
function readSession(){try{return sessionStorage.getItem('cj-ticket-intro')}catch{return null}}
function save(key,value) {try {localStorage.setItem(key,value)} catch {}}
let audioContext;
function sound(cue) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    audioContext ??= new Audio();
    audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const patterns = {unlocked:[[0,54,.75],[.18,98,.5],[.42,196,.35],[.54,294,.3]], gate:[[0,130,.6],[.18,196,.65],[.36,261,.75]]};
    for (const [delay, pitch, duration] of patterns[cue]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(pitch,now+delay);
      oscillator.frequency.exponentialRampToValueAtTime(pitch*.73,now+delay+duration);
      gain.gain.setValueAtTime(.001,now+delay);
      gain.gain.exponentialRampToValueAtTime(.09,now+delay+.07);
      gain.gain.exponentialRampToValueAtTime(.001,now+delay+duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now+delay);
      oscillator.stop(now+delay+duration);
    }
  } catch {}
}

function Brand(){return <span className="brand"><span className="brand-icon" aria-hidden="true"><span>C</span><b>J</b></span><span>Curious<span className="brand-jr">Jr</span><small>by <b>PW</b></small></span></span>}
function PhotoFallback(){return <div className="scene-fallback" aria-hidden="true"/>}
function World(props){return <Suspense fallback={<PhotoFallback/>}><Scene {...props}/></Suspense>}
function scrollToSection(id) {document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
function Particles(){return <span className="particles" aria-hidden="true">{Array.from({length:27},(_,i)=><i key={i} style={{'--x':(i*37)%100+'%','--y':(i*61)%100+'%','--s':(2+i%4)+'px','--delay':(-i*.73)+'s'}}/>)}</span>}
function Tech({children,icon:Icon=Crosshair}){return <span className="eyebrow"><Icon size={15}/>{children}</span>}

function Countdown({onReady,reduced}) {
  const [now,setNow]=useState(Date.now);
  const [notice,setNotice] = useState('');
  useEffect(()=>{
    const update=()=>setNow(Date.now());
    const timer=setInterval(update,250);
    window.addEventListener('focus',update);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',update)};
  },[]);
  const locked=now<target;
  useEffect(()=>{if(!locked) onReady()},[locked]);
  const seconds=Math.max(0,Math.ceil((target-now)/1000));
  const units=[['Days',Math.floor(seconds/86400)],['Hours',Math.floor(seconds/3600)%24],['Minutes',Math.floor(seconds/60)%60],['Seconds',seconds%60]];
  const progress=Math.max(0,Math.min(100,100*(now-countdownStart)/(target-countdownStart)));
  const join=()=>{
    try {
      const url=new URL(window.CURIOUSJR_EVENT_URL);
      if (!['https:','http:'].includes(url.protocol)) throw new Error();
      window.location.assign(url.href);
    } catch {setNotice('The event joining link has not been configured yet.')}
  };
  return <section id="gateway" className={'gateway '+(!locked?'gate-open':'')}>
    <World mode="gateway" unlocked={!locked} reduced={reduced}/>
    <div className="gateway-shade"/>
    <Particles/>
    <div className="gate-content">
      <Tech icon={ScanLine}>LEVEL 02 — THE SECRET OF SUCCESS</Tech>
      <div className="gate-lock">{locked?<LockKeyhole size={28}/>:<UnlockKeyhole size={28}/>}</div>
      <h2>{locked?'THE NEXT LEVEL IS LOCKED.':'THE NEXT LEVEL IS OPEN.'}</h2>
      <p>{locked?'Every second brings you closer to the secret.':'The Annual Mega Event is ready to begin.'}</p>
      <div className="timer" role="timer" aria-label={units.map(([name,value])=>value+' '+name).join(', ')}>
        {units.map(([label,value])=><div className="time-cell" key={label} aria-hidden="true"><span key={value}>{String(value).padStart(2,'0')}</span><small>{label}</small></div>)}
      </div>
      <div className="chrono" role="progressbar" aria-label="Countdown progress" aria-valuenow={Math.floor(progress)}><div style={{width:progress+'%'}}/></div>
      <div className="gate-date"><CalendarDays size={16}/> 27 November 2026 · 7:30 PM IST</div>
      <button className={'btn '+(locked?'secondary':'primary')} disabled={locked} onClick={join}>{locked?<LockKeyhole size={16}/>:<Play size={16} fill="currentColor"/>}{locked?'Next level locked':'Enter the next level'}</button>
      {notice && <p className="join-notice" role="status">{notice}</p>}
    </div>
  </section>
}

function App(){
  const reduced=Boolean(useReducedMotion());
  const [intro,setIntro]=useState(()=>!matchMedia('(prefers-reduced-motion: reduce)').matches && !readSession());
  const [unlocked,setUnlocked]=useState(()=>read('cj-vehicle')==='unlocked');
  const [secret,setSecret]=useState(()=>read('cj-secret')==='acquired');
  const [flash,setFlash]=useState(false);
  const {enabled,media,controls}=useThemeMusic(flash);
  const [toast,setToast]=useState('');
  const [progress,setProgress]=useState(0);
  const [mission,setMission]=useState('The Invitation');
  const [ready,setReady]=useState(Date.now()>=target);
  const [condensed,setCondensed]=useState(false);
  const journey=useRef(null);
  const drive=useRef({progress:0});
  const flashButton=useRef(null);
  const notifications=useRef(new Set());
  const [chapter,setChapter]=useState(0);
  const finishIntro=()=>{try{sessionStorage.setItem('cj-ticket-intro','seen')}catch{}setIntro(false)};
  const announce=(message)=>{
    if(notifications.current.has(message)) return;
    notifications.current.add(message);
    setToast(message);
  };
  const acquire=()=>{if(!secret) {save('cj-secret','acquired');setSecret(true);announce('Secret acquired')}};
  const closeFlash=()=>{setFlash(false);requestAnimationFrame(()=>flashButton.current?.focus({preventScroll:true}))};
  const unlock=()=>{save('cj-vehicle','unlocked');setUnlocked(true);announce('Vehicle unlocked');if(enabled) sound('unlocked')};
  const gateReady=()=>{setReady(true);announce('Next level unlocked');if(enabled) sound('gate')};
  const badgeUnlocked=()=>{if(enabled) sound('unlocked')};
  useEffect(()=>{if(!intro)return; const timeout=setTimeout(finishIntro,4600);return ()=>clearTimeout(timeout)},[intro]);
  useEffect(()=>{if(!toast)return;const timeout=setTimeout(()=>setToast(''),3400);return ()=>clearTimeout(timeout)},[toast]);
  useEffect(()=>{
    if(!flash) return;
    document.body.classList.add('modal-active');
    return ()=>document.body.classList.remove('modal-active');
  },[flash]);
  useEffect(()=>{
    const trigger=ScrollTrigger.create({trigger:journey.current,start:'top top',end:'bottom bottom',onUpdate:self=>{
      drive.current.progress=self.progress;
      setChapter(stopIndex(self.progress));
      if(unlocked && self.progress>.035) announce('Journey started');
    }});
    const track=()=>{
      const top=window.scrollY;
      setProgress(Math.round(Math.min(1,top/Math.max(1,document.documentElement.scrollHeight-innerHeight))*100));
      setCondensed(top>80);
      setMission(['gateway','journey','garage','briefing'].find(id=>document.getElementById(id).getBoundingClientRect().top<innerHeight*.52)?.replace(/^(gateway|journey|garage|briefing)$/,(_,id)=>({gateway:'The Final Mission',journey:'The Journey',garage:'The Garage',briefing:'The Invitation'})[id])||'The Invitation');
    };
    const discover=ScrollTrigger.create({trigger:'#gateway', start:'top 65%',onEnter:()=>announce('Final mission discovered')});
    track();
    window.addEventListener('scroll',track,{passive:true});
    window.addEventListener('resize',track);
    return ()=>{trigger.kill();discover.kill();window.removeEventListener('scroll',track);window.removeEventListener('resize',track)};
  },[unlocked]);
  const status=ready?'Level 02 open':unlocked?'Vehicle unlocked':secret?'Secret acquired':'Mission active';
  return <>
    <header className={'topbar '+(condensed?'condensed':'')}>
      <a href="#briefing" aria-label="CuriousJr by PW home"><Brand/></a>
      <nav aria-label="Mission navigation">
        { [['briefing','Briefing','The Invitation'],['garage','Garage','The Garage'],['journey','Journey','The Journey'],['gateway','Countdown','The Final Mission']].map(([id,label,active])=><a key={id} href={'#'+id} aria-current={mission===active?'location':undefined}>{label}</a>) }
      </nav>
      <div className="top-controls"><span className="signal"><i/>{status}</span>{!intro&&controls}</div>
    </header>
    {media}
    <main>
      <section className="hero" id="briefing">
        <div className="hero-image"/><div className="hero-shade"/>
        <div className="hero-content">
          <Tech icon={Crosshair}>AN INTERACTIVE MISSION</Tech>
          <motion.h1
  initial={reduced ? false : { opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.65 }}
>
  The Secret<br />
  of <em>Success</em>
  <span className="hero-event-line">
    Today at 7:30 PM in Curious Juniour live MEGA EVENT
  </span>
</motion.h1>
          <p className="hero-sub">Every success story has a secret.<br/>Are you ready to discover it?</p>
          <div className="hero-actions"><button className="btn primary" ref={flashButton} onClick={()=>setFlash(true)}><Play size={16} fill="currentColor"/>Watch thriller backstory</button><button className="btn secondary" onClick={()=>scrollToSection('garage')}><CarFront size={18}/>Enter the garage</button></div>
        </div>
        <div className="hero-footer">
          <div className="hero-event"><CalendarDays size={17}/><span>27 NOV 2026 <b>·</b> 7:30 PM IST</span></div>
          <button className="explore" onClick={()=>scrollToSection('garage')}><ArrowDown size={15}/>Scroll to explore</button>
          <div className="hero-location"><MapPin size={16}/>NEON COAST</div>
        </div>
      </section>
      <section className="garage section-frame" id="garage">
        <div className="section-heading"><div><Tech icon={CarFront}>THE GARAGE</Tech><h2>UNLOCK YOUR <em>NEW CAR</em></h2></div><span className={'frame-status '+(unlocked?'active':'')}><i/>{unlocked?'Vehicle unlocked':'Restricted access'}</span></div>
        <div className={'garage-stage '+(unlocked?'is-unlocked':'')}>
          <World mode="garage" unlocked={unlocked} reduced={reduced}/>
          <div className="garage-overlay"/>
          <div className="garage-content">
            <div className="garage-lock">{unlocked?<UnlockKeyhole size={23}/>:<LockKeyhole size={23}/>}</div>
            <h3>{unlocked?'CURIOSITY GT':'CLASSIFIED VEHICLE'}</h3>
            <p>{unlocked?'Your ride is ready. Scroll to begin the journey.':'Open the garage to reveal your ride.'}</p>
            <button className="btn primary" onClick={unlocked?()=>scrollToSection('journey'):unlock}>{unlocked?<Gauge size={17}/>:<UnlockKeyhole size={17}/>} {unlocked?'Begin the journey':'Click to unlock the new car'}</button>
          </div>
          {unlocked && <Particles/>}
          <span className="bay-label"><Radio size={14}/> CURIOSITY GT / GARAGE FEED</span>
        </div>
      </section>
      <section id="journey" className={'journey '+(!unlocked?'journey-locked':'')}>
        <div className="journey-sticky">
          <World mode="journey" unlocked={unlocked} drive={drive} reduced={reduced}/>
          <div className="journey-shade"/>
          <div className="journey-head"><Tech icon={Gauge}>THE JOURNEY</Tech><span className="frame-status active">{unlocked?<Zap size={14}/>:<LockKeyhole size={14}/>} {unlocked?'Nitro flight':'Vehicle required'}</span></div>
          {unlocked ? <div className="sr-only" aria-live="polite">{roadStops[chapter].words.join(' ')}</div> :
            <div className="route-copy"><p>Unlock the Curiosity GT to fly through Neon Coast.</p><button className="btn secondary" onClick={()=>scrollToSection('garage')}><LockKeyhole size={16}/>Go to the garage</button></div>}
          <div className="route-track" aria-label={'Journey chapter '+(chapter+1)+' of 4'}>{roadStops.map((stop,i)=><span key={stop.z} className={i<=chapter?'lit':''}/>)}</div>
        </div>
      </section>
      <GuestMission onUnlock={badgeUnlocked} reduced={reduced}/>
      <Countdown onReady={gateReady} reduced={reduced}/>
    </main>
    <footer className="site-footer"><Brand/><span>CuriousJr Annual Mega Event</span><a href="#briefing">Back to briefing <ChevronRight size={16}/></a></footer>
    <div className="bottom-hud"><div><Crosshair size={15}/><span>Current mission</span><strong>{mission}</strong></div><div><span>Scroll progress</span><b>{String(progress).padStart(2,'0')}%</b><span className="hud-progress"><i style={{width:progress+'%'}}/></span></div></div>
    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={reduced?false:{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={{opacity:0}}><span><AudioLines size={20}/></span><div><p>ACHIEVEMENT UNLOCKED</p><strong>{toast}</strong></div></motion.div>}</AnimatePresence>
    {!intro && !flash && <FloatingLogo reduced={reduced}/>}
    <AnimatePresence>{intro && !reduced && <motion.div className="intro ticket-opening" exit={{opacity:0}} transition={{duration:.45}}><Particles/><div className="intro-audio">{controls}</div><GoldenTicket onSkip={finishIntro}/></motion.div>}</AnimatePresence>
    {flash && <VideoFlashback onClose={closeFlash} onAcquire={acquire} reduced={reduced}/>}
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
