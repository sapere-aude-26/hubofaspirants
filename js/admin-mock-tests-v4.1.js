/* HOA V4.1 — Mock Test Admin Workspace Authority
   Purpose: consolidate the Mock Test admin UI into exactly 3 top-level sections:
   1) Batch Management
   2) Question Feeding
   3) Question Bank
   Existing Supabase/test engine functions remain authoritative.
*/
(function(){
  'use strict';
  var mounted=false;
  var tabKey='batch';
  var timerIds=[];
  function $(id){return document.getElementById(id)}
  function all(selector,root){return Array.prototype.slice.call((root||document).querySelectorAll(selector))}
  function adminReady(){return !!($('adminSectionTestPanel') && (document.body.classList.contains('admin-ui') || window.adminLoggedIn===true || typeof window.isAdminMode==='function' && window.isAdminMode()))}
  function setActive(name){
    tabKey=name;
    all('.hoa-v41-tab').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-v41-tab')===name);b.setAttribute('aria-selected',b.getAttribute('data-v41-tab')===name?'true':'false')});
    all('.hoa-v41-page').forEach(function(p){p.classList.toggle('active',p.getAttribute('data-v41-page')===name)});
    if(name==='bank'){
      var load=$('hoaV610LoadBank'); if(load) load.click();
    }
    if(name==='feeding') updateExistingTestSelector();
  }
  function addHiddenCompatibility(){
    var host=$('adminSectionTestPanel'); if(!host) return null;
    var box=$('testLibrary');
    if(!box){box=document.createElement('div');box.id='testLibrary';}
    if(box.parentElement!==host) host.appendChild(box);
    box.classList.add('hoa-v41-compat');
    return box;
  }
  function removeLegacyWorkspace(){
    var old=$('hoa606MockWorkspace'); if(old) old.remove();
    all('#adminSectionTestPanel > .adminGrid').forEach(function(g){g.style.display='none'});
  }
  function locateOriginalSections(w){
    var q=$('hoaV610QuestionPage');
    if(!q) return null;
    var children=Array.prototype.slice.call(q.children);
    var bankSection=$('hoaV610BankList')?.closest('.hoa610-section')||null;
    var builderSection=$('hoaV610BuilderList')?.closest('.hoa610-section')||null;
    var creatorHost=$('hoaV610LegacyCreatorHost');
    return {q:q,children:children,bankSection:bankSection,builderSection:builderSection,creatorHost:creatorHost};
  }
  function makeTabs(w){
    var head=w.querySelector('.hoa610-head');
    if(!head)return;
    /* The legacy V6.1 workspace fallback already contains a tab row. Never
       leave both the fallback row and the V4.1 authority row mounted. */
    var existing=w.querySelector('.hoa-v41-tabs');
    if(existing){
      all('.hoa-v41-tabs',w).forEach(function(x,i){if(i>0)x.remove()});
      all('.hoa610-tabs',w).forEach(function(x){x.remove()});
      existing.setAttribute('role','tablist');
      existing.querySelectorAll('.hoa-v41-tab').forEach(function(b){
        b.onclick=function(){setActive(b.getAttribute('data-v41-tab'))};
      });
      return existing;
    }
    all('.hoa610-tabs',w).forEach(function(x){x.remove()});
    var tabs=document.createElement('div');
    tabs.className='hoa-v41-tabs';
    tabs.setAttribute('role','tablist');
    tabs.innerHTML='<button type="button" class="hoa-v41-tab active" data-v41-tab="batch" role="tab" aria-selected="true">📦 Batch Management</button><button type="button" class="hoa-v41-tab" data-v41-tab="feeding" role="tab" aria-selected="false">📝 Question Feeding</button><button type="button" class="hoa-v41-tab" data-v41-tab="bank" role="tab" aria-selected="false">❓ Question Bank</button>';
    head.insertAdjacentElement('afterend',tabs);
    tabs.addEventListener('click',function(e){var b=e.target.closest('.hoa-v41-tab');if(b)setActive(b.getAttribute('data-v41-tab'))});
    return tabs;
  }
  function normalizeHeader(w){
    var h=w.querySelector('.hoa610-head');
    if(!h)return;
    h.querySelector('h2').textContent='Mock Test Management';
    h.querySelector('p').textContent='Create and organize mock-test batches, feed questions into tests, and reuse questions from one central bank.';
    var chip=h.querySelector('.hoa610-chip'); if(chip) chip.textContent='3 WORKSPACES • BATCH • FEED • BANK';
  }
  function mountFallback(){
    var host=$('adminSectionTestPanel'); if(!host)return null;
    var w=document.createElement('section');
    w.id='hoaV610MockWorkspace'; w.className='hoa610-shell hoa-v41-mock-workspace';
    w.innerHTML='<div class="hoa610-head"><div><h2>Mock Test Management</h2><p>Create and organize mock-test batches, feed questions into tests, and reuse questions from one central bank.</p></div><span class="hoa610-chip">3 WORKSPACES • BATCH • FEED • BANK</span></div><div class="hoa-v41-tabs" role="tablist"><button type="button" class="hoa-v41-tab active" data-v41-tab="batch" role="tab" aria-selected="true">📦 Batch Management</button><button type="button" class="hoa-v41-tab" data-v41-tab="feeding" role="tab" aria-selected="false">📝 Question Feeding</button><button type="button" class="hoa-v41-tab" data-v41-tab="bank" role="tab" aria-selected="false">❓ Question Bank</button></div><section class="hoa-v41-page active" data-v41-page="batch" id="hoaV41BatchPage"></section><section class="hoa-v41-page" data-v41-page="feeding" id="hoaV41FeedingPage"></section><section class="hoa-v41-page hoa-v41-bank-page" data-v41-page="bank" id="hoaV41BankPage"></section>';
    host.insertBefore(w,host.firstChild);
    return w;
  }
  function buildFromExisting(){
    var w=$('hoaV610MockWorkspace');
    if(!w){w=mountFallback(); if(!w)return null}
    if(!w.classList.contains('hoa-v41-mock-workspace'))w.classList.add('hoa-v41-mock-workspace');
    removeLegacyWorkspace(); addHiddenCompatibility(); normalizeHeader(w); makeTabs(w);

    var existing=locateOriginalSections(w);
    var batchPage=w.querySelector('[data-v41-page="batch"]')||$('hoaV610BatchPage');
    if(batchPage && batchPage.id!=='hoaV610BatchPage') batchPage.id='hoaV610BatchPage';
    var feedPage=w.querySelector('[data-v41-page="feeding"]');
    if(!feedPage){feedPage=document.createElement('section');feedPage.id='hoaV41FeedingPage';feedPage.className='hoa-v41-page';feedPage.setAttribute('data-v41-page','feeding');w.appendChild(feedPage)}
    var bankPage=w.querySelector('[data-v41-page="bank"]');
    if(!bankPage){bankPage=document.createElement('section');bankPage.id='hoaV41BankPage';bankPage.className='hoa-v41-page hoa-v41-bank-page';bankPage.setAttribute('data-v41-page','bank');w.appendChild(bankPage)}

    if(existing && existing.q){
      var q=existing.q;
      var first=existing.children.find(function(x){return x.classList && x.classList.contains('hoa610-section')});
      var bank=existing.bankSection;
      var builder=existing.builderSection;
      var creator=existing.creatorHost;
      feedPage.innerHTML='';
      var feedHeader=document.createElement('div');
      feedHeader.className='hoa-v41-feeding-header';
      feedHeader.innerHTML='<h3>Question Feeding</h3><p>Import or paste Telegram-format CSV data, configure the test, review the current question set, and save the test through the existing production workflow.</p>';
      feedPage.appendChild(feedHeader);
      var selector=document.createElement('div');
      selector.className='hoa-v41-existing';
      selector.innerHTML='<label><span>Existing test (optional)</span><select id="hoaV41ExistingTest"><option value="">Create a new test</option></select><span class="hoa-v41-inline-note">Select an existing test only when you need to load it into the current Question Feeding workspace.</span></label><button type="button" class="hoa610-btn" id="hoaV41LoadExisting">LOAD TEST</button><button type="button" class="hoa610-btn gold" id="hoaV41StartNew">＋ NEW TEST</button>';
      feedPage.appendChild(selector);
      if(first){
        var firstHead=first.querySelector('.hoa610-section-head');
        var buttons=first.querySelector('.hoa610-actions');
        if(firstHead) firstHead.remove();
        if(buttons){
          var refresh=buttons.querySelector('#hoaV610RefreshTests');
          var open=buttons.querySelector('#hoaV610OpenCreator');
          if(refresh)refresh.textContent='↻ Refresh';
          if(open)open.style.display='none';
          feedPage.appendChild(first);
        }
      }
      if(creator){
        creator.classList.add('hoa-v41-creator-host');
        var creatorHead=creator.querySelector('.hoa610-section-head'); if(creatorHead)creatorHead.remove();
        var cp=creator.querySelector('#creatorPanel');
        if(cp){cp.classList.add('hoa-v41-creator-panel');cp.style.display='block';}
        feedPage.appendChild(creator);
      }
      if(builder){
        var bh=builder.querySelector('.hoa610-section-head');
        if(bh){var h3=bh.querySelector('h3');if(h3)h3.textContent='Current Question Set';var p=bh.querySelector('p');if(p)p.textContent='Review, edit or remove questions currently loaded for this test before saving.';}
        feedPage.appendChild(builder);
      }
      if(bank){
        var bhead=bank.querySelector('.hoa610-section-head');if(bhead){var bh3=bhead.querySelector('h3');if(bh3)bh3.textContent='Question Bank';var bp=bhead.querySelector('p');if(bp)bp.textContent='Search reusable questions from the protected question bank and add selected questions to the current test.';}
        bankPage.innerHTML='';
        var help=document.createElement('div');help.className='hoa-v41-bank-help';help.textContent='Select reusable questions below. They will be added to the current Question Feeding set; the existing production save workflow remains responsible for persistence.';
        bankPage.appendChild(help);bankPage.appendChild(bank);
      }
      // Remove the obsolete Test Library section from the visible workspace.
      if(existing.children){existing.children.forEach(function(ch){if(ch!==first&&ch!==bank&&ch!==builder&&ch!==creator){} });}
      q.innerHTML='';
      if(first||creator||builder){/* content already moved */}
      // Old V610 question page is no longer visible; use our pages only.
      q.classList.remove('active'); q.style.display='none';
    }
    // Ensure Batch Page is visible as our first page and other pages are siblings.
    if(batchPage){batchPage.classList.add('hoa-v41-page');batchPage.setAttribute('data-v41-page','batch');batchPage.classList.add('active')}
    var hiddenCompat=$('testLibrary'); if(hiddenCompat) hiddenCompat.classList.add('hoa-v41-compat');
    bindControls();
    updateExistingTestSelector();
    mounted=true;
    setActive('batch');
    return w;
  }
  function updateExistingTestSelector(){
    var sel=$('hoaV41ExistingTest'); if(!sel)return;
    var list=[];
    try{ if(typeof tests!=='undefined' && Array.isArray(tests)) list=tests; else if(Array.isArray(window.tests)) list=window.tests; }catch(_){ if(Array.isArray(window.tests)) list=window.tests; }
    var cur=sel.value;
    sel.innerHTML='<option value="">Create a new test</option>'+list.map(function(t){return '<option value="'+String(t.id).replace(/"/g,'&quot;')+'">'+escapeText(t.title)+' '+(t.is_published?'[PUBLISHED]':'[DRAFT]')+'</option>'}).join('');
    if(cur && list.some(function(t){return String(t.id)===String(cur)}))sel.value=cur;
  }
  function escapeText(v){var d=document.createElement('div');d.textContent=String(v||'');return d.innerHTML}
  function bindControls(){
    var load=$('hoaV41LoadExisting');
    if(load&&!load.dataset.bound){load.dataset.bound='1';load.onclick=function(){var id=$('hoaV41ExistingTest')?.value;if(!id){alert('Select an existing test first.');return}if(typeof window.hoaV606EditTest==='function')window.hoaV606EditTest(id);setTimeout(function(){setActive('feeding');updateExistingTestSelector()},50)}}
    var fresh=$('hoaV41StartNew');
    if(fresh&&!fresh.dataset.bound){fresh.dataset.bound='1';fresh.onclick=function(){if(typeof window.clearPastedCSV==='function')window.clearPastedCSV();try{if(typeof questions!=='undefined'&&Array.isArray(questions))questions.length=0;else if(Array.isArray(window.questions))window.questions.length=0}catch(_){}var ids=['titleInput','durationInput','marksInput','negativeInput'];if($('titleInput'))$('titleInput').value='TES Mock Test 01';if($('durationInput'))$('durationInput').value='10';if($('marksInput'))$('marksInput').value='1';if($('negativeInput'))$('negativeInput').value='.25';if($('accessTypeInput'))$('accessTypeInput').value='paid';setActive('feeding');if(typeof window.renderCSVPreview==='function')window.renderCSVPreview();if(typeof window.hoa606LoadCreatorBatches==='function')window.hoa606LoadCreatorBatches()}}
    var refresh=$('hoaV610RefreshTests'); if(refresh&&!refresh.dataset.v41Bound){refresh.dataset.v41Bound='1';refresh.addEventListener('click',function(){setTimeout(updateExistingTestSelector,100)})}
    var bankLoad=$('hoaV610LoadBank'); if(bankLoad&&!bankLoad.dataset.v41Bound){bankLoad.dataset.v41Bound='1';bankLoad.addEventListener('click',function(){setTimeout(updateBankCount,250)})}
    var bankAdd=$('hoaV610AddSelected'); if(bankAdd&&!bankAdd.dataset.v41Bound){bankAdd.dataset.v41Bound='1';bankAdd.addEventListener('click',function(){setTimeout(function(){updateBankCount();if($('hoaV610BuilderSummary'))$('hoaV610BuilderSummary').scrollIntoView({behavior:'smooth',block:'nearest'})},120)})}
  }
  function updateBankCount(){
    var st=$('hoaV610BankStatus'); var c=$('hoaV41BankCount');if(!st||!c)return;
    var txt=st.textContent||'';var m=txt.match(/(\d+)\s+questions\s+loaded/i);c.textContent=m?m[1]+' questions':(txt||'Question bank ready');
  }
  function patchLegacyEnsure(){
    var old=window.ensureMockWorkspace;
    if(typeof old==='function'&&!old.__hoaV41){
      var w=function(){
        var current=$('hoaV610MockWorkspace');
        if(current) return current;
        return null;
      };
      w.__hoaV41=true; w.__hoaV41Original=old; window.ensureMockWorkspace=w;
    }
  }
  function patchShowAdminSection(){
    var old=window.showAdminSection;
    if(typeof old==='function'&&!old.__hoaV41AdminSection){
      var w=function(section){
        var r=old.apply(this,arguments);
        if(String(section).toLowerCase()==='test') setTimeout(function(){mount()},0);
        return r;
      };
      w.__hoaV41AdminSection=true; w.__hoaV41AdminSectionOriginal=old; window.showAdminSection=w;
    }
  }
  function patchShowCreator(){
    var old=window.showCreator;
    if(typeof old==='function'&&!old.__hoaV41){
      var w=function(){setActive('feeding');var r=old.apply(this,arguments);setTimeout(function(){var h=$('hoaV610LegacyCreatorHost');if(h)h.scrollIntoView({behavior:'smooth',block:'start'});},50);return r};w.__hoaV41=true;w.__hoaV41Original=old;window.showCreator=w;
    }
  }
  function patchEdit(){
    var old=window.hoaV606EditTest;
    if(typeof old==='function'&&!old.__hoaV41){
      var w=function(){setActive('feeding');return old.apply(this,arguments)};w.__hoaV41=true;w.__hoaV41Original=old;window.hoaV606EditTest=w;
    }
  }
  function mount(){
    if(!adminReady())return false;
    try{patchLegacyEnsure();buildFromExisting();patchShowAdminSection();patchShowCreator();patchEdit();}catch(e){console.error('[HOA V4.1 Mock Workspace]',e)}
    return mounted;
  }
  function retry(){if(mounted)return;mount()}
  function start(){
    [0,120,300,700,1200].forEach(function(ms){timerIds.push(setTimeout(retry,ms))});
    var mo=new MutationObserver(function(){
      var legacy=$('hoa606MockWorkspace');
      if(legacy) legacy.remove();
      if(!mounted)retry();
    });
    mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    window.hoaV41MockTestWorkspaceRefresh=function(){mounted=false;retry()};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
