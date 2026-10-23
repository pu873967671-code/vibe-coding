'use strict';
// Supervisor 00:14: product display until worn anatomy passes visual review.
// Uses the studio's exact shoes; no body/model load or hidden skin proxies.
(function(A){
A.Fitting3D={async load(){return null;},build({THREE:T,model,own}){
 const shoes=model.children.filter(o=>o.userData.sockets);
 const mint=own(new T.MeshPhysicalMaterial({color:'#d6f3e7',roughness:.42,clearcoat:.22}));
 const porcelain=own(new T.MeshPhysicalMaterial({color:'#fff8f5',roughness:.48,clearcoat:.15}));
 const rim=own(new T.MeshStandardMaterial({color:'#b4dfcc',roughness:.55,metalness:.12}));
 const pedestal=new T.Group();pedestal.name='porcelain-product-pedestal';model.add(pedestal);
 for(const [radius,height,y,material] of [[2.28,.18,-.12,mint],[2.20,.055,-.003,porcelain],[2.24,.025,-.065,rim]]){
  const disc=new T.Mesh(own(new T.CylinderGeometry(radius,radius+.018,height,128)),material);
  disc.position.y=y;disc.receiveShadow=true;pedestal.add(disc);
 }
 // The studio's sole contact textures remain attached above the porcelain.
 model.userData.fitting=true;model.userData.presentation='product';
 model.userData.legs=[];model.userData.pitch=0;
 model.userData.poseFitting=(value='stand')=>{
  shoes.forEach((shoe,i)=>{
   const fan=value==='tiptoe',offset=value==='step';
   shoe.position.set(i?.66:-.66,.027,i?(offset?.68:.30):(offset?-.58:-.25));
   shoe.rotation.set(0,(i?-1:1)*(fan?.36:.14),0);
  });
  model.userData.pose=value;
 };
 model.userData.poseFitting();
 return {shoes,pedestal};
}};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
