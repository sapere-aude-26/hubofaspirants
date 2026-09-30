/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #42 (id: hoa-v645-permissions-js).
   Execution position intentionally preserved from V6.0.9. */


(function(){
"use strict";
const V="HOA V6.0.4";
const ROLE_LABELS={
 owner:"Super Admin / Owner",admin:"Admin"
};
const PERMS=[
 ["students","Students",["students.view","students.manage"]],
 ["tests","Mock Tests",["tests.view","tests.manage"]],
 ["courses","Courses",["courses.view","courses.manage"]],
 ["classes","Classes & Videos",["classes.view","classes.manage"]],
 ["notes","Notes",["notes.view","notes.manage"]],
 ["student_access","Student Access",["student_access.view","student_access.manage"]],
 ["results","Results",["results.view","results.manage"]],
 ["posters","Posters",["posters.view","posters.manage"]]
];
const ALL=PERMS.flatMap(x=>x[2]);
const C=()=>window.supabaseClient||window.supabase||null;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const call=async(action,body)=>{
 const c=C();if(!c)throw Error("Supabase is not connected.");
 const r=await c.functions.invoke("admin-manage-admin",{body:Object.assign({action},body||{})});
 if(r.error)throw r.error;if(r.data?.error)throw Error(r.data.error);return r.data;
};
function labelPerm(p){
 const parts=p.split(".");
 const names={view:"View",manage:"Manage"};
 return names[parts[1]]||p;
}
function roleLabel(r){return ROLE_LABELS[r]||r||"Admin";}
function has(p){return window.hoaAdminRole==="owner"||((window.hoaAdminPermissions||[]).indexOf(p)>=0)}

async function loadOwnPermissions(){
 const c=C();if(!c)return;
 try{
   const roleResult=await c.rpc("get_admin_role"); if(roleResult.error)throw roleResult.error;
   const role=window.hoaNormalizeAdminRole?window.hoaNormalizeAdminRole(roleResult.data):(roleResult.data||"none");
   window.hoaAdminRole=role;
   if(role==="owner") window.hoaAdminPermissions=ALL.concat(["admin.manage","developer_console"]);
   else{
     const r=await c.rpc("get_admin_permissions");
     window.hoaAdminPermissions=(r.data||[]).map(x=>typeof x==="string"?x:x.permission);
   }
 }catch(e){console.warn(V+" permission load failed",e);window.hoaAdminPermissions=[]}
 applyPermissionUI();
}

function panelPermission(panelId, viewPerm, managePerm){
 const panel=document.getElementById(panelId);if(!panel)return;
 const canView=has(viewPerm)||has(managePerm);
 const canManage=has(managePerm);
 const nav=document.querySelector("#adminOnlyDashboard .adminSectionNav");
 if(nav){
   const btn=nav.querySelector(`[data-perm-panel="${panelId}"]`);
   if(btn)btn.style.display=canView?"":"none";
 }
 panel.style.display=canView?"":"none";
 if(!canView)return;
 panel.querySelectorAll("input,select,textarea,button").forEach(el=>{
   if(el.closest(".hoa645-access-editor"))return;
   if(el.dataset.permissionControl==="view")return;
   const isRefresh=/refresh/i.test(el.textContent||"")||/refresh/i.test(el.id||"");
   const isSafe=/close|cancel/i.test(el.textContent||"");
   if(!canManage && !isRefresh && !isSafe) el.disabled=true;
 });
}

function applyPermissionUI(){
 const root=document.getElementById("adminOnlyDashboard");if(!root)return;
 const maps=[
  ["adminSectionStudentPanel","students.view","students.manage","adminNavStudent"],
  ["adminSectionTestPanel","tests.view","tests.manage","adminNavTest"],
  ["adminSectionCoursePanel","courses.view","courses.manage","adminNavCourse"],
  ["adminSectionVideoPanel","classes.view","classes.manage","adminNavVideo"],
  ["adminSectionNotesPanel","notes.view","notes.manage","adminNavNotes"],
  ["adminSectionPosterPanel","posters.view","posters.manage","adminNavPoster"],
  ["adminSectionAccessPanel","student_access.view","student_access.manage","adminNavAccess"],
  ["adminSectionResultPanel","results.view","results.manage","adminNavResult"]
 ];
 maps.forEach(x=>{
   const panel=document.getElementById(x[0]),btn=document.getElementById(x[3]);
   if(btn){btn.dataset.permPanel=x[0];btn.style.display=(has(x[1])||has(x[2]))?"":"none";}
   if(panel){
     const can=has(x[1])||has(x[2]);panel.style.display=can?"":"none";
     if(can&&!has(x[2])){
       panel.querySelectorAll("input,select,textarea").forEach(el=>el.disabled=true);
       panel.querySelectorAll("button").forEach(el=>{
         const t=(el.textContent||"").trim();
         if(!/refresh|close|cancel/i.test(t))el.disabled=true;
       });
     }
   }
 });
 const adminPanel=document.getElementById("adminSectionAdminPanel");
 const adminBtn=document.getElementById("adminNavAdmin");
 const adminCan=(window.hoaAdminRole==="owner");
 if(adminBtn)adminBtn.style.display=adminCan?"":"none";
 if(adminPanel)adminPanel.style.display=adminCan?"":"none";
 document.querySelectorAll("#adminOnlyDashboard [id*='Poster'],#adminOnlyDashboard [id*='poster']").forEach(el=>{
   if(el.id!=="adminOnlyDashboard")el.style.display=(has("posters.view")||has("posters.manage"))?"":"none";
 });
 const dev=document.getElementById("openHoaDevConsole");
 if(dev)dev.classList.toggle("hoa-admin-console-hidden",!has("developer_console"));
 const badge=document.getElementById("hoaV643RoleBadge");
 if(badge)badge.textContent=roleLabel(window.hoaAdminRole);
}

function ensureNavTags(){
 const root=document.getElementById("adminOnlyDashboard");if(!root)return;
 const pairs={
  adminNavStudent:"adminSectionStudentPanel",adminNavTest:"adminSectionTestPanel",
  adminNavCourse:"adminSectionCoursePanel",adminNavVideo:"adminSectionVideoPanel",
  adminNavNotes:"adminSectionNotesPanel",adminNavPoster:"adminSectionPosterPanel",adminNavAccess:"adminSectionAccessPanel",
  adminNavResult:"adminSectionResultPanel",adminNavAdmin:"adminSectionAdminPanel"
 };
 Object.keys(pairs).forEach(id=>{const b=document.getElementById(id);if(b)b.dataset.permPanel=pairs[id]});
}

function renderAccessManager(){
 const role=window.hoaAdminRole;
 const host=document.getElementById("adminSectionAdminPanel");if(!host)return;
 if(role!=="owner")return;
 let box=document.getElementById("hoaV645AccessManager");
 if(!box){
  box=document.createElement("div");box.id="hoaV645AccessManager";
  const target=host.querySelector(".dashPanel");(target||host).prepend(box);
 }
 box.innerHTML=
 '<div class="hoa645-access-head"><div><h4>👑 Super Admin / Owner — Admin Management</h4>'+
 '<p>You control every Admin account. Create the Admin email/password, decide exactly what that Admin can access, change the credentials later, or delete the Admin account.</p></div>'+
 '<span class="hoa645-role-pill">SUPER ADMIN CONTROL</span></div>'+
 '<div class="hoa643-admin-manager-grid">'+
 '<label>Admin Email<input id="hoaV645NewEmail" type="email" placeholder="admin@hubofaspirants.com"></label>'+
 '<label>Admin Password<input id="hoaV645NewPassword" type="password" placeholder="Min 6: uppercase + lowercase + special"></label>'+
 '<button class="primary" id="hoaV645Create" type="button">CREATE ADMIN ACCOUNT</button>'+
 '</div>'+
 '<div id="hoaV645Msg" class="hoa645-msg"></div>'+
 '<div id="hoaV645AdminList" class="hoa645-admin-list"></div>';
 document.getElementById("hoaV645Create").onclick=createAdmin;
 loadStaff();
}

async function loadStaff(){
 const box=document.getElementById("hoaV645AdminList");if(!box)return;
 box.innerHTML='<div class="hoa643-empty">Loading Admin accounts…</div>';
 try{
  const r=await call("list");
  box.innerHTML=(r.admins||[]).map(a=>{
   const owner=a.role==="owner";
   return '<article class="hoa645-admin-card" data-admin-card="'+esc(a.auth_user_id)+'">'+
    '<div class="hoa645-admin-card-head"><div class="hoa645-admin-card-main"><strong>'+
    esc(a.label||roleLabel(a.role))+'</strong><small>'+esc(a.email||a.auth_user_id)+'</small></div>'+
    '<div class="hoa645-access-actions">'+
    (owner?'<span class="hoa645-role-pill">SUPER ADMIN / OWNER</span>':
      '<button type="button" class="secondary" data-edit-access="'+esc(a.auth_user_id)+'">MANAGE ACCESS</button>'+
      '<button type="button" class="secondary" data-credentials-access="'+esc(a.auth_user_id)+'">CHANGE EMAIL / PASSWORD</button>'+
      '<button type="button" class="danger" data-remove-access="'+esc(a.auth_user_id)+'">DELETE ADMIN</button>')+
    '</div></div>'+
    (owner?"":'<div class="hoa645-access-editor" id="hoa645Editor_'+esc(a.auth_user_id)+'"></div>')+
    '</article>';
  }).join("")||'<div class="hoa643-empty">No Admin accounts have been created yet.</div>';

  box.querySelectorAll("[data-edit-access]").forEach(b=>b.onclick=()=>openEditor(b.dataset.editAccess));
  box.querySelectorAll("[data-credentials-access]").forEach(b=>b.onclick=()=>openCredentialsEditor(b.dataset.credentialsAccess));
  box.querySelectorAll("[data-remove-access]").forEach(b=>b.onclick=async()=>{
    if(!confirm("Delete this Admin account permanently? The Admin will no longer be able to log in."))return;
    try{await call("remove",{auth_user_id:b.dataset.removeAccess});loadStaff()}
    catch(e){alert(e.message||e)}
  });
 }catch(e){box.innerHTML='<div class="hoa643-empty">Unable to load Admin accounts: '+esc(e.message||e)+'</div>'}
}

async function openEditor(id){
 const host=document.getElementById("hoa645Editor_"+id);if(!host)return;
 host.classList.add("open");host.innerHTML='<div class="hoa643-empty">Loading access permissions…</div>';
 try{
  const r=await call("get_permissions",{auth_user_id:id});
  const checks=new Set(r.permissions||[]);
  host.innerHTML=
   '<div class="hoa645-role-row"><span class="hoa645-role-pill">ADMIN</span>'+
   '<button type="button" class="primary" data-save-access>SAVE ACCESS</button>'+
   '<button type="button" class="secondary" data-close-access>CLOSE</button></div>'+
   '<div class="hoa645-perm-grid">'+
   PERMS.map(g=>'<div class="hoa645-perm-group"><h5>'+g[1]+'</h5>'+
     g[2].map(p=>'<label class="hoa645-perm-check"><input type="checkbox" value="'+p+'" '+
       (checks.has(p)?"checked":"")+'>'+labelPerm(p)+'</label>').join("")+
   '</div>').join("")+
   '</div><div class="hoa645-msg" data-editor-msg></div>';

  host.querySelector("[data-close-access]").onclick=()=>host.classList.remove("open");
  host.querySelector("[data-save-access]").onclick=async()=>{
   const msg=host.querySelector("[data-editor-msg]");
   try{
    msg.textContent="Saving Admin access…";
    const permissions=[...host.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);
    await call("set_permissions",{auth_user_id:id,permissions});
    msg.textContent="Admin access updated successfully.";
    setTimeout(loadStaff,500);
   }catch(e){msg.textContent="Failed: "+(e.message||e)}
  };
 }catch(e){host.innerHTML='<div class="hoa643-empty">Unable to load permissions.</div>'}
}

async function openCredentialsEditor(id){
 const host=document.getElementById("hoa645Editor_"+id);if(!host)return;
 host.classList.add("open");host.innerHTML='<div class="hoa643-empty">Loading Admin account…</div>';
 try{
  const r=await call("list");
  const a=(r.admins||[]).find(x=>x.auth_user_id===id);
  if(!a)throw new Error("Admin account not found.");
  host.innerHTML=
   '<div class="hoa645-role-row"><span class="hoa645-role-pill">ADMIN CREDENTIALS</span>'+
   '<button type="button" class="primary" data-save-credentials>SAVE CREDENTIALS</button>'+
   '<button type="button" class="secondary" data-close-credentials>CLOSE</button></div>'+
   '<div class="hoa643-admin-manager-grid">'+
   '<label>Admin Email<input data-admin-email type="email" value="'+esc(a.email||"")+'"></label>'+
   '<label>New Password<input data-admin-password type="password" placeholder="Leave blank to keep current password"></label>'+
   '</div><div class="hoa645-msg" data-credentials-msg></div>';

  host.querySelector("[data-close-credentials]").onclick=()=>host.classList.remove("open");
  host.querySelector("[data-save-credentials]").onclick=async()=>{
   const msg=host.querySelector("[data-credentials-msg]");
   try{
    msg.textContent="Saving credentials…";
    const email=host.querySelector("[data-admin-email]").value.trim();
    const password=host.querySelector("[data-admin-password]").value;
    await (()=>{const v=window.hoaValidateAdminPassword(password);if(!v.ok){alert(v.message);return null;}return call("update_credentials",{auth_user_id:id,email,password})})();
    msg.textContent="Admin email/password updated successfully.";
    setTimeout(loadStaff,500);
   }catch(e){msg.textContent="Failed: "+(e.message||e)}
  };
 }catch(e){host.innerHTML='<div class="hoa643-empty">Unable to load Admin account.</div>'}
}

async function createAdmin(){
 const msg=document.getElementById("hoaV645Msg");
 const email=document.getElementById("hoaV645NewEmail")?.value.trim().toLowerCase();
 const password=document.getElementById("hoaV645NewPassword")?.value;
 if(!email||!password){
   msg.textContent="Enter the Admin email and password.";return;
 }
 const policy=window.hoaValidateAdminPassword(password);
 if(!policy.ok){msg.textContent=policy.message;return;}
 try{
  msg.textContent="Creating Admin account…";
  await (()=>{const v=window.hoaValidateAdminPassword(password);if(!v.ok){alert(v.message);return null;}return call("create",{email,password,permissions:[]})})();
  msg.textContent="Admin account created. Open Manage Access to assign permissions.";
  document.getElementById("hoaV645NewEmail").value="";
  document.getElementById("hoaV645NewPassword").value="";
  loadStaff();
 }catch(e){msg.textContent="Failed: "+(e.message||e)}
}

window.hoaV645LoadPermissions=loadOwnPermissions;window.hoaV643RenderOwnerAdminManager=renderAccessManager;window.hoaV59RefreshAdmin=refreshAdmin;ensureNavTags();
})();
