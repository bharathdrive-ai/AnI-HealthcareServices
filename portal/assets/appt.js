/* AnI-HealthcareServices — appointment engine shared by the Patient, Doctor and Hospital Admin portals.
   Every rule (slots, availability, fees, payments, check-in tokens, queue, refunds) lives here so all
   three portals agree. Data is the portal store (Portal.db), which is saved in this browser only. */
(function(){
const P=window.Portal, db=P.db;
const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_NAMES=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const toMin=t=>{const [h,m]=String(t).split(":").map(Number);return h*60+(m||0);};
const toTime=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const dow=date=>new Date(date+"T00:00").getDay();
const stamp=()=>`${P.today()} ${toTime(nowMin())}`;

const cfg=()=>db.get("slotConfig");
const all=()=>db.get("appointments");
const save=list=>db.set("appointments",list);
const find=id=>all().find(a=>a.id===id);
const doctor=id=>db.find("staff",id);
const doctors=dept=>db.get("staff").filter(s=>s.role==="Doctor"&&s.status==="Active"&&(!dept||s.dept===dept));
const deptCode=id=>db.find("departments",id)?.code||"OPD";
/* Emergency Care is walk-in only (Casualty, 24x7); every other department runs a bookable OPD. */
const isOpd=dept=>deptCode(dept)!=="EMR";
const WALK_IN_MSG="Emergency Care doesn't take appointments. Walk in 24×7 at Casualty, Gate 2.";
/* Same order as the website's department cards: Emergency first, then the OPDs. */
const deptsInOrder=({opdOnly=false}={})=>{const L=db.get("departments").filter(d=>d.status==="Active");const opd=L.filter(d=>isOpd(d.id));return opdOnly?opd:[...L.filter(d=>!isOpd(d.id)),...opd];};

/* ---------- Who is acting (staff user or signed-in patient) ---------- */
const PSESS="jac.patient";
const patient={
  get(){try{const s=JSON.parse(sessionStorage.getItem(PSESS));return s&&db.find("patients",s.id)?s:null;}catch(e){return null;}},
  set(id){try{sessionStorage.setItem(PSESS,JSON.stringify({id,at:Date.now()}));}catch(e){}},
  clear(){try{sessionStorage.removeItem(PSESS);}catch(e){}},
};
const who=()=>P.auth?.user()?.username||(patient.get()?`patient ${patient.get().id}`:"system");
function log(a,ev){(a.log=a.log||[]).push({t:stamp(),ev,by:who()});}

/* ---------- Availability and slots ---------- */
function deptOpen(dept,date){const d=dow(date);if(d===0)return false;const s=db.get("deptSchedule").find(x=>x.id===dept);return s?!!s.days[d-1]:true;}
function weekPattern(docId,date){const d=dow(date);if(d===0)return "Off";const a=db.get("doctorAvail").find(x=>x.id===docId);return a?a.week[d-1]:"Full";}
const holidayOn=(dept,date)=>db.get("holidays").find(h=>h.status==="Active"&&h.date===date&&(h.scope==="Hospital"||(h.scope==="Department"&&h.dept===dept)));
const leaveOn=(docId,date)=>db.get("leaves").find(l=>l.staff===docId&&l.status==="Approved"&&l.from<=date&&l.to>=date);

function availability(docId,date,{allowPast=false}={}){
  const d=doctor(docId);if(!d)return {ok:false,msg:"Choose a doctor."};
  if(!isOpd(d.dept))return {ok:false,msg:WALK_IN_MSG};
  if(!date)return {ok:false,msg:"Choose a date."};
  if(!allowPast&&date<P.today())return {ok:false,msg:"That date has passed."};
  if(date>P.addDays(P.today(),cfg().bookingWindowDays))return {ok:false,msg:`Bookings open up to ${cfg().bookingWindowDays} days ahead.`};
  if(dow(date)===0)return {ok:false,msg:"OPD is closed on Sundays."};
  const h=holidayOn(d.dept,date);if(h)return {ok:false,msg:`Holiday: ${h.name}.`};
  if(!deptOpen(d.dept,date))return {ok:false,msg:`${P.lookup.dept(d.dept)} OPD doesn't run on ${DAY_NAMES[dow(date)]}s.`};
  const l=leaveOn(docId,date);if(l)return {ok:false,msg:`${d.name} is on ${l.type.toLowerCase()} that day.`};
  const w=weekPattern(docId,date);if(w==="Off")return {ok:false,msg:`${d.name} doesn't consult on ${DAY_NAMES[dow(date)]}s.`};
  return {ok:true,sessions:w==="Full"?["AM","PM"]:[w]};
}
function slotTimes(sessions){
  const c=cfg(),out=[];
  sessions.forEach(k=>{const s=c.sessions[k];if(!s)return;for(let m=toMin(s.start);m+c.slotMinutes<=toMin(s.end);m+=c.slotMinutes)out.push({time:toTime(m),session:k});});
  return out;
}
function slots(docId,date,{ignore}={}){
  const av=availability(docId,date);if(!av.ok)return {ok:false,msg:av.msg,slots:[],free:0};
  const c=cfg(),taken={};
  all().forEach(a=>{if(a.doctor===docId&&a.date===date&&a.status!=="Cancelled"&&a.id!==ignore)taken[a.slot]=(taken[a.slot]||0)+1;});
  const isToday=date===P.today(),nm=nowMin();
  const list=slotTimes(av.sessions).map(s=>{const full=(taken[s.time]||0)>=c.maxPerSlot,past=isToday&&toMin(s.time)<=nm;return {...s,free:!full&&!past,reason:full?"Booked":past?"Past":""};});
  return {ok:true,slots:list,free:list.filter(s=>s.free).length};
}
function nextAvailable(docId,from=P.today()){
  for(let i=0;i<=cfg().bookingWindowDays;i++){const d=P.addDays(from,i);const r=slots(docId,d);if(r.ok){const s=r.slots.find(x=>x.free);if(s)return {date:d,slot:s.time};}}
  return null;
}

/* ---------- Fees and payment ---------- */
function feeFor(docId,type,followUpOf){
  const c=cfg(),d=doctor(docId);
  if(type==="Follow-up"){const prev=followUpOf&&find(followUpOf);if(prev&&P.daysBetween(prev.date,P.today())<=c.followUpFreeDays)return c.fees.followUp;}
  return c.generalDepts.includes(d?.dept)?c.fees.general:c.fees.specialist;
}
const fee=a=>a.fee!=null?a.fee:feeFor(a.doctor,a.type,a.followUpOf);
const payStatus=a=>a.pay||"Unpaid";

function pay(id,method){
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(a.pay==="Paid")return {ok:false,msg:"This appointment is already paid."};
  if(["Cancelled","No Show"].includes(a.status))return {ok:false,msg:`A ${a.status.toLowerCase()} appointment can't be paid.`};
  const amount=fee(a);
  const pays=db.get("payments");
  const rec={id:P.uid("PAY","payments"),appt:a.id,patient:a.patient,amount,method,time:stamp(),status:"Success",ref:"DEMO-"+Math.random().toString(36).slice(2,8).toUpperCase()};
  pays.unshift(rec);db.set("payments",pays);
  a.pay="Paid";a.paidAmount=amount;a.payMethod=method;a.payRef=rec.id;log(a,`Paid ${P.inr(amount)} by ${method} (${rec.id})`);
  save(list);return {ok:true,payment:rec,appt:a};
}

/* ---------- Booking, rescheduling, cancelling ---------- */
function book({patient:pid,doctor:docId,date,slot,type="New",source="Front desk",followUpOf="",reason="",checkIn=false}){
  if(!db.find("patients",pid))return {ok:false,msg:"Choose a patient."};
  const d=doctor(docId);if(!d)return {ok:false,msg:"Choose a doctor."};
  if(source!=="Walk-in"){
    const r=slots(docId,date);if(!r.ok)return {ok:false,msg:r.msg};
    const s=r.slots.find(x=>x.time===slot);if(!s)return {ok:false,msg:"Pick a time slot."};
    if(!s.free)return {ok:false,msg:`${slot} is no longer free. Pick another slot.`};
  }
  if(all().some(a=>a.patient===pid&&a.doctor===docId&&a.date===date&&!["Cancelled","No Show"].includes(a.status)))
    return {ok:false,msg:"This patient already has an appointment with this doctor that day."};
  const list=all();
  const a={id:P.uid("APT","appointments"),patient:pid,doctor:docId,dept:d.dept,date,slot,type,status:"Booked",reason,source,followUpOf,log:[]};
  a.fee=feeFor(docId,type,followUpOf);a.pay=a.fee===0?"Not required":"Unpaid";
  log(a,`Booked (${source}) for ${P.fmtDate(date)} ${slot}`);
  list.unshift(a);save(list);
  if(checkIn)checkIn_(a.id,{force:true});
  return {ok:true,appt:find(a.id)};
}
function reschedule(id,date,slot){
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(a.status!=="Booked")return {ok:false,msg:`A ${a.status.toLowerCase()} appointment can't be rescheduled.`};
  const r=slots(a.doctor,date,{ignore:id});if(!r.ok)return {ok:false,msg:r.msg};
  const s=r.slots.find(x=>x.time===slot);if(!s||!s.free)return {ok:false,msg:"Pick a free slot."};
  log(a,`Rescheduled from ${P.fmtDate(a.date)} ${a.slot} to ${P.fmtDate(date)} ${slot}`);
  a.date=date;a.slot=slot;a.rescheduled=(a.rescheduled||0)+1;save(list);return {ok:true,appt:a};
}
function patientCanChange(a){
  if(a.status!=="Booked")return {ok:false,msg:`This appointment is ${a.status.toLowerCase()}.`};
  const hrs=(new Date(`${a.date}T${a.slot}`)-Date.now())/36e5;
  if(hrs<cfg().cancelCutoffHours)return {ok:false,msg:`Changes close ${cfg().cancelCutoffHours} hours before the slot. Please call the OPD desk.`};
  return {ok:true};
}
function cancel(id,{reason="",by="Front desk"}={}){
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(!["Booked","Checked In"].includes(a.status))return {ok:false,msg:`A ${a.status.toLowerCase()} appointment can't be cancelled.`};
  a.status="Cancelled";a.cancelReason=reason;a.cancelledBy=by;a.cancelledAt=stamp();
  log(a,`Cancelled by ${by.toLowerCase()}${reason?": "+reason:""}`);
  let refund=null;
  if(a.pay==="Paid"){
    const R=db.get("refunds");
    refund={id:P.uid("RFD","refunds"),appt:a.id,patient:a.patient,amount:a.paidAmount??fee(a),reason:reason||"Appointment cancelled",requested:stamp(),status:"Pending",method:a.payMethod||"Original payment method"};
    R.unshift(refund);db.set("refunds",R);a.pay="Refund pending";log(a,`Refund ${P.inr(refund.amount)} requested (${refund.id})`);
  }
  save(list);return {ok:true,appt:a,refund};
}
function settleRefund(rid,approve,note=""){
  const R=db.get("refunds"),r=R.find(x=>x.id===rid);if(!r)return {ok:false,msg:"Refund not found."};
  if(r.status!=="Pending")return {ok:false,msg:`This refund is already ${r.status.toLowerCase()}.`};
  r.status=approve?"Processed":"Rejected";r.processed=stamp();r.by=who();r.note=note;db.set("refunds",R);
  const list=all(),a=list.find(x=>x.id===r.appt);
  if(a){a.pay=approve?"Refunded":"Paid";log(a,approve?`Refund ${P.inr(r.amount)} processed`:`Refund rejected${note?": "+note:""}`);save(list);}
  return {ok:true,refund:r};
}

/* ---------- Check-in, tokens and queue ---------- */
function ensureTokens(date){
  const list=all();let changed=false;
  const byDoc={};list.filter(a=>a.date===date).forEach(a=>{(byDoc[a.doctor]=byDoc[a.doctor]||[]).push(a);});
  Object.values(byDoc).forEach(arr=>{
    let n=Math.max(0,...arr.map(a=>a.tokenNo||0));
    arr.filter(a=>!a.token&&["Checked In","In Consultation","Completed"].includes(a.status)).sort((x,y)=>x.slot.localeCompare(y.slot))
      .forEach(a=>{n++;a.tokenNo=n;a.qOrder=n;a.token=`${deptCode(a.dept)}-${String(n).padStart(2,"0")}`;changed=true;});
  });
  if(changed)save(list);
}
function checkInWindow(a){
  if(a.status!=="Booked")return {ok:false,msg:`This appointment is ${a.status.toLowerCase()}.`};
  if(a.date!==P.today())return {ok:false,msg:a.date>P.today()?"Check-in opens on the day of your appointment.":"This appointment date has passed."};
  const before=cfg().checkInBeforeMins;
  if(toMin(a.slot)-nowMin()>before)return {ok:false,msg:`Check-in opens ${before} minutes before your slot, from ${toTime(toMin(a.slot)-before)}.`};
  return {ok:true};
}
function checkIn_(id,{force=false}={}){
  ensureTokens(P.today());
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(a.status!=="Booked")return {ok:false,msg:`This appointment is ${a.status.toLowerCase()}.`};
  if(!force){const w=checkInWindow(a);if(!w.ok)return w;}
  const n=Math.max(0,...list.filter(x=>x.doctor===a.doctor&&x.date===a.date).map(x=>x.tokenNo||0))+1;
  const maxQ=Math.max(0,...list.filter(x=>x.doctor===a.doctor&&x.date===a.date).map(x=>x.qOrder||0));
  a.tokenNo=n;a.qOrder=maxQ+1;a.token=`${deptCode(a.dept)}-${String(n).padStart(2,"0")}`;
  a.status="Checked In";a.checkInAt=toTime(nowMin());log(a,`Checked in · token ${a.token}`);
  save(list);return {ok:true,appt:a};
}
function queue(docId,date=P.today()){
  ensureTokens(date);
  const list=all().filter(a=>a.doctor===docId&&a.date===date);
  return {
    serving:list.find(a=>a.status==="In Consultation")||null,
    waiting:list.filter(a=>a.status==="Checked In").sort((x,y)=>(x.qOrder||0)-(y.qOrder||0)),
    booked:list.filter(a=>a.status==="Booked").sort((x,y)=>x.slot.localeCompare(y.slot)),
    done:list.filter(a=>a.status==="Completed"),
    noShow:list.filter(a=>a.status==="No Show"),
    avgMins:cfg().slotMinutes,
  };
}
function position(id){
  const a=find(id);if(!a)return null;
  const q=queue(a.doctor,a.date);
  if(a.status==="In Consultation")return {now:true,ahead:0,wait:0,q};
  const i=q.waiting.findIndex(x=>x.id===id);if(i<0)return null;
  const ahead=i+(q.serving?1:0);
  return {now:false,pos:i+1,ahead,wait:ahead*q.avgMins,q};
}
function setStatus(id,status,ev,extra={}){
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  Object.assign(a,extra);a.status=status;log(a,ev);save(list);return {ok:true,appt:a};
}
function start(id){
  const a=find(id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(a.status!=="Checked In")return {ok:false,msg:"Only checked-in patients can be called in."};
  const q=queue(a.doctor,a.date);if(q.serving)return {ok:false,msg:`Finish ${q.serving.token} (${P.lookup.patient(q.serving.patient)}) first.`};
  return setStatus(id,"In Consultation",`Called in · token ${a.token}`,{startAt:toTime(nowMin())});
}
function callNext(docId){
  const q=queue(docId);if(q.serving)return {ok:false,msg:`${q.serving.token} is still in consultation.`};
  if(!q.waiting.length)return {ok:false,msg:"Nobody is waiting."};
  return start(q.waiting[0].id);
}
function complete(id,{notes="",diagnosis="",followUpDays=0}={}){
  const a=find(id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(a.status!=="In Consultation")return {ok:false,msg:"Start the consultation before completing it."};
  const extra={endAt:toTime(nowMin()),notes,diagnosis};
  if(followUpDays>0)extra.followUpAdvised=P.addDays(a.date,followUpDays);
  return setStatus(id,"Completed",`Consultation completed${followUpDays>0?` · follow-up advised in ${followUpDays} days`:""}`,extra);
}
function noShow(id){
  const a=find(id);if(!a)return {ok:false,msg:"Appointment not found."};
  if(!["Booked","Checked In"].includes(a.status))return {ok:false,msg:`A ${a.status.toLowerCase()} appointment can't be marked no-show.`};
  return setStatus(id,"No Show","Marked as no-show");
}
function skip(id){
  const list=all(),a=list.find(x=>x.id===id);if(!a||a.status!=="Checked In")return {ok:false,msg:"Only waiting patients can be moved."};
  a.qOrder=Math.max(0,...list.filter(x=>x.doctor===a.doctor&&x.date===a.date).map(x=>x.qOrder||0))+1;
  log(a,"Moved to the end of the queue");save(list);return {ok:true,appt:a};
}
function reassign(id,docId){
  const list=all(),a=list.find(x=>x.id===id);if(!a)return {ok:false,msg:"Appointment not found."};
  const d=doctor(docId);if(!d||d.dept!==a.dept)return {ok:false,msg:"Choose a doctor from the same department."};
  if(!["Booked","Checked In"].includes(a.status))return {ok:false,msg:`A ${a.status.toLowerCase()} appointment can't be moved.`};
  const from=P.lookup.staff(a.doctor);a.doctor=docId;
  if(a.status==="Checked In"){a.qOrder=Math.max(0,...list.filter(x=>x.doctor===docId&&x.date===a.date).map(x=>x.qOrder||0))+1;}
  log(a,`Moved from ${from} to ${d.name}`);save(list);return {ok:true,appt:a};
}

/* ---------- Walk-ins and follow-ups ---------- */
function walkIn({patient:pid,dept,doctor:docId,reason=""}){
  const date=P.today();
  if((dept&&!isOpd(dept))||(docId&&doctor(docId)&&!isOpd(doctor(docId).dept)))return {ok:false,msg:WALK_IN_MSG};
  const pool=docId?[doctor(docId)].filter(Boolean):doctors(dept);
  const options=pool.filter(d=>availability(d.id,date).ok).map(d=>{const q=queue(d.id,date);return {d,load:q.waiting.length+(q.serving?1:0)};}).sort((x,y)=>x.load-y.load);
  if(!options.length)return {ok:false,msg:"No doctor in this department is consulting today."};
  const d=options[0].d,r=slots(d.id,date),free=r.ok&&r.slots.find(s=>s.free);
  const slot=free?free.time:toTime(Math.ceil(nowMin()/5)*5);
  return book({patient:pid,doctor:d.id,date,slot,type:"New",source:"Walk-in",reason,checkIn:true});
}
function followUp(prevId,date,slot,source){
  const prev=find(prevId);if(!prev)return {ok:false,msg:"Original appointment not found."};
  if(prev.status!=="Completed")return {ok:false,msg:"Follow-ups can be booked after a completed consultation."};
  return book({patient:prev.patient,doctor:prev.doctor,date,slot,type:"Follow-up",followUpOf:prevId,source,reason:`Follow-up of ${prevId}`});
}

/* ---------- Helpers for the portals ---------- */
const doctorForUser=u=>u?db.get("staff").find(s=>s.role==="Doctor"&&s.name===u.name)||null:null;
function weekDays(from){const d=new Date(from+"T00:00");const mon=P.addDays(from,-((d.getDay()+6)%7));return Array.from({length:7},(_,i)=>P.addDays(mon,i));}

/* ---------- Shared UI: slot picker and history ---------- */
function slotGrid(box,r,onPick){
  if(!r.ok){box.innerHTML=`<p class="muted" style="grid-column:1/-1;margin:0">${P.esc(r.msg)}</p>`;return;}
  if(!r.slots.length){box.innerHTML=`<p class="muted" style="grid-column:1/-1;margin:0">No slots in this session.</p>`;return;}
  let html="",last="";
  r.slots.forEach(s=>{if(s.session!==last){last=s.session;html+=`<div class="slot-session">${s.session==="AM"?"Morning":"Afternoon"}</div>`;}
    html+=`<button type="button" class="slot" data-s="${s.time}" ${s.free?"":"disabled"} aria-pressed="false" title="${s.reason||"Free"}">${s.time}</button>`;});
  box.innerHTML=html;
  box.querySelectorAll(".slot:not(:disabled)").forEach(b=>b.onclick=()=>{box.querySelectorAll(".slot").forEach(x=>x.setAttribute("aria-pressed",x===b));onPick(b.dataset.s);});
}
function pickSlot({title,doc,date,ignore,confirmLabel="Confirm",note="",onConfirm}){
  let chosen=null;
  const d=P.modal({title,body:`${note?`<p class="muted" style="margin:0 0 .8rem">${P.esc(note)}</p>`:""}
    <div class="form-grid"><div class="field"><label for="psDate">Date</label><input id="psDate" type="date"></div>
    <div class="field"><label>Doctor</label><div style="padding:.5rem 0;font-weight:600">${P.esc(P.lookup.staff(doc))}</div></div></div>
    <div style="margin-top:.9rem;display:flex;justify-content:space-between;gap:.5rem"><label>Available slots</label><span class="muted" id="psNote" style="font-size:.75rem"></span></div>
    <div class="slots" id="psSlots" style="margin-top:.4rem"></div><p class="err" id="psErr"></p>`,
    buttons:[{label:confirmLabel,cls:"primary",onClick:dlg=>{
      const err=dlg.querySelector("#psErr");
      if(!chosen){err.textContent="Pick a time slot.";return false;}
      const r=onConfirm(dlg.querySelector("#psDate").value,chosen);
      if(r&&r.ok===false){err.textContent=r.msg;return false;}
    }}]});
  const di=d.querySelector("#psDate");di.min=P.today();di.max=P.addDays(P.today(),cfg().bookingWindowDays);
  di.value=date&&date>=P.today()?date:P.today();
  const draw=()=>{chosen=null;const r=slots(doc,di.value,{ignore});slotGrid(d.querySelector("#psSlots"),r,s=>{chosen=s;});
    d.querySelector("#psNote").textContent=r.ok?`${r.free} of ${r.slots.length} free`:"";};
  di.onchange=draw;draw();
  return d;
}
const logHTML=a=>`<ol class="timeline">${(a.log||[]).slice().reverse().map(l=>`<li><div class="t">${P.esc(l.t)} · ${P.esc(l.by)}</div><div>${P.esc(l.ev)}</div></li>`).join("")||'<li><div class="muted">No history recorded for this older appointment.</div></li>'}</ol>`;

window.Appt={isOpd,deptsInOrder,WALK_IN_MSG,DAYS,toMin,toTime,nowMin,dow,cfg,all,find,doctor,doctors,patient,who,slotGrid,pickSlot,logHTML,
  deptOpen,weekPattern,holidayOn,leaveOn,availability,slots,nextAvailable,
  fee,feeFor,payStatus,pay,book,reschedule,patientCanChange,cancel,settleRefund,
  checkInWindow,checkIn:checkIn_,queue,position,start,callNext,complete,noShow,skip,reassign,
  walkIn,followUp,doctorForUser,weekDays};
})();
