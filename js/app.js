/* HOA SAFE TWO-FILE CONSOLIDATION PHASE 6H
 * Consolidated from js/app.js then js/auth.js.
 * Original adjacent script order preserved exactly.
 */

/* ============================================================
   HOA V6 — Shared runtime state bridge
   These globals intentionally remain window-compatible while
   Student/Admin controllers are being consolidated.
   ============================================================ */
var questions = window.questions || (window.HOA_sanitizeQuestions ? window.HOA_sanitizeQuestions([
  ["The main purpose of camber on a road surface is to","Increase pavement thickness","Drain rainwater from the pavement surface","Reduce traffic volume","Increase road width",2],
  ["According to IRC, the ruling design speed for plain terrain on a National Highway is generally","60 km/h","80 km/h","100 km/h","120 km/h",2],
  ["The stopping sight distance consists of","Overtaking distance only","Lag distance only","Lag distance and braking distance","Braking distance only",3],
  ["The CBR test is primarily used for determining","Bitumen content","Strength of subgrade soil","Aggregate impact value","Traffic volume",2],
  ["The penetration test of bitumen is used to determine its","Ductility","Viscosity","Hardness or consistency","Flash point",3],
  ["The maximum permissible superelevation generally adopted for roads in plain and rolling terrain is","4%","5%","7%","10%",3],
  ["Which pavement type distributes wheel load through slab action?","Flexible pavement","Rigid pavement","Gravel pavement","Earth road",2],
  ["The PCU value of a vehicle represents","Pavement Construction Unit","Passenger Car Unit","Pavement Capacity Unit","Public Car Utility",2],
  ["The Los Angeles abrasion test is used to determine the","Impact strength of aggregate","Resistance of aggregate to wear","Water absorption of aggregate","Shape of aggregate",2],
  ["In a rotary intersection, traffic movement is controlled primarily by","Traffic signals","Railway signals","Priority rules and weaving","Toll barriers",3]
]) : []);
window.questions = questions;

var tests = window.tests || [];
window.tests = tests;

var testTitle = window.testTitle || "TES Mock Test 01";
var durationMinutes = Number.isFinite(Number(window.durationMinutes)) ? Number(window.durationMinutes) : 10;
var marksPerCorrect = Number.isFinite(Number(window.marksPerCorrect)) ? Number(window.marksPerCorrect) : 1;
var negativeMarks = Number.isFinite(Number(window.negativeMarks)) ? Number(window.negativeMarks) : 0.25;
var csvLoaded = Boolean(window.csvLoaded);
var activeTestId = window.activeTestId || null;
var currentAttemptId = window.currentAttemptId || null;
var v35SubmissionInFlight = Boolean(window.v35SubmissionInFlight);
var currentAttemptCreatePromise = window.currentAttemptCreatePromise || null;
var currentAttemptLaunchToken = Number(window.currentAttemptLaunchToken) || 0;
var pendingAnswers = Array.isArray(window.pendingAnswers) ? window.pendingAnswers : [];
var marked = Array.isArray(window.marked) ? window.marked : [];
var visited = Array.isArray(window.visited) ? window.visited : [];
var examStartedAt = window.examStartedAt || null;
var examStartedPerf = window.examStartedPerf || null;
var reviewCurrent = Number(window.reviewCurrent) || 0;
var current = Number(window.current) || 0;
var answers = Array.isArray(window.answers) ? window.answers : Array(questions.length).fill(null);
var timer = Number.isFinite(Number(window.timer)) ? Number(window.timer) : 600;
var submitted = Boolean(window.submitted);
var interval = window.interval || null;
var currentStudent = window.currentStudent || null;
var adminLoggedIn = Boolean(window.adminLoggedIn);
var adminPreviewMode = Boolean(window.adminPreviewMode);
var testLaunchToken = Number(window.testLaunchToken) || 0;
window.currentStudent = currentStudent;
window.adminLoggedIn = adminLoggedIn;
window.adminPreviewMode = adminPreviewMode;

/*
 * HUB OF ASPIRANTS — Core Foundation
 * Phase 2 of JavaScript consolidation.
 *
 * This file is now the single owner of the former foundation layer:
 *   - configuration
 *   - DOM helpers
 *   - common utilities
 *   - application state bridge
 *   - Supabase initialization/data helpers
 *   - core application bootstrap
 *
 * Compatibility note:
 * Existing global names are intentionally preserved because the legacy
 * application and the remaining feature modules still use them. Later
 * consolidation phases will reduce those legacy dependencies one feature at
 * a time.
 */
(function (global) {
  'use strict';

  /* ============================================================
     1. AUTHORITATIVE APPLICATION CONFIGURATION
     ============================================================ */
  var HOA_VERSION = '6.0.9';
  var HOA_CONFIG = Object.freeze({
    version: HOA_VERSION,
    appName: 'HUB OF ASPIRANTS',
    supabaseUrl: 'https://pnzhtiwwqiqnnkecogcc.supabase.co',
    supabasePublishableKey: 'sb_publishable_Qwq-5g_j446D3fEyJn5MOg_p9y6JNBC'
  });

  global.HOA_VERSION = HOA_VERSION;
  global.HOA_CONFIG = HOA_CONFIG;

  /* Preserve the legacy global identifiers used by index.html and
     the remaining classic scripts. */
  global.SUPABASE_URL = HOA_CONFIG.supabaseUrl;
  global.SUPABASE_PUBLISHABLE_KEY = HOA_CONFIG.supabasePublishableKey;

  /* ============================================================
     2. COMMON UTILITIES
     ============================================================ */
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (match) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    });
  }

  function safeJSONParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
  }

  function clampNumber(value, min, max, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback == null ? min : fallback;
    return Math.min(max, Math.max(min, n));
  }

  var HOA_UTILS = global.HOA_UTILS || {
    escapeHTML: escapeHTML,
    safeJSONParse: safeJSONParse,
    isValidEmail: isValidEmail,
    clampNumber: clampNumber
  };
  HOA_UTILS.escapeHTML = escapeHTML;
  HOA_UTILS.safeJSONParse = safeJSONParse;
  HOA_UTILS.isValidEmail = isValidEmail;
  HOA_UTILS.clampNumber = clampNumber;
  global.HOA_UTILS = HOA_UTILS;
  global.escapeHTML = escapeHTML;

  /* ============================================================
     3. DOM FOUNDATION
     ============================================================ */
  var HOA_DOM = global.HOA_DOM || {
    get: function (id) {
      return document.getElementById(id);
    },
    one: function (selector, root) {
      return (root || document).querySelector(selector);
    },
    all: function (selector, root) {
      return Array.from((root || document).querySelectorAll(selector));
    },
    show: function (target) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (el) el.classList.remove('hidden');
      return el;
    },
    hide: function (target) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (el) el.classList.add('hidden');
      return el;
    },
    toggle: function (target, visible) {
      return visible ? this.show(target) : this.hide(target);
    },
    text: function (target, value) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (el) el.textContent = value == null ? '' : String(value);
      return el;
    },
    html: function (target, value) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (el) el.innerHTML = value == null ? '' : String(value);
      return el;
    }
  };
  global.HOA_DOM = HOA_DOM;

  function returnToStudentDashboardSafe() {
    try {
      if (typeof global.adminPreviewMode !== 'undefined') {
        global.adminPreviewMode = false;
      }
      document.documentElement.classList.remove('admin-ui');
      if (document.body) document.body.classList.remove('admin-ui');

      [
        'adminDashboard',
        'adminOnlyDashboard',
        'adminSection',
        'adminPanel'
      ].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

      if (typeof global.returnToStudentDashboard === 'function') {
        return global.returnToStudentDashboard();
      }
      if (typeof global.showStudentDashboard === 'function') {
        return global.showStudentDashboard();
      }
      if (typeof global.openStudentDashboard === 'function') {
        return global.openStudentDashboard();
      }

      [
        'studentDashboard',
        'studentHome',
        'studentSection',
        'home'
      ].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
      });
    } catch (error) {
      console.warn('Student navigation error:', error);
    }
  }
  global.returnToStudentDashboardSafe = returnToStudentDashboardSafe;

  /* ============================================================
     4. APPLICATION STATE BRIDGE
     ============================================================ */
  var HOA_STATE = global.HOA_STATE || {
    app: {
      version: HOA_VERSION,
      initialized: false
    },
    auth: {
      session: null,
      user: null,
      role: null
    },
    student: {
      profile: null
    },
    admin: {
      section: null
    },
    exam: {
      currentTest: null,
      currentAttempt: null
    },
    legacy: {
      sync: function () {
        try {
          if (typeof currentStudent !== 'undefined') {
            this.student.profile = currentStudent || null;
          }
          if (typeof adminLoggedIn !== 'undefined') {
            this.auth.role = adminLoggedIn
              ? 'admin'
              : (typeof currentStudent !== 'undefined' && currentStudent ? 'student' : null);
          }
          if (typeof activeTestId !== 'undefined') {
            this.exam.currentTest = activeTestId || null;
          }
          if (typeof currentAttemptId !== 'undefined') {
            this.exam.currentAttempt = currentAttemptId || null;
          }
        } catch (_) {
          /* The legacy variables may not exist yet during initial parsing. */
        }
        return this;
      }
    }
  };
  HOA_STATE.app.version = HOA_VERSION;
  global.HOA_STATE = HOA_STATE;

  /* ============================================================
     5. SUPABASE / DATA FOUNDATION
     ============================================================ */
/*
 * These two variables intentionally live at classic-script global scope.
 * The remaining legacy code still references `supabaseClient` and
 * `supabaseConnected` as global identifiers, not only via window.*.
 */
var supabaseClient = window.supabaseClient || null;
var supabaseConnected = Boolean(window.supabaseConnected);
window.supabaseClient = supabaseClient;
window.supabaseConnected = supabaseConnected;

function initSupabase() {
  try {
    /* Reuse an already-created client. This makes initialization idempotent
       and prevents the old inline bootstrap from creating a second client. */
    if (window.supabaseClient && typeof window.supabaseClient.auth === 'object') {
      supabaseClient = window.supabaseClient;
      supabaseConnected = true;
      window.supabaseConnected = true;
      return true;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase library did not load.');
    }

    supabaseClient = window.supabase.createClient(
      window.HOA_CONFIG.supabaseUrl,
      window.HOA_CONFIG.supabasePublishableKey
    );
    supabaseConnected = true;
    window.supabaseClient = supabaseClient;
    window.supabaseConnected = true;
    return true;
  } catch (e) {
    console.error('Supabase init error:', e);
    supabaseClient = null;
    supabaseConnected = false;
    window.supabaseClient = null;
    window.supabaseConnected = false;
    return false;
  }
}
  global.initSupabase = initSupabase;

  /* The CDN script is parser-blocking and appears immediately before app.js,
     so initialize the client now instead of waiting for a legacy inline
     bootstrap later in the document. */
  initSupabase();

  function supaError(action, error) {
    console.error('Supabase ' + action, error);
    return error && error.message
      ? error.message
      : String(error || 'Unknown error');
  }
  global.supaError = supaError;

  async function sha256(text) {
    var data = new TextEncoder().encode(text);
    var hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }
  global.sha256 = sha256;

  function studentFromRow(row) {
    row = row || {};
    return {
      id: row.id,
      name: row.full_name,
      email: row.email,
      mobile: row.phone,
      qualification: row.qualification,
      passoutYear: row.passout_year,
      college: row.college_name,
      /* Security hardening: keep only the boolean status in the browser;
         never copy password hashes into client-side student objects. */
      passwordAssigned: Boolean(row.password_hash),
      status: row.status || 'Password not set',
      accessType: row.access_type || 'paid',
      joined: row.created_at || new Date().toISOString()
    };
  }
  global.studentFromRow = studentFromRow;

  function testFromRows(testRow, questionRows) {
    testRow = testRow || {};
    questionRows = Array.isArray(questionRows) ? questionRows : [];

    var qs = questionRows
      .filter(function (q) { return q.test_id === testRow.id; })
      .sort(function (a, b) {
        return (a.question_order || 0) - (b.question_order || 0);
      })
      .map(function (q) {
        var arr = [
          q.question_text,
          q.option_1,
          q.option_2,
          q.option_3,
          q.option_4,
          q.correct_option,
          q.explanation || ''
        ];
        try {
          Object.defineProperty(arr, '__id', {
            value: q.id,
            enumerable: false,
            writable: true
          });
        } catch (_) {
          /* Non-critical compatibility property. */
        }
        return arr;
      });

    return {
      id: testRow.id,
      title: testRow.title,
      questions: qs,
      duration: Number(testRow.duration_minutes) || 10,
      marks: Number(testRow.marks_per_question) || 1,
      negative: Number(testRow.negative_marking) || 0,
      is_published: Boolean(testRow.is_published),
      accessType: testRow.access_type || 'paid',
      created: testRow.created_at
    };
  }
  global.testFromRows = testFromRows;

  async function supabaseHealthCheck() {
    if (!supabaseClient) {
      return {
        ok: false,
        message: 'Supabase client is not initialized.'
      };
    }

    var result = await supabaseClient.from('tests').select('id').limit(1);
    if (result.error) {
      return {
        ok: false,
        message: supaError('health check', result.error)
      };
    }
    return {
      ok: true,
      message: 'Supabase connection successful.'
    };
  }
  global.supabaseHealthCheck = supabaseHealthCheck;

  async function loadStudentsFromSupabase() {
    if (!global.HOA_SERVICES || !global.HOA_SERVICES.student) {
      return;
    }

    var data = await global.HOA_SERVICES.student.list();
    var users = (Array.isArray(data) ? data : []).map(studentFromRow);

    try {
      localStorage.setItem('missionTES_users_cache', JSON.stringify(users));
    } catch (e) {
      console.warn('Student cache write skipped:', e);
    }
    return users;
  }
  global.loadStudentsFromSupabase = loadStudentsFromSupabase;

  async function loadTestsFromSupabase() {
    if (!supabaseClient) return;

    var testResponse = await supabaseClient
      .from('tests')
      .select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,created_at')
      .order('created_at', { ascending: true });

    if (testResponse.error) throw testResponse.error;

    var testRows = testResponse.data || [];
    var ids = testRows.map(function (t) { return t.id; });

    if (!ids.length) {
      if (typeof tests !== 'undefined') {
        tests = [];
      }
      return;
    }

    var isAdmin = typeof adminLoggedIn !== 'undefined' ? Boolean(adminLoggedIn) : false;
    var questionSource = isAdmin ? 'questions' : 'student_questions';
    var questionSelect = isAdmin
      ? 'id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order'
      : 'id,test_id,question_text,option_1,option_2,option_3,option_4,question_order';

    var questionResponse = await supabaseClient
      .from(questionSource)
      .select(questionSelect)
      .in('test_id', ids)
      .order('question_order', { ascending: true });

    if (questionResponse.error) throw questionResponse.error;

    var loadedTests = testRows
      .filter(function (t) { return t.is_published || isAdmin; })
      .map(function (t) { return testFromRows(t, questionResponse.data || []); })
      .filter(function (t) { return t.questions.length > 0; });

    /* Never expose answer keys or explanations in an ordinary student test
       object or browser cache. */
    if (!isAdmin) {
      loadedTests = loadedTests.map(function (t) {
        return Object.assign({}, t, {
          questions: t.questions.map(function (q) {
            var clean = [q[0], q[1], q[2], q[3], q[4]];
            try {
              Object.defineProperty(clean, '__id', {
                value: q.__id,
                enumerable: false
              });
            } catch (_) {
              /* Non-critical compatibility property. */
            }
            return clean;
          })
        });
      });
    }

    if (typeof tests !== 'undefined') {
      tests = loadedTests;
    }

    try {
      localStorage.setItem('missionTES_tests_cache', JSON.stringify(loadedTests));
    } catch (e) {
      console.warn('Test cache write skipped:', e);
    }

    return loadedTests;
  }
  global.loadTestsFromSupabase = loadTestsFromSupabase;

  /* ============================================================
     6. APPLICATION BOOTSTRAP
     ============================================================ */
  var HOA_APP = global.HOA_APP || {};
  HOA_APP.version = HOA_VERSION;
  HOA_APP.foundationReady = Boolean(HOA_APP.foundationReady);

  HOA_APP.initFoundation = function () {
    if (this.foundationReady) return this;
    this.foundationReady = true;
    HOA_STATE.legacy.sync();
    return this;
  };

  HOA_APP.initSupabase = initSupabase;
  HOA_APP.getConfig = function () { return HOA_CONFIG; };
  HOA_APP.getState = function () { return HOA_STATE; };

  global.HOA_APP = HOA_APP;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      HOA_APP.initFoundation();
    }, { once: true });
  } else {
    HOA_APP.initFoundation();
  }


/* ============================================================
   SHARED DATA SERVICES — SAFE CONSOLIDATION STEP
   Formerly separate js/services/*.js files.
   Original order preserved exactly: base → student → test → course
   → result → content → storage → admin.
   No public service names or database/RPC contracts are changed.
   ============================================================ */

