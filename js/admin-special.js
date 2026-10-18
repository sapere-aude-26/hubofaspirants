/* HOA V8.90.42 — poster originals are retained; new homepage display images use cached, optimized variants. */
/* HOA Safe Two-File Consolidation — Phase 6J
   Baseline: Phase 6I
   Consolidated WITHOUT changing the original runtime positions:
   - js/admin/posters.js executes at its original script position.
   - js/admin/free-content-workspace.js is exposed as an initializer and executed
     by index.html at the original free-content script position.
*/

(function(){
  "use strict";


  "use strict";

  const BUCKET = "posters";

  function getClient(){
    try{
      return (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
      )
        ? window.supabaseClient
        : null;
    }catch(_){
      return null;
    }
  }

  function setMessage(message){
    const node = document.getElementById("hoaV59AdminMsg");
    if(node) node.textContent = message;
  }

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    }[c]));
  }

  async function requireSession(){
    const client = getClient();

    if(!client?.auth){
      throw new Error("Supabase client is not available.");
    }

    const result =
      await client.auth.getSession();

    if(result.error) throw result.error;

    if(!result.data?.session){
      throw new Error(
        "Please log in to the Admin account again."
      );
    }

    return result.data.session;
  }

  async function requirePosterManage(){
    const session=await requireSession();
    if(typeof window.hoaRequireAdminPermission!=="function")throw new Error("Admin permission service is not available.");
    await window.hoaRequireAdminPermission("posters.manage");
    return session;
  }

  function mount(){
    const admin =
      document.getElementById("adminOnlyDashboard");

    const host =
      document.getElementById("hoaPosterAdminHost");

    if(
      !admin ||
      !host ||
      document.getElementById("hoaV59Admin")
    ){
      return;
    }

    const section =
      document.createElement("section");

    section.id = "hoaV59Admin";
    section.className =
      "hoa-v59-admin hoa-v59-admin-shell";

    section.innerHTML = `
      <p class="hoa-v59-mini">
        Upload and manage posters stored in Supabase.
        Active posters appear in the public Latest Updates carousel.
      </p>

      <div class="hoa-v59-poster-upload-row">
        <input
          id="hoaV59File"
          type="file"
          accept="image/png,image/jpeg,image/webp">

        <input
          id="hoaV59Title"
          placeholder="Poster title">

        <input
          id="hoaV59Order"
          type="number"
          value="0"
          placeholder="Order">

        <button id="hoaV59Upload" type="button">
          Upload Poster
        </button>
      </div>
      <div class="hoa-v59-poster-optimize-row" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0 14px">
        <button id="hoaV59Optimize" type="button">Optimize Existing Posters</button>
        <span style="font-size:12px;color:#5d7187">Creates smaller display images for the homepage. Original files are kept in Storage.</span>
      </div>

      <div id="hoaV59AdminMsg" role="status" aria-live="polite"></div>
      <div id="hoaV59AdminList"></div>
    `;

    host.appendChild(section);

    document
      .getElementById("hoaV59Upload")
      ?.addEventListener(
        "click",
        upload
      );
    document
      .getElementById("hoaV59Optimize")
      ?.addEventListener(
        "click",
        optimizeExistingPosters
      );

    refreshAdmin();
  }

  /*
   * Build a homepage-sized display image in the browser. The source file is
   * always uploaded separately and retained; the generated copy has a
   * predictable ".display.webp" / ".display.jpg" suffix.
   *
   * Max edge 2000px is sufficient for the current poster card at high-DPI
   * displays while avoiding huge 4K/8K poster downloads. Aspect ratio is kept.
   */
  async function createPosterDisplayVariant(file){
    if(!file) return null;

    let objectUrl = null;
    let image = null;
    let cleanup = function(){};

    try{
      if(typeof window.createImageBitmap === "function"){
        try{
          const bitmap = await window.createImageBitmap(file);
          image = bitmap;
          cleanup = function(){ try{ bitmap.close(); }catch(_){} };
        }catch(_){ /* Use Image/URL fallback below. */ }
      }

      if(!image){
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.decoding = "async";
        await new Promise((resolve,reject)=>{
          img.onload = resolve;
          img.onerror = ()=>reject(new Error("The poster image could not be decoded."));
          img.src = objectUrl;
        });
        image = img;
        cleanup = function(){ try{ URL.revokeObjectURL(objectUrl); }catch(_){} };
      }

      const sourceWidth = Number(image.width || image.naturalWidth || 0);
      const sourceHeight = Number(image.height || image.naturalHeight || 0);
      if(!sourceWidth || !sourceHeight) return null;

      const maxEdge = 2000;
      const scale = Math.min(1, maxEdge / sourceWidth, maxEdge / sourceHeight);
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const wasResized = width < sourceWidth || height < sourceHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", {alpha:false});
      if(!context) return null;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const toBlob = (type, quality) => new Promise(resolve=>{
        try{ canvas.toBlob(resolve, type, quality); }
        catch(_){ resolve(null); }
      });

      let blob = await toBlob("image/webp", 0.90);
      if(!blob || blob.type !== "image/webp"){
        blob = await toBlob("image/jpeg", 0.92);
      }
      if(!blob || !blob.size || !/^image\/(webp|jpeg)$/.test(blob.type)) return null;

      /* Only switch the active homepage image when transfer size meaningfully improves.
         A downscaled image can still encode larger than its source (for example, an
         already-compressed JPEG). In that case keep the original rather than making
         poster delivery slower. The original remains stored either way. */
      if(file.size > 0 && blob.size >= file.size * 0.92){
        return null;
      }

      return {
        blob,
        extension: blob.type === "image/webp" ? "webp" : "jpg",
        contentType: blob.type,
        sourceWidth,
        sourceHeight,
        width,
        height,
        sourceBytes: Number(file.size || 0),
        displayBytes: blob.size
      };
    }catch(error){
      console.warn("[HOA posters] Display image optimization skipped:", error);
      return null;
    }finally{
      try{ cleanup(); }catch(_){}
    }
  }

  function displayPathFor(originalPath, extension){
    return String(originalPath || "") + ".display." + (extension === "jpg" ? "jpg" : "webp");
  }

  function isDisplayPath(path){
    return /\.display\.(?:webp|jpe?g)$/i.test(String(path || ""));
  }

  function originalPathForDisplay(path){
    return String(path || "").replace(/\.display\.(?:webp|jpe?g)$/i, "");
  }

  function storagePathsForPosterRecord(path){
    const saved = String(path || "");
    if(isDisplayPath(saved)) return [saved, originalPathForDisplay(saved)];
    return saved ? [saved] : [];
  }

  async function uploadDisplayVariant(client, originalPath, file){
    const variant = await createPosterDisplayVariant(file);
    if(!variant) return null;

    const variantPath = displayPathFor(originalPath, variant.extension);
    const result = await client.storage
      .from(BUCKET)
      .upload(variantPath, variant.blob, {
        contentType: variant.contentType,
        cacheControl: "31536000",
        upsert: true
      });
    if(result.error) throw result.error;
    return {path:variantPath, details:variant};
  }

  async function upload(){
    const client = getClient();
    const file = document.getElementById("hoaV59File")?.files?.[0];
    if(!file){
      setMessage("Choose a poster first.");
      return;
    }
    if(file.size > 10 * 1024 * 1024){
      setMessage("Poster is larger than 10 MB.");
      return;
    }

    let originalUploaded = false;
    let displayUploadedPath = "";
    let displayDetails = null;
    let recordStoragePath = "";
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const originalPath = "slides/" + Date.now() + "-" + safeName;

    try{
      await requirePosterManage();
      setMessage("Uploading original poster...");

      const originalResult = await client.storage
        .from(BUCKET)
        .upload(originalPath, file, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "31536000",
          upsert: false
        });
      if(originalResult.error){
        throw new Error("Storage upload failed: " + originalResult.error.message);
      }
      originalUploaded = true;
      recordStoragePath = originalPath;

      setMessage("Creating optimized homepage image...");
      try{
        const optimized = await uploadDisplayVariant(client, originalPath, file);
        if(optimized){
          displayUploadedPath = optimized.path;
          displayDetails = optimized.details;
          recordStoragePath = optimized.path;
        }
      }catch(optimizationError){
        console.warn("[HOA posters] Display copy upload failed; retaining original as the active image.", optimizationError);
      }

      setMessage("Saving poster record...");
      const title = document.getElementById("hoaV59Title")?.value?.trim() || file.name;
      const order = Number(document.getElementById("hoaV59Order")?.value || 0);
      const insertResult = await client.from("poster_slides").insert({
        title,
        storage_path: recordStoragePath,
        sort_order: order,
        is_active: true
      });

      if(insertResult.error){
        const cleanupPaths = [displayUploadedPath, originalUploaded ? originalPath : ""].filter(Boolean);
        if(cleanupPaths.length){
          try{ await client.storage.from(BUCKET).remove(cleanupPaths); }catch(_){}
        }
        throw new Error("Poster database record failed: " + insertResult.error.message);
      }

      const fileInput = document.getElementById("hoaV59File");
      const titleInput = document.getElementById("hoaV59Title");
      if(fileInput) fileInput.value = "";
      if(titleInput) titleInput.value = "";

      if(displayDetails){
        const savedPct = displayDetails.sourceBytes > 0
          ? Math.max(0, Math.round((1 - displayDetails.displayBytes / displayDetails.sourceBytes) * 100))
          : 0;
        setMessage("Poster uploaded. Optimized display image active (" + displayDetails.width + "×" + displayDetails.height + "; " + savedPct + "% smaller). Original retained in Storage.");
      }else{
        setMessage("Poster uploaded. Original image remains active because it was already efficient or browser optimization was unavailable.");
      }

      await refreshAdmin();
    }catch(error){
      console.error("[HOA admin posters]", error);
      setMessage(error.message || String(error));
      /* If an unexpected pre-record failure occurred, keep the original upload
         intact rather than deleting a file the Admin may need to recover. */
    }
  }

  async function optimizeExistingPosters(){
    const client = getClient();
    const button = document.getElementById("hoaV59Optimize");
    if(button) button.disabled = true;

    try{
      await requirePosterManage();
      const listResult = await client.from("poster_slides")
        .select("id,title,storage_path,sort_order,is_active")
        .order("sort_order", {ascending:true});
      if(listResult.error) throw listResult.error;

      const rows = Array.isArray(listResult.data) ? listResult.data : [];
      const candidates = rows.filter(row => row && row.storage_path && !isDisplayPath(row.storage_path));
      if(!candidates.length){
        setMessage("All existing poster records already use optimized display files, or no posters are available.");
        return;
      }

      const confirmed = confirm(
        "Create optimized display images for " + candidates.length + " existing poster(s)?\n\nOriginal files will be kept in Storage. Poster order, title, active status and links remain unchanged."
      );
      if(!confirmed) return;

      let optimizedCount = 0;
      let unchangedCount = 0;
      const errors = [];

      for(let i=0; i<candidates.length; i++){
        const row = candidates[i];
        setMessage("Optimizing poster " + (i + 1) + " of " + candidates.length + ": " + (row.title || row.storage_path));
        try{
          const download = await client.storage.from(BUCKET).download(row.storage_path);
          if(download.error) throw download.error;
          const sourceBlob = download.data;
          if(!sourceBlob) throw new Error("Original poster download returned no image data.");

          const variant = await createPosterDisplayVariant(sourceBlob);
          if(!variant){
            unchangedCount++;
            continue;
          }

          const variantPath = displayPathFor(row.storage_path, variant.extension);
          const uploadResult = await client.storage.from(BUCKET).upload(variantPath, variant.blob, {
            contentType: variant.contentType,
            cacheControl: "31536000",
            upsert: true
          });
          if(uploadResult.error) throw uploadResult.error;

          const updateResult = await client.from("poster_slides")
            .update({storage_path:variantPath, updated_at:new Date().toISOString()})
            .eq("id", row.id);
          if(updateResult.error){
            try{ await client.storage.from(BUCKET).remove([variantPath]); }catch(_){}
            throw updateResult.error;
          }
          optimizedCount++;
        }catch(error){
          console.error("[HOA poster optimization]", row.storage_path, error);
          errors.push((row.title || row.storage_path) + ": " + (error.message || String(error)));
        }
      }

      await refreshAdmin();
      let summary = "Poster optimization finished: " + optimizedCount + " optimized, " + unchangedCount + " already efficient or skipped, " + errors.length + " failed. Original files are retained.";
      if(errors.length) summary += " Details: " + errors.slice(0,3).join(" | ");
      setMessage(summary);
    }catch(error){
      console.error("[HOA poster optimization]", error);
      setMessage("Poster optimization failed: " + (error.message || String(error)));
    }finally{
      if(button) button.disabled = false;
    }
  }

  async function refreshAdmin(){
    const client = getClient();
    const target =
      document.getElementById(
        "hoaV59AdminList"
      );

    if(!client || !target) return;

    try{
      const result =
        await client
          .from("poster_slides")
          .select(
            "id,title,storage_path,sort_order,is_active"
          )
          .order(
            "sort_order",
            {ascending:true}
          );

      if(result.error){
        throw result.error;
      }

      const rows =
        Array.isArray(result.data)
          ? result.data
          : [];

      target.innerHTML = `
        <table class="hoa-v59-list">
          <thead>
            <tr>
              <th>Poster</th>
              <th>Order</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map(row => `
              <tr>
                <td>${escapeHtml(row.title)}</td>
                <td>${escapeHtml(row.sort_order)}</td>
                <td>${row.is_active ? "true" : "false"}</td>
                <td>
                  <button
                    type="button"
                    data-poster-toggle="${escapeHtml(row.id)}">
                    ${row.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    type="button"
                    data-poster-delete="${escapeHtml(row.id)}">
                    Delete
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;

      target
        .querySelectorAll(
          "[data-poster-toggle]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            async () => {
              try{
                await requirePosterManage();

                const id =
                  button.dataset.posterToggle;

                const row =
                  rows.find(
                    item =>
                      String(item.id) === String(id)
                  );

                if(!row) return;

                const updateResult =
                  await client
                    .from("poster_slides")
                    .update({
                      is_active:
                        !row.is_active,
                      updated_at:
                        new Date().toISOString()
                    })
                    .eq("id",row.id);

                if(updateResult.error){
                  throw updateResult.error;
                }

                await refreshAdmin();

              }catch(error){
                alert(
                  "Poster update failed: " +
                  error.message
                );
              }
            }
          );
        });

      target
        .querySelectorAll(
          "[data-poster-delete]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            async () => {
              try{
                if(
                  !confirm(
                    "Delete this poster permanently?"
                  )
                ){
                  return;
                }

                await requirePosterManage();

                const id =
                  button.dataset.posterDelete;

                const row =
                  rows.find(
                    item =>
                      String(item.id) === String(id)
                  );

                if(!row) return;

                const deleteResult =
                  await client
                    .from("poster_slides")
                    .delete()
                    .eq("id",row.id);

                if(deleteResult.error){
                  throw deleteResult.error;
                }

                const storageResult =
                  await client.storage
                    .from(BUCKET)
                    .remove(storagePathsForPosterRecord(row.storage_path));

                if(storageResult.error){
                  const restore = await client
                    .from("poster_slides")
                    .insert({
                      id:row.id,
                      title:row.title,
                      storage_path:row.storage_path,
                      sort_order:row.sort_order,
                      is_active:row.is_active
                    });
                  if(restore.error){
                    throw new Error(
                      "Poster file cleanup failed and the database record could not be restored. Manual cleanup is required: " +
                      restore.error.message
                    );
                  }
                  throw new Error(
                    "Poster file could not be removed. The database record was restored; no poster was deleted. Please retry."
                  );
                }

                await refreshAdmin();

              }catch(error){
                alert(
                  "Poster delete failed: " +
                  error.message
                );
              }
            }
          );
        });

    }catch(error){
      target.textContent =
        "Could not load poster list: " +
        (error.message || String(error));
    }
  }

  window.hoaV59RefreshAdmin = refreshAdmin;

  function boot(){
    mount();
  }

  if(
    document.readyState ===
    "loading"
  ){
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {once:true}
    );
  }else{
    boot();
  }


})();

