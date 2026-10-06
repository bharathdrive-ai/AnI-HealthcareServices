/* AnI-HealthcareServices Portal — sample seed data. All names, numbers and figures are placeholders. */
(function(){
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const T=iso(new Date());
const D=n=>{const d=new Date(T+"T00:00");d.setDate(d.getDate()+n);return iso(d);};
const Y=new Date().getFullYear();

const departments=[
  ["DEP0001","General Medicine","MED","A1",8,"Dr. Rohan Kulkarni"],
  ["DEP0002","General Surgery","SUR","A2",6,"Dr. Sameer Joshi"],
  ["DEP0003","Cardiology","CAR","B1",5,"Dr. Meera Iyer"],
  ["DEP0004","Orthopaedics","ORT","A3",5,"Dr. Arjun Rao"],
  ["DEP0005","Obstetrics & Gynaecology","OBG","C1",6,"Dr. Anjali Nair"],
  ["DEP0006","Paediatrics","PED","C2",5,"Dr. Fatima Sheikh"],
  ["DEP0007","Neurology","NEU","B2",3,"Dr. Vikram Singh"],
  ["DEP0008","ENT","ENT","A4",3,"Dr. Priya Das"],
  ["DEP0009","Ophthalmology","OPH","A4",3,"Dr. Kavya Menon"],
  ["DEP0010","Emergency Care","EMR","G1",7,"Dr. Naveen Reddy"],
  ["DEP0011","Pathology & Laboratory","LAB","D1",4,"Dr. Sunita Rao"],
  ["DEP0012","Radiology","RAD","D2",4,"Dr. Imran Khan"],
].map(([id,name,code,block,floor,head])=>({id,name,code,block,floor,head,status:"Active"}));

const wards=[
  ["WRD0001","Male Medical Ward","General","DEP0001","A1",40],
  ["WRD0002","Female Medical Ward","General","DEP0001","A1",36],
  ["WRD0003","Surgical Ward","General","DEP0002","A2",40],
  ["WRD0004","Cardiac Care Unit","ICU","DEP0003","B1",16],
  ["WRD0005","Medical ICU","ICU","DEP0001","B3",20],
  ["WRD0006","Labour & Postnatal","Maternity","DEP0005","C1",30],
  ["WRD0007","Paediatric ICU","ICU","DEP0006","C2",24],
  ["WRD0008","Private Rooms","Private","DEP0001","E1",24],
].map(([id,name,type,dept,block,beds])=>({id,name,type,dept,block,beds,status:"Active"}));

const roomTypes=["Consultation","Procedure","Operation Theatre","Private","Semi-private","Isolation"];
const rooms=[
  ["RM0001","OPD-A1-01","Consultation","DEP0001","A1"],["RM0002","OPD-A1-02","Consultation","DEP0001","A1"],
  ["RM0003","OPD-B1-01","Consultation","DEP0003","B1"],["RM0004","CATH-LAB-1","Procedure","DEP0003","B1"],
  ["RM0005","OT-1","Operation Theatre","DEP0002","A2"],["RM0006","OT-2","Operation Theatre","DEP0004","A3"],
  ["RM0007","E1-101","Private","DEP0001","E1"],["RM0008","E1-102","Private","DEP0001","E1"],
  ["RM0009","ISO-B3-1","Isolation","DEP0001","B3"],["RM0010","LR-C1-1","Procedure","DEP0005","C1"],
].map(([id,name,type,dept,block])=>({id,name,type,dept,block,status:"Available"}));

const bedStates=["Occupied","Occupied","Occupied","Free","Occupied","Cleaning","Occupied","Free","Occupied","Blocked"];
const beds=[];
wards.forEach(w=>{const n=Math.min(w.beds,24);for(let i=1;i<=n;i++){beds.push({id:`${w.id}-B${String(i).padStart(2,"0")}`,ward:w.id,no:`${w.block}-${String(i).padStart(2,"0")}`,status:bedStates[(i*7+w.beds)%bedStates.length]});}});

const staff=[
  ["STF0001","Dr. Meera Iyer","Doctor","DEP0003","MD, DM (Cardiology)","Professor & Head","Permanent",22,"2004-07-01"],
  ["STF0002","Dr. Arjun Rao","Doctor","DEP0004","MS (Ortho)","Professor & Head","Permanent",18,"2008-06-15"],
  ["STF0003","Dr. Fatima Sheikh","Doctor","DEP0006","MD (Paediatrics)","Professor & Head","Permanent",12,"2014-01-10"],
  ["STF0004","Dr. Rohan Kulkarni","Doctor","DEP0001","MD (General Medicine)","Professor & Head","Permanent",25,"2001-03-01"],
  ["STF0005","Dr. Anjali Nair","Doctor","DEP0005","MS, DNB (OBG)","Professor & Head","Permanent",14,"2012-08-20"],
  ["STF0006","Dr. Vikram Singh","Doctor","DEP0007","MCh (Neurosurgery)","Professor & Head","Permanent",9,"2017-11-01"],
  ["STF0007","Dr. Kavya Menon","Doctor","DEP0009","MS (Ophthalmology)","Professor & Head","Permanent",11,"2015-05-04"],
  ["STF0008","Dr. Sameer Joshi","Doctor","DEP0002","MS (General Surgery), FMAS","Professor & Head","Permanent",20,"2006-02-14"],
  ["STF0009","Dr. Priya Das","Doctor","DEP0008","MS (ENT)","Professor & Head","Contract",7,"2019-09-09"],
  ["STF0010","Dr. Naveen Reddy","Doctor","DEP0010","MD (Emergency Medicine)","Professor & Head","Permanent",10,"2016-04-01"],
  ["STF0011","Sr. Lakshmi Pillai","Nurse","DEP0001","B.Sc Nursing","Nursing Superintendent","Permanent",24,"2002-01-07"],
  ["STF0012","Sr. Deepa Thomas","Nurse","DEP0003","M.Sc Nursing","Ward Sister","Permanent",15,"2011-06-01"],
  ["STF0013","Rahul Verma","Nurse","DEP0010","GNM","Staff Nurse","Permanent",6,"2020-02-17"],
  ["STF0014","Asha Gowda","Nurse","DEP0006","B.Sc Nursing","Staff Nurse","Contract",3,"2023-07-03"],
  ["STF0015","Kiran Shetty","Nurse","DEP0005","GNM","Staff Nurse","Permanent",8,"2018-10-15"],
  ["STF0016","Manoj Patil","Technician","DEP0011","B.Sc MLT","Lab Technician","Permanent",9,"2017-03-20"],
  ["STF0017","Sneha Kulkarni","Technician","DEP0012","B.Sc Radiology","Radiographer","Permanent",5,"2021-01-11"],
  ["STF0018","Ravi Kumar","Pharmacist","DEP0001","B.Pharm","Chief Pharmacist","Permanent",16,"2010-09-01"],
  ["STF0019","Neha Jain","Admin","DEP0001","MBA (Hospital Admin)","Front Office Manager","Permanent",7,"2019-04-22"],
  ["STF0020","Suresh Babu","Support","DEP0002","—","OT Assistant","Contract",4,"2022-08-08"],
  ["STF0021","Dr. Sanjay Hegde","Doctor","DEP0001","MD (General Medicine)","Associate Professor","Permanent",15,"2011-07-01"],
  ["STF0022","Dr. Nandini Shetty","Doctor","DEP0001","MD (General Medicine)","Assistant Professor","Permanent",8,"2018-08-16"],
  ["STF0023","Dr. Karthik Shenoy","Doctor","DEP0002","MS (General Surgery)","Associate Professor","Permanent",13,"2013-02-04"],
  ["STF0024","Dr. Ayesha Khan","Doctor","DEP0002","MS (General Surgery), FMAS","Assistant Professor","Permanent",7,"2019-06-10"],
  ["STF0025","Dr. Rajesh Menon","Doctor","DEP0003","MD, DM (Cardiology)","Associate Professor","Permanent",14,"2012-09-01"],
  ["STF0026","Dr. Shruti Patil","Doctor","DEP0003","MD, DM (Cardiology)","Assistant Professor","Permanent",6,"2020-03-02"],
  ["STF0027","Dr. Prakash Gowda","Doctor","DEP0004","MS (Ortho)","Associate Professor","Permanent",16,"2010-11-15"],
  ["STF0028","Dr. Divya Krishnan","Doctor","DEP0004","MS (Ortho), Fellowship Sports Medicine","Assistant Professor","Contract",7,"2019-01-21"],
  ["STF0029","Dr. Usha Narayan","Doctor","DEP0005","MS (OBG)","Professor","Permanent",21,"2005-06-13"],
  ["STF0030","Dr. Sneha Reddy","Doctor","DEP0005","MS (OBG)","Assistant Professor","Permanent",6,"2020-07-06"],
  ["STF0031","Dr. Arvind Kumar","Doctor","DEP0006","MD (Paediatrics), DM (Neonatology)","Associate Professor","Permanent",13,"2013-04-08"],
  ["STF0032","Dr. Meghana Bhat","Doctor","DEP0006","MD (Paediatrics)","Assistant Professor","Permanent",5,"2021-02-15"],
  ["STF0033","Dr. Harini Subramanian","Doctor","DEP0007","MD, DM (Neurology)","Associate Professor","Permanent",12,"2014-10-01"],
  ["STF0034","Dr. Rahul Deshpande","Doctor","DEP0007","MD, DM (Neurology)","Assistant Professor","Permanent",6,"2020-09-14"],
  ["STF0035","Dr. Manjunath Kamath","Doctor","DEP0008","MS (ENT)","Associate Professor","Permanent",15,"2011-12-05"],
  ["STF0036","Dr. Farah Siddiqui","Doctor","DEP0008","MS (ENT)","Assistant Professor","Contract",5,"2021-08-02"],
  ["STF0037","Dr. Suresh Iyengar","Doctor","DEP0009","MS (Ophthalmology)","Professor","Permanent",23,"2003-01-06"],
  ["STF0038","Dr. Pooja Nair","Doctor","DEP0009","MS (Ophthalmology), FICO","Assistant Professor","Permanent",6,"2020-05-18"],
  ["STF0039","Dr. Abhishek Verma","Doctor","DEP0010","MD (Emergency Medicine)","Assistant Professor","Permanent",7,"2019-03-11"],
  ["STF0040","Dr. Rekha Joseph","Doctor","DEP0010","MD (Emergency Medicine)","Senior Resident","Contract",4,"2022-07-04"],
  ["STF0041","Dr. Ganesh Murthy","Doctor","DEP0011","MD (Pathology)","Associate Professor","Permanent",14,"2012-06-25"],
  ["STF0042","Dr. Anitha Thomas","Doctor","DEP0011","MD (Pathology)","Assistant Professor","Permanent",6,"2020-10-12"],
  ["STF0043","Dr. Vivek Sharma","Doctor","DEP0012","MD (Radio-diagnosis)","Associate Professor","Permanent",12,"2014-02-17"],
  ["STF0044","Dr. Nisha Agarwal","Doctor","DEP0012","DNB (Radiology)","Assistant Professor","Permanent",5,"2021-04-05"],
  ["STF0045","Dr. Sunita Rao","Doctor","DEP0011","MD (Pathology)","Professor & Head","Permanent",19,"2007-08-01"],
  ["STF0046","Dr. Imran Khan","Doctor","DEP0012","MD (Radio-diagnosis)","Professor & Head","Permanent",18,"2008-03-17"],
].map(([id,name,role,dept,qual,designation,type,exp,joined],i)=>({id,name,role,dept,qual,designation,type,exp,joined,phone:`98450${String(10000+i*137).slice(-5)}`,email:name.toLowerCase().replace(/^(dr|sr)\.\s*/,"").replace(/\s+/g,".")+"@ani-healthcareservices.example",status:i===19?"On Leave":"Active"}));

const firstNames=["Ramesh","Sita","Abdul","Priyanka","Joseph","Kavitha","Anil","Fathima","Ganesh","Lalitha","Mohan","Nirmala","Prakash","Rekha","Santosh","Usha","Vinod","Yamini","Harish","Bhavana"];
const lastNames=["Gowda","Sharma","Rahman","Patel","D'Souza","Reddy","Kumar","Begum","Hegde","Iyer","Naik","Rao","Shetty","Pillai","Desai","Menon","Joshi","Nair","Bhat","Varma"];
const blood=["A+","B+","O+","AB+","O-","A-","B-"];
const hist=["Type 2 diabetes","Hypertension","Asthma","None","Hypothyroidism","None","CAD, post-PCI","None","Knee osteoarthritis","Allergy: penicillin"];
const patients=firstNames.map((f,i)=>({
  id:`UHID${String(240101+i*13)}`,name:`${f} ${lastNames[i]}`,gender:["Male","Female"][[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1][i]],
  dob:`${1950+((i*7)%55)}-${String(1+(i*5)%12).padStart(2,"0")}-${String(1+(i*11)%27).padStart(2,"0")}`,
  phone:`9${String(800000000+i*7654321).slice(0,9)}`,blood:blood[i%blood.length],
  city:["Bengaluru","Mysuru","Tumakuru","Mandya","Hosur"][i%5],history:hist[i%hist.length],
  type:i%4===0?"IPD":"OPD",status:i%4===0?"Admitted":(i%7===3?"Discharged":"Active"),registered:D(-8-((i*17)%300)) /* before every sample visit (earliest is 5 days ago) */,
  insurance:["Ayushman Bharat","Star Health","None","CGHS","None"][i%5],
}));

const times=["09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:30","12:00","12:15"];
const apStatus=["Booked","Checked In","In Consultation","Completed","Completed","Cancelled","No Show","Booked"];
const docs=staff.filter(s=>s.role==="Doctor");
const appointments=[];
for(let i=0;i<34;i++){
  const day=i<14?0:(i<22?-(1+i%5):1+i%6);
  const doc=docs[i%docs.length];
  let status=day>0?"Booked":(day<0?(i%6===0?"No Show":"Completed"):apStatus[i%apStatus.length]);
  appointments.push({id:`APT${String(i+1).padStart(4,"0")}`,patient:patients[(i*3)%patients.length].id,doctor:doc.id,dept:doc.dept,date:D(day),slot:times[(i*5)%times.length],source:i%4===0?"Online":"Front desk",pay:(day<0&&i%6!==0)||i%3===0?"Paid":"Unpaid",type:i%5===0?"Follow-up":"New",status,reason:["Fever","Chest pain review","Knee pain","Antenatal visit","Child vaccination","Headache","Ear pain","Blurred vision","Post-op review"][i%9]});
}

const services=[
  ["SRV0001","OPD Consultation — General","Consultation","DEP0001",300,"15 min"],
  ["SRV0002","OPD Consultation — Specialist","Consultation","DEP0003",600,"20 min"],
  ["SRV0003","Follow-up Consultation","Consultation","DEP0001",0,"10 min"],
  ["SRV0004","Complete Blood Count (CBC)","Laboratory","DEP0011",350,"4 hr"],
  ["SRV0005","HbA1c","Laboratory","DEP0011",550,"6 hr"],
  ["SRV0006","Lipid Profile","Laboratory","DEP0011",650,"6 hr"],
  ["SRV0007","Liver Function Test","Laboratory","DEP0011",700,"6 hr"],
  ["SRV0008","Chest X-ray (PA view)","Radiology","DEP0012",450,"1 hr"],
  ["SRV0009","Ultrasound Abdomen","Radiology","DEP0012",1200,"2 hr"],
  ["SRV0010","CT Brain (plain)","Radiology","DEP0012",3500,"3 hr"],
  ["SRV0011","MRI Knee","Radiology","DEP0012",7500,"1 day"],
  ["SRV0012","ECG","Procedure","DEP0003",250,"20 min"],
  ["SRV0013","2D Echocardiography","Procedure","DEP0003",2200,"45 min"],
  ["SRV0014","Coronary Angiography","Procedure","DEP0003",18000,"1 day"],
  ["SRV0015","Dressing — minor","Procedure","DEP0002",200,"20 min"],
  ["SRV0016","Normal Delivery Package","Procedure","DEP0005",25000,"3 days"],
].map(([id,name,category,dept,price,tat],i)=>({id,name,category,dept,price,tat,gst:category==="Consultation"?0:(category==="Procedure"?0:0),status:i===10?"Inactive":"Active"}));

const orders=[];
["SRV0004","SRV0008","SRV0012","SRV0005","SRV0009","SRV0006","SRV0013","SRV0010","SRV0004","SRV0007","SRV0001","SRV0002"].forEach((s,i)=>{
  orders.push({id:`ORD${String(i+1).padStart(4,"0")}`,patient:patients[(i*5)%patients.length].id,service:s,doctor:docs[i%docs.length].id,date:D(-(i%3)),status:["Pending","In Progress","Completed","Completed","Pending","Completed"][i%6],priority:i%5===1?"Urgent":"Routine"});
});

const suppliers=[
  ["SUP0001","MedLine Distributors","Bengaluru","29AAACM1234F1Z5","Prakash Rao","9845011122",30],
  ["SUP0002","Karnataka Pharma Agencies","Mysuru","29AABCK5678G1Z2","Shalini B","9845022233",45],
  ["SUP0003","Sunrise Surgicals","Bengaluru","29AACCS9012H1Z9","Imtiyaz Ali","9845033344",30],
  ["SUP0004","Apex Healthcare Supply","Chennai","33AADCA3456J1Z1","R. Venkatesh","9845044455",60],
].map(([id,name,city,gstin,contact,phone,terms])=>({id,name,city,gstin,contact,phone,terms,status:"Active"}));

const medicines=[
  ["MED0001","Paracetamol 500 mg","Paracetamol","Tablet","Analgesic",200,1.2],
  ["MED0002","Amoxicillin 500 mg","Amoxicillin","Capsule","Antibiotic",150,6.5],
  ["MED0003","Metformin 500 mg","Metformin","Tablet","Antidiabetic",300,2.1],
  ["MED0004","Amlodipine 5 mg","Amlodipine","Tablet","Antihypertensive",200,3.4],
  ["MED0005","Atorvastatin 10 mg","Atorvastatin","Tablet","Statin",150,5.8],
  ["MED0006","Pantoprazole 40 mg","Pantoprazole","Tablet","Antacid / PPI",200,4.2],
  ["MED0007","Ceftriaxone 1 g","Ceftriaxone","Injection","Antibiotic",80,48],
  ["MED0008","Ondansetron 4 mg","Ondansetron","Injection","Antiemetic",60,18],
  ["MED0009","Salbutamol inhaler","Salbutamol","Inhaler","Bronchodilator",40,145],
  ["MED0010","Insulin Glargine 100 IU/ml","Insulin glargine","Injection","Antidiabetic",30,720],
  ["MED0011","ORS sachet","Oral rehydration salts","Powder","Electrolyte",250,22],
  ["MED0012","Normal Saline 0.9% 500 ml","Sodium chloride","IV Fluid","IV Fluid",120,35],
  ["MED0013","Azithromycin 500 mg","Azithromycin","Tablet","Antibiotic",100,12.5],
  ["MED0014","Cetirizine 10 mg","Cetirizine","Tablet","Antihistamine",150,1.8],
].map(([id,name,generic,form,category,reorder,mrp])=>({id,name,generic,form,category,reorder,mrp,schedule:["MED0002","MED0007","MED0013","MED0010"].includes(id)?"H":"OTC",status:"Active"}));

const batchPlan={MED0001:[[900,300],[400,700]],MED0002:[[60,40]],MED0003:[[520,400]],MED0004:[[180,25]],MED0005:[[300,500]],MED0006:[[260,200]],MED0007:[[45,120],[30,-12]],MED0008:[[0,200]],MED0009:[[55,365]],MED0010:[[22,60]],MED0011:[[400,15]],MED0012:[[300,400]],MED0013:[[140,80]],MED0014:[[200,600]]};
const batches=[];let bn=1;
Object.entries(batchPlan).forEach(([med,list],mi)=>list.forEach(([qty,exp])=>{batches.push({id:`BAT${String(bn).padStart(4,"0")}`,med,batch:`B${(Y%100)}${String(100+bn*7)}`,supplier:suppliers[mi%suppliers.length].id,qty,received:D(-30-bn*3),expiry:D(exp),cost:+(medicines.find(m=>m.id===med).mrp*0.72).toFixed(2)});bn++;}));

const prescriptions=[
  {id:"RX0001",patient:patients[0].id,doctor:"STF0004",date:T,status:"Pending",items:[{med:"MED0003",dose:"1-0-1",days:30,qty:60},{med:"MED0004",dose:"1-0-0",days:30,qty:30}]},
  {id:"RX0002",patient:patients[3].id,doctor:"STF0005",date:T,status:"Pending",items:[{med:"MED0001",dose:"1-1-1",days:3,qty:9},{med:"MED0006",dose:"1-0-0",days:5,qty:5}]},
  {id:"RX0003",patient:patients[6].id,doctor:"STF0001",date:T,status:"Partial",items:[{med:"MED0005",dose:"0-0-1",days:30,qty:30},{med:"MED0008",dose:"SOS",days:1,qty:2}]},
  {id:"RX0004",patient:patients[9].id,doctor:"STF0003",date:D(-1),status:"Dispensed",items:[{med:"MED0011",dose:"after each loose stool",days:3,qty:10},{med:"MED0014",dose:"0-0-1",days:5,qty:5}]},
  {id:"RX0005",patient:patients[12].id,doctor:"STF0010",date:D(-1),status:"Dispensed",items:[{med:"MED0013",dose:"1-0-0",days:3,qty:3}]},
  {id:"RX0006",patient:patients[15].id,doctor:"STF0002",date:T,status:"Pending",items:[{med:"MED0001",dose:"1-0-1",days:5,qty:10}]},
];
const dispenses=[
  {id:"DSP0001",rx:"RX0004",patient:patients[9].id,date:D(-1),items:2,amount:257,by:"STF0018",status:"Dispensed"},
  {id:"DSP0002",rx:"RX0005",patient:patients[12].id,date:D(-1),items:1,amount:37.5,by:"STF0018",status:"Dispensed"},
  {id:"DSP0003",rx:"RX0003",patient:patients[6].id,date:T,items:1,amount:174,by:"STF0018",status:"Partial"},
];
const returns=[
  {id:"RET0001",type:"Patient return",med:"MED0014",batch:"",qty:3,date:D(-2),reason:"Course changed by doctor",status:"Approved"},
  {id:"RET0002",type:"Return to supplier",med:"MED0007",batch:"",qty:30,date:D(-1),reason:"Expired stock",status:"Pending"},
];

const SH=["M","E","N","O","M","M","E"];
const roster=staff.filter(s=>["Doctor","Nurse","Technician","Pharmacist"].includes(s.role)).map((s,i)=>({id:s.id,days:Array.from({length:7},(_,d)=>SH[(i+d)%SH.length])}));
const shifts=[
  {id:"M",name:"Morning",start:"08:00",end:"14:00",color:"info"},
  {id:"E",name:"Evening",start:"14:00",end:"20:00",color:"warn"},
  {id:"N",name:"Night",start:"20:00",end:"08:00",color:"brass"},
  {id:"O",name:"Off",start:"",end:"",color:"muted"},
  {id:"L",name:"Leave",start:"",end:"",color:"alert"},
];
const leaves=[
  {id:"LV0001",staff:"STF0020",type:"Sick leave",from:D(-1),to:D(2),days:4,reason:"Viral fever",status:"Approved"},
  {id:"LV0002",staff:"STF0013",type:"Casual leave",from:D(3),to:D(4),days:2,reason:"Family function",status:"Pending"},
  {id:"LV0003",staff:"STF0006",type:"Conference leave",from:D(9),to:D(11),days:3,reason:"Neuro conference, Delhi",status:"Pending"},
  {id:"LV0004",staff:"STF0014",type:"Earned leave",from:D(-20),to:D(-16),days:5,reason:"Travel",status:"Approved"},
  {id:"LV0005",staff:"STF0009",type:"Casual leave",from:D(6),to:D(6),days:1,reason:"Personal",status:"Rejected"},
];

const holidays=[
  [`${Y}-01-26`,"Republic Day","Hospital"],[`${Y}-03-14`,"Holi","Hospital"],[`${Y}-04-14`,"Ambedkar Jayanti","Hospital"],
  [`${Y}-05-01`,"May Day","Hospital"],[`${Y}-08-15`,"Independence Day","Hospital"],[`${Y}-10-02`,"Gandhi Jayanti","Hospital"],
  [`${Y}-10-20`,"Deepavali","Hospital"],[`${Y}-11-01`,"Kannada Rajyotsava","Hospital"],[`${Y}-12-25`,"Christmas","Hospital"],
  [D(4),"Cath lab maintenance — no elective procedures","Department","DEP0003"],
  [D(12),"Eye OPD closed — screening camp","Department","DEP0009"],
  [D(8),"Institute Foundation Day — no classes","Institutional"],
  [D(19),"MBBS Phase I exam — teaching suspended","Institutional"],
].map(([date,name,scope,dept],i)=>({id:`HOL${String(i+1).padStart(4,"0")}`,date,name,scope,dept:dept||"",opd:scope==="Hospital"?"Emergency only":(scope==="Department"?"Closed":"Open"),status:"Active"}));

const templates=[
  ["TPL0001","Appointment confirmation","SMS","Appointment","Dear {patient}, your appointment with {doctor} is confirmed for {date} at {slot}. Token {token}. – AnI-HealthcareServices"],
  ["TPL0002","Appointment reminder (24 h)","SMS","Appointment","Reminder: {patient}, you have an appointment tomorrow {date} at {slot} with {doctor}. Reply C to cancel. – AnI-HealthcareServices"],
  ["TPL0003","Lab report ready","App","Laboratory","Your {test} report is ready. View it in the AnI-HealthcareServices app or collect it from Lab counter, Block D."],
  ["TPL0004","Discharge summary","Email","Patient","Dear {patient}, please find your discharge summary attached. Follow-up: {followup}."],
  ["TPL0005","Low stock alert","Email","Inventory","Stock for {medicine} is {qty} units, below reorder level {reorder}. Please raise a PO."],
  ["TPL0006","Near-expiry alert","Email","Inventory","{count} batches expire within {days} days. Review the Medicine & Inventory page."],
  ["TPL0007","Leave decision","App","Staff","Your {leave_type} from {from} to {to} has been {status}."],
  ["TPL0008","Duty roster published","App","Staff","The duty roster for the week of {week} is published. Your first shift: {shift}."],
].map(([id,name,channel,category,body],i)=>({id,name,channel,category,body,lang:"English",status:i===7?"Draft":"Active"}));
const rules=[
  ["RUL0001","Appointment booked","TPL0001","Patient","Immediately"],
  ["RUL0002","24 h before appointment","TPL0002","Patient","Daily 18:00"],
  ["RUL0003","Lab result verified","TPL0003","Patient","Immediately"],
  ["RUL0004","Stock below reorder level","TPL0005","Pharmacy head, Stores","Daily 08:00"],
  ["RUL0005","Batch expiry within 90 days","TPL0006","Pharmacy head","Weekly Monday 09:00"],
  ["RUL0006","Leave approved / rejected","TPL0007","Staff member","Immediately"],
].map(([id,event,template,recipients,schedule],i)=>({id,event,template,recipients,schedule,status:i===4?"Disabled":"Enabled"}));
const notifLog=Array.from({length:12},(_,i)=>({id:`NTF${String(i+1).padStart(4,"0")}`,time:`${D(-(i%3))} ${String(8+i%10).padStart(2,"0")}:${String((i*7)%60).padStart(2,"0")}`,template:templates[i%6].id,to:i%3===2?"stores@ani-healthcareservices.example":`98${String(45000000+i*1371).slice(0,8)}`,channel:templates[i%6].channel,status:i===4?"Failed":"Sent"}));

const roles=[
  {id:"ROL0001",name:"Super Admin",desc:"Full access to every module",users:1},
  {id:"ROL0002",name:"Front Office",desc:"Registration, appointments, patient records",users:4},
  {id:"ROL0003",name:"Doctor",desc:"Patient records, orders, prescriptions",users:10},
  {id:"ROL0004",name:"Nurse",desc:"Patient records, bed board, roster view",users:5},
  {id:"ROL0005",name:"Pharmacist",desc:"Pharmacy, inventory",users:2},
  {id:"ROL0006",name:"HR",desc:"Staff, roster, leave, holidays",users:1},
];
const MODULES=["Dashboard","Administration","Hospital Master","Appointments","Doctor Portal","Appointment Admin","Patients","Medical Services","Staff","Roster & Leave","Holidays","Inventory","Pharmacy","Reports","Notifications"];
const P=(v,a,e,d)=>({view:v,add:a,edit:e,del:d});
const permMap={
  ROL0001:()=>P(1,1,1,1),
  ROL0002:m=>["Dashboard","Appointments","Appointment Admin","Patients"].includes(m)?P(1,1,1,0):(["Medical Services","Holidays"].includes(m)?P(1,0,0,0):P(0,0,0,0)),
  ROL0003:m=>["Dashboard","Patients","Medical Services","Appointments","Doctor Portal"].includes(m)?P(1,1,1,0):(["Pharmacy","Roster & Leave","Holidays","Reports"].includes(m)?P(1,0,0,0):P(0,0,0,0)),
  ROL0004:m=>["Dashboard","Patients","Hospital Master","Roster & Leave","Appointment Admin"].includes(m)?P(1,0,1,0):P(0,0,0,0),
  ROL0005:m=>["Pharmacy","Inventory"].includes(m)?P(1,1,1,0):(m==="Dashboard"||m==="Reports"?P(1,0,0,0):P(0,0,0,0)),
  ROL0006:m=>["Staff","Roster & Leave","Holidays"].includes(m)?P(1,1,1,1):(m==="Dashboard"||m==="Reports"?P(1,0,0,0):P(0,0,0,0)),
};
const permissions=roles.map(r=>({id:r.id,perms:Object.fromEntries(MODULES.map(m=>[m,permMap[r.id](m)]))}));
/* Staff sign-in: SHA-256("jac:<username>:<password>") per account.
   Passwords are not stored in this repository. */
const PW={
  "admin":"2c7cfdafc6bbf2f8888117247128e8c92a2e3525ccc8dff12c47f622d5855b53",
  "neha.jain":"6259708a24fd937fc4af7aff6dc92e2b131437a417aa0da58f65054c33fae850",
  "meera.iyer":"f3bc0aff78bd4eff578e597b70efcd6a9344588c55fdc3ca3f17574384a9c37e",
  "rohan.kulkarni":"559c4d1833481a22d8bbe5a183fccf5bb970a241699d44c8dbd5325a9ef798dd",
  "lakshmi.pillai":"581cf7ef47b96212b00dcda73bc57d2e88541303770d95b0d793275e5455d585",
  "ravi.kumar":"e66b940b48fb7f3d6e5ba7e364a6ed25679484c8307d24454d896272ecbaedff",
  "hr.desk":"d975ebf2a8c07a9820f4c7cd89cc566c93a1b1221fd6ba49bfb51b8c82f646dd",
  "frontdesk2":"e700a86c18ac4907931ee97f2e4f78c47515fd40abb79b7bdce26ea1d6051e2d"
};
const users=[
  ["USR0001","admin","Records Admin","ROL0001","admin@ani-healthcareservices.example"],
  ["USR0002","neha.jain","Neha Jain","ROL0002","neha.jain@ani-healthcareservices.example"],
  ["USR0003","meera.iyer","Dr. Meera Iyer","ROL0003","meera.iyer@ani-healthcareservices.example"],
  ["USR0004","rohan.kulkarni","Dr. Rohan Kulkarni","ROL0003","rohan.kulkarni@ani-healthcareservices.example"],
  ["USR0005","lakshmi.pillai","Sr. Lakshmi Pillai","ROL0004","lakshmi.pillai@ani-healthcareservices.example"],
  ["USR0006","ravi.kumar","Ravi Kumar","ROL0005","ravi.kumar@ani-healthcareservices.example"],
  ["USR0007","hr.desk","HR Desk","ROL0006","hr@ani-healthcareservices.example"],
  ["USR0008","frontdesk2","Front Desk 2","ROL0002","frontdesk2@ani-healthcareservices.example"],
].map(([id,username,name,role,email],i)=>({id,username,name,role,email,pw:PW[username]||"",lastLogin:i===7?"":`${D(-(i%4))} 0${8+i%2}:${String(10+i*6).slice(-2)}`,status:i===7?"Inactive":"Active"}));
const settings=[
  {id:"SET0001",key:"OPD registration window",value:"08:00 – 13:00",group:"OPD"},
  {id:"SET0002",key:"Appointment slot length",value:"15 minutes",group:"OPD"},
  {id:"SET0003",key:"Max appointments per doctor per day",value:"40",group:"OPD"},
  {id:"SET0004",key:"UHID format",value:"UHID + 6 digits",group:"Registration"},
  {id:"SET0005",key:"Near-expiry warning",value:"90 days",group:"Pharmacy"},
  {id:"SET0006",key:"Session timeout",value:"20 minutes",group:"Security"},
  {id:"SET0007",key:"Password policy",value:"Min 10 chars, 90-day rotation",group:"Security"},
  {id:"SET0008",key:"Default SMS sender ID",value:"JACHSP",group:"Notifications"},
];
const audit=[
  [T+" 09:42","neha.jain","Created appointment APT0034"],[T+" 09:15","ravi.kumar","Dispensed RX0003 (partial)"],
  [T+" 08:58","admin","Changed role of frontdesk2 to Front Office"],[D(-1)+" 18:20","hr.desk","Approved leave LV0001"],
  [D(-1)+" 16:05","meera.iyer","Ordered 2D Echocardiography for UHID240179"],
].map(([time,user,action],i)=>({id:`AUD${i+1}`,time,user,action}));

const hospital={id:"HOSP",name:"AnI-HealthcareServices",regNo:"KA/BLR/CE/2026/00451",nabh:"NABH-H-2021-0187",nmc:"NMC/MBBS/150/2019",address:"Hospital Road, Sector 12, Bengaluru 560 000",phone:"+91 80 4000 1000",email:"info@ani-healthcareservices.example",beds:1050,icuBeds:96,ots:14,established:"1985",gstin:"29AAATJ0000A1Z0"};

/* Bump when accounts or passwords change: browsers drop their saved user list and sessions. */
window.ACCOUNTS_VERSION="2026-10-06";
/* Bump when seed records are added: browsers merge in new staff/roster entries without losing their own changes. */
window.DATA_VERSION="2026-10-06-heads";
/* ---------- Appointment management ---------- */
const slotConfig={id:"CFG",slotMinutes:15,
  sessions:{AM:{start:"09:00",end:"13:00"},PM:{start:"14:00",end:"16:00"}},
  maxPerSlot:1,bookingWindowDays:30,cancelCutoffHours:2,checkInBeforeMins:60,
  fees:{general:300,specialist:600,followUp:0},followUpFreeDays:14,generalDepts:["DEP0001","DEP0010"]};
/* OPD days Mon..Sat per department (1 = OPD runs). Sunday is always closed. */
const OPD_DAYS={DEP0003:[1,0,1,0,1,1],DEP0004:[1,1,0,1,1,1],DEP0007:[0,1,0,1,0,1],DEP0008:[1,0,1,0,1,0]};
const deptSchedule=departments.map(d=>({id:d.id,days:OPD_DAYS[d.id]||[1,1,1,1,1,1]}));
/* Each doctor's weekly pattern Mon..Sat: Full, AM, PM or Off */
const doctorAvail=staff.filter(s=>s.role==="Doctor").map((s,i)=>({id:s.id,week:["Full","Full","Full","Full","Full",i%3===0?"AM":"Full"]}));
const payments=[];
const refunds=[];
/* Keep sample appointments on days their OPD actually runs (no Sundays, closed OPD days or holidays). */
(function(){
  const closed=(dept,date)=>{const d=new Date(date+"T00:00").getDay();if(d===0)return true;
    const sch=deptSchedule.find(x=>x.id===dept);if(sch&&!sch.days[d-1])return true;
    return holidays.some(h=>h.date===date&&(h.scope==="Hospital"||(h.scope==="Department"&&h.dept===dept)));};
  const shift=(date,n)=>{const d=new Date(date+"T00:00");d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  appointments.forEach(a=>{const dir=a.date<T?-1:1;let g=0;while(closed(a.dept,a.date)&&g++<14)a.date=shift(a.date,dir);});
})();

window.SEED={slotConfig,deptSchedule,doctorAvail,payments,refunds,hospital,departments,wards,rooms,roomTypes,beds,staff,patients,appointments,services,orders,suppliers,medicines,batches,prescriptions,dispenses,returns,roster,shifts,leaves,holidays,templates,rules,notifLog,roles,permissions,users,settings,audit,MODULES};
})();
