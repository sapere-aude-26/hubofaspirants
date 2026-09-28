
(function(){
'use strict';
const esc616=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
function rpc616(name,args){
  if(!window.supabaseClient||!window.supabaseClient.rpc) return Promise.reject(new Error('Supabase is not ready. Please refresh the page.'));
  return window.supabaseClient.rpc(name,args).then(r=>{if(r.error)throw r.error;return r.data;});
}
function portalUrl616(){
  const u=new URL(location.href);
  u.searchParams.delete('hoa_free_test');
  u.searchParams.delete('content');
  u.searchParams.set('hoa_free_page','library');
  return u.href;
}
function modal616(){return document.getElementById('hoaV648FreeContentModal');}
function openGate616(){
  const m=modal616();
  if(!m)return;
  m.classList.remove('hidden');
  document.documentElement.classList.add('hoa-free-modal-open');
  document.body.classList.add('hoa-free-modal-open');
  const title=document.getElementById('hoaV648FreeContentTitle');
  if(title)title.textContent='Free Content Access';
  const card=m.querySelector('.hoa-v648-modal-card');
  if(!card)return;
  let body=card.querySelector('#hoaV616GateBody');
  if(!body){
    body=document.createElement('div');
    body.id='hoaV616GateBody';
    const oldGrid=card.querySelector('.hoa-v648-free-grid');
    const oldP=card.querySelector('p');
    if(oldGrid)oldGrid.remove();
    if(oldP)oldP.remove();
    const close=card.querySelector('.hoa-v648-modal-close');
    if(close&&close.nextSibling)card.insertBefore(body,close.nextSibling);else card.appendChild(body);
  }
  body.innerHTML=`
    <p class="hoa-v616-intro">Enter your mobile number to access Free Content. Your number is checked only against the Free Student database.</p>
    <form id="hoaV616GateForm" novalidate>
      <div class="hoa-v616-field">
        <label for="hoaV616Mobile">Mobile Number <span>*</span></label>
        <input id="hoaV616Mobile" type="tel" inputmode="numeric" autocomplete="tel" maxlength="10" placeholder="Enter 10-digit mobile number" required>
      </div>
      <div id="hoaV616RegisterFields" hidden>
        <div class="hoa-v616-divider"></div>
        <p class="hoa-v616-note">This number is not registered. Complete the following details to create your Free Student profile.</p>
        <div class="hoa-v616-grid">
          <div class="hoa-v616-field"><label for="hoaV616Name">Full Name <span>*</span></label><input id="hoaV616Name" maxlength="100" autocomplete="name"></div>
          <div class="hoa-v616-field"><label for="hoaV616Email">Email <span>*</span></label><input id="hoaV616Email" type="email" maxlength="254" autocomplete="email"></div>
          <div class="hoa-v616-field"><label for="hoaV616Preparing">Preparing For <span>*</span></label><input id="hoaV616Preparing" maxlength="150"></div>
          <div class="hoa-v616-field"><label for="hoaV616College">College Name <span>*</span></label><input id="hoaV616College" maxlength="200"></div>
          <div class="hoa-v616-field"><label for="hoaV616Year">Pass Out Year <span>*</span></label><input id="hoaV616Year" inputmode="numeric" maxlength="4"></div>
          <div class="hoa-v616-field hoa-v616-wide"><label for="hoaV616Address">Address <span>*</span></label><textarea id="hoaV616Address" rows="3" maxlength="500"></textarea></div>
        </div>
      </div>
      <div id="hoaV616GateMsg" class="hoa-v616-msg" role="alert"></div>
      <div class="hoa-v616-actions">
        <button type="submit" class="hoa-v616-primary" id="hoaV616Continue">CONTINUE</button>
      </div>
    </form>`;
  const form=document.getElementById('hoaV616GateForm');
  const mobile=document.getElementById('hoaV616Mobile');
  const msg=document.getElementById('hoaV616GateMsg');
  const register=document.getElementById('hoaV616RegisterFields');
  const continueBtn=document.getElementById('hoaV616Continue');
  let registration=false;
  let portalWindow=null;
  const openPortal616=()=>{ portalWindow=window.open(portalUrl616(),'_blank','noopener,noreferrer'); if(!portalWindow){msg.textContent='Please allow pop-ups for HUB OF ASPIRANTS, then click Continue again.';return false;} window.hoaCloseFreeContent?.(); return true; };
  form.onsubmit=async function(e){
    e.preventDefault();
    msg.textContent='';
    const mob=(mobile.value||'').replace(/\D/g,'');
    if(!/^[6-9]\d{9}$/.test(mob)){msg.textContent='Enter a valid 10-digit Indian mobile number.';mobile.focus();return;}
    continueBtn.disabled=true;continueBtn.textContent=registration?'REGISTERING…':'CHECKING…';
    try{
      if(!registration){
        const d=await rpc616('hoa_free_profile_enter',{p_mobile:mob});
        localStorage.setItem('hoa_free_access_token',d.access_token);
        if(!openPortal616()){continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;}
        return;
      }
      const year=Number(document.getElementById('hoaV616Year').value);
      const req={
        p_mobile:mob,
        p_full_name:document.getElementById('hoaV616Name').value.trim(),
        p_email:document.getElementById('hoaV616Email').value.trim(),
        p_preparing_for:document.getElementById('hoaV616Preparing').value.trim(),
        p_college_name:document.getElementById('hoaV616College').value.trim(),
        p_passout_year:year,
        p_address:document.getElementById('hoaV616Address').value.trim()
      };
      if(!req.p_full_name||!/^\S+@\S+\.\S+$/.test(req.p_email)||!req.p_preparing_for||!req.p_college_name||!req.p_address||!Number.isInteger(year)||year<1950||year>new Date().getFullYear()){
        throw new Error('Please enter valid information in every required field.');
      }
      const d=await rpc616('hoa_free_profile_enter',req);
      localStorage.setItem('hoa_free_access_token',d.access_token);
      if(!openPortal616()){continueBtn.disabled=false;continueBtn.textContent='REGISTER & CONTINUE';return;}
    }catch(err){
      const text=String(err?.message||err);
      if(!registration && text.includes('REGISTRATION_REQUIRED')){
        registration=true;register.hidden=false;continueBtn.textContent='REGISTER & CONTINUE';msg.textContent='Mobile number not found. Please complete the registration details.';
        continueBtn.disabled=false;
        return;
      }
      msg.textContent=text;
      continueBtn.disabled=false;
      continueBtn.textContent=registration?'REGISTER & CONTINUE':'CONTINUE';
    }
  };
  mobile.addEventListener('input',()=>{mobile.value=mobile.value.replace(/\D/g,'').slice(0,10)});
  requestAnimationFrame(()=>mobile.focus({preventScroll:true}));
}
window.hoaOpenFreeContent=openGate616;
})();