/* ===== INTEGRATED: js/services/base.js ===== */
/* HOA V6.1.1 — Shared data/service foundation. */
(function(global){
  'use strict';
  const BASE=global.HOA_DB_BASE||{};
  BASE.client=function(){return global.supabaseClient||global.supabase||null;};
  BASE.requireClient=function(){const c=BASE.client();if(!c||!c.from)throw new Error('Supabase is not ready.');return c;};
  BASE.requireAuth=async function(){const c=BASE.requireClient();const s=await c.auth.getSession();if(s.error)throw s.error;if(!s.data?.session?.user)throw new Error('Authenticated session required.');return s.data.session.user;};
  BASE.userId=async function(){return (await BASE.requireAuth()).id;};
  BASE.rpc=async function(name,args){const c=BASE.requireClient();const r=await c.rpc(name,args);if(r.error)throw r.error;return r.data;};
  BASE.invoke=async function(name,body){const c=BASE.requireClient();const r=await c.functions.invoke(name,{body});if(r.error)throw r.error;if(r.data?.error)throw new Error(r.data.error);return r.data;};
  BASE.storage=function(bucket){const c=BASE.requireClient();return c.storage.from(bucket);};
  global.HOA_DB_BASE=BASE;
  global.HOA_SERVICES=global.HOA_SERVICES||{};
})(window);


/* ===== INTEGRATED: js/services/student-service.js ===== */
/* HOA V6.1.1 — Student data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.student||{};
  S.list=async function(){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.getById=async function(id){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.getByAuthUserId=async function(authUserId){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').eq('auth_user_id',authUserId).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.createPending=async function(row){const c=B.requireClient();const r=await c.from('students').insert(row);if(r.error)throw r.error;return row;};
  S.delete=async function(id){const c=B.requireClient();const r=await c.from('students').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.getBatchAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_batch_access').select('batch_id,starts_at,expires_at').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getNoteAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_note_access').select('note_id,starts_at,expires_at').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getTestAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_test_access').select('test_id').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getGranularTestAccess=async function(studentId){const c=B.requireClient();const r=await c.from('students').select('granular_test_access').eq('id',studentId).maybeSingle();if(r.error)throw r.error;return Boolean(r.data?.granular_test_access);};
  S.loginByMobile=async function(payload){return B.invoke('login-by-mobile',payload);};
  S.loginWithPassword=async function(email,password){const c=B.requireClient();const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data;};
  S.signOut=async function(){const c=B.requireClient();const r=await c.auth.signOut();if(r.error)throw r.error;return true;};
  S.getProfileForCurrentSession=async function(){const c=B.requireClient();const u=await B.requireAuth();return S.getByAuthUserId(u.id);};
  global.HOA_SERVICES.student=S;
})(window);


/* ===== INTEGRATED: js/services/test-service.js ===== */
/* HOA V6.1.1 — Mock-test and attempt data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.test||{};
  S.startAttempt=async function(testId){return B.rpc('start_test_attempt_v1',{p_test_id:testId});};
  S.submitAttempt=async function(payload){return B.rpc('submit_test_v4',payload);};
  S.saveBundle=async function(payload){return B.rpc('save_test_bundle_v1',payload);};
  S.saveBundleV3=async function(payload){return B.rpc('save_test_bundle_v3',payload);};
  S.delete=async function(id){const c=B.requireClient();const r=await c.from('tests').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.update=async function(id,patch){const c=B.requireClient();const r=await c.from('tests').update(patch).eq('id',id);if(r.error)throw r.error;return true;};
  S.loadQuestions=async function(testId,admin){const c=B.requireClient();const table=admin?'questions':'student_questions';const select=admin?'id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order':'id,test_id,question_text,option_1,option_2,option_3,option_4,question_order';const r=await c.from(table).select(select).eq('test_id',testId).order('question_order',{ascending:true});if(r.error)throw r.error;return r.data||[];};
  S.getAttemptReview=async function(attemptId){return B.rpc('get_attempt_review_v4',{p_attempt_id:attemptId});};
  S.getQuestionAnswers=async function(testId,attemptId,admin){const c=B.requireClient();const questions=await c.from(admin?'questions':'student_questions').select(admin?'id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order':'id,question_text,option_1,option_2,option_3,option_4,question_order').eq('test_id',testId).order('question_order',{ascending:true});if(questions.error)throw questions.error;const answers=await c.from('answers').select('question_id,selected_option,is_correct,marks_awarded').eq('attempt_id',attemptId);if(answers.error)throw answers.error;return {questions:questions.data||[],answers:answers.data||[]};};
  global.HOA_SERVICES.test=S;
})(window);


/* ===== HOA UNIFIED FREE TEST ADAPTER ===== */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.free||{};
  S.prepareTest=async function(token,testId){return B.rpc('hoa_free_test_prepare',{p_token:token,p_test_id:testId});};
  S.startAttempt=async function(token,testId){return B.rpc('hoa_free_test_start',{p_token:token,p_test_id:testId});};
  S.submitAttempt=async function(token,attemptId,answers,elapsed){return B.rpc('hoa_free_test_submit',{p_token:token,p_attempt_id:attemptId,p_answers:answers,p_elapsed_seconds:elapsed});};
  S.getReview=async function(token,attemptId){return B.rpc('hoa_free_test_review',{p_token:token,p_attempt_id:attemptId});};
  global.HOA_SERVICES.free=S;
})(window);


/* ===== INTEGRATED: js/services/course-service.js ===== */
/* HOA V6.1.1 — Course/video/note data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.course||{};
  S.listBatches=async function(select='*'){const c=B.requireClient();const r=await c.from('batches').select(select).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.getBatch=async function(id){const c=B.requireClient();const r=await c.from('batches').select('id,name,batch_code,description,status,is_published,sort_order,created_at').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.createBatch=async function(row){const c=B.requireClient();const r=await c.from('batches').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateBatch=async function(id,row){const c=B.requireClient();const r=await c.from('batches').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteBatch=async function(id){const c=B.requireClient();const r=await c.from('batches').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.listFolders=async function(batchId,type){const c=B.requireClient();let q=c.from('content_folders').select('id,name,folder_type,parent_id,sort_order,is_active').eq('batch_id',batchId).eq('is_active',true);if(type)q=q.eq('folder_type',type);const r=await q.order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;return r.data||[];};
  S.createFolder=async function(row){const c=B.requireClient();const r=await c.from('content_folders').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.archiveFolder=async function(id){const c=B.requireClient();const r=await c.from('content_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;return true;};
  S.listLectures=async function(batchId,folderId,published){const c=B.requireClient();let q=c.from('batch_lectures').select('id,lecture_no,title,description,youtube_video_id,scheduled_at,duration_seconds,sort_order,batch_id,folder_id,is_published').eq('batch_id',batchId);if(folderId)q=q.eq('folder_id',folderId);if(published)q=q.eq('is_published',true);const r=await q.order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});if(r.error)throw r.error;return r.data||[];};
  S.createLecture=async function(row){const c=B.requireClient();const r=await c.from('batch_lectures').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateLecture=async function(id,row){const c=B.requireClient();const r=await c.from('batch_lectures').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteLecture=async function(id){const c=B.requireClient();const r=await c.from('batch_lectures').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.listNotes=async function(batchId,folderId,published){const c=B.requireClient();let q=c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,mime_type,sort_order,created_at,batch_id,folder_id,is_published').eq('batch_id',batchId);if(folderId)q=q.eq('folder_id',folderId);if(published)q=q.eq('is_published',true);const r=await q.order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.createNote=async function(row){const c=B.requireClient();const r=await c.from('exam_notes').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateNote=async function(id,row){const c=B.requireClient();const r=await c.from('exam_notes').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteNote=async function(id){const c=B.requireClient();const r=await c.from('exam_notes').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.assignLecture=async function(row){const c=B.requireClient();const r=await c.from('batch_lecture_assignments').upsert(row,{onConflict:'lecture_id,batch_id'});if(r.error)throw r.error;return true;};
  S.assignNote=async function(row){const c=B.requireClient();const r=await c.from('exam_note_assignments').upsert(row,{onConflict:'note_id,batch_id'});if(r.error)throw r.error;return true;};
  global.HOA_SERVICES.course=S;
})(window);


/* ===== INTEGRATED: js/services/result-service.js ===== */
/* HOA V6.1.1 — Result and attempt-history data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.result||{};
  S.studentHistory=async function(studentId){return B.rpc('get_student_result_history_v4_5');};
  S.adminAttempts=async function(){const c=B.requireClient();const r=await c.from('attempts').select('*').order('submitted_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.adminStudents=async function(){return global.HOA_SERVICES.student.list();};
  S.adminTests=async function(){const c=B.requireClient();const r=await c.from('tests').select('id,title,description,access_type').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.deleteAttempt=async function(id){return B.invoke('admin-delete-attempt-v2',{attempt_id:id});};
  S.getReview=async function(attemptId){return B.rpc('get_attempt_review_v4',{p_attempt_id:attemptId});};
  S.getAttemptSummary=async function(attemptId){
    const rows=await B.rpc('get_student_attempt_summary',{p_attempt_id:attemptId});
    return Array.isArray(rows)&&rows.length ? rows[0] : null;
  };
  global.HOA_SERVICES.result=S;
})(window);


/* ===== INTEGRATED: js/services/content-service.js ===== */
/* HOA V6.1.1 — Public/free-content service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.content||{};
  S.activePosters=async function(){return B.rpc('hoa_public_active_posters');};
  S.freeList=async function(token){return B.rpc('hoa_free_content_list',{p_token:token});};
  S.freeActivity=async function(token,contentId,type){return B.rpc('hoa_free_content_activity',{p_token:token,p_content_id:contentId,p_activity_type:type});};
  S.freeProfileEnter=async function(payload){return B.rpc('hoa_free_profile_enter',payload);};
  S.freeAdminList=async function(){return B.rpc('hoa_admin_free_content_list');};
  S.freeAdminDelete=async function(id){return B.rpc('hoa_admin_free_content_delete',{p_id:id});};
  S.freeAdminSave=async function(payload){return B.rpc('hoa_admin_free_content_upsert',payload);};
  global.HOA_SERVICES.content=S;
})(window);


/* ===== INTEGRATED: js/services/storage-service.js ===== */
/* HOA V6.1.1 — Storage service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.storage||{};
  S.publicUrl=function(bucket,path){const s=B.storage(bucket);const r=s.getPublicUrl(path);return r?.data?.publicUrl||'';};
  S.signedUrl=async function(bucket,path,seconds=600){const r=await B.storage(bucket).createSignedUrl(path,seconds);if(r.error)throw r.error;return r.data?.signedUrl||'';};
  S.upload=async function(bucket,path,file,options){const r=await B.storage(bucket).upload(path,file,options);if(r.error)throw r.error;return r.data;};
  S.remove=async function(bucket,paths){const r=await B.storage(bucket).remove(paths);if(r.error)throw r.error;return r.data;};
  global.HOA_SERVICES.storage=S;
})(window);


/* ===== INTEGRATED: js/services/admin-service.js ===== */
/* HOA V6.1.1 — Admin/auth management service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.admin||{};
  S.isAdmin=async function(){return B.rpc('is_app_admin');};
  S.signIn=async function(email,password){const c=B.requireClient();const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data;};
  S.verifyAndSignIn=async function(email,password){const data=await S.signIn(email,password);const ok=await S.isAdmin();if(ok!==true){try{await B.requireClient().auth.signOut()}catch(_){}throw new Error('This account is not registered as an Admin.');}return data;};
  S.signOut=async function(){const c=B.requireClient();const r=await c.auth.signOut();if(r.error)throw r.error;return true;};
  S.updatePassword=async function(currentPassword,newPassword){const c=B.requireClient();const user=await B.requireAuth();const sign=await c.auth.signInWithPassword({email:user.email,password:currentPassword});if(sign.error)throw sign.error;const r=await c.auth.updateUser({password:newPassword});if(r.error)throw r.error;return true;};
  S.manageCandidate=async function(body){return B.invoke('admin-manage-candidate',body);};
  S.getSession=async function(){const c=B.requireClient();const r=await c.auth.getSession();if(r.error)throw r.error;return r.data?.session||null;};
  global.HOA_SERVICES.admin=S;
})(window);


})(window);

/* =========================================================
   HOA SAFE CONSOLIDATION PHASE 6B — PUBLIC POSTER SHOWCASE
   Consolidated from js/public/hoa-3d-showcase.js.
   Behavior preserved; initialization remains DOMContentLoaded-based.
   ========================================================= */
/* HOA V6.2 — Public Dynamic 3D Poster Showcase
   Single public renderer for poster_slides.
   Uses the existing SECURITY DEFINER RPC: hoa_public_active_posters.
   No dependency on the legacy content-access poster renderer. */

