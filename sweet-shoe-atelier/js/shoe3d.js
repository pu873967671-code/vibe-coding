'use strict';
// One lazily loaded WebGL renderer. The rest of the game can keep using Canvas
// during the staged migration, including file:// and devices without WebGL.
(function(A){
let THREE,renderer,scene,camera,environment,model,host,current,fallback,loading;
let lastError=null;
let fitting=false,idleTimer=0;
let request=0,frame=0,observer,drag,failed=false,angle='front34',yaw=0;
let resources=new Set();
const own=value=>(resources.add(value),value);
const TAU=Math.PI*2;
function supported(d){return ['heel','strap','decoration','charm'].every(k=>A.opts[k].some(o=>o[0]===(d[k]||'none')));}
function release(){
 cancelAnimationFrame(frame);frame=0;clearTimeout(idleTimer);idleTimer=0;fitting=false;observer?.disconnect();observer=null;
 if(host){host.closest('.runway-scene')?.classList.remove('has-fitting3d');host.classList.remove('shoe3d-host');host.closest('.stage')?.classList.remove('shoe3d-stage');}
 renderer?.domElement.remove();
 scene?.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.dispose();});
 for(const value of resources)value.dispose();resources.clear();
 if(scene){scene.clear();scene.environment=environment?.texture||null;}
 renderer?.renderLists.dispose();host=null;model=null;current=null;drag=null;
}
function unmount(){request++;release();}
function fail(){const show=fallback,stage=host?.closest('.runway-scene');failed=true;release();stage?.classList.remove('has-fitting3d');show?.();}
async function init(){
 if(renderer)return;
 THREE=await import('../vendor/three.module.min.js');
 // Probe before constructing Three's renderer, avoiding noisy WebGL errors on
 // unsupported devices. No context is allocated until a shoe is previewed.
 const canvas=document.createElement('canvas');
 if(!canvas.getContext('webgl2',{alpha:true,antialias:true}))throw Error('WebGL2 unavailable');
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 // Neutral product tone mapping preserves candy-pastel saturation; ACES was
 // visibly bleaching the chosen swatch before any specular highlight arrived.
 renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.12;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setClearColor(0x000000,0);
 renderer.domElement.className='shoe3d-canvas';renderer.domElement.tabIndex=0;
 renderer.domElement.setAttribute('role','img');
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{failed=false;});
 const {RoomEnvironment}=await import('../vendor/addons/RoomEnvironment.js');
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
 environment=pmrem.fromScene(room,.045);room.dispose();pmrem.dispose();
 scene=new THREE.Scene();scene.environment=environment.texture;scene.environmentIntensity=.5;
 camera=new THREE.OrthographicCamera(-3,3,2,-2,.1,40);
 renderer.domElement.addEventListener('dblclick',()=>{yaw=0;if(model)model.rotation.y=0;invalidate();});
 renderer.domElement.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;drag={x:e.clientX,yaw};renderer.domElement.setPointerCapture(e.pointerId);
 });
 renderer.domElement.addEventListener('pointermove',e=>{if(drag&&model){yaw=drag.yaw+(e.clientX-drag.x)*.009;model.rotation.y=yaw;invalidate();}});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>{drag=null;});
 renderer.domElement.addEventListener('keydown',e=>{
  if(!model||!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();
  yaw=e.key==='Home'?0:yaw+(e.key==='ArrowLeft'?-.18:.18);model.rotation.y=yaw;invalidate();
 });
}
// The last is sampled longitudinally; each sample lofts two curved half
// sections, with the crown removed exactly where the foot opening lies.
function last(z){
 const t=(z+1.5)/3;
 // Heel → waist → ball → almond toe. The waist is 69% of ball width;
 // closely spaced round-end sections avoid the old straight, boxy toe cap.
 const profile=[[0,.003,.22],[.018,.135,.25],[.055,.245,.27],[.13,.305,.28],[.25,.32,.29],[.38,.322,.31],[.49,.385,.34],[.63,.455,.35],[.74,.46,.33],[.83,.43,.30],[.91,.35,.25],[.965,.23,.17],[.991,.115,.09],[1,.003,.045]];
 let i=0;while(i<profile.length-2&&t>profile[i+1][0])i++;
 const a=profile[i],b=profile[i+1],p=profile[Math.max(0,i-1)],n=profile[Math.min(profile.length-1,i+2)],u=(t-a[0])/(b[0]-a[0]);
 const value=k=>{
  const m0=(b[k]-p[k])/(b[0]-p[0])*(b[0]-a[0]),m1=(n[k]-a[k])/(n[0]-a[0])*(b[0]-a[0]);
  return (2*u**3-3*u*u+1)*a[k]+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b[k]+(u**3-u*u)*m1;
 };
 const toe=Math.max(0,(t-.7)/.3);
 const lift={flat:.025,block:.64,kitten:.54,wedge:.60}[current?.heel||'flat'];
 const rear=Math.max(0,Math.min(1,(.72-t)/.48)),bend=rear*rear*(3-2*rear);
 return {width:Math.max(.003,value(1)),height:Math.max(.045,value(2)),base:.075+.075*toe*toe+lift*bend};
}
function section(z){
 // The vamp ends 33% behind the toe. A broad opening leaves low quarters;
 // the rounded ends retain a short toe cap and a low, curved heel counter.
 const p=last(z),u=(z+1.44)/1.99,hole=u>0&&u<1?p.width*.968*Math.sin(Math.PI*u)**.18:0;
 return {...p,arc:Math.acos(Math.min(.999,hole/p.width)),hole};
}
function upperGeometry(){
 const positions=[],uvs=[],indices=[],long=192,cross=40;
 for(let side=0;side<2;side++)for(let i=0;i<=long;i++){
  const z=-1.5+3*i/long,p=section(z);
  for(let j=0;j<=cross;j++){
   const theta=p.arc*j/cross;
   positions.push((side? -1:1)*p.width*Math.cos(theta),p.base+p.height*Math.sin(theta),z);
   uvs.push(side?1-theta/Math.PI:theta/Math.PI,i/long);
   if(i<long&&j<cross){const a=side*(long+1)*(cross+1)+i*(cross+1)+j,b=a+cross+1;
    if(side)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);
   }
  }
 }
 const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
 // Weld the normals at the closed vamp/heel crown without collapsing the UV seam.
 const normals=g.attributes.normal;
 for(let i=0;i<=long;i++)if(!section(-1.5+3*i/long).hole){
  const a=i*(cross+1)+cross,b=(long+1)*(cross+1)+a;
  const n=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);
 }
 return g;
}
function soleGeometry(insole=false,edge=false){
 const shape=new THREE.Shape(),steps=160,scale=insole?.94:1;
 for(let side=0;side<2;side++)for(let i=0;i<=steps;i++){
  const z=-1.5+3*(side?steps-i:i)/steps,x=(side?-1:1)*last(z).width*scale;
  if(!side&&!i)shape.moveTo(x,-z*scale);else shape.lineTo(x,-z*scale);
 }
 shape.closePath();const g=own(new THREE.ExtrudeGeometry(shape,{depth:edge?.009:insole?.016:.028,bevelEnabled:true,bevelSize:insole?.006:.009,bevelThickness:edge?.003:.005,bevelSegments:6,steps:1,curveSegments:32}));g.rotateX(-Math.PI/2);
 // The thin sole follows the arch and a restrained 2.5%-length toe spring.
 const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)+last(pos.getZ(i)).base-.075);
 g.computeVertexNormals();return g;
}
function texture(draw,size=512){
 const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
 const t=own(new THREE.CanvasTexture(c));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
}
function motifTexture(pattern){
 const map=texture((c,s)=>{
  c.fillStyle='#fff8ed';c.strokeStyle='#fff8ed';c.lineWidth=6;
  for(const [x,y] of [[128,128],[384,384]]){
   c.save();c.translate(x,y);c.rotate(-.15);
   if(pattern==='dots'){c.beginPath();c.arc(0,0,18,0,TAU);c.fill();}
   if(pattern==='hearts'){c.beginPath();c.moveTo(0,30);c.bezierCurveTo(-65,-8,-28,-55,0,-22);c.bezierCurveTo(28,-55,65,-8,0,30);c.fill();}
   if(pattern==='stars'){c.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?15:35;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();}
   if(pattern==='flowers'){for(let k=0;k<5;k++){c.save();c.rotate(k*TAU/5);c.beginPath();c.ellipse(0,-23,12,23,0,0,TAU);c.fill();c.restore();}c.fillStyle='#f4cf82';c.beginPath();c.arc(0,0,10,0,TAU);c.fill();}
   c.restore();
  }
 });map.colorSpace=THREE.SRGBColorSpace;map.repeat.set(1.6,2.8);return map;
}
function surfaceTexture(kind){
 return texture((c,s)=>{
  c.fillStyle='#ffffff';c.fillRect(0,0,s,s);
  if(kind==='mesh'){
   c.fillStyle='#222222';for(let y=0;y<s;y+=32)for(let x=0;x<s;x+=32){c.beginPath();c.ellipse(x+(y%64?16:0),y,6,8,.3,0,TAU);c.fill();}
  }else if(kind==='lace'){
   c.fillStyle='#b6b6b6';c.fillRect(0,0,s,s);c.strokeStyle='#fff';c.lineWidth=5;
   for(let y=0;y<s;y+=128)for(let x=0;x<s;x+=128){c.save();c.translate(x+(y%256?64:0),y);for(let k=0;k<6;k++){c.rotate(TAU/6);c.beginPath();c.ellipse(0,22,11,22,0,0,TAU);c.stroke();}c.restore();}
  }else{
   // Deterministic microstructure; never flickers or adds grey over the swatch.
   let seed=19;for(let i=0;i<2600;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%s;seed=(seed*1664525+1013904223)>>>0;const y=seed%s;c.fillStyle=kind==='glitter'?(i%4?'#a8a8a8':'#222222'):'#eeeeee';c.fillRect(x,y,kind==='glitter'?2:1,kind==='glitter'?2:1);}
  }
 });
}
function upperMaterial(d){
 const type=d.material,color=A.option('color',d.color)[3];
 const values={satin:{roughness:.23,metalness:0,clearcoat:.22,clearcoatRoughness:.24,sheen:.16,sheenRoughness:.4,anisotropy:.92,anisotropyRotation:Math.PI/2},velvet:{roughness:.92,sheen:1,sheenRoughness:.8},lace:{roughness:.78,sheen:.3},mesh:{roughness:.48,sheen:.45,transmission:.12,thickness:.015,ior:1.35},glitter:{roughness:.3,metalness:.22,clearcoat:.4},leather:{roughness:.43,clearcoat:.22},cotton:{roughness:.95}};
 const m=own(new THREE.MeshPhysicalMaterial({color,side:THREE.DoubleSide,...(values[type]||values.satin)}));
 m.sheenColor=new THREE.Color(color).lerp(new THREE.Color('#fff7f5'),.38);
 if(['mesh','lace','glitter','velvet','cotton'].includes(type)){
  const t=surfaceTexture(type);t.repeat.set(2,4);m.bumpMap=t;m.bumpScale=type==='glitter'?.022:.008;
  if(type==='mesh'){m.alphaMap=t;m.alphaTest=.28;}
  if(type==='lace'){m.roughnessMap=t;m.bumpScale=.018;}
  if(type==='glitter')m.roughnessMap=t;
 }
 m.userData.swatch=color;return m;
}
function mesh(g,m,parent){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function heelGeometry(type){
 const positions=[],indices=[],rings=28,segments=64;
 const top=last(-.96).base-.04;
 for(let i=0;i<=rings;i++){
  const t=i/rings,y=.018+(top-.018)*t;
  for(let j=0;j<=segments;j++){
   const a=j/segments*TAU;
   // A gently flared kitten heel, a bevelled block, or a continuous wedge.
   const width=type==='kitten'?.025+.015*(1-t)**7+.185*t**4:type==='wedge'?.17+.14*t:.175+.055*t;
   const length=type==='wedge'?.75+.25*t:type==='kitten'?.032+.014*(1-t)**7+.255*t**4:.215+.075*t;
   const power=type==='block'?.42:1;
   const cx=Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**power;
   const cz=Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**power;
   const z=type==='wedge'?-.45+cz*.99:-1.03+cz*length+.055*(1-t);
   const ceiling=last(z).base-.04;
   positions.push(cx*(type==='wedge'?last(z).width*(.87+.10*t):width),type==='wedge'?.018+(ceiling-.018)*t:y,z);
   if(i<rings&&j<segments){const k=i*(segments+1)+j,n=k+segments+1;indices.push(k,n,k+1,n,n+1,k+1);}
  }
 }
 // Closed end fans prevent holes when inspecting the underside with orbit.
 for(const row of [0,rings]){const base=positions.length/3;positions.push(0,row?(type==='wedge'?last(-.45).base-.04:top):.018,type==='wedge'?-.45:-1.03);for(let j=0;j<segments;j++){const k=row*(segments+1)+j;if(row)indices.push(base,k+1,k);else indices.push(base,k,k+1);}}
 const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function ribbon(points,width,material,parent,vertical=false,closed=false){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed),positions=[],uv=[],indices=[],steps=72,cross=6;
 // A cambered silk strip with actual edge thickness and a softly twisting fold.
 for(let layer=0;layer<2;layer++)for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
  let side=vertical==='depth'?new THREE.Vector3(0,0,1):vertical?new THREE.Vector3(0,1,0):new THREE.Vector3(-tangent.y,tangent.x,0);
  side.addScaledVector(tangent,-side.dot(tangent));if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();side.applyAxisAngle(tangent,Math.sin(t*Math.PI*2)*.28);
  const normal=new THREE.Vector3().crossVectors(tangent,side).normalize();
  const breadth=width*(closed?1:.65+.35*Math.sin(Math.PI*t)**.7);
  for(let j=0;j<=cross;j++){const u=j/cross,camber=Math.sin(u*Math.PI)*breadth*.075+(layer?.002:-.002),q=p.clone().addScaledVector(side,(u-.5)*breadth).addScaledVector(normal,camber);positions.push(q.x,q.y,q.z);uv.push(u,t);
   if(i<steps&&j<cross){const k=layer*(steps+1)*(cross+1)+i*(cross+1)+j,n=k+cross+1;if(layer)indices.push(k,n,k+1,n,n+1,k+1);else indices.push(k,k+1,n,n,k+1,n+1);}
  }
 }
 const offset=(steps+1)*(cross+1);for(let i=0;i<steps;i++)for(const j of [0,cross]){const k=i*(cross+1)+j,n=k+cross+1;indices.push(k,n,k+offset,n,n+offset,k+offset);}
 const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return mesh(g,material,parent);
}
function bow(parent,material,scale=1){
 const group=new THREE.Group();group.name='satin-loop-bow';group.scale.setScalar(scale);parent.add(group);
 for(const side of [-1,1]){
  ribbon([[side*.025,0,.008],[side*.18,.125,.025],[side*.34,.095,.075],[side*.29,-.055,.035],[side*.045,-.02,-.015]],.14,material,group);
  ribbon([[side*.025,-.025,-.012],[side*.08,-.16,.025],[side*.17,-.27,-.045]],.12,material,group);
 }
 const knot=mesh(own(new THREE.SphereGeometry(1,32,20)),material,group);knot.scale.set(.052,.066,.043);knot.name='gathered-silk-knot';return group;
}
function stitchGeometry(curve){
 const positions=[],indices=[],count=116,radial=5,along=3;
 for(let dash=0;dash<count;dash++){
  const offset=positions.length/3;
  for(let j=0;j<=along;j++){
   const t=(dash+.18+j/along*.56)/count,p=curve.getPoint(t),tangent=curve.getTangent(t),n=new THREE.Vector3(0,1,0),b=new THREE.Vector3().crossVectors(tangent,n).normalize();n.crossVectors(b,tangent).normalize();
   for(let k=0;k<=radial;k++){const a=k/radial*TAU,v=p.clone().addScaledVector(n,Math.cos(a)*.0035).addScaledVector(b,Math.sin(a)*.0035);positions.push(v.x,v.y,v.z);if(j<along&&k<radial){const q=offset+j*(radial+1)+k,r=q+radial+1;indices.push(q,r,q+1,r,r+1,q+1);}}
  }
 }
 const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
// A cut stone has a flat table, crown, thin girdle and pavilion. Flat facet
// normals let the local room reflection break into crisp jeweller-like flashes.
function crystalGeometry(){
 const positions=[],indices=[],n=12,rings=[[.052,.092],[.097,.048],[.101,.030],[.048,-.022],[0,-.065]];
 for(const [radius,y] of rings)for(let i=0;i<n;i++){const a=i/n*TAU;positions.push(Math.cos(a)*radius,y,Math.sin(a)*radius);}
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const a=r*n+i,b=r*n+(i+1)%n,c=a+n,d=b+n;indices.push(a,b,c,b,d,c);}
 const top=positions.length/3;positions.push(0,rings[0][1],0);for(let i=0;i<n;i++)indices.push(top,(i+1)%n,i);
 const indexed=new THREE.BufferGeometry();indexed.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));indexed.setIndex(indices);const g=own(indexed.toNonIndexed());indexed.dispose();g.computeVertexNormals();return g;
}
function accessories(shoe,d,material,pearlMat,metalMat,crystalMat){
 // Sockets are shoe-local and authored against the same last as the upper.
 const sockets={heelBack:[0,last(-1.42).base+.18,-1.565],toe:[0,last(.88).base+last(.88).height+.035,.88],ankle:[0,last(-.95).base+.39,-.94]};
 shoe.userData.sockets=sockets;
 const at=(name)=>{const g=new THREE.Group();g.name='socket:'+name;g.position.set(...sockets[name]);shoe.add(g);return g;};
 if(d.decoration&&d.decoration!=='none'){
  const back=at('heelBack');
  if(['small','big'].includes(d.decoration))bow(back,material,d.decoration==='big'?1.05:.72);
  if(d.decoration==='drop'){
   const chain=mesh(own(new THREE.TorusGeometry(.05,.008,8,32)),metalMat,back);chain.position.y=-.025;
   const drop=mesh(own(new THREE.SphereGeometry(.064,40,28)),pearlMat,back);drop.position.set(0,-.13,-.015);drop.scale.y=1.4;
  }
  if(d.decoration==='flower')for(let i=0;i<6;i++){
   const p=mesh(own(new THREE.SphereGeometry(.09,20,12)),i===5?pearlMat:material,back);
   if(i<5){p.position.set(Math.cos(i*TAU/5)*.105,Math.sin(i*TAU/5)*.105,-.02);p.scale.set(1,.7,.28);}else p.scale.setScalar(.65);
  }
 }
 if(d.charm&&d.charm!=='none'){
  const toe=at('toe');
  if(d.charm==='mini'){const b=bow(toe,material,.57);b.rotation.x=-Math.PI/2;}
  else{
   const bezel=mesh(own(new THREE.TorusGeometry(.095,.012,10,40)),metalMat,toe);bezel.rotation.x=-Math.PI/2;
   const gem=mesh((d.charm==='crystal'?crystalGeometry():own(new THREE.SphereGeometry(.083,40,28))),d.charm==='crystal'?crystalMat:pearlMat,toe);gem.position.y=.035;
  }
 }
 if(d.strap&&d.strap!=='none'){
  const ankle=at('ankle'),points=[];
  // Periodic curve and matched edge tangents give the satin a seamless,
  // softly sagging band, rather than an upright wire with an open join.
  for(let i=0;i<64;i++){const a=i/64*TAU;points.push(new THREE.Vector3(Math.cos(a)*.265,-.045*(1+Math.sin(a)),Math.sin(a)*.30));}
  const loop=new THREE.CatmullRomCurve3(points,true,'centripetal');
  if(d.strap==='pearl')for(let i=0;i<24;i++){const p=mesh(own(new THREE.SphereGeometry(.032,24,16)),pearlMat,ankle);p.position.copy(loop.getPoint(i/24));}
  else if(d.strap==='thin')ribbon(points.map(p=>p.toArray()),.042,material,ankle,true,true).name='closed-ankle-ribbon';
  else{
   for(const sign of d.strap==='cross'?[-1,1]:[1]){
    const path=points.map((p,i)=>[p.x,p.y+(d.strap==='cross'?sign*.055*Math.sin(i/points.length*TAU):0),p.z]);
    ribbon(path,d.strap==='ribbon'?.075:.04,material,ankle,true,true).name='closed-ankle-ribbon';
   }
   if(d.strap==='ribbon'){const tie=bow(ankle,material,.30);tie.position.set(.275,-.035,0);tie.rotation.y=Math.PI/2;tie.name='outer-ankle-bow';}
  }
  if(['thin','cross','ribbon'].includes(d.strap)){
   const frame=new THREE.CatmullRomCurve3([[-.035,-.044,0],[.035,-.044,0],[.041,.035,0],[-.035,.044,0]].map(p=>new THREE.Vector3(...p)),true);
   const buckle=mesh(own(new THREE.TubeGeometry(frame,48,.008,8,true)),metalMat,ankle);buckle.rotation.y=Math.PI/2;buckle.position.set(.272,-.028,-.025);buckle.name='polished-strap-buckle';
  }
  // Short tabs begin on the actual quarters, with a slight outward fold.
  for(const side of [-1,1])ribbon([[side*.24,-.30,-.13],[side*.275,-.17,-.14],[side*.265,-.015,-.12]],.06,material,ankle,'depth');

 }
}
function build(d,options={}){
 const g=upperGeometry(),sole=soleGeometry(),edge=soleGeometry(false,true),insole=soleGeometry(true),material=upperMaterial(d);
 const swatch=new THREE.Color(A.option('color',d.color)[3]);
 const soleMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().multiplyScalar(.43),roughness:.68}));
 const edgeMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fff5f0'),.42),roughness:.55}));
 const liningMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fff3ee'),.8),roughness:.8,sheen:.1}));
 const innerMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fff5f2'),.78),roughness:.7,side:THREE.BackSide}));
 material.side=THREE.FrontSide;
 const trimMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fff2f5'),.25),roughness:.38,sheen:.35,clearcoat:.18}));
 let motifMat;
 if(d.pattern!=='none')motifMat=own(new THREE.MeshPhysicalMaterial({map:motifTexture(d.pattern),transparent:true,alphaTest:.05,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,roughness:material.roughness,side:THREE.DoubleSide}));
 let laceMat;
 if(d.material==='lace'){
  const lace=texture((c,s)=>{c.strokeStyle='#fff6ed';c.lineWidth=4;
   for(let y=0;y<s;y+=128)for(let x=0;x<s;x+=128){c.save();c.translate(x+(y%256?64:0),y);
    for(let k=0;k<6;k++){c.rotate(TAU/6);c.beginPath();c.ellipse(0,23,10,23,0,0,TAU);c.stroke();}
    c.beginPath();c.arc(0,0,7,0,TAU);c.stroke();c.restore();
   }
  });lace.colorSpace=THREE.SRGBColorSpace;lace.repeat.set(2,4);
  laceMat=own(new THREE.MeshPhysicalMaterial({map:lace,transparent:true,opacity:.7,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,roughness:.8,side:THREE.DoubleSide}));
 }
 const rim=[],stitches=[];
 for(let side=0;side<2;side++)for(let i=0;i<=100;i++){
  const z=-1.44+1.99*(side?100-i:i)/100,p=section(z),sign=side?-1:1;
  rim.push(new THREE.Vector3(sign*p.hole,p.base+p.height*Math.sin(p.arc),z));
  // Follow the actual loft 3 mm below the collar; an arbitrary Y offset put
  // the old thread inside the upper, making it disappear in product views.
  const theta=Math.max(.025,p.arc-.12);
  stitches.push(new THREE.Vector3(sign*(p.width*Math.cos(theta)+.003),p.base+p.height*Math.sin(theta)+.003,z));
 }
 const piping=own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim,true,'centripetal'),320,.024,12,true));
 const seam=stitchGeometry(new THREE.CatmullRomCurve3(stitches,true,'centripetal'));
 const seamMat=own(new THREE.MeshStandardMaterial({color:swatch.clone().lerp(new THREE.Color('#fff5ef'),.8),roughness:.8}));
 const padGeo=own(new THREE.SphereGeometry(1,40,20)),padMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fffaf5'),.94),roughness:.88}));
 padGeo.scale(.22,.012,.48);padGeo.translate(0,0,-.72);
 const padPos=padGeo.attributes.position;for(let i=0;i<padPos.count;i++)padPos.setY(i,padPos.getY(i)+last(padPos.getZ(i)).base+.019);padGeo.computeVertexNormals();
 const accessoryMat=own(new THREE.MeshPhysicalMaterial({color:swatch.clone().lerp(new THREE.Color('#fff9f4'),.22),roughness:.26,sheen:.6,anisotropy:.7,side:THREE.DoubleSide}));
 const pearlMat=own(new THREE.MeshPhysicalMaterial({color:'#fff7ee',roughness:.16,metalness:.04,clearcoat:1,clearcoatRoughness:.12,iridescence:.28,iridescenceIOR:1.34,sheen:.35,sheenColor:'#ffe4f5'}));
 const metalMat=own(new THREE.MeshPhysicalMaterial({color:'#e8d4a3',roughness:.15,metalness:.65}));
 const crystalMat=own(new THREE.MeshPhysicalMaterial({color:'#d8ebff',roughness:.055,metalness:0,clearcoat:1,transmission:.78,thickness:.16,ior:1.65,iridescence:.35}));
 const heelMat=own(new THREE.MeshPhysicalMaterial({color:swatch,roughness:.38,clearcoat:.25}));
 const heel=heelGeometry(d.heel);
 const contact=texture((c,s)=>{
  const outline=()=>{c.beginPath();for(let side=0;side<2;side++)for(let j=0;j<=128;j++){const z=-1.5+3*(side?128-j:j)/128,x=s/2+(side?-1:1)*last(z).width/1.18*s,y=(z+1.7)/3.4*s;if(!side&&!j)c.moveTo(x,y);else c.lineTo(x,y);}c.closePath();};
  c.filter='blur(16px)';c.fillStyle='#633b5260';outline();c.fill();
  c.filter='blur(4px)';c.fillStyle='#633b5240';outline();c.fill();
  c.filter='blur(5px)';c.fillStyle='#59304740';for(const [z,w,h] of [[-.96,.23,.25],[.55,.35,.35]]){c.beginPath();c.ellipse(s/2,(z+1.7)/3.4*s,w/1.18*s,h/3.4*s,0,0,TAU);c.fill();}
 });
 const contactGeo=own(new THREE.PlaneGeometry(1.18,3.4)),contactMat=own(new THREE.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,opacity:.8}));
 model=new THREE.Group();scene.add(model);
 for(let i=0;i<2;i++){
  const shoe=new THREE.Group();shoe.position.set(i?.63:-.63,0,i?.36:-.42);shoe.rotation.y=i?-.16:.17;model.add(shoe);
  mesh(g,material,shoe).name='upper';mesh(g,innerMat,shoe).castShadow=false;if(laceMat)mesh(g,laceMat,shoe);if(motifMat)mesh(g,motifMat,shoe);
  const bottom=mesh(sole,soleMat,shoe);bottom.position.y=.012;bottom.name='outsole';
  const welt=mesh(edge,edgeMat,shoe);welt.position.y=.044;
  const footbed=mesh(insole,liningMat,shoe);footbed.position.y=.06;
  mesh(piping,trimMat,shoe).name='padded-collar-binding';mesh(seam,seamMat,shoe).name='hand-stitched-topline';
  const pad=mesh(padGeo,padMat,shoe);pad.castShadow=false;
  const labelMap=texture((c,s)=>{c.fillStyle='#9d7e8c';c.textAlign='center';c.font='42px Georgia';c.fillText('S  ·  A',s/2,s*.51);c.strokeStyle='#c9acb9';c.lineWidth=2;c.strokeRect(s*.2,s*.36,s*.6,s*.23);},256);labelMap.colorSpace=THREE.SRGBColorSpace;
  const label=mesh(own(new THREE.PlaneGeometry(.27,.23)),own(new THREE.MeshPhysicalMaterial({map:labelMap,transparent:true,depthWrite:false,roughness:.9})),shoe);label.rotation.x=-Math.PI/2;label.position.set(0,last(-.72).base+.034,-.72);label.castShadow=false;label.name='debossed-atelier-mark';
  if(heel)mesh(heel,d.heel==='flat'?soleMat:heelMat,shoe).name='heel:'+d.heel;
  if(d.heel==='wedge'){
   // A continuous contrasting satin band follows the actual side-wall arch.
   const band=heel.clone();own(band);const p=band.attributes.position;
   for(let j=0;j<p.count;j++){const z=p.getZ(j),ceiling=last(z).base-.04,t=(p.getY(j)-.018)/Math.max(.001,ceiling-.018);p.setXYZ(j,p.getX(j)*1.012,.018+(ceiling-.018)*(.56+t*.18),z);}
   band.computeVertexNormals();mesh(band,edgeMat,shoe).name='wedge-side-band';
  }
  accessories(shoe,d,accessoryMat,pearlMat,metalMat,crystalMat);
  const shadow=new THREE.Mesh(contactGeo,contactMat);shadow.rotation.x=-Math.PI/2;shadow.position.y=.003;shoe.add(shadow);
 }
 const key=new THREE.DirectionalLight('#fffaf8',2.1);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.012;key.shadow.bias=-.0001;key.shadow.radius=4;scene.add(key);
 const fill=new THREE.DirectionalLight('#fff6fb',.35);fill.position.set(4,2,1);scene.add(fill);
 const rimLight=new THREE.DirectionalLight('#fff1f5',1.2);rimLight.position.set(-2,3,-4);scene.add(rimLight);
 scene.add(new THREE.HemisphereLight('#ffffff','#dceee8',.45));
 const floor=new THREE.Mesh(own(new THREE.PlaneGeometry(50,50)),own(new THREE.ShadowMaterial({opacity:.045})));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.003;scene.add(floor);
}
function fitCamera(width,height){
 if(!model||!camera)return;
 model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity),v=new THREE.Vector3();
 model.traverseVisible(o=>{
  if(model.userData.bounds||!o.isMesh||!o.castShadow)return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
   v.set(x,y,z).applyMatrix4(o.matrixWorld).applyMatrix4(camera.matrixWorldInverse);min.min(v);max.max(v);
  }
 });
 if(model.userData.bounds){min.set(Infinity,Infinity,Infinity);max.set(-Infinity,-Infinity,-Infinity);const b=model.userData.bounds;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){v.set(x,y,z).applyMatrix4(model.matrixWorld).applyMatrix4(camera.matrixWorldInverse);min.min(v);max.max(v);}}
 const aspect=width/height,cx=(min.x+max.x)/2;let cy=(min.y+max.y)/2;
 // Eight percent of the frame is reserved at EACH edge, including the bow.
 const stage=fitting?host?.closest('.runway-scene'):null;
 const margin=stage?.classList.contains('zoomed')?.96:.90;
 const top=stage?Math.min(76,height*.13):0,bottom=stage?parseFloat(stage.style.getPropertyValue('--dock-clearance'))||190:0;
 const available=Math.max(100,height-top-bottom);
 const h=stage?Math.max((max.y-min.y)*height/available/margin,(max.x-min.x)/aspect/margin):Math.max((max.y-min.y)/.84,(max.x-min.x)/aspect/.84);
 if(stage)cy+=(top-bottom)/height*h/2;
 camera.left=cx-h*aspect/2;camera.right=cx+h*aspect/2;camera.top=cy+h/2;camera.bottom=cy-h/2;camera.updateProjectionMatrix();
}
// Single-shoe inspection uses the full-resolution live scene and refits geometry;
// no CSS scaling, snapshot enlargement or extra WebGL context is involved.
function setCloseup(value){
 if(!model||fitting)return false;
 model.userData.closeup=!!value;
 model.children.filter(o=>o.userData.sockets).forEach((o,i)=>o.visible=!value||i===0);
 if(host){fitCamera(host.clientWidth,host.clientHeight);invalidate();}return true;
}
function resize(){
 if(!host||!camera)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
 renderer.setSize(Math.round(r.width),Math.round(r.height),false);fitCamera(r.width,r.height);invalidate();
}
function invalidate(){if(frame||!host||document.hidden)return;frame=requestAnimationFrame(()=>{frame=0;if(host&&model&&host.getClientRects().length){fitCamera(host.clientWidth,host.clientHeight);renderer.render(scene,camera);}});}
function setView(value){angle=value;if(!camera)return;const rise=({flat:0,block:.64,kitten:.54,wedge:.60}[current?.heel]||0)*.20;const portrait=fitting&&host&&host.clientHeight>host.clientWidth;camera.position.set(...(angle==='top'?[.5,7,2]:angle==='side'?[6,1.9+rise,.9]:[3.6,(portrait?4.8:2.15)+rise,6]));camera.lookAt(0,.23+rise,0);yaw=0;if(model)model.rotation.y=0;if(host)fitCamera(host.clientWidth,host.clientHeight);invalidate();}
async function mount(target,design,options={}){
 const token=++request;release();if(failed||!supported(design)||typeof location==='undefined'||location.protocol==='file:')return false;
 try{
  loading=loading||init();await loading;const rigAsset=options.worn?await A.Fitting3D.load():null;if(token!==request||!target.isConnected)return false;
  host=target;current={...design};fallback=options.fallback;angle=options.angle||'front34';
  build(current);
  if(!options.worn)setCloseup(!!options.closeup);
  renderer.shadowMap.enabled=!options.worn;
  if(options.worn){A.Fitting3D.build({THREE,model,own,design:current,last,scene,gltf:rigAsset});fitting=true;}
  host.replaceChildren(renderer.domElement);host.classList.add('shoe3d-host');host.dataset.turnHint=A.lang==='zh'?'拖动欣赏 · 双击复位':'Drag to turn · double-click to reset';host.closest('.stage')?.classList.add('shoe3d-stage');
  const c=renderer.domElement;c.dataset.design=A.designKey(design);c.dataset.renderer='three';c.setAttribute('aria-label',(A.lang==='zh'?'立体小鞋预览；拖动或按左右键旋转':'3D shoe preview; drag or use arrow keys to rotate')+'. '+A.option('heel',design.heel)[1]+'. '+A.option('color',design.color)[1]);
  observer=new ResizeObserver(resize);observer.observe(host);setView(angle);resize();if(fitting){host.closest('.runway-scene')?.classList.add('has-fitting3d');animateFitting();}return true;
 }catch(error){lastError=error.stack||String(error);if(token===request){if(!options.worn)failed=true;release();options.fallback?.();}return false;}
}
function animateFitting(){
 if(!fitting||!host?.isConnected)return;
 if(!document.hidden&&!drag&&!matchMedia('(prefers-reduced-motion: reduce)').matches){model.rotation.y=yaw+Math.sin(performance.now()*.00025)*.10;invalidate();}
 idleTimer=setTimeout(animateFitting,100);
}
function updateFitting(options={}){if(!fitting||!model)return false;model.userData.poseFitting(options.pose);setView(options.angle||'front34');resize();return true;}
// Raster snapshots share this exact renderer, scene builder, camera and lights.
// Jobs are synchronous after lazy initialization, so a gallery never steals
// the live studio's canvas or leaves its scene/resources behind.
const snapshots=new Map(),snapshotJobs=new Map();let snapshotPixels=0,snapshotQueue=Promise.resolve();
async function snapshot(design,options={}){
 if(failed||!supported(design)||location.protocol==='file:')return null;
 const width=Math.min(1024,Math.max(96,Math.round(options.width||640))),height=Math.min(1024,Math.max(96,Math.round(options.height||480)));
 const view=options.angle||'front34',key='0014-showcase:'+(options.worn?'worn:':'product:')+A.designKey(design)+':'+view+':'+width+'x'+height;
 if(snapshots.has(key)){const c=snapshots.get(key);snapshots.delete(key);snapshots.set(key,c);return c;}
 if(snapshotJobs.has(key))return snapshotJobs.get(key);
 const job=snapshotQueue.then(async()=>{
  await new Promise(resolve=>setTimeout(resolve,0));
  loading=loading||init();await loading;const rigAsset=options.worn?await A.Fitting3D.load():null;if(failed)return null;
  const saved={scene,camera,model,current,resources,angle,yaw,fitting},target=renderer.getRenderTarget(),oldSize=renderer.getSize(new THREE.Vector2());let rt;
  try{
   scene=new THREE.Scene();scene.environment=environment.texture;scene.environmentIntensity=.5;
   camera=new THREE.OrthographicCamera(-3,3,2,-2,.1,40);model=null;current={...design};resources=new Set();fitting=false;
   build(current);if(options.worn){A.Fitting3D.build({THREE,model,own,design:current,last,scene,gltf:rigAsset});fitting=true;}setView(view);fitCamera(width,height);
   rt=new THREE.WebGLRenderTarget(width,height,{depthBuffer:true,type:THREE.HalfFloatType,samples:2});
   renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,camera);
   // Render targets contain linear HDR light. The same Neutral/sRGB output
   // transform as the studio runs once, in this final screen pass.
   const output=new THREE.Scene(),quad=mesh(own(new THREE.PlaneGeometry(2,2)),own(new THREE.MeshBasicMaterial({map:rt.texture,transparent:true,blending:THREE.NoBlending,premultipliedAlpha:true,depthTest:false})),output);
   quad.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb /= max(diffuseColor.a, 0.00001);');};
   quad.castShadow=false;renderer.setRenderTarget(null);renderer.setSize(width/renderer.getPixelRatio(),height/renderer.getPixelRatio(),false);renderer.clear();renderer.render(output,new THREE.OrthographicCamera(-1,1,1,-1,0,1));
   const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').drawImage(renderer.domElement,0,0,width,height);
   snapshots.set(key,c);snapshotPixels+=width*height;
   // At most 8 million cached pixels (~32 MiB), including thumbnails.
   while(snapshotPixels>8000000&&snapshots.size>1){const oldest=snapshots.keys().next().value,old=snapshots.get(oldest);snapshotPixels-=old.width*old.height;snapshots.delete(oldest);}
   return c;
  }finally{
   renderer.setRenderTarget(target);renderer.setSize(oldSize.x,oldSize.y,false);rt?.dispose();scene.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.dispose();});for(const r of resources)r.dispose();scene.clear();renderer.renderLists.dispose();
   ({scene,camera,model,current,resources,angle,yaw,fitting}=saved);if(host)invalidate();
  }
 }).catch(error=>{lastError=error.stack||String(error);return null;}).finally(()=>snapshotJobs.delete(key));
 snapshotQueue=job; snapshotJobs.set(key,job);return job;
}
const snapshotPaints=new WeakMap();
async function paintSnapshot(target,design,options={}){
 const token={};snapshotPaints.set(target,token);
 if(!target?.isConnected)return false;
 const source=await snapshot(design,options);
 if(!source||!target.isConnected||snapshotPaints.get(target)!==token)return false;
 const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.className='shoe3d-snapshot';c.dataset.renderer='three-snapshot';c.dataset.snapshotDesign=A.designKey(design);c.dataset.snapshotAngle=options.angle||'front34';c.dataset.snapshotWorn=String(!!options.worn);
 c.setAttribute('role','img');c.setAttribute('aria-label',A.option('color',design.color)[1]+' · '+A.option('heel',design.heel)[1]);c.getContext('2d').drawImage(source,0,0);
 target.replaceChildren(c);target.classList.add('has-shoe3d-snapshot');return true;
}
// Debug information is read-only and also used by browser acceptance checks.
function info(){
 let quality=null;
 if(model&&camera){
  const bounds={left:1,right:-1,top:-1,bottom:1};model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const v=new THREE.Vector3();model.traverseVisible(o=>{if(!o.isMesh||!o.castShadow)return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).project(camera);bounds.left=Math.min(bounds.left,v.x);bounds.right=Math.max(bounds.right,v.x);bounds.top=Math.max(bounds.top,v.y);bounds.bottom=Math.min(bounds.bottom,v.y);}});
  const mid=section(-.44);
  quality={waistRatio:last(-.36).width/last(.72).width,toeSpring:last(1.5).base-last(.72).base,openingToeFraction:(1.5-.55)/3,openingWidthRatio:mid.hole/mid.width,quarterHeightRatio:Math.sin(mid.arc),heelCounterHeight:last(-1.44).height,outsoleThickness:.038,cameraElevation:Math.atan2(camera.position.y-.23,Math.hypot(camera.position.x,camera.position.z))*180/Math.PI,heightFraction:(bounds.top-bounds.bottom)/2,bounds,toneMapping:'Neutral',sockets:model.children.filter(o=>o.userData.sockets).map(o=>o.userData.sockets)};
 }
 const anatomy=fitting?{pitch:model.userData.pitch,legs:model.userData.legs.map(l=>({thigh:l.thigh.quaternion.toArray(),calf:l.calf.quaternion.toArray(),ankle:l.foot.quaternion.toArray(),toe:l.toe.quaternion.toArray(),shoePosition:l.shoe.getWorldPosition(new THREE.Vector3()).toArray(),shoeQuaternion:l.shoe.getWorldQuaternion(new THREE.Quaternion()).toArray(),heelMeshes:l.shoe.children.filter(o=>o.name.startsWith('heel:')).map(o=>o.name)}))}:null;
 const products=model?.children.filter(o=>o.userData.sockets).map(o=>({position:o.position.toArray(),rotation:o.rotation.toArray(),heelMeshes:o.children.filter(c=>c.name.startsWith('heel:')).map(c=>c.name)}))||[];
 return {fitting,products,presentation:model?.userData.presentation||'studio',closeup:!!model?.userData.closeup,anatomy,pose:model?.userData.pose,feet:model?.userData.legs?.length||0,ready:!!host,error:lastError,contexts:renderer?1:0,revision:THREE?.REVISION,triangles:renderer?.info.render.triangles||0,resources:resources.size,swatch:current?A.option('color',current.color)[3]:null,heel:current?.heel,material:current?.material,pattern:current?.pattern,pixelRatio:renderer?.getPixelRatio(),pendingFrame:!!frame,snapshots:snapshots.size,snapshotPixels,quality};
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else invalidate();});
A.Shoe3D={mount,unmount,updateFitting,supported,setView,setCloseup,resize,snapshot,paintSnapshot,info};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
