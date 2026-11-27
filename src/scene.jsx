import React, {useEffect, useRef, useState} from 'react';
import * as T from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import boldFont from 'three/examples/fonts/helvetiker_bold.typeface.json';
import {flightZ, roadStops, stopIndex} from './route.js';

const v=(x,y,z)=>new T.Vector3(x,y,z);
const clamp=(value)=>Math.max(0,Math.min(1,value));
const smooth=(value)=>{const p=clamp(value);return p*p*(3-2*p)};
const lerp=T.MathUtils.lerp;
const metal=(color,metalness=.32,roughness=.37)=>new T.MeshStandardMaterial({color,metalness,roughness});
const lit=(color)=>new T.MeshBasicMaterial({color});
function place(parent,object,x=0,y=0,z=0){object.position.set(x,y,z);parent.add(object);return object}
function box(parent,w,h,d,mat,x=0,y=0,z=0){return place(parent,new T.Mesh(new T.BoxGeometry(w,h,d),mat),x,y,z)}
function ball(parent,r,mat,x,y,z,sx=1,sy=1,sz=1){const mesh=place(parent,new T.Mesh(new T.SphereGeometry(r,16,12),mat),x,y,z);mesh.scale.set(sx,sy,sz);return mesh}
function cylinder(parent,rt,rb,h,mat,x=0,y=0,z=0,segments=20){return place(parent,new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),mat),x,y,z)}
function gridMesh(parent,rows,mat) {
  const data=rows.flat(2);
  const indices=[];
  for(let row=0;row<rows.length-1;row++){
    for(let i=0;i<4;i++){
      const a=row*4+i,b=row*4+((i+1)%4);
      indices.push(a,a+4,b,b,a+4,b+4);
    }
  }
  const last=(rows.length-1)*4;
  indices.push(0,1,2,0,2,3,last,last+2,last+1,last,last+3,last+2);
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.Float32BufferAttribute(data,3));
  geom.setIndex(indices);
  const flat=geom.toNonIndexed();
  flat.computeVertexNormals();
  geom.dispose();
  return place(parent,new T.Mesh(flat,mat));
}
function contour(z,width,bottom,y,topWidth=width){return [[-width,bottom,z],[-topWidth,y,z],[topWidth,y,z],[width,bottom,z]]}
function sportsCar(color=0xfa671d) {
  const car=new T.Group();
  const paint=metal(color,.57,.27);
  paint.side=T.DoubleSide;
  const trim=metal(0x161822,.57,.38);
  const cabin=metal(0x182333,.62,.18);
  cabin.side=T.DoubleSide;
  const rubber=metal(0x17161c,.06,.85);
  const rim=metal(0xbcb4aa,.76,.32);
  const shadow=lit(0x0d080c);
  const bolts=metal(0xed732d,.53,.46);
  const head=lit(0xffeda6);
  const tail=lit(0xff374b);
  const body=gridMesh(car,[contour(-2.47,.92,.39,.69,.83),contour(-2.16,1.09,.37,.86,.98),contour(-1.47,1.14,.39,.92,1.05),contour(-.58,1.09,.43,.88,.98),contour(.68,1.02,.44,.76,.99),contour(1.70,1.11,.39,.69,.98),contour(2.25,1.01,.38,.59,.92),contour(2.45,.93,.38,.48,.87)],paint);
  body.castShadow=true;
  gridMesh(car,[contour(-1.48,.87,.85,.93,.80),contour(-.68,.81,.86,1.44,.62),contour(.10,.76,.80,1.46,.59),contour(.87,.77,.72,.82,.72)],cabin);
  box(car,1.21,.045,.67,paint,0,1.456,-.31);
  box(car,1.83,.09,4.78,trim,0,.36,-.025);
  box(car,1.72,.15,.18,trim,0,.56,2.23);
  box(car,1.73,.16,.16,trim,0,.59,-2.28);
  box(car,.35,.12,.035,metal(0xb9a76a),0,.58,-2.383);
  box(car,2.04,.085,.41,trim,0,1.105,-2.09);
  for(const side of [-1,1]){
    box(car,.065,.2,.12,trim,side*.65,1.01,-2.04);
    box(car,.061,.12,2.58,trim,side*1.1,.43,0);
    box(car,.028,.16,.31,shadow,side*1.11,.69,-1.05);
    box(car,.22,.075,.24,paint,side*.96,.99,.46);
    for(const stripe of [0,1,2])box(car,.49,.025,.025,tail,side*.65,.58+stripe*.043,-2.37+stripe*.01);
    const reflector=box(car,.53,.08,.04,head,side*.66,.57,2.294);
    reflector.rotation.z=side*.09;
  }
  {
    const badge=document.createElement('canvas');
    badge.width=256;badge.height=48;
    const context=badge.getContext('2d');
    context.fillStyle='#1c1419';context.fillRect(0,0,256,48);
    context.fillStyle='#ffae74';context.font='bold 29px sans-serif';context.textAlign='center';
    context.fillText('CURIOSITY GT',128,35);
    const texture=new T.CanvasTexture(badge);
    texture.colorSpace=T.SRGBColorSpace;
    const decal=place(car,new T.Mesh(new T.PlaneGeometry(.71,.132),new T.MeshBasicMaterial({map:texture})),0,.605,-2.388);
    decal.rotation.y=Math.PI;
  }
  const wheels=[];
  for(const x of [-1.06,1.06]){
    for(const z of [-1.52,1.49]){
      const wheel=place(car,new T.Group(),x,.45,z);
      cylinder(wheel,.453,.453,.34,rubber).rotation.z=Math.PI/2;
      cylinder(wheel,.299,.299,.354,rim).rotation.z=Math.PI/2;
      cylinder(wheel,.233,.233,.363,trim).rotation.z=Math.PI/2;
      cylinder(wheel,.067,.067,.387,bolts).rotation.z=Math.PI/2;
      for(let i=0;i<6;i++){
        const angle=i*Math.PI/3;
        const spoke=box(wheel,.027,.23,.037,rim,Math.sign(x)*.185,.14*Math.cos(angle),.14*Math.sin(angle));
        spoke.rotation.x=angle;
      }
      wheels.push(wheel);
    }
  }
  const door=place(car,new T.Group(),-1.055,.52,.58);
  const doorMat=paint;
  const panel=gridMesh(door,[contour(-1.44,.075,0,.38),contour(-.12,.075,0,.293),contour(0,.044,0,.22)],doorMat);
  panel.position.x=-.018;
  box(door,.036,.036,.27,trim,-.093,.30,-1.02);
  const beams=place(car,new T.Group());
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute([-.83,.028,2.28,-3.1,.028,12.6,3.1,.028,12.6,-.83,.028,2.28,3.1,.028,12.6,.83,.028,2.28],3));
  const colors=new Float32Array([1,.43,.13,.04,.02,.015,.04,.02,.015,1,.43,.13,.04,.02,.015,1,.43,.13]);
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  place(beams,new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.28,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})));
  const beamGlow=new T.PointLight(0xffb65d,9,17,2);
  place(beams,beamGlow,0,.6,3.6);
  car.userData={wheels,door,beams,head};
  return car;
}

