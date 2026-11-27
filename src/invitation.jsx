import React, {useEffect, useRef, useState} from 'react';
import {Award, ChevronRight, Crosshair, ScanLine, Ticket, Volume2, VolumeX, X} from 'lucide-react';

const logo='/curiousjr-logo.webp';
const defaultVolume=18;

function storedVolume() {
  try {
    const stored=localStorage.getItem('cj-music-volume');
    if(stored!==null && Number.isFinite(Number(stored))) return Math.max(0,Math.min(100,Number(stored)));
  } catch {}
  return defaultVolume;
}

export function useThemeMusic(suspended) {
  const [volume,setVolume]=useState(storedVolume);
  const [playing,setPlaying]=useState(false);
  const audio=useRef(null);
  const previousVolume=useRef(defaultVolume);
  const play=()=>audio.current?.play()?.catch(()=>{});

  useEffect(()=>{
    audio.current.volume=volume/100;
    try{localStorage.setItem('cj-music-volume',String(volume))}catch{}
    if(volume>0) previousVolume.current=volume;
  },[volume]);

  useEffect(()=>{
    const player=audio.current;
    if(suspended || volume===0){player.pause();return}
    // Browsers can require a gesture before any audible playback.
    play();
    const retry=event=>{if(player.paused && !event.target.closest?.('.volume-control')) play()};
    window.addEventListener('click',retry);
    window.addEventListener('keydown',retry);
    return ()=>{
      window.removeEventListener('click',retry);
      window.removeEventListener('keydown',retry);
    };
  },[suspended,volume]);

  function update(next){
    const player=audio.current;
    player.volume=next/100;
    setVolume(next);
    if(next>0 && !suspended) play();
    else player.pause();
  }

  return {
    enabled:volume>0,
    media:<audio ref={audio} src="/media/theme.mp3" preload="auto" loop onPlaying={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/>,
    controls:<div className="volume-control">
      <button className="sound-btn" type="button" onClick={()=>update(volume>0&&playing?0:volume||previousVolume.current)} aria-label={volume>0&&playing?'Mute music':'Play music'} aria-pressed={volume>0&&playing}>
        {volume>0&&playing?<Volume2 size={17}/>:<VolumeX size={17}/>}
      </button>
      <input type="range" min="0" max="100" step="1" aria-label="Music volume" value={volume} style={{'--volume':volume+'%'}} onChange={event=>update(Number(event.target.value))}/>
      <span aria-hidden="true">{volume}%</span>
    </div>,
  };
}

export function VideoFlashback({onClose,onAcquire,reduced}) {
  const dialog=useRef(null);
  const video=useRef(null);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    dialog.current.showModal();
    if(!reduced) video.current.play()?.catch(()=>{});
  },[]);
  return <dialog className="flashback video-flashback" aria-label="Flashback — The Secret of Success" ref={dialog} onCancel={event=>{event.preventDefault();onClose()}}>
    <div className="flash-head">
      <span className="eyebrow"><ScanLine size={15}/>FLASHBACK — THE SECRET OF SUCCESS</span>
      <button className="icon-btn" aria-label="Close flashback" onClick={onClose}><X size={21}/></button>
    </div>
    <div className="flash-video">
      <video ref={video} src="/media/thriller.mp4" poster="/media/thriller-poster.webp" controls playsInline preload="metadata" aria-label="Thriller backstory video" onEnded={onAcquire} onError={()=>setFailed(true)}/>
      {failed && <p role="status">The video couldn’t load. <a href="/media/thriller.mp4">Open the video directly</a>.</p>}
    </div>
    <div className="flash-controls"><button className="btn primary" onClick={onClose}>Return to present day</button></div>
  </dialog>
}

export function GoldenTicket({onSkip}) {
  return <>
    <div className="ticket-intro">
      <p>Your golden ticket is ready</p>
      <div className="golden-ticket">
        <div className="ticket-main">
          <span className="micro">CURIOUSJR BY PW</span>
          <strong>GOLDEN<br/>TICKET</strong>
          <span className="ticket-event">Annual Mega Event</span>
          <span className="micro">27 NOV 2026 · 7:30 PM IST</span>
        </div>
        <div className="ticket-stub"><Ticket size={29}/><span>ADMIT ONE</span></div>
      </div>
    </div>
    <img className="intro-logo-art" src={logo} alt="CuriousJr by PW" fetchPriority="high"/>
    <button type="button" className="btn secondary" onClick={onSkip}>Skip intro <ChevronRight size={18}/></button>
  </>;
}

const cap=(value,min,max)=>Math.max(min,Math.min(max,value));