/* Original free-content module is intentionally delayed until its original
   index.html execution position. This preserves the Phase 6I Admin runtime order. */
window.__HOA_FREE_CONTENT_INIT = function(){
  const staticFreePanel = document.getElementById('adminSectionFreeContentPanel');
  if(staticFreePanel && (staticFreePanel.dataset.hoaFreeStatic==='1' || staticFreePanel.querySelector('#hoaV611FreeTabs'))){ return; }
  (function(){

  'use strict';
  const V='HOA V6.1.1';
  const navOrder=['adminNavMaster','adminNavCourse','adminNavStudent','adminNavTest','adminNavVideo','adminNavNotes','adminNavResult','adminNavFreeContent','adminNavPoster','adminNavAdmin'];

  function ensureFreePanel(){
    if(typeof window.ensureAdminPanel==='function'){
      try{return window.ensureAdminPanel()}catch(e){console.warn(V+' ensureAdminPanel',e)}
    }
    return document.getElementById('adminSectionFreeContentPanel');
  }

  function reorderNav(){
    const nav=document.querySelector('#adminReferenceSidebar .adminSectionNav, #adminOnlyDashboard .adminSectionNav');
    if(!nav)return;
    const free=document.getElementById('adminNavFreeContent');
    if(!free)return;
    if(typeof window.hoaAdminArrangeSidebar==='function')window.hoaAdminArrangeSidebar();
    navOrder.forEach(id=>{const b=document.getElementById(id);if(b)b.dataset.hoa611Order=String(navOrder.indexOf(id))});
  }

  function decorateNav(){
    const b=document.getElementById('adminNavFreeContent');
    if(!b)return;
    if(!b.querySelector('.adminRefIcon')){
      const label=(b.textContent||'').replace(/^\s*🎁\s*/,'').trim()||'Free Content';
      b.textContent='';
      const i=document.createElement('span');i.className='adminRefIcon';i.textContent='🎁';i.setAttribute('aria-hidden','true');
      const l=document.createElement('span');l.className='adminRefLabel';l.textContent=label;
      b.append(i,l);
    }
    b.setAttribute('aria-label','Free Content');
  }

  function ensureAreas(){
    const panel=document.getElementById('adminSectionFreeContentPanel');
    if(!panel||panel.dataset.hoa611Ready==='1')return;
    const editor=panel.querySelector('.hoa-v70-content-editor');
    const list=panel.querySelector('#hoaV70AdminList');
    const profiles=panel.querySelector('#hoaV70Profiles');
    if(!editor||!list||!profiles)return;
    const card=panel.querySelector('.dashPanel');
    if(!card)return;

    const toolbar=document.createElement('div');
    toolbar.className='hoa-v611-free-toolbar';
    toolbar.innerHTML='<div class="hoa-v611-free-tabs" role="tablist" aria-label="Free Content management"><button type="button" class="hoa-v611-free-tab active" data-free-area="content">📚 Content Library</button><button type="button" class="hoa-v611-free-tab" data-free-area="students">👥 Free Students</button><button type="button" class="hoa-v611-free-tab" data-free-area="results">📊 Free Test Results</button></div><span class="hoa-v611-free-toolbar-note">Manage Free Content without leaving the Admin workspace.</span>';

    const contentArea=document.createElement('section');
    contentArea.className='hoa-v611-free-area active';contentArea.dataset.freeArea='content';
    const stats=document.createElement('div');stats.className='hoa-v611-free-stat-grid';
    stats.innerHTML='<div class="hoa-v611-free-stat"><b id="hoaV611ContentStat">0</b><span>Total Free Content</span></div><div class="hoa-v611-free-stat"><b id="hoaV611PublishedStat">0</b><span>Published</span></div><div class="hoa-v611-free-stat"><b id="hoaV611TestStat">0</b><span>Free Tests / Mock Tests</span></div>';
    contentArea.append(stats,editor);

    const studentsArea=document.createElement('section');
    studentsArea.className='hoa-v611-free-area';studentsArea.dataset.freeArea='students';
    const studentHead=document.createElement('div');studentHead.className='hoa-v70-subhead';studentHead.innerHTML='<div><h3>Free Students</h3><p>Manage Free Student registrations separately from Paid Students and Admin accounts.</p></div>';
    studentsArea.append(studentHead,profiles);

    const resultsArea=document.createElement('section');
    resultsArea.className='hoa-v611-free-area';resultsArea.dataset.freeArea='results';
    const resultHost=document.createElement('div');resultHost.id='hoaV611ResultsHost';
    resultsArea.append(resultHost);

    const existingSubheads=[...card.querySelectorAll('.hoa-v70-subhead')];
    existingSubheads.forEach(x=>{
      if(x.textContent.includes('Published / Saved Content')||x.textContent.includes('Free Students'))x.remove();
    });

    /* Existing saved-content list belongs to Content Library. */
    const contentHead=document.createElement('div');contentHead.className='hoa-v70-subhead';contentHead.innerHTML='<div><h3>Published / Saved Content</h3><p>Preview, edit, publish or delete resources without leaving this section.</p></div>';
    contentArea.append(contentHead,list);

    const fr=document.getElementById('hoaV70FreeResults');
    if(fr){resultsArea.append(fr)}else{
      const empty=document.createElement('div');empty.id='hoaV611ResultsPlaceholder';empty.className='emptyState';empty.textContent='Free Test Results will appear here when available.';resultsArea.append(empty);
    }

    toolbar.querySelectorAll('[data-free-area]').forEach(btn=>btn.addEventListener('click',function(){
      const target=this.dataset.freeArea;
      toolbar.querySelectorAll('.hoa-v611-free-tab').forEach(x=>x.classList.toggle('active',x===this));
      card.querySelectorAll('.hoa-v611-free-area').forEach(x=>x.classList.toggle('active',x.dataset.freeArea===target));
      if(target==='results')window.hoaV611RefreshFreeResults?.();
    }));

    /* Insert after the main section header. */
    const header=card.querySelector('.hoa-admin-section-head');
    if(header)header.after(toolbar);else card.prepend(toolbar);
    card.append(contentArea,studentsArea,resultsArea);
    panel.dataset.hoa611Ready='1';
  }

  function updateStats(){
    const rows=[...document.querySelectorAll('#hoaV70AdminList tbody tr')];
    const total=rows.length;
    const published=rows.filter(r=>/\bYES\b/i.test(r.children[2]?.textContent||'')).length;
    const tests=rows.filter(r=>/test/i.test(r.children[1]?.textContent||'')).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};
    set('hoaV611ContentStat',total);set('hoaV611PublishedStat',published);set('hoaV611TestStat',tests);
  }

  function enhance(){
    const p=ensureFreePanel();
    reorderNav();decorateNav();
    if(p){ensureAreas();updateStats()}
  }

  window.hoaV611RefreshFreeResults=async function(){
    try{
      if(typeof window.hoaV70LoadAdmin==='function')await window.hoaV70LoadAdmin();
      const fr=document.getElementById('hoaV70FreeResults');
      const host=document.getElementById('hoaV611ResultsHost');
      if(fr&&host&&!host.contains(fr))host.appendChild(fr);
      updateStats();
    }catch(e){console.warn(V+' result refresh',e)}
  };

  const oldShow=window.showAdminSection;
  window.showAdminSection=async function(section){
    if(section==='freecontent'){
      ensureFreePanel();reorderNav();decorateNav();ensureAreas();
      const p=document.getElementById('adminSectionFreeContentPanel');
      document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel').forEach(x=>{x.classList.toggle('active',x===p);if(x!==p)x.style.removeProperty('display')});
      document.querySelectorAll('#adminReferenceSidebar .adminSectionNav button, #adminOnlyDashboard .adminSectionNav button').forEach(x=>x.classList.remove('active'));
      document.getElementById('adminNavFreeContent')?.classList.add('active');
      p?.style.setProperty('display','block','important');
      if(typeof window.hoaV70LoadAdmin==='function')await window.hoaV70LoadAdmin();
      ensureAreas();updateStats();reorderNav();decorateNav();
      const title=document.getElementById('adminReferencePageTitle');
      const sub=document.getElementById('adminReferencePageSub');
      if(title)title.textContent='Free Content';
      if(sub)sub.textContent='Create, publish, preview and manage Free Student resources';
      return;
    }
    const r=oldShow?await oldShow.apply(this,arguments):undefined;
    reorderNav();decorateNav();
    return r;
  };

  function boot(){
    enhance();
    setTimeout(enhance,250);setTimeout(enhance,1000);setTimeout(enhance,2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

  })();
};
