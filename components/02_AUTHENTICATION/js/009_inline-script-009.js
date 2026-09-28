

/* V5.0.2 — Student navigation safety guard.
   This function is used only for student-facing Back navigation.
   It does not authenticate or grant Admin access. */
function returnToStudentDashboardSafe(){
  try{
    if(typeof adminPreviewMode !== "undefined") adminPreviewMode = false;
    document.documentElement.classList.remove("admin-ui");
    if(document.body) document.body.classList.remove("admin-ui");

    ["adminDashboard","adminOnlyDashboard","adminSection","adminPanel"].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.classList.add("hidden");
    });

    if(typeof returnToStudentDashboard === "function"){
      returnToStudentDashboard();
      return;
    }
    if(typeof showStudentDashboard === "function"){
      showStudentDashboard();
      return;
    }
    if(typeof openStudentDashboard === "function"){
      openStudentDashboard();
      return;
    }

    ["studentDashboard","studentHome","studentSection","home"].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.classList.remove("hidden");
    });
  }catch(e){
    console.warn("Student navigation error:", e);
  }
}

/* HUB OF ASPIRANTS V5.0 — JavaScript extracted from V4.8. */
/* Inline script blocks are preserved in their original order. */


/* ===== Original inline script 1 ===== */

/* ===== HUB OF ASPIRANTS — SUPABASE CONNECTION ===== */
const SUPABASE_URL = "https://pnzhtiwwqiqnnkecogcc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Qwq-5g_j446D3fEyJn5MOg_p9y6JNBC";

let supabaseClient = null;
let supabaseConnected = false;

function initSupabase(){
  try{
    if(!window.supabase || !window.supabase.createClient){
      throw new Error("Supabase library did not load.");
    }
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
    window.supabaseClient = supabaseClient;
    supabaseConnected = true;
    return true;
  }catch(e){
    console.error("Supabase init error:",e);
    supabaseConnected = false;
    return false;
  }
}

function supaError(action, error){
  console.error("Supabase "+action, error);
  const msg = error && error.message ? error.message : String(error || "Unknown error");
  return msg;
}

async function sha256(text){
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function studentFromRow(r){
  return {
    id:r.id,
    name:r.full_name,
    email:r.email,
    mobile:r.phone,
    qualification:r.qualification,
    passoutYear:r.passout_year,
    college:r.college_name,
    passwordHash:r.password_hash || null,
    passwordAssigned:!!r.password_hash,
    status:r.status || "Password not set",
    accessType:r.access_type || "paid",
    joined:r.created_at || new Date().toISOString()
  };
}

function testFromRows(testRow, questionRows){
  const qs = questionRows
    .filter(q=>q.test_id===testRow.id)
    .sort((a,b)=>(a.question_order||0)-(b.question_order||0))
    .map(q=>{
      const arr=[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,q.correct_option,q.explanation||""];
      Object.defineProperty(arr,"__id",{value:q.id,enumerable:false,writable:true});
      return arr;
    });
  return {
    id:testRow.id,
    title:testRow.title,
    questions:qs,
    duration:Number(testRow.duration_minutes)||10,
    marks:Number(testRow.marks_per_question)||1,
    negative:Number(testRow.negative_marking)||0,
    is_published:Boolean(testRow.is_published),
    accessType:testRow.access_type || "paid",
    created:testRow.created_at
  };
}

async function supabaseHealthCheck(){
  if(!supabaseClient) return {ok:false,message:"Supabase client is not initialized."};
  const {data,error}=await supabaseClient.from("tests").select("id").limit(1);
  if(error) return {ok:false,message:supaError("health check",error)};
  return {ok:true,message:"Supabase connection successful."};
}

async function loadStudentsFromSupabase(){
  if(!supabaseClient) return;
  const {data,error}=await supabaseClient
    .from("students")
    .select("id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type")
    .order("created_at",{ascending:false});
  if(error) throw error;
  const users=(data||[]).map(studentFromRow);
  localStorage.setItem("missionTES_users_cache",JSON.stringify(users));
  return users;
}

async function loadTestsFromSupabase(){
  if(!supabaseClient) return;
  const {data:testRows,error:testError}=await supabaseClient
    .from("tests")
    .select("id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,created_at")
    .order("created_at",{ascending:true});
  if(testError) throw testError;

  const ids=(testRows||[]).map(t=>t.id);
  if(!ids.length){
    tests=[];
    return;
  }

  const questionSource = adminLoggedIn ? "questions" : "student_questions";
  const questionSelect = adminLoggedIn
    ? "id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order"
    : "id,test_id,question_text,option_1,option_2,option_3,option_4,question_order";
  const {data:qRows,error:qError}=await supabaseClient
    .from(questionSource)
    .select(questionSelect)
    .in("test_id",ids)
    .order("question_order",{ascending:true});
  if(qError) throw qError;

  tests=(testRows||[])
    .filter(t=>t.is_published || adminLoggedIn)
    .map(t=>testFromRows(t,qRows||[]))
    .filter(t=>t.questions.length>0);

  // V4.2: never expose answer keys/explanations in the ordinary student
  // test object or browser cache. Admin preview keeps its existing data path.
  if(!adminLoggedIn){
    tests=tests.map(t=>({
      ...t,
      questions:t.questions.map(q=>{
        const a=[q[0],q[1],q[2],q[3],q[4]];
        try{Object.defineProperty(a,"__id",{value:q.__id,enumerable:false});}catch(e){}
        return a;
      })
    }));
  }

  localStorage.setItem("missionTES_tests_cache",JSON.stringify(tests));
}

async function resetPreviousAttemptsForStudent(studentId){
  /* Production hardening: login must never delete examination history. */
  return {ok:true,count:0,skipped:true,studentId:studentId||null};
}

async function loadResultsFromSupabase(studentId){
  if(!supabaseClient || !studentId)return [];
  // V4.6: secure candidate history. The database function resolves ownership
  // from auth.uid() -> students.auth_user_id -> students.id.
  const {data,error}=await supabaseClient.rpc("get_student_result_history_v4_5");
  if(error)throw error;
  const active=(typeof currentStudent!=="undefined" && currentStudent)?currentStudent:null;
  return (Array.isArray(data)?data:[]).map(r=>{
    const startMs=Date.parse(r.started_at||"");
    const endMs=Date.parse(r.submitted_at||"");
    const timeTaken=(Number.isFinite(startMs)&&Number.isFinite(endMs))?Math.max(0,Math.round((endMs-startMs)/1000)):null;
    const total=Number(r.total_questions)||0;
    const marksPer=Number(r.marks_per_question)||1;
    const maxMarks=total*marksPer;
    const score=Number(r.score)||0;
    return {id:r.id,testId:r.test_id||null,userId:r.student_id||studentId,student_id:r.student_id||studentId,
      auth_user_id:active?.auth_user_id||null,email:active?.email||"",userName:active?.name||"Student",
      title:r.test_title||"Mock Test",date:r.submitted_at||r.started_at,submittedAt:r.submitted_at||"",startedAt:r.started_at||"",
      correct:Number(r.correct_answers)||0,wrong:Number(r.wrong_answers)||0,skipped:Number(r.unanswered)||0,
      marks:score,score:score,maxMarks:maxMarks,max_marks:maxMarks,marksPerCorrect:marksPer,
      negativeMarks:Number(r.negative_marking)||0,totalQuestions:total,percentage:maxMarks>0?(score/maxMarks)*100:0,
      timeTaken:timeTaken,elapsedSeconds:timeTaken};
  });
}
async function createAttemptInSupabase(testId,totalQuestions){
  if(!supabaseClient || !currentStudent || !testId) return null;
  /* Production hardening: attempt creation is server-authorized. The browser
     never chooses student_id, status, score or access rights. */
  const {data,error}=await supabaseClient.rpc("start_test_attempt_v1",{p_test_id:testId});
  if(error) throw error;
  if(!data?.ok || !data?.attempt_id) throw new Error(data?.error||"Could not start the test attempt.");
  return data.attempt_id;
}

async function saveAttemptToSupabase(attemptId,testId,correct,wrong,skipped,score,answersSnapshot){
  // V4.2: final submission is handled by the secure submit_test_v4 RPC.
  // Kept as a compatibility shim for older code paths.
  if(!supabaseClient || !currentStudent || !attemptId) return;
  return;
  const {error:updateError}=await supabaseClient.from("attempts").update({
    submitted_at:new Date().toISOString(),
    status:"completed",
    total_questions:questions.length,
    correct_answers:correct,
    wrong_answers:wrong,
    unanswered:skipped,
    score:score,
  }).eq("id",attemptId);
  if(updateError) throw updateError;

  const rows=questions.map((q,i)=>({
    attempt_id:attemptId,
    question_id:q.__id || null,
    selected_option:answersSnapshot[i],
    is_correct:answersSnapshot[i]!==null && answersSnapshot[i]===q[5],
    marks_awarded:answersSnapshot[i]===null ? 0 : (answersSnapshot[i]===q[5] ? marksPerCorrect : -negativeMarks)
  })).filter(r=>r.question_id);

  if(rows.length){
    const {error:ansError}=await supabaseClient.from("answers").insert(rows);
    if(ansError) throw ansError;
  }
}

async function saveTestToSupabase(t){
  if(!supabaseClient) return t.id;
  const testId=(t.id && /^[0-9a-f-]{36}$/i.test(t.id))?t.id:null;
  const qRows=(Array.isArray(t.questions)?t.questions:[]).map((q,i)=>({
    question_text:q[0]||"",
    option_1:q[1]||"",
    option_2:q[2]||"",
    option_3:q[3]||"",
    option_4:q[4]||"",
    correct_option:Number(q[5]),
    explanation:q[6]||"",
    question_order:i+1
  }));
  const {data,error}=await supabaseClient.rpc("save_test_bundle_v1",{
    p_test_id:testId,
    p_title:String(t.title||"").trim(),
    p_description:null,
    p_duration_minutes:Number(t.duration),
    p_marks_per_question:Number(t.marks),
    p_negative_marking:Number(t.negative),
    p_is_published:Boolean(t.is_published),
    p_access_type:t.accessType === "free" ? "free" : "paid",
    p_questions:qRows
  });
  if(error) throw error;
  if(!data) throw new Error("Test save returned no test id.");
  t.id=data;
  t.created=t.created || new Date().toISOString();
  return data;
}

async function deleteTestFromSupabase(id){
  if(!supabaseClient) return;
  const {error}=await supabaseClient.from("tests").delete().eq("id",id);
  if(error) throw error;
}

async function showSupabaseStatus(){
  const el=document.getElementById("fileStatus");
  if(!el || !supabaseConnected) return;
  const result=await supabaseHealthCheck();
  el.innerHTML=result.ok
    ? '<span style="color:#087443;font-weight:700">✓ Supabase connected</span>'
    : '<span style="color:#b42318;font-weight:700">✗ Supabase: '+escapeHTML(result.message)+'</span>';
}


/* ===== Original inline script 2 ===== */

const questions=window.HOA_sanitizeQuestions([

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
]);
let testTitle="TES Mock Test 01";
let durationMinutes=10;
let marksPerCorrect=1;
let negativeMarks=0.25;
let csvLoaded=false;
let tests=[];
let activeTestId=null;
let currentAttemptId=null;
let v35SubmissionInFlight=false;

let currentAttemptCreatePromise=null;
let currentAttemptLaunchToken=0;
/* CBT state: answers are SAVED only via Save & Next / Mark for Review. */
let pendingAnswers=[];
let marked=[];
let visited=[];
let examStartedAt=null;
let examStartedPerf=null;
let reviewCurrent=0;

function uid(){return "test_"+Date.now()+"_"+Math.random().toString(36).slice(2,7)}
function makeTest(title, qs, duration=10, marks=1, negative=.25, accessType="paid"){
  return {id:uid(),title,questions:qs,duration,marks,negative,is_published:false,accessType:accessType==="free"?"free":"paid",created:new Date().toISOString()};
}
let currentStudent=null;
let adminLoggedIn=false;
const ADMIN_AUTH_EMAIL="dwipjoy2d@gmail.com";
function getAdminAccount(){
  // Admin authentication is handled by Supabase Auth.
  // Keep this helper only for displaying the current Auth email.
  return {username:ADMIN_AUTH_EMAIL || ""};
}
function saveAdminAccount(account){
  // Kept for backward compatibility; Admin credentials are no longer stored locally.
}
function setAccountStatus(text,ok=false){
  const el=document.getElementById("accountStatus");
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?"#087443":"#b42318";
}
async function renderAdminAccount(){
  const u=document.getElementById("accountUsername");
  if(u){
    try{
      const {data}=await supabaseClient.auth.getUser();
      u.value=data?.user?.email || "";
    }catch(e){ u.value=""; }
    u.readOnly=true;
  }
  ["accountCurrentPassword","accountNewPassword","accountConfirmPassword"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});
  setAccountStatus("");
}

function getUsers(){
  try{
    return JSON.parse(localStorage.getItem("missionTES_users_cache")||"[]");
  }catch(e){return []}
}
function saveUsers(users){
  // Never persist student password hashes in browser storage. Authentication
  // compares the hash only during login and the cached profile contains no credential.
  const safe=(Array.isArray(users)?users:[]).map(u=>{
    const copy={...u};
    delete copy.passwordHash;
    return copy;
  });
  localStorage.setItem("missionTES_users_cache",JSON.stringify(safe));
}
function getCurrentStudent(){
  try{
    const id=localStorage.getItem("missionTES_currentUser");
    if(!id)return null;
    return getUsers().find(u=>u.id===id)||null;
  }catch(e){return null}
}
function setMessage(text,ok=false,target="student"){
  const el=document.getElementById(target==="admin"?"adminAuthMessage":"studentAuthMessage");
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?"#087443":"#b42318";
}
function showAuth(mode){
  const login=mode==="login", register=mode==="register";
  document.getElementById("loginBox").classList.toggle("hidden",!login);
  document.getElementById("registerBox").classList.toggle("hidden",!register);
  document.getElementById("freeGateBox").classList.add("hidden");
  document.getElementById("freeRegisterBox").classList.add("hidden");
  document.getElementById("loginTab").classList.toggle("active",login);
  document.getElementById("registerTab").classList.toggle("active",register);
  document.getElementById("freeTab").classList.remove("active");
  setMessage("");
  setMessage("",false,"admin");
}
function updateRegistrationTypeUI(){
  const type=document.getElementById("regAccessType")?.value || "paid";
  const mobileGroup=document.getElementById("regMobileGroup");
  const mobileInput=document.getElementById("regMobile");
  const note=document.getElementById("registrationTypeNote");
  if(type === "free"){
    if(mobileGroup) mobileGroup.classList.add("hidden");
    if(mobileInput){ mobileInput.required=false; mobileInput.value=""; }
    if(note) note.innerHTML='<b>Free Candidate:</b> Email is mandatory. Mobile number is not required. The Admin will provide the unique login password after registration.';
  }else{
    if(mobileGroup) mobileGroup.classList.remove("hidden");
    if(mobileInput) mobileInput.required=true;
    if(note) note.innerHTML='<b>Paid Candidate:</b> Email and mobile number are mandatory. After registration, the Admin will provide the unique login password.';
  }
}

function showFreeGate(){
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("registerBox").classList.add("hidden");
  document.getElementById("freeGateBox").classList.remove("hidden");
  document.getElementById("freeRegisterBox").classList.add("hidden");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("registerTab").classList.remove("active");
  document.getElementById("freeTab").classList.add("active");
  setMessage("");
}

async function freeGateLoginSubmit(){
  const login=document.getElementById("freeGateLogin").value.trim();
  const password=document.getElementById("freeGatePassword").value;
  if(!login || !password){setMessage("Enter the Free Test Login ID / email and password.");return;}
  try{
    // Returning Free Candidate: registered email + common Free Test password
    // goes directly to the candidate dashboard without another registration.
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.toLowerCase())){
      const {data,error}=await supabaseClient.functions.invoke("free-candidate-register",{body:{action:"email_login",email:login,password}});
      if(error) throw error;
      if(data?.error) throw new Error(data.error);
      document.getElementById("loginId").value=login.toLowerCase();
      document.getElementById("loginPassword").value=password;
      await loginStudent();
      return;
    }

    // New Free Candidate: common MISSIONTES / TES@2026 credential opens
    // the registration form.
    const {data,error}=await supabaseClient.functions.invoke("free-candidate-register",{body:{action:"gate",login,password}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    document.getElementById("freeGateBox").classList.add("hidden");
    document.getElementById("freeRegisterBox").classList.remove("hidden");
    setMessage("Free access verified. Complete your registration.",true);
  }catch(e){setMessage("Free Test Login failed: "+supaError("free test access",e));}
}

async function registerFreeCandidate(){
  const name=document.getElementById("freeRegName").value.trim();
  const email=document.getElementById("freeRegEmail").value.trim().toLowerCase();
  const qualification=document.getElementById("freeRegQualification").value;
  const passoutYear=document.getElementById("freeRegPassoutYear").value.trim();
  const college=document.getElementById("freeRegCollege").value.trim();
  const gateLogin=document.getElementById("freeGateLogin").value.trim();
  const gatePassword=document.getElementById("freeGatePassword").value;
  if(!name||!email||!qualification||!passoutYear||!college){setMessage("Please complete all required fields.");return;}
  if(!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)){setMessage("Please enter a valid full name.");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){setMessage("Please enter a valid email address.");return;}
  const currentYear=new Date().getFullYear();
  if(!/^\d{4}$/.test(passoutYear)||Number(passoutYear)<1950||Number(passoutYear)>currentYear){setMessage("Please enter a valid passout year.");return;}
  if(college.length<2){setMessage("Please enter a valid college name.");return;}
  try{
    /* The Edge Function validates this field as a registration payload.
       The actual Auth password remains the existing Free Test credential. */
    const clientPassword="HOA_FREE_2026!";
    const {data,error}=await supabaseClient.functions.invoke("free-candidate-register",{body:{action:"register",login:gateLogin,password:gatePassword,id:crypto.randomUUID(),full_name:name,email,qualification,passout_year:passoutYear,college_name:college,client_password:clientPassword}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    const {error:signInError}=await supabaseClient.auth.signInWithPassword({email,password:clientPassword});
    if(signInError) throw signInError;
    document.getElementById("loginId").value=email;
    document.getElementById("loginPassword").value=clientPassword;
    await loginStudent();
  }catch(e){setMessage("Free registration failed: "+supaError("free candidate registration",e));}
}

async function registerStudent(){
  const name=document.getElementById("regName").value.trim();
  const email=document.getElementById("regEmail").value.trim().toLowerCase();
  const accessType=document.getElementById("regAccessType")?.value === "free" ? "free" : "paid";
  const mobile=document.getElementById("regMobile").value.replace(/\s+/g,"").trim();
  const qualification=document.getElementById("regQualification").value;
  const passoutYear=document.getElementById("regPassoutYear").value.trim();
  const college=document.getElementById("regCollege").value.trim();

  if(!name||!email||!qualification||!passoutYear||!college || (accessType === "paid" && !mobile)){
    setMessage(accessType === "free" ? "Please fill all required fields. Email is mandatory for Free Candidates." : "Please fill all required fields. Email and mobile number are mandatory for Paid Candidates."); return;
  }
  if(!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(name)){
    setMessage("Please enter a valid full name (letters only)."); return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){
    setMessage("Please enter a valid email address."); return;
  }
  if(accessType === "paid" && !/^[6-9]\d{9}$/.test(mobile)){
    setMessage("Please enter a valid 10-digit Indian mobile number for a Paid Candidate."); return;
  }
  if(accessType === "free" && mobile && !/^[6-9]\d{9}$/.test(mobile)){
    setMessage("If provided, the mobile number must be a valid 10-digit Indian mobile number."); return;
  }
  const currentYear=new Date().getFullYear();
  if(!/^\d{4}$/.test(passoutYear)||Number(passoutYear)<1950||Number(passoutYear)>currentYear){
    setMessage("Please enter a valid passout year."); return;
  }
  if(college.length<2){
    setMessage("Please enter a valid college name."); return;
  }

  if(!supabaseClient){
    setMessage("Supabase is not connected."); return;
  }

  try{
    // Registration is intentionally public. The database RLS policy permits
    // anonymous INSERT only when status = 'pending'. We do not SELECT the
    // students table here because that would expose other candidates.
    const newId=crypto.randomUUID();
    const row={
      id:newId,
      full_name:name,
      email,
      phone:accessType === "paid" ? mobile : (mobile || null),
      qualification,
      passout_year:Number(passoutYear),
      college_name:college,
      status:"pending",
      access_type:accessType,
      created_at:new Date().toISOString()
    };

    const {error:rowError}=await supabaseClient.from("students").insert(row);
    if(rowError){
      if(rowError.code==="23505") {
        const msg=String(rowError.message||"").toLowerCase();
        if(msg.includes("email")) { setMessage("This email is already registered."); return; }
        if(msg.includes("phone")) { setMessage("This mobile number is already registered."); return; }
        setMessage("This student is already registered."); return;
      }
      throw rowError;
    }

    const user=studentFromRow(row);
    const users=getUsers().filter(u=>u.id!==user.id);
    users.unshift(user);
    saveUsers(users);
    renderAdminStudents();

    alert("You have successfully registered.Please ask the Admin for your unique password.");
    document.getElementById("regAccessType").value="paid";
    document.getElementById("regName").value="";
    document.getElementById("regEmail").value="";
    document.getElementById("regMobile").value="";
    updateRegistrationTypeUI();
    document.getElementById("regQualification").value="";
    document.getElementById("regPassoutYear").value="";
    document.getElementById("regCollege").value="";
    showAuth("login");
  }catch(e){
    console.error(e);
    setMessage("Registration failed: "+supaError("registration",e));
  }
}
async function loginAdmin(){
  const username=(document.getElementById("adminUsername")?.value||"").trim().toLowerCase();
  const password=document.getElementById("adminPassword")?.value||"";
  if(!supabaseClient){setMessage("Supabase is not connected. Please try again when Supabase is available.",false,"admin");return}
  if(!username || !password){setMessage("Enter the Admin email and password.",false,"admin");return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)){setMessage("Use the Admin email address.",false,"admin");return}

  /* AUTHENTICATION BOUNDARY — only actual Auth/RBAC failures are reported as
     login failures. Dashboard loading errors must never invalidate a valid
     Supabase session or falsely tell the Owner that the password is wrong. */
  let authUser=null;
  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({email:username,password});
    if(error) throw error;
    authUser=data?.user||null;
    if(!authUser) throw new Error("Supabase did not return an authenticated user.");

    const {data:isAdmin,error:adminError}=await supabaseClient.rpc("is_app_admin");
    if(adminError) throw adminError;
    if(isAdmin!==true){
      await supabaseClient.auth.signOut();
      throw new Error("This account is not registered as an Admin.");
    }
  }catch(e){
    console.error("Admin authentication error",e);
    setMessage("Admin login failed: "+supaError("admin login",e),false,"admin");
    return;
  }

  /* AUTHENTICATED UI BOUNDARY — the session is valid from this point. */
  adminLoggedIn=true;
  currentStudent=null;
  document.body.classList.remove("hoa-public-auth","hoa-admin-auth","hoa-student-auth");
  document.body.classList.add("admin-ui");
  document.getElementById("studentHeaderLogout")?.classList.add("hidden");
  document.getElementById("adminHeaderLogout")?.classList.remove("hidden");
  setAuthScreenVisible(false);
  document.getElementById("home")?.classList.remove("hidden");
  document.getElementById("adminUsername").value=authUser.email||username;
  document.getElementById("adminPassword").value="";
  hideStudentExamScreens();
  document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
  document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
  showDashboardTab("admin");

  /* POST-LOGIN INITIALISATION — never reports an authentication failure. */
  try{
    if(typeof window.hoaEnterAuthenticated === "function") window.hoaEnterAuthenticated("admin");
    await renderAdminAccount();
    await loadAdminData();
    if(typeof window.showAdminSection === "function") await window.showAdminSection("student");
    if(typeof window.hoaV643LoadPermissions === "function") await window.hoaV643LoadPermissions();
    if(window.hoaAdminRole==="owner" && typeof window.hoaV643RenderOwnerAdminManager === "function"){
      window.hoaV643RenderOwnerAdminManager();
    }
  }catch(e){
    console.error("Admin dashboard initialisation warning",e);
    /* Keep the authenticated Admin session alive. Show a dashboard warning,
       not an authentication failure. */
    setMessage("Admin login successful. Some dashboard data could not be loaded; refresh the dashboard to retry.",true,"admin");
  }
}

