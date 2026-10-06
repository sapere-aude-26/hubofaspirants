/* HOA V8.88 — Pure Question Parser / Validator
 * No DOM ownership. No quiz engine patches. No navigation hooks.
 * Consumed by Admin Mock Test Question Feeding only.
 */
(function(root){
  'use strict';
  const VERSION='V8.88';
  const MAX_OPTIONS=10;
  const IMAGE_TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
  const MAX_IMAGE_BYTES=10*1024*1024;

  const trim=v=>String(v??'').replace(/\uFEFF/g,'').trim();
  const answerIndex=v=>{
    const x=trim(v).toUpperCase();
    if(!x)return 0;
    if(/^[A-J]$/.test(x))return x.charCodeAt(0)-64;
    const n=Number(x);return Number.isInteger(n)?n:0;
  };
  const detectOptionLine=line=>{
    const m=String(line).match(/^\s*(\d{1,2}|[A-Ja-j])[.)]\s*(.*)$/);
    return m?{key:m[1].toUpperCase(),text:m[2]||''}:null;
  };
  const imageMarker=v=>{
    const x=trim(v);
    return !!x&&/^\[(?:QUESTION\s+IMAGE|EXPLANATION\s+IMAGE|IMAGE|OPTION\s+IMAGE)(?:\s*[:].*)?\]$/i.test(x);
  };
  const createQ=()=>({question_type:'mcq',question_text:'',question_image_path:null,source:'',options:[],correct_answer:0,correct_value:null,tolerance:null,explanation_text:'',explanation_image_path:null,_media:{question:null,options:[],explanation:null},errors:[],warnings:[]});

  function parseTextFeed(text,forcedType){
    text=String(text??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    const lines=text.split('\n');
    const starts=[];
    lines.forEach((line,i)=>{if(/^\s*(Q|Question)\s*:/i.test(line))starts.push(i);});
    if(!starts.length&&trim(text))starts.push(0);
    const out=[];
    for(let bi=0;bi<starts.length;bi++){
      const block=lines.slice(starts[bi],bi+1<starts.length?starts[bi+1]:lines.length);
      if(!block.some(x=>trim(x)))continue;
      const q=createQ();let section='question',currentOpt=-1,explicitType='';
      const append=(target,value)=>{value=String(value??'');if(!value)return;if(target==='question')q.question_text=q.question_text?`${q.question_text}\n${value}`:value;else if(target==='explanation')q.explanation_text=q.explanation_text?`${q.explanation_text}\n${value}`:value;else if(target==='option'&&currentOpt>=0)q.options[currentOpt].text=q.options[currentOpt].text?`${q.options[currentOpt].text}\n${value}`:value;};
      for(const raw of block){
        const line=trim(raw);if(!line)continue;let m;
        if((m=line.match(/^\s*(Q|Question)\s*:\s*(.*)$/i))){section='question';currentOpt=-1;if(imageMarker(m[2]))q._media._questionPlaceholder=true;else append('question',m[2]);continue;}
        if((m=line.match(/^\s*(Question\s*Type)\s*:\s*(.*)$/i))){explicitType=trim(m[2]).toLowerCase();section='type';currentOpt=-1;continue;}
        if((m=line.match(/^\s*I\s*:\s*(.*)$/i))){q.source=m[1]??'';section='source';currentOpt=-1;continue;}
        if((m=line.match(/^\s*(An|Answer)\s*:\s*(.*)$/i))){q.correct_answer=m[2]??'';section='answer';currentOpt=-1;continue;}
        if((m=line.match(/^\s*(Correct\s*Answer)\s*:\s*(.*)$/i))){q.correct_value=m[2]??'';q.correct_answer='';section='answer';currentOpt=-1;continue;}
        if((m=line.match(/^\s*(Tolerance)\s*:\s*(.*)$/i))){q.tolerance=m[2]??'';section='tolerance';currentOpt=-1;continue;}
        if((m=line.match(/^\s*(Ex|Explanation)\s*:\s*(.*)$/i))){section='explanation';currentOpt=-1;if(imageMarker(m[2]))q._media._explanationPlaceholder=true;else append('explanation',m[2]);continue;}
        const opt=detectOptionLine(raw);
        if(opt){
          const idx=/^[A-J]$/.test(opt.key)?opt.key.charCodeAt(0)-64:Number(opt.key);
          if(idx>=1&&idx<=MAX_OPTIONS){currentOpt=idx-1;while(q.options.length<=currentOpt)q.options.push({text:'',image:null,_placeholder:false,_file:null});if(imageMarker(opt.text)){q.options[currentOpt].text='';q.options[currentOpt]._placeholder=true;}else q.options[currentOpt].text=opt.text;section='option';continue;}
        }
        if(section==='question'&&imageMarker(line)){q._media._questionPlaceholder=true;continue;}
        if(section==='option'&&currentOpt>=0&&imageMarker(line)){q.options[currentOpt]._placeholder=true;continue;}
        if(section==='explanation'&&imageMarker(line)){q._media._explanationPlaceholder=true;continue;}
        if(section==='question')append('question',line);
        else if(section==='option')append('option',line);
        else if(section==='explanation')append('explanation',line);
        else if(section==='answer'&&q.correct_value===null)q.correct_value=q.correct_value?`${q.correct_value}\n${line}`:line;
      }
      const explicitNum=/^(?:num|numerical)/i.test(explicitType);
      const ansRaw=trim(q.correct_answer);
      const ansNum=/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(ansRaw);
      q.question_type=(forcedType&&forcedType!=='auto')?forcedType:(explicitNum||q.correct_value!==null||q.tolerance!==null||(ansNum&&q.options.length===0)?'numerical':'mcq');
      if(q.question_type==='numerical'&&q.correct_value===null)q.correct_value=ansRaw;
      if(q.question_type==='mcq')q.correct_answer=answerIndex(q.correct_answer);
      else {if(q.tolerance!==null&&trim(q.tolerance)!=='')q.tolerance=Number(q.tolerance);if(q.correct_value!==null&&q.correct_value!=='')q.correct_value=Number(q.correct_value);q.correct_answer=0;q.options=[];}
      q.options=q.options.map(o=>({text:trim(o.text),image:o.image||null,_file:o._file||null,_placeholder:!!o._placeholder}));
      out.push(q);
    }
    return out;
  }

  function csvRows(text){
    text=String(text??'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
    const first=(text.split('\n')[0]||'');let delim=',';if(first.includes('\t')&&!first.includes(','))delim='\t';else if(first.includes(';')&&first.split(';').length>first.split(',').length)delim=';';
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(quoted&&n==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delim&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell);if(row.some(x=>trim(x)!==''))rows.push(row);row=[];cell='';}else cell+=c;}
    if(cell!==''||row.length){row.push(cell);if(row.some(x=>trim(x)!==''))rows.push(row);}return rows;
  }
  function csvParse(text){
    const rows=csvRows(text);if(!rows.length)throw new Error('CSV has no rows.');
    const norm=x=>trim(x).toLowerCase().replace(/\s+/g,' ');const head=rows[0].map(norm);
    const hasHeader=head.some(x=>['question','question text','source','correct option','answer','correct answer','explanation'].includes(x));
    const idx=name=>head.findIndex(x=>x===name);
    const col=(row,names,fallback=-1)=>{for(const n of names){const i=idx(norm(n));if(i>=0)return trim(row[i]||'');}return fallback>=0?trim(row[fallback]||''):'';};
    const out=[];const start=hasHeader?1:0;
    for(let r=start;r<rows.length;r++){
      const row=rows[r];if(row.every(x=>trim(x)===''))continue;const q=createQ();q.question_text=col(row,['question text','question'],0);q.source=hasHeader?col(row,['source','information','i'],-1):'';
      const type=col(row,['question type','type'],-1).toLowerCase();q.question_type=/numerical/.test(type)?'numerical':'mcq';
      if(hasHeader){for(let n=1;n<=10;n++){const tv=col(row,[`option ${n}`,`option_${n}`,`option${n}`,String(n)],-1);const img=col(row,[`option ${n} image`,`option ${n} image path`,`option${n} image`],-1);if(tv||img)q.options.push({text:tv,image:img||null,_file:null,_placeholder:false});}}
      else for(let n=1;n<=Math.min(4,Math.max(0,row.length-3));n++){const tv=trim(row[n]||'');if(tv)q.options.push({text:tv,image:null,_file:null,_placeholder:false});}
      const cv=col(row,['correct option','correct answer','answer'],hasHeader?-1:5);q.explanation_text=col(row,['explanation','explanation text'],hasHeader?-1:6);q.correct_answer=q.question_type==='numerical'?0:answerIndex(cv);q.correct_value=q.question_type==='numerical'?col(row,['correct value','correct answer','answer'],hasHeader?-1:1):null;const tol=col(row,['tolerance'],-1);q.tolerance=tol===''?null:Number(tol);q.question_image_path=col(row,['question image','question image path'],-1)||null;q.explanation_image_path=col(row,['explanation image','explanation image path'],-1)||null;
      if(q.question_type==='numerical'){q.correct_value=q.correct_value===''?null:Number(q.correct_value);if(Number.isNaN(q.correct_value))q.correct_value=null;}
      out.push(q);
    }
    if(!out.length)throw new Error('No question rows found in CSV.');return out;
  }
  function normalise(q){
    q=q||createQ();q.question_type=q.question_type==='numerical'?'numerical':'mcq';q.question_text=String(q.question_text??'');q.source=String(q.source??'');q.question_image_path=q.question_image_path||null;q.explanation_image_path=q.explanation_image_path||null;q.options=Array.isArray(q.options)?q.options.map(o=>({text:String(o?.text??''),image:o?.image||null,_file:o?._file||null,_placeholder:!!o?._placeholder})):[];q.explanation_text=String(q.explanation_text??q.explanation??'');if(q.question_type==='mcq'){q.correct_answer=Number.isInteger(q.correct_answer)?q.correct_answer:answerIndex(q.correct_answer);q.correct_value=null;q.tolerance=null;}else{q.correct_value=(q.correct_value===''||q.correct_value===null||q.correct_value===undefined)?null:Number(q.correct_value);q.tolerance=(q.tolerance===''||q.tolerance===null||q.tolerance===undefined)?null:Number(q.tolerance);q.correct_answer=0;q.options=[];}if(!q._media)q._media={question:null,options:[],explanation:null};return q;
  }
  function validate(q,index){
    q=normalise(q);q.errors=[];q.warnings=[];const p=index+1;if(!trim(q.question_text)&&!(q.question_image_path||q._media?.question))q.errors.push(`Question ${p}: No question text or question image found.`);
    if(q.question_type==='mcq'){if(q.options.length<2)q.errors.push(`Question ${p}: Minimum 2 options are required.`);if(q.options.length>10)q.errors.push(`Question ${p}: Maximum 10 options are allowed.`);q.options.forEach((o,i)=>{if(!trim(o.text)&&!(o.image||o._file))q.errors.push(`Question ${p}: Option ${i+1} is empty.`);});if(!q.correct_answer)q.errors.push(`Question ${p}: Correct answer is required.`);else if(q.correct_answer<1||q.correct_answer>q.options.length)q.errors.push(`Question ${p}: Correct answer "${q.correct_answer}" does not match the available options.`);}else{if(q.correct_value===null||!Number.isFinite(Number(q.correct_value)))q.errors.push(`Question ${p}: Numeric correct answer is required.`);if(q.tolerance!==null&&q.tolerance!==''&&(!Number.isFinite(Number(q.tolerance))||Number(q.tolerance)<0))q.errors.push(`Question ${p}: Tolerance must be a non-negative number.`);}
    if(q._media?._questionPlaceholder&&!(q.question_image_path||q._media?.question))q.errors.push(`Question ${p}: A question image placeholder is present but no image was uploaded.`);if(q._media?._explanationPlaceholder&&!(q.explanation_image_path||q._media?.explanation))q.warnings.push(`Question ${p}: An explanation image placeholder is present but no image was uploaded.`);q.options.forEach((o,i)=>{if(o._placeholder&&!(o.image||o._file))q.warnings.push(`Question ${p}: Option ${i+1} expects an image.`);});q.status=q.errors.length?'invalid':(q.warnings.length?'warning':'valid');return q;
  }
  function looksCsv(input){
    const first=String(input??'').replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>trim(x)!=='')||'';
    if(/^\s*(Q|Question)\s*:/i.test(first))return false;
    const delimited=/[\t,;]/.test(first);if(!delimited)return false;
    const rows=csvRows(input);return rows.length>=2&&(rows[0]?.length||0)>=5;
  }
  function parse(input,forcedType='auto',format='auto'){
    input=String(input??'');if(!trim(input))throw new Error('Paste question data first.');
    const first=String(input).replace(/^\uFEFF/,'').split(/\r?\n/).find(x=>trim(x)!=='')||'';
    const csvHeader=/^[\s]*(?:question(?:\s*text)?|source|option\s*1)(?:\s*[,\t;]|$)/i.test(first);
    const isCsv=format==='csv'||csvHeader||looksCsv(input);
    const parsed=isCsv?csvParse(input):parseTextFeed(input,forcedType);
    parsed.forEach((q,i)=>validate(q,i));
    return parsed;
  }
  function assertImage(file){if(!file)throw new Error('No image selected.');if(!IMAGE_TYPES.has(file.type))throw new Error('Unsupported image type. Use PNG, JPG, WEBP or GIF.');if(file.size>MAX_IMAGE_BYTES)throw new Error('Image exceeds the 10 MB limit.');return true;}

  root.HOAPureQuestionParser={VERSION,MAX_OPTIONS,parse,validate,normalise,assertImage};
})(typeof window!=='undefined'?window:globalThis);
