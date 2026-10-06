/* HOA V8.88 — Free Content → shared Mock Test builder bridge
 * Free Content remains a publication/library surface; Mock Test construction stays owned by the Mock Test workspace.
 */
(function(){
  'use strict';
  if(window.__HOA_FREE_MOCK_BRIDGE_V888__) return;
  window.__HOA_FREE_MOCK_BRIDGE_V888__=true;
  const $=id=>document.getElementById(id);
  let installed=false;
  function install(){
    if(installed) return;
    const panel=$('adminSectionFreeContentPanel');
    if(!panel) return;
    const contentArea=panel.querySelector('[data-hoa-v75-area="content"]')||panel;
    const head=contentArea.querySelector('.hoa-v70-subhead,.hoa-v75-card-head,.hoa-v70-editor-head');
    if(!head) return;
    const host=head.closest('.hoa-v75-free-area,.hoa-v611-free-area,.hoa-v70-content')||head.parentElement;
    if(!host) return;
    if(host.querySelector('[data-hoa-v888-free-action]')) return;
    const wrap=document.createElement('div');
    wrap.className='hoa-v888-free-mock-bridge';
    wrap.innerHTML='<button type="button" class="hoa-v888-free-mock-btn" data-hoa-v888-free-action="builder">＋ CREATE FREE MOCK TEST</button><button type="button" class="hoa-v888-free-mock-btn secondary" data-hoa-v888-free-action="feeder">⬆ FEED QUESTIONS → FREE TEST</button><button type="button" class="hoa-v888-free-mock-btn ghost" data-hoa-v888-free-action="existing">📚 ADD EXISTING MOCK TEST</button><span>Create a Free Mock Test using the same Master Question Bank and Question Feeder, or publish an existing Mock Test here.</span>';
    host.insertBefore(wrap,head.nextSibling);
    const openBuilder=async(mode)=>{
      const runtime=window.__HOA_ADMIN_RUNTIME_V888_API__;
      if(!runtime?.router||!runtime?.ensureTestModules) throw new Error('Mock Test workspace is unavailable.');
      await runtime.router('test');
      await runtime.ensureTestModules();
      if(mode==='feeder'){
        if(typeof window.hoaV888OpenQuestionFeeder!=='function') throw new Error('Question Feeder is unavailable.');
        window.hoaV888OpenQuestionFeeder({access:'free',returnTo:'freecontent'});
      }else if(mode==='existing'){
        await openExistingTestPicker();
      }else{
        if(typeof window.hoaV888OpenMockBuilder!=='function') throw new Error('Mock Test builder is unavailable.');
        window.hoaV888OpenMockBuilder({access:'free',returnTo:'freecontent'});
      }
    };
    wrap.querySelectorAll('[data-hoa-v888-free-action]').forEach(btn=>btn.addEventListener('click',async()=>{
      try{await openBuilder(btn.dataset.hoaV888FreeAction);}catch(e){
        const msg=$("hoaV70AdminMsg");
        if(msg) msg.textContent='Free Mock Test workflow could not be opened: '+(e.message||e);
        alert(e.message||'Unable to open the Free Mock Test workflow.');
      }
    }));
    installed=true;
  }
  
  async function openExistingTestPicker(){
    const db=window.supabaseClient||window.supabase;
    if(!db) throw new Error('Supabase is not ready.');
    const r=await db.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,test_batch_id,test_batch_folder_id,test_type').order('created_at',{ascending:false});
    if(r.error) throw r.error;
    const rawTests=r.data||[];const cr=await db.from('free_content_items').select('test_id').eq('content_type','test').eq('is_published',true);if(cr.error)throw cr.error;const freeIds=new Set((cr.data||[]).map(x=>String(x.test_id)).filter(Boolean));const tests=rawTests.map(t=>({...t,__freeContent:freeIds.has(String(t.id))}));
    const modal=document.createElement('div');modal.className='hoa-v888-picker-backdrop';
    modal.innerHTML='<div class="hoa-v888-picker" role="dialog" aria-modal="true"><div class="hoa-v888-picker-head"><div><h3>Add Existing Mock Test to Free Content</h3><p>Select a test to publish as a Free Test. Its Paid Batch/Folder placement will be removed.</p></div><button type="button" class="hoa-v888-close">×</button></div><div class="hoa-v888-picker-tools"><input type="search" placeholder="Search mock test..."><select><option value="all">All</option><option value="paid">Paid</option><option value="free">Free</option><option value="published">Published</option><option value="draft">Draft</option></select></div><div class="hoa-v888-picker-list"></div><div class="hoa-v888-picker-msg"></div></div>';
    document.body.appendChild(modal);
    const list=modal.querySelector('.hoa-v888-picker-list'),search=modal.querySelector('input'),filter=modal.querySelector('select'),msg=modal.querySelector('.hoa-v888-picker-msg');
    const close=()=>modal.remove();modal.querySelector('.hoa-v888-close').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});
    const render=()=>{let rows=[...tests];const q=search.value.trim().toLowerCase();const f=filter.value;if(q)rows=rows.filter(t=>(t.title+' '+(t.description||'')).toLowerCase().includes(q));if(f==='paid')rows=rows.filter(t=>t.access_type==='paid');if(f==='free')rows=rows.filter(t=>t.access_type==='free');if(f==='published')rows=rows.filter(t=>t.is_published);if(f==='draft')rows=rows.filter(t=>!t.is_published);list.innerHTML=rows.length?rows.map(t=>`<article class="hoa-v888-picker-row"><div><b>${String(t.title).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</b><small>${t.is_published?'PUBLISHED':'DRAFT'} · ${String(t.access_type||'paid').toUpperCase()}${t.test_batch_id?' · Assigned to Paid Batch':''}${t.__freeContent?' · ALREADY IN FREE CONTENT':''}</small></div><button type="button" class="hoa-v888-free-mock-btn small" data-publish-free="${t.id}" ${t.__freeContent?'disabled':''}>${t.__freeContent?'ALREADY ADDED':'ADD TO FREE CONTENT'}</button></article>`).join(''):'<div class="hoa-v888-empty">No Mock Tests match the filter.</div>';list.querySelectorAll('[data-publish-free]').forEach(btn=>btn.onclick=async()=>{if(btn.disabled)return;btn.disabled=true;msg.textContent='Publishing…';try{const x=await db.rpc('hoa_admin_publish_test_to_free_content',{p_test_id:btn.dataset.publishFree});if(x.error)throw x.error;msg.textContent='Added to Free Content successfully.';window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{freeContent:true,testId:btn.dataset.publishFree}}));setTimeout(async()=>{close();try{const rt=window.__HOA_ADMIN_RUNTIME_V888_API__;if(rt?.router)await rt.router('freecontent');}catch(err){console.warn('[HOA V8.88] Return to Free Content after publish failed:',err)}},300);}catch(e){msg.textContent=e.message||'Could not publish test.';btn.disabled=false;}})};
    search.oninput=render;filter.onchange=render;render();
  }

window.hoaV888InstallFreeMockBridge=install;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
