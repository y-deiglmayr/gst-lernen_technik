/* Körper für die TZ-Lernpfade: size [Breite, Höhe, Tiefe] in Würfeln, boxes/cut als [x0,y0,d0,x1,y1,d1] */
const BODIES=[
 {id:'wuerfel',name:'Würfel',size:[3,3,3],boxes:[[0,0,0,3,3,3]]},
 {id:'saeule',name:'Säule',size:[2,5,2],boxes:[[0,0,0,2,5,2]]},
 {id:'winkel',name:'Winkel',size:[4,4,3],boxes:[[0,0,0,4,1,3],[3,1,0,4,4,3]]},
 {id:'treppe',name:'Treppe',size:[3,3,2],boxes:[[0,0,0,3,1,2],[1,1,0,3,2,2],[2,2,0,3,3,2]]},
 {id:'nut',name:'U-Profil',size:[5,3,3],boxes:[[0,0,0,5,3,3]],cut:[[2,1,0,3,3,3]]},
 {id:'rahmen',name:'Rahmen',size:[5,4,2],boxes:[[0,0,0,5,4,2]],cut:[[1,1,0,4,3,2]]},
 {id:'absatz',name:'Absatz',size:[4,3,4],boxes:[[0,0,0,4,2,4],[0,2,2,4,3,4]]},
 {id:'tunnel',name:'Tunnel',size:[4,3,3],boxes:[[0,0,0,4,3,3]],cut:[[1,0,2,3,1,3]]},
];
