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
### Sign-in

The public website (`index.html`) is the landing page and needs no login. The staff portal is only reachable through `portal/login.html` (linked as "Staff login" in the site footer); every portal page sends signed-out visitors there.

- Accounts are the users in Administration → Users. What each person sees, and whether they can add, edit or delete, follows their role's permissions in Administration → Roles & permissions.
- Passwords are **not** stored in this repository, only their SHA-256 hashes in `portal/assets/data.js`. The administrator keeps the password list privately.
- Sessions end after 20 idle minutes, or last 7 days with "Keep me signed in". Five wrong passwords lock an account for 5 minutes.
- To change a password for everyone, update its hash in `data.js` and redeploy. "Set password" in Administration only changes it in that one browser.

**This is not real security.** The site is static, so the sign-in check runs in the visitor's browser and a technical visitor can bypass it. Today that only exposes the sample data, because all data lives in each visitor's own browser. Before real patient data goes in, move sign-in and data to a server-side service (for example Supabase, Firebase or an in-house API) that checks every request.

Data is saved in the browser's localStorage only; use "Reset sample data" in the sidebar to start over. There is no server, login or real messaging yet.
