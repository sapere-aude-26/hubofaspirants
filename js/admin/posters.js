/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #22 (id: hoa-v59-poster-js).
   Execution position intentionally preserved from V6.0.9. */


(function(){
"use strict";
var BUCKET="posters",timer=null,current=0,slides=[];
function client(){
  try{
    if(typeof supabaseClient!=="undefined" && supabaseClient) return supabaseClient;
  }catch(e){}
  return null;
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]})}
function setMsg(t){var e=document.getElementById("hoaV59AdminMsg");if(e)e.textContent=t}
async function sessionOrFail(){
 var s=client(); if(!s||!s.auth)throw new Error("Supabase client is not available.");
 var r=await s.auth.getSession();
 if(r.error)throw r.error;
 if(!r.data||!r.data.session)throw new Error("Please log in to the Admin account again before uploading.");
 return r.data.session;
}
async function getActive(){
 var s=client();if(!s||!s.from)return[];
 var r=await s.from("poster_slides").select("id,title,storage_path,sort_order,is_active").eq("is_active",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
 if(r.error){console.warn("Poster load failed",r.error);return[]}
 return r.data||[];
}
function url(path){var s=client();if(!s)return"";var x=s.storage.from(BUCKET).getPublicUrl(path);return x&&x.data?x.data.publicUrl:""}
function render(){
 var box=document.getElementById("hoaV59Showcase");if(!box)return;
 if(!slides.length){box.innerHTML='<div class="hoa-v59-empty">Your latest HUB OF ASPIRANTS posters will appear here.</div>';return}
 current=(current+slides.length)%slides.length;
 box.innerHTML=slides.map(function(x,i){return '<div class="hoa-v59-slide '+(i===current?"active":"")+'"><img src="'+esc(url(x.storage_path))+'" alt="'+esc(x.title||"HUB OF ASPIRANTS")+'" loading="'+(i?"lazy":"eager")+'"></div>'}).join("")+
 '<button class="hoa-v59-arrow hoa-v59-prev" aria-label="Previous poster">‹</button><button class="hoa-v59-arrow hoa-v59-next" aria-label="Next poster">›</button>'+
 '<div class="hoa-v59-dots">'+slides.map(function(_,i){return '<span class="hoa-v59-dot '+(i===current?"active":"")+'" data-i="'+i+'"></span>'}).join("")+'</div>';
 box.querySelector(".hoa-v59-prev").onclick=function(){current=(current-1+slides.length)%slides.length;render();restart()};
 box.querySelector(".hoa-v59-next").onclick=function(){current=(current+1)%slides.length;render();restart()};
 box.querySelectorAll(".hoa-v59-dot").forEach(function(d){d.onclick=function(){current=Number(d.dataset.i);render();restart()}})
}
function restart(){clearInterval(timer);if(slides.length>1)timer=setInterval(function(){current=(current+1)%slides.length;render()},5000)}
async function load(){slides=await getActive();current=0;render();restart()}
function findLogin(){
 var candidates=["studentLogin","student-login","loginPage","loginPanel","authPage"];
 for(var i=0;i<candidates.length;i++){var e=document.getElementById(candidates[i]);if(e)return e}
 return null
}
function mount(){
 if(document.getElementById("hoaV59Showcase"))return;
 var host=document.getElementById("studentLogin");
 if(!host)return;
 var wrap=document.createElement("div");wrap.id="hoaV59PosterWrap";wrap.innerHTML='<div id="hoaV59Showcase" class="hoa-v59-showcase" aria-label="HUB OF ASPIRANTS posters"></div>';
 host.parentNode.insertBefore(wrap,host);
 load();
}
function adminMount(){
  var admin=document.getElementById("adminOnlyDashboard");
  var host=document.getElementById("hoaPosterAdminHost");
  if(!admin||!host||document.getElementById("hoaV59Admin"))return;
  var d=document.createElement("section");d.id="hoaV59Admin";d.className="hoa-v59-admin hoa-v59-admin-shell";
  d.innerHTML='<p class="hoa-v59-mini">Upload posters to Supabase Storage. Only active posters appear on the Student login screen.</p>'+
  '<div><input id="hoaV59File" type="file" accept="image/png,image/jpeg,image/webp"><input id="hoaV59Title" placeholder="Poster title"><input id="hoaV59Order" type="number" placeholder="Order" value="0"> <button id="hoaV59Upload">Upload Poster</button></div><div id="hoaV59AdminMsg"></div><div id="hoaV59AdminList"></div>';
  host.appendChild(d);
  document.getElementById("hoaV59Upload").onclick=upload;
  refreshAdmin();
}
async function upload(){
 var s=client(),f=document.getElementById("hoaV59File").files[0];
 if(!f){setMsg("Choose a poster first.");return}
 if(f.size>10*1024*1024){setMsg("Poster is larger than 10 MB. Please use a smaller image.");return}
 try{
  setMsg("Checking Admin session...");
  await sessionOrFail();
  setMsg("Uploading poster...");
  var safe=f.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-"),path="slides/"+Date.now()+"-"+safe;
  var u=await s.storage.from(BUCKET).upload(path,f,{contentType:f.type,upsert:false});
  if(u.error)throw new Error("Storage upload failed: "+u.error.message);
  setMsg("Saving poster record...");
  var ins=await s.from("poster_slides").insert({
    title:document.getElementById("hoaV59Title").value.trim()||f.name,
    storage_path:path,
    sort_order:Number(document.getElementById("hoaV59Order").value||0),
    is_active:true
  });
  if(ins.error){
   await s.storage.from(BUCKET).remove([path]);
   throw new Error("Poster database record failed: "+ins.error.message);
  }
  setMsg("Poster uploaded successfully.");
  document.getElementById("hoaV59File").value="";
  document.getElementById("hoaV59Title").value="";
  await refreshAdmin();await load();
 }catch(e){console.error(e);setMsg(e.message||String(e))}
}
async function refreshAdmin(){
 var s=client(),c=document.getElementById("hoaV59AdminList");if(!s||!c)return;
 var r=await s.from("poster_slides").select("*").order("sort_order",{ascending:true});
 if(r.error){c.textContent="Could not load poster list: "+r.error.message;return}
 c.innerHTML='<table class="hoa-v59-list"><thead><tr><th>Poster</th><th>Order</th><th>Active</th><th>Action</th></tr></thead><tbody>'+
 (r.data||[]).map(function(x){return '<tr><td>'+esc(x.title)+'</td><td>'+esc(x.sort_order)+'</td><td>'+esc(x.is_active)+'</td><td><button data-toggle="'+esc(x.id)+'">'+(x.is_active?"Deactivate":"Activate")+'</button> <button data-del="'+esc(x.id)+'">Delete</button></td></tr>'}).join("")+
 '</tbody></table>';
 c.querySelectorAll("[data-toggle]").forEach(function(b){b.onclick=async function(){try{await sessionOrFail();var x=(r.data||[]).find(function(a){return a.id===b.dataset.toggle});if(!x)return;var z=await s.from("poster_slides").update({is_active:!x.is_active,updated_at:new Date().toISOString()}).eq("id",x.id);if(z.error)throw z.error;await refreshAdmin();await load()}catch(e){alert("Poster update failed: "+e.message)}}})
 c.querySelectorAll("[data-del]").forEach(function(b){b.onclick=async function(){try{if(!confirm("Delete this poster permanently?"))return;await sessionOrFail();var x=(r.data||[]).find(function(a){return a.id===b.dataset.del});if(!x)return;var z=await s.from("poster_slides").delete().eq("id",x.id);if(z.error)throw z.error;var rm=await s.storage.from(BUCKET).remove([x.storage_path]);if(rm.error)throw rm.error;await refreshAdmin();await load()}catch(e){alert("Poster delete failed: "+e.message)}}})
}
function boot(){
  mount();
  adminMount();
}
function waitForSupabase(){
  try{
    if(typeof supabaseClient!=="undefined" && supabaseClient){boot();return}
  }catch(e){}
  setTimeout(waitForSupabase,300);
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){waitForSupabase()});
}else{
  waitForSupabase();
}
})();
