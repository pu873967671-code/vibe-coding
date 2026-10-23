'use strict';
// Rigged CC0 lower-body fitting, sharing Shoe3D's renderer and exact shoe meshes.
(function(A){

function softSurface(T,source,own){
 const p=source.attributes.position,lookup=new Map(),weights=[],faces=[];
 const vertex=i=>{const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!lookup.has(key)){lookup.set(key,weights.length);weights.push(new Map([[i,1]]));}return lookup.get(key);};
 for(let i=0;i<source.index.count;i+=3)faces.push([0,1,2].map(j=>vertex(source.index.getX(i+j))));
 let ws=weights,fs=faces;
 const blend=parts=>{const m=new Map();for(const [w,k] of parts)for(const [i,v] of w)m.set(i,(m.get(i)||0)+v*k);return m;};
 for(let pass=0;pass<2;pass++){
  const neighbors=ws.map(()=>new Set()),edges=new Map();
  for(const f of fs)for(let j=0;j<3;j++){const a=f[j],b=f[(j+1)%3],c=f[(j+2)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');neighbors[a].add(b);neighbors[b].add(a);if(!edges.has(key))edges.set(key,{a,b,op:[]});edges.get(key).op.push(c);}
  const boundary=ws.map(()=>[]);for(const e of edges.values())if(e.op.length===1){boundary[e.a].push(e.b);boundary[e.b].push(e.a);}
  const next=ws.map((w,i)=>{const n=[...neighbors[i]],b=boundary[i];if(b.length===2)return blend([[w,.75],[ws[b[0]],.125],[ws[b[1]],.125]]);const beta=n.length===3?3/16:3/(8*Math.max(1,n.length));return blend([[w,1-n.length*beta],...n.map(j=>[ws[j],beta])]);});
  for(const e of edges.values()){e.id=next.length;next.push(e.op.length===2?blend([[ws[e.a],.375],[ws[e.b],.375],...e.op.map(i=>[ws[i],.125])]):blend([[ws[e.a],.5],[ws[e.b],.5]]));}
  const id=(a,b)=>edges.get([Math.min(a,b),Math.max(a,b)].join(':')).id,nf=[];
  for(const [a,b,c] of fs){const ab=id(a,b),bc=id(b,c),ca=id(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);}ws=next;fs=nf;
 }
 const geometry=own(new T.BufferGeometry()),pos=new T.Float32BufferAttribute(new Float32Array(ws.length*3),3),colors=new T.Float32BufferAttribute(new Float32Array(ws.length*3).fill(1),3);geometry.setAttribute('position',pos);geometry.setAttribute('color',colors);geometry.setIndex(fs.flat());
 return {geometry,update(values){for(let i=0;i<ws.length;i++){let x=0,y=0,z=0,restY=0;for(const [j,k] of ws[i]){x+=values[j*3]*k;y+=values[j*3+1]*k;z+=values[j*3+2]*k;restY+=p.getY(j)*k;}
  pos.setXYZ(i,x,y,z);const blush=Math.exp(-(((restY-.405)/.035)**2))*.075+Math.exp(-(((restY-.17)/.028)**2))*.045;colors.setXYZ(i,1,1-blush,1-blush*.7);
 }pos.needsUpdate=true;colors.needsUpdate=true;geometry.computeVertexNormals();}};
}
A.Fitting3D={async load(){const {GLTFLoader}=await import('../vendor/addons/GLTFLoader.js');return new GLTFLoader().loadAsync('assets/models/female_base.gltf');},build({THREE:T,model,own,design,last,scene,gltf}){
 const rig=gltf.scene,body=rig.getObjectByName('Superhero_Female');
 if(!body?.isSkinnedMesh)throw Error('Fitting skeleton unavailable');
 const shoes=model.children.slice();
 // Three broad, softly interpolated light bands keep the skin porcelain and warm.
 const ramp=own(new T.DataTexture(new Uint8Array([164,164,164,255,213,213,213,255,255,255,255,255]),3,1,T.RGBAFormat));ramp.minFilter=T.LinearFilter;ramp.magFilter=T.LinearFilter;ramp.needsUpdate=true;
 const skin=own(new T.MeshToonMaterial({color:'#ffe0cf',emissive:'#ffd9c7',emissiveIntensity:.12,gradientMap:ramp,vertexColors:true,side:T.DoubleSide}));
 skin.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float ndl = dot(normal, normalize(vec3(-0.65, 0.75, 1.0)));
 float bands = 0.62 + 0.23 * smoothstep(-0.15, 0.18, ndl) + 0.15 * smoothstep(0.42, 0.68, ndl);
 float rim = pow(1.0 - max(dot(normal, normalize(vViewPosition)), 0.0), 3.0);
 outgoingLight = diffuseColor.rgb * bands * 1.10 + vec3(0.08, 0.045, 0.04) * rim;
 #include <opaque_fragment>`);};
 rig.traverse(o=>{if(o.isMesh){own(o.geometry);if(Array.isArray(o.material))o.material.forEach(own);else own(o.material);if(o!==body)o.visible=false;}});
 // Remove the unused upper body and covered toes, rather than collapse bones.
 // The retained ankle is continuous with a fitted skin last inside each shoe.
 const g=body.geometry.clone();own(g);const p=g.attributes.position,idx=g.index,keep=[];
 for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];if(ids.every(j=>p.getY(j)<.765)&&ids.every(j=>p.getY(j)>.105))keep.push(...ids);}
 g.setIndex(keep);g.computeBoundingBox();body.geometry=g;body.material=skin;body.castShadow=false;body.receiveShadow=false;body.frustumCulled=false;
 rig.scale.set(10,8.3,10);model.add(rig);rig.updateMatrixWorld(true);
 // Relax the original low-poly silhouette twice with a welded Loop surface.
 // Subdivision weights are built once; each new pose only evaluates the weights.
 const smooth=softSurface(T,g,own),baked=smooth.geometry,visibleBody=new T.Mesh(baked,skin);body.visible=false;visibleBody.name='posed-lower-body';rig.add(visibleBody);
 const lift=({flat:.025,kitten:.54,block:.64,wedge:.60}[design.heel]||0),pitch=Math.atan(lift/2.05);
 const legs=['l','r'].map((side,i)=>{
  const thigh=rig.getObjectByName('thigh_'+side),calf=rig.getObjectByName('calf_'+side),foot=rig.getObjectByName('foot_'+side),toe=rig.getObjectByName('ball_'+side);
  const shoe=shoes[i];shoe.position.set(0,0,0);shoe.rotation.set(0,0,0);foot.add(shoe);shoe.scale.setScalar(.1);
  // A foot-shaped skin insert is bounded by the SAME last as the shoe upper.
  // Covered toes are intentionally omitted, eliminating toe/sole intersections.
  const vertices=[],indices=[],rows=36,cols=24;
  for(let a=0;a<=rows;a++){const z=-1.40+1.91*a/rows,q=last(z);for(let b=0;b<=cols;b++){const t=b/cols*Math.PI,x=Math.cos(t)*q.width*.91;vertices.push(x,q.base+.025+Math.sin(t)*q.height*.55,z);if(a<rows&&b<cols){const k=a*(cols+1)+b,n=k+cols+1;indices.push(k,n,k+1,n,n+1,k+1);}}}
  const fg=own(new T.BufferGeometry());fg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));fg.setIndex(indices);fg.computeVertexNormals();fg.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(vertices.length).fill(1),3));const insert=new T.Mesh(fg,skin);insert.castShadow=true;shoe.add(insert);
  const bridgeGeometry=own(new T.BufferGeometry()),bridgePositions=new T.Float32BufferAttribute(new Float32Array(13*41*3),3),bridgeIndices=[];
  for(let row=0;row<12;row++)for(let col=0;col<40;col++){const k=row*41+col,n=k+41;bridgeIndices.push(k,n,k+1,n,n+1,k+1);}
  bridgeGeometry.setAttribute('position',bridgePositions);bridgeGeometry.setIndex(bridgeIndices);bridgeGeometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(13*41*3).fill(1),3));const bridge=new T.Mesh(bridgeGeometry,skin);bridge.castShadow=true;rig.add(bridge);
  const ankleVertices=[];for(let j=0;j<p.count;j++)if(p.getY(j)>.14&&p.getY(j)<.18&&(p.getX(j)>0)===(side==='l'))ankleVertices.push(j);
  const parentQ=foot.parent.getWorldQuaternion(new T.Quaternion()),restQ=foot.getWorldQuaternion(new T.Quaternion());
  const posed=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),pitch).multiply(restQ);foot.quaternion.copy(parentQ.invert().multiply(posed));toe.rotateX(-pitch*.55);
  return {thigh,calf,foot,toe,shoe,bridge,ankleVertices,restThigh:thigh.quaternion.clone(),restCalf:calf.quaternion.clone()};
 });
 // A fluted, layered mint skirt conceals the mid-thigh cut, including orbit views.
 const skirt=new T.Group();model.add(skirt);const mint=own(new T.MeshStandardMaterial({color:'#b5ead6',roughness:.85,side:T.DoubleSide})),cream=own(new T.MeshStandardMaterial({color:'#fff8fa',roughness:.85,side:T.DoubleSide}));
 for(let layer=0;layer<2;layer++){
  const sg=own(new T.CylinderGeometry(2.18-layer*.025,2.46-layer*.035,3.45,128,20,true));const v=sg.attributes.position;
  for(let i=0;i<v.count;i++){const x=v.getX(i),z=v.getZ(i),angle=Math.atan2(z,x),r=1+Math.cos(angle*14)*.028;v.setXYZ(i,x*r,v.getY(i)+Math.cos(angle*14)*.055,z*r);}
  sg.computeVertexNormals();const s=new T.Mesh(sg,layer?cream:mint);s.position.set(0,5.25-layer*.10,0);s.scale.z=1.0;s.castShadow=true;skirt.add(s);s.name=layer?'cream-scalloped-petticoat':'mint-pleated-skirt';
 }
 const hemPoints=[];for(let i=0;i<=168;i++){const a=i/168*Math.PI*2,r=2.43*(1+Math.cos(a*14)*.028);hemPoints.push(new T.Vector3(Math.cos(a)*r,3.425+Math.cos(a*14)*.055,Math.sin(a)*r));}
 const trim=new T.Mesh(own(new T.TubeGeometry(new T.CatmullRomCurve3(hemPoints,true),336,.025,8,true)),cream);skirt.add(trim);
 // A shallow mint plinth and soft individual contacts keep the pair grounded.
 const floor=new T.Mesh(own(new T.CylinderGeometry(2.78,2.86,.10,128)),own(new T.MeshBasicMaterial({color:'#e4f6ee'})));floor.position.y=-.09;floor.receiveShadow=true;model.add(floor);
 model.userData.fitting=true;model.userData.rig=rig;model.userData.legs=legs;model.userData.pitch=pitch;
 model.userData.bounds=new T.Box3(new T.Vector3(-2.20,-.16,-1.62),new T.Vector3(2.20,4.35,2.28));
 const key=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);if(key){key.intensity=1.55;key.position.set(-6,12,8);key.shadow.camera.top=10;key.shadow.camera.bottom=-10;key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.updateProjectionMatrix();}
 scene.children.filter(o=>o.isDirectionalLight&&o!==key).forEach(o=>o.intensity=.32);scene.children.filter(o=>o.isHemisphereLight).forEach(o=>o.intensity=.42);
 function pose(value='stand'){
  rig.position.y=lift;legs.forEach((l,i)=>{l.thigh.quaternion.copy(l.restThigh);l.calf.quaternion.copy(l.restCalf);const sign=i?1:-1;
   l.thigh.rotateX(value==='step'?(i?.11:-.16):value==='tiptoe'?(i?.06:-.03):(i?.025:-.025));
   l.thigh.rotateZ(value==='tiptoe'?sign*-.14:sign*.025);
   l.calf.rotateX(value==='step'?(i?-.06:.15):0);
  });
  rig.updateMatrixWorld(true);
  // Bind once. Recomputing a world-upright shoe every pose cancelled the real
  // ankle rotation and pinned both soles down even when the knee stepped.
  legs.forEach(l=>{if(l.bound)return;const f=l.foot.getWorldPosition(new T.Vector3());model.worldToLocal(f);const desired=new T.Matrix4().makeTranslation(f.x,0,f.z+.94).premultiply(model.matrixWorld);const local=l.foot.matrixWorld.clone().invert().multiply(desired);local.decompose(l.shoe.position,l.shoe.quaternion,l.shoe.scale);l.bound=true;});
  rig.updateMatrixWorld(true);
  let ground=Infinity;const solePoint=new T.Vector3();for(const l of legs){for(const o of l.shoe.children.filter(o=>o.name==='outsole'||o.name.startsWith('heel:'))){const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++){solePoint.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);model.worldToLocal(solePoint);ground=Math.min(ground,solePoint.y);}}}
  if(Number.isFinite(ground))rig.position.y-=ground-.015;rig.updateMatrixWorld(true);
  body.skeleton.update();const point=new T.Vector3(),posedPositions=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);body.applyBoneTransform(i,point);posedPositions.set([point.x,point.y,point.z],i*3);}
  smooth.update(posedPositions);
  for(const l of legs){
   const center=new T.Vector3();for(const i of l.ankleVertices)center.add(new T.Vector3().fromArray(posedPositions,i*3));center.divideScalar(l.ankleVertices.length);
   let rx=0,rz=0;for(const i of l.ankleVertices){rx=Math.max(rx,Math.abs(posedPositions[i*3]-center.x));rz=Math.max(rz,Math.abs(posedPositions[i*3+2]-center.z));}
   const start=new T.Vector3(0,last(-1.02).base+.18,-1.02);l.shoe.localToWorld(start);rig.worldToLocal(start);
   const positions=l.bridge.geometry.attributes.position;for(let row=0;row<=12;row++){const t=row/12,c=start.clone().lerp(center,t);for(let col=0;col<=40;col++){const a=col/40*Math.PI*2;positions.setXYZ(row*41+col,c.x+Math.cos(a)*(.027*(1-t)+rx*1.01*t),c.y,c.z+Math.sin(a)*(.029*(1-t)+rz*1.01*t));}}
   positions.needsUpdate=true;l.bridge.geometry.computeVertexNormals();
  }
  model.userData.pose=value;
 }
 pose();model.userData.poseFitting=pose;
 return {rig,legs};
}};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