async function loginStudent(){
  const identifier=document.getElementById("loginId").value.trim();
  const pass=document.getElementById("loginPassword").value;
  if(!supabaseClient){setMessage("Supabase is not connected.");return}
  if(!identifier || !pass){setMessage("Enter your email/mobile and password.");return}

  try{
    // Paid candidates now authenticate through Supabase Auth. This gives the
    // candidate a real authenticated session so the existing RLS policies for
    // published tests, attempts and answers can work normally.
    if(/^[6-9]\d{9}$/.test(identifier.replace(/\s+/g,""))){
      const mobile=identifier.replace(/\s+/g,"");
      const {data,error}=await supabaseClient.functions.invoke("login-by-mobile",{
        body:{mobile,password:pass}
      });
      if(error) throw error;
      if(data?.error) throw new Error(data.error);
      if(!data?.session?.access_token || !data?.session?.refresh_token){
        throw new Error("Invalid email/mobile or password.");
      }
      const {error:sessionError}=await supabaseClient.auth.setSession({
        access_token:data.session.access_token,
        refresh_token:data.session.refresh_token
      });
      if(sessionError) throw sessionError;
    }else{
      const email=identifier.toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        setMessage("Enter a valid email or 10-digit mobile number.");return;
      }
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
      if(error) throw error;
      if(!data?.user){throw new Error("Authentication failed.");}
    }

    const {data:authData}=await supabaseClient.auth.getUser();
    const authUser=authData?.user;
    if(!authUser) throw new Error("Authenticated session was not created.");

    const {data:studentRow,error:studentError}=await supabaseClient
      .from("students")
      .select("id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type")
      .eq("auth_user_id",authUser.id)
      .maybeSingle();
    if(studentError) throw studentError;
    if(!studentRow){
      await supabaseClient.auth.signOut();
      throw new Error("Student profile is not linked to this login. Please contact Admin.");
    }
    if(studentRow.status!=="active"){
      await supabaseClient.auth.signOut();
      setMessage("Your account is not active yet. Please contact the Admin.");return;
    }

    const user=studentFromRow(studentRow);
    // V5.0.1: student authentication always clears any stale Admin UI state.
    adminLoggedIn=false;
    adminPreviewMode=false;
    document.body.classList.remove("admin-ui");
    const adminDash=document.getElementById("adminOnlyDashboard");
    if(adminDash) adminDash.classList.add("hidden");
    user.passwordAssigned=true;
    const users=getUsers().filter(u=>u.id!==user.id);
    users.unshift(user);
    saveUsers(users);
    localStorage.setItem("missionTES_currentUser",user.id);
    currentStudent=user;

    // V2.1 clean-slate migration: remove attempts that existed before this version, once per student.
    await resetPreviousAttemptsForStudent(user.id);
    await loadTestsFromSupabase();
    try{
      const fresh=await loadResultsFromSupabase(user.id);
      localStorage.setItem("missionTES_results_cache",JSON.stringify(fresh));
    }catch(e){console.warn("Could not load attempt history",e)}

    enterPlatform();
  }catch(e){
    console.error("Student login error",e);
    setMessage("Login failed: "+supaError("student login",e));
  }
}
function updateHeaderLogout(){
  const studentBtn=document.getElementById("studentHeaderLogout");
  const adminBtn=document.getElementById("adminHeaderLogout");
  if(!studentBtn || !adminBtn) return;
  studentBtn.classList.toggle("hidden",!(currentStudent && !adminPreviewMode));
  adminBtn.classList.toggle("hidden",!adminLoggedIn);
}

