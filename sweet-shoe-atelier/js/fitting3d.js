'use strict';
// One shoes-only glass showcase. The authored pair is shared with the studio.
(function(A){
 A.Fitting3D={async load(){return null;},build({model}){
  const shoes=model.children.filter(o=>o.userData.sockets);
  model.userData.fitting=true;model.userData.presentation='product';
  model.userData.legs=[];model.userData.pitch=0;
  model.userData.poseFitting=()=>{
   shoes.forEach((shoe,i)=>{shoe.position.set(i?.66:-.66,0,i?.30:-.25);shoe.rotation.set(0,i?-.14:.14,0);});
   model.userData.pose='stand';
  };
  model.userData.poseFitting();return {shoes,pedestal:null};
 }};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