export function FloatingLogo({reduced}) {
  const badge=useRef(null);
  useEffect(()=>{
    if(reduced) return;
    const node=badge.current;
    let frame, last=0, turnAt=0, hop=0;
    let x=0,y=0,targetX=0,targetY=0;
    let pointer=null;
    let fleeing=false;
    const bounds=()=>{
      const size=node.offsetWidth;
      const top=(document.querySelector('.topbar')?.offsetHeight??65)+8;
      const left=10, right=Math.max(left,innerWidth-size-10);
      const bottom=Math.max(top,innerHeight-size-48);
      return {size,left,right,top,bottom};
    };
    let area=bounds();
    const resize=()=>{area=bounds()};
    const init=()=>{
      const {right,bottom}=area;
      x=targetX=right-4;
      y=targetY=bottom-18;
      node.style.transform=`translate3d(${x}px,${y}px,0)`;
    };
    init();
    const move=event=>{pointer={x:event.clientX,y:event.clientY}};
    const leave=()=>{pointer=null;fleeing=false};
    const animate=time=>{
      const {size,left,right,top,bottom}=area;
      const dt=last?Math.min(32,time-last):16;
      last=time;
      const cx=x+size/2, cy=y+size/2;
      const dx=pointer?pointer.x-cx:0, dy=pointer?pointer.y-cy:0;
      const distance=Math.hypot(dx,dy);
      const tooClose=pointer && distance<size*1.35;
      if(tooClose && (!fleeing || distance<size*.87)){
        const corners=[[left,top],[right,top],[left,bottom],[right,bottom]];
        const clear=(point)=>Math.hypot(point[0]+size/2-pointer.x,point[1]+size/2-pointer.y);
        const farthest=corners.reduce((best,point)=>clear(point)>clear(best)?point:best);
        targetX=farthest[0];
        targetY=farthest[1];
        fleeing=true;
        turnAt=time+1150;
        hop=Math.max(hop,.9);
      }else if(!tooClose && time>=turnAt){
        const choices=Array.from({length:4},()=>[
          left+Math.random()*(right-left), top+Math.random()*(bottom-top)
        ]);
        const choice=choices.find(([nextX,nextY])=>!pointer || Math.hypot(nextX+size/2-pointer.x,nextY+size/2-pointer.y)>size*1.6);
        if(choice) [targetX,targetY]=choice;
        fleeing=false;
        turnAt=time+1700+Math.random()*1600;
        hop=1;
      }
      const rate=1-Math.exp(-dt/(fleeing?65:410));
      x=cap(x+(targetX-x)*rate,left,right);
      y=cap(y+(targetY-y)*rate,top,bottom);
      hop=Math.max(0,hop-dt/500);
      const bob=Math.sin(time*.0047)*4-Math.sin(Math.PI*hop)*size*.21;
      node.style.transform=`translate3d(${x}px,${cap(y+bob,top,bottom)}px,0) rotate(${Math.sin(time*.004)*5}deg)`;
      const eyeDistance=Math.max(38,distance);
      node.style.setProperty('--eye-x',`${dx/eyeDistance*32}%`);
      node.style.setProperty('--eye-y',`${dy/eyeDistance*29}%`);
      node.style.setProperty('--tilt-x',`${-dy/eyeDistance*12}deg`);
      node.style.setProperty('--tilt-y',`${dx/eyeDistance*15}deg`);
      frame=requestAnimationFrame(animate);
    };
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerdown',move,{passive:true});
    window.addEventListener('blur',leave);
    window.addEventListener('resize',resize);
    document.documentElement.addEventListener('pointerleave',leave);
    frame=requestAnimationFrame(animate);
    return ()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerdown',move);
      window.removeEventListener('blur',leave);
      window.removeEventListener('resize',resize);
      document.documentElement.removeEventListener('pointerleave',leave);
    };
  },[reduced]);
  return <div ref={badge} className={'floating-logo'+(reduced?' floating-logo-still':'')} aria-hidden="true">
    <div className="floating-logo-face">
      <img src={logo} alt=""/>
      <span className="logo-eye logo-eye-left"><i/></span><span className="logo-eye logo-eye-right"><i/></span>
    </div>
  </div>;
}

function readBadge(){
  try{return localStorage.getItem('cj-guest-badge')==='earned'}catch{return false}
}

export function GuestMission({onUnlock,reduced}) {
  const [guess,setGuess]=useState('');
  const [earned,setEarned]=useState(readBadge);
  const [celebration,setCelebration]=useState(0);
  const [error,setError]=useState(false);
  const result=useRef(null);
  function submit(event){
    event.preventDefault();
    if(!guess.trim()){setError(true);return}
    setError(false);
    setEarned(true);
    setCelebration(value=>value+1);
    try{localStorage.setItem('cj-guest-badge','earned')}catch{}
    onUnlock();
  }
  useEffect(()=>{if(celebration) result.current?.focus({preventScroll:true})},[celebration]);
  return <section id="special-guest" className="guest-mission section-frame">
    <div className="guest-panel">
      <div className="guest-copy">
        <span className="eyebrow"><Crosshair size={15}/>BONUS MISSION</span>
        <h2>GUESS THE <em>SPECIAL GUEST</em></h2>
        <p>Submit your guess to earn the Curiour Learner Badge.</p>
        <form onSubmit={submit}>
          <div className="guest-field"><label htmlFor="guest-guess">Who do you think it is?</label><input id="guest-guess" value={guess} onChange={event=>{setGuess(event.target.value);if(error)setError(false)}} maxLength={120} aria-invalid={error||undefined} aria-describedby={error?'guess-error':undefined} autoComplete="off"/></div>
          <button className="btn primary" type="submit">Submit guess</button>
        </form>
        {error && <p className="guess-error" id="guess-error" role="alert">Enter a name to submit your guess.</p>}
      </div>
      <div key={celebration} className={'guest-result '+(earned?'earned ':'')+(celebration&&!reduced?'badge-celebration':'')} ref={result} tabIndex={-1} role="status">
        <div className="guest-medallion"><Award size={46} strokeWidth={1.45}/></div>
        <span className="micro">{earned?'NEW LEVEL UNLOCKED':'BADGE LOCKED'}</span>
        <strong>Curiour Learner Badge</strong>
      </div>
    </div>
  </section>;
}
