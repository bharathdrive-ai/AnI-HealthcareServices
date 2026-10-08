# AnI-HealthcareServices

Single-page website for a teaching hospital and medical college: OPD board, departments, doctor finder, appointment request form, programmes and admissions.

Live site (main): https://anihealthcareservices.vercel.app
Mirror (GitHub Pages): https://bharathdrive-ai.github.io/AnI-HealthcareServices/
AniBuddy chat on its own page: https://anihealthcareservices.vercel.app/anibuddy/

Both deploy automatically on every push to `main`. They don't share browser data (bookings, staff sign-ins), so share one address — the Vercel link is the main one.

All names, phone numbers, doctors and figures are placeholders.

## Staff portal

`portal/` holds a 13-page hospital administration portal (static HTML, no build step):

| # | Page | Purpose |
|---|------|---------|
| 01 | dashboard.html | Overview, appointments, patients, staff, stock alerts, KPIs |
| 02 | administration.html | Users, roles, permissions, system configuration, audit log |
| 03 | hospital-master.html | Hospital profile, departments, wards, rooms, bed board |
| 04 | appointments.html | Book by department, doctor, date and slot; status flow |
| 05 | patients.html | UHID register, demographics, history, patient journey |
| 06 | services.html | Consultation, lab, radiology, procedures, pricing, orders |
| 07 | staff.html | Doctors, nurses, employees, qualifications, employment |
| 08 | roster.html | Weekly shifts, cover counts, leave requests, availability |
| 09 | holidays.html | Hospital, department and institutional holiday calendar |
| 10 | inventory.html | Medicine master, suppliers, batches, stock, expiry |
| 11 | pharmacy.html | Prescriptions, dispensing (first-expiry-first-out), returns |
| 12 | reports.html | Operational, patient, staff and inventory reports, CSV export |
| 13 | notifications.html | SMS / email / app templates, alert rules, delivery log |

Shared code: `portal/assets/portal.css`, `portal.js` (shell, store, table component) and `data.js` (sample data).
### MediAssist (AniBuddy)

