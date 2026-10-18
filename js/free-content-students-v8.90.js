/* HOA V8.90 — Independent Free Students manager.
 * This module intentionally does not depend on the Free Content tab controller.
 * It can be loaded/retried independently if the shared tab controller is absent.
 */
(function () {
  'use strict';
  if (window.hoaV89FreeStudentsAPI && typeof window.hoaV89FreeStudentsAPI.load === 'function') return;

  const $ = (id) => document.getElementById(id);
  const host = () => $('hoaV70Profiles');
  const client = () => window.supabaseClient || null;
  const esc = window.escapeHTML || ((v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m])));

  function canManage() {
    const role = String(window.hoaAdminRole || '').toLowerCase();
    const permissions = Array.isArray(window.hoaAdminPermissions) ? window.hoaAdminPermissions : [];
    return role === 'owner' || permissions.includes('students.manage');
  }

  function notify(message, isError = false) {
    const h = host();
    if (h) {
      let status = h.querySelector('[data-free-students-status]');
      if (!status) {
        status = document.createElement('div');
        status.dataset.freeStudentsStatus = '1';
        status.className = 'emptyState';
        h.prepend(status);
      }
      status.textContent = message || '';
      status.setAttribute('role', isError ? 'alert' : 'status');
      status.style.color = isError ? '#b42318' : '';
    }
    const global = $('hoaV70AdminMsg');
    if (global) {
      global.textContent = message || '';
      global.style.color = isError ? '#b42318' : '';
    }
  }

  function render(rows) {
    const h = host();
    if (!h) throw new Error('The Free Students panel (hoaV70Profiles) is missing from admin.html.');
    const safeRows = Array.isArray(rows) ? rows : [];
    const hasDelete = canManage();
    h.innerHTML = `
      <div class="hoa-v72-inline-tools"><input type="search" id="hoaV89FreeStudentsSearch" placeholder="Search name, mobile, email or college…" aria-label="Search Free Students"></div>
      <div class="table-responsive"><table class="hoa-v70-table"><thead><tr>
        <th>Name</th><th>Mobile</th><th>Email</th><th>Preparing For</th><th>College</th><th>Year</th><th>Address</th>${hasDelete ? '<th>Action</th>' : ''}
      </tr></thead><tbody>${safeRows.length ? safeRows.map((r) => `<tr data-free-student-row>
        <td>${esc(r.full_name || '')}</td><td>${esc(r.mobile || '')}</td><td>${esc(r.email || '')}</td><td>${esc(r.preparing_for || '')}</td><td>${esc(r.college_name || '')}</td><td>${esc(r.passout_year || '')}</td><td>${esc(r.address || '')}</td>
        ${hasDelete ? `<td><button type="button" class="secondary hoa-v70-delete-student" data-free-student-id="${esc(r.id || '')}">Delete</button></td>` : ''}
      </tr>`).join('') : `<tr><td colspan="${hasDelete ? 8 : 7}"><div class="emptyState">No Free Student registrations found.</div></td></tr>`}</tbody></table></div>`;
    const search = $('hoaV89FreeStudentsSearch');
    search?.addEventListener('input', () => {
      const q = String(search.value || '').trim().toLowerCase();
      h.querySelectorAll('[data-free-student-row]').forEach((row) => { row.hidden = !!q && !row.textContent.toLowerCase().includes(q); });
    });
    h.querySelectorAll('[data-free-student-id]').forEach((button) => button.addEventListener('click', async () => {
      const id = button.dataset.freeStudentId;
      if (!id || button.disabled) return;
      if (!window.confirm('Delete this Free Student registration?\n\nThis removes only the Free Student record. Paid Student and Admin records are not touched.')) return;
      button.disabled = true;
      try {
        if (typeof window.hoaRequireAdminPermission !== 'function') throw new Error('Admin permission service is unavailable.');
        await window.hoaRequireAdminPermission('students.manage');
        const c = client();
        if (!c || typeof c.rpc !== 'function') throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
        const response = await c.rpc('hoa_admin_free_student_delete', { p_id: id });
        if (response?.error) throw response.error;
        notify('Free Student deleted successfully. Refreshing the list…');
        await load();
      } catch (error) {
        button.disabled = false;
        notify('Unable to delete Free Student: ' + String(error?.message || error), true);
      }
    }));
  }

  async function load() {
    const h = host();
    if (!h) throw new Error('The Free Students panel (hoaV70Profiles) is missing from admin.html.');
    const c = client();
    if (!c || typeof c.rpc !== 'function') throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
    h.innerHTML = '<div class="emptyState" role="status">Loading Free Students…</div>';
    const response = await c.rpc('hoa_admin_free_student_list');
    if (response?.error) throw response.error;
    render(Array.isArray(response?.data) ? response.data : []);
    const count = Array.isArray(response?.data) ? response.data.length : 0;
    notify(`${count} Free Student record${count === 1 ? '' : 's'} loaded.`);
    return count;
  }

  window.hoaV89FreeStudentsAPI = { load, refresh: load, render };
})();
