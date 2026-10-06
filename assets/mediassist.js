/* MediAssist — "AniBuddy", the AnI-HealthcareServices help assistant.
   Runs entirely in the browser: answers from the site's own data (departments, doctors,
   OPD days, holidays, slot configuration and live free slots from the appointment engine).
   It gives no medical advice and does not ask for or store personal details. */
(function(){
const SITE={
  name:"AnI-HealthcareServices",
  casualty:"+91 80 4000 1000", opd:"+91 80 4000 1100", admissionsPhone:"+91 80 4000 2000",
  admissionsEmail:"admissions@ani-healthcareservices.example",
  address:"Hospital Road, Sector 12, Bengaluru 560 000, Karnataka",
  portal:"patient/index.html",
};
const SYN={ // everyday words → department code; earlier entries win (e.g. a child with fever → Paediatrics)
  EMR:["emergency","casualty","accident","trauma","ambulance","urgent"],
  PED:["paediatrics","pediatrics","paediatric","pediatric","child","children","kid","kids","baby","infant","vaccination","vaccine"],
  OBG:["obstetrics","gynaecology","gynecology","gynaec","gynec","obg","pregnancy","pregnant","antenatal","delivery","menstrual","periods","fertility","menopause"],
  CAR:["cardiology","cardiologist","heart","cardiac","ecg","echo","angiography","chest pain"],
  NEU:["neurology","neurologist","brain","nerve","stroke","epilepsy","seizure","migraine","headache"],
  ORT:["orthopaedics","orthopedics","ortho","bone","bones","fracture","joint","knee","back pain","spine","shoulder"],
  ENT:["ent","ear","nose","throat","sinus","hearing","tonsil"],
  OPH:["ophthalmology","eye","eyes","vision","cataract","glaucoma","spectacles"],
  RAD:["radiology","x-ray","xray","x ray","scan","ultrasound","ct","mri","sonography"],
  LAB:["pathology","laboratory","lab","blood test","biopsy","sample","report"],
  SUR:["surgery","surgeon","hernia","gallbladder","appendix","piles","laparoscopic"],
  MED:["general medicine","medicine","physician","fever","diabetes","sugar","bp","blood pressure","hypertension","cold","cough","thyroid"],
};
const SELF_HARM=["suicide","suicidal","kill myself","end my life","self harm","self-harm","hurt myself"];
const NOT_OFFERED=[
  {name:"Dermatology (skin)",words:["skin","dermatology","dermatologist","rash","acne","eczema","psoriasis"]},
  {name:"Dental",words:["dental","dentist","teeth","tooth","toothache","gums"]},
  {name:"Psychiatry (mental health)",words:["psychiatry","psychiatrist","mental health","depression","anxiety","therapist"],mental:true},
];
const RED_FLAGS=["chest pain","can't breathe","cannot breathe","breathless","unconscious","fainted","bleeding heavily","heavy bleeding","accident","stroke","seizure","fits","suicide","poison","snake bite","severe pain","heart attack"];

/* ---------- Data (loaded on first open) ---------- */
let ready=null;
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s);});}
function ensureData(){
  if(ready)return ready;
  ready=(async()=>{if(!window.SEED)await loadScript("portal/assets/data.js");if(!window.Portal)await loadScript("portal/assets/portal.js");if(!window.Appt)await loadScript("portal/assets/appt.js");})();
  return ready;
}
const P=()=>window.Portal, A=()=>window.Appt, db=()=>window.Portal.db;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const depts=()=>A().deptsInOrder();
const deptByCode=c=>db().get("departments").find(d=>d.code===c);
const fmtDay=iso=>new Date(iso+"T00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"});
const an=w=>/^[aeiou]/i.test(w)?"an":"a";
const inr=n=>n===0?"free":"₹"+Number(n).toLocaleString("en-IN");