Open it from the header on the website, or use the AniBuddy page at `anibuddy/` (https://anihealthcareservices.vercel.app/anibuddy/) to share as a direct link. The ↗ button in the chat header opens that page.

"MediAssist" in the header (next to Book appointment; a chat icon on smaller screens) opens **AniBuddy**, a help assistant. Files: `assets/mediassist.js`, `assets/mediassist.css`.

- Answers from the site's own data: departments and OPD days, doctors and heads, live free slots for a doctor or department on a date ("cardiology slots tomorrow"), fees, booking/reschedule/check-in rules, holidays, visiting hours, pharmacy, blood bank, contacts, programmes and admissions.
- FAQ knowledge base: `assets/faq-kb.js` holds **112 questions in 12 categories** (appointments, fees and insurance, doctors, emergency, admission and stay, lab and scans, pharmacy, visiting and facilities, records, mother and child, students, other help). Matching uses key phrases plus distinctive-word overlap (with plurals, word stems and spelling variants), so reworded questions find the right answer. Type "help" to browse by category. Answers use sample details; edit `faq-kb.js` to replace them — each entry is one question, its phrasings and its answer.
- Understands everyday words (heart, kids, x-ray, eye) and dates (today, tomorrow, Friday, 12 Oct).
- Safety: no medical advice; emergency words show 108 and Casualty; self-harm words show 108 and Tele-MANAS (14416). Asks for and stores no personal details.
- Rule-based and runs in the browser (no API key or server). An AI-powered version would need a small server to keep the API key secret.

### Appointment management

Three areas share one appointment engine (`portal/assets/appt.js`), so a booking made anywhere shows up everywhere:

| Area | Where | What it does |
|---|---|---|
| Patient Portal | `patient/index.html` (public; linked from the website) | Sign in with mobile + date of birth or register; find a doctor, book, reschedule, cancel, pay (simulated), check in, track the queue, view history, book follow-ups |
| Doctor Portal | `portal/doctor.html` (Doctor role) | Today's appointments and patient queue, call next, consultation status, complete with notes and follow-up, week calendar, patient details, availability (weekly pattern and unavailable dates) |
| Hospital Admin Portal | `portal/appointment-admin.html` (Super Admin, Front Office; Nurse can manage queues) | Dashboard, doctor schedules, slot configuration, department OPD days, holidays and leave, walk-ins with tokens, cancellations and refunds, queue management, reports with CSV export |
| Front Desk Booking | `portal/appointments.html` | Counter booking, payment, check-in, reschedule and cancel using the same rules |

Rules live in the slot configuration: session times, slot length, patients per slot, booking window, change cut-off, check-in window and fees (general, specialist, follow-up). Payments and refunds are simulated: no card details are collected and no money moves.

### Doctors & availability configuration (Excel)

`config/doctors-config.xlsx` is the master list of doctors and their schedules:

| Sheet | You maintain |
|---|---|
| Doctors | One row per doctor: ID, name, department, qualification, designation, employment, experience, joining date, mobile, email, status, show on website, weekly availability Mon–Sat (Full / AM / PM / Off). Row order is the website order. |
| Departments | OPD days per department (Open / Closed) and General or Specialist fee. Shows the head and active doctor count. |
| Leave | Dates a doctor is away. Approved leave blocks their booking slots. |
| Settings | Session times, slot length, patients per slot, booking window, fees, free follow-up period. |
| Weekly Coverage | Read-only: active doctors per department per session. A red 0 means the OPD is open with nobody available. |

Cream cells are editable (most have dropdowns), grey cells are formulas and green cells are fixed reference values. After editing, save the workbook, then:

```bash
python tools/doctors_config.py check   # list mistakes by sheet and row; changes nothing
python tools/doctors_config.py sync    # update index.html and portal/assets/data.js
```

Commit and push the changes to publish them. Each browser applies the new configuration on its next visit, and for these fields the workbook wins over edits made inside the portal. To remove a doctor, set Status to Inactive so their history is kept. `python tools/doctors_config.py build --force` recreates the workbook from the site's current data. The tool needs `python -m pip install openpyxl`.

### Sign-in

The public website (`index.html`) is the landing page and needs no login. The staff portal is only reachable through `portal/login.html` (linked as "Staff login" in the site footer); every portal page sends signed-out visitors there.

- Accounts are the users in Administration → Users. What each person sees, and whether they can add, edit or delete, follows their role's permissions in Administration → Roles & permissions.
- Passwords are **not** stored in this repository, only their SHA-256 hashes in `portal/assets/data.js`. The administrator keeps the password list privately.
- Sessions end after 20 idle minutes, or last 7 days with "Keep me signed in". Five wrong passwords lock an account for 5 minutes.
- To change a password for everyone, update its hash in `data.js` and redeploy. "Set password" in Administration only changes it in that one browser.

**This is not real security.** The site is static, so the sign-in check runs in the visitor's browser and a technical visitor can bypass it. Today that only exposes the sample data, because all data lives in each visitor's own browser. Before real patient data goes in, move sign-in and data to a server-side service (for example Supabase, Firebase or an in-house API) that checks every request.

Data is saved in the browser's localStorage only; use "Reset sample data" in the sidebar to start over. There is no server or real messaging yet.

## Architecture

> Keep these diagrams current: when you add a page, a data key, a script or a new flow, update the matching diagram in the same commit. GitHub draws them from the Mermaid code below.

### System overview

The whole site is static files with no build step and no server. Every page runs in the visitor's browser, and each browser keeps its own copy of the data in localStorage, starting from the sample seed in `data.js`.

```mermaid
flowchart TB
    subgraph Authoring["Maintenance - your PC"]
        XLSX["config/doctors-config.xlsx<br/>doctors, weekly availability,<br/>OPD days, leave, slot settings"]
        TOOL["tools/doctors_config.py<br/>check / sync / build"]
        XLSX -->|"sync"| TOOL
    end

    subgraph Repo["GitHub repo - main branch"]
        INDEXF["index.html<br/>public website"]
        PATIENTF["patient/index.html<br/>Patient Portal"]
        PORTALF["portal/*.html<br/>login + 15 staff pages"]
        MAPAGE["anibuddy/index.html<br/>AniBuddy on its own page"]
        DATAJS["portal/assets/data.js<br/>seed data + DOCTORS CONFIG block"]
        PORTALJS["portal/assets/portal.js<br/>shell, auth, store, migrations, CRUD"]
        APPTJS["portal/assets/appt.js<br/>appointment engine"]
        MAJS["assets/mediassist.js + faq-kb.js<br/>AniBuddy chatbot + 112 FAQs"]
    end

    TOOL -->|"rewrites generated blocks"| INDEXF
    TOOL -->|"rewrites generated blocks"| DATAJS

    Repo -->|"git push - auto deploy"| HOST["Vercel - main<br/>GitHub Pages - mirror"]

    subgraph Browser["Visitor's browser"]
        SITE["Public website<br/>departments, OPD board,<br/>doctor finder, MediAssist<br/>+ /anibuddy/ page"]
        PAT["Patient Portal<br/>sign in with mobile + DOB"]
        STAFF["Staff portal<br/>role-based pages"]
        LS[("localStorage<br/>jac.portal.* data<br/>jac.theme")]
        SS[("sessionStorage<br/>jac.session staff<br/>jac.patient patient")]
    end

    HOST --> SITE
    HOST --> PAT
    HOST --> STAFF
    SITE -.->|"MediAssist lazy-loads<br/>data.js, portal.js, appt.js"| LS
    PAT --> LS
    STAFF --> LS
    PAT --> SS
    STAFF --> SS
```

### How a portal page is built

Each staff page loads the same scripts in this order. `portal.js` brings saved data up to date, checks the session, and then draws the shared layout around the page's own content.

```mermaid
flowchart LR
    A["data.js<br/>window.SEED"] --> B["portal.js"]
    B --> M["Migrations<br/>ACCOUNTS_VERSION<br/>DATA_VERSION<br/>DOCTORS_CONFIG version"]
    M --> G{"Signed in and<br/>allowed to see<br/>this module?"}
    G -->|"no"| L["login.html"]
    G -->|"yes"| SH["Shell: header, sidebar<br/>of allowed pages, theme"]
    SH --> P["Page script<br/>Portal.crud tables,<br/>forms, modals"]
    P <-->|"db.get / db.set"| D[("localStorage<br/>jac.portal.*")]
    P --> E["appt.js - appointment pages only"]
    E <--> D
```

| Layer | File | Responsibility |
|---|---|---|
| Seed data | `portal/assets/data.js` | Sample records for every module, password hashes, version stamps, and the generated DOCTORS CONFIG block |
| Shell and services | `portal/assets/portal.js` | Page list and sidebar, `db` store over localStorage, sign-in and sessions, role permissions, migrations, `Portal.crud` tables, modals, theme, audit log |
| Appointment engine | `portal/assets/appt.js` | Slots, availability (OPD days, weekly pattern, holidays, leave), fees, booking, payment, cancellation and refunds, check-in tokens, queue, walk-ins, follow-ups |
| Pages | `portal/*.html`, `patient/index.html` | Screens for each module; they read and write only through `db` and `Appt` |
| Website and chatbot | `index.html`, `assets/mediassist.js`, `assets/faq-kb.js` | Public pages; AniBuddy answers FAQs and reads live slots through the same engine |

### Sequence: staff sign-in and opening a page

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff member
    participant L as login.html
    participant P as portal.js
    participant LS as localStorage
    participant SS as sessionStorage
    participant Pg as Portal page

    S->>L: Enter username and password
    L->>P: Portal.signIn(username, password, remember)
    P->>LS: Read lock counter jac.fail.username
    alt Locked after 5 wrong attempts
        P-->>L: Account locked for 5 minutes
    else Not locked
        P->>P: SHA-256 of jac:username:password
        P->>LS: Load users and compare the hash
        alt Hash does not match
            P->>LS: Count the failed attempt
            P-->>L: Incorrect, N attempts left
        else Match and account Active
            P->>SS: Save session - localStorage if Keep me signed in
            P->>LS: Write lastLogin and audit entry
            P-->>L: OK
            L->>Pg: Open first page the role may see
        end
    end
    Pg->>P: Load page
    P->>SS: Session still valid? 20 min idle or 7 days
    P->>LS: Role permissions for this module
    alt No session or no permission
        P-->>S: Redirect to login.html
    else Allowed
        P-->>Pg: Draw shell and sidebar, enable add / edit / delete per role
    end
```

### Sequence: patient books and pays for an appointment

```mermaid
sequenceDiagram
    autonumber
    actor Pt as Patient
    participant PP as Patient Portal
    participant A as appt.js
    participant DB as db - localStorage

    Pt->>PP: Sign in with mobile + date of birth, or register
    PP->>DB: Find or create the patient record
    Pt->>PP: Choose department, doctor and date
    PP->>A: slots(doctor, date)
    A->>DB: slotConfig, deptSchedule, doctorAvail
    A->>DB: holidays, approved leaves, existing appointments
    alt OPD closed, holiday or doctor on leave
        A-->>PP: Reason - no slots that day
        PP->>A: nextAvailable(doctor)
        A-->>PP: Suggest the next open date
    else Open
        A-->>PP: Free and taken slots for the AM and PM sessions
    end
    Pt->>PP: Pick a slot
    PP->>A: book(patient, doctor, date, slot)
    A->>DB: Save appointment - status Booked
    A-->>PP: Fee - general, specialist, or free follow-up within 14 days
    Pt->>PP: Pay - simulated, no card details
    PP->>A: pay(appointment, method)
    A->>DB: Save payment record, mark paid
    A-->>PP: Booking confirmed
    Note over Pt,DB: Later: reschedule or cancel before the cut-off. A paid cancellation creates a pending refund for the admin.
```

### Sequence: visit day, from check-in to follow-up

```mermaid
sequenceDiagram
    autonumber
    actor Pt as Patient
    actor FD as Front desk
    actor Dr as Doctor
    participant A as appt.js
    participant DB as db - localStorage

    alt Patient checks in online, within 60 minutes of the slot
        Pt->>A: checkIn(appointment)
    else At the counter
        FD->>A: checkIn(appointment), or walkIn() without a booking
    end
    A->>DB: Status Checked In, token like MED-02, queue position
    Pt->>A: queue / position
    A-->>Pt: Patients ahead and estimated wait
    Dr->>A: callNext(doctor)
    A->>DB: Next waiting patient - status In Consultation
    Dr->>A: complete(appointment, notes)
    A->>DB: Status Completed
    opt Follow-up needed
        Dr->>A: followUp(appointment, date, slot)
        A->>DB: New Follow-up appointment, fee 0 within 14 days
    end
    Note over FD,DB: The admin can also skip, reassign to another doctor or mark No Show.
```

### Sequence: updating doctors and schedules from Excel

```mermaid
sequenceDiagram
    autonumber
    actor Ad as Administrator
    participant X as doctors-config.xlsx
    participant T as doctors_config.py
    participant R as GitHub repo
    participant H as Vercel / GitHub Pages
    participant B as Visitor's browser

    Ad->>X: Edit doctors, weekly pattern, OPD days, leave, settings
    Ad->>T: python tools/doctors_config.py check
    T->>X: Read and validate every sheet
    alt Errors found
        T-->>Ad: List by sheet and row - nothing changed
    else Valid
        Ad->>T: python tools/doctors_config.py sync
        T->>R: Rewrite DOCTORS CONFIG blocks in data.js and index.html with a new version
        Ad->>R: Commit and push
        R->>H: Auto deploy
        B->>H: Next visit loads the new data.js
        B->>B: portal.js sees a new config version
        B->>B: Overwrite saved doctors, availability, OPD days, workbook leave, slot settings
        Note over B: Other saved data such as bookings and non-doctor staff is kept
    end
```

### Sequence: MediAssist (AniBuddy) answers a question

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitor
    participant MA as mediassist.js
    participant KB as faq-kb.js
    participant A as appt.js and data

    V->>MA: Open MediAssist and ask a question
    MA->>A: First use - lazy-load data.js, portal.js, appt.js
    MA->>KB: Lazy-load the FAQ knowledge base
    MA->>MA: Route the question
    alt Emergency or self-harm words
        MA-->>V: Call 108 / Casualty or Tele-MANAS 14416
    else Greeting or menu
        MA-->>V: Quick-reply options
    else Doctor, department or slots on a date
        MA->>A: doctors, availability, slots
        A-->>MA: Live schedule from this browser's data
        MA-->>V: Answer with a link to book
    else General question
        MA->>KB: Score phrase and keyword matches
        alt Good match
            KB-->>MA: Best answer
            MA-->>V: Answer
        else No match
            MA-->>V: Suggestions and the hospital phone number
        end
    end
```
