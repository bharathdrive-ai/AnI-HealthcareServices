# AnI-HealthcareServices

Single-page website for a teaching hospital and medical college: OPD board, departments, doctor finder, appointment request form, programmes and admissions.

Live site: https://bharathdrive-ai.github.io/AnI-HealthcareServices/

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

### Sign-in

The public website (`index.html`) is the landing page and needs no login. The staff portal is only reachable through `portal/login.html` (linked as "Staff login" in the site footer); every portal page sends signed-out visitors there.

- Accounts are the users in Administration → Users. What each person sees, and whether they can add, edit or delete, follows their role's permissions in Administration → Roles & permissions.
- Passwords are **not** stored in this repository, only their SHA-256 hashes in `portal/assets/data.js`. The administrator keeps the password list privately.
- Sessions end after 20 idle minutes, or last 7 days with "Keep me signed in". Five wrong passwords lock an account for 5 minutes.
- To change a password for everyone, update its hash in `data.js` and redeploy. "Set password" in Administration only changes it in that one browser.

**This is not real security.** The site is static, so the sign-in check runs in the visitor's browser and a technical visitor can bypass it. Today that only exposes the sample data, because all data lives in each visitor's own browser. Before real patient data goes in, move sign-in and data to a server-side service (for example Supabase, Firebase or an in-house API) that checks every request.

Data is saved in the browser's localStorage only; use "Reset sample data" in the sidebar to start over. There is no server, login or real messaging yet.