/* ---------- Understanding the question ---------- */
const norm=s=>" "+s.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9:&/'+\- ]+/g," ").replace(/\s+/g," ").trim()+" ";
const has=(q,words)=>words.some(w=>q.includes(" "+w+" ")||(w.includes(" ")&&q.includes(w)));
function findDept(q){
  for(const [code,words] of Object.entries(SYN)){if(has(q,words))return deptByCode(code);}
  return null;
}
function findDoctor(q){
  const docs=db().get("staff").filter(s=>s.role==="Doctor"&&s.status==="Active");
  let best=null,score=0;
  docs.forEach(d=>{const parts=d.name.replace(/^Dr\.\s*/,"").toLowerCase().split(/\s+/);
    const sc=parts.filter(p=>p.length>2&&q.includes(" "+p+" ")).length*(parts.length>1?1:0.5);
    if(sc>score){score=sc;best=d;}});
  return score>=1?best:null;
}
function findDate(q){
  const T=P().today(),add=n=>P().addDays(T,n);
  if(has(q,["day after tomorrow"]))return add(2);
  if(has(q,["tomorrow","tmrw","tommorow","tomorow"]))return add(1);
  if(has(q,["today","now","tonight"]))return T;
  const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  for(let i=0;i<7;i++){if(q.includes(" "+days[i]+" ")||q.includes(" "+days[i].slice(0,3)+" ")){const cur=new Date(T+"T00:00").getDay();let n=(i-cur+7)%7;if(n===0&&!q.includes(" today"))n=has(q,["next"])?7:0;return add(n);}}
  const months=["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  let m=q.match(/ (\d{1,2})(?:st|nd|rd|th)? ?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* /)||q.match(/ (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2}) /);
  if(m){const day=+(m[1].match(/\d/)?m[1]:m[2]),mon=months.indexOf((m[1].match(/\d/)?m[2]:m[1]).slice(0,3));return pickYear(day,mon);}
  m=q.match(/ (\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))? /);
  if(m)return pickYear(+m[1],+m[2]-1,m[3]);
  return null;
}
function pickYear(day,mon,yr){
  const T=P().today();let y=yr?(+yr<100?2000+ +yr:+yr):+T.slice(0,4);
  let iso=`${y}-${String(mon+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  if(!yr&&iso<T){y++;iso=`${y}-${String(mon+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;}
  return isNaN(new Date(iso+"T00:00"))?null:iso;
}

/* ---------- Answers ---------- */
const link=(href,text)=>`<a href="${href}">${esc(text)}</a>`;
const portalLink=()=>link(SITE.portal,"Patient Portal");
const say=(html,chips=[])=>({html,chips});
const DEFAULT_CHIPS=["Book an appointment","OPD timings","Find a doctor","Emergency","Visiting hours","Fees"];

function emergency(){return say(`<b>If this is an emergency, call 108 now</b> or come straight to <b>Casualty, Gate 2</b> — open 24×7.<br>Casualty desk: <b>${SITE.casualty}</b>`,["Where is the hospital?","OPD timings"]);}
function selfHarm(){return say(`I'm really sorry you're going through this. You don't have to face it alone.<br><b>Call 108</b> or come to Casualty, Gate 2, any time — we're open 24×7.<br>You can also call <b>Tele-MANAS on 14416</b>, India's free 24×7 mental health helpline.`,["Contact"]);}
function notOffered(x){
  return say(`We don't have a separate <b>${esc(x.name)}</b> department yet. A <b>General Medicine</b> doctor can see you first and refer you if needed.${x.mental?`<br>For mental health support any time, call <b>Tele-MANAS on 14416</b> (free, 24×7).`:""}`,["General Medicine slots today","General Medicine slots tomorrow"]);
}
function opdTimings(dept){
  const c=A().cfg();
  let html=`OPD registration is <b>08:00–13:00</b>, Monday to Saturday; consultations run till 16:00. Online slots: morning ${c.sessions.AM.start}–${c.sessions.AM.end}, afternoon ${c.sessions.PM.start}–${c.sessions.PM.end}. OPD is closed on Sundays; <b>Emergency is open 24×7</b>.`;
  if(dept)html+=`<br><br>${deptDays(dept)}`;
  return say(html,dept?[`${dept.name} slots tomorrow`,`Doctors in ${dept.name}`]:["Which departments do you have?","Book an appointment"]);
}
function deptDays(dept){
  if(!A().isOpd(dept.id))return `<b>${esc(dept.name)}</b> is open 24×7 for walk-ins at Casualty, Gate 2. It doesn't take appointments.`;
  const s=db().get("deptSchedule").find(x=>x.id===dept.id),names=["Mon","Tue","Wed","Thu","Fri","Sat"];
  const on=s?names.filter((n,i)=>s.days[i]):names;
  const hrs={LAB:"07:00–20:00",RAD:"08:00–20:00"}[dept.code];
  return `<b>${esc(dept.name)}</b> (Block ${esc(dept.block)}) runs OPD on <b>${on.length===6?"Monday to Saturday":on.join(", ")}</b>${hrs?`, ${hrs}`:""}.`;
}
function deptOnDate(dept,date){
  if(!A().isOpd(dept.id))return say(`<b>${esc(dept.name)}</b> is open 24×7 — walk in at Casualty, Gate 2.`,["Emergency"]);
  const H=A().holidayOn(dept.id,date),open=A().deptOpen(dept.id,date)&&!H;
  let html=open?`Yes — <b>${esc(dept.name)}</b> OPD runs on ${fmtDay(date)}.`:`No — <b>${esc(dept.name)}</b> OPD doesn't run on ${fmtDay(date)}${H?` (${esc(H.name)})`:""}.`;
  html+=`<br>${deptDays(dept)}`;
  if(open)html+=`<br>Ask "${esc(dept.name)} slots ${fmtDay(date).split(",")[0].toLowerCase()}" for free times.`;
  else{let d=date;for(let k=0;k<14;k++){d=P().addDays(d,1);if(A().deptOpen(dept.id,d)&&!A().holidayOn(dept.id,d)){html+=`<br>Next OPD day: <b>${fmtDay(d)}</b>.`;break;}}}
  return say(html,[`${dept.name} slots tomorrow`,`Doctors in ${dept.name}`]);
}
function deptHead(dept){
  const h=A().doctors(dept.id).find(d=>d.designation==="Professor & Head")||db().get("staff").find(s=>s.name===dept.head);
  return say(h?`The head of <b>${esc(dept.name)}</b> is <b>${esc(h.name)}</b>, ${esc(h.qual)}, with ${h.exp} years' experience.`:`I don't have the head of ${esc(dept.name)} on record.`,[`Doctors in ${dept.name}`,h&&A().isOpd(dept.id)?`Slots with ${h.name} tomorrow`:"OPD timings"].filter(Boolean));
}
function listDepts(){
  return say(`We have 12 departments:<ul>${depts().map(d=>`<li>${esc(d.name)}${A().isOpd(d.id)?"":" — 24×7 walk-in"}</li>`).join("")}</ul>Ask me about any of them, for example "Cardiology days" or "ENT doctors".`,["Cardiology days","Doctors in Paediatrics","OPD timings"]);
}
function doctorsIn(dept){
  const docs=A().doctors(dept.id).sort((x,y)=>(y.designation==="Professor & Head")-(x.designation==="Professor & Head"));
  return say(`<b>${esc(dept.name)}</b> doctors:<ul>${docs.map(d=>`<li><b>${esc(d.name)}</b> — ${esc(d.designation)}, ${esc(d.qual)}, ${d.exp} yrs</li>`).join("")}</ul>${A().isOpd(dept.id)?`Ask "${esc(dept.name)} slots tomorrow" to see free times.`:"Walk in 24×7 at Casualty, Gate 2."}`,
    A().isOpd(dept.id)?[`${dept.name} slots tomorrow`,`${dept.name} days`]:["Emergency"]);
}
function doctorInfo(d,date){
  const dept=db().find("departments",d.dept);
  let html=`<b>${esc(d.name)}</b> — ${esc(d.designation)}, ${esc(dept.name)}<br>${esc(d.qual)} · ${d.exp} years' experience`;
  if(!A().isOpd(d.dept))return say(html+`<br>Emergency doctors see patients 24×7 at Casualty, Gate 2.`,["Emergency"]);
  return say(html+"<br><br>"+slotsHTML(d,date),[`Slots with ${d.name} tomorrow`,"How do I book?"]);
}
function slotsHTML(d,date){
  if(date){
    const r=A().slots(d.id,date);
    if(!r.ok)return `${esc(d.name)} isn't available on ${fmtDay(date)}: ${esc(r.msg)}${nextLine(d,date)}`;
    const free=r.slots.filter(s=>s.free);
    if(!free.length)return `${esc(d.name)} is fully booked on ${fmtDay(date)}.${nextLine(d,date)}`;
    return `Free slots with ${esc(d.name)} on <b>${fmtDay(date)}</b>: ${free.slice(0,8).map(s=>`<span class="ma-slot">${s.time}</span>`).join(" ")}${free.length>8?` and ${free.length-8} more`:""}.<br>Fee ${inr(A().feeFor(d.id,"New"))}. Book in the ${portalLink()}.`;
  }
  const n=A().nextAvailable(d.id);
  return n?`Next available: <b>${fmtDay(n.date)} at ${n.slot}</b>. Fee ${inr(A().feeFor(d.id,"New"))}. Book in the ${portalLink()}.`:`No free slots in the next ${A().cfg().bookingWindowDays} days. Please call the OPD desk on ${SITE.opd}.`;
}
function nextLine(d,from){const n=A().nextAvailable(d.id,P().addDays(from,1));return n?`<br>Next available: <b>${fmtDay(n.date)} at ${n.slot}</b>.`:"";}
function deptSlots(dept,date){
  if(!A().isOpd(dept.id))return say(A().WALK_IN_MSG,["Emergency"]);
  const day=date||P().today();
  const rows=A().doctors(dept.id).map(d=>{const r=A().slots(d.id,day);const f=r.ok?r.slots.filter(s=>s.free):[];return {d,r,f};});
  const open=rows.filter(x=>x.f.length);
  if(!open.length){
    const nexts=A().doctors(dept.id).map(d=>({d,n:A().nextAvailable(d.id,P().addDays(day,1))})).filter(x=>x.n).sort((a,b)=>(a.n.date+a.n.slot).localeCompare(b.n.date+b.n.slot));
    const why=rows[0]&&!rows[0].r.ok?` (${esc(rows[0].r.msg)})`:"";
    return say(`No free ${esc(dept.name)} slots on ${fmtDay(day)}${why}.${nexts.length?`<br>Earliest: <b>${esc(nexts[0].d.name)}, ${fmtDay(nexts[0].n.date)} at ${nexts[0].n.slot}</b>.`:""}`,[`${dept.name} days`,"Book an appointment"]);
  }
  return say(`Free <b>${esc(dept.name)}</b> slots on <b>${fmtDay(day)}</b>:<ul>${open.map(x=>`<li><b>${esc(x.d.name)}</b>: ${x.f.slice(0,5).map(s=>`<span class="ma-slot">${s.time}</span>`).join(" ")}${x.f.length>5?` +${x.f.length-5} more`:""}</li>`).join("")}</ul>Book in the ${portalLink()}.`,["How do I book?","Fees"]);
}
function fees(){const c=A().cfg();return say(`Consultation fees: <b>${inr(c.fees.general)}</b> for General Medicine, <b>${inr(c.fees.specialist)}</b> for specialists. Follow-up within ${c.followUpFreeDays} days: <b>${inr(c.fees.followUp)}</b>. You can pay online in the ${portalLink()} or at the counter.`,["Book an appointment","Insurance"]);}
function howToBook(){const c=A().cfg();return say(`Booking takes about a minute:<ol><li>Open the ${portalLink()} and sign in (or register with your mobile and date of birth).</li><li>Choose a department, doctor, date and time.</li><li>Pay online now, or at the hospital.</li><li>On the day, check in from ${c.checkInBeforeMins} minutes before your slot to get a token and track the queue.</li></ol>You can reschedule or cancel up to ${c.cancelCutoffHours} hours before. Or call the OPD desk on ${SITE.opd}.`,["Reschedule or cancel","Fees","Find a doctor"]);}
function changes(){const c=A().cfg();return say(`In the ${portalLink()}, open <b>My appointments</b> and choose <b>Reschedule</b> or <b>Cancel</b>. Changes close <b>${c.cancelCutoffHours} hours</b> before your slot; after that, please call ${SITE.opd}. If you paid online and cancel, the refund goes back to your original payment method.`,["Book an appointment","Check-in and queue"]);}
function checkin(){const c=A().cfg();return say(`On the day, open <b>My appointments</b> in the ${portalLink()} and tap <b>Check in</b> from ${c.checkInBeforeMins} minutes before your slot. You'll get a token like <b>MED-04</b> and can see how many people are ahead of you and the expected wait.`,["Book an appointment","OPD timings"]);}
function visiting(){return say(`<b>Visiting hours</b><ul><li>Wards: 4:00–7:00 PM daily, one attendant pass per patient</li><li>ICU: 11:00–11:30 AM and 5:00–5:30 PM; family update at 5:30 PM</li><li>Pharmacy: open 24 hours, ground floor, Block A</li><li>Blood bank: 24 hours; donors welcome 9:00 AM–5:00 PM</li></ul>`,["Where is the hospital?","Emergency"]);}
function contact(){return say(`<b>${SITE.name}</b><br>${SITE.address}<br>Casualty (24×7): <b>${SITE.casualty}</b><br>OPD desk: <b>${SITE.opd}</b><br>Student admissions: ${SITE.admissionsPhone} · ${SITE.admissionsEmail}`,["OPD timings","Visiting hours"]);}
function programmes(){return say(`Medical programmes:<ul><li><b>MBBS</b> — 4.5 years + internship, NEET-UG, 150 seats</li><li><b>MD / MS</b> — 18 specialities, NEET-PG, 94 seats</li><li><b>DM / MCh</b> — 12 seats, NEET-SS</li><li><b>B.Sc Nursing</b> — 100 seats</li><li><b>B.Sc Allied Health</b> — 160 seats</li></ul>See ${link("#admissions","How to Apply")} for the 2027 steps, or call ${SITE.admissionsPhone}.`,["How to apply","Contact"]);}
function apply(){return say(`MBBS 2027: qualify <b>NEET-UG</b> (May) → register for counselling (July) → list us in choice filling (July–Aug) → seat allotment (Aug) → foundation course starts (Sep). Details under ${link("#admissions","How to Apply")}.`,["Programmes","Contact"]);}
function insurance(){return say(`We offer <b>cashless care</b> under major insurance and government schemes, including Ayushman Bharat and CGHS. Please bring your card and photo ID; the insurance desk at OPD registration will confirm your cover.`,["Fees","Book an appointment"]);}
function facilities(){return say(`We are a <b>1,050-bed</b> tertiary care hospital with <b>96 ICU beds</b>, <b>14 operating theatres</b>, a level-1 trauma centre, a 24-hour pharmacy and laboratory, and a medical institute on the same campus.`,["Which departments do you have?","Visiting hours"]);}
function holidays(q){
  const T=P().today(),H=db().get("holidays").filter(h=>h.status==="Active"&&h.date>=T).sort((a,b)=>a.date.localeCompare(b.date));
  const named=H.find(h=>q.includes(" "+h.name.toLowerCase().split(/[ —-]/)[0]+" "));
  const show=named?[named]:H.slice(0,4);
  return say(`${named?"":"Upcoming holidays:"}<ul>${show.map(h=>`<li><b>${fmtDay(h.date)}</b> — ${esc(h.name)}${h.dept?` (${esc(P().lookup.dept(h.dept))})`:""}: OPD ${esc(h.opd.toLowerCase())}</li>`).join("")}</ul>Emergency stays open 24×7 on all holidays.`,["OPD timings","Book an appointment"]);
}
function symptomHelp(q,dept){
  const d=dept||deptByCode("MED");
  return say(`I can't give medical advice, but for this ${an(d.name)} <b>${esc(d.name)}</b> doctor is a good place to start.${A().isOpd(d.id)?`<br>${slotsHTML(A().doctors(d.id).map(x=>({x,n:A().nextAvailable(x.id)})).filter(o=>o.n).sort((a,b)=>(a.n.date+a.n.slot).localeCompare(b.n.date+b.n.slot))[0]?.x||A().doctors(d.id)[0])}`:""}<br><br>If symptoms are severe or sudden, call <b>108</b> or come to Casualty, Gate 2.`,[`Doctors in ${d.name}`,"Emergency"]);
}
function fallback(){return say(`Sorry, I'm not sure about that yet. I can help with appointments and free slots, doctors, OPD days, fees, visiting hours, emergency contacts and our programmes. For anything else, call the OPD desk on <b>${SITE.opd}</b>.`,DEFAULT_CHIPS);}

function answer(text){
  const q=norm(text);
  if(has(q,SELF_HARM))return selfHarm();
  if(has(q,RED_FLAGS)&&!has(q,["cardiology","doctor","slot","book","appointment"]))return emergency();
  {const x=NOT_OFFERED.find(n=>has(q,n.words));if(x&&!findDept(q))return notOffered(x);}
  if(has(q,["hi","hello","hey","namaste","good morning","good afternoon","good evening"])&&q.trim().split(" ").length<=4)return say("Hello! How can I help you today?",DEFAULT_CHIPS);
  if(has(q,["thanks","thank you","thank","ok thanks"]))return say("You're welcome. Is there anything else I can help with?",DEFAULT_CHIPS);
  if(has(q,["bye","goodbye"]))return say("Take care. I'm here whenever you need help.",[]);
  if(has(q,["emergency","ambulance","casualty","108","urgent"]))return emergency();
  const doc=findDoctor(q),dept=findDept(q),date=findDate(q);
  const asksSlots=has(q,["slot","slots","available","availability","free","appointment","appointments","book","booking","time","when can","checkup","check up","consult","consultation","see a","visit"]);
  if(has(q,["reschedule","cancel","cancellation","refund","change my"]))return changes();
  if(has(q,["check in","check-in","checkin","token","queue","waiting","wait time"]))return checkin();
  if(doc)return doctorInfo(doc,date);
  if(dept&&has(q,["head","hod","in charge","incharge","chief"]))return deptHead(dept);
  if(dept&&date&&has(q,["open","run","runs","working","available on","is there opd","opd on"])&&!has(q,["slot","slots"]))return deptOnDate(dept,date);
  if(dept&&date)return deptSlots(dept,date);
  if(has(q,["how do i book","how to book","how can i book","book an appointment","booking process","make an appointment"])&&!dept)return howToBook();
  if(dept&&asksSlots&&!has(q,["days","which day","what days","open on","timings"]))return deptSlots(dept,date);
  if(has(q,["fee","fees","cost","charge","charges","price","how much"]))return fees();
  if(has(q,["insurance","cashless","ayushman","cghs","esi","scheme","claim"]))return insurance();
  if(has(q,["pharmacy","medical store","chemist","medicines available"]))return say(`Yes — our <b>pharmacy is open 24 hours</b>, on the ground floor of Block A.`,["Visiting hours","Contact"]);
  if(has(q,["blood bank","donate blood","blood donation"]))return say(`The <b>blood bank is open 24 hours</b>. Donors are welcome from 9:00 AM to 5:00 PM.`,["Visiting hours","Contact"]);
  if(has(q,["visiting","visitor","visit hours","attendant","icu visit","pharmacy","medical store","blood bank","donate blood"]))return visiting();
  if(has(q,["holiday","holidays","closed on","open on sunday","deepavali","diwali","christmas","independence"]))return holidays(q);
  if(has(q,["address","location","where is","located","directions","contact","phone","number","email","reach"]))return contact();
  if(has(q,["how to apply","apply","admission","admissions","neet","counselling"]))return apply();
  if(has(q,["mbbs","course","courses","programme","programmes","program","programs","nursing","md ","ms ","institute","college","study"]))return programmes();
  if(has(q,["beds","icu beds","facilities","operation theatre","theatres","about the hospital","about you","about hospital"]))return facilities();
  if(has(q,["department","departments","speciality","specialities","specialty","specialties","services"])&&!dept)return listDepts();
  if(dept&&has(q,["doctor","doctors","who","specialist","head","consultant"]))return doctorsIn(dept);
  if(has(q,["opd","timing","timings","hours","open","closed","days","registration"])||(dept&&has(q,["days","open"])))return opdTimings(dept);
  if(has(q,["find a doctor","find doctor","doctor","doctors"]))return say(`Which speciality do you need? For example "heart doctor", "doctors in ENT" or a doctor's name. You can also browse ${link("#doctors","Find a doctor")}.`,["Doctors in Cardiology","Doctors in Paediatrics","Doctors in Orthopaedics"]);
  if(asksSlots&&!dept)return say(`Which department or doctor would you like? For example "cardiology slots tomorrow" or "next slot with Dr. Meera Iyer".`,["General Medicine slots today","Paediatrics slots tomorrow","How do I book?"]);
  if(dept)return symptomHelp(q,dept);
  if(has(q,["pain","fever","sick","ill","hurt","symptom","symptoms","problem","suffering"]))return symptomHelp(q,null);
  return fallback();
}

/* ---------- Chat panel ---------- */
let panel,log,input,opened=false,lastFocus=null;
function build(){
  panel=document.createElement("div");panel.className="ma-panel";panel.id="mediassist";panel.hidden=true;
  panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","false");panel.setAttribute("aria-labelledby","maTitle");
  panel.innerHTML=`<div class="ma-head"><div class="ma-avatar" aria-hidden="true">AB</div><div class="ma-title"><b id="maTitle">AniBuddy</b><small>MediAssist · usually replies instantly</small></div><button type="button" class="ma-close" aria-label="Close MediAssist">✕</button></div>
    <div class="ma-log" role="log" aria-live="polite"></div>
    <form class="ma-form" autocomplete="off"><label for="maInput" class="ma-sr">Type your question</label><input id="maInput" maxlength="300" placeholder="Ask about doctors, slots, timings…"><button type="submit" aria-label="Send">➤</button></form>
    <p class="ma-note">AniBuddy shares hospital information, not medical advice. In an emergency call <b>108</b>.</p>`;
  document.body.appendChild(panel);
  log=panel.querySelector(".ma-log");input=panel.querySelector("input");
  panel.querySelector(".ma-close").onclick=close;
  panel.querySelector("form").onsubmit=e=>{e.preventDefault();const t=input.value.trim();if(!t)return;input.value="";ask(t);};
  panel.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
}
function bubble(who,html,chips=[]){
  const m=document.createElement("div");m.className="ma-msg "+who;m.innerHTML=html;log.appendChild(m);
  if(chips.length){const c=document.createElement("div");c.className="ma-chips";
    chips.forEach(t=>{const b=document.createElement("button");b.type="button";b.textContent=t;b.onclick=()=>ask(t);c.appendChild(b);});log.appendChild(c);}
  log.scrollTop=log.scrollHeight;
}
async function ask(text){
  log.querySelectorAll(".ma-chips").forEach(c=>c.remove());
  bubble("me",esc(text));
  const typing=document.createElement("div");typing.className="ma-msg bot ma-typing";typing.innerHTML="<span></span><span></span><span></span>";typing.setAttribute("aria-label","AniBuddy is typing");log.appendChild(typing);log.scrollTop=log.scrollHeight;
  let r;
  try{await ensureData();r=answer(text);}catch(e){r=say(`Sorry, I couldn't load hospital information just now. Please call the OPD desk on <b>${SITE.opd}</b>.`);}
  setTimeout(()=>{typing.remove();bubble("bot",r.html,r.chips);},350);
}
function open(){
  if(!panel)build();
  lastFocus=document.activeElement;panel.hidden=false;document.body.classList.add("ma-open");
  document.querySelectorAll("[data-mediassist]").forEach(b=>b.setAttribute("aria-expanded","true"));
  if(!opened){opened=true;bubble("bot","Hi, I'm <b>AniBuddy</b>. How can I help you?",DEFAULT_CHIPS);ensureData().catch(()=>{});}
  setTimeout(()=>input.focus(),50);
}
function close(){
  if(!panel)return;panel.hidden=true;document.body.classList.remove("ma-open");
  document.querySelectorAll("[data-mediassist]").forEach(b=>b.setAttribute("aria-expanded","false"));
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
document.addEventListener("click",e=>{const t=e.target.closest("[data-mediassist]");if(!t)return;e.preventDefault();panel&&!panel.hidden?close():open();});
if(location.hash==="#mediassist")document.addEventListener("DOMContentLoaded",open);
window.MediAssist={open,close,answer:t=>answer(t),ensureData};
})();