(function(){
  "use strict";

  const CONFIG = window.HOA_CONFIG || {};
  const SUPABASE_URL =
    CONFIG.supabaseUrl ||
    window.SUPABASE_URL ||
    "https://pnzhtiwwqiqnnkecogcc.supabase.co";

  const SUPABASE_KEY =
    CONFIG.supabasePublishableKey ||
    window.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_Qwq-5g_j446D3fEyJn5MOg_p9y6JNBC";

  const BUCKET = "posters";
  const AUTO_MS = 4300;
  const REFRESH_MS = 30000;

  let supabaseClient = null;
  let rows = [];
  let current = 0;
  let autoTimer = null;
  let refreshTimer = null;
  let paused = false;
  let started = false;

  const $ = id => document.getElementById(id);

  function getClient(){
    if(supabaseClient) return supabaseClient;

    if(
      window.supabase &&
      typeof window.supabase.createClient === "function"
    ){
      try{
        supabaseClient =
          window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
              auth:{
                persistSession:false,
                autoRefreshToken:false,
                detectSessionInUrl:false
              }
            }
          );

        return supabaseClient;
      }catch(error){
        console.error(
          "[HOA 3D] Supabase client creation failed:",
          error
        );
      }
    }

    if(
      window.supabaseClient &&
      typeof window.supabaseClient.from === "function"
    ){
      return window.supabaseClient;
    }

    return null;
  }

  function posterUrl(storagePath){
    if(!storagePath) return "";

    const path =
      String(storagePath)
        .replace(/^\/+/, "")
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");

    return (
      SUPABASE_URL.replace(/\/+$/,"") +
      "/storage/v1/object/public/" +
      BUCKET +
      "/" +
      path
    );
  }

  function clearAuto(){
    if(autoTimer){
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  function startAuto(){
    clearAuto();

    if(
      rows.length > 1 &&
      !paused
    ){
      autoTimer =
        setInterval(
          next,
          AUTO_MS
        );
    }
  }

  function indexWrap(value){
    if(!rows.length) return 0;
    return (
      (value % rows.length) +
      rows.length
    ) % rows.length;
  }

  function offsetFor(index){
    if(!rows.length) return 0;

    let offset =
      index - current;

    const total = rows.length;

    if(offset > total / 2){
      offset -= total;
    }

    if(offset < -total / 2){
      offset += total;
    }

    return offset;
  }

  function stateClass(offset){
    const total = rows.length;

    if(offset === 0){
      return "is-center";
    }

    if(
      offset === 1 ||
      offset === -(total - 1)
    ){
      return "is-right";
    }

    if(
      offset === -1 ||
      offset === total - 1
    ){
      return "is-left";
    }

    if(
      offset === 2 ||
      offset === -(total - 2)
    ){
      return "is-back-right";
    }

    if(
      offset === -2 ||
      offset === total - 2
    ){
      return "is-back-left";
    }

    return "is-hidden";
  }

  function setMessage(message){
    const track = $("hoaV3DTrack");
    const indicators = $("hoaV3DIndicators");

    if(track){
      track.innerHTML =
        '<div class="hoa-v3d-empty">' +
        message +
        "</div>";
    }

    if(indicators){
      indicators.innerHTML = "";
    }
  }

  function render(){
    const track = $("hoaV3DTrack");
    const indicators = $("hoaV3DIndicators");

    if(!track || !indicators){
      return;
    }

    if(!rows.length){
      setMessage(
        "No active posters are available right now."
      );
      return;
    }

    current = indexWrap(current);

    const cardFragment =
      document.createDocumentFragment();

    rows.forEach((row,index)=>{
      const offset =
        offsetFor(index);

      const card =
        document.createElement("figure");

      card.className =
        "hoa-v3d-card " +
        stateClass(offset);

      card.dataset.index =
        String(index);

      card.tabIndex =
        offset === 0 ? 0 : -1;

      const img =
        document.createElement("img");

      img.src =
        posterUrl(row.storage_path);

      img.alt =
        row.title ||
        "HUB OF ASPIRANTS poster";

      img.loading =
        Math.abs(offset) <= 1
          ? "eager"
          : "lazy";

      img.decoding = "async";
      img.draggable = false;

      img.addEventListener(
        "load",
        ()=>{
          card.classList.remove(
            "image-error"
          );
        },
        {once:true}
      );

      img.addEventListener(
        "error",
        ()=>{
          card.classList.add(
            "image-error"
          );

          console.error(
            "[HOA 3D] Poster image failed:",
            img.src
          );
        },
        {once:true}
      );

      card.appendChild(img);

      card.addEventListener(
        "click",
        ()=>{
          const target =
            Number(card.dataset.index);

          if(
            Number.isInteger(target) &&
            target !== current
          ){
            current = target;
            render();
            startAuto();
          }
        }
      );

      cardFragment.appendChild(card);
    });

    track.replaceChildren(
      cardFragment
    );

    const dotFragment =
      document.createDocumentFragment();

    rows.forEach((row,index)=>{
      const dot =
        document.createElement("button");

      dot.type = "button";
      dot.className =
        "hoa-v3d-dot" +
        (index === current
          ? " is-active"
          : "");

      dot.dataset.index =
        String(index);

      dot.setAttribute(
        "aria-label",
        "Show poster " +
        (index + 1)
      );

      dot.addEventListener(
        "click",
        ()=>{
          current = index;
          render();
          startAuto();
        }
      );

      dotFragment.appendChild(dot);
    });

    indicators.replaceChildren(
      dotFragment
    );
  }

  async function fetchPosters(){
    const client = getClient();

    if(!client){
      throw new Error(
        "Supabase client is unavailable."
      );
    }

    /*
      IMPORTANT:
      Use the existing public RPC rather than relying on direct table SELECT.
      That RPC is already intended for the public poster feed.
    */
    const result =
      await client.rpc(
        "hoa_public_active_posters"
      );

    if(result.error){
      throw result.error;
    }

    return Array.isArray(result.data)
      ? result.data.filter(
          row =>
            row &&
            row.is_active === true &&
            row.storage_path
        )
      : [];
  }

  async function load(initial = false){
    const track = $("hoaV3DTrack");

    try{
      if(initial){
        setMessage(
          "Loading live posters…"
        );
      }

      const nextRows =
        await fetchPosters();

      const previousId =
        rows[current]?.id || null;

      rows = nextRows;

      if(previousId){
        const same =
          rows.findIndex(
            row =>
              row.id === previousId
          );

        current =
          same >= 0
            ? same
            : indexWrap(current);
      }else{
        current = 0;
      }

      render();
      startAuto();

    }catch(error){
      console.error(
        "[HOA 3D] Live poster load failed:",
        error
      );

      if(track){
        setMessage(
          "Live posters could not be loaded."
        );
      }
    }
  }

  function next(){
    if(rows.length < 2){
      return;
    }

    current =
      indexWrap(current + 1);

    render();
  }

  function previous(){
    if(rows.length < 2){
      return;
    }

    current =
      indexWrap(current - 1);

    render();
  }

  function setPaused(value){
    paused = value;

    const button =
      $("hoaV3DPause");

    if(button){
      button.classList.toggle(
        "is-paused",
        paused
      );

      button.textContent =
        paused ? "▶" : "Ⅱ";

      button.setAttribute(
        "aria-label",
        paused
          ? "Resume animation"
          : "Pause animation"
      );
    }

    if(paused){
      clearAuto();
    }else{
      startAuto();
    }
  }

  function scheduleRefresh(){
    if(refreshTimer){
      clearInterval(
        refreshTimer
      );
    }

    refreshTimer =
      setInterval(
        ()=>load(false),
        REFRESH_MS
      );
  }

  function bind(){
    if(started){
      return;
    }

    if(!$("hoaDynamicShowcase")){
      return;
    }

    started = true;

    $("hoaV3DPrev")?.addEventListener(
      "click",
      ()=>{
        previous();
        startAuto();
      }
    );

    $("hoaV3DNext")?.addEventListener(
      "click",
      ()=>{
        next();
        startAuto();
      }
    );

    $("hoaV3DPause")?.addEventListener(
      "click",
      ()=>{
        setPaused(!paused);
      }
    );

    const stage =
      $("hoaV3DStage");

    if(stage){
      let startX = 0;
      let touching = false;

      stage.addEventListener(
        "mouseenter",
        clearAuto
      );

      stage.addEventListener(
        "mouseleave",
        startAuto
      );

      stage.addEventListener(
        "focusin",
        clearAuto
      );

      stage.addEventListener(
        "focusout",
        startAuto
      );

      stage.addEventListener(
        "touchstart",
        event=>{
          const touch =
            event.touches?.[0];

          if(!touch){
            return;
          }

          startX =
            touch.clientX;

          touching = true;
          clearAuto();
        },
        {passive:true}
      );

      stage.addEventListener(
        "touchend",
        event=>{
          const touch =
            event.changedTouches?.[0];

          if(
            !touching ||
            !touch
          ){
            return;
          }

          const delta =
            touch.clientX - startX;

          touching = false;

          if(Math.abs(delta) > 45){
            if(delta < 0){
              next();
            }else{
              previous();
            }
          }

          render();
          startAuto();
        },
        {passive:true}
      );

      stage.addEventListener(
        "keydown",
        event=>{
          if(
            event.key ===
            "ArrowRight"
          ){
            event.preventDefault();
            next();
            startAuto();
          }

          if(
            event.key ===
            "ArrowLeft"
          ){
            event.preventDefault();
            previous();
            startAuto();
          }

          if(event.key === " "){
            event.preventDefault();
            setPaused(!paused);
          }
        }
      );
    }

    load(true);
    scheduleRefresh();
  }

  function boot(){
    bind();
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

/* HOA SAFE LEGACY INITIALIZER — logic is executed at the original page position. */
window.__HOA_CONSOLIDATION_LEGACY_INIT=function(){

'use strict';
const V='V6.0.6';
const $=id=>document.getElementById(id);
const db=()=>window.supabaseClient||window.supabase||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const adminOK=()=>typeof window.isAdminMode==='function'?window.isAdminMode():Boolean(adminLoggedIn===true&&currentStudent==null);
const status=(id,msg,error=false)=>{const e=$(id);if(!e)return;e.textContent=msg||'';e.classList.toggle('error',!!error)};
async function uid(){const c=db();const s=await c.auth.getSession();if(s.error||!s.data?.session?.user)throw new Error('Admin session required.');return s.data.session.user.id}
function addStyle(){if($('hoa-v606-consolidation-css'))return}
function modal(title,body){const old=$('hoa606Modal');if(old)old.remove();const d=document.createElement('div');d.id='hoa606Modal';d.className='hoa606-modal';d.innerHTML='<div class="hoa606-modal-card"><h3>'+esc(title)+'</h3>'+body+'</div>';d.addEventListener('click',e=>{if(e.target===d)d.remove()});document.body.appendChild(d);return d}

/* ---------- Course architecture ---------- */
let courseState={batchId:'',folderId:'',folderType:'video',folders:[]};
function ensureCourseWorkspace(){
 const host=$('adminSectionCoursePanel');if(!host||$('hoa606CourseWorkspace'))return;
 const w=document.createElement('section');w.id='hoa606CourseWorkspace';w.className='hoa606-shell';w.innerHTML=`
 <div class="hoa606-head"><div><h3>Course Content Architecture</h3><p>Course → Subject Folder → Videos / Notes. The same video or note can be assigned to multiple courses.</p></div><span class="hoa606-chip">V6.0.6</span></div>
 <div class="hoa606-body">
  <div class="hoa606-grid three">
   <label class="hoa606-field">Course / Batch<select id="hoa606CourseSelect"></select></label>
   <label class="hoa606-field">Folder Type<select id="hoa606FolderType"><option value="video">Videos — Subject</option><option value="note">Notes — Subject</option></select></label>
   <label class="hoa606-field">Subject / Folder Name<input id="hoa606FolderName" placeholder="e.g. Highway Engineering"></label>
  </div>
  <div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606CreateFolder">＋ CREATE SUBJECT FOLDER</button><button class="hoa606-btn" id="hoa606RefreshCourse">↻ REFRESH</button><span class="hoa606-status" id="hoa606CourseMsg"></span></div>
  <div class="hoa606-divider"></div>
  <div class="hoa606-grid">
   <div><b style="color:#173f6b">Course folders</b><div id="hoa606FolderList" class="hoa606-list"></div></div>
   <div><b style="color:#173f6b">Selected folder content</b><div id="hoa606FolderContent" class="hoa606-list"></div></div>
  </div>
  <div class="hoa606-divider"></div>
  <div><b style="color:#173f6b">Add new video</b><div class="hoa606-grid" style="margin-top:9px">
   <label class="hoa606-field">Subject Folder<select id="hoa606VideoFolder"></select></label><label class="hoa606-field">Lecture No.<input id="hoa606VideoNo" type="number" min="1" value="1"></label>
   <label class="hoa606-field">Title<input id="hoa606VideoTitle" placeholder="Highway Development — Lecture 01"></label><label class="hoa606-field">YouTube Video ID<input id="hoa606VideoId" maxlength="20" placeholder="11-character ID"></label>
   <label class="hoa606-field wide">Description<textarea id="hoa606VideoDesc" rows="2"></textarea></label>
  </div><div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606AddVideo">＋ ADD VIDEO</button><span class="hoa606-status" id="hoa606VideoMsg"></span></div></div>
  <div class="hoa606-divider"></div>
  <div><b style="color:#173f6b">Upload new PDF note</b><div class="hoa606-grid" style="margin-top:9px">
   <label class="hoa606-field">Subject Folder<select id="hoa606NoteFolder"></select></label><label class="hoa606-field">Title<input id="hoa606NoteTitle" placeholder="Highway Engineering Notes"></label>
   <label class="hoa606-field">Exam<input id="hoa606NoteExam" placeholder="TES PWD Civil Engineering 2026"></label><label class="hoa606-field">PDF File<input id="hoa606NoteFile" type="file" accept="application/pdf,.pdf"></label>
   <label class="hoa606-field wide">Description<textarea id="hoa606NoteDesc" rows="2"></textarea></label>
  </div><div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606AddNote">＋ UPLOAD NOTE</button><span class="hoa606-status" id="hoa606NoteMsg"></span></div></div>
  <div class="hoa606-divider"></div>
  <div><b style="color:#173f6b">Reuse existing content in another course</b><p style="font-size:12px;color:#718096;margin:4px 0 9px">This creates an assignment; the original video/note is not duplicated or deleted.</p>
   <div class="hoa606-grid"><label class="hoa606-field">Content Type<select id="hoa606ReuseType"><option value="video">Video</option><option value="note">Note</option></select></label><label class="hoa606-field">Existing Content<select id="hoa606ReuseItem"></select></label><label class="hoa606-field">Target Course<select id="hoa606ReuseCourse"></select></label><label class="hoa606-field">Target Subject Folder<select id="hoa606ReuseFolder"></select></label></div>
   <div class="hoa606-actions"><button class="hoa606-btn gold" id="hoa606Reuse">↗ ASSIGN TO COURSE</button><span class="hoa606-status" id="hoa606ReuseMsg"></span></div>
  </div>
 </div>`;
 host.appendChild(w);
 $('hoa606CourseSelect').addEventListener('change',()=>hoa606CourseChanged());
 $('hoa606FolderType').addEventListener('change',()=>{courseState.folderType=$('hoa606FolderType').value;hoa606LoadFolders()});
 $('hoa606CreateFolder').onclick=hoa606CreateFolder;
 $('hoa606RefreshCourse').onclick=hoa606LoadCourses;
 $('hoa606AddVideo').onclick=hoa606AddVideo;
 $('hoa606AddNote').onclick=hoa606AddNote;
 $('hoa606ReuseType').onchange=hoa606LoadReuseItems;
 $('hoa606ReuseCourse').onchange=hoa606LoadReuseFolders;
 $('hoa606Reuse').onclick=hoa606ReuseContent;
 hoa606LoadCourses();
}
async function hoa606LoadCourses(){
 const c=db();if(!c||!adminOK())return;
 try{const r=await c.from('batches').select('id,name,batch_code,description,status,is_published,sort_order').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;const rows=r.data||[];
  const opts='<option value="">Select course / batch</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');
  ['hoa606CourseSelect','hoa606ReuseCourse','hoaVideoBatch'].forEach(id=>{const e=$(id);if(e)e.innerHTML=opts});
  const old=$('hoaCourseList');if(old){old.innerHTML=rows.length?`<table class="hoa606-table"><thead><tr><th>Course</th><th>Code</th><th>Status</th><th>Published</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b><br><small>${esc(x.description||'')}</small></td><td>${esc(x.batch_code||'—')}</td><td>${esc(x.status||'draft')}</td><td>${x.is_published?'Yes':'No'}</td><td class="actions"><button class="hoa606-btn small" data-v606-edit-course="${x.id}">EDIT</button> <button class="hoa606-btn small" data-v606-course-pub="${x.id}" data-pub="${!x.is_published}">${x.is_published?'UNPUBLISH':'PUBLISH'}</button></td></tr>`).join('')}</tbody></table>`:'<div class="hoa606-empty">No courses created yet.</div>';
   old.querySelectorAll('[data-v606-edit-course]').forEach(b=>b.onclick=()=>hoa606EditCourse(rows.find(x=>x.id===b.dataset.v606EditCourse)));
   old.querySelectorAll('[data-v606-course-pub]').forEach(b=>b.onclick=()=>hoa606PublishCourse(b.dataset.v606CoursePub,b.dataset.pub==='true'));
  }
  if(!courseState.batchId&&rows[0])courseState.batchId=rows[0].id;
  if(courseState.batchId&&rows.some(x=>x.id===courseState.batchId))$('hoa606CourseSelect').value=courseState.batchId;else if(rows[0]){$('hoa606CourseSelect').value=rows[0].id;courseState.batchId=rows[0].id}
  await hoa606CourseChanged();
 }catch(e){status('hoa606CourseMsg',e.message||'Could not load courses.',true)}
}
async function hoa606PublishCourse(id,publish){const c=db();if(!c||!adminOK())return;try{const r=await c.from('batches').update({is_published:publish,status:publish?'published':'draft',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await hoa606LoadCourses()}catch(e){alert(e.message||'Could not update course.')}}
function hoa606EditCourse(row){if(!row)return;const d=modal('Edit Course / Batch',`<div class="hoa606-grid"><label class="hoa606-field">Name<input id="hoa606EditName" value="${esc(row.name)}"></label><label class="hoa606-field">Code<input id="hoa606EditCode" value="${esc(row.batch_code||'')}"></label><label class="hoa606-field wide">Description<textarea id="hoa606EditDesc" rows="4">${esc(row.description||'')}</textarea></label><label class="hoa606-field">Status<select id="hoa606EditStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label class="hoa606-field">Sort Order<input id="hoa606EditSort" type="number" value="${Number(row.sort_order)||0}"></label></div><div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606SaveCourse">SAVE CHANGES</button><button class="hoa606-btn" onclick="document.getElementById('hoa606Modal')?.remove()">CANCEL</button><span class="hoa606-status" id="hoa606EditMsg"></span></div>`);$('hoa606EditStatus').value=row.status||'draft';$('hoa606SaveCourse').onclick=async()=>{try{const r=await db().from('batches').update({name:$('hoa606EditName').value.trim(),batch_code:$('hoa606EditCode').value.trim()||null,description:$('hoa606EditDesc').value.trim()||null,status:$('hoa606EditStatus').value,is_published:$('hoa606EditStatus').value==='published',sort_order:Number($('hoa606EditSort').value)||0,updated_at:new Date().toISOString()}).eq('id',row.id);if(r.error)throw r.error;d.remove();await hoa606LoadCourses()}catch(e){status('hoa606EditMsg',e.message||'Update failed.',true)}}}
async function hoa606CourseChanged(){courseState.batchId=$('hoa606CourseSelect')?.value||'';courseState.folderId='';await hoa606LoadFolders();await hoa606LoadReuseItems();}
async function hoa606LoadFolders(){const c=db(),id=courseState.batchId;if(!c||!id)return;try{const r=await c.from('content_folders').select('id,name,folder_type,parent_id,sort_order,is_active').eq('batch_id',id).eq('is_active',true).order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;courseState.folders=r.data||[];if(!courseState.folderId||!courseState.folders.some(x=>x.id===courseState.folderId)){const first=courseState.folders.find(x=>x.folder_type===courseState.folderType);courseState.folderId=first?.id||''}const list=$('hoa606FolderList');list.innerHTML=courseState.folders.length?courseState.folders.map(x=>`<div class="hoa606-row"><div class="hoa606-row-main"><b>${esc(x.name)} <span class="hoa606-chip">${x.folder_type==='video'?'VIDEO':'NOTE'}</span></b><small>Subject folder</small></div><div><button class="hoa606-btn small" data-folder-open="${x.id}">OPEN</button> <button class="hoa606-btn small danger" data-folder-archive="${x.id}">ARCHIVE</button></div></div>`).join(''):'<div class="hoa606-empty">Create subject folders first.</div>';list.querySelectorAll('[data-folder-open]').forEach(b=>b.onclick=()=>{courseState.folderId=b.dataset.folderOpen;hoa606RenderFolderSelectors();hoa606LoadFolderContent()});list.querySelectorAll('[data-folder-archive]').forEach(b=>b.onclick=()=>hoa606ArchiveFolder(b.dataset.folderArchive));hoa606RenderFolderSelectors();await hoa606LoadFolderContent()}catch(e){status('hoa606CourseMsg',e.message||'Could not load folders.',true)}}
function hoa606RenderFolderSelectors(){const type=$('hoa606FolderType')?.value||courseState.folderType;courseState.folderType=type;const fs=courseState.folders.filter(x=>x.folder_type===type);const opts='<option value="">Select subject folder</option>'+fs.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');['hoa606VideoFolder','hoa606NoteFolder'].forEach(id=>{const e=$(id);if(e){e.innerHTML=opts;e.value=fs.some(x=>x.id===courseState.folderId)?courseState.folderId:''}});const re=$('hoa606ReuseFolder');if(re){re.innerHTML=opts;re.value=fs.some(x=>x.id===courseState.folderId)?courseState.folderId:''}}
async function hoa606CreateFolder(){if(!adminOK())return;const name=$('hoa606FolderName')?.value.trim(),type=$('hoa606FolderType')?.value||'video',batch=courseState.batchId;if(!batch||!name){status('hoa606CourseMsg','Select a course and enter a folder name.',true);return}try{const r=await db().from('content_folders').insert({batch_id:batch,folder_type:type,name,sort_order:0,is_active:true,created_by:await uid()}).select().single();if(r.error)throw r.error;$('hoa606FolderName').value='';courseState.folderId=r.data.id;status('hoa606CourseMsg','Subject folder created.');await hoa606LoadFolders()}catch(e){status('hoa606CourseMsg',e.message||'Could not create folder.',true)}}
async function hoa606ArchiveFolder(id){if(!confirm('Archive this subject folder? Existing content will remain stored.'))return;try{const r=await db().from('content_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;courseState.folderId='';await hoa606LoadFolders()}catch(e){alert(e.message||'Could not archive folder.')}}
async function hoa606LoadFolderContent(){
 const box=$('hoa606FolderContent');
 if(!box||!courseState.batchId)return;
 if(!courseState.folderId){box.innerHTML='<div class="hoa606-empty">Select a subject folder.</div>';return}
 box.innerHTML='<div class="hoa606-empty">Loading content…</div>';
 try{
  const c=db();
  const type=(courseState.folders.find(x=>x.id===courseState.folderId)||{}).folder_type;
  if(type==='video'){
   const [direct,assigned]=await Promise.all([
    c.from('batch_lectures').select('id,title,description,youtube_video_id,lecture_no,folder_id,batch_id').eq('batch_id',courseState.batchId).eq('folder_id',courseState.folderId).order('sort_order'),
    c.from('batch_lecture_assignments').select('lecture_id,folder_id,batch_id').eq('batch_id',courseState.batchId).eq('folder_id',courseState.folderId)
   ]);
   if(direct.error)throw direct.error;if(assigned.error)throw assigned.error;
   const ids=(assigned.data||[]).map(x=>x.lecture_id);let reused=[];
   if(ids.length){const q=await c.from('batch_lectures').select('id,title,description,youtube_video_id,lecture_no,batch_id').in('id',ids);if(q.error)throw q.error;reused=q.data||[]}
   const map=new Map();(direct.data||[]).forEach(x=>map.set(x.id,x));reused.forEach(x=>map.set(x.id,x));const rows=[...map.values()];
   box.innerHTML=rows.length?rows.map(x=>`<div class="hoa606-row"><div class="hoa606-row-main"><b>${esc(x.title)} <span class="hoa606-chip">VIDEO</span></b><small>Class ${esc(x.lecture_no||'')} · ${esc(x.youtube_video_id||'')}</small></div><button class="hoa606-btn small" data-content-move="video|${x.id}">MOVE / REUSE</button></div>`).join(''):'<div class="hoa606-empty">No videos are assigned to this folder yet.</div>';
  }else{
   const [direct,assigned]=await Promise.all([
    c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,batch_id,folder_id').eq('batch_id',courseState.batchId).eq('folder_id',courseState.folderId).order('sort_order'),
    c.from('exam_note_assignments').select('note_id,folder_id,batch_id').eq('batch_id',courseState.batchId).eq('folder_id',courseState.folderId)
   ]);
   if(direct.error)throw direct.error;if(assigned.error)throw assigned.error;
   const ids=(assigned.data||[]).map(x=>x.note_id);let reused=[];
   if(ids.length){const q=await c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,batch_id').in('id',ids);if(q.error)throw q.error;reused=q.data||[]}
   const map=new Map();(direct.data||[]).forEach(x=>map.set(x.id,x));reused.forEach(x=>map.set(x.id,x));const rows=[...map.values()];
   box.innerHTML=rows.length?rows.map(x=>`<div class="hoa606-row"><div class="hoa606-row-main"><b>${esc(x.title)} <span class="hoa606-chip">NOTE</span></b><small>${esc(x.subject||'General')}${x.exam?' · '+esc(x.exam):''}</small></div><button class="hoa606-btn small" data-content-move="note|${x.id}">MOVE / REUSE</button></div>`).join(''):'<div class="hoa606-empty">No notes are assigned to this folder yet.</div>';
  }
  box.querySelectorAll('[data-content-move]').forEach(b=>b.onclick=()=>hoa606OpenMove(b.dataset.contentMove));
 }catch(e){box.innerHTML='<div class="hoa606-empty">Unable to load folder content.</div>';console.error(e)}
}

function hoa606OpenMove(spec){const [type,id]=spec.split('|');const d=modal(type==='video'?'Move / Reuse Video':'Move / Reuse Note',`<p style="font-size:12px;color:#64748b">Choose a target course and subject folder. If the target is another course, the same content is assigned without duplication.</p><div class="hoa606-grid"><label class="hoa606-field">Target Course<select id="hoa606MoveCourse"></select></label><label class="hoa606-field">Target Folder<select id="hoa606MoveFolder"></select></label></div><div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606MoveSave">SAVE ASSIGNMENT</button><span class="hoa606-status" id="hoa606MoveMsg"></span></div>`);const sel=$('hoa606MoveCourse');sel.innerHTML=$('hoa606CourseSelect').innerHTML;sel.value=courseState.batchId;const load=async()=>{const r=await db().from('content_folders').select('id,name,folder_type').eq('batch_id',sel.value).eq('folder_type',type==='video'?'video':'note').eq('is_active',true).order('name');$('hoa606MoveFolder').innerHTML=(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')||'<option value="">No folders</option>'};sel.onchange=load;load();$('hoa606MoveSave').onclick=async()=>{try{const target=sel.value,folder=$('hoa606MoveFolder').value;if(!target||!folder)throw new Error('Select target course and folder.');if(type==='video'){const r=await db().from('batch_lectures').select('id,batch_id').eq('id',id).single();if(r.error)throw r.error;if(r.data.batch_id===target){const z=await db().from('batch_lectures').update({folder_id:folder,updated_at:new Date().toISOString()}).eq('id',id);if(z.error)throw z.error}else{const z=await db().from('batch_lecture_assignments').upsert({lecture_id:id,batch_id:target,folder_id:folder},{onConflict:'lecture_id,batch_id'});if(z.error)throw z.error}}else{const r=await db().from('exam_notes').select('id,batch_id').eq('id',id).single();if(r.error)throw r.error;if(r.data.batch_id===target){const z=await db().from('exam_notes').update({folder_id:folder,updated_at:new Date().toISOString()}).eq('id',id);if(z.error)throw z.error}else{const z=await db().from('exam_note_assignments').upsert({note_id:id,batch_id:target,folder_id:folder},{onConflict:'note_id,batch_id'});if(z.error)throw z.error}}d.remove();await hoa606LoadFolders()}catch(e){status('hoa606MoveMsg',e.message||'Assignment failed.',true)}}}
async function hoa606AddVideo(){if(!adminOK())return;const batch=courseState.batchId,folder=$('hoa606VideoFolder').value,title=$('hoa606VideoTitle').value.trim(),yt=$('hoa606VideoId').value.trim();if(!batch||!folder||!title||!/^[A-Za-z0-9_-]{11}$/.test(yt)){status('hoa606VideoMsg','Course, subject folder, title and valid 11-character YouTube ID are required.',true);return}try{const r=await db().from('batch_lectures').insert({batch_id:batch,folder_id:folder,lecture_no:Number($('hoa606VideoNo').value)||1,title,description:$('hoa606VideoDesc').value.trim()||null,youtube_video_id:yt,is_published:false,sort_order:Number($('hoa606VideoNo').value)||1,created_by:await uid()}).select().single();if(r.error)throw r.error;['hoa606VideoTitle','hoa606VideoId','hoa606VideoDesc'].forEach(id=>$(id).value='');status('hoa606VideoMsg','Video added as Draft.');await hoa606LoadFolderContent()}catch(e){status('hoa606VideoMsg',e.message||'Could not add video.',true)}}
async function hoa606AddNote(){if(!adminOK())return;const batch=courseState.batchId,folder=$('hoa606NoteFolder').value,file=$('hoa606NoteFile').files[0],title=$('hoa606NoteTitle').value.trim();if(!batch||!folder||!file||!title){status('hoa606NoteMsg','Course, subject folder, title and PDF are required.',true);return}if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name)){status('hoa606NoteMsg','Only PDF files are allowed.',true);return}try{status('hoa606NoteMsg','Uploading…');const path=`course/${batch}/${folder}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]/g,'_')}`;const up=await db().storage.from('exam-notes').upload(path,file,{contentType:'application/pdf',upsert:false});if(up.error)throw up.error;const r=await db().from('exam_notes').insert({title,subject:courseState.folders.find(x=>x.id===folder)?.name||null,exam:$('hoa606NoteExam').value.trim()||null,description:$('hoa606NoteDesc').value.trim()||null,storage_path:path,file_name:file.name,mime_type:'application/pdf',is_published:false,sort_order:0,batch_id:batch,folder_id:folder}).select().single();if(r.error){await db().storage.from('exam-notes').remove([path]);throw r.error}$('hoa606NoteFile').value='';$('hoa606NoteTitle').value='';$('hoa606NoteExam').value='';$('hoa606NoteDesc').value='';status('hoa606NoteMsg','PDF uploaded as Draft.');await hoa606LoadFolderContent()}catch(e){status('hoa606NoteMsg',e.message||'Note upload failed.',true)}}
async function hoa606LoadReuseItems(){const type=$('hoa606ReuseType')?.value||'video',c=db();if(!c)return;const table=type==='video'?'batch_lectures':'exam_notes';const sel=$('hoa606ReuseItem');try{const r=await c.from(table).select(type==='video'?'id,title,batch_id':'id,title,batch_id').order('created_at',{ascending:false}).limit(500);if(r.error)throw r.error;sel.innerHTML='<option value="">Select content</option>'+(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.title)}${x.batch_id?'':''}</option>`).join('');await hoa606LoadReuseFolders()}catch(e){sel.innerHTML='<option value="">Unable to load</option>'}}
async function hoa606LoadReuseFolders(){const batch=$('hoa606ReuseCourse')?.value,type=$('hoa606ReuseType')?.value||'video',sel=$('hoa606ReuseFolder');if(!batch||!sel)return;const r=await db().from('content_folders').select('id,name').eq('batch_id',batch).eq('folder_type',type).eq('is_active',true).order('name');sel.innerHTML=(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')||'<option value="">No subject folders</option>'}
async function hoa606ReuseContent(){const type=$('hoa606ReuseType').value,id=$('hoa606ReuseItem').value,batch=$('hoa606ReuseCourse').value,folder=$('hoa606ReuseFolder').value;if(!id||!batch||!folder){status('hoa606ReuseMsg','Select content, target course and folder.',true);return}try{const table=type==='video'?'batch_lecture_assignments':'exam_note_assignments';const payload=type==='video'?{lecture_id:id,batch_id:batch,folder_id:folder}:{note_id:id,batch_id:batch,folder_id:folder};const r=await db().from(table).upsert(payload,{onConflict:type==='video'?'lecture_id,batch_id':'note_id,batch_id'});if(r.error)throw r.error;status('hoa606ReuseMsg','Content assigned successfully.');if(batch===courseState.batchId)await hoa606LoadFolderContent()}catch(e){status('hoa606ReuseMsg',e.message||'Could not assign content.',true)}}

/* ---------- Mock Test Batch architecture ---------- */
let mockState={batchId:'',folderId:'',folders:[]};
function ensureMockWorkspace(){const host=$('adminSectionTestPanel');if(!host||$('hoa606MockWorkspace'))return;const w=document.createElement('section');w.id='hoa606MockWorkspace';w.className='hoa606-shell';w.innerHTML=`<div class="hoa606-head"><div><h3>Mock Test Batch Architecture</h3><p>Mock Batch → Subject-wise Mock / Full-Length Mock → Folder → Tests → Student Access.</p></div><span class="hoa606-chip">BATCH-FIRST</span></div><div class="hoa606-body">
<div class="hoa606-grid three"><label class="hoa606-field">Mock Test Batch<select id="hoa606MockBatch"></select></label><label class="hoa606-field">Batch Name<input id="hoa606MockName" placeholder="Civil Engineering Mock Test"></label><label class="hoa606-field">Batch Code<input id="hoa606MockCode" placeholder="CIV-MOCK-26"></label></div>
<div class="hoa606-grid"><label class="hoa606-field wide">Description<textarea id="hoa606MockDesc" rows="2"></textarea></label><label class="hoa606-field">Status<select id="hoa606MockStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div>
<div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606SaveMock">SAVE / CREATE BATCH</button><button class="hoa606-btn" id="hoa606RefreshMock">↻ REFRESH</button><span class="hoa606-status" id="hoa606MockMsg"></span></div>
<div class="hoa606-divider"></div><div class="hoa606-grid three"><label class="hoa606-field">Folder Type<select id="hoa606MockFolderType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label><label class="hoa606-field">Folder Name<input id="hoa606MockFolderName" placeholder="e.g. Highway Engineering"></label><div class="hoa606-actions" style="align-items:end"><button class="hoa606-btn primary" id="hoa606CreateMockFolder">＋ CREATE FOLDER</button></div></div>
<div id="hoa606MockFolderList" class="hoa606-list"></div>
<div class="hoa606-divider"></div><div><b style="color:#173f6b">Assign existing test to this Mock Batch</b><div class="hoa606-grid" style="margin-top:9px"><label class="hoa606-field">Test<select id="hoa606MockTestSelect"></select></label><label class="hoa606-field">Folder<select id="hoa606MockAssignFolder"></select></label></div><div class="hoa606-actions"><button class="hoa606-btn gold" id="hoa606AssignMockTest">ASSIGN TEST</button><span class="hoa606-status" id="hoa606AssignMockMsg"></span></div></div>
<div class="hoa606-divider"></div><div><b style="color:#173f6b">Create/edit test from the Test Creator</b><p style="font-size:12px;color:#718096">Paid tests now require a Mock Test Batch and matching folder. Existing questions keep their IDs when edited.</p><div class="hoa606-actions"><button class="hoa606-btn primary" id="hoa606OpenCreator">OPEN TEST CREATOR</button></div></div>
</div>`;host.insertBefore(w,host.firstChild);$('hoa606MockBatch').onchange=()=>hoa606MockChanged();$('hoa606SaveMock').onclick=hoa606SaveMock;$('hoa606RefreshMock').onclick=hoa606LoadMockBatches;$('hoa606CreateMockFolder').onclick=hoa606CreateMockFolder;$('hoa606AssignMockTest').onclick=hoa606AssignMockTest;$('hoa606OpenCreator').onclick=()=>{ensureTestCreatorFields();$('creatorPanel')?.scrollIntoView({behavior:'smooth',block:'start'})};hoa606LoadMockBatches()}
async function hoa606LoadMockBatches(){const c=db();if(!c||!adminOK())return;try{const r=await c.from('test_batches').select('*').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;const rows=r.data||[];const opts='<option value="">Select mock test batch</option>'+rows.map(x=>`<option value="${x.id}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');$('hoa606MockBatch').innerHTML=opts;if(mockState.batchId&&rows.some(x=>x.id===mockState.batchId))$('hoa606MockBatch').value=mockState.batchId;else if(rows[0]){mockState.batchId=rows[0].id;$('hoa606MockBatch').value=rows[0].id}await hoa606MockChanged();}catch(e){status('hoa606MockMsg',e.message||'Could not load Mock Test Batches.',true)}}
async function hoa606MockChanged(){const id=$('hoa606MockBatch')?.value||'';mockState.batchId=id;if(!id){mockState.folders=[];return}try{const c=db();const [b,f]=await Promise.all([c.from('test_batches').select('*').eq('id',id).single(),c.from('test_batch_folders').select('*').eq('test_batch_id',id).eq('is_active',true).order('folder_type').order('sort_order').order('name')]);if(b.error)throw b.error;if(f.error)throw f.error;const row=b.data;mockState.folders=f.data||[];$('hoa606MockName').value=row.name||'';$('hoa606MockCode').value=row.batch_code||'';$('hoa606MockDesc').value=row.description||'';$('hoa606MockStatus').value=row.status||'draft';$('hoa606MockFolderList').innerHTML=mockState.folders.length?mockState.folders.map(x=>`<div class="hoa606-row"><div class="hoa606-row-main"><b>${esc(x.name)} <span class="hoa606-chip">${x.folder_type==='subject'?'SUBJECT-WISE':'FULL-LENGTH'}</span></b></div><div><button class="hoa606-btn small danger" data-mock-folder-archive="${x.id}">ARCHIVE</button></div></div>`).join(''):'<div class="hoa606-empty">No folders yet. Create Subject-wise or Full-Length folders.</div>';$('hoa606MockFolderList').querySelectorAll('[data-mock-folder-archive]').forEach(b=>b.onclick=()=>hoa606ArchiveMockFolder(b.dataset.mockFolderArchive));const fs=mockState.folders;$('hoa606MockAssignFolder').innerHTML=fs.map(x=>`<option value="${x.id}">${esc(x.name)} · ${x.folder_type==='subject'?'Subject-wise':'Full-Length'}</option>`).join('')||'<option value="">No folders</option>';await hoa606LoadMockTests()}catch(e){status('hoa606MockMsg',e.message||'Could not load batch.',true)}}
async function hoa606SaveMock(){if(!adminOK())return;const id=mockState.batchId||null,name=$('hoa606MockName').value.trim(),code=$('hoa606MockCode').value.trim()||null,description=$('hoa606MockDesc').value.trim()||null,statusV=$('hoa606MockStatus').value;if(!name){status('hoa606MockMsg','Batch name is required.',true);return}try{const payload={name,batch_code:code,description,status:statusV,is_published:statusV==='published',updated_at:new Date().toISOString()};let r;if(id)r=await db().from('test_batches').update(payload).eq('id',id);else r=await db().from('test_batches').insert({...payload,sort_order:0,created_by:await uid()}).select().single();if(r.error)throw r.error;if(!id&&r.data)mockState.batchId=r.data.id;status('hoa606MockMsg',id?'Batch updated.':'Mock Test Batch created.');await hoa606LoadMockBatches()}catch(e){status('hoa606MockMsg',e.message||'Could not save batch.',true)}}
async function hoa606CreateMockFolder(){const id=mockState.batchId,type=$('hoa606MockFolderType').value,name=$('hoa606MockFolderName').value.trim();if(!id||!name){status('hoa606MockMsg','Select a batch and enter a folder name.',true);return}try{const r=await db().from('test_batch_folders').insert({test_batch_id:id,folder_type:type,name,sort_order:0,is_active:true,created_by:await uid()}).select().single();if(r.error)throw r.error;$('hoa606MockFolderName').value='';status('hoa606MockMsg','Mock folder created.');await hoa606MockChanged()}catch(e){status('hoa606MockMsg',e.message||'Could not create folder.',true)}}
async function hoa606ArchiveMockFolder(id){if(!confirm('Archive this Mock Test folder? Existing tests remain stored.'))return;try{const r=await db().from('test_batch_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await hoa606MockChanged()}catch(e){alert(e.message||'Could not archive folder.')}}
async function hoa606LoadMockTests(){const c=db();if(!c||!mockState.batchId)return;try{const r=await c.from('tests').select('id,title,test_batch_id,test_batch_folder_id,test_type,is_published,access_type').order('created_at',{ascending:false}).limit(500);if(r.error)throw r.error;const tests=r.data||[];$('hoa606MockTestSelect').innerHTML='<option value="">Select test</option>'+tests.map(x=>`<option value="${x.id}">${esc(x.title)}${x.test_batch_id?'':' · unassigned'}</option>`).join('')}catch(e){$('hoa606MockTestSelect').innerHTML='<option value="">Unable to load tests</option>'}}
async function hoa606AssignMockTest(){const test=$('hoa606MockTestSelect').value,folder=$('hoa606MockAssignFolder').value,batch=mockState.batchId;if(!test||!folder||!batch){status('hoa606AssignMockMsg','Select test, batch and folder.',true);return}try{const f=mockState.folders.find(x=>x.id===folder);const u=await db().from('test_batch_test_assignments').upsert({test_id:test,test_batch_id:batch,test_batch_folder_id:folder},{onConflict:'test_id,test_batch_id'});if(u.error)throw u.error;const owner=await db().from('tests').select('test_batch_id').eq('id',test).single();if(owner.error)throw owner.error;if(!owner.data.test_batch_id){const z=await db().from('tests').update({test_batch_id:batch,test_batch_folder_id:folder,test_type:f.folder_type==='full_length'?'full_length':'subject',updated_at:new Date().toISOString()}).eq('id',test);if(z.error)throw z.error}status('hoa606AssignMockMsg','Test assigned to the Mock Test Batch.');await hoa606LoadMockTests();await hoa606RefreshTests()}catch(e){status('hoa606AssignMockMsg',e.message||'Could not assign test.',true)}}

/* ---------- Test creator / editor ---------- */
let editingTestId=null;
function ensureTestCreatorFields(){const access=$('accessTypeInput');if(!access||$('hoa606TestBatch'))return;const grid=access.closest('div[style*="grid"]')||access.parentElement?.parentElement;const wrap=document.createElement('div');wrap.className='hoa606-grid';wrap.style.marginTop='10px';wrap.innerHTML=`<label class="hoa606-field">Mock Test Batch<select id="hoa606TestBatch"><option value="">Select Mock Test Batch</option></select></label><label class="hoa606-field">Mock Folder<select id="hoa606TestFolder"><option value="">Select folder</option></select></label><label class="hoa606-field">Test Type<select id="hoa606TestType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label>`;grid?.parentElement?.appendChild(wrap);$('hoa606TestBatch').onchange=hoa606LoadCreatorFolders;$('hoa606TestType').onchange=hoa606LoadCreatorFolders;hoa606LoadCreatorBatches()}
async function hoa606LoadCreatorBatches(){ensureTestCreatorFields();const c=db();if(!c)return;const r=await c.from('test_batches').select('id,name,batch_code,is_published').order('name');if(r.error)return;$('hoa606TestBatch').innerHTML='<option value="">Select Mock Test Batch</option>'+(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');await hoa606LoadCreatorFolders()}
async function hoa606LoadCreatorFolders(){const batch=$('hoa606TestBatch')?.value,type=$('hoa606TestType')?.value||'subject',sel=$('hoa606TestFolder');if(!sel)return;const r=batch?await db().from('test_batch_folders').select('id,name').eq('test_batch_id',batch).eq('folder_type',type).eq('is_active',true).order('name'):{data:[]};sel.innerHTML='<option value="">Select folder</option>'+(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}
async function hoa606RefreshTests(){try{if(typeof window.loadTestsFromSupabase==='function')await window.loadTestsFromSupabase();if(typeof window.renderLibrary==='function')window.renderLibrary()}catch(e){console.warn(V+' test refresh',e)}}
async function hoa606SaveTest(){if(typeof window.requireAdmin==='function'&&!window.requireAdmin('saving a test'))return;ensureTestCreatorFields();if(!questions?.length){alert('No valid questions to save.');return}const title=($('titleInput')?.value||testTitle||'').trim().replace(/\s+/g,' '),duration=Number($('durationInput')?.value||durationMinutes),marks=Number($('marksInput')?.value||marksPerCorrect),negative=Number($('negativeInput')?.value||negativeMarks),access=$('accessTypeInput')?.value==='free'?'free':'paid',batch=$('hoa606TestBatch')?.value||null,folder=$('hoa606TestFolder')?.value||null,type=$('hoa606TestType')?.value||'subject';if(title.length<3){alert('Test title must contain at least 3 characters.');return}if(access==='paid'&&(!batch||!folder)){alert('Paid tests must be assigned to a Mock Test Batch and folder.');return}const existing=editingTestId?(tests||[]).find(t=>String(t.id)===String(editingTestId)):null;const dup=Array.isArray(tests)?tests.some(t=>String(t.id)!==String(editingTestId||'')&&String(t.title||'').trim().toLowerCase()===title.toLowerCase()):false;if(dup){alert('A test with this title already exists.');return}const q=questions.map((x,i)=>({id:x.__id||null,question_text:x[0]||'',option_1:x[1]||'',option_2:x[2]||'',option_3:x[3]||'',option_4:x[4]||'',correct_option:Number(x[5]),explanation:x[6]||'',question_order:i+1}));try{const r=await db().rpc('save_test_bundle_v3',{p_test_id:editingTestId||null,p_title:title,p_description:existing?.description||null,p_duration_minutes:duration,p_marks_per_question:marks,p_negative_marking:negative,p_is_published:editingTestId?Boolean(existing?.is_published):false,p_access_type:access,p_test_batch_id:batch,p_test_batch_folder_id:folder,p_test_type:type,p_questions:q});if(r.error)throw r.error;editingTestId=r.data;status('fileStatus','✓ Test saved using the version-safe V6.0.6 test editor.');await hoa606RefreshTests();}catch(e){alert('Test save failed: '+(e.message||e))}}
function hoa606EditTest(id){const t=(tests||[]).find(x=>String(x.id)===String(id));if(!t)return;editingTestId=t.id;questions.length=0;(t.questions||[]).forEach(q=>{const a=Array.isArray(q)?q.slice():[];if(q.__id)Object.defineProperty(a,'__id',{value:q.__id,enumerable:false,writable:true});questions.push(a)});$('titleInput').value=t.title||'';$('durationInput').value=t.duration||10;$('marksInput').value=t.marks||1;$('negativeInput').value=t.negative||0.25;$('accessTypeInput').value=t.accessType||'paid';ensureTestCreatorFields();$('hoa606TestBatch').value=t.test_batch_id||'';$('hoa606TestType').value=t.test_type||'subject';hoa606LoadCreatorFolders().then(()=>{$('hoa606TestFolder').value=t.test_batch_folder_id||''});if(typeof window.renderCSVPreview==='function')window.renderCSVPreview();$('creatorPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}

/* ---------- Test catalog + student grouping ---------- */
async function hoa606LoadTests(){const c=db();if(!c)return;const admin=adminOK();const tr=await c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,created_at,test_batch_id,test_batch_folder_id,test_type').order('created_at',{ascending:true});if(tr.error)throw tr.error;const rows=tr.data||[];const ids=rows.map(x=>x.id);let qRows=[];if(ids.length){const source=admin?'questions':'student_questions';const select=admin?'id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order':'id,test_id,question_text,option_1,option_2,option_3,option_4,question_order';const qr=await c.from(source).select(select).in('test_id',ids).order('question_order');if(qr.error)throw qr.error;qRows=qr.data||[]}tests=rows.filter(t=>t.is_published||admin).map(t=>{const qs=qRows.filter(q=>q.test_id===t.id).sort((a,b)=>(a.question_order||0)-(b.question_order||0)).map(q=>{const a=[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,admin?q.correct_option:undefined,admin?q.explanation||'':''];Object.defineProperty(a,'__id',{value:q.id,enumerable:false,writable:true});return a});if(!admin){return {...t,questions:qs.map(q=>{const a=[q[0],q[1],q[2],q[3],q[4]];Object.defineProperty(a,'__id',{value:q.__id,enumerable:false});return a}),duration:Number(t.duration_minutes)||10,marks:Number(t.marks_per_question)||1,negative:Number(t.negative_marking)||0,accessType:t.access_type||'paid',created:t.created_at}}return {...t,questions:qs,duration:Number(t.duration_minutes)||10,marks:Number(t.marks_per_question)||1,negative:Number(t.negative_marking)||0,accessType:t.access_type||'paid',created:t.created_at}});try{localStorage.setItem('missionTES_tests_cache',JSON.stringify(tests))}catch(e){}return tests}
async function hoa606RefreshTestCatalog(){try{await hoa606LoadTests();if(adminOK()&&typeof window.renderLibrary==='function')window.renderLibrary();if(typeof window.renderStudentDashboard==='function'&&!adminOK())window.renderStudentDashboard()}catch(e){console.warn(V+' catalog',e)}}

function hoa606RenderLibrary(){if(!adminOK())return;const box=$('testLibrary');if(!box)return;const arr=tests||[];if(!arr.length){box.innerHTML='<div class="hoa606-empty">No tests saved yet.</div>';return}box.innerHTML=arr.map(t=>`<div class="testItem"><div style="min-width:0"><b>${esc(t.title)}</b> <span class="statusBadge ${t.is_published?'publishedBadge':'draftBadge'}">${t.is_published?'PUBLISHED':'DRAFT'}</span> <span class="statusBadge ${t.accessType==='free'?'freeBadge':'paidBadge'}">${t.accessType==='free'?'FREE':'PAID'}</span><div class="testMeta">${t.questions.length} questions · ${t.duration} min · ${t.test_batch_id?'Mock Batch assigned':'No Mock Batch'}</div></div><div class="actions" style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end"><button class="startSmall" onclick="startSavedTest('${t.id}')">START</button><button class="secondary" onclick="hoaV606EditTest('${t.id}')">EDIT</button><button class="secondary" onclick="toggleTestPublish('${t.id}')">${t.is_published?'UNPUBLISH':'PUBLISH'}</button><button class="secondary" onclick="toggleTestAccess('${t.id}')">${t.accessType==='free'?'MAKE PAID':'MAKE FREE'}</button><button class="danger" onclick="deleteTest('${t.id}')">Archive/Delete</button></div></div>`).join('')}
window.hoaV606EditTest=hoa606EditTest;

/* ---------- Student course + mock views ---------- */
async function hoa606StudentCourseTab(id,tab){
 const content=$('hoaStudentCourseTabContent'),detail=$('hoaV650CourseDetail');if(!content||!detail)return;
 detail.querySelectorAll('[data-course-tab]').forEach(b=>b.classList.toggle('active',b.dataset.courseTab===tab));
 const cr=await db().from('batches').select('id,name,batch_code,description').eq('id',id).maybeSingle();const course=cr.data||{};
 if(tab==='overview'){content.innerHTML='<div class="hoa606-student-section"><div class="hoa606-student-section-title">COURSE STRUCTURE</div><div class="hoa606-empty">Open Videos or Study Material to browse subject folders. Your access is checked server-side.</div></div>';return}
 if(tab==='live'){content.innerHTML='<div class="hoa606-empty">Live classes will appear here when scheduled.</div>';return}
 content.innerHTML='<div class="hoa606-empty">Loading course content…</div>';
 try{
  const r=await db().rpc('hoa_student_course_content',{p_batch_id:id});if(r.error)throw r.error;const d=r.data||{},folders=d.folders||[],type=tab==='videos'?'video':'note',fs=folders.filter(f=>f.folder_type===type),items=type==='video'?(d.videos||[]):(d.notes||[]);
  content.innerHTML=fs.length?fs.map(f=>{const rows=items.filter(x=>x.folder_id===f.id);return `<section class="hoa606-student-folder"><b>${esc(f.name)}</b>${rows.length?rows.map(x=>type==='video'?`<div class="hoa606-student-item"><div><b>${esc(x.title)}</b><div class="hoa606-test-meta">Class ${esc(x.lecture_no||'')} · ${esc(x.description||'')}</div></div><button class="secondary" type="button" data-v606-play="${x.id}">▶ PLAY</button></div>`:`<div class="hoa606-student-item"><div><b>${esc(x.title)}</b><div class="hoa606-test-meta">${esc(x.subject||'General')}${x.exam?' · '+esc(x.exam):''}</div></div><button class="secondary" type="button" data-v606-note="${x.id}">OPEN PDF</button></div>`).join(''):'<div style="padding:8px;color:#94a3b8;font-size:12px">No published content in this folder.</div>'}</section>`}).join(''):'<div class="hoa606-empty">No subject folders are available yet.</div>';
  if(type==='video')content.querySelectorAll('[data-v606-play]').forEach(b=>b.onclick=()=>{const x=items.find(v=>v.id===b.dataset.v606Play);if(!x)return;const h=document.createElement('div');h.style.marginTop='10px';const cp=window.hoaCreateCustomPlayer?.({videoId:x.youtube_video_id,title:x.title,subtitle:(course.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:(document.querySelector('img[src*="logo"],img[alt*="HOA" i]')||{}).src||''});if(cp)h.appendChild(cp);b.parentElement.parentElement.appendChild(h);b.disabled=true});
  else content.querySelectorAll('[data-v606-note]').forEach(b=>b.onclick=async()=>{const x=items.find(v=>v.id===b.dataset.v606Note);if(!x)return;try{const z=await db().storage.from('exam-notes').createSignedUrl(x.storage_path,600);if(z.error)throw z.error;window.open(z.data.signedUrl,'_blank','noopener,noreferrer')}catch(e){alert('Could not open this note: '+(e.message||e))}});
 }catch(e){content.innerHTML='<div class="hoa606-empty">Unable to load course content. Please refresh.</div>';console.error(e)}
}
async function hoa606RenderMockStudent(){if(adminOK()||!currentStudent)return;const host=$('studentTests');if(!host)return;let access;try{const r=await db().from('student_test_batch_access').select('test_batch_id,starts_at,expires_at').eq('student_id',currentStudent.id);if(r.error)throw r.error;const now=Date.now();access=(r.data||[]).filter(x=>(!x.starts_at||Date.parse(x.starts_at)<=now)&&(!x.expires_at||Date.parse(x.expires_at)>now));}catch(e){console.warn(V+' mock access',e);return}if(!access.length)return;const ids=access.map(x=>x.test_batch_id);const br=await db().from('test_batches').select('id,name,batch_code,description').in('id',ids).eq('is_published',true);if(br.error)return;const fr=await db().from('test_batch_folders').select('id,test_batch_id,name,folder_type,sort_order').in('test_batch_id',ids).eq('is_active',true).order('sort_order').order('name');if(fr.error)return;const ar=await db().from('test_batch_test_assignments').select('test_id,test_batch_id,test_batch_folder_id').in('test_batch_id',ids);if(ar.error)return;const map=new Map((tests||[]).map(t=>[t.id,t]));const groups=br.data||[];const sections=groups.map(b=>{const folders=(fr.data||[]).filter(f=>f.test_batch_id===b.id);const assigned=(ar.data||[]).filter(a=>a.test_batch_id===b.id);const testFor=(folderId,type)=>{const ids2=new Set(assigned.filter(a=>a.test_batch_folder_id===folderId).map(a=>a.test_id));return (tests||[]).filter(t=>(t.test_batch_id===b.id&&t.test_batch_folder_id===folderId)||ids2.has(t.id));};const allTests=(tests||[]).filter(t=>t.test_batch_id===b.id);return `<details class="hoa606-mock-batch"><summary>${esc(b.name)}${b.batch_code?' · '+esc(b.batch_code):''}</summary><div class="hoa606-mock-body">${folders.map(f=>{const ts=testFor(f.id,f.folder_type);return `<div class="hoa606-mock-folder"><h5>${esc(f.name)} · ${f.folder_type==='subject'?'Subject-wise Mock':'Full-Length Mock'}</h5>${ts.length?ts.map(t=>`<div class="hoa606-test-row"><div><b>${esc(t.title)}</b><div class="hoa606-test-meta">${t.questions.length} questions · ${t.duration} min</div></div><button class="startSmall" onclick="startSavedTest('${t.id}')">START TEST</button></div>`).join(''):'<div style="padding:9px;color:#94a3b8;font-size:12px">No tests assigned here.</div>'}</div>`}).join('')||'<div class="hoa606-empty">No Mock Test folders available.</div>'}</div></details>`});let old=$('hoa606StudentMockCatalog');if(!old){old=document.createElement('div');old.id='hoa606StudentMockCatalog';old.className='hoa606-shell';host.parentElement.insertBefore(old,host)}old.innerHTML='<div class="hoa606-head"><div><h3>Mock Test Batches</h3><p>Open your assigned Mock Test Batch and choose Subject-wise or Full-Length tests.</p></div></div><div class="hoa606-body">'+sections.join('')+'</div>';}

/* ---------- Free Content session hardening ---------- */
async function hoa606FreeSessionHardening(){
 try{
  const c=db();if(!c)return;
  const token=localStorage.getItem('hoa_free_access_token');if(!token)return;
  const r=await c.rpc('hoa_free_content_list',{p_token:token});if(r.error){localStorage.removeItem('hoa_free_access_token')}
 }catch(e){console.warn(V+' free session check',e)}
}

/* ---------- Free content / legacy cleanup ---------- */
function retireLegacyFreeGate(){const tab=$('freeTab');if(tab){tab.textContent='🎁 FREE CONTENT';tab.onclick=()=>window.hoaOpenFreeContent?.();}['freeGateBox','freeRegisterBox'].forEach(id=>$(id)?.classList.add('hidden'));const old=$('freeGateBox');if(old){const p=old.parentElement;p?.querySelectorAll('.formGroup').forEach(x=>x.style.display='none')} }
function clearSensitiveCaches(){['missionTES_results_cache','missionTES_users_cache','missionTES_tests_cache','missionTES_attempt_details_v21','hoa_free_access_token'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}

/* ---------- Integrate ---------- */
function install(){
 if(window.__hoa606Installed) return;
 window.__hoa606Installed=true;
 ensureCourseWorkspace();ensureMockWorkspace();ensureTestCreatorFields();retireLegacyFreeGate();hoa606FreeSessionHardening();
 setTimeout(()=>hoa606RefreshTestCatalog(),250);
 const oldShow=window.showAdminSection;if(oldShow&&!oldShow.__v606){const w=async function(section){const r=await oldShow.apply(this,arguments);if(section==='course'){ensureCourseWorkspace();await hoa606LoadCourses()}if(section==='test'){ensureMockWorkspace();ensureTestCreatorFields();await hoa606LoadMockBatches();await hoa606LoadCreatorBatches();hoa606RenderLibrary()}return r};w.__v606=true;window.showAdminSection=w}
 const oldRenderLib=window.renderLibrary;if(oldRenderLib&&!oldRenderLib.__v606){window.renderLibrary=hoa606RenderLibrary;window.renderLibrary.__v606=true}
 const oldLoad=window.loadTestsFromSupabase;if(oldLoad&&!oldLoad.__v606){window.loadTestsFromSupabase=async function(){return hoa606LoadTests()};window.loadTestsFromSupabase.__v606=true}
 const oldSave=window.saveCurrentAsTest;if(oldSave&&!oldSave.__v606){window.saveCurrentAsTest=hoa606SaveTest;window.saveCurrentAsTest.__v606=true}
 const oldCourseTab=window.hoaStudentCourseTab;if(oldCourseTab&&!oldCourseTab.__v606){window.hoaStudentCourseTab=hoa606StudentCourseTab;window.hoaStudentCourseTab.__v606=true}
 const oldRenderStudent=window.renderStudentDashboard;if(oldRenderStudent&&!oldRenderStudent.__v606){window.renderStudentDashboard=function(){const r=oldRenderStudent.apply(this,arguments);setTimeout(hoa606RenderMockStudent,0);return r};window.renderStudentDashboard.__v606=true}
 const oldOpenCourse=window.hoaStudentOpenCourse;if(oldOpenCourse&&!oldOpenCourse.__v606){window.hoaStudentOpenCourse=oldOpenCourse;window.hoaStudentOpenCourse.__v606=true}
 // Add mock-batch access to the existing Student Access selector.
 const access=$('hoaAccessType');if(access&&!access.querySelector('option[value="mock_batch"]')){const o=document.createElement('option');o.value='mock_batch';o.textContent='Mock Test Batch';access.appendChild(o)}
 const oldAccessType=window.hoaAccessTypeChanged;
 window.hoaAccessTypeChanged=function(){
  if($('hoaAccessType')?.value!=='mock_batch'){return oldAccessType?oldAccessType():undefined}
  const sel=$('hoaAccessResource');if(!sel)return;
  db().from('test_batches').select('id,name,batch_code,is_published').order('created_at',{ascending:false}).then(r=>{if(r.error){sel.innerHTML='<option value="">Unable to load</option>';return}sel.innerHTML='<option value="">Select Mock Test Batch</option>'+(r.data||[]).map(x=>`<option value="${x.id}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}${x.is_published?'':' [DRAFT]'}</option>`).join('')});
 };
 const oldGrant=window.hoaGrantAccess;
 window.hoaGrantAccess=async function(){
  if($('hoaAccessType')?.value!=='mock_batch')return oldGrant?oldGrant():undefined;
  const student=$('hoaAccessStudent')?.value,batch=$('hoaAccessResource')?.value;if(!student||!batch){status('hoaAccessStatusMsg','Student and Mock Test Batch are required.',true);return}
  try{const r=await db().from('student_test_batch_access').upsert({student_id:student,test_batch_id:batch,granted_by:await uid(),starts_at:$('hoaAccessStarts')?.value?new Date($('hoaAccessStarts').value).toISOString():null,expires_at:$('hoaAccessExpires')?.value?new Date($('hoaAccessExpires').value).toISOString():null},{onConflict:'student_id,test_batch_id'});if(r.error)throw r.error;status('hoaAccessStatusMsg','Mock Test Batch access granted.');await hoa606RenderMockAccessList()}catch(e){status('hoaAccessStatusMsg',e.message||'Could not grant Mock Test Batch access.',true)}
 };
 async function hoa606RenderMockAccessList(){const box=$('hoaAccessList');if(!box)return;const r=await db().from('student_test_batch_access').select('id,student_id,test_batch_id,starts_at,expires_at,students(full_name,email),test_batches(name,batch_code)').order('created_at',{ascending:false}).limit(200);if(r.error)return;const rows=r.data||[];if(!rows.length)return;const existing=box.querySelector('table');const html=`<div style="margin-top:14px"><b style="color:#173f6b">Mock Test Batch Access</b><table class="hoa606-table" style="margin-top:8px"><thead><tr><th>Student</th><th>Mock Batch</th><th>Starts</th><th>Expires</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.students?.full_name||'')}</td><td>${esc(x.test_batches?.name||'')}</td><td>${esc(x.starts_at||'')}</td><td>${esc(x.expires_at||'')}</td><td><button class="hoa606-btn small danger" data-v606-revoke-mock="${x.id}">REVOKE</button></td></tr>`).join('')}</tbody></table></div>`;let host=box.querySelector('#hoa606MockAccessList');if(!host){host=document.createElement('div');host.id='hoa606MockAccessList';box.appendChild(host)}host.innerHTML=html;host.querySelectorAll('[data-v606-revoke-mock]').forEach(b=>b.onclick=async()=>{if(!confirm('Revoke this Mock Test Batch access?'))return;const z=await db().from('student_test_batch_access').delete().eq('id',b.dataset.v606RevokeMock);if(z.error)alert(z.error.message);else hoa606RenderMockAccessList()})}

 if(!$('hoa606InstalledBadge')){const b=document.createElement('span');b.id='hoa606InstalledBadge';b.className='hoa606-chip';b.textContent='Production V6.0.7';document.querySelector('#adminOnlyDashboard .dashPanel')?.appendChild(b)}
}
window.hoaV606={install,refresh:hoa606RefreshTestCatalog,editTest:hoa606EditTest,clearSensitiveCaches};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();


};

/* ===== INTEGRATED: js/auth.js ===== */
/*
 * HUB OF ASPIRANTS — Authentication Controller
 * Phase 3 of JavaScript consolidation.
 *
 * Single owner for:
 *   - Student/Admin login and logout
 *   - Student registration and Free Candidate gate
 *   - Supabase session restoration
 *   - role synchronization / authentication guards
 *   - authentication UI/tab state
 *   - Admin account/password UI
 *
 * Compatibility note:
 * Existing feature modules continue to expose the legacy application globals
 * used by the current HTML and older workflows. This file intentionally owns
 * the authentication lifecycle while later phases consolidate Student/Admin
 * feature code around it.
 */
(function (global) {
  'use strict';

  var AUTH = global.HOA_AUTH || {};

  /* ============================================================
     1. AUTHENTICATION CACHE / COMMON HELPERS
     ============================================================ */
  function getClient() {
    return global.supabaseClient || null;
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('missionTES_users_cache') || '[]');
    } catch (_) {
      return [];
    }
  }
  global.getUsers = getUsers;

  function saveUsers(users) {
    /* Never persist credential material in browser storage. */
    var safe = (Array.isArray(users) ? users : []).map(function (user) {
      var copy = Object.assign({}, user);
      delete copy.passwordHash;
      delete copy.password_hash;
      return copy;
    });
    try {
      localStorage.setItem('missionTES_users_cache', JSON.stringify(safe));
    } catch (e) {
      console.warn('Student cache write skipped:', e);
    }
  }
  global.saveUsers = saveUsers;

  function getCurrentStudent() {
    try {
      var id = localStorage.getItem('missionTES_currentUser');
      if (!id) return null;
      return getUsers().find(function (user) {
        return String(user.id) === String(id);
      }) || null;
    } catch (_) {
      return null;
    }
  }
  global.getCurrentStudent = getCurrentStudent;

  function clearSensitiveAuthCaches() {
    [
      'missionTES_currentUser',
      'missionTES_users_cache',
      'missionTES_results_cache',
      'missionTES_tests_cache',
      'missionTES_attempt_details_v21',
      'hoa_free_access_token'
    ].forEach(function (key) {
      try { localStorage.removeItem(key); } catch (_) {}
    });
  }
  AUTH.clearSensitiveCaches = clearSensitiveAuthCaches;
  global.hoaClearAuthCaches = clearSensitiveAuthCaches;

  function setMessage(text, ok, target) {
    var el = document.getElementById(target === 'admin' ? 'adminAuthMessage' : 'studentAuthMessage');
    if (!el) return;
    el.textContent = text == null ? '' : String(text);
    el.style.color = ok ? '#087443' : '#b42318';
  }
  global.setMessage = setMessage;

  function setVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.classList.toggle('hidden', !visible);
    if (visible) {
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
    } else {
      el.style.setProperty('display', 'none', 'important');
    }
  }

  function getStudentAuthHost() {
    return document.getElementById('hoaStudentLoginHost');
  }

  function authElement(id) {
    var host = getStudentAuthHost();
    return (host && host.querySelector('#' + id)) || document.getElementById(id);
  }

  /* ============================================================
     2. AUTH UI / LOGIN TABS
     ============================================================ */
  function updateRegistrationTypeUI() {
    var typeEl = document.getElementById('regAccessType');
    var type = typeEl ? typeEl.value : 'paid';
    var mobileGroup = document.getElementById('regMobileGroup');
    var mobileInput = document.getElementById('regMobile');
    var note = document.getElementById('registrationTypeNote');

    if (type === 'free') {
      if (mobileGroup) mobileGroup.classList.add('hidden');
      if (mobileInput) {
        mobileInput.required = false;
        mobileInput.value = '';
      }
      if (note) {
        note.innerHTML = '<b>Free Candidate:</b> Email is mandatory. Mobile number is not required. The Admin will provide the unique login password after registration.';
      }
    } else {
      if (mobileGroup) mobileGroup.classList.remove('hidden');
      if (mobileInput) mobileInput.required = true;
      if (note) {
        note.innerHTML = '<b>Paid Candidate:</b> Email and mobile number are mandatory. After registration, the Admin will provide the unique login password.';
      }
    }
  }
  global.updateRegistrationTypeUI = updateRegistrationTypeUI;

  function applyStudentAuthState(mode) {
    var host = getStudentAuthHost();
    var loginBox = authElement('loginBox');
    var registerBox = authElement('registerBox');
    var freeGateBox = authElement('freeGateBox');
    var freeRegisterBox = authElement('freeRegisterBox');

    if (!loginBox || !registerBox) return;

    var isLogin = mode === 'login';
    var isRegister = mode === 'register';
    var isFree = mode === 'free';

    setVisible(loginBox, isLogin);
    setVisible(registerBox, isRegister);
    setVisible(freeGateBox, isFree);
    setVisible(freeRegisterBox, false);

    var loginTab = authElement('loginTab');
    var registerTab = authElement('registerTab');
    var freeTab = authElement('freeTab');
    if (loginTab) loginTab.classList.toggle('active', isLogin);
    if (registerTab) registerTab.classList.toggle('active', isRegister);
    if (freeTab) freeTab.classList.toggle('active', isFree);

    if (isRegister) {
      registerBox.querySelectorAll('.formGroup').forEach(function (group) {
        group.hidden = false;
        group.classList.remove('hidden');
        group.style.removeProperty('display');
        group.style.removeProperty('visibility');
        group.style.removeProperty('opacity');
      });
      registerBox.querySelectorAll('input,select,button').forEach(function (control) {
        control.hidden = false;
        control.style.removeProperty('display');
        control.style.removeProperty('visibility');
        control.style.removeProperty('opacity');
      });
      updateRegistrationTypeUI();
    }

    setMessage('');
    setMessage('', false, 'admin');

    if (host) {
      host.dataset.authMode = mode;
    }
  }

  function showAuth(mode) {
    /* The legacy caller may pass "admin"; that action is handled by the
       dedicated Admin panel and must not disturb Student tab state. */
    if (mode === 'admin') {
      setMessage('', false, 'admin');
      return;
    }
    applyStudentAuthState(mode === 'register' ? 'register' : 'login');
  }
  global.showAuth = showAuth;

  function showFreeGate() {
    applyStudentAuthState('free');
  }
  global.showFreeGate = showFreeGate;

  function repairStudentAuthUI() {
    if (!document.body.classList.contains('hoa-student-auth')) return;
    var host = getStudentAuthHost();
    if (!host) return;

    var registerTab = host.querySelector('#registerTab');
    var freeTab = host.querySelector('#freeTab');
    if (registerTab && registerTab.classList.contains('active')) {
      applyStudentAuthState('register');
    } else if (freeTab && freeTab.classList.contains('active')) {
      applyStudentAuthState('free');
    } else {
      applyStudentAuthState('login');
    }
  }

  function forceStudentLoginFields() {
    if (!document.body.classList.contains('hoa-student-auth')) return;
    var host = getStudentAuthHost();
    if (!host) return;
    var box = host.querySelector('#loginBox');
    if (!box) return;

    setVisible(box, true);
    box.querySelectorAll('.formGroup').forEach(function (group) {
      group.hidden = false;
      group.classList.remove('hidden');
      group.style.removeProperty('display');
      group.style.removeProperty('visibility');
      group.style.removeProperty('opacity');
    });
    box.querySelectorAll('#loginId,#loginPassword').forEach(function (input) {
      input.hidden = false;
      input.style.removeProperty('display');
      input.style.removeProperty('visibility');
      input.style.removeProperty('opacity');
    });
  }

  AUTH.refreshLoginUI = repairStudentAuthUI;
  global.hoaRefreshAuthUI = repairStudentAuthUI;

  /* ============================================================
     3. ADMIN ACCOUNT / ROLE CONTROLS
     ============================================================ */
  function getAdminAccount() {
    return {
      username: document.getElementById('adminUsername')?.value || ''
    };
  }
  global.getAdminAccount = getAdminAccount;

  function saveAdminAccount() {
    /* Admin credentials are managed by Supabase Auth. */
  }
  global.saveAdminAccount = saveAdminAccount;

  function setAccountStatus(text, ok) {
    var el = document.getElementById('accountStatus');
    if (!el) return;
    el.textContent = text == null ? '' : String(text);
    el.style.color = ok ? '#087443' : '#b42318';
  }
  global.setAccountStatus = setAccountStatus;

  async function renderAdminAccount() {
    var username = document.getElementById('accountUsername');
    if (username) {
      try {
        var client = getClient();
        var result = client ? await client.auth.getUser() : null;
        username.value = result?.data?.user?.email || '';
      } catch (_) {
        username.value = '';
      }
      username.readOnly = true;
    }

    [
      'accountCurrentPassword',
      'accountNewPassword',
      'accountConfirmPassword'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    setAccountStatus('');
  }
  global.renderAdminAccount = renderAdminAccount;

  function setAuthScreenVisible(visible) {
    var authScreen = document.getElementById('authScreen');
    if (!authScreen) return;
    authScreen.classList.toggle('hidden', !visible);
    authScreen.style.display = visible ? '' : 'none';
  }
  global.setAuthScreenVisible = setAuthScreenVisible;

  function passwordPolicy(password) {
    if (typeof global.hoaValidateAdminPassword === 'function') {
      return global.hoaValidateAdminPassword(password);
    }
    var value = String(password || '');
    var valid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/.test(value);
    return {
      ok: valid,
      message: valid ? '' : 'Admin password must be at least 6 characters and contain at least 1 uppercase letter, 1 lowercase letter and 1 special character.'
    };
  }

  async function syncAdminRole() {
    var client = getClient();
    if (!client) return 'none';
    try {
      var roleResult = await client.rpc('get_admin_role');
      if (roleResult.error) throw roleResult.error;

      var role = typeof global.hoaNormalizeAdminRole === 'function'
        ? global.hoaNormalizeAdminRole(roleResult.data)
        : (roleResult.data || 'none');

      global.hoaAdminRole = role;
      document.body.classList.toggle('hoa-owner-mode', role === 'owner');

      if (typeof global.hoaV645LoadPermissions === 'function') {
        await global.hoaV645LoadPermissions();
      }

      var consoleButton = document.getElementById('openHoaDevConsole');
      if (consoleButton) {
        consoleButton.classList.toggle('hoa-admin-console-hidden', role !== 'owner');
      }

      var adminRoot = document.getElementById('adminOnlyDashboard');
      if (adminRoot && !document.getElementById('hoaV643RoleBadge')) {
        var head = adminRoot.querySelector('.dashPanel');
        if (head) {
          var badge = document.createElement('span');
          badge.id = 'hoaV643RoleBadge';
          badge.className = 'hoa643-role';
          badge.textContent = role === 'owner' ? 'Super Admin / Owner' : 'Administrator';
          head.appendChild(badge);
        }
      }

      var masterNav = document.getElementById('adminNavMaster');
      var masterPanel = document.getElementById('adminSectionMasterPanel');
      var adminPanel = document.getElementById('adminSectionAdminPanel');
      var adminNav = document.getElementById('adminNavAdmin');

      /* Master and Admin Access are Owner-only command-center functions.
         Teacher/Admin accounts must not see or enter either section. */
      if (masterNav) masterNav.style.display = role === 'owner' ? '' : 'none';
      if (masterPanel && role !== 'owner') {
        masterPanel.style.display = 'none';
        masterPanel.classList.remove('active', 'v13-active');
      }

      if (adminNav) adminNav.style.display = role === 'owner' ? '' : 'none';
      if (adminPanel && role !== 'owner') {
        adminPanel.style.display = 'none';
        adminPanel.classList.remove('active', 'v13-active');
        var note = adminPanel.querySelector('p');
        if (note) {
          note.textContent = 'Administrator account controls are restricted to the Super Admin / Owner.';
        }
        adminPanel.querySelectorAll('input,button').forEach(function (control) {
          control.disabled = true;
        });
      }

      return role;
    } catch (e) {
      console.warn('Admin role synchronization failed:', e);
      global.hoaAdminRole = 'none';
      return 'none';
    }
  }
  AUTH.syncAdminRole = syncAdminRole;
  global.applyAdminRole = syncAdminRole;
  global.hoaSyncAdminRole = syncAdminRole;

  /* ============================================================
     4. STUDENT / ADMIN LOGIN COMPLETION
     ============================================================ */
  async function completeAdminSession(authUser) {
    adminLoggedIn = true;
    global.adminLoggedIn = true;
    currentStudent = null;
    global.currentStudent = null;
    global.adminPreviewMode = false;

    document.body.classList.remove('hoa-public-auth', 'hoa-admin-auth', 'hoa-student-auth');
    document.body.classList.add('admin-ui');

    document.getElementById('studentHeaderLogout')?.classList.add('hidden');
    document.getElementById('adminHeaderLogout')?.classList.remove('hidden');

    setAuthScreenVisible(false);
    // Build/reparent the authoritative Admin shell while Home is still hidden.
    // This prevents the legacy dashboard from flashing before the current UI.
    try {
      if (typeof global.hoaEnsureAdminReferenceUI === 'function') {
        global.hoaEnsureAdminReferenceUI();
      }
    } catch (e) {
      console.warn('Admin reference UI pre-initialization:', e);
    }
    document.getElementById('home')?.classList.remove('hidden');
    document.getElementById('adminUsername').value = authUser?.email || '';
    document.getElementById('adminPassword').value = '';

    if (typeof global.hideStudentExamScreens === 'function') {
      global.hideStudentExamScreens();
    } else {
      document.getElementById('exam')?.classList.add('hidden');
      document.getElementById('result')?.classList.add('hidden');
    }

    /* The authoritative Admin shell was initialized above while Home was
       still hidden, so the legacy dashboard cannot flash during login. */

    document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
    document.getElementById('studentOnlyDashboard')?.classList.add('hidden');

    if (typeof global.showDashboardTab === 'function') {
      await global.showDashboardTab('admin');
    }

    if (typeof global.hoaEnterAuthenticated === 'function') {
      global.hoaEnterAuthenticated('admin');
    }

    try {
      await renderAdminAccount();
      if (typeof global.loadAdminData === 'function') await global.loadAdminData();
      await syncAdminRole();
      if (typeof global.showAdminSection === 'function') {
        await global.showAdminSection(global.hoaAdminRole === 'owner' ? 'master' : 'student');
      }
      if (global.hoaAdminRole === 'owner' && typeof global.hoaV643RenderOwnerAdminManager === 'function') {
        global.hoaV643RenderOwnerAdminManager();
      }
    } catch (e) {
      console.error('Admin dashboard initialization warning', e);
      setMessage('Admin login successful. Some dashboard data could not be loaded; refresh the dashboard to retry.', true, 'admin');
    }

    updateHeaderLogout();
    return true;
  }

  async function completeStudentSession(authUser, studentRow) {
    if (!studentRow) throw new Error('Student profile is not linked to this login. Please contact Admin.');
    if (studentRow.status !== 'active') {
      throw new Error('Your account is not active yet. Please contact the Admin.');
    }

    var user = global.studentFromRow(studentRow);
    adminLoggedIn = false;
    global.adminLoggedIn = false;
    global.adminPreviewMode = false;
    global.hoaAdminRole = 'none';
    document.body.classList.remove('admin-ui', 'hoa-owner-mode');

    document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
    user.passwordAssigned = true;

    var users = getUsers().filter(function (item) {
      return String(item.id) !== String(user.id);
    });
    users.unshift(user);
    saveUsers(users);
    localStorage.setItem('missionTES_currentUser', user.id);
    currentStudent = user;
    global.currentStudent = user;

    if (typeof global.resetPreviousAttemptsForStudent === 'function') {
      await global.resetPreviousAttemptsForStudent(user.id);
    }

    if (typeof global.loadTestsFromSupabase === 'function') {
      await global.loadTestsFromSupabase();
    }

    if (typeof global.loadResultsFromSupabase === 'function') {
      try {
        var fresh = await global.loadResultsFromSupabase(user.id);
        localStorage.setItem('missionTES_results_cache', JSON.stringify(fresh || []));
      } catch (e) {
        console.warn('Could not load attempt history:', e);
      }
    }

    if (typeof global.enterPlatform === 'function') {
      global.enterPlatform();
    }

    updateHeaderLogout();
    return true;
  }

  async function loginAdmin() {
    var username = (document.getElementById('adminUsername')?.value || '').trim().toLowerCase();
    var password = document.getElementById('adminPassword')?.value || '';
    var client = getClient();

    if (!client) {
      setMessage('Supabase is not connected. Please try again when Supabase is available.', false, 'admin');
      return false;
    }
    if (!username || !password) {
      setMessage('Enter the Admin email and password.', false, 'admin');
      return false;
    }
    if (!global.HOA_UTILS?.isValidEmail(username)) {
      setMessage('Use the Admin email address.', false, 'admin');
      return false;
    }

    var authUser = null;
    try {
      var result = await global.HOA_SERVICES.admin.verifyAndSignIn(username, password);
      authUser = result?.user || null;
      if (!authUser) throw new Error('Supabase did not return an authenticated user.');
    } catch (e) {
      console.error('Admin authentication error', e);
      setMessage('Admin login failed: ' + global.supaError('admin login', e), false, 'admin');
      return false;
    }

    return completeAdminSession(authUser);
  }
  global.loginAdmin = loginAdmin;

  async function loginStudent() {
    var identifier = (document.getElementById('loginId')?.value || '').trim();
    var password = document.getElementById('loginPassword')?.value || '';
    var client = getClient();

    if (!client) {
      setMessage('Supabase is not connected.');
      return false;
    }
    if (!identifier || !password) {
      setMessage('Enter your email/mobile and password.');
      return false;
    }

    try {
      if (/^[6-9]\d{9}$/.test(identifier.replace(/\s+/g, ''))) {
        var mobile = identifier.replace(/\s+/g, '');
        var mobileLogin = await client.functions.invoke('login-by-mobile', {
          body: { mobile: mobile, password: password }
        });
        if (mobileLogin.error) throw mobileLogin.error;
        if (mobileLogin.data?.error) throw new Error(mobileLogin.data.error);
        if (!mobileLogin.data?.session?.access_token || !mobileLogin.data?.session?.refresh_token) {
          throw new Error('Invalid email/mobile or password.');
        }

        var sessionResult = await client.auth.setSession({
          access_token: mobileLogin.data.session.access_token,
          refresh_token: mobileLogin.data.session.refresh_token
        });
        if (sessionResult.error) throw sessionResult.error;
      } else {
        var email = identifier.toLowerCase();
        if (!global.HOA_UTILS?.isValidEmail(email)) {
          setMessage('Enter a valid email or 10-digit mobile number.');
          return false;
        }
        var signIn = await client.auth.signInWithPassword({
          email: email,
          password: password
        });
        if (signIn.error) throw signIn.error;
        if (!signIn.data?.user) throw new Error('Authentication failed.');
      }

      var userResult = await client.auth.getUser();
      var authUser = userResult?.data?.user;
      if (!authUser) throw new Error('Authenticated session was not created.');

      var studentResponse = await client
        .from('students')
        .select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      if (studentResponse.error) throw studentResponse.error;
      if (!studentResponse.data) {
        try { await client.auth.signOut(); } catch (_) {}
        throw new Error('Student profile is not linked to this login. Please contact Admin.');
      }

      return await completeStudentSession(authUser, studentResponse.data);
    } catch (e) {
      console.error('Student login error', e);
      setMessage('Login failed: ' + global.supaError('student login', e));
      return false;
    }
  }
  global.loginStudent = loginStudent;

  /* ============================================================
     5. REGISTRATION / FREE CANDIDATE ACCESS
     ============================================================ */
  async function freeGateLoginSubmit() {
    var login = (document.getElementById('freeGateLogin')?.value || '').trim();
    var password = document.getElementById('freeGatePassword')?.value || '';
    var client = getClient();
    if (!login || !password) {
      setMessage('Enter the Free Test Login ID / email and password.');
      return false;
    }
    if (!client) {
      setMessage('Supabase is not connected.');
      return false;
    }

    try {
      if (global.HOA_UTILS?.isValidEmail(login.toLowerCase())) {
        document.getElementById('loginId').value = login.toLowerCase();
        document.getElementById('loginPassword').value = password;
        return await loginStudent();
      }

      var gate = await client.functions.invoke('free-candidate-register', {
        body: { action: 'gate', login: login, password: password }
      });
      if (gate.error) throw gate.error;
      if (gate.data?.error) throw new Error(gate.data.error);

      setVisible(authElement('freeGateBox'), false);
      setVisible(authElement('freeRegisterBox'), true);
      setMessage('Free access verified. Complete your registration.', true);
      return true;
    } catch (e) {
      setMessage('Free Test Login failed: ' + global.supaError('free test access', e));
      return false;
    }
  }
  global.freeGateLoginSubmit = freeGateLoginSubmit;

  async function registerFreeCandidate() {
    var name = (document.getElementById('freeRegName')?.value || '').trim();
    var email = (document.getElementById('freeRegEmail')?.value || '').trim().toLowerCase();
    var qualification = document.getElementById('freeRegQualification')?.value || '';
    var passoutYear = (document.getElementById('freeRegPassoutYear')?.value || '').trim();
    var college = (document.getElementById('freeRegCollege')?.value || '').trim();
    var gateLogin = (document.getElementById('freeGateLogin')?.value || '').trim();
    var gatePassword = document.getElementById('freeGatePassword')?.value || '';
    var client = getClient();

    if (!name || !email || !qualification || !passoutYear || !college) {
      setMessage('Please complete all required fields.');
      return false;
    }
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) {
      setMessage('Please enter a valid full name.');
      return false;
    }
    if (!global.HOA_UTILS?.isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      return false;
    }
    var currentYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(passoutYear) || Number(passoutYear) < 1950 || Number(passoutYear) > currentYear) {
      setMessage('Please enter a valid passout year.');
      return false;
    }
    if (college.length < 2) {
      setMessage('Please enter a valid college name.');
      return false;
    }
    if (!client) {
      setMessage('Supabase is not connected.');
      return false;
    }

    try {
      var clientPassword = gatePassword;
      var result = await client.functions.invoke('free-candidate-register', {
        body: {
          action: 'register',
          login: gateLogin,
          password: gatePassword,
          id: global.crypto.randomUUID(),
          full_name: name,
          email: email,
          qualification: qualification,
          passout_year: passoutYear,
          college_name: college,
          client_password: clientPassword
        }
      });
      if (result.error) throw result.error;
      if (result.data?.error) throw new Error(result.data.error);

      var signIn = await client.auth.signInWithPassword({
        email: email,
        password: clientPassword
      });
      if (signIn.error) throw signIn.error;

      document.getElementById('loginId').value = email;
      document.getElementById('loginPassword').value = clientPassword;
      return await loginStudent();
    } catch (e) {
      setMessage('Free registration failed: ' + global.supaError('free candidate registration', e));
      return false;
    }
  }
  global.registerFreeCandidate = registerFreeCandidate;

  async function registerStudent() {
    var name = (document.getElementById('regName')?.value || '').trim();
    var email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
    var accessType = document.getElementById('regAccessType')?.value === 'free' ? 'free' : 'paid';
    var mobile = (document.getElementById('regMobile')?.value || '').replace(/\s+/g, '').trim();
    var qualification = document.getElementById('regQualification')?.value || '';
    var passoutYear = (document.getElementById('regPassoutYear')?.value || '').trim();
    var college = (document.getElementById('regCollege')?.value || '').trim();
    var client = getClient();

    if (!name || !email || !qualification || !passoutYear || !college || (accessType === 'paid' && !mobile)) {
      setMessage(accessType === 'free'
        ? 'Please fill all required fields. Email is mandatory for Free Candidates.'
        : 'Please fill all required fields. Email and mobile number are mandatory for Paid Candidates.');
      return false;
    }
    if (!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)) {
      setMessage('Please enter a valid full name (letters only).');
      return false;
    }
    if (!global.HOA_UTILS?.isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      return false;
    }
    if (accessType === 'paid' && !/^[6-9]\d{9}$/.test(mobile)) {
      setMessage('Please enter a valid 10-digit Indian mobile number for a Paid Candidate.');
      return false;
    }
    if (accessType === 'free' && mobile && !/^[6-9]\d{9}$/.test(mobile)) {
      setMessage('If provided, the mobile number must be a valid 10-digit Indian mobile number.');
      return false;
    }

    var currentYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(passoutYear) || Number(passoutYear) < 1950 || Number(passoutYear) > currentYear) {
      setMessage('Please enter a valid passout year.');
      return false;
    }
    if (college.length < 2) {
      setMessage('Please enter a valid college name.');
      return false;
    }
    if (!client) {
      setMessage('Supabase is not connected.');
      return false;
    }

    try {
      var newId = global.crypto.randomUUID();
      var row = {
        id: newId,
        full_name: name,
        email: email,
        phone: accessType === 'paid' ? mobile : (mobile || null),
        qualification: qualification,
        passout_year: Number(passoutYear),
        college_name: college,
        status: 'pending',
        access_type: accessType,
        created_at: new Date().toISOString()
      };

      try {
        await global.HOA_SERVICES.student.createPending(row);
      } catch (err) {
        var code = err?.code;
        var errorText = String(err?.message || err).toLowerCase();
        if (code === '23505') {
          if (errorText.includes('email')) {
            setMessage('This email is already registered.');
            return false;
          }
          if (errorText.includes('phone')) {
            setMessage('This mobile number is already registered.');
            return false;
          }
          setMessage('This student is already registered.');
          return false;
        }
        throw err;
      }

      var user = global.studentFromRow(row);
      var users = getUsers().filter(function (item) {
        return String(item.id) !== String(user.id);
      });
      users.unshift(user);
      saveUsers(users);

      if (typeof global.renderAdminStudents === 'function') {
        global.renderAdminStudents();
      }

      alert('You have successfully registered. Please ask the Admin for your unique password.');

      ['regName', 'regEmail', 'regMobile', 'regPassoutYear', 'regCollege'].forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = '';
      });
      var typeField = document.getElementById('regAccessType');
      if (typeField) typeField.value = 'paid';
      var qualificationField = document.getElementById('regQualification');
      if (qualificationField) qualificationField.value = '';
      updateRegistrationTypeUI();
      showAuth('login');
      return true;
    } catch (e) {
      console.error('Student registration error', e);
      setMessage('Registration failed: ' + global.supaError('registration', e));
      return false;
    }
  }
  global.registerStudent = registerStudent;

  /* ============================================================
     6. LOGOUT / AUTH GUARDS / ACCOUNT PASSWORD
     ============================================================ */
  function updateHeaderLogout() {
    var studentButton = document.getElementById('studentHeaderLogout');
    var adminButton = document.getElementById('adminHeaderLogout');
    if (!studentButton || !adminButton) return;

    var student = typeof global.currentStudent !== 'undefined' ? global.currentStudent : null;
    var admin = typeof global.adminLoggedIn !== 'undefined' ? global.adminLoggedIn : false;
    var preview = typeof global.adminPreviewMode !== 'undefined' ? global.adminPreviewMode : false;

    studentButton.classList.toggle('hidden', !(student && !preview));
    adminButton.classList.toggle('hidden', !admin);
  }
  global.updateHeaderLogout = updateHeaderLogout;

  async function logoutStudent() {
    try {
      if (typeof global.testLaunchToken !== 'undefined') global.testLaunchToken += 1;
      if (typeof global.interval !== 'undefined') {
        clearInterval(global.interval);
        global.interval = null;
      }
      global.adminPreviewMode = false;
      currentStudent = null;
    global.currentStudent = null;
      adminLoggedIn = false;
    global.adminLoggedIn = false;
      global.currentAttemptId = null;
      global.currentAttemptCreatePromise = null;
      global.currentAttemptLaunchToken = 0;
      global.activeTestId = null;
    } catch (_) {}

    try {
      var client = getClient();
      if (client) await client.auth.signOut();
    } catch (e) {
      console.warn('Student sign-out failed:', e);
    }

    clearSensitiveAuthCaches();
    global.hoaAdminRole = 'none';

    document.body.classList.remove('admin-ui', 'hoa-owner-mode', 'hoa-public-auth', 'hoa-admin-auth', 'hoa-student-auth');
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('exam')?.classList.add('hidden');
    document.getElementById('result')?.classList.add('hidden');
    document.getElementById('headerTimer')?.classList.add('hidden');
    document.getElementById('studentHeaderLogout')?.classList.add('hidden');
    document.getElementById('adminHeaderLogout')?.classList.add('hidden');
    document.getElementById('studentOnlyDashboard')?.classList.add('hidden');
    document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
    if (document.getElementById('loginId')) document.getElementById('loginId').value = '';
    if (document.getElementById('loginPassword')) document.getElementById('loginPassword').value = '';

    if (typeof global.hoaExitToFrontPage === 'function') {
      global.hoaExitToFrontPage();
    }
    return true;
  }
  global.logoutStudent = logoutStudent;

  async function logoutAdmin() {
    try {
      if (typeof global.testLaunchToken !== 'undefined') global.testLaunchToken += 1;
      if (typeof global.interval !== 'undefined') {
        clearInterval(global.interval);
        global.interval = null;
      }
      global.adminPreviewMode = false;
      adminLoggedIn = false;
    global.adminLoggedIn = false;
      currentStudent = null;
    global.currentStudent = null;
    } catch (_) {}

    try {
      var client = getClient();
      if (client) await client.auth.signOut();
    } catch (e) {
      console.warn('Admin sign-out failed:', e);
    }

    clearSensitiveAuthCaches();
    global.hoaAdminRole = 'none';

    document.body.classList.remove('admin-ui', 'hoa-owner-mode', 'hoa-public-auth', 'hoa-admin-auth', 'hoa-student-auth');
    document.getElementById('studentHeaderLogout')?.classList.add('hidden');
    document.getElementById('adminHeaderLogout')?.classList.add('hidden');
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
    document.getElementById('adminUsername')?.setAttribute('value', '');
    document.getElementById('adminPassword')?.setAttribute('value', '');
    if (document.getElementById('adminUsername')) document.getElementById('adminUsername').value = '';
    if (document.getElementById('adminPassword')) document.getElementById('adminPassword').value = '';

    if (typeof global.hoaExitToFrontPage === 'function') {
      global.hoaExitToFrontPage();
    }
    return true;
  }
  global.logoutAdmin = logoutAdmin;

  async function changeAdminAccount() {
    if (!requireAdmin('changing the Admin password')) return false;

    var current = document.getElementById('accountCurrentPassword')?.value || '';
    var next = document.getElementById('accountNewPassword')?.value || '';
    var confirmNext = document.getElementById('accountConfirmPassword')?.value || '';
    var policy = passwordPolicy(next);

    if (!policy.ok) {
      setAccountStatus(policy.message);
      return false;
    }
    if (next !== confirmNext) {
      setAccountStatus('New password and confirmation do not match.');
      return false;
    }

    try {
      await global.HOA_SERVICES.admin.updatePassword(current, next);
      await renderAdminAccount();
      setAccountStatus('✓ Admin password updated successfully.', true);
      alert('Admin password updated successfully.');
      return true;
    } catch (e) {
      setAccountStatus('Password update failed: ' + global.supaError('Admin password update', e));
      return false;
    }
  }
  global.changeAdminAccount = changeAdminAccount;

  function requireAdmin(action) {
    var admin = typeof global.adminLoggedIn !== 'undefined' ? global.adminLoggedIn : false;
    var student = typeof global.currentStudent !== 'undefined' ? global.currentStudent : null;
    if (admin === true && student === null) return true;
    alert('Admin login required to use ' + (action || 'this action') + '.');
    return false;
  }
  global.requireAdmin = requireAdmin;

  AUTH.isAuthenticated = function () {
    return Boolean(
      (typeof global.adminLoggedIn !== 'undefined' && global.adminLoggedIn) ||
      (typeof global.currentStudent !== 'undefined' && global.currentStudent)
    );
  };

  /* ============================================================
     7. SESSION RESTORATION
     ============================================================ */
  AUTH.getSession = async function () {
    var client = getClient();
    if (!client?.auth) return null;
    var result = await client.auth.getSession();
    if (result.error) throw result.error;
    return result.data?.session || null;
  };

  AUTH.restoreSession = async function () {
    var client = getClient();
    if (!client?.auth) return false;

    var sessionResult = await client.auth.getSession();
    if (sessionResult.error) throw sessionResult.error;
    var session = sessionResult.data?.session;
    if (!session?.user) return false;

    /* Admin identity is checked first, matching the current production flow. */
    try {
      if (global.HOA_SERVICES?.admin?.isAdmin) {
        var adminResult = await global.HOA_SERVICES.admin.isAdmin();
        if (adminResult === true) {
          return await completeAdminSession(session.user);
        }
      }
    } catch (e) {
      console.warn('Could not restore Admin session:', e);
    }

    /* Then resolve a genuine student profile from the authenticated identity. */
    var studentRow = null;
    try {
      if (global.HOA_SERVICES?.student?.getByAuthUserId) {
        studentRow = await global.HOA_SERVICES.student.getByAuthUserId(session.user.id);
      } else {
        var response = await client
          .from('students')
          .select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        if (response.error) throw response.error;
        studentRow = response.data || null;
      }
    } catch (e) {
      console.warn('Could not restore Student session:', e);
      studentRow = null;
    }

    if (!studentRow) {
      try { await client.auth.signOut(); } catch (_) {}
      currentStudent = null;
    global.currentStudent = null;
      adminLoggedIn = false;
    global.adminLoggedIn = false;
      return false;
    }

    try {
      return await completeStudentSession(session.user, studentRow);
    } catch (e) {
      console.warn('Student session validation failed:', e);
      try { await client.auth.signOut(); } catch (_) {}
      currentStudent = null;
    global.currentStudent = null;
      adminLoggedIn = false;
    global.adminLoggedIn = false;
      return false;
    }
  };

  /* ============================================================
     8. INITIALIZATION / COMPATIBILITY SURFACE
     ============================================================ */
  global.HOA_AUTH = AUTH;

  function bootAuthUI() {
    repairStudentAuthUI();
    forceStudentLoginFields();
    setTimeout(repairStudentAuthUI, 0);
    setTimeout(forceStudentLoginFields, 50);
    setTimeout(forceStudentLoginFields, 250);
    if (typeof updateRegistrationTypeUI === 'function') {
      try { updateRegistrationTypeUI(); } catch (_) {}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(bootAuthUI, 0);
    }, { once: true });
  } else {
    setTimeout(bootAuthUI, 0);
  }

  window.addEventListener('popstate', function () {
    setTimeout(repairStudentAuthUI, 0);
    setTimeout(forceStudentLoginFields, 0);
  });
})(window);


/* HOA MASTER OPERATIONS ANALYTICS — tracking/feedback helpers */
(function(global){
  'use strict';
  function getClient(){return global.supabaseClient || null;}
  function visitorKey(){
    try{
      var k=localStorage.getItem('hoa_visitor_key');
      if(!k){k='v_'+crypto.randomUUID();localStorage.setItem('hoa_visitor_key',k);}
      return k;
    }catch(_){return 'v_'+Math.random().toString(36).slice(2)+Date.now().toString(36);}
  }
  function sessionKey(){
    try{
      var k=sessionStorage.getItem('hoa_session_key');
      if(!k){k='s_'+crypto.randomUUID();sessionStorage.setItem('hoa_session_key',k);}
      return k;
    }catch(_){return 's_'+Date.now().toString(36);}
  }
  global.HOA_TRACKING={
    visitorKey:visitorKey,
    sessionKey:sessionKey,
    trackStudentActivity:function(activityType,resourceType,resourceId,metadata){
      var c=getClient();
      if(!c?.rpc) return Promise.resolve(null);
      return c.rpc('hoa_track_student_activity',{p_activity_type:activityType,p_resource_type:resourceType||null,p_resource_id:resourceId||null,p_metadata:metadata||{}})
        .then(function(r){if(r.error)throw r.error;return r.data;}).catch(function(e){console.debug('HOA activity tracking skipped:',e?.message||e);return null;});
    },
    trackVisit:function(){
      var c=getClient();
      if(!c?.rpc) return Promise.resolve(null);
      var onceKey='hoa_visit_tracked_'+location.pathname+location.search;
      try{if(sessionStorage.getItem(onceKey)==='1')return Promise.resolve(null);sessionStorage.setItem(onceKey,'1');}catch(_){}
      return c.rpc('hoa_track_site_visit',{p_visitor_key:visitorKey(),p_session_id:sessionKey(),p_path:(location.pathname||'/')+(location.search||''),p_referrer:document.referrer||null})
        .then(function(r){if(r.error)throw r.error;return r.data;}).catch(function(e){console.debug('HOA visit tracking skipped:',e?.message||e);return null;});
    },
    submitFeedback:function(payload){
      var c=getClient();
      if(!c?.rpc) return Promise.reject(new Error('Supabase is not connected.'));
      return c.rpc('hoa_submit_site_feedback',payload).then(function(r){if(r.error)throw r.error;return r.data;});
    }
  };

  function bootVisit(){setTimeout(function(){global.HOA_TRACKING?.trackVisit();},350);}
  function bindFeedback(){
    var modal=document.getElementById('hoaFeedbackModal');
    var open=document.getElementById('hoaFeedbackOpen');
    var submit=document.getElementById('hoaFeedbackSubmit');
    if(!modal||!open||!submit||modal.dataset.hoaFeedbackBound==='1')return;
    modal.dataset.hoaFeedbackBound='1';
    function setFeedbackState(opened){
      var body=document.body;
      var strip=document.getElementById('hoaPublicFeedbackStrip');
      if(opened){
        body.classList.add('hoa-feedback-open');
        body.setAttribute('data-hoa-feedback-state','open');
        strip?.setAttribute('data-hoa-feedback-state','open');
      }else{
        body.classList.remove('hoa-feedback-open');
        body.setAttribute('data-hoa-feedback-state','closed');
        strip?.setAttribute('data-hoa-feedback-state','closed');
      }
    }
    function close(){
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden','true');
      setFeedbackState(false);
    }
    setFeedbackState(false);
    open.addEventListener('click',function(){
      setFeedbackState(true);
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden','false');
      setTimeout(function(){document.getElementById('hoaFeedbackMessage')?.focus();},30);
    });
    modal.querySelectorAll('[data-feedback-close]').forEach(function(el){el.addEventListener('click',close);});
    submit.addEventListener('click',async function(){
      var msg=document.getElementById('hoaFeedbackMsg');
      var message=(document.getElementById('hoaFeedbackMessage')?.value||'').trim();
      var email=(document.getElementById('hoaFeedbackEmail')?.value||'').trim();
      var category=document.getElementById('hoaFeedbackCategory')?.value||'suggestion';
      var ratingValue=document.getElementById('hoaFeedbackRating')?.value||'';
      var rating=ratingValue?Number(ratingValue):null;
      if(message.length<3){if(msg)msg.textContent='Please enter your suggestion.';return;}
      submit.disabled=true;if(msg)msg.textContent='Sending…';
      try{
        await global.HOA_TRACKING.submitFeedback({p_visitor_key:global.HOA_TRACKING.visitorKey(),p_category:category,p_rating:rating,p_message:message,p_contact_email:email||null});
        if(msg)msg.textContent='Thank you. Your feedback has been recorded.';
        document.getElementById('hoaFeedbackMessage').value='';document.getElementById('hoaFeedbackEmail').value='';
        setTimeout(close,900);
      }catch(e){if(msg)msg.textContent=e?.message||'Unable to send feedback.';}
      finally{submit.disabled=false;}
    });
  }
  function boot(){bootVisit();bindFeedback();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
