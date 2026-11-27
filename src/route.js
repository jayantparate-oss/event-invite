export const roadStops=[
  {words:['BACHHE KA AGLA','CHAPTER','CURIOUSJR KE SAATH'],z:25,color:0xffa451,pale:0xffe3b0},
  {words:['ANNUAL MEGA','EVENT'],z:63,color:0x60cfff,pale:0xc1f3ff},
  {words:['WITH SENIOR','FACULTIES','& LEADERSHIP TEAM'],z:101,color:0xff70b1,pale:0xffc6e6},
  {words:['ON 27TH NOV','AT 7:30 PM'],z:139,color:0xffa451,pale:0xffe6b8},
];
export function flightZ(progress) {
  return Math.max(0,Math.min(1,(progress-.132)/.868))*140;
}
export function stopIndex(progress){
  const readingZ=flightZ(progress)+7;
  const next=roadStops.findIndex((stop,index)=>index===roadStops.length-1 || readingZ<(stop.z+roadStops[index+1].z)/2);
  return Math.max(0,next);
}
