# JAC Medical College & Hospital

Single-page website for a teaching hospital and medical college: OPD board, departments, doctor finder, appointment request form, programmes and admissions.

Live site: https://bharathdrive-ai.github.io/medicalchatbot/

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
Data is saved in the browser's localStorage only; use "Reset sample data" in the sidebar to start over. There is no server, login or real messaging yet.
