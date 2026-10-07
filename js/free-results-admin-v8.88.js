/* HOA V8.88 — Free Test Results Manager
   Adds admin result search/filter/sort/selection, safe bulk deletion,
   Excel-compatible export, and direct PDF download without replacing the
   existing Free Content / Free Student systems. */
(function(){
  'use strict';
  if(window.__hoaFreeResultsV888Loaded) return;
  window.__hoaFreeResultsV888Loaded = true;

  const VERSION='8.75';
  const client=()=>window.supabaseClient||null;
  const esc=window.escapeHTML||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const byId=id=>document.getElementById(id);
  const fmtDate=v=>window.formatAdminDate?window.formatAdminDate(v):(v?new Date(v).toLocaleString():'');
  const n=v=>Number.isFinite(Number(v))?Number(v):0;

  let rows=[];
  let filtered=[];
  const selected=new Set();
  let sortKey='submitted_at';
  let sortDir='desc';
  let search='';
  let testFilter='';
  let pageSize=50;
  let page=1;
  let busy=false;

  function notify(msg,kind='ok'){
    const target=byId('hoaV70AdminMsg');
    if(target){target.textContent=msg||'';target.style.color=kind==='error'?'#b42318':'';}
  }

  function numCmp(a,b){return n(a)-n(b);}
  function textCmp(a,b){return String(a??'').localeCompare(String(b??''),undefined,{numeric:true,sensitivity:'base'});}
  function dateCmp(a,b){return (new Date(a||0)).getTime()-(new Date(b||0)).getTime();}
  function cmp(a,b,key){
    if(key==='score'||key==='percentage'||key==='correct'||key==='wrong'||key==='skipped'||key==='time_taken') return numCmp(a[key],b[key]);
    if(key==='submitted_at') return dateCmp(a[key],b[key]);
    return textCmp(a[key],b[key]);
  }

  function applyView(){
    const q=search.trim().toLowerCase();
    filtered=(rows||[]).filter(r=>{
      if(testFilter && String(r.test_id)!==String(testFilter)) return false;
      if(!q) return true;
      return [r.full_name,r.email,r.mobile,r.college_name,r.preparing_for,r.test_title]
        .some(v=>String(v??'').toLowerCase().includes(q));
    });
    filtered.sort((a,b)=>{
      const c=cmp(a,b,sortKey);
      return sortDir==='asc'?c:-c;
    });
    const maxPage=Math.max(1,Math.ceil(filtered.length/pageSize));
    if(page>maxPage) page=maxPage;
    render();
  }

  function uniqueTests(){
    const map=new Map();
    rows.forEach(r=>{if(r.test_id&&!map.has(String(r.test_id)))map.set(String(r.test_id),r.test_title||'Untitled Test');});
    return [...map.entries()].sort((a,b)=>String(a[1]).localeCompare(String(b[1]),undefined,{numeric:true,sensitivity:'base'}));
  }

  function toolbarHtml(){
    return `<div class="hoa-v863-toolbar">
      <div class="hoa-v863-toolbar-row">
        <div class="hoa-v863-search"><input id="hoaV863Search" type="search" placeholder="Search student, email, mobile, college or test…" value="${esc(search)}" aria-label="Search Free Test Results"></div>
        <select id="hoaV863TestFilter" aria-label="Filter by Free Test"><option value="">All Free Tests</option>${uniqueTests().map(([id,title])=>`<option value="${esc(id)}"${String(testFilter)===String(id)?' selected':''}>${esc(title)}</option>`).join('')}</select>
        <select id="hoaV863PageSize" aria-label="Rows per page"><option value="25"${pageSize===25?' selected':''}>25 / page</option><option value="50"${pageSize===50?' selected':''}>50 / page</option><option value="100"${pageSize===100?' selected':''}>100 / page</option><option value="all"${pageSize===filtered.length?' selected':''}>All</option></select>
        <button type="button" class="secondary" id="hoaV863Refresh">↻ Refresh</button>
      </div>
      <div class="hoa-v863-toolbar-row hoa-v863-actions">
        <label class="hoa-v863-check-all"><input type="checkbox" id="hoaV863SelectAll"> <span>Select all visible</span></label><button type="button" class="secondary" id="hoaV863SelectAllFiltered">Select all filtered</button>
        <span id="hoaV863SelectionCount" class="hoa-v863-count">0 selected</span>
        <button type="button" class="secondary" id="hoaV863ExportExcel">⬇ Excel</button>
        <button type="button" class="secondary" id="hoaV863ExportPdf">⬇ PDF</button>
        <button type="button" class="secondary hoa-v863-danger" id="hoaV863DeleteSelected" disabled>🗑 Delete selected</button>
        <span class="hoa-v863-page" id="hoaV863PageInfo"></span>
        <button type="button" class="secondary" id="hoaV863Prev">←</button>
        <button type="button" class="secondary" id="hoaV863Next">→</button>
      </div>
    </div>`;
  }

  function headerCell(key,label){
    const active=sortKey===key;
    const arrow=active?(sortDir==='asc'?' ▲':' ▼'):'';
    return `<th><button type="button" class="hoa-v863-sort" data-hoa-v863-sort="${esc(key)}">${esc(label)}${arrow}</button></th>`;
  }

  function render(){
    const rb=byId('hoaV70FreeResults');
    if(!rb) return;
    const total=filtered.length;
    const effectivePageSize=pageSize===0?total:pageSize;
    const maxPage=Math.max(1,Math.ceil(total/(effectivePageSize||1)));
    if(page>maxPage)page=maxPage;
    const start=(page-1)*(effectivePageSize||1);
    const visible=filtered.slice(start,effectivePageSize===0?undefined:start+(effectivePageSize||1));
    const visibleIds=new Set(visible.map(r=>String(r.id)));
    const allVisibleSelected=visible.length>0 && visible.every(r=>selected.has(String(r.id)));

    rb.innerHTML=`<div class="hoa-v863-results-head"><div><h3>Free Test Results</h3><p>Search, sort, export, review and delete completed Free Test attempts. Deleting a result removes that attempt record and does not delete the Free Test itself.</p></div><div class="hoa-v863-stats"><span><b>${rows.length}</b> Total</span><span><b>${selected.size}</b> Selected</span></div></div>${toolbarHtml()}
    <div class="hoa-v863-table-wrap"><table class="hoa-v70-table hoa-v863-table"><thead><tr>
      <th class="hoa-v863-check"><input type="checkbox" id="hoaV863HeaderCheck" ${allVisibleSelected?'checked':''} aria-label="Select all visible results"></th>
      ${headerCell('full_name','Name')}${headerCell('test_title','Test')}${headerCell('score','Score')}${headerCell('percentage','%')}${headerCell('correct','Correct')}${headerCell('wrong','Wrong')}${headerCell('skipped','Skipped')}${headerCell('time_taken','Time')}${headerCell('submitted_at','Date')}<th>Action</th>
    </tr></thead><tbody>${visible.length?visible.map(r=>rowHtml(r,visibleIds)).join(''):`<tr><td colspan="11"><div class="emptyState">${rows.length?'No results match the current search/filter.':'No completed Free Test results.'}</div></td></tr>`}</tbody></table></div>`;
    wire();
  }

  function rowHtml(r){
    const id=String(r.id);
    return `<tr data-result-id="${esc(id)}">
      <td class="hoa-v863-check"><input type="checkbox" class="hoa-v863-row-check" data-result-check="${esc(id)}" ${selected.has(id)?'checked':''} aria-label="Select ${esc(r.full_name||'candidate')}"></td>
      <td><b>${esc(r.full_name||'')}</b><br><span class="hoa-v70-mini">${esc(r.email||r.mobile||'')}</span></td>
      <td>${esc(r.test_title||'')}</td>
      <td>${n(r.score).toFixed(2)}</td>
      <td>${n(r.percentage).toFixed(2)}%</td>
      <td>${n(r.correct)}</td>
      <td>${n(r.wrong)}</td>
      <td>${n(r.skipped)}</td>
      <td>${formatDuration(r.time_taken)}</td>
      <td>${esc(fmtDate(r.submitted_at))}</td>
      <td><button type="button" class="secondary hoa-v863-delete-one" data-result-delete="${esc(id)}">Delete</button></td>
    </tr>`;
  }

  function formatDuration(sec){
    const s=Math.max(0,Math.floor(n(sec))); const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); const ss=s%60;
    return h?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${m}:${String(ss).padStart(2,'0')}`;
  }

  function wire(){
    const rb=byId('hoaV70FreeResults'); if(!rb)return;
    rb.querySelectorAll('[data-hoa-v863-sort]').forEach(b=>b.onclick=()=>{const k=b.dataset.hoaV863Sort;if(sortKey===k)sortDir=sortDir==='asc'?'desc':'asc';else{sortKey=k;sortDir=k==='submitted_at'?'desc':'asc';}page=1;applyView();});
    byId('hoaV863Search')?.addEventListener('input',e=>{search=e.target.value||'';page=1;applyView();});
    byId('hoaV863TestFilter')?.addEventListener('change',e=>{testFilter=e.target.value||'';page=1;applyView();});
    byId('hoaV863PageSize')?.addEventListener('change',e=>{pageSize=e.target.value==='all'?filtered.length:Number(e.target.value)||50;page=1;applyView();});
    byId('hoaV863Refresh')?.addEventListener('click',()=>refresh(true));
    byId('hoaV863Prev')?.addEventListener('click',()=>{if(page>1){page--;render();}});
    byId('hoaV863Next')?.addEventListener('click',()=>{const max=Math.max(1,Math.ceil(filtered.length/(pageSize||filtered.length||1)));if(page<max){page++;render();}});
    byId('hoaV863HeaderCheck')?.addEventListener('change',e=>{const checks=rb.querySelectorAll('[data-result-check]');checks.forEach(c=>{const id=String(c.dataset.resultCheck);if(e.target.checked)selected.add(id);else selected.delete(id);c.checked=e.target.checked;});syncSelectionUI();});
    byId('hoaV863SelectAllFiltered')?.addEventListener('click',()=>{filtered.forEach(r=>selected.add(String(r.id)));render();});
    byId('hoaV863SelectAll')?.addEventListener('change',e=>{const visible=filtered.slice((page-1)*(pageSize||filtered.length||1),pageSize?((page-1)*pageSize+pageSize):undefined);visible.forEach(r=>{const id=String(r.id);if(e.target.checked)selected.add(id);else selected.delete(id);});render();});
    rb.querySelectorAll('[data-result-check]').forEach(c=>c.addEventListener('change',()=>{const id=String(c.dataset.resultCheck);if(c.checked)selected.add(id);else selected.delete(id);syncSelectionUI();}));
    rb.querySelectorAll('[data-result-delete]').forEach(b=>b.onclick=()=>deleteIds([b.dataset.resultDelete]));
    byId('hoaV863ExportExcel')?.addEventListener('click',()=>exportExcel(currentExportRows()));
    byId('hoaV863ExportPdf')?.addEventListener('click',()=>exportPdf(currentExportRows()));
    byId('hoaV863DeleteSelected')?.addEventListener('click',()=>deleteIds([...selected]));
    syncSelectionUI();
    const info=byId('hoaV863PageInfo'); if(info){const max=Math.max(1,Math.ceil(filtered.length/(pageSize||filtered.length||1)));info.textContent=`Page ${page} / ${max} · ${filtered.length} result${filtered.length===1?'':'s'}`;}
  }

  function syncSelectionUI(){
    const count=byId('hoaV863SelectionCount');if(count)count.textContent=`${selected.size} selected`;
    const del=byId('hoaV863DeleteSelected');if(del)del.disabled=selected.size===0||busy;
  }

  function currentExportRows(){
    if(selected.size){
      const pick=rows.filter(r=>selected.has(String(r.id))); if(pick.length)return pick;
    }
    return filtered.slice();
  }

  async function loadRows(){
    const c=client(); if(!c)throw new Error('Supabase is not ready.');
    const r=await c.rpc('hoa_admin_free_test_results');
    if(r.error)throw r.error;
    rows=Array.isArray(r.data)?r.data:[];
    const ids=new Set(rows.map(x=>String(x.id)));
    [...selected].forEach(id=>{if(!ids.has(id))selected.delete(id);});
    applyView();
  }

  async function refresh(showMessage){
    if(busy)return;
    busy=true; syncSelectionUI();
    try{await loadRows();if(showMessage)notify('Free Test Results refreshed.');}
    catch(e){notify('Could not load Free Test Results: '+String(e?.message||e),'error');}
    finally{busy=false;syncSelectionUI();}
  }

  async function deleteIds(ids){
    const clean=[...new Set((ids||[]).map(String).filter(Boolean))];
    if(!clean.length)return;
    const targetRows=rows.filter(r=>clean.includes(String(r.id)));
    const names=targetRows.slice(0,3).map(r=>r.full_name||'Candidate').join(', ');
    const extra=targetRows.length>3?` and ${targetRows.length-3} more`:'';
    const msg=clean.length===1?`Delete the completed Free Test result for ${names||'this candidate'}?`:`Delete ${clean.length} completed Free Test results${names?` (${names}${extra})`:''}? This cannot be undone.`;
    if(!confirm(msg))return;
    const c=client();if(!c){notify('Supabase is not ready.','error');return;}
    busy=true;syncSelectionUI();
    try{
      const r=await c.rpc('hoa_admin_delete_free_test_results',{p_ids:clean});
      if(r.error)throw r.error;
      selected.clear();
      notify(`${Number(r.data||0)} result${Number(r.data||0)===1?'':'s'} deleted successfully.`);
      await loadRows();
    }catch(e){notify('Delete failed: '+String(e?.message||e),'error');}
    finally{busy=false;syncSelectionUI();}
  }

  async function exportExcel(exportRows){
    if(!exportRows.length){alert('No Free Test results to export.');return;}
    try{
      await loadExternalGlobal('XLSX','https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js','Excel export library could not be loaded.');
      const data=[['Rank','Name','Email','Mobile','College','Preparing For','Test','Score','Percentage','Correct','Wrong','Skipped','Time Taken','Submitted At'],...exportRows.map((r,i)=>[i+1,r.full_name||'',r.email||'',r.mobile||'',r.college_name||'',r.preparing_for||'',r.test_title||'',n(r.score).toFixed(2),n(r.percentage).toFixed(2)+'%',n(r.correct),n(r.wrong),n(r.skipped),formatDuration(r.time_taken),fmtDate(r.submitted_at)])];
      const ws=window.XLSX.utils.aoa_to_sheet(data);
      ws['!freeze']={xSplit:0,ySplit:1};
      ws['!autofilter']={ref:`A1:N${data.length}`};
      ws['!cols']=[{wch:7},{wch:24},{wch:30},{wch:15},{wch:28},{wch:20},{wch:30},{wch:10},{wch:12},{wch:10},{wch:10},{wch:10},{wch:12},{wch:24}];
      const wb=window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb,ws,'Free Test Results');
      window.XLSX.writeFile(wb,`HOA_Free_Test_Results_${new Date().toISOString().slice(0,10)}.xlsx`,{bookType:'xlsx'});
      notify(`Excel workbook downloaded for ${exportRows.length} result${exportRows.length===1?'':'s'}.`);
    }catch(e){alert('Excel export failed: '+String(e?.message||e));}
  }

  function loadExternalGlobal(globalName,src,errorText){
    return new Promise((resolve,reject)=>{
      if(window[globalName]){resolve();return;}
      const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>window[globalName]?resolve():reject(new Error(errorText));s.onerror=()=>reject(new Error(errorText));document.head.appendChild(s);
    });
  }

  function loadScript(src){
    return loadExternalGlobal('html2pdf',src,'PDF library could not be loaded.');
  }

  async function exportPdf(exportRows){
    if(!exportRows.length){alert('No Free Test results to export.');return;}
    try{
      await loadScript('https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js');
      const node=document.createElement('div');
      node.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;background:#fff;color:#172B4D;padding:28px;font-family:Arial,sans-serif;';
      node.innerHTML=`<div style="font-size:22px;font-weight:700;margin-bottom:4px">HUB OF ASPIRANTS</div><div style="font-size:16px;font-weight:700;margin-bottom:4px">Free Test Results</div><div style="font-size:10px;margin-bottom:16px;color:#5E7188">Generated ${esc(new Date().toLocaleString())} · ${exportRows.length} result${exportRows.length===1?'':'s'}</div><table style="width:100%;border-collapse:collapse;font-size:8.5px"><thead><tr>${['Rank','Name','Test','Score','%','Correct','Wrong','Skipped','Time','Date'].map(h=>`<th style="border:1px solid #9AA9B8;padding:5px;text-align:left;background:#E9F0F6">${h}</th>`).join('')}</tr></thead><tbody>${exportRows.map((r,i)=>`<tr>${[i+1,r.full_name,r.test_title,n(r.score).toFixed(2),n(r.percentage).toFixed(2)+'%',n(r.correct),n(r.wrong),n(r.skipped),formatDuration(r.time_taken),fmtDate(r.submitted_at)].map(v=>`<td style="border:1px solid #B8C4CF;padding:5px;vertical-align:top">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      document.body.appendChild(node);
      await window.html2pdf().set({margin:[8,8,8,8],filename:`HOA_Free_Test_Results_${new Date().toISOString().slice(0,10)}.pdf`,image:{type:'jpeg',quality:0.96},html2canvas:{scale:1.4,backgroundColor:'#ffffff',useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},pagebreak:{mode:['css','legacy']}}).from(node).save();
      node.remove();notify(`PDF downloaded for ${exportRows.length} result${exportRows.length===1?'':'s'}.`);
    }catch(e){alert('PDF export failed: '+String(e?.message||e));}
  }

  window.hoaV888FreeResults = { refresh, loadRows, currentExportRows };
  window.hoaV888InstallFreeResults = function(){ const rb=byId('hoaV70FreeResults'); if(rb) return refresh(false); return Promise.resolve(); };
  window.hoaV888PrintFreeResults=()=>exportPdf(currentExportRows());
})();