function player() {
  const figure=new T.Group();
  const skin=metal(0xd68c57,.06,.65);
  const hair=metal(0x2a1615,.07,.92);
  const hoodie=metal(0xfb6a25,.05,.70);
  const band=metal(0xa4361c,.01,.75);
  const jeans=metal(0x292537,.02,.74);
  const shoes=metal(0xf1e3d5,.10,.73);
  const black=metal(0x1a1722,.15,.51);
  const face=place(figure,new T.Group(),0,2,0);
  ball(face,.36,skin,0,.09,.01,1,1.1,.91);
  ball(face,.12,skin,-.34,.05,.015,.68,1,.76);
  ball(face,.12,skin,.34,.05,.015,.68,1,.76);
  ball(face,.075,skin,0,.045,.319,1,1,.98);
  ball(face,.096,band,0,-.091,.292,1,.22,.24);
  ball(face,.275,hair,0,.33,-.025,1.27,.69,1.10);
  for(let i=0;i<16;i++){
    const a=i*2.39996, radius=.11+.21*((i%6)/6);
    ball(face,.124+(i%4)*.012,hair,Math.cos(a)*radius,.356+.078*Math.sin(i*.8),Math.sin(a)*radius,.97,1.13,.99);
  }
  for(const side of [-1,1]){
    const x=side*.149;
    place(face,new T.Mesh(new T.TorusGeometry(.128,.018,8,24),black),x,.113,.321);
    ball(face,.047,shoes,x,.107,.309,1.17,1.1,.39);
    ball(face,.027,black,x-.007,.106,.337,1,1,.58);
  }
  box(face,.066,.018,.025,black,0,.124,.332);
  ball(figure,.394,hoodie,0,1.52,0,1.04,1.05,.62);
  ball(figure,.29,band,0,1.83,-.102,1.01,.65,1.08);
  ball(figure,.315,hoodie,0,1.276,0,1,.40,.70);
  const mark=box(figure,.164,.064,.006,shoes,0,1.51,.247);
  mark.rotation.z=-.08;
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=place(figure,new T.Group(),side*.16,1.18,0);
    cylinder(leg,.13,.098,.72,jeans,0,-.37,0);
    ball(leg,.14,shoes,0,-.79,.083,.83,.52,1.52);
    legs.push(leg);
    const arm=place(figure,new T.Group(),side*.36,1.72,0);
    cylinder(arm,.112,.083,.56,hoodie,0,-.24,0).rotation.z=side*.19;
    ball(arm,.081,skin,-side*.055,-.53,.025,.88,1,.91);
    arm.rotation.z=side*.13;
    arms.push(arm);
  }
  figure.userData={face,legs,arms};
  return figure;
}
function caseModel(){
  const item=new T.Group();
  const shell=metal(0xca8234,.67,.3), strip=lit(0xffc566), detail=metal(0x79501f);
  box(item,1.1,.68,.27,shell);
  box(item,1.12,.038,.278,strip,0,.32,0);
  box(item,1.12,.038,.278,strip,0,-.32,0);
  for(const side of [-1,1]){
    box(item,.043,.64,.283,strip,side*.528,0,0);
    box(item,.096,.18,.035,detail,side*.28,.11,.145);
    box(item,.046,.132,.038,strip,side*.14,.386,0);
  }
  box(item,.32,.045,.038,strip,0,.447,0);
  const label=document.createElement('canvas');
  label.width=384;label.height=98;
  const c=label.getContext('2d');
  c.fillStyle='#27140a';c.fillRect(0,0,384,98);
  c.fillStyle='#ffce79';c.font='bold 26px sans-serif';c.textAlign='center';c.fillText('THE SECRET OF SUCCESS',192,60);
  const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  const sign=place(item,new T.Mesh(new T.PlaneGeometry(.78,.2),new T.MeshBasicMaterial({map})),0,-.085,.141);
  sign.userData.canvas=true;
  place(item,new T.PointLight(0xffaa49,8,9,2),0,.42,.43);
  return item;
}
function lamp(parent,x,z,color) {
  const frame=metal(0x3c2a34,.45);
  cylinder(parent,.06,.09,4.6,frame,x,2.30,z,7);
  box(parent,.76,.07,.09,frame,x+.32*Math.sign(-x),4.57,z);
  box(parent,.3,.07,.19,lit(color),x+.61*Math.sign(-x),4.525,z);
}
function seedGenerator(){let seed=410;return ()=>{seed=(seed*16807)%2147483647;return seed/2147483647}}
function city(scene) {
  const seed=seedGenerator();
  const road=metal(0x201a27,.4,.62);
  box(scene,180,.15,340,road,0,-.10,106);
  const sideMat=metal(0x523143,.28,.66);
  const stripeMat=metal(0xe2a253,.39,.47);
  for(const side of [-1,1]){
    box(scene,4,.31,335,sideMat,side*9.5,-.035,110);
    box(scene,.13,.035,335,metal(0xbe6465),side*7.62,.012,110);
    for(let i=0;i<31;i++){
      const z=i*10-24;
      if(i%2===0) lamp(scene,side*8.4,z,i%4===0?0xff984e:0xf76480);
      for(let row=0;row<2;row++){
        const width=4+seed()*5, height=4+seed()*(row===0?15:39), depth=4+seed()*4;
        const x=side*(13+width*.5+row*12);
        const color=new T.Color().setHSL(.87+seed()*.1,.17+seed()*.19,.105+seed()*.125);
        box(scene,width,height,depth,metal(color,.14,.84),x,height/2,z+seed()*4-2);
        const front=x-side*(width/2+.02);
        const count=Math.min(12,Math.floor(height/1.55));
        const windows=lit(seed()<.48?0x80434b:0x9b653d);
        const glows=new T.InstancedMesh(new T.BoxGeometry(.026,.17,.36),windows,count*3);
        let pos=0;
        for(let floor=0;floor<count;floor++)for(let space=-1;space<=1;space++) {
          glows.setMatrixAt(pos++,new T.Matrix4().makeTranslation(front,.9+floor*1.48,z+space*1.08+seed()*.32));
        }
        scene.add(glows);
        if(row===0 && i%3===0) {
          box(scene,.05,.07,depth*.97,lit(i%2?0xb85289:0xe88a51),front,2.6,z);
          box(scene,.05,.06,depth*.97,lit(0xe7523c),front,height-.4,z);
        }
      }
    }
  }
  const stripes=new T.InstancedMesh(new T.BoxGeometry(.15,.023,3.1),stripeMat,37);
  for(let i=0;i<37;i++)stripes.setMatrixAt(i,new T.Matrix4().makeTranslation(0,.002,i*8-31));
  scene.add(stripes);
}
function garage(scene) {
  const wall=metal(0x302426,.35,.68), surface=metal(0x251b1c,.35,.44), light=lit(0xff834a);
  box(scene,28,.20,32,surface,0,-.12,0);
  box(scene,25,8,.28,wall,0,4,-6);
  for(const side of [-1,1]){
    box(scene,.26,8,21,wall,side*8,4,0);
    for(let i=0;i<5;i++){
      box(scene,.06,.062,1.50,light,side*7.81,3.86,i*3-5);
      box(scene,.055,5,.16,wall,side*7.78,2.5,i*3-5.8);
    }
  }
  box(scene,15.6,.127,.4,light,0,4.36,-5.83);
  const base=cylinder(scene,3.25,3.25,.16,metal(0x3f3538,.54,.54),0,-.03,.07,56);
  const circle=place(scene,new T.Mesh(new T.TorusGeometry(3.19,.025,8,64),light),0,.058,.07);
  circle.rotation.x=Math.PI/2;
  const shutter=place(scene,new T.Group(),0,0,3.42);
  const slat=metal(0x454049,.57,.55);
  for(let i=0;i<19;i++){
    box(shutter,8.65,.234,.16,slat,0,.11+i*.245,0);
    box(shutter,8.65,.014,.19,lit(0x181117),0,.004+i*.245,0);
  }
  box(shutter,8.65,.057,.21,light,0,.082,.01);
  for(const side of [-1,1]){
    box(scene,.25,5,.38,wall,side*4.47,2.5,3.43);
    box(scene,.045,3.8,.41,light,side*4.45,2.44,3.43);
  }
  return {shutter,base};
}
function vault(scene){
  const dark=metal(0x432735,.58,.49), edge=lit(0xff9a47);
  box(scene,30,.18,29,metal(0x2c1e28,.44,.63),0,-.11,0);
  box(scene,16,7,.5,dark,0,3.5,3.9);
  for(const side of [-1,1]){
    box(scene,.21,5.8,.46,edge,side*3.54,2.9,-.25);
    box(scene,.7,6,.65,dark,side*3.91,3,-.25);
  }
  box(scene,7.4,.13,.47,edge,0,5.86,-.25);
  const doors=[-1,1].map(side=>{
    const leaf=place(scene,new T.Group(),side*1.74,0,-.20);
    box(leaf,3.44,5.76,.38,dark,0,2.86,0);
    for(let i=0;i<5;i++)box(leaf,3.23,.03,.42,edge,0,1.03+i*.84,0);
    return leaf;
  });
  cylinder(scene,1.36,1.54,.4,dark,0,.18,-1.72,40);
  const ring=place(scene,new T.Mesh(new T.TorusGeometry(1.29,.03,7,48),edge),0,.393,-1.72);
  ring.rotation.x=Math.PI/2;
  return doors;
}
function haloTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=128;
  const context=canvas.getContext('2d');
  const gradient=context.createRadialGradient(64,64,1,64,64,64);
  gradient.addColorStop(0,'rgba(255,255,255,.81)');
  gradient.addColorStop(.42,'rgba(255,255,255,.34)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  context.fillStyle=gradient;
  context.fillRect(0,0,128,128);
  return new T.CanvasTexture(canvas);
}
function neon(parent,texture,color,w,h,x,y,z) {
  const glow=place(parent,new T.Sprite(new T.SpriteMaterial({map:texture,color,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false})),x,y,z);
  glow.scale.set(w,h,1);
  return glow;
}
function cityLetters(scene,texture) {
  const font=new FontLoader().parse(boldFont);
  return roadStops.map(({words,z,color,pale},index)=>{
    const side=index%2===0?1:-1;
    const grand=index===roadStops.length-1;
    const sign=place(scene,new T.Group(),side*5.1,0,z);
    sign.rotation.y=Math.PI+side*.22;
    const face=new T.MeshBasicMaterial({color:pale,fog:false,toneMapped:false,transparent:true});
    const edges=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.66,roughness:.48,metalness:.22,fog:false,transparent:true});
    const glow=neon(sign,texture,color,grand?12:9,grand?5.5:4.3,0,2.55,-.40);
    words.forEach((line,row)=>{
      const geometry=new TextGeometry(line,{font,size:1,depth:.24,curveSegments:4,bevelEnabled:true,bevelThickness:.045,bevelSize:.037,bevelSegments:1});
      geometry.computeBoundingBox();
      const width=geometry.boundingBox.max.x-geometry.boundingBox.min.x;
      const scale=Math.min(grand?1.54:1.18,(grand?7.65:6.5)/width);
      geometry.translate(-width/2,0,0);
      const mesh=place(sign,new T.Mesh(geometry,[face,edges]),0,grand?3.11-row*1.49:3.46-row*1.05,0);
      mesh.scale.setScalar(scale);
    });
    sign.userData={face,edges,glow,side};
    return sign;
  });
}
function thrusters(car,texture) {
  const boost=place(car,new T.Group());
  const flames=[];
  for(const side of [-1,1]){
    const outlet=place(boost,new T.Group(),side*.58,.45,-2.38);
    const core=new T.MeshBasicMaterial({color:0xc4faff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    const edge=new T.MeshBasicMaterial({color:0x368cff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    const outer=place(outlet,new T.Mesh(new T.ConeGeometry(.32,2.8,12),edge),0,0,-1.40);
    const inner=place(outlet,new T.Mesh(new T.ConeGeometry(.16,1.6,10),core),0,0,-.80);
    outer.rotation.x=inner.rotation.x=-Math.PI/2;
    neon(outlet,texture,0x358dff,1.8,1.65,0,0,-.37);
    flames.push({outlet,core,edge});
  }
  const light=place(boost,new T.PointLight(0x227cff,0,10,2),0,.25,-2.5);
  return {boost,flames,light};
}
function roadTrace(scene,texture,color,blending,x=0,z=0) {
  const material=new T.MeshBasicMaterial({map:texture,color,transparent:true,depthWrite:false,blending,opacity:.5,toneMapped:false});
  const patch=place(scene,new T.Mesh(new T.PlaneGeometry(1,1),material),x,.026,z);
  patch.rotation.x=-Math.PI/2;
  return patch;
}
function makeSmoke(scene){
  const canvas=document.createElement('canvas');
  canvas.width=128;canvas.height=128;
  const context=canvas.getContext('2d');
  const gradient=context.createRadialGradient(64,64,5,64,64,64);
  gradient.addColorStop(0,'rgba(254,185,158,.45)');
  gradient.addColorStop(.42,'rgba(193,121,102,.27)');
  gradient.addColorStop(1,'rgba(89,49,58,0)');
  context.fillStyle=gradient;
  context.fillRect(0,0,128,128);
  const map=new T.CanvasTexture(canvas);
  return Array.from({length:9},()=>place(scene,new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0}))));
}
function pose(figure,t,kind,still=false){
  const {arms,legs,face}=figure.userData;
  const pace=kind==='walk'?.57:0;
  const a=still?0:Math.sin(t*7.5)*pace;
  legs[0].rotation.x=a;legs[1].rotation.x=-a;
  arms[0].rotation.x=kind==='point'?-1.3:-a*.78;
  arms[1].rotation.x=a*.78;
  arms[0].rotation.z=kind==='celebrate'?1.94:kind==='lean'?.58:-.15;
  arms[1].rotation.z=kind==='celebrate'?-1.94:kind==='unveil'?-.95:.15;
  face.rotation.y=kind==='point'?.32:0;
  return Math.abs(a)*.105;
}
function dispose(scene){
  const geometries=new Set(), materials=new Set(), textures=new Set();
  scene.traverse(object=>{
    if(object.geometry) geometries.add(object.geometry);
    for(const material of [object.material].flat().filter(Boolean)){
      materials.add(material);
      if(material.map) textures.add(material.map);
    }
  });
  for(const texture of textures)texture.dispose();
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
}
export default function World(props) {
  const root=useRef(null);
  const latest=useRef(props);
  latest.current=props;
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const host=root.current;
    let renderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}
    catch{setFailed(true);return}
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.55));
    renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.35;
    renderer.outputColorSpace=T.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene=new T.Scene();
    const mode=props.mode;
    const isGarage=mode==='garage', isGate=mode==='gateway', isDrive=mode==='journey';
    scene.background=new T.Color(isGarage?0x160f12:isGate?0x1c0b11:0x563746);
    scene.fog=new T.FogExp2(scene.background,isGarage?.031:isGate?.027:.024);
    const camera=new T.PerspectiveCamera(44,1,.12,165);
    scene.add(new T.HemisphereLight(0xffb179,0x432438,isGarage?2.16:2.0));
    const sun=new T.DirectionalLight(0xffa56b,3.0);
    scene.add(sun);
    sun.position.set(-7,10,9);
    const rimLight=new T.DirectionalLight(isGarage?0xff6637:0xd665b3,1.7);
    rimLight.position.set(6,4,-8);scene.add(rimLight);
    const bay=isGarage?garage(scene):null;
    const doors=isGate?vault(scene):null;
    const car=isGate?null:place(scene,sportsCar(0xff672b));
    const mascot=isGate?null:place(scene,player());
    const briefcase=isGate?place(scene,caseModel()):null;
    const smoke=isGarage?makeSmoke(scene):[];
    let signs=[], extras=[], nitro, shadow, reflection;
    if(isDrive){
      city(scene);
      const texture=haloTexture();
      signs=cityLetters(scene,texture);
      extras=[0,1,2].map(()=>place(scene,player()));
      nitro=thrusters(car,texture);
      shadow=roadTrace(scene,texture,0x100611,T.NormalBlending);
      reflection=roadTrace(scene,texture,0x2676ff,T.AdditiveBlending);
    }
    let visible=false, frame=0, time=0, previous=0, unlockAmount=props.unlocked?1:0, gateAmount=props.unlocked?1:0, revealTime=props.unlocked?3:0;
    const aim=v(0,0,0);
    const resize=()=>{
      const {clientWidth:width,clientHeight:height}=host;
      if(!width||!height)return;
      renderer.setSize(width,height,false);
      camera.aspect=width/height;
      camera.fov=width/height<1?(isDrive?64:57):44;
      camera.updateProjectionMatrix();
    };
    const sizeObserver=new ResizeObserver(resize);
    sizeObserver.observe(host);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting});
    observer.observe(host);
    resize();
    function draw(now) {
      frame=requestAnimationFrame(draw);
      const dt=Math.min(.05,(now-(previous||now))/1000);
      previous=now;
      if(!visible)return;
      const {reduced,unlocked,drive}=latest.current;
      const mobile=camera.aspect<1;
      if(!reduced) time+=dt;
      if(isGarage){
        unlockAmount=reduced?(unlocked?1:0):Math.min(unlocked?1:0,unlockAmount+dt*.56);
        if(unlocked&&!reduced)revealTime+=dt;
        for(const [index,puff] of smoke.entries()){
          const age=clamp((revealTime-index*.089)/2.3);
          puff.visible=unlocked&&!reduced&&age>0&&age<1;
          puff.material.opacity=Math.sin(age*Math.PI)*.55;
          puff.position.set((index-4)*.4+Math.sin(index*4)*age*2,.21+age*.93,2.9-(index%3)*.32);
          puff.scale.setScalar(.83+age*3.1);
        }
        const ease=smooth(unlockAmount);
        bay.shutter.position.y=ease*5.35;
        bay.shutter.visible=ease<.99;
        const angle=unlocked?(reduced?.40:.4+Math.max(0,revealTime-1.12)*.52):.4;
        car.rotation.y=angle;
        car.position.set(mobile?0:1.0,.067,0);
        car.userData.beams.visible=unlockAmount>.63;
        car.userData.head.color.setHex(unlockAmount>.63?0xffe1a0:0x5d4338);
        for(const wheel of car.userData.wheels)wheel.rotation.x=unlocked?time*2.4:0;
        mascot.visible=unlockAmount>.8;
        mascot.position.set(2.95,.02,-.6);
        mascot.scale.setScalar(.93);
        mascot.rotation.y=.26;
        mascot.position.y=pose(mascot,time,unlocked?'celebrate':'lean',reduced)+(unlocked&&!reduced?.12*Math.max(0,Math.sin(time*4)):0);
        camera.position.set(mobile?5.8:6.8,mobile?4.5:3.19,mobile?9.9:10.5);
        aim.set(mobile?0:-1.8,mobile?-.57:1.2,0);
      }
      if(isDrive){
        const progress=drive?.current.progress??0;
        const actual=unlocked?progress:0;
        const approach=smooth(actual/.072);
        const enter=smooth((actual-.086)/.047);
        const lift=smooth((actual-.132)/.103);
        const z=flightZ(actual);
        const altitude=lift*(2.05+(reduced?0:Math.sin(actual*21)*.49+Math.sin(time*2.1)*.08));
        const active=stopIndex(actual);
        const signZ=roadStops[active].z;
        // Favor the sign as it approaches, then recenter while flying between stops.
        const lookFactor=smooth((19-Math.abs(signZ-(z+7)))/12)*smooth(actual/.17);
        const direction=active%2===0?1:-1;
        const drift=reduced?0:Math.sin(actual*20)*.41*lift;
        car.position.set(drift,altitude,z);
        car.rotation.set(-.31*Math.sin(Math.PI*lift)+(reduced?0:.045*Math.sin(actual*22)*lift),drift*.17,-drift*.24);
        car.userData.door.rotation.y=-1.24*(smooth((actual-.066)/.023)-smooth((actual-.126)/.025));
        car.userData.beams.visible=actual>.128&&lift<.3;
        car.userData.head.color.setHex(actual>.128?0xffe6b0:0x584830);
        for(const wheel of car.userData.wheels)wheel.rotation.x=-z*.7;
        mascot.visible=enter<.97;
        mascot.rotation.y=1.11;
        mascot.scale.setScalar(1-enter*.41);
        mascot.position.set(lerp(-4,-1.13,approach)+enter*.92,pose(mascot,actual*44,actual<.075&&unlocked?'walk':'lean',reduced)-enter*.45,z+lerp(-1.93,-.20,approach));
        signs.forEach((sign,index)=>{
          const relation=roadStops[index].z-z;
          const fade=unlocked&&index===active?smooth((48-relation)/18)*smooth((relation+10)/6):0;
          sign.position.x=sign.userData.side*(mobile?3.55:5.75);
          sign.scale.setScalar(mobile?.84:1);
          sign.visible=fade>.01;
          sign.userData.face.opacity=fade;
          sign.userData.edges.opacity=fade;
          sign.userData.glow.material.opacity=fade*.7;
          if(index<extras.length){
            const actor=extras[index];
            actor.visible=sign.visible;
            actor.position.set(sign.position.x+sign.userData.side*.8,0,roadStops[index].z-.93);
            actor.rotation.y=sign.userData.side*.65+Math.PI;
            pose(actor,time,['lean','unveil','point'][index],reduced);
          }
        });
        const power=smooth((actual-.129)/.065);
        nitro.boost.visible=power>.025;
        nitro.light.intensity=power*32;
        for(const [index,{outlet,core,edge}] of nitro.flames.entries()){
          const pulse=reduced?1:.89+.15*Math.sin(time*18+index*.7)+.07*Math.cos(time*29);
          outlet.scale.set(1,1,(.25+power)*pulse);
          core.opacity=power*.90;
          edge.opacity=power*.45;
        }
        shadow.position.set(drift,.021,z);
        shadow.scale.set(3.1+lift,6.5+lift*2.1,1);
        shadow.material.opacity=.91-lift*.21;
        reflection.position.set(drift,.027,z-2.8);
        reflection.scale.set(4.9,8.7,1);
        reflection.material.opacity=power*.67;
        const opening=1-smooth(actual/.175);
        const sideOffset=-opening*6.8-direction*lookFactor*(mobile?.55:1.8);
        const chase=mobile?18:11.6;
        camera.position.set(sideOffset,3.5+altitude*.49,z-lerp(chase,mobile?13.5:8.5,opening));
        aim.set(direction*lookFactor*(mobile?2.4:2.9),1.8+altitude*.29,z+(mobile?6.7:5.2));
      }
      if(isGate){
        gateAmount=reduced?(unlocked?1:0):Math.min(unlocked?1:0,gateAmount+dt*.45);
        for(const [index,leaf] of doors.entries())leaf.position.x=(index===0?-1:1)*(1.74+smooth(gateAmount)*3.0);
        briefcase.position.set(0,2.35+Math.sin(time*1.6)*.18,-1.7);
        briefcase.rotation.y=Math.sin(time*.55)*.44+Math.PI;
        briefcase.scale.setScalar(1.9);
        camera.position.set(0,3,-11);
        aim.set(0,2.9,0);
      }
      camera.lookAt(aim);
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
    const lost=()=>setFailed(true);
    renderer.domElement.addEventListener('webglcontextlost',lost);
    return ()=>{
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost',lost);
      renderer.domElement.remove();
      dispose(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  },[]);
  return <div className={'world '+(failed?'scene-fallback':'')} ref={root} aria-hidden="true"/>;
}
