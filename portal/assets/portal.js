/* AnI-HealthcareServices Portal — shared shell, data store and UI helpers.
   Data lives in localStorage (per browser) and is seeded from data.js. */
(function(){
/* Theme: same "jac.theme" choice as the public site; applied before the page paints. */
const THEME_KEY="jac.theme";
const sysDark=window.matchMedia("(prefers-color-scheme: dark)");
const theme={
  current(){return document.documentElement.getAttribute("data-theme")||(sysDark.matches?"dark":"light");},
  apply(){let t=null;try{t=localStorage.getItem(THEME_KEY);}catch(e){}document.documentElement.setAttribute("data-theme",t==="dark"||t==="light"?t:(sysDark.matches?"dark":"light"));},
  toggle(){const n=theme.current()==="dark"?"light":"dark";try{localStorage.setItem(THEME_KEY,n);}catch(e){}document.documentElement.setAttribute("data-theme",n);theme.label();},
  label(){const b=document.getElementById("themeBtn");if(b)b.setAttribute("aria-label",theme.current()==="dark"?"Switch to light theme":"Switch to dark theme");},
  bind(){const b=document.getElementById("themeBtn");if(b){b.onclick=theme.toggle;theme.label();}},
};
theme.apply();
sysDark.addEventListener("change",()=>{let t=null;try{t=localStorage.getItem(THEME_KEY);}catch(e){}if(!t){theme.apply();theme.label();}});
window.addEventListener("storage",e=>{if(e.key===THEME_KEY){theme.apply();theme.label();}});

const PAGES=[
  {no:"01",file:"dashboard.html",mod:"Dashboard",title:"Dashboard",group:"Overview"},
  {no:"02",file:"administration.html",mod:"Administration",title:"Administration",group:"Overview"},
  {no:"03",file:"hospital-master.html",mod:"Hospital Master",title:"Hospital Master",group:"Setup"},
  {no:"04",file:"appointments.html",mod:"Appointments",title:"Appointment Booking",group:"Patient care"},
  {no:"05",file:"patients.html",mod:"Patients",title:"Patient Management",group:"Patient care"},
  {no:"06",file:"services.html",mod:"Medical Services",title:"Medical Services",group:"Patient care"},
  {no:"07",file:"staff.html",mod:"Staff",title:"Staff Management",group:"People"},
  {no:"08",file:"roster.html",mod:"Roster & Leave",title:"Duty Roster & Leave",group:"People"},
  {no:"09",file:"holidays.html",mod:"Holidays",title:"Holiday Management",group:"People"},
  {no:"10",file:"inventory.html",mod:"Inventory",title:"Medicine & Inventory",group:"Pharmacy & stock"},
  {no:"11",file:"pharmacy.html",mod:"Pharmacy",title:"Pharmacy",group:"Pharmacy & stock"},
  {no:"12",file:"reports.html",mod:"Reports",title:"Reports & Analytics",group:"Insights"},
  {no:"13",file:"notifications.html",mod:"Notifications",title:"Notifications",group:"Insights"},
];

/* ---------- Store ---------- */
const PREFIX="jac.portal.";
const mem={};
const db={
  get(key){
    if(mem[key]) return mem[key];
    let v=null;
    try{v=JSON.parse(localStorage.getItem(PREFIX+key));}catch(e){}
    if(!Array.isArray(v)&&!(v&&typeof v==="object")) v=structuredClone((window.SEED||{})[key]??[]);
    mem[key]=v; return v;
  },
  set(key,val){mem[key]=val;try{localStorage.setItem(PREFIX+key,JSON.stringify(val));}catch(e){}},
  reset(){
    try{Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).forEach(k=>localStorage.removeItem(k));}catch(e){}
    Object.keys(mem).forEach(k=>delete mem[k]);
  },
  find(key,id){return db.get(key).find(r=>r.id===id);},
};

/* ---------- Sign-in ----------
   Runs entirely in the browser, so it controls what the portal shows but is NOT security:
   anyone can read these files. Real protection needs a server-side identity provider. */
const SESSION_KEY="jac.session",FAIL_KEY="jac.fail.";
const IDLE_MS=20*60*1000, REMEMBER_MS=7*24*60*60*1000, MAX_FAILS=5, LOCK_MS=5*60*1000;
const store=remember=>remember?localStorage:sessionStorage;
const isoLocalD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const nowStamp=()=>{const d=new Date();return `${isoLocalD(d)} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;};
function audit(user,action){const a=db.get("audit");a.unshift({id:"AUD"+Date.now(),time:nowStamp(),user,action});db.set("audit",a.slice(0,300));}
const auth={
  async hash(username,password){
    if(!(window.crypto&&crypto.subtle)) throw new Error("Sign-in needs a secure page (https or localhost).");
    const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`jac:${username}:${password}`));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  },
  read(){for(const r of [false,true]){try{const s=JSON.parse(store(r).getItem(SESSION_KEY));if(s)return s;}catch(e){}}return null;},
  write(s){try{store(s.remember).setItem(SESSION_KEY,JSON.stringify(s));}catch(e){}},
  clear(){[false,true].forEach(r=>{try{store(r).removeItem(SESSION_KEY);}catch(e){}});},
  session(){
    const s=auth.read();if(!s)return null;
    if(Date.now()-s.last>(s.remember?REMEMBER_MS:IDLE_MS)){auth.clear();return null;}
    const u=db.find("users",s.uid);
    if(!u||u.status!=="Active"){auth.clear();return null;}
    return {...s,user:u};
  },
  user(){return auth.session()?.user||null;},
  touch(){const s=auth.read();if(s){s.last=Date.now();auth.write(s);}},
  can(mod,action="view"){
    const u=auth.user();if(!u)return false;
    const p=db.find("permissions",u.role);
    return !!(p&&p.perms&&p.perms[mod]&&p.perms[mod][action]);
  },
  lockInfo(username){try{return JSON.parse(localStorage.getItem(FAIL_KEY+username))||{n:0,until:0};}catch(e){return {n:0,until:0};}},
  async signIn(username,password,remember){
    username=String(username||"").trim().toLowerCase();
    if(!username||!password) return {ok:false,msg:"Enter your username and password."};
    const lock=auth.lockInfo(username);
    if(lock.until>Date.now()) return {ok:false,msg:`Too many attempts. Try again in ${Math.ceil((lock.until-Date.now())/60000)} min.`};
    const u=db.get("users").find(x=>x.username===username);
    const stored=u&&(u.pw!==undefined?u.pw:((window.SEED||{}).users||[]).find(x=>x.id===u.id)?.pw); // older saved data has no pw field
    const ok=!!stored&&stored===await auth.hash(username,password);
    if(!ok){
      const n=lock.n+1,next={n:n>=MAX_FAILS?0:n,until:n>=MAX_FAILS?Date.now()+LOCK_MS:0};
      try{localStorage.setItem(FAIL_KEY+username,JSON.stringify(next));}catch(e){}
      if(u) audit(username,"Failed sign-in");
      return {ok:false,msg:n>=MAX_FAILS?"Too many attempts. Account locked for 5 minutes.":`Username or password is incorrect. ${MAX_FAILS-n} attempt${MAX_FAILS-n===1?"":"s"} left.`};
    }
    if(u.status!=="Active") return {ok:false,msg:"This account is inactive. Ask an administrator to enable it."};
    try{localStorage.removeItem(FAIL_KEY+username);}catch(e){}
    auth.clear();auth.write({uid:u.id,remember:!!remember,at:Date.now(),last:Date.now()});
    const L=db.get("users");const rec=L.find(x=>x.id===u.id);rec.lastLogin=nowStamp();db.set("users",L);
    audit(username,"Signed in");
    return {ok:true,user:u};
  },
  signOut(reason){
    const u=auth.user();if(u)audit(u.username,reason==="expired"?"Session expired":"Signed out");
    auth.clear();location.replace("login.html"+(reason?`?${reason}=1`:""));
  },
  firstAllowed(){return PAGES.find(p=>auth.can(p.mod))||null;},
};

/* When passwords are rotated in data.js, replace the user list saved in this browser and end old sessions. */
(function(){
  const v=window.ACCOUNTS_VERSION;if(!v)return;
  let saved=null;try{saved=localStorage.getItem(PREFIX+"accountsVersion");}catch(e){}
  if(saved===v)return;
  try{localStorage.removeItem(PREFIX+"users");localStorage.setItem(PREFIX+"accountsVersion",v);}catch(e){}
  delete mem.users;auth.clear();
})();

/* When new seed records ship (e.g. more doctors), add them to this browser's saved data
   without overwriting records the user has already edited. */
(function(){
  const v=window.DATA_VERSION;if(!v)return;
  let saved=null;try{saved=localStorage.getItem(PREFIX+"dataVersion");}catch(e){}
  if(saved===v)return;
  ["staff","roster"].forEach(k=>{
    let stored=null;try{stored=JSON.parse(localStorage.getItem(PREFIX+k));}catch(e){}
    if(!Array.isArray(stored))return; // nothing saved yet: the seed is used as-is
    const have=new Set(stored.map(r=>r.id));
    const add=((window.SEED||{})[k]||[]).filter(r=>!have.has(r.id));
    if(add.length){stored.push(...structuredClone(add));try{localStorage.setItem(PREFIX+k,JSON.stringify(stored));}catch(e){}}
    delete mem[k];
  });
  try{localStorage.setItem(PREFIX+"dataVersion",v);}catch(e){}
})();

/* Gate every portal page except the login page. */
const FILE=location.pathname.split("/").pop()||"index.html";
const PAGE=PAGES.find(p=>p.file===FILE)||null;
let BLOCKED=false;
if(PAGE&&!auth.session()){
  BLOCKED=true;
  document.documentElement.style.visibility="hidden";
  location.replace("login.html?next="+encodeURIComponent(FILE));
}
const MOD=PAGE?.mod||"";
const canDo=action=>!PAGE||auth.can(MOD,action);

/* ---------- Helpers ---------- */
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isoLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today=()=>isoLocal(new Date());
const addDays=(iso,n)=>{const d=new Date(iso+"T00:00");d.setDate(d.getDate()+n);return isoLocal(d);};
const fmtDate=iso=>iso?new Date(iso+"T00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—";
const inr=n=>"₹"+Number(n||0).toLocaleString("en-IN");
const num=n=>Number(n||0).toLocaleString("en-IN");
const daysBetween=(a,b)=>Math.round((new Date(b+"T00:00")-new Date(a+"T00:00"))/864e5);
function uid(prefix,key){
  const rows=db.get(key);let max=0;
  rows.forEach(r=>{const m=String(r.id||"").match(/(\d+)$/);if(m)max=Math.max(max,+m[1]);});
  return prefix+String(max+1).padStart(4,"0");
}
const TONE={
  ok:["active","confirmed","completed","available","in stock","approved","dispensed","paid","enabled","present","free","open","sent","on duty","normal","discharged"],
  warn:["pending","scheduled","waiting","low stock","on leave","near expiry","partial","draft","cleaning","checked in","in progress","admitted","due"],
  alert:["cancelled","inactive","expired","out of stock","rejected","no show","blocked","critical","failed","disabled","overdue","emergency"],
  info:["booked","in consultation","occupied","returned","opd","ipd","new"],
};
function pill(text){
  const t=String(text||"").toLowerCase();
  const tone=Object.keys(TONE).find(k=>TONE[k].includes(t))||"";
  return `<span class="pill ${tone}">${esc(text)}</span>`;
}
function toast(msg){
  let t=document.querySelector(".toast");
  if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t);}
  t.textContent=msg;t.classList.add("show");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("show"),2200);
}
function opts(list,sel){return list.map(o=>{const v=typeof o==="object"?o.value:o,l=typeof o==="object"?o.label:o;return `<option value="${esc(v)}" ${String(v)===String(sel)?"selected":""}>${esc(l)}</option>`;}).join("");}

/* Modal: returns the dialog. buttons: [{label, cls, onClick(dlg) -> false keeps open}] */
function modal({title,body,buttons=[],wide=false}){
  const d=document.createElement("dialog");
  if(wide) d.style.width="min(880px,calc(100vw - 32px))";
  d.innerHTML=`<div class="mh"><h3 style="font-size:1rem">${esc(title)}</h3><button class="btn sm" data-x aria-label="Close">✕</button></div>
    <div class="mb">${body}</div><div class="mf"></div>`;
  const mf=d.querySelector(".mf");
  [{label:"Cancel"},...buttons].forEach(b=>{
    const el=document.createElement("button");el.type="button";el.className="btn "+(b.cls||"");el.textContent=b.label;
    el.onclick=()=>{if(b.onClick&&b.onClick(d)===false)return;d.close();};
    mf.appendChild(el);
  });
  d.querySelector("[data-x]").onclick=()=>d.close();
  d.addEventListener("close",()=>d.remove());
  document.body.appendChild(d);d.showModal();
  return d;
}
function confirmBox(title,text,label="Delete"){
  return new Promise(res=>{
    const d=modal({title,body:`<p>${esc(text)}</p>`,buttons:[{label,cls:"primary",onClick:()=>{res(true);}}]});
    d.addEventListener("close",()=>res(false));
  });
}

/* Form fields: [{k,label,type:text|number|date|time|select|textarea|email|tel,options,required,full,pattern,patternMsg}] */
function formHTML(fields,rec={}){
  return `<div class="form-grid">`+fields.map(f=>{
    const id="f_"+f.k,v=rec[f.k]??f.default??"";
    const opt=typeof f.options==="function"?f.options():f.options;
    let input;
    if(f.type==="select") input=`<select id="${id}">${f.required?"":'<option value="">—</option>'}${opts(opt||[],v)}</select>`;
    else if(f.type==="textarea") input=`<textarea id="${id}">${esc(v)}</textarea>`;
    else input=`<input id="${id}" type="${f.type||"text"}" value="${esc(v)}" ${f.step?`step="${f.step}"`:""}>`;
    return `<div class="field ${f.full?"full":""}"><label for="${id}">${esc(f.label)}${f.required?" *":""}</label>${input}<span class="err" data-err="${f.k}"></span></div>`;
  }).join("")+`</div>`;
}
function readForm(d,fields){
  const out={};let ok=true;
  fields.forEach(f=>{
    const el=d.querySelector("#f_"+f.k);let v=el.value.trim();
    if(f.type==="number"&&v!=="") v=Number(v);
    const errEl=d.querySelector(`[data-err="${f.k}"]`);let msg="";
    if(f.required&&(v===""||v==null)) msg="Required.";
    else if(f.pattern&&v!==""&&!new RegExp(f.pattern).test(v)) msg=f.patternMsg||"Check the format.";
    errEl.textContent=msg;if(msg)ok=false;out[f.k]=v;
  });
  return ok?out:null;
}

/* ---------- CRUD table ---------- */
function crud(el,cfg){
  const st={q:"",sort:null,dir:1,filters:{}};
  const P={add:!cfg.readOnly&&canDo("add"),edit:!cfg.readOnly&&canDo("edit"),del:!cfg.readOnly&&canDo("del")};
  const hasAct=P.edit||P.del||!!cfg.rowActions;
  const root=typeof el==="string"?document.querySelector(el):el;
  const filtersHTML=(cfg.filters||[]).map(f=>{
    const o=typeof f.options==="function"?f.options():f.options;
    return `<select data-f="${f.k}" aria-label="${esc(f.label)}"><option value="">All ${esc(f.label.toLowerCase())}</option>${opts(o)}</select>`;
  }).join("");
  root.innerHTML=`<div class="panel">
    ${cfg.title?`<div class="panel-head"><h2>${esc(cfg.title)}</h2><span class="spacer"></span>${cfg.headExtra||""}</div>`:""}
    <div class="toolbar"><input type="search" placeholder="${esc(cfg.searchPlaceholder||"Search")}" aria-label="Search">${filtersHTML}
      ${!P.add?"":`<button class="btn primary" data-add>+ ${esc(cfg.addLabel||"Add")}</button>`}</div>
    <div class="table-wrap"><table class="dt"><thead></thead><tbody></tbody></table></div>
    <div class="foot"><span data-count></span><span>${esc(cfg.footNote||"")}</span></div></div>`;
  const thead=root.querySelector("thead"),tbody=root.querySelector("tbody");
  thead.innerHTML="<tr>"+cfg.columns.map((c,i)=>`<th data-i="${i}" ${c.num?'style="text-align:right"':""}>${esc(c.label)}</th>`).join("")+(hasAct?'<th class="noclick"></th>':"")+"</tr>";
  root.querySelector("input[type=search]").oninput=e=>{st.q=e.target.value.toLowerCase();render();};
  root.querySelectorAll("[data-f]").forEach(s=>s.onchange=()=>{st.filters[s.dataset.f]=s.value;render();});
  thead.querySelectorAll("th[data-i]").forEach(th=>th.onclick=()=>{const c=cfg.columns[th.dataset.i];st.dir=st.sort===c.k?-st.dir:1;st.sort=c.k;render();});
  const add=root.querySelector("[data-add]");if(add)add.onclick=()=>edit(null);

  function rows(){
    let r=db.get(cfg.key);
    if(cfg.where) r=r.filter(cfg.where);
    Object.entries(st.filters).forEach(([k,v])=>{if(v)r=r.filter(x=>String(x[k])===v);});
    if(st.q) r=r.filter(x=>cfg.columns.some(c=>String(c.text?c.text(x):x[c.k]??"").toLowerCase().includes(st.q)));
    if(st.sort) r=[...r].sort((a,b)=>{const x=a[st.sort],y=b[st.sort];return (typeof x==="number"&&typeof y==="number"?x-y:String(x??"").localeCompare(String(y??"")))*st.dir;});
    return r;
  }
  function render(){
    const r=rows();
    tbody.innerHTML=r.length?r.map(x=>`<tr>${cfg.columns.map(c=>`<td class="${c.num?"num":""}">${c.fmt?c.fmt(x[c.k],x):esc(x[c.k])}</td>`).join("")}
      ${!hasAct?"":`<td class="act">${cfg.rowActions?cfg.rowActions(x):""}${P.edit?`<button class="btn sm link" data-e="${esc(x.id)}">Edit</button>`:""}${P.del?`<button class="btn sm link danger" data-d="${esc(x.id)}">Delete</button>`:""}</td>`}</tr>`).join("")
      :`<tr><td colspan="${cfg.columns.length+1}" class="empty">${esc(cfg.empty||"No records match.")}</td></tr>`;
    root.querySelector("[data-count]").textContent=`${r.length} of ${db.get(cfg.key).length} records`;
    tbody.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>edit(b.dataset.e));
    tbody.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>del(b.dataset.d));
    if(cfg.afterRender) cfg.afterRender(tbody,api);
  }
  function edit(id){
    const rec=id?db.find(cfg.key,id):{};
    modal({title:(id?"Edit ":"New ")+(cfg.noun||"record"),body:formHTML(cfg.fields,rec),buttons:[{label:id?"Save changes":"Create",cls:"primary",onClick:d=>{
      let v=readForm(d,cfg.fields);if(!v)return false;
      if(cfg.validate){const m=cfg.validate(v,rec);if(m){toast(m);return false;}}
      const list=db.get(cfg.key);
      if(id){Object.assign(rec,v);}else{v.id=uid(cfg.idPrefix||"R",cfg.key);if(cfg.defaults)Object.assign(v,cfg.defaults(v));list.unshift(v);}
      db.set(cfg.key,list);audit(auth.user()?.username||"—",`${id?"Updated":"Created"} ${cfg.noun||"record"} ${id||v.id}`);render();toast(id?"Saved":`${cfg.noun||"Record"} ${v.id||""} created`);cfg.onChange&&cfg.onChange();
    }}]});
  }
  async function del(id){
    if(cfg.beforeDelete){const m=cfg.beforeDelete(id);if(m){toast(m);return;}}
    if(!await confirmBox(`Delete ${cfg.noun||"record"}?`,`This removes ${id} from this browser's data.`))return;
    db.set(cfg.key,db.get(cfg.key).filter(r=>r.id!==id));audit(auth.user()?.username||"—",`Deleted ${cfg.noun||"record"} ${id}`);render();toast("Deleted");cfg.onChange&&cfg.onChange();
  }
  const api={render,edit};render();return api;
}