async function logoutStudent(){
  ++testLaunchToken;
  clearInterval(interval);
  interval=null;
  adminPreviewMode=false;
  localStorage.removeItem("missionTES_currentUser");
  currentStudent=null;
  adminLoggedIn=false;
  currentAttemptId=null;
  currentAttemptCreatePromise=null;
  currentAttemptLaunchToken=0;
  activeTestId=null;
  try{ if(supabaseClient) await supabaseClient.auth.signOut(); }catch(e){ console.warn("Student sign-out failed",e); }
  document.getElementById("home").classList.add("hidden");
  document.getElementById("exam").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
  document.getElementById("headerTimer").classList.add("hidden");
  document.getElementById("studentHeaderLogout").classList.add("hidden");
  document.getElementById("adminHeaderLogout").classList.add("hidden");
  
  document.getElementById("studentOnlyDashboard").classList.add("hidden");
  document.getElementById("adminOnlyDashboard").classList.add("hidden");
  document.getElementById("loginId").value="";
  document.getElementById("loginPassword").value="";
  
  if(typeof window.hoaExitToFrontPage === 'function') window.hoaExitToFrontPage();
}
function enterPlatform(){
  document.getElementById("studentHeaderLogout").classList.remove("hidden");
  document.getElementById("adminHeaderLogout").classList.add("hidden");
  
  document.getElementById("home").classList.remove("hidden");
  document.getElementById("profileName").textContent=currentStudent.name;
  document.getElementById("profileEmail").textContent=currentStudent.email+" · "+currentStudent.mobile;
  document.getElementById("profileAcademic").textContent=(currentStudent.qualification||"")+" · "+(currentStudent.passoutYear||"")+" · "+(currentStudent.college||"");
  document.getElementById("avatar").textContent=(currentStudent.name||"S").trim().charAt(0).toUpperCase();
  showDashboardTab("student");
  showCandidateSection("test");
  renderStudentDashboard();
  if(typeof window.hoaInstallStudentNativeBottom === 'function') window.hoaInstallStudentNativeBottom();
  if(typeof window.hoaEnterAuthenticated === 'function') window.hoaEnterAuthenticated('student');
}
async function logoutAdmin(){
  ++testLaunchToken;
  clearInterval(interval);
  interval=null;
  adminPreviewMode=false;
  adminLoggedIn=false;
  try{ if(supabaseClient) await supabaseClient.auth.signOut(); }catch(e){ console.warn("Admin sign-out failed",e); }
  document.getElementById("studentHeaderLogout").classList.add("hidden");
  document.getElementById("adminHeaderLogout").classList.add("hidden");
  document.getElementById("home").classList.add("hidden");
  hideStudentExamScreens();
  
  // V4.8: leave Admin UI mode completely after logout.
  document.body.classList.remove("admin-ui");
  const adminHeaderLogout=document.getElementById("adminHeaderLogout");
  if(adminHeaderLogout) adminHeaderLogout.classList.add("hidden");
  const adminDashboard=document.getElementById("adminOnlyDashboard");
  if(adminDashboard) adminDashboard.classList.add("hidden");
  const adminUsername=document.getElementById("adminUsername");
  const adminPassword=document.getElementById("adminPassword");
  if(adminUsername) adminUsername.value="";
  if(adminPassword) adminPassword.value="";
  
  if(typeof window.hoaExitToFrontPage === 'function') window.hoaExitToFrontPage();
}
async function changeAdminAccount(){
  if(!requireAdmin("changing the Admin password")) return;
  const current=(document.getElementById("accountCurrentPassword")?.value||"");
  const next=(document.getElementById("accountNewPassword")?.value||"");
  const confirmNext=(document.getElementById("accountConfirmPassword")?.value||"");
  if(next.length<6){setAccountStatus("New password must be at least 6 characters.");return}
  if(next!==confirmNext){setAccountStatus("New password and confirmation do not match.");return}
  try{
    // Re-authenticate first so the Admin deliberately confirms the password change.
    const {data:authData,error:authError}=await supabaseClient.auth.getUser();
    const email=authData?.user?.email || ADMIN_AUTH_EMAIL;
    if(authError) throw authError;
    const {error:signInError}=await supabaseClient.auth.signInWithPassword({email,password:current});
    if(signInError) throw signInError;
    const {error:updateError}=await supabaseClient.auth.updateUser({password:next});
    if(updateError) throw updateError;
    await renderAdminAccount();
    setAccountStatus("✓ Admin password updated successfully.",true);
    alert("Admin password updated successfully.");
  }catch(e){
    setAccountStatus("Password update failed: "+supaError("Admin password update",e));
  }
}
async function deleteStudent(id){
  if(!requireAdmin("student deletion")) return;
  const users=getUsers();
  const user=users.find(u=>u.id===id);
  if(!user)return;

  const confirmed=confirm(
    "Confirm Delete"+
    "Student: "+user.name+""+
    "Email: "+user.email+""+
    "Mobile: "+user.mobile+""+
    "Are you sure you want to permanently delete this student?"
  );
  if(!confirmed)return;

  try{
    if(supabaseClient){
      const {error}=await supabaseClient.from("students").delete().eq("id",id);
      if(error) throw error;
    }
    saveUsers(users.filter(u=>u.id!==id));
    const results=getResults().filter(r=>r.userId!==id);
    localStorage.setItem("missionTES_results_cache",JSON.stringify(results));
    renderAdminStudents();
    renderStudentDashboard();
    alert("✓ Student deleted successfully.");
  }catch(e){
    alert("Delete failed: "+supaError("student delete",e));
  }
}
function requireAdmin(action="this action"){
  if(adminLoggedIn===true && currentStudent===null) return true;
  alert("Admin login required to use "+action+".");
  return false;
}
function renderAdminStudents(){
  if(!adminLoggedIn || currentStudent) return;

  const paidBox=document.getElementById("paidStudentAdminList");
  const freeBox=document.getElementById("freeStudentAdminList");
  const paidCount=document.getElementById("paidCandidateCount");
  const freeCount=document.getElementById("freeCandidateCount");
  if(!paidBox || !freeBox) return;

  const users=getUsers();
  const paidUsers=users.filter(u=>u.accessType!=="free");
  const freeUsers=users.filter(u=>u.accessType==="free");

  if(paidCount) paidCount.textContent=paidUsers.length;
  if(freeCount) freeCount.textContent=freeUsers.length;

  const renderRow=(u)=>`<div class="studentAdminRow">
    <div><b>${escapeHTML(u.name)}</b><div style="font-size:11px;color:#64748b">${escapeHTML(u.email)}${u.mobile?" · "+escapeHTML(u.mobile):""}</div><div style="font-size:11px;color:#64748b">${escapeHTML(u.qualification||"")} · ${escapeHTML(String(u.passoutYear||""))} · ${escapeHTML(u.college||"")}</div></div>
    <div><span class="resultBadge">${escapeHTML(u.status||"Password not set")}</span><span class="statusBadge ${u.accessType==="free"?"freeBadge":"paidBadge"}">${u.accessType==="free"?"FREE":"PAID"}</span></div>
    <div>
      <input id="pw_${u.id}" type="text" placeholder="${u.passwordAssigned?"Update password":"Set password"}" value="">
      ${u.passwordAssigned?'<div style="font-size:11px;color:#087443;margin-top:4px">✓ Password is set · hidden for security</div>':""}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="adminAction primarySmall" onclick="assignStudentPassword('${u.id}')">${u.passwordAssigned?"Update Password":"Set Password"}</button>
      <button class="adminAction" onclick="resetStudentPassword('${u.id}')">Reset Password</button>
      <button class="adminAction" onclick="toggleStudentAccess('${u.id}')">${u.accessType==="free"?"MAKE PAID":"MAKE FREE"}</button>
      <button class="adminAction" style="border-color:#efb0aa;color:#b42318" onclick="deleteStudent('${u.id}')">Delete</button>
    </div>
  </div>`;

  paidBox.innerHTML=paidUsers.length ? paidUsers.map(renderRow).join("") : '<div class="emptyState">No Paid Candidates registered yet.</div>';
  freeBox.innerHTML=freeUsers.length ? freeUsers.map(renderRow).join("") : '<div class="emptyState">No Free Test Candidates registered yet.</div>';
}
async function assignStudentPassword(id){
  if(!requireAdmin("password management")) return;
  const input=document.getElementById("pw_"+id);
  const password=(input?input.value:"").trim();
  if(password.length<6){alert("Password must be at least 6 characters.");return}
  try{
    const {data,error}=await supabaseClient.functions.invoke("admin-manage-candidate",{
      body:{action:"set_password",student_id:id,password}
    });
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    await loadStudentsFromSupabase();
    renderAdminStudents();
    alert("Password assigned successfully. Give this password to the student.The candidate's Supabase Auth account is now active.");
  }catch(e){
    alert("Password update failed: "+supaError("password update",e));
  }
}
async function toggleStudentAccess(id){
  if(!requireAdmin("candidate access management")) return;
  const u=getUsers().find(x=>x.id===id);
  if(!u) return;
  const next=u.accessType==="free" ? "paid" : "free";
  if(next==="paid" && !u.mobile){ alert("A mobile number is required before making this candidate Paid."); return; }
  try{
    const {data,error}=await supabaseClient.functions.invoke("admin-manage-candidate",{body:{action:"set_access_type",student_id:id,access_type:next}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    await loadStudentsFromSupabase();
    renderAdminStudents();
    renderStudentDashboard();
  }catch(e){ alert("Candidate access update failed: "+supaError("candidate access update",e)); }
}
async function resetStudentPassword(id){
  if(!requireAdmin("password reset")) return;
  try{
    const {data,error}=await supabaseClient.functions.invoke("admin-manage-candidate",{
      body:{action:"reset_password",student_id:id}
    });
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    await loadStudentsFromSupabase();
    renderAdminStudents();
    alert("Password reset successfully.New password: "+(data?.password||""));
  }catch(e){
    alert("Reset failed: "+supaError("password reset",e));
  }
}
function getResults(){
  try{return JSON.parse(localStorage.getItem("missionTES_results_cache")||"[]")}catch(e){return []}
}
function saveResults(results){localStorage.setItem("missionTES_results_cache",JSON.stringify(results))}
function openAdminTab(){
  if(!adminLoggedIn){
    alert("Please login as Admin first.");
    document.getElementById("home").classList.add("hidden");
    setAuthScreenVisible(true);
    showAuth("admin");
    return;
  }
  showDashboardTab("admin");
  showAdminSection("student");
  setTimeout(function(){ if(window.hoaV643EnsureAdminModules) window.hoaV643EnsureAdminModules(); },0);
}
function setAuthScreenVisible(visible){
  const auth=document.getElementById("authScreen");
  if(!auth) return;
  auth.classList.toggle("hidden", !visible);
  auth.style.display = visible ? "" : "none";
}

function hideStudentExamScreens(){
  const exam=document.getElementById("exam");
  const result=document.getElementById("result");
  const overlay=document.getElementById("testCountdownOverlay");
  if(exam) exam.classList.add("hidden");
  if(result) result.classList.add("hidden");
  if(overlay) overlay.classList.add("hidden");
  clearInterval(interval);
  interval=null;
  document.getElementById("headerTimer")?.classList.add("hidden");
  adminPreviewMode=false;
}

/* V1.5 compatibility shim. The V1.3 clean controller below is the sole
   owner of Admin navigation and Result Management. Older internal callers
   can continue using the original function name without maintaining a
   second Result implementation. */
function showAdminSection(section){
  if(typeof window.showAdminSection === "function" && window.showAdminSection !== showAdminSection){
    return window.showAdminSection(section);
  }
  if(!adminLoggedIn){
    alert("Please login as Admin first.");
    return;
  }
  const ids={student:"adminSectionStudentPanel",test:"adminSectionTestPanel",result:"adminSectionResultPanel",admin:"adminSectionAdminPanel"};
  Object.entries(ids).forEach(([key,id])=>document.getElementById(id)?.classList.toggle("active",key===section));
  const nav={student:"adminNavStudent",test:"adminNavTest",result:"adminNavResult",admin:"adminNavAdmin"};
  Object.entries(nav).forEach(([key,id])=>document.getElementById(id)?.classList.toggle("active",key===section));
}

async function showCandidateSection(section){
  section = section === "result" ? "result" : "test";
  const testPanel = document.getElementById("candidateSectionTestPanel");
  const resultPanel = document.getElementById("candidateSectionResultPanel");

  if(testPanel) {
    testPanel.classList.remove("active");
    if(section === "test") testPanel.classList.add("active");
  }
  if(resultPanel) {
    resultPanel.classList.remove("active");
    if(section === "result") resultPanel.classList.add("active");
  }

  const testBtn = document.getElementById("candidateNavTest");
  const resultBtn = document.getElementById("candidateNavResult");
  if(testBtn) testBtn.classList.toggle("active", section === "test");
  if(resultBtn) resultBtn.classList.toggle("active", section === "result");

  if(section === "result") await renderCandidateResults();
}

async function renderCandidateResults(){
  const box=document.getElementById("candidateResultsList");
  if(!box)return;
  /* V4.6: Result Section must be backed by Supabase, not localStorage.
     The dashboard counter is already reading the real attempts table, while
     the old renderer could read an empty/stale browser cache. */
  box.innerHTML='<div class="emptyState">Loading your results…</div>';
  let rows=[];
  try{
    const sid=(typeof currentStudent!=="undefined" && currentStudent?.id) || currentStudent?.id || null;
    if(supabaseClient && sid){
      rows=await loadResultsFromSupabase(sid);
      /* Keep a fresh cache only as a fallback for the review UI. */
      if(Array.isArray(rows)) saveResults(rows);
    }else if(typeof getResults==="function") {
      rows=getResults()||[];
    }
  }catch(e){
    console.error("Candidate results load failed:",e);
    box.innerHTML='<div class="emptyState">Unable to load your results right now. Please refresh and try again.</div>';
    const badge=document.getElementById("candidateResultsBadge"); if(badge)badge.textContent="0 TESTS";
    return;
  }
  /* V4.2: use the public.students ID as the primary ownership key.
     window.currentUser.id is the Supabase Auth UUID and is intentionally
     different from students.id.  Mixing them made valid result rows vanish. */
  /* V4.6: currentStudent is a top-level let in this page, so it is not
     guaranteed to exist on window. Use the real lexical value first. */
  const activeStudent=(typeof currentStudent!=="undefined" && currentStudent) ? currentStudent : (currentStudent||null);
  const activeUser=(typeof currentUser!=="undefined" && currentUser) ? currentUser : (window.currentUser||null);
  const currentStudentId=String(activeStudent?.id||"");
  const currentAuthId=String(activeStudent?.auth_user_id||activeUser?.id||"");
  const currentEmail=String(activeStudent?.email||activeUser?.email||"").toLowerCase();
  if(!currentStudentId && !currentAuthId && !currentEmail){
    rows=[];
  }else{
    rows=rows.filter(r=>{
      const email=String(r.email||"").toLowerCase();
      const id=String(r.userId||r.student_id||r.user_id||"");
      const authId=String(r.auth_user_id||r.authUserId||"");
      return (currentStudentId && id===currentStudentId) ||
             (currentAuthId && authId===currentAuthId) ||
             (currentEmail && email===currentEmail);
    });
  }
  const badge=document.getElementById("candidateResultsBadge");
  if(badge)badge.textContent=rows.length+" "+(rows.length===1?"TEST":"TESTS");
  if(!rows.length){
    box.innerHTML='<div class="emptyState">No tests attempted yet. Start a mock test from the Test Section.</div>';
    return;
  }
  const formatDate=(value)=>{
    if(!value)return "—";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return escapeHTML(String(value));
    return d.toLocaleString([], {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  };
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const marks=r=>{const v=num(r.marks??r.score);return v===null?"—":v.toFixed(2)};
  const maxMarks=r=>{const v=num(r.maxMarks??r.max_marks??r.totalMarks??r.total_marks);if(v!==null)return v.toFixed(2);const q=num(r.totalQuestions??r.total_questions);const m=num(r.marksPerCorrect??r.marks_per_correct);return q!==null&&m!==null?(q*m).toFixed(2):"—"};
  const pct=r=>{const v=num(r.percentage??r.percent);return v===null?"—":v.toFixed(1)+"%"};
  const count=(r,keys)=>{for(const k of keys){const v=num(r[k]);if(v!==null)return String(Math.max(0,v))}return "—"};
  const time=r=>{
    let seconds=num(r.timeTaken??r.time_taken??r.elapsedSeconds??r.elapsed_seconds);
    if(seconds===null){const a=Date.parse(r.startedAt??r.started_at??"");const b=Date.parse(r.submittedAt??r.submitted_at??"");if(Number.isFinite(a)&&Number.isFinite(b))seconds=Math.max(0,Math.round((b-a)/1000));}
    if(seconds===null)return "—";
    seconds=Math.max(0,Math.round(seconds)); const m=Math.floor(seconds/60), sec=seconds%60; const h=Math.floor(m/60), mm=m%60;
    return h?`${h}h ${String(mm).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`:`${mm}m ${String(sec).padStart(2,"0")}s`;
  };
  box.innerHTML=`<div class="studentAttemptHistory">${rows.slice().reverse().map((r,index)=>{
    const scorePct=num(r.percentage??r.percent)??0;
    const pctClass=scorePct>=60?"good":scorePct>0?"mid":"low";
    return `<article class="studentAttemptCard">
      <div class="studentAttemptCardTop">
        <div><div class="attemptEyebrow">ATTEMPT ${rows.length-index}</div><h4>${escapeHTML(r.title||r.testTitle||"Mock Test")}</h4><div class="attemptDate">${formatDate(r.date||r.submittedAt||r.submitted_at||r.started_at)}</div></div>
        <div class="attemptScore ${pctClass}"><b>${pct(r)}</b><span>${marks(r)} / ${maxMarks(r)}</span></div>
      </div>
      <div class="attemptMetrics">
        <span><b>${count(r,["correct","correctAnswers","correct_answers"])}</b> Correct</span>
        <span><b>${count(r,["wrong","wrongAnswers","wrong_answers"])}</b> Wrong</span>
        <span><b>${count(r,["skipped","unanswered","unansweredQuestions","unanswered_questions"])}</b> Skipped</span>
        <span><b>${time(r)}</b> Time</span>
      </div>
      <div class="attemptActionRow"><button type="button" class="viewAttemptBtn" onclick="viewStudentAttempt('${String(r.id||'').replace(/'/g,"\\'")}')">VIEW ATTEMPT</button></div>
    </article>`;
  }).join("")}</div>`;
}

function saveHistoricalAttemptDetail(attemptId, detail){
  if(!attemptId || !detail) return;
  try{
    const key="missionTES_attempt_details_v21";
    const all=JSON.parse(localStorage.getItem(key)||"{}");
    const clean={
      questions:Array.isArray(detail.questions)?detail.questions.map(q=>Array.isArray(q)?q.slice():q):[],
      answers:Array.isArray(detail.answers)?detail.answers.slice():[],
      testTitle:detail.testTitle||"Mock Test",
      testId:detail.testId||null,
      marksPerCorrect:Number.isFinite(Number(detail.marksPerCorrect)) ? Number(detail.marksPerCorrect) : null,
      negativeMarks:Number.isFinite(Number(detail.negativeMarks)) ? Number(detail.negativeMarks) : null,
      maxMarks:Number.isFinite(Number(detail.maxMarks)) ? Number(detail.maxMarks) : null,
      savedAt:new Date().toISOString()
    };
    all[String(attemptId)]=clean;

    // Secondary key makes historical review resilient if the dashboard cache
    // is rebuilt from Supabase and the attempt row loses its embedded detail.
    if(detail.testId){
      all["test:"+String(detail.testId)+":attempt:"+String(attemptId)]=clean;
    }
    localStorage.setItem(key,JSON.stringify(all));

    // Also keep the same detail directly inside the local result row when possible.
    try{
      const rows=JSON.parse(localStorage.getItem("missionTES_results_cache")||"[]");
      if(Array.isArray(rows)){
        const row=rows.find(x=>String(x.id||"")===String(attemptId));
        if(row){
          row.questions=clean.questions.map(q=>Array.isArray(q)?q.slice():q);
          row.answers=clean.answers.slice();
          localStorage.setItem("missionTES_results_cache",JSON.stringify(rows));
        }
      }
    }catch(ignore){}
  }catch(e){ console.warn("Could not cache attempt detail",e); }
}
function loadHistoricalAttemptDetail(attemptId, testId, title){
  try{
    const all=JSON.parse(localStorage.getItem("missionTES_attempt_details_v21")||"{}");
    if(!all || typeof all!=="object") return null;

    const direct=all[String(attemptId)];
    if(direct && Array.isArray(direct.questions) && direct.questions.length) return direct;

    if(testId){
      const byPair=all["test:"+String(testId)+":attempt:"+String(attemptId)];
      if(byPair && Array.isArray(byPair.questions) && byPair.questions.length) return byPair;
    }

    // V4.2: never select an attempt by test title alone.
    // The authoritative identity is the student's attempt ID.
  }catch(e){}
  return null;
}

async function viewStudentAttempt(attemptId){
  try{
    if(!attemptId)return;
    const rows=(getResults()||[]);
    const activeStudent=(typeof currentStudent!=="undefined" && currentStudent)?currentStudent:null;
    const activeUser=(typeof currentUser!=="undefined" && currentUser)?currentUser:null;
    const currentStudentId=String(activeStudent?.id||"");
    const currentAuthId=String(activeStudent?.auth_user_id||activeUser?.id||"");
    const currentEmail=String(activeStudent?.email||activeUser?.email||"").toLowerCase();
    let r=rows.find(x=>String(x.id||"")===String(attemptId));
    if(r){
      const email=String(r.email||"").toLowerCase();
      const id=String(r.userId||r.student_id||r.user_id||"");
      const authId=String(r.auth_user_id||r.authUserId||"");
      const owns=(currentStudentId&&id===currentStudentId) ||
                 (currentAuthId&&authId===currentAuthId) ||
                 (currentEmail&&email===currentEmail);
      if(!owns) r=null;
    }
    if(!r){alert("This attempt could not be found.");return;}

    let rawQs=Array.isArray(r.questions)&&r.questions.length?r.questions:null;
    let savedAnswers=Array.isArray(r.answers)?r.answers:null;

    // V2.1 reliability fallback: the result-list row intentionally contains summary data only.
    // Keep a local immutable copy of each submitted attempt so VIEW ATTEMPT works even when
    // the answers/questions tables are protected by RLS or the readback query is unavailable.
    const localDetail=loadHistoricalAttemptDetail(attemptId, r.testId, r.title);
    const reviewTest=(Array.isArray(tests)?tests:[]).find(t=>String(t.id)===String(r.testId));
    const reviewMarksPerCorrect=Number.isFinite(Number(localDetail?.marksPerCorrect)) ? Number(localDetail.marksPerCorrect) :
      (Number.isFinite(Number(reviewTest?.marks)) ? Number(reviewTest.marks) : (Number.isFinite(Number(r.marksPerCorrect)) ? Number(r.marksPerCorrect) : 1));
    const reviewNegativeMarks=Number.isFinite(Number(localDetail?.negativeMarks)) ? Number(localDetail.negativeMarks) :
      (Number.isFinite(Number(reviewTest?.negative)) ? Number(reviewTest.negative) : (Number.isFinite(Number(r.negativeMarks)) ? Number(r.negativeMarks) : 0));
    if(localDetail){
      if(!rawQs && Array.isArray(localDetail.questions)&&localDetail.questions.length) rawQs=localDetail.questions;
      if(!savedAnswers && Array.isArray(localDetail.answers)) savedAnswers=localDetail.answers;
    }

    // The result row itself is another authoritative local copy. Use it before
    // making any network request so VIEW ATTEMPT can never open as a blank review
    // merely because the Supabase result list omitted the embedded detail.
    if(!rawQs && Array.isArray(r.questions) && r.questions.length) rawQs=r.questions;
    if(!savedAnswers && Array.isArray(r.answers)) savedAnswers=r.answers;

    // For Supabase-backed attempts, use the immutable local snapshot first.
    // This avoids breaking historical review when RLS/network/schema permissions
    // prevent reading the questions/answers tables. Only query Supabase when the
    // local snapshot is unavailable, and treat that query as a best-effort fallback.
    if(!rawQs && supabaseClient && currentStudent && r.id && r.testId){
      try{
        const {data:reviewData,error:reviewError}=await supabaseClient.rpc("get_attempt_review_v4",{p_attempt_id:r.id});
        const reviewRows=Array.isArray(reviewData)?reviewData:(reviewData?[reviewData]:[]);
        if(!reviewError && reviewRows.length){
          rawQs=reviewRows.map(q=>[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,Number(q.correct_option),q.explanation||""]);
          savedAnswers=reviewRows.map(q=>q.selected_option===null||q.selected_option===undefined?null:Number(q.selected_option));
        }
      }catch(reviewRpcError){
        console.warn("Secure historical review unavailable:",reviewRpcError);
      }
    }

    if(!rawQs && supabaseClient && currentStudent && r.id && r.testId){
      try{
        const [{data:qRows,error:qError},{data:aRows,error:aError}]=await Promise.all([
          supabaseClient.from("student_questions").select("id,question_text,option_1,option_2,option_3,option_4,question_order").eq("test_id",r.testId).order("question_order",{ascending:true}),
          supabaseClient.from("answers").select("question_id,selected_option,is_correct,marks_awarded").eq("attempt_id",r.id)
        ]);
        if(!qError && !aError && Array.isArray(qRows) && qRows.length){
          const answerMap=new Map((aRows||[]).map(a=>[String(a.question_id),a]));
          rawQs=qRows.map(q=>[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,null,""]);
          savedAnswers=qRows.map(q=>{
            const a=answerMap.get(String(q.id));
            return a && a.selected_option!==null && a.selected_option!==undefined && a.selected_option!=="" ? Number(a.selected_option) : null;
          });
        }else{
          console.warn("Historical review Supabase fallback unavailable:", qError||aError);
        }
      }catch(reviewReadError){
        console.warn("Historical review Supabase read skipped:", reviewReadError);
      }
    }

    // Fallback to the currently cached test if the attempt was created locally.
    if(!rawQs && r.testId){
      const t=(tests||[]).find(x=>String(x.id)===String(r.testId));
      if(t&&Array.isArray(t.questions))rawQs=t.questions;
    }
    if(!rawQs){
      const t=(tests||[]).find(x=>String(x.title||"")===String(r.title||""));
      if(t&&Array.isArray(t.questions))rawQs=t.questions;
    }
    if(!rawQs||!rawQs.length){
      alert("Question data for this attempt is not available. Please make sure you are logged in with the same student account that made this attempt.");
      return;
    }
    if(rawQs.some(q=>Array.isArray(q) && (q[5]===null || q[5]===undefined)) && supabaseClient && currentStudent && r.id){
      try{
        const {data:reviewData,error:reviewError}=await supabaseClient.rpc("get_attempt_review_v4",{p_attempt_id:r.id});
        const reviewRows=Array.isArray(reviewData)?reviewData:(reviewData?[reviewData]:[]);
        if(!reviewError && reviewRows.length){
          rawQs=reviewRows.map(q=>[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,Number(q.correct_option),q.explanation||""]);
          savedAnswers=reviewRows.map(q=>q.selected_option===null||q.selected_option===undefined?null:Number(q.selected_option));
        }
      }catch(e){ console.warn("Secure review retry failed:",e); }
    }
    if(!savedAnswers)savedAnswers=Array(rawQs.length).fill(null);

    window.__missionTESReviewSnapshot={
      questions:rawQs.map(q=>Array.isArray(q)?q.slice():q),
      answers:savedAnswers.slice(),
      testTitle:r.title||"Mock Test",
      testId:r.testId||null,
      historical:true,
      attemptId:r.id,
      resultRow:r
    };
    window.__missionTESHistoricalAttempt=r;
    reviewCurrent=0;
    document.getElementById("home")?.classList.add("hidden");
    document.getElementById("exam")?.classList.add("hidden");
    document.getElementById("headerTimer")?.classList.add("hidden");
    document.getElementById("result")?.classList.remove("hidden");

    const correct=Number(r.correct??r.correct_answers)||0;
    const wrong=Number(r.wrong??r.wrong_answers)||0;
    const skipped=Number(r.skipped??r.unanswered??r.unanswered_questions)||0;
    const score=Number(r.marks??r.score)||0;
    const max=Number(r.maxMarks??r.max_marks??localDetail?.maxMarks??(rawQs.length*reviewMarksPerCorrect))||0;
    const percentage=Number(r.percentage??r.percent??(max?Math.max(0,score)/max*100:0));
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set("resultTitle",(r.title||"Mock Test")+" — Attempt Review");
    set("score",score.toFixed(2)+" / "+max.toFixed(2));
    set("percentage","Percentage: "+percentage.toFixed(2)+"%");
    set("correct",correct);set("wrong",wrong);set("skipped",skipped);set("finalMarks",score.toFixed(2));
    set("resultMarksInfo",score.toFixed(2)+" / "+max.toFixed(2));set("resultCorrectInfo",correct);set("resultWrongInfo",wrong);set("resultSkippedInfo",skipped);set("resultTimeInfo",formatElapsedTime((()=>{const n=Number(r.timeTaken??r.time_taken??r.elapsedSeconds??r.elapsed_seconds); if(Number.isFinite(n)&&n>=0)return n; const a=Date.parse(r.startedAt??r.started_at??""); const b=Date.parse(r.submittedAt??r.submitted_at??""); return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?Math.round((b-a)/1000):0;})()));
    set("reviewSummary",`${correct} Correct • ${wrong} Wrong • ${skipped} Skipped`);
    const back=document.getElementById("resultBackBtn");
    if(back){back.textContent="← BACK TO RESULTS";back.onclick=()=>{
      window.__missionTESReviewSnapshot=null;
      window.__missionTESHistoricalAttempt=null;
      document.getElementById("result")?.classList.add("hidden");
      document.getElementById("home")?.classList.remove("hidden");
      // V5.0.1: return through the authenticated student route only.
      if(!currentStudent || adminLoggedIn===true){
        alert("Student session is no longer active. Please log in again.");
        setAuthScreenVisible(true);
        return;
      }
      adminLoggedIn=false;
      adminPreviewMode=false;
      document.body.classList.remove("admin-ui");
      showDashboardTab("student");
      showCandidateSection("result");
      renderCandidateResults();
    };}
    forceRenderSubmittedQuestionReview();
    // Direct second pass is intentional: it prevents the legacy renderer from leaving blanks.
    setTimeout(()=>forceRenderSubmittedQuestionReview(),0);
  }catch(e){
    console.error("Historical attempt review failed:",e);
    alert("Unable to open this attempt review. Please try again.");
  }
}

function showDashboardTab(tab){
  const studentOnly=document.getElementById("studentOnlyDashboard");
  const adminOnly=document.getElementById("adminOnlyDashboard");

  // V5.0.1 security/navigation guard: a logged-in student can only enter the
  // student dashboard. Admin UI is shown only when the Admin session is live.
  if(tab==="student"){
    if(!currentStudent || adminLoggedIn===true){
      if(!currentStudent){
        if(studentOnly) studentOnly.classList.add("hidden");
        if(adminOnly) adminOnly.classList.add("hidden");
        return;
      }
      adminLoggedIn=false;
      adminPreviewMode=false;
      document.body.classList.remove("admin-ui");
    }
    setAuthScreenVisible(false);
    hideStudentExamScreens();
    if(studentOnly) studentOnly.classList.remove("hidden");
    if(adminOnly) adminOnly.classList.add("hidden");
    updateHeaderLogout();
    renderStudentDashboard();
    if(currentStudent && supabaseClient) loadResultsFromSupabase(currentStudent.id).then(fresh=>{
      if(Array.isArray(fresh)){ saveResults(fresh); renderStudentDashboard(); }
    }).catch(e=>console.warn("Result refresh:",e));
    return;
  }

  if(tab==="admin"){
    if(!requireAdmin("the Admin Dashboard")){
      if(studentOnly) studentOnly.classList.add("hidden");
      if(adminOnly) adminOnly.classList.add("hidden");
      return;
    }
    setAuthScreenVisible(false);
    hideStudentExamScreens();
    if(studentOnly) studentOnly.classList.add("hidden");
    if(adminOnly) adminOnly.classList.remove("hidden");
    updateHeaderLogout();
    renderLibrary();renderAdminStudents();renderAdminAccount();
  }
}
function renderStudentDashboard(){
  if(typeof window.hoaInstallStudentNativeBottom === 'function') window.hoaInstallStudentNativeBottom();
  const dashboardLogo=document.getElementById("studentDashboardLogo");
  const sourceLogo=document.querySelector("#authScreen .mission-logo");
  if(dashboardLogo && sourceLogo && !dashboardLogo.getAttribute("src")) dashboardLogo.src=sourceLogo.src;
  const allResults=getResults();
  const results=currentStudent?allResults.filter(r=>r.userId===currentStudent.id):[];
  const granular=Boolean(window.hoaV643GranularTestAccess); const granted=window.hoaV643TestGrantIds instanceof Set?window.hoaV643TestGrantIds:new Set(); const availableTests=tests.filter(t=>t.is_published && (t.accessType==="free" || (granular ? granted.has(t.id) : currentStudent?.accessType==="paid")));
  document.getElementById("dashTests").textContent=availableTests.length;
  document.getElementById("dashAttempts").textContent=results.length;
  const scores=results.map(r=>Number(r.percentage)||0);
  document.getElementById("dashBest").textContent=scores.length?Math.max(...scores).toFixed(1)+"%":"0";
  document.getElementById("dashAvg").textContent=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)+"%":"0%";
  const st=document.getElementById("studentTests");
  const studentTests=availableTests;
  if(!studentTests.length){st.innerHTML='<div class="emptyState">No mock tests are currently available for your account.</div>';return}
  st.innerHTML=studentTests.map(t=>`<article class="testItem">
    <div class="testItemInfo">
      <div class="testTitleRow"><b>${escapeHTML(t.title)}</b><span class="statusBadge ${t.accessType==="free"?"freeBadge":"paidBadge"}">${t.accessType==="free"?"FREE":"PAID"}</span></div>
      <div class="testMeta"><span>${t.questions.length} ${t.questions.length===1?"question":"questions"}</span><span>${t.duration} min</span><span>+${t.marks} correct</span><span>−${t.negative} wrong</span></div>
    </div>
    <div class="actions"><button class="startSmall" onclick="startSavedTest('${t.id}')">START TEST</button></div>
  </article>`).join("");
  const badge=document.getElementById("availableTestsBadge");
  if(badge) badge.textContent=`${studentTests.length} ${studentTests.length===1?"TEST":"TESTS"}`;
}
async function loadAdminData(){
  try{
    await loadStudentsFromSupabase();
    await loadTestsFromSupabase();
    await normalizeDuplicateTestTitles();
    renderAdminStudents();
    renderLibrary();
  }catch(e){
    console.error(e);
    alert("Could not load Supabase data: "+supaError("admin data",e));
  }
}
function seedTests(){
  // Local fallback only. Supabase is the source of truth after bootstrap.
  const saved=localStorage.getItem("missionTES_tests_cache");
  if(saved){
    try{tests=JSON.parse(saved); if(!Array.isArray(tests)||!tests.length)throw 0; return}catch(e){}
  }
  tests=[
    makeTest("Transportation Engineering — Mock Test 01", questions.slice(), 10, 1, .25),
    makeTest("Transportation Engineering — Practice Test 02", questions.slice(0,5), 5, 1, .25)
  ];
}
function saveTests(){localStorage.setItem("missionTES_tests_cache",JSON.stringify(tests))}

// Fix any duplicate test titles already present in Supabase. The first test
// keeps its original title; later duplicates receive (2), (3), etc.
async function normalizeDuplicateTestTitles(){
  if(!adminLoggedIn || !supabaseClient || !Array.isArray(tests)) return;

  const seen=new Map();
  let changed=false;

  for(const t of tests){
    const base=String(t.title||"Mock Test").trim().replace(/\s+/g," ") || "Mock Test";
    const key=base.toLowerCase();
    const count=(seen.get(key)||0)+1;
    seen.set(key,count);

    if(count===1){
      if(t.title!==base){
        t.title=base;
        try{
          const {error}=await supabaseClient.from("tests").update({title:base}).eq("id",t.id);
          if(error) throw error;
        }catch(e){
          console.warn("Could not normalize test title",e);
        }
        changed=true;
      }
      continue;
    }

    let suffix=count;
    let newTitle=`${base} (${suffix})`;
    while([...seen.keys()].includes(newTitle.toLowerCase())){
      suffix++;
      newTitle=`${base} (${suffix})`;
    }
    seen.set(newTitle.toLowerCase(),1);

    try{
      const {error}=await supabaseClient.from("tests").update({title:newTitle}).eq("id",t.id);
      if(error) throw error;
      t.title=newTitle;
      changed=true;
    }catch(e){
      console.warn("Could not rename duplicate test title",e);
    }
  }

  if(changed) saveTests();
}

function renderLibrary(){
  if(!adminLoggedIn || currentStudent) return;
  const box=document.getElementById("testLibrary");
  if(!box)return;
  if(!tests.length){box.innerHTML='<div style="color:#64748b;font-size:13px">No tests saved yet.</div>';return}
  box.innerHTML=tests.map(t=>{
    const published=Boolean(t.is_published);
    const free=t.accessType==="free";
    return `<div class="testItem">
      <div style="min-width:0"><b>${escapeHTML(t.title)}</b><span class="statusBadge ${published?"publishedBadge":"draftBadge"}">${published?"PUBLISHED":"DRAFT"}</span><span class="statusBadge ${free?"freeBadge":"paidBadge"}">${free?"FREE":"PAID"}</span><div class="testMeta">${t.questions.length} questions · ${t.duration} min · +${t.marks} / −${t.negative}</div></div>
      <div class="actions" style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end">
        <button class="startSmall" onclick="startSavedTest('${t.id}')">START</button>
        <button class="secondary" onclick="toggleTestPublish('${t.id}')">${published?"UNPUBLISH":"PUBLISH"}</button>
        <button class="secondary" onclick="toggleTestAccess('${t.id}')">${free?"MAKE PAID":"MAKE FREE"}</button>
        <button class="danger" onclick="deleteTest('${t.id}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}
async function updateTestSettings(id, patch){
  if(!requireAdmin("changing test settings")) return;
  const t=tests.find(x=>x.id===id); if(!t) return;
  try{
    if(supabaseClient){
      const {error}=await supabaseClient.from("tests").update(patch).eq("id",id);
      if(error) throw error;
    }
    Object.assign(t, patch.is_published!==undefined?{is_published:Boolean(patch.is_published)}:{}, patch.access_type!==undefined?{accessType:patch.access_type}:{}) ;
    saveTests();
    renderLibrary();
    renderStudentDashboard();
  }catch(e){
    alert("Test update failed: "+supaError("test settings",e));
  }
}
async function toggleTestPublish(id){
  const t=tests.find(x=>x.id===id); if(!t)return;
  const next=!Boolean(t.is_published);
  if(next && !t.questions.length){alert("A test must contain at least one question before it can be published.");return;}
  await updateTestSettings(id,{is_published:next});
}
async function toggleTestAccess(id){
  const t=tests.find(x=>x.id===id); if(!t)return;
  const next=t.accessType==="free"?"paid":"free";
  await updateTestSettings(id,{access_type:next});
}

function escapeHTML(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function showTestCountdown(title, onComplete){
 const overlay=document.getElementById("testCountdownOverlay");
 const titleEl=document.getElementById("countdownTestTitle");
 const numberEl=document.getElementById("countdownNumber");
 const messageEl=document.getElementById("countdownMessage");

 if(!overlay){
   if(typeof onComplete==="function") onComplete();
   return;
 }

 titleEl.textContent=title||"Mock Test";
 overlay.classList.remove("hidden");
 overlay.style.display="flex";

 const sequence=[5,4,3,2,1];
 let i=0;

 const step=()=>{
   if(i<sequence.length){
     numberEl.textContent=sequence[i++];
     messageEl.textContent="Starting in...";
     setTimeout(step,1000);
     return;
   }

   numberEl.textContent="✓";
   messageEl.textContent="LET'S BEGIN";

   setTimeout(()=>{
     /* Force-hide the overlay so CSS/UI changes cannot trap the user here. */
     overlay.classList.add("hidden");
     overlay.style.display="none";

     if(typeof onComplete==="function"){
       try{ onComplete(); }
       catch(e){
         console.error("Test launch error:",e);
         alert("The test could not be opened. Please refresh the page and try again.");
       }
     }
   },700);
 };

 step();
}

function startSavedTestLegacyV19(id){
 const t=tests.find(x=>x.id===id);
 if(!t)return;

 const launchToken=++testLaunchToken;
 clearInterval(interval);
 interval=null;

 adminPreviewMode=(adminLoggedIn===true && currentStudent===null);
 activeTestId=id;
 questions.length=0;
 t.questions.forEach(q=>questions.push(q));

 testTitle=t.title;
 durationMinutes=t.duration;
 marksPerCorrect=t.marks;
 negativeMarks=t.negative;
 timer=Math.round(durationMinutes*60);
 current=0;
 answers=Array(questions.length).fill(null);
 pendingAnswers=Array(questions.length).fill(null);
 submitted=false;
 currentAttemptId=null;

 showTestCountdown(t.title, ()=>{
   if(launchToken!==testLaunchToken)return;

   try{
     const home=document.getElementById("home");
     const exam=document.getElementById("exam");
     const headerTimer=document.getElementById("headerTimer");
     const previewExit=document.getElementById("adminPreviewExit");
     const overlay=document.getElementById("testCountdownOverlay");

     /* Always remove the countdown overlay before opening the test. */
     overlay?.classList.add("hidden");
     if(overlay) overlay.style.display="none";

     home?.classList.add("hidden");
     exam?.classList.remove("hidden");
     if(exam) exam.style.display="block";
     headerTimer?.classList.remove("hidden");
     previewExit?.classList.toggle("hidden",!adminPreviewMode);

     /* Render Question 1 and start the exam timer immediately. */
     render();
     updateTimer();
     clearInterval(interval);
     interval=setInterval(tick,1000);

     /*
       Preserve Supabase attempt creation, but never allow it to block
       the exam UI. The candidate can see the test first.
     */
     if(!adminPreviewMode && supabaseClient && currentStudent){
       createAttemptInSupabase(id,questions.length)
         .then(attemptId=>{ currentAttemptId=attemptId; })
         .catch(e=>{
           console.error("Attempt creation failed:",e);
           /* Keep the test running; submission logic remains unchanged. */
         });
     }
   }catch(e){
     console.error("Test launch error:",e);
     document.getElementById("testCountdownOverlay")?.classList.add("hidden");
     document.getElementById("testCountdownOverlay")?.style.setProperty("display","none");
     alert("The test could not be opened. Please refresh the page and try again.");
   }
 });
}

/* Admin preview exit is owned by the V1.3 clean controller below. */

function showCreator(){
  if(!requireAdmin("the CSV/Test Creator")) return;
  document.getElementById("creatorPanel").scrollIntoView({behavior:"smooth"})
}
async function deleteTest(id){
  if(!requireAdmin("test deletion")) return;
  if(!confirm("Delete this mock test?"))return;
  try{
    if(supabaseClient) await deleteTestFromSupabase(id);
    tests=tests.filter(t=>t.id!==id);saveTests();renderLibrary();renderStudentDashboard();
  }catch(e){alert("Delete failed: "+supaError("test delete",e))}
}
function resetTests(){
  if(!requireAdmin("resetting tests")) return;
  if(!confirm("Reset the test library to the sample tests?"))return;
  tests=[
    makeTest("Transportation Engineering — Mock Test 01", questions.slice(), 10, 1, .25),
    makeTest("Transportation Engineering — Practice Test 02", questions.slice(0,5), 5, 1, .25)
  ];
  saveTests();renderLibrary();
}
async function saveCurrentAsTest(){
  if(!requireAdmin("saving a test")) return;
  applySettings();
  if(!questions.length){alert("No valid questions to save.");return}

  // Test titles must be unique so students/admins never see two tests
  // with the same name. Comparison is case-insensitive and ignores spaces.
  const cleanTitle=testTitle.trim().replace(/\s+/g," ");
  if(cleanTitle.length<3){alert("Test Title must contain at least 3 characters.");document.getElementById("titleInput")?.focus();return;}
  if(cleanTitle.length>120){alert("Test Title must not exceed 120 characters.");document.getElementById("titleInput")?.focus();return;}
  testTitle=cleanTitle;
  const normalizedTitle=testTitle.toLowerCase();
  const duplicate=tests.some(t=>String(t.title||"").trim().replace(/\s+/g," ").toLowerCase()===normalizedTitle);
  if(duplicate){
    alert(`A mock test named "${testTitle}" already exists.Please enter a different Test Title.`);
    const titleBox=document.getElementById("titleInput");
    if(titleBox){titleBox.focus();titleBox.select();}
    return;
  }

  const accessType=document.getElementById("accessTypeInput")?.value === "free" ? "free" : "paid";
  const t=makeTest(testTitle.trim().replace(/\s+/g," "), questions.slice(), durationMinutes, marksPerCorrect, negativeMarks, accessType);
  t.is_published=false;
  try{
    if(supabaseClient){
      await saveTestToSupabase(t);
    }
    tests.push(t);saveTests();activeTestId=t.id;renderLibrary();renderStudentDashboard();
    document.getElementById("fileStatus").innerHTML='<span style="color:#087443;font-weight:700">✓ Test saved to Supabase.</span>';
  }catch(e){
    alert("Test could not be saved to Supabase: "+supaError("test save",e));
  }
}

/* V1.5: CSV parsing/validation is owned by the single shared loader in
   mission-tes-v13-clean-controller below. */
function updateHome(){
  const sub=document.getElementById("testSubtitle");
  if(sub) sub.textContent="Mock Test Platform";
}
document.getElementById("csvFile").addEventListener("change", function(){
  if(!requireAdmin("CSV import")){ this.value=""; return; }
  const file=this.files[0]; if(!file)return;
  const status=document.getElementById("fileStatus");
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const result=window.loadCSV(reader.result);
      questions.length=0; result.parsed.forEach(q=>questions.push(q));
      csvLoaded=true;
      status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded. Click SAVE AS MOCK TEST to add it to the library.</span>`+
        (result.skipped?` <span style="color:#b45309">${result.skipped} invalid row(s) skipped.</span>`:"");
      renderCSVPreview();
      updateHome();
    }catch(e){
      document.getElementById("csvPreviewPanel")?.classList.add("hidden");
      status.innerHTML=`<span style="color:#b42318">✗ ${e.message}</span>`;
    }
  };
  reader.onerror=()=>status.innerHTML='<span style="color:#b42318">✗ Could not read the file.</span>';
  reader.readAsText(file);
});

function loadPastedCSV(){
  if(!requireAdmin("CSV import")) return;
  const text=document.getElementById("csvPaste").value.trim();
  const status=document.getElementById("pasteStatus");
  if(!text){status.innerHTML='<span style="color:#b42318">✗ Paste CSV data first.</span>';return}
  try{
    const result=window.loadCSV(text);
    questions.length=0;
    result.parsed.forEach(q=>questions.push(q));
    csvLoaded=true;
    status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded. Click SAVE AS MOCK TEST to add it to the library.</span>`+
      (result.skipped?` <span style="color:#b45309">${result.skipped} invalid row(s) skipped.</span>`:"");
    document.getElementById("fileStatus").textContent="Pasted CSV is active.";
    renderCSVPreview();
    updateHome();
  }catch(e){
    status.innerHTML=`<span style="color:#b42318">✗ ${e.message}</span>`;
  }
}
function clearPastedCSV(){
  if(!requireAdmin("CSV management")) return;
  document.getElementById("csvPaste").value="";
  document.getElementById("pasteStatus").textContent="";
  document.getElementById("csvPreviewPanel")?.classList.add("hidden");
  document.getElementById("csvPreviewList").textContent="";
}

function renderCSVPreview(){
  const panel=document.getElementById("csvPreviewPanel");
  const list=document.getElementById("csvPreviewList");
  const count=document.getElementById("csvPreviewCount");
  if(!panel||!list||!count)return;
  list.textContent="";
  count.textContent=`${questions.length} question${questions.length===1?"":"s"}`;
  if(!questions.length){panel.classList.add("hidden");return;}
  questions.forEach((q,index)=>{
    const card=document.createElement("div");
    card.style.cssText="background:#fff;border:1px solid #dbe4ef;border-radius:9px;padding:12px;margin-top:9px";
    const head=document.createElement("div");
    head.style.cssText="font-weight:800;color:#12345b;margin-bottom:8px";
    head.textContent=`Q${index+1}. ${q[0]}`;
    card.appendChild(head);
    for(let i=1;i<=4;i++){
      const opt=document.createElement("div");
      opt.style.cssText=`padding:6px 8px;margin:4px 0;border-radius:6px;${i===q[5]?"background:#e9f8ef;color:#087443;font-weight:700;border:1px solid #9ad7b0":"background:#f8fafc"}`;
      opt.textContent=`${String.fromCharCode(64+i)}. ${q[i]}${i===q[5]?"  ✓ CORRECT":""}`;
      card.appendChild(opt);
    }
    const exp=document.createElement("div");
    exp.style.cssText="margin-top:9px;padding:9px;background:#f1f5f9;border-left:3px solid #12345b;border-radius:5px;font-size:12px;line-height:1.5";
    exp.textContent=q[6]?`Explanation: ${q[6]}`:"Explanation: No explanation provided.";
    card.appendChild(exp);
    list.appendChild(card);
  });
  panel.classList.remove("hidden");
}

function downloadSampleCSV(){
  if(!requireAdmin("CSV tools")) return;
  const rows=[["Question","Option 1","Option 2","Option 3","Option 4","Correct Option","Explanation"],...questions];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="TES_Mock_Test_Sample.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function applySettings(){
  testTitle=document.getElementById("titleInput").value.trim()||"TES Mock Test";
  durationMinutes=Math.max(1,Number(document.getElementById("durationInput").value)||10);
  marksPerCorrect=Math.max(0,Number(document.getElementById("marksInput").value)||1);
  negativeMarks=Math.max(0,Number(document.getElementById("negativeInput").value)||0);
  timer=Math.round(durationMinutes*60);
  updateHome();
}


let current=0, answers=Array(questions.length).fill(null), timer=600, interval=null, submitted=false;
let adminPreviewMode=false;
let testLaunchToken=0;


function openTestInstructions(){
  /* Legacy/manual entry point retained for compatibility. */
  applySettings();
  if(!questions.length){
    alert("No valid questions available.");
    return;
  }
  var modal=document.getElementById("testInstructionsModal");
  if(!modal)return;
  populateTestInstructions({
    title:(window.currentTestTitle||window.selectedTestTitle||testTitle||document.title||"Mock Test"),
    questionCount:questions.length,
    duration:durationMinutes,
    marks:marksPerCorrect,
    negative:negativeMarks
  });
  window.pendingInstructionLaunch=null;
  resetInstructionReadyState();
  modal.classList.remove("hidden");
}

function populateTestInstructions(info){
  var qCount=Math.max(0,Number(info.questionCount)||0);
  var mins=Math.max(0,Number(info.duration)||0);
  var positive=Math.max(0,Number(info.marks)||0);
  var negative=Math.max(0,Number(info.negative)||0);
  var total=qCount*positive;
  var set=(id,value)=>{var el=document.getElementById(id);if(el)el.textContent=value;};
  set("instructionTestName",info.title||"Mock Test");
  set("instructionQuestions",qCount);
  set("instructionTotalMarks",Number(total).toFixed(2));
  set("instructionDuration",mins+" min");
  set("instructionPositiveMarks","+"+Number(positive).toFixed(2));
  set("instructionNegativeMarks",negative>0?"-"+Number(negative).toFixed(2):"0");
}
function resetInstructionReadyState(){
  var cb=document.getElementById("testReadyCheckbox");
  var btn=document.getElementById("beginTestButton");
  if(cb)cb.checked=false;
  if(btn)btn.disabled=true;
}
function toggleTestReady(){
  var cb=document.getElementById("testReadyCheckbox");
  var btn=document.getElementById("beginTestButton");
  if(cb&&btn)btn.disabled=!cb.checked;
}
function closeTestInstructions(){
  var modal=document.getElementById("testInstructionsModal");
  if(modal)modal.classList.add("hidden");
  resetInstructionReadyState();
  window.pendingInstructionLaunch=null;
}
function confirmAndStartTest(){
  var cb=document.getElementById("testReadyCheckbox");
  if(!cb||!cb.checked)return;
  var language=document.getElementById("testLanguageSelect");
  window.selectedTestLanguage=language?language.value:"english";
  var pending=window.pendingInstructionLaunch;
  closeTestInstructions();
  if(pending && typeof pending.start==='function'){
    pending.start();
    return;
  }
  startTest();
}

function startSavedTest(id){
 const t=tests.find(x=>x.id===id);
 if(!t)return;

 const launchToken=++testLaunchToken;
 clearInterval(interval);
 interval=null;

 adminPreviewMode=(adminLoggedIn===true && currentStudent===null);
 activeTestId=id;
 questions.length=0;
 t.questions.forEach(q=>questions.push(q));

 testTitle=t.title;
 durationMinutes=Number(t.duration)||10;
 marksPerCorrect=Number(t.marks)||1;
 negativeMarks=Math.max(0,Number(t.negative)||0);
 timer=Math.round(durationMinutes*60);
 current=0;
 answers=Array(questions.length).fill(null);
 submitted=false;
 currentAttemptId=null;
 currentAttemptCreatePromise=null;
 currentAttemptLaunchToken=launchToken;
 pendingAnswers=Array(questions.length).fill(null);
 marked=Array(questions.length).fill(false);
 visited=Array(questions.length).fill(false);

 if(!questions.length){
   alert("This test has no valid questions.");
   return;
 }

 populateTestInstructions({
   title:t.title,
   questionCount:questions.length,
   duration:durationMinutes,
   marks:marksPerCorrect,
   negative:negativeMarks
 });

 var modal=document.getElementById("testInstructionsModal");
 if(!modal){
   /* Safe fallback if the instruction markup is ever removed. */
   beginSavedTestAfterInstructions(launchToken);
   return;
 }

 window.pendingInstructionLaunch={
   id:id,
   start:function(){beginSavedTestAfterInstructions(launchToken);}
 };
 resetInstructionReadyState();
 modal.classList.remove("hidden");
}

function beginSavedTestAfterInstructions(launchToken){
 if(launchToken!==testLaunchToken)return;
 showTestCountdown(testTitle, ()=>{
   if(launchToken!==testLaunchToken)return;
   try{
     const home=document.getElementById("home");
     const exam=document.getElementById("exam");
     const headerTimer=document.getElementById("headerTimer");
     const previewExit=document.getElementById("adminPreviewExit");
     const overlay=document.getElementById("testCountdownOverlay");

     overlay?.classList.add("hidden");
     if(overlay) overlay.style.display="none";
     home?.classList.add("hidden");
     exam?.classList.remove("hidden");
     if(exam) exam.style.display="block";
     headerTimer?.classList.remove("hidden");
     previewExit?.classList.toggle("hidden",!adminPreviewMode);

     examStartedAt=Date.now();
     examStartedPerf=(typeof performance!="undefined"?performance.now():null);
     timer=Math.round(durationMinutes*60);
     current=0;
     answers=Array(questions.length).fill(null);
     pendingAnswers=Array(questions.length).fill(null);
     marked=Array(questions.length).fill(false);
     visited=Array(questions.length).fill(false);
     submitted=false;
     currentAttemptId=null;
     currentAttemptLaunchToken=launchToken;
     currentAttemptCreatePromise=null;
     window.__missionTESLastStartedQuestions = questions.map(q=>Array.isArray(q)?q.slice():q);
     render();
     updateTimer();
     clearInterval(interval);
     interval=setInterval(tick,1000);

     if(!adminPreviewMode && supabaseClient && currentStudent){
       const launchForAttempt=launchToken;
       currentAttemptCreatePromise=createAttemptInSupabase(activeTestId,questions.length)
         .then(attemptId=>{
           if(launchForAttempt===testLaunchToken && !submitted && currentStudent){
             currentAttemptId=attemptId;
           }
           return attemptId;
         });
       currentAttemptCreatePromise.catch(e=>{
         console.error("Attempt creation failed:",e);
       });
     }
   }catch(e){
     console.error("Test launch error:",e);
     document.getElementById("testCountdownOverlay")?.classList.add("hidden");
     document.getElementById("testCountdownOverlay")?.style.setProperty("display","none");
     alert("The test could not be opened. Please refresh the page and try again.");
   }
 });
}

function startTest(){
  examStartedAt=Date.now();
  examStartedPerf=(typeof performance!="undefined"?performance.now():null);


 applySettings();
 if(!questions.length){alert("No valid questions available.");return}
 clearInterval(interval);
 interval=null;
 current=0; answers=Array(questions.length).fill(null); pendingAnswers=Array(questions.length).fill(null); marked=Array(questions.length).fill(false); visited=Array(questions.length).fill(false); submitted=false; timer=Math.round(durationMinutes*60);
 document.getElementById("home").classList.add("hidden");
 document.getElementById("exam").classList.remove("hidden");
 document.getElementById("headerTimer").classList.remove("hidden");
 render();
 interval=setInterval(tick,1000);
}
function tick(){
 if(timer<=0){clearInterval(interval);submitTest(true);return}
 timer--;
 updateTimer();
}
function updateTimer(){
 let m=Math.floor(timer/60),s=timer%60;
 let t=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
 document.getElementById("examTimer").textContent=t;
 document.getElementById("headerTimer").textContent=t;
}
function render(){
 const q=questions[current];
 if(!q)return;
 if(!Array.isArray(marked) || marked.length!==questions.length) marked=Array(questions.length).fill(false);
 if(!Array.isArray(visited) || visited.length!==questions.length) visited=Array(questions.length).fill(false);
 if(!Array.isArray(pendingAnswers) || pendingAnswers.length!==questions.length) pendingAnswers=Array(questions.length).fill(null);
 visited[current]=true;

 const qno=document.getElementById("questionNo");
 const meta=document.getElementById("examMeta");
 const text=document.getElementById("questionText");
 const box=document.getElementById("options");
 if(qno)qno.textContent=`Question ${current+1} of ${questions.length}`;
 if(meta)meta.textContent=`Question ${current+1} / ${questions.length}`;
 if(text)text.textContent=q[0];

 /* A selected option is only a draft until Save & Next / Mark for Review. */
 const draft=pendingAnswers[current];
 if(box){
   box.innerHTML="";
   for(let i=1;i<=4;i++){
     const b=document.createElement("button");
     b.type="button";
     b.className="option"+(draft===i?" selected":"");
     b.textContent=`${String.fromCharCode(64+i)}. ${q[i]}`;
     b.onclick=()=>{
       if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(1000);
       pendingAnswers[current]=i;
       render();
     };
     box.appendChild(b);
   }
 }
 const bar=document.getElementById("bar");
 if(bar)bar.style.width=((current+1)/questions.length*100)+"%";

 const pal=document.getElementById("palette");
 if(pal){
   pal.innerHTML="";
   questions.forEach((_,i)=>{
     const b=document.createElement("button");
     b.type="button";
     const hasAnswer=answers[i]!==null&&answers[i]!==undefined&&answers[i]!=="";
     const isMarked=!!marked[i];
     const wasVisited=!!visited[i];
     b.className="ui21-palette-btn";
     if(i===current)b.classList.add("current");
     let paletteStatus;
     if(hasAnswer&&isMarked){b.classList.add("marked-answered");paletteStatus="marked-answered";}
     else if(isMarked){b.classList.add("marked");paletteStatus="marked";}
     else if(hasAnswer){b.classList.add("answered");paletteStatus="answered";}
     else if(wasVisited){b.classList.add("not-answered");paletteStatus="not-answered";}
     else {b.classList.add("not-visited");paletteStatus="not-visited";}
     b.dataset.status=paletteStatus;
     b.textContent=String(i+1)+(hasAnswer&&isMarked?" ✓":"");
     b.setAttribute("aria-label",`Question ${i+1}: ${hasAnswer&&isMarked?"Answered and marked for review":isMarked?"Marked for review":hasAnswer?"Answered":wasVisited?"Not answered":"Not visited"}`);
     b.onclick=()=>{
       if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(1000);
       current=i;render();
     };
     pal.appendChild(b);
   });
 }
 const review=document.getElementById("ui21MarkReview");
 if(review)review.classList.toggle("active",!!marked[current]);
}

function prevQ(){
  if(window.MISSION_TES_ExamIntegrity) window.MISSION_TES_ExamIntegrity.markInternalInteraction(1400);
  if(current>0){current--;render()}
}
function nextQ(){
  if(window.MISSION_TES_ExamIntegrity && window.MISSION_TES_ExamIntegrity.markInternalInteraction){
    window.MISSION_TES_ExamIntegrity.markInternalInteraction(2000);
  }
  /* Legacy Next button now follows CBT Save & Next semantics. */
  if(!Array.isArray(answers)) answers=Array(questions.length).fill(null);
  if(!Array.isArray(pendingAnswers)) pendingAnswers=Array(questions.length).fill(null);
  answers[current]=pendingAnswers[current] ?? null;
  marked[current]=false;
  if(current<questions.length-1){current++;render();}else{render();}
}

function renderResultReview(){
  const snap=window.__missionTESReviewSnapshot||{};
  let rawQs=Array.isArray(snap.questions)&&snap.questions.length?snap.questions:null;

  if(!rawQs && Array.isArray(window.__missionTESLastStartedQuestions)&&window.__missionTESLastStartedQuestions.length){
    rawQs=window.__missionTESLastStartedQuestions;
  }
  if(!rawQs && Array.isArray(tests)){
    const active=tests.find(t=>String(t.id)===String(activeTestId));
    if(active && Array.isArray(active.questions)&&active.questions.length) rawQs=active.questions;
  }
  if(!rawQs && Array.isArray(questions)&&questions.length) rawQs=questions;
  if(!rawQs) rawQs=[];

  const normalize=(q)=>{
    if(Array.isArray(q)){
      const a=q.slice(0,7);
      while(a.length<7)a.push("");
      let c=String(a[5]??"").trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4};
      if(map[c])a[5]=map[c];
      else if(Number.isFinite(Number(c)))a[5]=Number(c);
      return a;
    }
    if(q && typeof q==="object"){
      let c=String(q.correct_option??q.correct??q.answer??"").trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4};
      return [
        q.question_text??q.question??q.text??"",
        q.option_1??q.option1??"",
        q.option_2??q.option2??"",
        q.option_3??q.option3??"",
        q.option_4??q.option4??"",
        map[c]??(Number.isFinite(Number(c))?Number(c):0),
        q.explanation??""
      ];
    }
    return null;
  };

  const qs=rawQs.map(normalize).filter(q=>q);
  if(!qs.length)return;

  let reviewAnswers=Array.isArray(snap.answers)?snap.answers:
                     (Array.isArray(answers)?answers:[]);
  reviewCurrent=Math.max(0,Math.min(Number(reviewCurrent)||0,qs.length-1));

  const q=qs[reviewCurrent];
  const rawAnswer=reviewCurrent<reviewAnswers.length?reviewAnswers[reviewCurrent]:null;
  const answer=(rawAnswer===null||rawAnswer===undefined||rawAnswer==="")?null:Number(rawAnswer);
  const correct=Number(q[5])||0;

  const no=document.getElementById("reviewQuestionNo");
  const text=document.getElementById("reviewQuestionText");
  const box=document.getElementById("reviewOptions");

  if(no){
    no.textContent="Question "+(reviewCurrent+1)+" of "+qs.length;
    no.hidden=false;
    no.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
  }
  if(text){
    text.textContent=String(q[0]??"");
    text.hidden=false;
    text.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
  }

  if(box){
    box.innerHTML="";
    box.hidden=false;
    box.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
    for(let i=1;i<=4;i++){
      const row=document.createElement("div");
      row.className="reviewOption";
      if(i===correct)row.classList.add("reviewCorrect");
      if(answer===i && answer!==correct)row.classList.add("reviewWrong");
      if(answer===i && answer===correct)row.classList.add("reviewYourCorrect");

      const label=document.createElement("span");
      label.textContent=String.fromCharCode(64+i)+". "+String(q[i]??"");
      row.appendChild(label);

      if(i===correct || answer===i){
        const tag=document.createElement("span");
        tag.className="reviewTag";
        tag.textContent=i===correct?(answer===i?"✓ CORRECT":"✓ CORRECT ANSWER"):"✕ WRONG";
        row.appendChild(tag);
      }
      box.appendChild(row);
    }
  }

  const status=document.getElementById("reviewStatus");
  if(status){
    status.hidden=false;
    if(answer===null){
      status.textContent="⚪ NOT ANSWERED • Correct answer: "+(correct?String.fromCharCode(64+correct):"—")+". "+String(correct?q[correct]??"":"");
      status.style.color="#64748b";
    }else if(answer===correct){
      status.textContent="✓ CORRECT — Your answer is correct.";
      status.style.color="#087443";
    }else{
      status.textContent="✕ WRONG — Your answer was incorrect. Correct answer: "+(correct?String.fromCharCode(64+correct):"—")+". "+String(correct?q[correct]??"":"");
      status.style.color="#b42318";
    }
    status.style.cssText+=";display:block!important;visibility:visible!important;";
  }

  const explanation=document.getElementById("reviewExplanation");
  if(explanation){
    explanation.hidden=false;
    explanation.innerHTML=q[6]?("<b>Explanation:</b> "+escapeHTML(String(q[6]))):"";
    explanation.style.cssText+=";display:block!important;visibility:visible!important;";
  }

  const pal=document.getElementById("reviewPalette");
  if(pal){
    pal.innerHTML="";
    qs.forEach((q2,i)=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="reviewPbtn";
      const aa=i<reviewAnswers.length?reviewAnswers[i]:null;
      if(i===reviewCurrent)b.classList.add("current");
      if(aa===null||aa===undefined||aa==="")b.classList.add("skippedQ");
      else if(Number(aa)===Number(q2[5]))b.classList.add("correctQ");
      else b.classList.add("wrongQ");
      b.textContent=i+1;
      b.onclick=()=>{reviewCurrent=i;renderResultReview();};
      pal.appendChild(b);
    });
  }
}


function forceRenderSubmittedQuestionReview(){
  try{
    // V2.0.1 robust renderer: the review must render from the submitted snapshot,
    // even when the dashboard/test arrays have been replaced or the page was reloaded.
    let snap=window.__missionTESReviewSnapshot||{};
    const parseArray=(v)=>{
      if(Array.isArray(v)) return v;
      if(typeof v==='string'){
        try{ const x=JSON.parse(v); return Array.isArray(x)?x:[]; }catch(e){ return []; }
      }
      return [];
    };
    let qs=parseArray(snap.questions);
    let ans=parseArray(snap.answers);

    // Historical attempt cache fallback.
    if(!qs.length && window.__missionTESHistoricalAttempt){
      qs=parseArray(window.__missionTESHistoricalAttempt.questions);
      if(!ans.length) ans=parseArray(window.__missionTESHistoricalAttempt.answers);
    }

    // Current submission fallback.
    if(!qs.length) qs=parseArray(window.__missionTESLastStartedQuestions);
    if(!ans.length) ans=parseArray(window.answers);

    // Test cache fallback — important after refresh / navigation.
    if(!qs.length){
      try{
        const cached=JSON.parse(localStorage.getItem('missionTES_tests_cache')||'[]');
        const list=Array.isArray(cached)?cached:[];
        const t=list.find(x=>String(x.id)===String(snap.testId||activeTestId)) ||
                  list.find(x=>String(x.title||'')===String(snap.testTitle||testTitle||''));
        if(t && Array.isArray(t.questions)) qs=t.questions;
      }catch(e){}
    }
    if(!qs.length && Array.isArray(tests)){
      const t=tests.find(x=>String(x.id)===String(snap.testId||activeTestId)) ||
              tests.find(x=>String(x.title||'')===String(snap.testTitle||testTitle||''));
      if(t && Array.isArray(t.questions)) qs=t.questions;
    }
    if(!qs.length && Array.isArray(questions)) qs=questions;

    const normalizeOption=(v)=>{
      if(v===null||v===undefined||v==='') return 0;
      const x=String(v).trim().toUpperCase();
      if(x==='A')return 1;if(x==='B')return 2;if(x==='C')return 3;if(x==='D')return 4;
      const n=Number(v);return Number.isFinite(n)&&n>=1&&n<=4?n:0;
    };
    const normalizeQuestion=(q)=>{
      if(Array.isArray(q)){
        const a=q.slice(0,7); while(a.length<7)a.push('');
        a[5]=normalizeOption(a[5]); return a;
      }
      if(q && typeof q==='object'){
        return [
          q.question_text??q.question??q.text??'',
          q.option_1??q.option1??'', q.option_2??q.option2??'',
          q.option_3??q.option3??'', q.option_4??q.option4??'',
          normalizeOption(q.correct_option??q.correct??q.answer),
          q.explanation??''
        ];
      }
      return null;
    };
    qs=qs.map(normalizeQuestion).filter(q=>q && String(q[0]||'').trim());
    if(!qs.length){
      console.warn('MISSION TES: Answer Review has no question data', {snapshot:snap, historical:window.__missionTESHistoricalAttempt});
      return false;
    }

    window.__missionTESReviewSnapshot={...snap,questions:qs,answers:ans.slice(),testId:snap.testId||activeTestId,testTitle:snap.testTitle||testTitle||'Mock Test'};

    const idx=Math.max(0,Math.min(Number(window.reviewCurrent ?? reviewCurrent)||0,qs.length-1));
    reviewCurrent=idx;
    window.reviewCurrent=idx;
    const q=qs[idx], correct=normalizeOption(q[5]);
    const rawAns=idx<ans.length?ans[idx]:null;
    const student=normalizeOption(rawAns)||null;

    const no=document.getElementById('reviewQuestionNo');
    const qt=document.getElementById('reviewQuestionText');
    const opts=document.getElementById('reviewOptions');
    const status=document.getElementById('reviewStatus');
    const expl=document.getElementById('reviewExplanation');
    const pal=document.getElementById('reviewPalette');

    if(no){no.textContent=`Question ${idx+1} of ${qs.length}`;no.hidden=false;no.style.setProperty('display','block','important');}
    if(qt){qt.textContent=String(q[0]||'');qt.hidden=false;qt.style.setProperty('display','block','important');}

    if(opts){
      opts.innerHTML=''; opts.hidden=false; opts.style.setProperty('display','block','important');
      for(let i=1;i<=4;i++){
        const row=document.createElement('div'); row.className='reviewOption';
        const isCorrect=i===correct, isStudent=student===i;
        if(isCorrect&&isStudent)row.classList.add('reviewYourCorrect');
        else if(isCorrect)row.classList.add('reviewCorrect');
        else if(isStudent)row.classList.add('reviewWrong');
        const label=document.createElement('span'); label.textContent=String.fromCharCode(64+i)+'. '+String(q[i]??''); row.appendChild(label);
        if(isCorrect||isStudent){const tag=document.createElement('span');tag.className='reviewTag';tag.textContent=(isCorrect&&isStudent)?'✓ CORRECT':(isCorrect?'✓ CORRECT ANSWER':'✕ WRONG');row.appendChild(tag);}
        opts.appendChild(row);
      }
    }
    if(status){
      status.hidden=false; status.style.setProperty('display','block','important');
      if(!student){status.textContent=`⚪ NOT ANSWERED • Correct answer: ${correct?String.fromCharCode(64+correct):'—'}`;status.style.color='#64748b';}
      else if(student===correct){status.textContent='✓ CORRECT — Your answer is correct.';status.style.color='#087443';}
      else{status.textContent=`✕ WRONG — Your answer was incorrect. Correct answer: ${correct?String.fromCharCode(64+correct):'—'}`;status.style.color='#b42318';}
    }
    if(expl){const e=String(q[6]||'');expl.textContent=e?'Explanation: '+e:'';expl.style.setProperty('display',e?'block':'none','important');}
    if(pal){
      pal.innerHTML='';pal.style.setProperty('display','grid','important');
      qs.forEach((q2,i)=>{const b=document.createElement('button');b.type='button';b.className='reviewPbtn';const a=normalizeOption(ans[i])||null,c=normalizeOption(q2[5]);if(i===idx)b.classList.add('current');if(!a)b.classList.add('skippedQ');else if(a===c)b.classList.add('correctQ');else b.classList.add('wrongQ');b.textContent=String(i+1);b.onclick=()=>{reviewCurrent=i;window.reviewCurrent=i;forceRenderSubmittedQuestionReview();};pal.appendChild(b);});
    }
    return true;
  }catch(err){console.error('MISSION TES result review render failed:',err);return false;}
}
function previousReviewQuestion(){
  // Historical review navigation must keep the shared/window index in sync.
  // The renderer reads window.reviewCurrent, so changing only the local
  // variable causes navigation to jump back to Question 1.
  const snap=window.__missionTESReviewSnapshot||{};
  const total=(snap&&Array.isArray(snap.questions))
    ? snap.questions.length
    : (Array.isArray(questions)?questions.length:0);
  reviewCurrent=Math.max(0, Math.min(Number(reviewCurrent)||0, Math.max(0,total-1)));
  if(reviewCurrent>0){
    reviewCurrent--;
    window.reviewCurrent=reviewCurrent;
    forceRenderSubmittedQuestionReview();
  }
}
function nextReviewQuestion(){
  // Keep both references synchronized before rendering the new question.
  const snap=window.__missionTESReviewSnapshot||{};
  const total=(snap&&Array.isArray(snap.questions))
    ? snap.questions.length
    : (Array.isArray(questions)?questions.length:0);
  reviewCurrent=Math.max(0, Math.min(Number(reviewCurrent)||0, Math.max(0,total-1)));
  if(reviewCurrent<total-1){
    reviewCurrent++;
    window.reviewCurrent=reviewCurrent;
    forceRenderSubmittedQuestionReview();
  }
}
function returnToStudentDashboard(){
  if(typeof closeMissionSubmitConfirmation==="function") closeMissionSubmitConfirmation();
  if(!currentStudent){
    setAuthScreenVisible(true);
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    return;
  }
  adminLoggedIn=false;
  adminPreviewMode=false;
  document.body.classList.remove("admin-ui");
  document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
  clearInterval(interval);
  interval=null;
  currentAttemptId=null;
  currentAttemptCreatePromise=null;
  currentAttemptLaunchToken=0;
  activeTestId=null;
  window.__missionTESReviewSnapshot=null;
  adminPreviewMode=false;
  document.getElementById("exam").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
  document.getElementById("headerTimer").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
  showDashboardTab("student");
  renderStudentDashboard();
}
function formatElapsedTime(totalSeconds){
  var s=Math.max(0,Number(totalSeconds)||0);
  var h=Math.floor(s/3600);
  var m=Math.floor((s%3600)/60);
  var sec=s%60;
  if(h>0) return h+"h "+String(m).padStart(2,"0")+"m "+String(sec).padStart(2,"0")+"s";
  return m+"m "+String(sec).padStart(2,"0")+"s";
}

function populateResultMetrics(marks, maxMarksValue, correctValue, wrongValue, skippedValue, timeSeconds){
  var marksEl=document.getElementById("resultMarksInfo");
  var correctEl=document.getElementById("resultCorrectInfo");
  var wrongEl=document.getElementById("resultWrongInfo");
  var skippedEl=document.getElementById("resultSkippedInfo");
  var timeEl=document.getElementById("resultTimeInfo");
  if(marksEl)marksEl.textContent=(Number.isFinite(Number(marks))?Number(marks).toFixed(2):"0.00")+" / "+(Number.isFinite(Number(maxMarksValue))?Number(maxMarksValue).toFixed(2):"0.00");
  if(correctEl)correctEl.textContent=String(Number.isFinite(Number(correctValue))?Number(correctValue):0);
  if(wrongEl)wrongEl.textContent=String(Number.isFinite(Number(wrongValue))?Number(wrongValue):0);
  if(skippedEl)skippedEl.textContent=String(Number.isFinite(Number(skippedValue))?Number(skippedValue):0);
  if(timeEl)timeEl.textContent=formatElapsedTime(Number.isFinite(Number(timeSeconds))?Number(timeSeconds):0);
}


function openMissionSubmitConfirmation(){
  const overlay=document.getElementById("missionSubmitConfirm");
  if(!overlay)return;
  let answered=0, review=0, visited=0;
  if(Array.isArray(answers)){
    answered=answers.filter(a=>a!==null&&a!==undefined).length;
  }
  if(typeof questionStatus!=="undefined" && Array.isArray(questionStatus)){
    review=questionStatus.filter(s=>s==="review"||s==="marked"||s==="marked_review").length;
    visited=questionStatus.filter(s=>s==="visited"||s==="answered"||s==="review"||s==="marked"||s==="marked_review").length;
  }else if(typeof visitedQuestions!=="undefined" && Array.isArray(visitedQuestions)){
    visited=visitedQuestions.filter(Boolean).length;
  }else{
    // A question with a selected answer is necessarily visited.
    visited=answered;
  }
  const total=Array.isArray(questions)?questions.length:0;
  const notAnswered=Math.max(0,total-answered);
  const notVisited=Math.max(0,total-visited);

  const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=String(value)};
  set("submitSummaryTotal",total);
  set("submitSummaryAnswered",answered);
  set("submitSummaryNotAnswered",notAnswered);
  set("submitSummaryReview",review);
  set("submitSummaryNotVisited",notVisited);

  if(overlay.parentElement!==document.body) document.body.appendChild(overlay);
  overlay.classList.add("show");
  overlay.style.setProperty("display","flex","important");
  overlay.style.setProperty("visibility","visible","important");
  overlay.style.setProperty("opacity","1","important");
  overlay.style.setProperty("pointer-events","auto","important");
  overlay.setAttribute("aria-hidden","false");
  document.body.classList.add("mission-submit-open");
}

function closeMissionSubmitConfirmation(){
  const overlay=document.getElementById("missionSubmitConfirm");
  if(!overlay)return;
  overlay.classList.remove("show");
  overlay.style.setProperty("display","none","important");
  overlay.setAttribute("aria-hidden","true");
  document.body.classList.remove("mission-submit-open");
}

function confirmMissionSubmit(){
  closeMissionSubmitConfirmation();
  submitTest(true);
}

(function bindMissionSubmitConfirmation(){
  const ready=()=>{
    const close=document.getElementById("missionSubmitClose");
    const closeX=document.getElementById("missionSubmitCloseX");
    const confirm=document.getElementById("missionSubmitConfirmBtn");
    const overlay=document.getElementById("missionSubmitConfirm");
    if(!close||!confirm||!overlay){
      setTimeout(ready,50);
      return;
    }
    close.onclick=closeMissionSubmitConfirmation;
    if(closeX)closeX.onclick=closeMissionSubmitConfirmation;
    confirm.onclick=confirmMissionSubmit;
    overlay.addEventListener("click",function(e){
      if(e.target===overlay) closeMissionSubmitConfirmation();
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape" && overlay.classList.contains("show")){
        closeMissionSubmitConfirmation();
      }
    });
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);
  else ready();
})();
async function submitTest(forceSubmit=false){
 if(submitted)return;
 if(!forceSubmit){
   openMissionSubmitConfirmation();
   return;
 }
 submitted=true;clearInterval(interval);
 // Preserve the exact questions/answers from the live exam for Answer Review.
 // This prevents the result renderer from depending on later dashboard/result
 // state changes.
 window.__missionTESReviewSnapshot = {
   questions: Array.isArray(questions) && questions.length
     ? questions.map(q=>Array.isArray(q)?q.slice():q)
     : (Array.isArray(window.__missionTESLastStartedQuestions)
        ? window.__missionTESLastStartedQuestions.map(q=>Array.isArray(q)?q.slice():q) : []),
   answers: Array.isArray(answers) ? answers.slice() : []
 };
 window.__missionTESReviewSnapshot.testTitle = testTitle;
 let correct=0,wrong=0,skipped=0;
 questions.forEach((q,i)=>{
   if(answers[i]===null)skipped++;
   else if(answers[i]===q[5])correct++;
   else wrong++;
 });
 let marks=(correct*marksPerCorrect)-(wrong*negativeMarks);
 let maxMarks=questions.length*marksPerCorrect;
 var elapsedSeconds=(typeof durationMinutes==="number" && Number.isFinite(durationMinutes))
  ?Math.max(0,Math.round((durationMinutes*60)-timer))
  :(examStartedAt?Math.max(0,Math.round((Date.now()-examStartedAt)/1000)):0);
  var _resultCorrect=typeof correctCount!=="undefined"?Number(correctCount):
    (typeof correctAnswers!=="undefined"?Number(correctAnswers):
    (typeof correct!=="undefined"?Number(correct):0));
  var _resultWrong=typeof wrongCount!=="undefined"?Number(wrongCount):
    (typeof wrongAnswers!=="undefined"?Number(wrongAnswers):
    (typeof wrong!=="undefined"?Number(wrong):0));
  var _resultMaxMarks=typeof maxMarks!=="undefined"?Number(maxMarks):
    (questions.length*(typeof marksPerCorrect==="number"?marksPerCorrect:1));
  populateResultMetrics(marks, _resultMaxMarks, _resultCorrect, _resultWrong, skipped, elapsedSeconds);

const pct=(maxMarks>0?Math.max(0,marks)/maxMarks*100:0).toFixed(2);
window.__missionTESCurrentElapsedSeconds=elapsedSeconds;

 try{
   /* If the student submits very quickly, wait for the in-progress attempt row
      to be created. This prevents orphaned in_progress attempts and ensures
      the submitted answers are linked to the same unique attempt. */
   if(!adminPreviewMode && currentStudent && !currentAttemptId && currentAttemptCreatePromise){
     try{ currentAttemptId=await currentAttemptCreatePromise; }
     catch(attemptCreateError){ console.warn("Could not finish attempt creation before submit:",attemptCreateError); }
   }
   if(adminPreviewMode){
     // Admin preview is intentionally not an attempt and is not saved as a result.
   }else if(supabaseClient && currentStudent && currentAttemptId){
     const {data:secureResult,error:secureSubmitError}=await supabaseClient.rpc("submit_test_v4",{
       p_attempt_id:currentAttemptId,
       p_answers:answers.map(v=>v===null?null:Number(v)),
       p_elapsed_seconds:elapsedSeconds
     });
     if(secureSubmitError) throw secureSubmitError;
     if(!secureResult || secureResult.ok!==true) throw new Error(secureResult?.error||"Secure submission failed.");
     correct=Number(secureResult.correct||0);
     wrong=Number(secureResult.wrong||0);
     skipped=Number(secureResult.skipped||0);
     marks=Number(secureResult.score||0);
     maxMarks=Number(secureResult.max_score||maxMarks);
     if(Number.isFinite(Number(secureResult.time_taken))) elapsedSeconds=Number(secureResult.time_taken);
     // Always retain a client-side copy of the exact submitted questions/answers for historical review.
     saveHistoricalAttemptDetail(currentAttemptId,{
       questions:Array.isArray(questions)?questions.map(q=>Array.isArray(q)?q.slice():q):[],
       answers:Array.isArray(answers)?answers.slice():[],
       testTitle:testTitle,
       testId:activeTestId||null,
       marksPerCorrect,
       negativeMarks,
       maxMarks
     });
     const fresh=await loadResultsFromSupabase(currentStudent.id);
     // Keep the exact duration from this submission for the current dashboard row.
     if(Array.isArray(fresh) && fresh.length){
       const currentTitle=testTitle;
       const currentTime=elapsedSeconds;
       const currentDate=new Date().toISOString();
       const row=fresh.find(x=>String(x.testId||"")===String(activeTestId||"") || x.title===currentTitle);
       if(row){
         row.timeTaken=currentTime;
         row.submittedAt=currentDate;
         row.date=currentDate;
       }
     }
     // Keep exact submitted questions/answers in the local result cache as well.
     // This makes VIEW ATTEMPT independent of a later Supabase questions/answers read.
     if(Array.isArray(fresh)){
       const cachedRow=fresh.find(x=>String(x.id||'')===String(currentAttemptId));
       if(cachedRow){
         cachedRow.questions=Array.isArray(questions)?questions.map(q=>Array.isArray(q)?q.slice():q):[];
         cachedRow.answers=Array.isArray(answers)?answers.slice():[];
       }
     }
     saveResults(fresh);
   }else{
     const results=getResults();
     results.push({userId:currentStudent?currentStudent.id:null,userName:currentStudent?currentStudent.name:"Student",testId:activeTestId||null,title:testTitle,date:new Date().toISOString(),correct,wrong,skipped,marks,percentage:Number(pct),timeTaken:elapsedSeconds,maxMarks:maxMarks,submittedAt:new Date().toISOString(),questions:Array.isArray(questions)?questions.map(q=>Array.isArray(q)?q.slice():q):[],answers:Array.isArray(answers)?answers.slice():[]});
     saveResults(results);
     saveHistoricalAttemptDetail(activeTestId||("local_"+Date.now()),{questions,answers,testTitle,testId:activeTestId||null,marksPerCorrect,negativeMarks,maxMarks});
   }
 }catch(e){
   console.error(e);
   if(supabaseClient && currentStudent && !adminPreviewMode){
     submitted=false;
     alert("Your result could not be securely saved. Please try submitting again."+supaError("secure submission",e));
     return;
   }
   // Offline/local preview fallback only.
   const results=getResults();
   const fallback={
     userId:currentStudent?currentStudent.id:null,
     userName:currentStudent?currentStudent.name:"Student",
     title:testTitle,
     date:new Date().toISOString(),
     correct,wrong,skipped,
     marks,percentage:Number(pct),
     timeTaken:elapsedSeconds,
     maxMarks,
     submittedAt:new Date().toISOString(),
     testId:activeTestId||null,
     questions:Array.isArray(questions)?questions.map(q=>Array.isArray(q)?q.slice():q):[],
     answers:Array.isArray(answers)?answers.slice():[]
   };
   fallback.id=fallback.id || currentAttemptId || ("fallback_"+Date.now());
   results.push(fallback);
   saveResults(results);
   saveHistoricalAttemptDetail(fallback.id,{questions,answers,testTitle,testId:activeTestId||null,marksPerCorrect,negativeMarks,maxMarks});
   console.warn("Result persistence/readback warning:", supaError("result save",e));
 }

 document.getElementById("home").classList.add("hidden"); document.getElementById("exam").classList.add("hidden");
 document.getElementById("headerTimer").classList.add("hidden");
 document.getElementById("result").classList.remove("hidden");
 document.getElementById("resultTitle").textContent=testTitle+" — Result";
 document.getElementById("score").textContent=`${marks.toFixed(2)} / ${maxMarks.toFixed(2)}`;
 document.getElementById("percentage").textContent=`Percentage: ${pct}%`;
 document.getElementById("correct").textContent=correct;
 document.getElementById("wrong").textContent=wrong;
 document.getElementById("skipped").textContent=skipped;
 document.getElementById("finalMarks").textContent=marks.toFixed(2);
document.getElementById("resultMarksInfo").textContent=marks.toFixed(2)+" / "+maxMarks.toFixed(2);
document.getElementById("resultCorrectInfo").textContent=correct;
document.getElementById("resultWrongInfo").textContent=wrong;
document.getElementById("resultSkippedInfo").textContent=skipped;
document.getElementById("resultTimeInfo").textContent=formatElapsedTime(elapsedSeconds);
document.getElementById("reviewSummary").textContent=`${correct} Correct • ${wrong} Wrong • ${skipped} Skipped`;
 reviewCurrent=0;
 forceRenderSubmittedQuestionReview();
 // V2.0.1: the robust renderer is authoritative; do not let the legacy renderer overwrite it.
 requestAnimationFrame(()=>forceRenderSubmittedQuestionReview());
 setTimeout(()=>forceRenderSubmittedQuestionReview(),50);
 setTimeout(()=>forceRenderSubmittedQuestionReview(),250);
 setTimeout(()=>forceRenderSubmittedQuestionReview(),750);
 const resultBack=document.getElementById("resultBackBtn");
if(resultBack){
  resultBack.textContent=adminPreviewMode ? "← RETURN TO ADMIN DASHBOARD" : "← BACK TO DASHBOARD";
  resultBack.onclick=adminPreviewMode ? exitAdminPreview : returnToStudentDashboard;
}
currentAttemptId=null;
currentAttemptCreatePromise=null;
currentAttemptLaunchToken=0;
window.__missionTESCurrentElapsedSeconds=null;
if(window.MISSION_TES_ExamIntegrity) window.MISSION_TES_ExamIntegrity.stop();
}
seedTests();
initSupabase();
updateRegistrationTypeUI();

(async function bootstrapMissionTES(){
  currentStudent=getCurrentStudent();
  // Always establish a visible default login state before any network work.
  try{
    document.getElementById("authScreen")?.classList.remove("hidden");
    document.getElementById("authScreen")?.style.removeProperty("display");
    document.getElementById("home")?.classList.add("hidden");
    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    document.getElementById("exam")?.classList.add("hidden");
    document.getElementById("result")?.classList.add("hidden");
  }catch(e){ console.warn("Initial UI state:",e); }

  // Restore an existing Supabase Admin or Student Auth session after a page refresh.
  try{
    const {data:sessionData}=supabaseClient ? await supabaseClient.auth.getSession() : {data:{session:null}};
    if(sessionData?.session?.user){
      const {data:isAdmin}=await supabaseClient.rpc("is_app_admin");
      if(isAdmin===true){
        adminLoggedIn=true;
        currentStudent=null;
        setAuthScreenVisible(false);
        document.getElementById("home").classList.remove("hidden");
        document.getElementById("studentHeaderLogout").classList.add("hidden");
        document.getElementById("adminHeaderLogout").classList.remove("hidden");
        await showDashboardTab("admin");
        await renderAdminAccount();
        await loadAdminData();
        if(typeof window.hoaEnterAuthenticated === 'function') window.hoaEnterAuthenticated('admin');
        document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
        document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
        document.body.classList.add("admin-ui");
        if(typeof window.showAdminSection==="function") await window.showAdminSection("student");
        return;
      }
    }
  }catch(e){ console.warn("Could not restore Admin session",e); }

  try{
    await loadTestsFromSupabase();
  }catch(e){
    console.warn("Supabase test load failed; using local fallback.",e);
  }

  if(currentStudent){
    try{
      const {data,error}=await supabaseClient.from("students")
        .select("id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type")
        .eq("id",currentStudent.id).maybeSingle();
      if(!error && data){
        currentStudent=studentFromRow(data);
        saveUsers([currentStudent,...getUsers().filter(u=>u.id!==currentStudent.id)]);
      }
    }catch(e){console.warn("Could not refresh student profile.",e)}

    try{
      // V2.1 clean-slate migration also applies when an existing login session is restored.
      await resetPreviousAttemptsForStudent(currentStudent.id);
      const fresh=await loadResultsFromSupabase(currentStudent.id);
      saveResults(fresh);
    }catch(e){console.warn("Could not load attempt history.",e)}

    enterPlatform();
  }else{
    document.getElementById("studentHeaderLogout").classList.add("hidden");
    document.getElementById("adminHeaderLogout").classList.add("hidden");
    document.getElementById("home").classList.add("hidden");
    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    document.getElementById("exam")?.classList.add("hidden");
    document.getElementById("result")?.classList.add("hidden");
    setAuthScreenVisible(true);
    document.getElementById("authScreen")?.classList.remove("hidden");
  }

  updateHome();
  showSupabaseStatus();
  if(typeof window.hoaExitToFrontPage === 'function') window.hoaExitToFrontPage();
})();


/* ===== Original inline script 3 — id: mission-admin-reference-ui-script ===== */

(function(){
  function setupAdminReferenceUI(){
    const home=document.getElementById('home');
    const admin=document.getElementById('adminOnlyDashboard');
    if(!home || !admin || document.getElementById('adminReferenceSidebar')) return;

    const nav=admin.querySelector('.adminSectionNav');
    if(!nav) return;

    /* Build a visual shell only. Existing buttons and IDs are retained. */
    const shell=document.createElement('div');
    shell.className='adminReferenceShell';

    const sidebar=document.createElement('aside');
    sidebar.id='adminReferenceSidebar';
    sidebar.className='adminReferenceSidebar';

    const sourceLogo=admin.querySelector('.brand-logo') || document.querySelector('.brand-logo') || document.querySelector('.mission-logo');
    const logoSrc=sourceLogo ? sourceLogo.getAttribute('src') : '';

    const brand=document.createElement('div');
    brand.className='adminReferenceBrand';
    brand.innerHTML=(logoSrc?'<img src="'+logoSrc+'" alt="HUB OF ASPIRANTS">':'')+
      '<div><div class="adminReferenceBrandTitle">HUB OF<br>ASPIRANTS</div><div class="adminReferenceBrandSub">Admin Portal</div></div>';
    sidebar.appendChild(brand);

    nav.classList.add('adminReferenceNav');
    sidebar.appendChild(nav);

    const bottom=document.createElement('div');
    bottom.className='adminReferenceBottom';
    bottom.innerHTML=(logoSrc?'<div class="adminReferenceAdminCard"><img src="'+logoSrc+'" alt=""><div><div class="adminReferenceAdminTitle">Admin Dashboard</div><div class="adminReferenceAdminSub">Manage students and tests</div></div></div>':'<div class="adminReferenceAdminCard"><div><div class="adminReferenceAdminTitle">Admin Dashboard</div><div class="adminReferenceAdminSub">Manage students and tests</div></div></div>')+
      '<div class="adminReferenceFooter">© HUB OF ASPIRANTS<br>Dream. Prepare. Conquer</div>';
    sidebar.appendChild(bottom);

    const main=document.createElement('div');
    main.className='adminReferenceMain';
    main.appendChild(admin);

    /* The original Admin Dashboard header panel becomes the reference-style top bar. */
    const topbar=admin.querySelector(':scope > .dashPanel');
    if(topbar){
      topbar.classList.add('adminReferenceTopbar');
      const oldLeft=topbar.firstElementChild;
      if(oldLeft){
        const titleWrap=document.createElement('div');
        titleWrap.className='adminReferenceTopbarText';
        titleWrap.innerHTML='<div id="adminReferencePageTitle" class="adminReferenceTopbarTitle">Dashboard</div><div id="adminReferencePageSub" class="adminReferenceTopbarSub">Manage students, mock tests and candidate results</div>';
        oldLeft.replaceWith(titleWrap);
      }
      const actions=document.createElement('div');
      actions.className='adminReferenceTopbarActions';
      const refresh=document.createElement('button');
      refresh.type='button';
      refresh.className='adminReferenceRefreshBtn';
      refresh.textContent='↻  Refresh';
      refresh.onclick=function(){
        const active=nav.querySelector('button.active');
        if(active) active.click();
      };
      actions.appendChild(refresh);
      topbar.appendChild(actions);
    }

    shell.appendChild(sidebar);
    shell.appendChild(main);
    home.appendChild(shell);

    const sectionMeta={
      student:['Dashboard','Manage students and candidate access'],
      test:['Test Making','Create, import and publish mock tests'],
      result:['Result Management','Search, filter, inspect and manage candidate test results'],
      admin:['Admin Section','Manage administrator account and application settings']
    };

    function updatePageHeading(){
      const active=nav.querySelector('button.active');
      const id=active ? active.id : '';
      const key=id==='adminNavTest'?'test':id==='adminNavResult'?'result':id==='adminNavAdmin'?'admin':'student';
      const meta=sectionMeta[key];
      const t=document.getElementById('adminReferencePageTitle');
      const sub=document.getElementById('adminReferencePageSub');
      if(t) t.textContent=meta[0];
      if(sub) sub.textContent=meta[1];
    }

    nav.addEventListener('click',function(){setTimeout(updatePageHeading,0)});
    updatePageHeading();

    /* Add visual-only icons to the four existing nav labels without changing IDs or handlers. */
    const iconMap={adminNavStudent:'⌂',adminNavTest:'▣',adminNavResult:'▤',adminNavAdmin:'⚙'};
    Object.keys(iconMap).forEach(id=>{
      const b=document.getElementById(id);
      if(!b || b.querySelector('.adminRefIcon')) return;
      const text=b.textContent.replace(/^\s*[👥📝📊⚙️]+\s*/,'').trim();
      b.textContent='';
      const i=document.createElement('span');
      i.className='adminRefIcon';
      i.textContent=iconMap[id];
      i.setAttribute('aria-hidden','true');
      const label=document.createElement('span');
      label.className='adminRefLabel';
      label.textContent=text;
      b.appendChild(i);b.appendChild(label);
    });

    function syncMode(){
      const visible=admin && !admin.classList.contains('hidden');
      document.body.classList.toggle('admin-ui',visible);
      if(visible) updatePageHeading();
    }
    const observer=new MutationObserver(syncMode);
    observer.observe(admin,{attributes:true,attributeFilter:['class']});
    syncMode();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupAdminReferenceUI);
  else setupAdminReferenceUI();
})();


/* ===== Original inline script 4 — id: mission-tes-v13-clean-controller ===== */

(function(){
  'use strict';

  /* ---------------------------------------------------------
     Protected helpers/state access
     --------------------------------------------------------- */
  const originalStudentStart = (typeof window.startSavedTest === 'function') ? window.startSavedTest : null;

  function isAdminMode(){
    return (typeof adminLoggedIn !== 'undefined' && adminLoggedIn === true) &&
           (typeof currentStudent !== 'undefined' && currentStudent == null);
  }

  function normalizeQuestion(q){
    if(Array.isArray(q)){
      const a=[q[0]??'',q[1]??'',q[2]??'',q[3]??'',q[4]??'',q[5]??'',q[6]??''];
      const c=String(a[5]).trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4};
      a[5]=map[c] ?? Number(a[5]);
      if(q.__id){try{Object.defineProperty(a,'__id',{value:q.__id,enumerable:false,writable:true});}catch(e){}}
      return a;
    }
    if(q && typeof q==='object'){
      const a=[
        q.question_text ?? q.question ?? q.text ?? '',
        q.option_1 ?? q.option1 ?? '', q.option_2 ?? q.option2 ?? '',
        q.option_3 ?? q.option3 ?? '', q.option_4 ?? q.option4 ?? '',
        q.correct_option ?? q.correct ?? q.answer ?? '', q.explanation ?? ''
      ];
      const c=String(a[5]).trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4};
      a[5]=map[c] ?? Number(a[5]);
      if(q.id){try{Object.defineProperty(a,'__id',{value:q.id,enumerable:false,writable:true});}catch(e){}}
      return a;
    }
    return null;
  }
  function normalizeQuestions(list){
    let raw=list;
    if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(e){raw=[];}}
    return (Array.isArray(raw)?raw:[]).map(normalizeQuestion).filter(q=>q && q[0] && q[1] && q[2] && q[3] && q[4] && [1,2,3,4].includes(Number(q[5])));
  }

  function setExamState(active){
    const body=document.body;
    if(active) body.classList.add('v13-exam-active');
    else body.classList.remove('v13-exam-active');
  }
  function hideExam(){
    const exam=document.getElementById('exam');
    const result=document.getElementById('result');
    const overlay=document.getElementById('testCountdownOverlay');
    if(exam) exam.classList.add('hidden');
    if(result) result.classList.add('hidden');
    if(overlay) overlay.classList.add('hidden');
    document.getElementById('headerTimer')?.classList.add('hidden');
    setExamState(false);
  }

  /* ---------------------------------------------------------
     ONE Admin Test Preview controller
     --------------------------------------------------------- */
  function renderAdminExam(){
    const exam=document.getElementById('exam');
    if(!exam || !Array.isArray(questions) || !questions.length) return false;
    setExamState(true);
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
    document.getElementById('studentOnlyDashboard')?.classList.add('hidden');
    document.getElementById('testCountdownOverlay')?.classList.add('hidden');
    exam.classList.remove('hidden');
    exam.style.display='block';
    exam.style.visibility='visible';
    exam.style.opacity='1';

    current=Math.max(0,Math.min(Number(current)||0,questions.length-1));
    const q=questions[current];
    if(!q) return false;

    const no=document.getElementById('questionNo');
    const meta=document.getElementById('examMeta');
    const text=document.getElementById('questionText');
    const box=document.getElementById('options');
    const bar=document.getElementById('bar');
    const palette=document.getElementById('palette');
    const back=document.getElementById('adminPreviewExit');
    if(no) no.textContent=`Question ${current+1} of ${questions.length}`;
    if(meta) meta.textContent=`Question ${current+1} / ${questions.length}`;
    if(text) text.textContent=String(q[0]??'');
    if(box){
      box.innerHTML='';
      for(let i=1;i<=4;i++){
        const b=document.createElement('button');
        b.type='button'; b.className='option'+(answers[current]===i?' selected':'');
        b.textContent=`${String.fromCharCode(64+i)}. ${String(q[i]??'')}`;
        b.onclick=()=>{answers[current]=i;renderAdminExam();};
        box.appendChild(b);
      }
    }
    if(bar) bar.style.width=((current+1)/questions.length*100)+'%';
    if(palette){
      palette.innerHTML='';
      questions.forEach((_,i)=>{
        const b=document.createElement('button');
        b.type='button'; b.className='pbtn'+(i===current?' current':'')+(answers[i]!==null?' answered':'');
        b.textContent=String(i+1); b.onclick=()=>{current=i;renderAdminExam();};
        palette.appendChild(b);
      });
    }
    if(back){back.classList.remove('hidden');back.classList.add('v13-visible');back.textContent='← BACK TO ADMIN DASHBOARD';}
    return true;
  }

  window.startSavedTest=function(id){
    if(!isAdminMode()) return originalStudentStart ? originalStudentStart(id) : undefined;
    const t=Array.isArray(tests) ? tests.find(x=>String(x.id)===String(id)) : null;
    if(!t){alert('This test could not be found. Please refresh the Test Library.');return;}
    const qs=normalizeQuestions(t.questions);
    if(!qs.length){alert('This test has no valid questions loaded. Please refresh the Test Library or re-import the questions.');return;}

    ++testLaunchToken;
    const token=testLaunchToken;
    clearInterval(interval); interval=null;
    adminPreviewMode=true; activeTestId=t.id;
    questions.length=0; qs.forEach(q=>questions.push(q));
    testTitle=t.title||'Mock Test'; durationMinutes=Number(t.duration)||10;
    marksPerCorrect=Number(t.marks)||1; negativeMarks=Number(t.negative)||0;
    timer=Math.max(1,Math.round(durationMinutes*60)); current=0;
    answers=Array(questions.length).fill(null);
    pendingAnswers=Array(questions.length).fill(null);
    marked=Array(questions.length).fill(false);
    visited=Array(questions.length).fill(false);
    submitted=false; currentAttemptId=null;

    showTestCountdown(testTitle,function(){
      if(token!==testLaunchToken) return;
      renderAdminExam();
      updateTimer();
      clearInterval(interval);
      interval=setInterval(tick,1000);
    });
  };

  window.exitAdminPreview=function(){
    ++testLaunchToken;
    clearInterval(interval); interval=null;
    adminPreviewMode=false; activeTestId=null; currentAttemptId=null; submitted=true;
    hideExam();
    const home=document.getElementById('home');
    if(home){home.classList.remove('hidden');home.style.removeProperty('display');}
    document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
    document.getElementById('adminPreviewExit')?.classList.add('hidden');
    document.getElementById('adminPreviewExit')?.classList.remove('v13-visible');
    if(typeof window.showAdminSection==='function') window.showAdminSection('test');
  };

  /* ---------------------------------------------------------
     ONE CSV importer. Existing file/paste UI calls window.loadCSV.
     --------------------------------------------------------- */
  function parseCSV(text){
    text=String(text??'').replace(/^\uFEFF/,'');
    if(!/[\r]/.test(text) && /\\r/.test(text)) text=text.replace(/\\r/g,'');
    const first=(text.split(/\r?/)[0]||'');
    let delimiter=',';
    if(first.includes('\t') && !first.includes(',')) delimiter='\t';
    else if(first.includes(';') && first.split(';').length>=5 && first.split(',').length<5) delimiter=';';
    const rows=[]; let row=[], cell='', quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"'){
        if(quoted && n==='"'){cell+='"';i++;} else quoted=!quoted;
      }else if(c===delimiter && !quoted){row.push(cell);cell='';}
      else if((c===''||c==='\r')&&!quoted){if(c==='\r'&&n==='')i++;row.push(cell);cell='';if(row.some(x=>String(x).trim()!==''))rows.push(row);row=[];}
      else cell+=c;
    }
    if(cell!==''||row.length){row.push(cell);if(row.some(x=>String(x).trim()!==''))rows.push(row);}
    if(!rows.length) throw new Error('CSV has no question rows.');
    const clean=v=>String(v??'').replace(/^\uFEFF/,'').trim();
    let header=rows[0].map(clean).map(x=>x.toLowerCase().replace(/\s+/g,' '));
    const hasHeader=header.includes('question')&&header.includes('option 1')&&header.includes('option 2')&&header.includes('option 3')&&header.includes('option 4')&&header.includes('correct option');
    const idx={q:hasHeader?header.indexOf('question'):0,o1:hasHeader?header.indexOf('option 1'):1,o2:hasHeader?header.indexOf('option 2'):2,o3:hasHeader?header.indexOf('option 3'):3,o4:hasHeader?header.indexOf('option 4'):4,correct:hasHeader?header.indexOf('correct option'):5,explanation:hasHeader?header.indexOf('explanation'):(rows[0].length>6?6:-1)};
    const parsed=[]; let skipped=0;
    for(let r=hasHeader?1:0;r<rows.length;r++){
      const row=rows[r]; const q=clean(row[idx.q]),o1=clean(row[idx.o1]),o2=clean(row[idx.o2]),o3=clean(row[idx.o3]),o4=clean(row[idx.o4]);
      const cv=clean(row[idx.correct]).toUpperCase(); const correct={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4}[cv];
      const exp=idx.explanation>=0?clean(row[idx.explanation]):'';
      if(!q&&!o1&&!o2&&!o3&&!o4&&!cv) continue;
      if(!q||!o1||!o2||!o3||!o4||![1,2,3,4].includes(correct)){skipped++;continue;}
      parsed.push([q,o1,o2,o3,o4,correct,exp]);
    }
    if(!parsed.length) throw new Error('No valid questions found. Use: Question, Option 1, Option 2, Option 3, Option 4, Correct Option, Explanation');
    return {parsed,skipped};
  }
  window.loadCSV=function(text){
    if(!requireAdmin('CSV import')) throw new Error('Admin login required for CSV import.');
    const result=parseCSV(text);
    questions.length=0; result.parsed.forEach(q=>questions.push(q));
    csvLoaded=true;
    const status=document.getElementById('pasteStatus')||document.getElementById('fileStatus');
    if(status) status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded.</span>`+(result.skipped?` <span style="color:#b45309"> ${result.skipped} invalid row(s) skipped.</span>`:'');
    if(typeof renderCSVPreview==='function') renderCSVPreview();
    if(typeof updateHome==='function') updateHome();
    return result;
  };

  /* ---------------------------------------------------------
     ONE Result Management data pipeline
     V4.2 — automatic results: no publish/approval workflow.
     --------------------------------------------------------- */
  let resultRows=[];
  let resultLoadState='idle';
  let resultLoadError='';

  async function loadAdminResults(){
    if(!supabaseClient || !adminLoggedIn){
      resultLoadState='error';
      resultLoadError='Supabase is not ready or the Admin session is not active.';
      resultRows=[];
      return resultRows;
    }
    resultLoadState='loading';
    resultLoadError='';

    // The removed time-taken column is not part of the production schema; elapsed time is derived from started_at/submitted_at.
    const {data:attemptRows,error:attemptError}=await supabaseClient.from('attempts')
      .select('id,student_id,test_id,started_at,submitted_at,status,total_questions,correct_answers,wrong_answers,unanswered,score,question_snapshot,scoring_snapshot')
      .order('started_at',{ascending:false});
    if(attemptError){
      resultLoadState='error';
      resultLoadError='Attempts query failed: '+(attemptError.message||String(attemptError));
      throw new Error(resultLoadError);
    }

    const rows=Array.isArray(attemptRows)?attemptRows:[];
    const studentIds=[...new Set(rows.map(r=>r.student_id).filter(Boolean))];
    const testIds=[...new Set(rows.map(r=>r.test_id).filter(Boolean))];
    const studentMap=new Map(), testMap=new Map();

    if(studentIds.length){
      const {data,error}=await supabaseClient.from('students')
        .select('id,full_name,email,access_type').in('id',studentIds);
      if(error){
        resultLoadState='error';
        resultLoadError='Student mapping query failed: '+(error.message||String(error));
        throw new Error(resultLoadError);
      }
      (Array.isArray(data)?data:[]).forEach(x=>studentMap.set(x.id,x));
    }
    if(testIds.length){
      const {data,error}=await supabaseClient.from('tests')
        .select('id,title,marks_per_question,negative_marking').in('id',testIds);
      if(error){
        resultLoadState='error';
        resultLoadError='Test mapping query failed: '+(error.message||String(error));
        throw new Error(resultLoadError);
      }
      (Array.isArray(data)?data:[]).forEach(x=>testMap.set(x.id,x));
    }

    resultRows=rows.map(r=>{
      const st=studentMap.get(r.student_id)||{};
      const te=testMap.get(r.test_id)||{};
      const total=Number(r.total_questions)||0;
      const marks=Number(te.marks_per_question)||1;
      const negative=Number(te.negative_marking)||0;
      const score=Number(r.score)||0;
      const maxMarks=total*marks;
      return {
        id:r.id, userId:r.student_id, student_id:r.student_id,
        userName:st.full_name||'Candidate', name:st.full_name||'Candidate', email:st.email||'',
        access_type:st.access_type||'paid', candidate_type:st.access_type||'paid',
        title:te.title||'Mock Test', testTitle:te.title||'Mock Test', testId:r.test_id,
        date:r.submitted_at||r.started_at||'', submittedAt:r.submitted_at||'', startedAt:r.started_at||'',
        status:r.status||'', submitted:!!r.submitted_at,
        correct:Number(r.correct_answers)||0, wrong:Number(r.wrong_answers)||0, skipped:Number(r.unanswered)||0,
        score, marks, negativeMarks:negative, maxMarks, question_snapshot:r.question_snapshot||null, scoring_snapshot:r.scoring_snapshot||null,
        percentage:maxMarks?(score/maxMarks)*100:0,
        timeTaken:(()=>{
          const raw=r.time_taken??r.timeTaken??r.elapsed_seconds??r.elapsedSeconds??r.duration_seconds??r.durationSeconds;
          const n=Number(raw);
          if(Number.isFinite(n)&&n>=0)return Math.round(n);
          const a=Date.parse(r.started_at||''); const b=Date.parse(r.submitted_at||'');
          return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?Math.round((b-a)/1000):0;
        })()
      };
    });
    resultLoadState='ready'; resultLoadError='';
    localStorage.setItem('missionTES_results_cache',JSON.stringify(resultRows));
    return resultRows;
  }
  window.loadAdminResultsFromSupabase=loadAdminResults;
  window.getAdminResultDiagnostics=function(){
    return {state:resultLoadState,error:resultLoadError,count:resultRows.length,completed:resultRows.filter(r=>r.submitted||r.status==='completed').length};
  };

  function resultAccess(r){return ['free','paid'].includes(String(r.access_type||r.candidate_type||'').toLowerCase())?String(r.access_type||r.candidate_type).toLowerCase():'paid';}
  function score(r){return Number.isFinite(Number(r.score??r.marks))?Number(r.score??r.marks):0;}
  function maxMarks(r){const n=Number(r.maxMarks);return n>0?n:0;}
  function pct(r){const n=Number(r.percentage);return Number.isFinite(n)?n:(maxMarks(r)?score(r)/maxMarks(r)*100:0);}
  function formatAdminDate(v){
    if(!v)return '—'; const d=new Date(v);
    return Number.isNaN(d.getTime())?escapeHTML(String(v)):d.toLocaleString([], {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function formatAdminTime(sec){
    const n=Math.max(0,Math.round(Number(sec)||0)), h=Math.floor(n/3600), m=Math.floor((n%3600)/60), s=n%60;
    return h?`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`:`${m}m ${String(s).padStart(2,'0')}s`;
  }

  window.deleteAdminResultAttempt=async function(index){
    const r=(window.__adminFilteredResults||[])[index];
    if(!r || !r.id){ alert('The selected result could not be identified.'); return; }
    if(typeof adminLoggedIn==='undefined' || adminLoggedIn!==true){ alert('Admin login required to delete a result.'); return; }
    const candidate=r.userName||'Candidate';
    const test=r.title||'Mock Test';
    const id=String(r.id);
    const ok=confirm('DELETE RESULT / ATTEMPT?Candidate: '+candidate+'Test: '+test+'Attempt ID: '+id+'This permanently deletes the attempt and any related records covered by the database cascade rules.This action cannot be undone.');
    if(!ok)return;
    try{
      if(!supabaseClient || !supabaseClient.functions) throw new Error('Supabase is not ready.');
      if(!supabaseClient.auth) throw new Error('Authenticated Admin session is required.');
      const sess=await supabaseClient.auth.getSession();
      const token=sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
      if(!token) throw new Error('Authenticated Admin session is required. Please log in again.');
      const fn=await supabaseClient.functions.invoke('admin-delete-attempt-v2',{body:{attempt_id:id}});
      if(fn.error){
        let detail = fn.error.message || String(fn.error);
        try{
          const ctx = fn.error.context;
          if(ctx && typeof ctx.json === 'function'){
            const body = await ctx.json();
            if(body && body.error) detail = body.error + (body.detail ? ' — '+body.detail : '');
          }
        }catch(_){}
        throw new Error(detail);
      }
      if(fn.data && fn.data.error) throw new Error(fn.data.error);
      if(document.getElementById('adminResultDetail')) document.getElementById('adminResultDetail').innerHTML='';
      await loadAdminResults();
      renderResultRows();
      alert('Result / attempt deleted successfully.');
    }catch(err){
      console.error('Protected result deletion failed:',err);
      alert('Delete failed: '+(err && err.message ? err.message : String(err)));
    }
  };

  function renderResultRows(){
    const list=document.getElementById('adminResultList'); if(!list)return;
    if(resultLoadState==='loading'){list.innerHTML='<div class="resultEmpty">Loading results from Supabase…</div>';return;}
    if(resultLoadState==='error'){
      list.innerHTML='<div class="resultEmpty" style="color:#b42318;text-align:left"><b>Result data could not be loaded.</b><br><span style="font-size:12px">'+escapeHTML(resultLoadError||'Unknown Supabase error.')+'</span></div>';
      window.__adminFilteredResults=[]; return;
    }
    const search=(document.getElementById('resultSearch')?.value||'').trim().toLowerCase();
    const access=document.getElementById('resultAccessFilter')?.value||'all';
    const filtered=resultRows.filter(r=>{
      const text=[r.userName,r.name,r.email,r.title,r.testTitle,r.userId,r.student_id].filter(Boolean).join(' ').toLowerCase();
      return (!search||text.includes(search))&&(access==='all'||resultAccess(r)===access);
    });
    document.getElementById('adminResultTotal')&&(document.getElementById('adminResultTotal').textContent=resultRows.length);
    document.getElementById('adminResultCompleted')&&(document.getElementById('adminResultCompleted').textContent=resultRows.filter(r=>r.status==='completed'||r.submitted).length);
    document.getElementById('adminResultCandidates')&&(document.getElementById('adminResultCandidates').textContent=new Set(resultRows.map(r=>r.userId||r.student_id||r.email).filter(Boolean)).size);
    window.__adminFilteredResults=filtered;
    if(!filtered.length){list.innerHTML='<div class="emptyState">No results match the selected filters.</div>';return;}
    list.innerHTML=`<table class="resultTable"><thead><tr><th>Candidate</th><th>Test</th><th>Type</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Percentage</th><th>Action</th></tr></thead><tbody>${filtered.map((r,i)=>`<tr><td><b>${escapeHTML(r.userName||'Candidate')}</b><div style="font-size:11px;color:#64748b">${escapeHTML(r.email||'')}</div></td><td>${escapeHTML(r.title||'Mock Test')}</td><td><span class="resultBadge ${resultAccess(r)}">${resultAccess(r).toUpperCase()}</span></td><td><b>${score(r).toFixed(2)}</b>${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</td><td>${Number(r.correct||0)}</td><td>${Number(r.wrong||0)}</td><td>${Number(r.skipped||0)}</td><td><b>${pct(r).toFixed(1)}%</b></td><td><div class="resultActions"><button onclick="viewAdminResult(${i})">VIEW RESULT</button><button onclick="viewAdminAttempt(${i})">VIEW ATTEMPT</button><button class="hoa-v58-main-delete" onclick="deleteAdminResultAttempt(${i})">DELETE RESULT</button></div></td></tr>`).join('')}</tbody></table>`;
  }
  window.renderAdminResultSummary=renderResultRows;

  window.viewAdminResult=function(index){
    const r=(window.__adminFilteredResults||[])[index], d=document.getElementById('adminResultDetail'); if(!r||!d)return;
    d.innerHTML=`<div class="resultDetail"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b style="font-size:18px">${escapeHTML(r.userName||'Candidate')}</b><div style="font-size:12px;color:#64748b">${escapeHTML(r.email||'')}</div></div><button class="btn secondary" onclick="document.getElementById('adminResultDetail').innerHTML=''">Close</button></div><div class="resultDetailGrid" style="margin-top:12px"><div class="resultDetailItem"><small>Test</small><b>${escapeHTML(r.title||'Mock Test')}</b></div><div class="resultDetailItem"><small>Attempt ID</small><b style="word-break:break-all">${escapeHTML(String(r.id||'—'))}</b></div><div class="resultDetailItem"><small>Score</small><b>${score(r).toFixed(2)}${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</b></div><div class="resultDetailItem"><small>Percentage</small><b>${pct(r).toFixed(1)}%</b></div><div class="resultDetailItem"><small>Candidate Type</small><b>${resultAccess(r).toUpperCase()}</b></div><div class="resultDetailItem"><small>Correct</small><b>${Number(r.correct||0)}</b></div><div class="resultDetailItem"><small>Wrong</small><b>${Number(r.wrong||0)}</b></div><div class="resultDetailItem"><small>Skipped</small><b>${Number(r.skipped||0)}</b></div><div class="resultDetailItem"><small>Marks / Correct</small><b>+${Number(r.marks||0).toFixed(2)}</b></div><div class="resultDetailItem"><small>Negative Marks</small><b>−${Number(r.negativeMarks||0).toFixed(2)}</b></div><div class="resultDetailItem"><small>Time Taken</small><b>${formatAdminTime(r.timeTaken)}</b></div><div class="resultDetailItem"><small>Submitted</small><b>${formatAdminDate(r.submittedAt||r.date)}</b></div></div></div>`;
    d.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.viewAdminAttempt=async function(index){
    const r=(window.__adminFilteredResults||[])[index]; if(!r)return;
    try{
      let rawQs=null, savedAnswers=null;
      // Reuse the immutable local historical snapshot when available.
      try{
        const all=JSON.parse(localStorage.getItem('missionTES_attempt_details_v21')||'{}');
        const direct=all[String(r.id)];
        if(direct && Array.isArray(direct.questions)&&direct.questions.length){rawQs=direct.questions;savedAnswers=Array.isArray(direct.answers)?direct.answers:null;}
      }catch(ignore){}

      // Admin is allowed to inspect any candidate attempt; fetch only what is needed.
      if(!rawQs && supabaseClient && r.id && r.testId){
        const [{data:qRows,error:qError},{data:aRows,error:aError}]=await Promise.all([
          supabaseClient.from('questions').select('id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order').eq('test_id',r.testId).order('question_order',{ascending:true}),
          supabaseClient.from('answers').select('question_id,selected_option').eq('attempt_id',r.id)
        ]);
        if(qError||aError)throw new Error((qError||aError)?.message||'Could not load attempt details.');
        const answerMap=new Map((aRows||[]).map(a=>[String(a.question_id),a]));
        rawQs=(qRows||[]).map(q=>[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,q.correct_option,q.explanation||'']);
        savedAnswers=(qRows||[]).map(q=>{const a=answerMap.get(String(q.id));return a&&a.selected_option!==null&&a.selected_option!==undefined&&a.selected_option!==''?Number(a.selected_option):null;});
      }
      if(!rawQs){
        const t=(tests||[]).find(x=>String(x.id)===String(r.testId));
        if(t&&Array.isArray(t.questions))rawQs=t.questions;
      }
      if(!rawQs||!rawQs.length){alert('Question data for this attempt is not available.');return;}
      if(!Array.isArray(savedAnswers))savedAnswers=Array(rawQs.length).fill(null);

      window.__missionTESReviewSnapshot={questions:rawQs.map(q=>Array.isArray(q)?q.slice():q),answers:savedAnswers.slice(),testTitle:r.title||'Mock Test',testId:r.testId||null,historical:true,attemptId:r.id,resultRow:r};
      window.__missionTESHistoricalAttempt=r;
      reviewCurrent=0;
      document.getElementById('home')?.classList.add('hidden');
      document.getElementById('exam')?.classList.add('hidden');
      document.getElementById('headerTimer')?.classList.add('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
      document.getElementById('result')?.classList.remove('hidden');
      const correct=Number(r.correct||0),wrong=Number(r.wrong||0),skipped=Number(r.skipped||0),scoreValue=score(r),max=maxMarks(r)||rawQs.length*(Number(r.marks)||1);
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
      set('resultTitle',(r.title||'Mock Test')+' — Attempt Review');
      set('score',scoreValue.toFixed(2)+' / '+max.toFixed(2));
      set('percentage','Percentage: '+pct(r).toFixed(2)+'%');
      set('correct',correct);set('wrong',wrong);set('skipped',skipped);set('finalMarks',scoreValue.toFixed(2));
      set('resultMarksInfo',scoreValue.toFixed(2)+' / '+max.toFixed(2));set('resultCorrectInfo',correct);set('resultWrongInfo',wrong);set('resultSkippedInfo',skipped);set('resultTimeInfo',formatAdminTime(r.timeTaken));
      set('reviewSummary',`${correct} Correct • ${wrong} Wrong • ${skipped} Skipped`);
      const back=document.getElementById('resultBackBtn');
      if(back){back.textContent='← BACK TO RESULT MANAGEMENT';back.onclick=()=>{window.__missionTESReviewSnapshot=null;window.__missionTESHistoricalAttempt=null;document.getElementById('result')?.classList.add('hidden');document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');showDashboardTab('admin');activateAdminPanel('result');renderResultRows();};}
      forceRenderSubmittedQuestionReview();
      requestAnimationFrame(()=>forceRenderSubmittedQuestionReview());
      setTimeout(()=>forceRenderSubmittedQuestionReview(),50);
    }catch(e){
      console.error('Admin attempt review failed:',e);
      alert('Unable to open this attempt review. Please try again.');
    }
  };

  function populateTestWise(){
    const select=document.getElementById('testWiseTestSelect'); if(!select)return;
    const current=select.value; const map=new Map();
    resultRows.forEach(r=>{const key=String(r.testId||r.title||''); if(key&&!map.has(key))map.set(key,{key,name:r.title||'Mock Test'});});
    select.innerHTML='<option value="">Select Test</option>'+[...map.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${escapeHTML(x.key)}">${escapeHTML(x.name)}</option>`).join('');
    if(map.has(current)) select.value=current;
  }
  window.populateTestWiseSelector=populateTestWise;
  window.renderTestWiseResults=function(){
    populateTestWise(); const key=document.getElementById('testWiseTestSelect')?.value||''; const date=document.getElementById('testWiseDate')?.value||'';
    let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key); if(date) rows=rows.filter(r=>String(r.date||'').slice(0,10)===date); rows.sort((a,b)=>pct(b)-pct(a));
    document.getElementById('testWiseTemplateTestName')&&(document.getElementById('testWiseTemplateTestName').textContent=rows[0]?.title||'Test-Wise Result');
    document.getElementById('testWiseTemplateSubject')&&(document.getElementById('testWiseTemplateSubject').textContent='Subject: —');
    document.getElementById('testWiseTemplateDate')&&(document.getElementById('testWiseTemplateDate').textContent='Date: '+(date||String(rows[0]?.date||'').slice(0,10)||'—'));
    const box=document.getElementById('testWiseTable'); if(!box)return;
    if(!key){box.innerHTML='<div class="resultEmpty">Select a test to view its result.</div>';return;}
    if(!rows.length){box.innerHTML='<div class="resultEmpty">No candidates have results for this test.</div>';return;}
    box.innerHTML=`<div class="testWiseTableWrap"><table class="testWiseTable"><thead><tr><th>Sl. No.</th><th>Candidate Name</th><th>Email</th><th>Individual Score</th><th>Percentage</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(r.userName||'Candidate')}</td><td>${escapeHTML(r.email||'')}</td><td><b>${score(r).toFixed(2)}</b>${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</td><td>${pct(r).toFixed(2)}%</td></tr>`).join('')}</tbody></table></div>`;
  };
  window.exportAdminResultsCSV=function(){
    const rows=window.__adminFilteredResults||resultRows; if(!rows.length){alert('No results to export.');return;}
    const data=[['Candidate Name','Email','Candidate Type','Test','Score','Max Marks','Correct','Wrong','Skipped','Percentage'],...rows.map(r=>[r.userName||r.name||'',r.email||'',resultAccess(r).toUpperCase(),r.title||'',score(r).toFixed(2),maxMarks(r)?maxMarks(r).toFixed(2):'',Number(r.correct||0),Number(r.wrong||0),Number(r.skipped||0),pct(r).toFixed(2)])];
    const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"'; const blob=new Blob([data.map(row=>row.map(esc).join(',')).join('\r')],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MISSION_TES_Results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
  window.exportTestWiseCSV=function(){
    const key=document.getElementById('testWiseTestSelect')?.value||''; const date=document.getElementById('testWiseDate')?.value||''; let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);if(date)rows=rows.filter(r=>String(r.date||'').slice(0,10)===date);rows.sort((a,b)=>pct(b)-pct(a)); if(!rows.length){alert('Select a test with results first.');return;}
    const data=[['Name of the Test',rows[0].title||'Mock Test'],['Subject','—'],['Date',date||String(rows[0].date||'').slice(0,10)],[],['Sl. No.','Candidate Name','Email','Individual Score','Percentage'],...rows.map((r,i)=>[i+1,r.userName||'',r.email||'',score(r).toFixed(2)+(maxMarks(r)?' / '+maxMarks(r).toFixed(2):''),pct(r).toFixed(2)+'%'])];
    const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"'; const blob=new Blob([data.map(row=>row.map(esc).join(',')).join('\r')],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MISSION_TES_'+(rows[0].title||'Result').replace(/[^\w\-]+/g,'_').slice(0,80)+'_Result.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
  window.printTestWiseResult=function(){window.print();};

  async function activateAdminPanel(section){
    if(!adminLoggedIn || currentStudent) return;
    const ids={student:'adminSectionStudentPanel',test:'adminSectionTestPanel',result:'adminSectionResultPanel',admin:'adminSectionAdminPanel'};
    Object.entries(ids).forEach(([k,id])=>{
      const el=document.getElementById(id);
      if(!el) return;
      const active=k===section;
      el.classList.toggle('active',active);
      if(active){
        el.classList.add('v13-active');
        el.style.setProperty('display','block','important');
        el.style.setProperty('visibility','visible','important');
        el.style.setProperty('opacity','1','important');
      }else{
        el.classList.remove('v13-active');
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
      }
    });
    Object.entries({student:'adminNavStudent',test:'adminNavTest',result:'adminNavResult',admin:'adminNavAdmin'}).forEach(([k,id])=>document.getElementById(id)?.classList.toggle('active',k===section));
    if(section==='student') return renderAdminStudents();
    if(section==='test') return renderLibrary();
    if(section==='admin') return renderAdminAccount();
    if(section==='result'){
      const panel=document.getElementById('adminSectionResultPanel');
      const dash=panel?.querySelector(':scope > .dashPanel');
      [panel,dash].forEach(el=>{
        if(!el) return;
        el.classList.add('v13-active');
        el.style.setProperty('display','block','important');
        el.style.setProperty('visibility','visible','important');
        el.style.setProperty('opacity','1','important');
      });
      /* Render an explicit loading state, then replace it with live Supabase data. */
      resultLoadState='loading';
      resultLoadError='';
      renderResultRows();
      populateTestWise();
      window.renderTestWiseResults();
      try{
        await loadAdminResults();
        renderResultRows();
        populateTestWise();
        window.renderTestWiseResults();
      }catch(e){
        console.error('V1.5 result load failed:',e);
        renderResultRows();
        populateTestWise();
        window.renderTestWiseResults();
      }
    }
  }
  window.showAdminSection=activateAdminPanel;

  /* Admin logout: keep the single existing button inside the global header.
     The visual CSS positions that header cleanly; do not move/clone the node. */
  function placeLogout(){
    const b=document.getElementById('adminHeaderLogout'); if(!b)return;
    if(isAdminMode()){
      b.classList.remove('hidden');
      b.style.removeProperty('position');
      b.style.removeProperty('top');
      b.style.removeProperty('right');
      b.style.removeProperty('z-index');
      b.style.setProperty('writing-mode','horizontal-tb','important');
    }else{b.classList.add('hidden');}
  }
  window.v13PlaceAdminLogout=placeLogout;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeLogout);else placeLogout();

  /* Keep admin result state fresh after explicit refresh. */
  window.v13RefreshResults=async function(){
    if(!isAdminMode()) return;
    try{await loadAdminResults();}catch(e){console.error(e);} renderResultRows();populateTestWise();window.renderTestWiseResults();
  };
  window.addEventListener('scroll',()=>{ if(isAdminMode()) placeLogout(); },{passive:true});

})();


/* ===== Original inline script 5 — id: mission-tes-v16-result-rescue-clean ===== */

(function(){
  'use strict';
  const PANEL='adminSectionResultPanel';
  const OTHERS=['adminSectionStudentPanel','adminSectionTestPanel','adminSectionAdminPanel'];

  function visibleAdmin(){
    const admin=document.getElementById('adminOnlyDashboard');
    return !!(document.body.classList.contains('admin-ui') && admin && !admin.classList.contains('hidden'));
  }

  function activateResultDOM(){
    const panel=document.getElementById(PANEL);
    const admin=document.getElementById('adminOnlyDashboard');
    if(!panel || !admin || !visibleAdmin()) return false;
    OTHERS.forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.classList.remove('active','v13-active','v16-result-open');
    });
    panel.classList.add('active','v13-active','v16-result-open');
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('visibility','visible','important');
    panel.style.setProperty('opacity','1','important');
    const dash=panel.querySelector(':scope > .dashPanel');
    if(dash){
      dash.style.setProperty('display','block','important');
      dash.style.setProperty('visibility','visible','important');
      dash.style.setProperty('opacity','1','important');
    }
    document.querySelectorAll('[id^="adminNav"]').forEach(b=>b.classList.toggle('active',b.id==='adminNavResult'));
    const title=document.getElementById('adminReferencePageTitle');
    const sub=document.getElementById('adminReferencePageSub');
    if(title) title.textContent='Result Management';
    if(sub) sub.textContent='Search, filter, inspect and manage candidate test results';
    return true;
  }

  async function openResult(){
    if(!activateResultDOM()) return;
    try{
      if(typeof window.loadAdminResults==='function') await window.loadAdminResults();
      else if(typeof window.loadAdminResultsFromSupabase==='function') await window.loadAdminResultsFromSupabase();
    }catch(e){ console.error('Result Management load:',e); }
    activateResultDOM();
    try{ if(typeof window.renderResultRows==='function') window.renderResultRows(); }catch(e){console.error('Result rows:',e);}
    try{ if(typeof window.renderAdminResultSummary==='function') window.renderAdminResultSummary(); }catch(e){console.error('Result summary:',e);}
    try{ if(typeof window.populateTestWiseSelector==='function') window.populateTestWiseSelector(); if(typeof window.renderTestWiseResults==='function') window.renderTestWiseResults(); }catch(e){console.error('Test-wise result:',e);}
    requestAnimationFrame(activateResultDOM);
  }

  function commitPendingAnswerForCurrentQuestion(){
  if(!Array.isArray(questions) || !questions.length) return;
  if(!Array.isArray(answers) || answers.length!==questions.length) answers=Array(questions.length).fill(null);
  if(!Array.isArray(pendingAnswers) || pendingAnswers.length!==questions.length) pendingAnswers=Array(questions.length).fill(null);
  if(!Array.isArray(marked) || marked.length!==questions.length) marked=Array(questions.length).fill(false);
  if(!Array.isArray(visited) || visited.length!==questions.length) visited=Array(questions.length).fill(false);
  const i=Math.max(0,Math.min(Number(current)||0,questions.length-1));
  // Selecting an option creates a draft; when the candidate submits, that
  // draft must not silently disappear.
  if(pendingAnswers[i]!==null && pendingAnswers[i]!==undefined){
    answers[i]=pendingAnswers[i];
    visited[i]=true;
  }
}

function bind(){
    const nav=document.getElementById('adminNavResult');
    if(!nav || nav.dataset.v16CleanBound) return;
    nav.dataset.v16CleanBound='1';
    // Capture phase guarantees the Result panel is activated before the inline onclick.
    nav.addEventListener('click',function(){
      if(!visibleAdmin()) return;
      activateResultDOM();
      setTimeout(openResult,0);
      setTimeout(activateResultDOM,50);
      setTimeout(activateResultDOM,250);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  window.v16OpenResultWorkspace=openResult;
})();


/* ===== Original inline script 6 — id: mission-tes-v16-result-rootfix ===== */

(function(){
  'use strict';
  const RESULT_id='adminSectionResultPanel__dup2';
  const ADMIN_id='adminOnlyDashboard__dup2';
  let originalShow=window.showAdminSection;

  function ensureAdminRoot(){
    const admin=document.getElementById(ADMIN_ID);
    const main=document.querySelector('.adminReferenceMain');
    if(!admin || !main) return false;
    if(admin.parentElement!==main) main.appendChild(admin);
    const panel=document.getElementById(RESULT_ID);
    /* The source HTML has the Result panel outside #adminOnlyDashboard because
       of an old unmatched wrapper. Move only this panel into the Admin root. */
    if(panel && panel.parentElement!==admin) admin.appendChild(panel);
    admin.classList.remove('hidden');
    admin.style.removeProperty('display');
    return true;
  }

  function activateResultRoot(){
    if(!ensureAdminRoot()) return false;
    const admin=document.getElementById(ADMIN_ID);
    const panel=document.getElementById(RESULT_ID);
    if(!panel) return false;

    admin.classList.remove('hidden');
    admin.style.setProperty('display','block','important');
    admin.style.setProperty('visibility','visible','important');
    admin.style.setProperty('opacity','1','important');

    ['adminSectionStudentPanel','adminSectionTestPanel','adminSectionAdminPanel'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){el.classList.remove('active','v13-active','v16-result-open','v16-root-result-active');}
    });

    panel.classList.add('active','v13-active','v16-result-open','v16-root-result-active');
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('visibility','visible','important');
    panel.style.setProperty('opacity','1','important');
    panel.style.setProperty('width','100%','important');
    panel.style.setProperty('height','auto','important');

    const dash=panel.querySelector(':scope > .dashPanel');
    if(dash){
      dash.style.setProperty('display','block','important');
      dash.style.setProperty('visibility','visible','important');
      dash.style.setProperty('opacity','1','important');
      dash.style.setProperty('width','100%','important');
    }

    ['adminNavStudent','adminNavTest','adminNavResult','adminNavAdmin'].forEach(id=>{
      const b=document.getElementById(id);
      if(b) b.classList.toggle('active',id==='adminNavResult');
    });
    const title=document.getElementById('adminReferencePageTitle');
    const sub=document.getElementById('adminReferencePageSub');
    if(title) title.textContent='Result Management';
    if(sub) sub.textContent='Search, filter, inspect and manage candidate test results';
    return true;
  }

  async function openResult(){
    activateResultRoot();
    try{
      if(typeof window.loadAdminResults==='function') await window.loadAdminResults();
      else if(typeof window.loadAdminResultsFromSupabase==='function') await window.loadAdminResultsFromSupabase();
    }catch(e){ console.error('Result Management rootfix load:',e); }
    activateResultRoot();
    try{ if(typeof window.renderResultRows==='function') window.renderResultRows(); }catch(e){console.error(e);}
    try{ if(typeof window.renderAdminResultSummary==='function') window.renderAdminResultSummary(); }catch(e){console.error(e);}
    try{ if(typeof window.populateTestWiseSelector==='function') window.populateTestWiseSelector(); }catch(e){console.error(e);}
    try{ if(typeof window.renderTestWiseResults==='function') window.renderTestWiseResults(); }catch(e){console.error(e);}
    requestAnimationFrame(activateResultRoot);
  }

  
window.freeGateLoginSubmit=async function(){ if(window.hoaOpenFreeContent){ window.hoaOpenFreeContent(); return; } };
function install(){
    const nav=document.getElementById('adminNavResult');
    if(nav && !nav.dataset.v16RootFixBound){
      nav.dataset.v16RootFixBound='1';
      nav.addEventListener('click',function(){
        activateResultRoot();
        setTimeout(openResult,0);
      },true);
    }

    if(window.showAdminSection && !window.showAdminSection.__v16RootWrapped){
      originalShow=window.showAdminSection;
      const wrapped=function(section){
        const r=originalShow.apply(this,arguments);
        if(section==='result'){
          activateResultRoot();
          Promise.resolve(r).then(openResult).catch(openResult);
        }
        return r;
      };
      wrapped.__v16RootWrapped=true;
      wrapped.__v16Original=originalShow;
      window.showAdminSection=wrapped;
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  window.v16ResultRootFix=openResult;
})();


/* ===== Original inline script 7 — id: v17-home-admin-toggle ===== */

function toggleHomeAdminLogin(){
  const body = document.getElementById('homeAdminBody');
  const button = document.getElementById('homeAdminToggle');
  if(!body || !button) return;
  const open = body.hidden;
  body.hidden = !open;
  if(open) body.style.setProperty('display','block','important');
  else body.style.removeProperty('display');
  button.setAttribute('aria-expanded', String(open));
  button.textContent = open ? 'CLOSE' : 'ADMIN LOGIN';
  if(open){
    const input = document.getElementById('adminUsername');
    if(input) setTimeout(()=>input.focus(), 80);
  }
}


/* ===== Original inline script 8 — id: v19-ui03-instructions-guard ===== */

document.addEventListener("keydown",function(e){
  var modal=document.getElementById("testInstructionsModal");
  if(!modal || modal.classList.contains("hidden")) return;
  if(e.key==="Escape"){ e.preventDefault(); closeTestInstructions(); }
});


/* ===== Original inline script 9 — id: v19-ui04-integrity-script ===== */

(function(){
  
(function bindMissionExamSubmit(){
  function bind(){
    if(document.body.dataset.missionSubmitDelegated==="1") return;
    document.body.dataset.missionSubmitDelegated="1";
    document.addEventListener("click",function(e){
      const b=e.target && e.target.closest ? e.target.closest("#examSubmitTestButton,[data-mission-submit='1']") : null;
      if(!b) return;
      e.preventDefault();
      e.stopPropagation();
      // A normal Submit click is an intentional exam interaction, not a violation.
      if(window.MISSION_TES_ExamIntegrity && window.MISSION_TES_ExamIntegrity.markInternalInteraction){
        window.MISSION_TES_ExamIntegrity.markInternalInteraction(1200);
      }
      if(typeof window.openMissionSubmitConfirmation==="function"){
        window.openMissionSubmitConfirmation();
      }else{
        const overlay=document.getElementById("missionSubmitConfirm");
        if(overlay){
          overlay.style.setProperty("display","flex","important");
          overlay.style.setProperty("visibility","visible","important");
          overlay.style.setProperty("opacity","1","important");
        }
      }
    },true);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);
  else bind();
})();
const integrity={
    violations:0,
    maxViolations:3,
    examActive:false,
    submitted:false,
    warningOpen:false,
    lastViolationAt:0,
    internalInteractionUntil:0
  };

  function el(id){ return document.getElementById(id); }

  function hideIntegrityUI(){
    const modal=el("examIntegrityWarning");
    const badge=el("examIntegrityBadge");
    if(modal) modal.style.display="none";
    if(badge) badge.style.display="none";
    integrity.warningOpen=false;
  }

  function updateBadge(){
    const badge=el("examIntegrityBadge");
    if(!badge) return;
    if(integrity.examActive && !integrity.submitted && integrity.violations>0){
      badge.textContent="⚠ Violations: "+integrity.violations+"/3";
      badge.style.display="block";
    }else{
      badge.style.display="none";
    }
  }

  function setExamActive(active){
    integrity.examActive=!!active && !integrity.submitted;
    if(!integrity.examActive) hideIntegrityUI();
    updateBadge();
  }

  async function requestExamFullscreen(){
    try{
      if(document.fullscreenElement) return true;
      if(document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
        return true;
      }
    }catch(e){}
    return false;
  }

  async function exitExamFullscreen(){
    try{
      if(document.fullscreenElement && document.exitFullscreen){
        await document.exitFullscreen();
      }
    }catch(e){}
  }

  function showWarning(reason, finalViolation){
    const modal=el("examIntegrityWarning");
    const title=el("eiTitle");
    const text=el("eiText");
    const count=el("eiCount");
    const btn=el("eiContinue");
    if(!modal) return;

    count.textContent=integrity.violations+" / "+integrity.maxViolations;

    if(finalViolation){
      title.textContent="Examination Submitted";
      text.textContent="You have left the examination screen too many times. Your test is being submitted.";
      btn.textContent="View Submitted Result";
    }else{
      title.textContent="⚠️ Examination Warning";
      text.textContent=reason+" Please return to the examination screen and continue your test.";
      btn.textContent="Return to Examination";
    }

    btn.style.display="inline-block";
    modal.style.display="flex";
    integrity.warningOpen=true;
  }

  async function callExistingSubmit(forceSubmit){
    const candidates=["submitTest","finishTest","submitExam"];
    for(const name of candidates){
      if(typeof window[name]==="function"){
        try{
          await window[name](!!forceSubmit);
          return true;
        }catch(e){}
      }
    }

    const buttons=document.querySelectorAll("button");
    for(const b of buttons){
      const t=(b.textContent||"").trim().toLowerCase();
      if(t==="submit test" || t==="submit"){
        b.click();
        return true;
      }
    }
    return false;
  }

  function markInternalInteraction(ms){
    integrity.internalInteractionUntil=Math.max(integrity.internalInteractionUntil||0,Date.now()+Math.max(0,Number(ms)||0));
  }

  
(function missionTESNavigationIntegrityGuard(){
  function install(){
    if(document.body.dataset.missionTesNavGuard==="1") return;
    document.body.dataset.missionTesNavGuard="1";
    document.addEventListener("pointerdown",function(e){
      const b=e.target && e.target.closest ? e.target.closest('button[onclick*="nextQ"],button[onclick*="prevQ"]') : null;
      if(b && window.MISSION_TES_ExamIntegrity && window.MISSION_TES_ExamIntegrity.markInternalInteraction){
        window.MISSION_TES_ExamIntegrity.markInternalInteraction(2500);
      }
    },true);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",install);
  else install();
})();
function violation(reason){
    if(!integrity.examActive || integrity.submitted || integrity.violations>=integrity.maxViolations) return;
    if(Date.now()<integrity.internalInteractionUntil) return;

    const now=Date.now();
    if(now-integrity.lastViolationAt<1500) return;
    integrity.lastViolationAt=now;

    integrity.violations++;
    updateBadge();

    if(integrity.violations===integrity.maxViolations){
      // Freeze the integrity state at 3/3 before submission starts.
      integrity.submitted=true;
      integrity.examActive=false;
      updateBadge();
      showWarning(reason,true);

      // Use the existing application's submission/result flow.
      setTimeout(async function(){
        await callExistingSubmit(true);
      },300);
    }else{
      showWarning(reason,false);
    }
  }

  function bind(){
    if(el("examIntegrityWarning")) return;

    const modal=document.createElement("div");
    modal.id="examIntegrityWarning";
    modal.innerHTML=
      '<div class="ei-card">'+
        '<div class="ei-icon">⚠️</div>'+
        '<h2 id="eiTitle">Examination Warning</h2>'+
        '<p id="eiText"></p>'+
        '<p>Violation <span class="ei-count" id="eiCount">0 / 3</span></p>'+
        '<button id="eiContinue">Return to Examination</button>'+
      '</div>';
    document.body.appendChild(modal);

    const badge=document.createElement("div");
    badge.id="examIntegrityBadge";
    document.body.appendChild(badge);
    hideIntegrityUI();

    const examRoot=document.getElementById("exam");
    if(examRoot && !examRoot.dataset.integrityInteractionGuard){
      examRoot.dataset.integrityInteractionGuard="1";
      ["pointerdown","mousedown","click"].forEach(function(evt){
        examRoot.addEventListener(evt,function(e){
          if(e.target && e.target.closest && e.target.closest("button,select,input,textarea,a")){
            integrity.internalInteractionUntil=Date.now()+900;
          }
        },true);
      });
    }

    el("eiContinue").addEventListener("click",async function(){
      const finalViolation=integrity.submitted || integrity.violations>=integrity.maxViolations;
      hideIntegrityUI();

      if(finalViolation){
        // The normal result screen is already controlled by the existing app.
        // Do not reveal or append any result elements here.
        await exitExamFullscreen();
        return;
      }

      await requestExamFullscreen();
      setExamActive(true);
    });

    document.addEventListener("fullscreenchange",function(){
      if(integrity.examActive && !document.fullscreenElement){
        violation("You exited full-screen mode.");
      }
    });

    document.addEventListener("visibilitychange",function(){
      if(integrity.examActive && document.visibilityState==="hidden"){
        violation("You left the examination tab or window.");
      }
    });

    window.addEventListener("blur",function(){
      if(integrity.examActive) violation("The examination window lost focus.");
    });

    // Stop integrity monitoring as soon as the app navigates away from the exam.
    const exam=document.getElementById("exam");
    if(exam){
      new MutationObserver(function(){
        if(exam.classList.contains("hidden")){
          integrity.examActive=false;
          integrity.submitted=true;
          hideIntegrityUI();
          exitExamFullscreen();
        }
      }).observe(exam,{attributes:true,attributeFilter:["class","style"]});
    }
  }

  window.MISSION_TES_ExamIntegrity={
    start:async function(){
      bind();
      integrity.violations=0;
      integrity.submitted=false;
      integrity.warningOpen=false;
      integrity.lastViolationAt=0;
      integrity.internalInteractionUntil=0;
      hideIntegrityUI();
      integrity.examActive=true;
      updateBadge();
      await requestExamFullscreen();
      updateBadge();
    },
    stop:function(){
      integrity.examActive=false;
      integrity.submitted=true;
      hideIntegrityUI();
      exitExamFullscreen();
    },
    requestFullscreen:requestExamFullscreen,
    markInternalInteraction:markInternalInteraction
  };

  function hookStartButtons(){
    document.querySelectorAll("button").forEach(function(button){
      const text=(button.textContent||"").trim().toLowerCase();
      if((text==="start exam" || text==="start test") && !button.dataset.integrityHooked){
        button.dataset.integrityHooked="1";
        button.addEventListener("click",function(){
          window.MISSION_TES_ExamIntegrity.start();
        },true);
      }
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){
      bind(); hookStartButtons();
    });
  }else{
    bind(); hookStartButtons();
  }
  setInterval(hookStartButtons,1000);
})();


/* ===== Original inline script 10 — id: ui14-exam-mode ===== */

(function(){
  function syncExamMode(){
    var active =
      document.querySelector('.exam-screen[style*="display"]') ||
      document.querySelector('#examScreen[style*="display"]') ||
      document.querySelector('.exam-container[style*="display"]');
    var visible = !!active && getComputedStyle(active).display !== 'none';
    document.body.classList.toggle('exam-active', visible);
  }
  document.addEventListener('DOMContentLoaded', function(){
    syncExamMode();
    new MutationObserver(syncExamMode).observe(document.body,{subtree:true,attributes:true,attributeFilter:['style','class']});
  });
})();


/* ===== Original inline script 11 — id: ui16-exam-state-sync ===== */

(function(){
  function syncExamState(){
    var exam=document.getElementById('exam');
    if(!exam) return;
    var visible=getComputedStyle(exam).display!=='none' &&
                 !exam.classList.contains('hidden');
    document.body.classList.toggle('v13-exam-active', visible);
  }
  function boot(){
    syncExamState();
    new MutationObserver(syncExamState).observe(document.body,{
      subtree:true, attributes:true, attributeFilter:['style','class']
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();


/* ===== Original inline script 12 — id: ui17-full-reference-js ===== */

(function(){
  function $(id){return document.getElementById(id)}
  function getExam(){return $('exam')}
  function active(){const e=getExam();return !!e&&getComputedStyle(e).display!=='none'&&!e.classList.contains('hidden')}
  function ensureUI(){
    const e=getExam(); if(!e||!active()) return;
    const top=e.querySelector('.examTop');
    const grid=e.querySelector('.examGrid');
    const card=grid&&grid.querySelector('.card');
    const side=grid&&grid.querySelector('.side');
    if(!top||!grid||!card||!side)return;

    if(!e.querySelector('.ui17-sectionbar')){
      top.insertAdjacentHTML('afterend','<div class="ui17-sectionbar"><span class="ui17-section-label">SECTIONS</span><span class="ui17-section-tab" id="ui17SectionTab">Test</span></div>');
    }
    const topRight=top.lastElementChild;
    if(topRight && !top.querySelector('.ui17-fullscreen')){
      const b=document.createElement('button');b.type='button';b.className='ui17-fullscreen';b.textContent='Switch Full Screen';
      b.onclick=function(){
        try{
          if(document.fullscreenElement) document.exitFullscreen();
          else e.requestFullscreen();
        }catch(_){}
      };
      topRight.appendChild(b);
    }
    if(!card.querySelector('.ui17-qmeta')){
      const q=document.createElement('div');
      q.className='ui17-qmeta';
      q.innerHTML='<span class="qstrong" id="ui17QNo">Question No. 1</span><span class="ui17-positive">+2</span><span class="ui17-negative">-0.5</span><span class="ui17-time" id="ui17QTime">Time: 00:00</span><span class="ui17-meta-right"><select class="ui17-lang" id="ui17Lang"><option>English</option></select><button type="button" class="ui17-report" id="ui17Report">Report</button></span>';
      card.insertBefore(q,card.querySelector('#questionNo'));
    }
    if(!side.querySelector('.ui17-profile')){
      const h3=side.querySelector('h3');
      const profile=document.createElement('div');profile.className='ui17-profile';
      profile.innerHTML='<strong>Student</strong><div id="ui17StudentName">Candidate</div>';
      side.insertBefore(profile,h3);
      const stats=document.createElement('div');stats.className='ui17-stats';
      stats.innerHTML='<div class="ui17-stat"><span>Answered</span><b id="ui17Answered">0</b></div><div class="ui17-stat"><span>Marked</span><b id="ui17Marked">0</b></div><div class="ui17-stat"><span>Not Visited</span><b id="ui17NotVisited">0</b></div><div class="ui17-stat"><span>Marked &amp; Answered</span><b id="ui17MarkedAnswered">0</b></div><div class="ui17-stat"><span>Not Answered</span><b id="ui17NotAnswered">0</b></div>';
      side.insertBefore(stats,h3);
    }
    if(!e.querySelector('.ui17-bottom')){
      const oldnav=e.querySelector('.nav');
      const bar=document.createElement('div');bar.className='ui17-bottom';
      bar.innerHTML='<div class="group"><button type="button" class="review" id="ui17MarkReview">Mark for Review &amp; Next</button><button type="button" class="outline" id="ui17Clear">Clear Response</button></div><div class="group"><button type="button" class="outline" id="ui17SaveNext">Save &amp; Next</button><button type="button" class="primary" id="ui17Submit">Submit Test</button></div>';
      e.appendChild(bar);
      const submit=()=>{if(typeof submitTest==='function')submitTest()};
      const ensureCBTState=()=>{
        const n=Array.isArray(window.questions)?window.questions.length:0;
        if(!Array.isArray(window.answers)||window.answers.length!==n) window.answers=Array(n).fill(null);
        if(!Array.isArray(window.pendingAnswers)||window.pendingAnswers.length!==n) window.pendingAnswers=Array(n).fill(null);
        if(!Array.isArray(window.marked)||window.marked.length!==n) window.marked=Array(n).fill(false);
        if(!Array.isArray(window.visited)||window.visited.length!==n) window.visited=Array(n).fill(false);
      };
      const goNext=()=>{
        ensureCBTState();
        const i=Number(window.current)||0;
        window.answers[i]=window.pendingAnswers[i] ?? null;
        window.marked[i]=false;
        window.visited[i]=true;
        if(i<window.questions.length-1) window.current=i+1;
        if(typeof render==='function')render();
      };
      const markReview=()=>{
        ensureCBTState();
        const i=Number(window.current)||0;
        window.answers[i]=window.pendingAnswers[i] ?? null;
        window.marked[i]=true;
        window.visited[i]=true;
        if(i<window.questions.length-1) window.current=i+1;
        if(typeof render==='function')render();
      };
      $('ui17MarkReview').onclick=markReview;
      $('ui17SaveNext').onclick=goNext;
      $('ui17Report').onclick=function(){ alert('Report feature is available for this question.'); };
      $('ui17Submit').onclick=submit;
      $('ui17Clear').onclick=function(){
        ensureCBTState();
        const i=Number(window.current)||0;
        window.pendingAnswers[i]=null;
        window.answers[i]=null;
        window.marked[i]=false;
        window.visited[i]=true;
        if(typeof render==='function')render();
      };
    }
    const old=e.querySelector('.nav'); if(old)old.style.display='none';
  }
  function sync(){
    if(!active())return;
    ensureUI();
    const total=Array.isArray(window.questions)?window.questions.length:0, cur=Number(window.current)||0;
    const a=Array.isArray(window.answers)?window.answers:[];
    const marked=Array.isArray(window.marked)?window.marked:[];
    const set=(id,v)=>{const x=$(id);if(x)x.textContent=v};
    set('ui17QNo','Question No. '+(cur+1));
    set('ui17SectionTab',window.testTitle||'Test');
    let answered=0,m=0,ma=0;
    a.forEach((v,i)=>{const yes=v!==null&&v!==undefined&&v!=='';const mk=!!marked[i];if(yes)answered++;if(mk)m++;if(yes&&mk)ma++});
    set('ui17Answered',answered);set('ui17Marked',m);set('ui17MarkedAnswered',ma);
    set('ui17NotVisited',Math.max(0,total-cur-1));set('ui17NotAnswered',Math.max(0,total-answered));
    const s=$( 'ui17StudentName');if(s)s.textContent=currentStudentName||window.studentName||'Candidate';
  }
  setInterval(sync,400);
  document.addEventListener('DOMContentLoaded',sync);
})();


/* ===== Original inline script 13 — id: ui21-exam-controls ===== */

(function(){
  function bind(){
    const mark=document.getElementById("ui21MarkReview");
    const clear=document.getElementById("ui21Clear");
    const save=document.getElementById("ui21SaveNext");

    if(mark && !mark.dataset.bound){
      mark.dataset.bound="1";
      mark.onclick=function(){
        if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(2000);
        if(!Array.isArray(answers)) answers=[];
        if(!Array.isArray(pendingAnswers)) pendingAnswers=Array(questions.length).fill(null);
        if(!Array.isArray(marked)) marked=Array(questions.length).fill(false);
        if(!Array.isArray(visited)) visited=Array(questions.length).fill(false);

        /* Mark for Review & Next saves the current selection, if any. */
        answers[current]=pendingAnswers[current] ?? null;
        marked[current]=true;
        visited[current]=true;
        if(Array.isArray(questions) && current<questions.length-1){
          current++;
          render();
        }else{
          render();
        }
      };
    }

    if(save && !save.dataset.bound){
      save.dataset.bound="1";
      save.onclick=function(){
        if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(2000);
        if(!Array.isArray(answers)) answers=[];
        if(!Array.isArray(pendingAnswers)) pendingAnswers=Array(questions.length).fill(null);
        if(!Array.isArray(marked)) marked=Array(questions.length).fill(false);
        if(!Array.isArray(visited)) visited=Array(questions.length).fill(false);

        /* Save & Next commits the draft answer and removes review status. */
        answers[current]=pendingAnswers[current] ?? null;
        marked[current]=false;
        visited[current]=true;
        if(Array.isArray(questions) && current<questions.length-1){
          current++;
          render();
        }else{
          render();
        }
      };
    }

    if(clear && !clear.dataset.bound){
      clear.dataset.bound="1";
      clear.onclick=function(){
        if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(1500);
        if(!Array.isArray(answers)) answers=[];
        if(!Array.isArray(pendingAnswers)) pendingAnswers=Array(questions.length).fill(null);
        if(!Array.isArray(marked)) marked=Array(questions.length).fill(false);
        if(!Array.isArray(visited)) visited=Array(questions.length).fill(false);

        /* Clear Response removes both the draft and saved answer. */
        pendingAnswers[current]=null;
        answers[current]=null;
        marked[current]=false;
        visited[current]=true;
        render();
      };
    }
  }
  document.addEventListener("DOMContentLoaded",bind);
  setInterval(bind,500);
})();


/* ===== Original inline script 14 — id: mission-cbt-single-state-engine-final ===== */

(function(){
  /* One CBT state engine for BOTH legacy/UI17 and UI21 controls.
     Uses the real global lexical state: answers, pendingAnswers, marked, visited, current. */
  function ensureState(){
    const n=Array.isArray(questions)?questions.length:0;
    if(!Array.isArray(answers)||answers.length!==n) answers=Array(n).fill(null);
    if(!Array.isArray(pendingAnswers)||pendingAnswers.length!==n) pendingAnswers=Array(n).fill(null);
    if(!Array.isArray(marked)||marked.length!==n) marked=Array(n).fill(false);
    if(!Array.isArray(visited)||visited.length!==n) visited=Array(n).fill(false);
  }
  function touch(ms){
    if(window.MISSION_TES_ExamIntegrity && window.MISSION_TES_ExamIntegrity.markInternalInteraction){
      window.MISSION_TES_ExamIntegrity.markInternalInteraction(ms);
    }
  }
  function saveNext(){
    ensureState(); touch(2000);
    const i=Number(current)||0;
    answers[i]=pendingAnswers[i] ?? null;
    marked[i]=false;
    visited[i]=true;
    if(i<questions.length-1) current=i+1;
    render();
  }
  function markReview(){
    ensureState(); touch(2000);
    const i=Number(current)||0;
    answers[i]=pendingAnswers[i] ?? null;
    marked[i]=true;
    visited[i]=true;
    if(i<questions.length-1) current=i+1;
    render();
  }
  function clearResponse(){
    ensureState(); touch(1500);
    const i=Number(current)||0;
    pendingAnswers[i]=null;
    answers[i]=null;
    marked[i]=false;
    visited[i]=true;
    render();
  }
  function bind(){
    const pairs=[
      ['ui17MarkReview',markReview],['ui17SaveNext',saveNext],['ui17Clear',clearResponse],
      ['ui21MarkReview',markReview],['ui21SaveNext',saveNext],['ui21Clear',clearResponse]
    ];
    pairs.forEach(([id,fn])=>{
      const el=document.getElementById(id);
      if(el){ el.onclick=fn; el.dataset.singleStateBound='1'; }
    });
  }
  window.MISSION_TES_CBT=Object.assign(window.MISSION_TES_CBT||{}, {saveNext,markReview,clearResponse,bind});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind);
  else bind();
  setInterval(bind,500);
})();


/* ===== Original inline script 15 — id: mission-v31-final-hardening-js ===== */

(function(){
  /* Keep the historical result cache scoped to the authenticated student. */
  window.MISSION_TES_FINAL_HARDENING=true;
})();


/* ===== Original inline script 16 — id: mission-v36-admin-workspace-isolation ===== */

(function(){
  function adminMode(){
    return document.body.classList.contains('admin-ui');
  }

  function selectedAdminSection(){
    const active = document.querySelector('#adminReferenceSidebar [data-section].active, #adminReferenceSidebar button.active, #adminSectionNav [data-section].active, #adminSectionNav button.active');
    if(active) return String(active.getAttribute('data-section')||'').toLowerCase();
    const result = document.getElementById('adminNavResult');
    if(result && result.classList.contains('active')) return 'result';
    const test = document.getElementById('adminNavTest');
    if(test && test.classList.contains('active')) return 'test-making';
    const main = document.getElementById('adminNavAdmin');
    if(main && main.classList.contains('active')) return 'admin-section';
    return '';
  }

  function hideResultHard(){
    ['resultManagement','resultSection'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
      }
    });
    document.querySelectorAll('.resultManagement,.result-section').forEach(el=>{
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('opacity','0','important');
      el.style.setProperty('pointer-events','none','important');
    });
  }

  function releaseResult(){
    ['resultManagement','resultSection'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
      }
    });
    document.querySelectorAll('.resultManagement,.result-section').forEach(el=>{
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
      el.style.removeProperty('pointer-events');
    });
  }

  function enforce(){
    if(!adminMode()) return;
    const sec=selectedAdminSection();
    if(sec!=='result' && sec!=='results' && sec!=='result-management'){
      hideResultHard();
    }else{
      releaseResult();
    }
  }

  function bind(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('#adminReferenceSidebar [data-section], #adminReferenceSidebar button, #adminSectionNav [data-section], #adminSectionNav button');
      if(!b) return;
      setTimeout(enforce,0);
      setTimeout(enforce,80);
      setTimeout(enforce,300);
    },true);

    // Older result scripts can re-open the result root after navigation.
    const observer=new MutationObserver(function(){
      if(adminMode() && selectedAdminSection()!=='result' && selectedAdminSection()!=='results' && selectedAdminSection()!=='result-management'){
        hideResultHard();
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(enforce,0);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();


/* V6.0.3: legacy result-section MutationObserver retired; authoritative Admin controller owns navigation. */

/* ===== Original inline script 18 — id: mission-v38-admin-attempt-back-fix ===== */

(function(){
  'use strict';
  function isAdminHistoricalReview(){
    /* V5.0.3 final navigation fix:
       A historical attempt object can exist for BOTH student and admin
       reviews. It must never be used to infer Admin mode.
       Admin historical review is valid only with a real Admin session and
       no active student session. */
    return !!(
      window.__missionTESHistoricalAttempt &&
      typeof adminLoggedIn !== 'undefined' &&
      adminLoggedIn === true &&
      (!currentStudent) &&
      document.getElementById('adminOnlyDashboard')?.classList.contains('hidden') &&
      !document.getElementById('result')?.classList.contains('hidden')
    );
  }
  function returnToAdminResultManagement(){
    try{
      window.__missionTESReviewSnapshot=null;
      window.__missionTESHistoricalAttempt=null;
      document.getElementById('result')?.classList.add('hidden');
      document.getElementById('exam')?.classList.add('hidden');
      /* The attempt-review screen hides #home. The Admin dashboard is inside
         #home, so restore the parent before restoring the Admin dashboard. */
      document.getElementById('home')?.classList.remove('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
      document.getElementById('studentOnlyDashboard')?.classList.add('hidden');
      if(typeof showDashboardTab==='function') showDashboardTab('admin');
      if(typeof activateAdminPanel==='function') activateAdminPanel('result');
      else if(typeof window.showAdminSection==='function') window.showAdminSection('result');
      if(typeof renderResultRows==='function') renderResultRows();
      const back=document.getElementById('resultBackBtn');
      if(back){
        back.textContent='← BACK TO RESULT MANAGEMENT';
        back.onclick=returnToAdminResultManagement;
      }
    }catch(e){
      console.error('V4.2 admin result return failed:',e);
      document.getElementById('result')?.classList.add('hidden');
      document.getElementById('home')?.classList.remove('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
    }
  }
  window.returnToAdminResultManagement=returnToAdminResultManagement;

  document.addEventListener('click',function(e){
    const b=e.target.closest('#resultBackBtn');
    if(!b) return;
    /* Never intercept student navigation with the Admin return handler. */
    if(typeof adminLoggedIn === 'undefined' || adminLoggedIn !== true || currentStudent) return;
    if(!isAdminHistoricalReview()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    returnToAdminResultManagement();
  },true);
})();


