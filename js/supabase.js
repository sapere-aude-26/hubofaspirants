/* HUB OF ASPIRANTS V6.0.9 — Supabase/data foundation.
 * Existing authoritative compatibility logic moved verbatim from the stabilized monolith.
 */
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
  if(window.HOA_SERVICES?.student){
    const data=await window.HOA_SERVICES.student.list();
    const users=(data||[]).map(studentFromRow);
    localStorage.setItem("missionTES_users_cache",JSON.stringify(users));
    return users;
  }
  return;
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