/* ---------- KPIs, bars, charts ---------- */
function kpis(el,items){
  (typeof el==="string"?document.querySelector(el):el).innerHTML=`<div class="kpis">`+items.map(k=>`<div class="kpi"><div class="l">${esc(k.l)}</div><div class="n">${k.n}</div>${k.d?`<div class="d ${k.t||""}">${esc(k.d)}</div>`:""}</div>`).join("")+`</div>`;
}
/* Vertical bar chart. data:[{label, values:[...]}], series:[{name,color}] */
function barChart(el,{data,series,height=200}){
  const W=600,H=height,pl=34,pb=22,pt=10,pr=6;
  const max=Math.max(1,...data.map(d=>d.values.reduce((a,b)=>a+b,0)));
  const nice=Math.ceil(max/5)*5||5;
  const bw=(W-pl-pr)/data.length,inner=Math.max(6,bw*0.6);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for(let i=0;i<=4;i++){const y=pt+(H-pt-pb)*(1-i/4);s+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="var(--line)"/><text x="${pl-6}" y="${y+3}" text-anchor="end">${Math.round(nice*i/4)}</text>`;}
  data.forEach((d,i)=>{
    let y=H-pb;const x=pl+i*bw+(bw-inner)/2;
    d.values.forEach((v,j)=>{const h=(H-pt-pb)*v/nice;y-=h;s+=`<rect x="${x}" y="${y}" width="${inner}" height="${Math.max(0,h)}" fill="${series[j].color}" rx="2"><title>${esc(d.label)} · ${esc(series[j].name)}: ${v}</title></rect>`;});
    s+=`<text x="${x+inner/2}" y="${H-6}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  s+=`</svg>`;
  const legend=series.length>1?`<div class="legend">${series.map(x=>`<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join("")}</div>`:"";
  (typeof el==="string"?document.querySelector(el):el).innerHTML=`<div class="chart" style="padding:1rem 1rem .4rem">${s}</div>${legend}`;
}
function hbars(el,items,{fmt=num}={}){
  const max=Math.max(1,...items.map(i=>i.v));
  (typeof el==="string"?document.querySelector(el):el).innerHTML=`<ul class="list">`+items.map(i=>`<li><div class="grow"><div style="display:flex;justify-content:space-between;gap:.5rem"><span>${esc(i.l)}</span><span class="mono">${fmt(i.v)}</span></div><div class="bar ${i.tone||""}" style="margin-top:.35rem"><i style="width:${(i.v/max*100).toFixed(1)}%"></i></div></div></li>`).join("")+`</ul>`;
}
function tabs(el,names,onSel){
  const root=typeof el==="string"?document.querySelector(el):el;
  root.innerHTML=`<div class="tabs" role="tablist">${names.map((n,i)=>`<button role="tab" aria-selected="${i===0}" data-t="${i}">${esc(n)}</button>`).join("")}</div>`;
  root.querySelectorAll("button").forEach(b=>b.onclick=()=>{root.querySelectorAll("button").forEach(x=>x.setAttribute("aria-selected",x===b));onSel(+b.dataset.t);});
  onSel(0);
}

/* ---------- Lookups ---------- */
const lookup={
  patient:id=>db.find("patients",id)?.name||id,
  staff:id=>db.find("staff",id)?.name||id,
  dept:id=>db.find("departments",id)?.name||id,
  med:id=>db.find("medicines",id)?.name||id,
  doctors:()=>db.get("staff").filter(s=>s.role==="Doctor"&&s.status==="Active").map(s=>({value:s.id,label:`${s.name} · ${lookup.dept(s.dept)}`})),
  depts:()=>db.get("departments").map(d=>({value:d.id,label:d.name})),
  patients:()=>db.get("patients").map(p=>({value:p.id,label:`${p.name} · ${p.id}`})),
  meds:()=>db.get("medicines").map(m=>({value:m.id,label:m.name})),
  stock:medId=>db.get("batches").filter(b=>b.med===medId&&b.expiry>=today()).reduce((a,b)=>a+Number(b.qty||0),0),
};

/* ---------- Shell ---------- */
const initials=n=>String(n||"").replace(/^(Dr|Sr)\.\s*/,"").split(/\s+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
function shell(){
  if(BLOCKED||!PAGE) return;
  const page=PAGE,user=auth.user();
  const role=db.find("roles",user.role);
  document.title=`${page.title} · AnI-HealthcareServices Portal`;
  const content=document.getElementById("content");
  const visible=PAGES.filter(p=>auth.can(p.mod));
  const groups=[...new Set(visible.map(p=>p.group))];
  const isAdmin=user.role==="ROL0001";
  const app=document.createElement("div");app.className="app";
  app.innerHTML=`<aside class="side" id="side">
      <a class="brand" href="${esc((auth.firstAllowed()||PAGES[0]).file)}"><span class="brand-logo"><picture><source srcset="../assets/ani-logo-96.webp 1x, ../assets/ani-logo-160.webp 2x" type="image/webp"><img src="../assets/ani-logo-96.png" width="84" height="34" alt="AnI-HealthcareServices logo"></picture></span>
        <span><b>Staff Portal</b><small>MEDICAL COLLEGE &amp; HOSPITAL</small></span></a>
      <nav aria-label="Portal">${groups.map(g=>`<div class="group">${esc(g)}</div>`+visible.filter(p=>p.group===g).map(p=>`<a href="${p.file}" ${p===page?'aria-current="page"':""}><span class="no">${p.no}</span>${esc(p.title)}</a>`).join("")).join("")}
        <div class="group">Account</div>
        ${isAdmin?`<a href="#" id="resetData"><span class="no">↺</span>Reset sample data</a>`:""}
        <a href="../index.html"><span class="no">↗</span>Public website</a>
        <a href="#" id="signOutSide"><span class="no">⏻</span>Sign out</a></nav>
    </aside>
    <div class="main"><header class="top">
      <button class="btn sm menu-btn" id="menuBtn" aria-controls="side" aria-expanded="false">☰</button>
      <div style="min-width:0"><div class="crumb">${page.no} · ${esc(page.group)}${auth.can(page.mod)&&!canDo("add")&&!canDo("edit")?' · <span class="pill">View only</span>':""}</div><h1>${esc(page.title)}</h1></div>
      <span class="spacer"></span>
      <span class="muted mono clock" id="clock"></span>
      <button class="theme-btn" id="themeBtn" type="button" aria-label="Switch to dark theme" title="Switch theme"><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg></button>
      <div class="who-menu">
        <button class="who" id="whoBtn" aria-haspopup="true" aria-expanded="false"><span class="av">${esc(initials(user.name))}</span><span class="who-text"><b>${esc(user.name)}</b><small>${esc(role?.name||"")}</small></span></button>
        <div class="who-pop" id="whoPop" hidden>
          <div class="muted" style="font-size:.75rem;padding:.4rem .6rem">Signed in as <b class="mono">${esc(user.username)}</b></div>
          <button type="button" id="signOutTop">Sign out</button>
        </div>
      </div>
    </header></div>`;
  app.querySelector(".main").appendChild(content);
  content.classList.add("content");
  document.body.prepend(app);

  if(!auth.can(page.mod)){
    const first=auth.firstAllowed();
    content.innerHTML=`<div class="panel"><div class="panel-body" style="padding:2.5rem 1.5rem;text-align:center">
      <h2 style="font-size:1.1rem">You don't have access to ${esc(page.title)}</h2>
      <p class="muted" style="margin:.6rem auto 1.2rem;max-width:46ch">Your role, ${esc(role?.name||"")}, can't view this page. Ask an administrator to change your permissions in Administration.</p>
      ${first?`<a class="btn primary" href="${first.file}">Go to ${esc(first.title)}</a>`:""}</div></div>`;
  }else if(!canDo("add")&&!canDo("edit")){
    document.body.classList.add("view-only");
  }

  const side=app.querySelector("#side"),mb=app.querySelector("#menuBtn");
  mb.onclick=()=>{const o=side.classList.toggle("open");mb.setAttribute("aria-expanded",o);};
  const whoBtn=app.querySelector("#whoBtn"),pop=app.querySelector("#whoPop");
  whoBtn.onclick=e=>{e.stopPropagation();pop.hidden=!pop.hidden;whoBtn.setAttribute("aria-expanded",!pop.hidden);};
  document.addEventListener("click",e=>{if(!pop.hidden&&!pop.contains(e.target)){pop.hidden=true;whoBtn.setAttribute("aria-expanded","false");}});
  app.querySelector("#signOutTop").onclick=()=>auth.signOut("signedout");
  app.querySelector("#signOutSide").onclick=e=>{e.preventDefault();auth.signOut("signedout");};
  const rd=app.querySelector("#resetData");
  if(rd) rd.onclick=async e=>{e.preventDefault();if(await confirmBox("Reset sample data?","All changes made in this browser, including users and passwords, will be replaced with the original sample data.","Reset")){db.reset();location.reload();}};
  theme.bind();
  const clock=app.querySelector("#clock");
  const tick=()=>clock.textContent=new Date().toLocaleString("en-IN",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  tick();setInterval(tick,30000);

  /* Keep the session alive while the user is active; sign out after 20 idle minutes. */
  let lastTouch=0;
  const activity=()=>{const n=Date.now();if(n-lastTouch>30000){lastTouch=n;auth.touch();}};
  ["click","keydown","scroll","pointermove"].forEach(ev=>document.addEventListener(ev,activity,{passive:true}));
  setInterval(()=>{if(!auth.session())auth.signOut("expired");},60000);
  window.addEventListener("storage",e=>{if(e.key===SESSION_KEY&&!auth.session())location.replace("login.html");});
}

window.Portal={PAGES,db,esc,isoLocal,today,addDays,fmtDate,inr,num,daysBetween,uid,pill,toast,opts,modal,confirmBox,formHTML,readForm,crud,kpis,barChart,hbars,tabs,lookup,shell,auth,audit,can:canDo,theme};
document.addEventListener("DOMContentLoaded",shell);
})();
