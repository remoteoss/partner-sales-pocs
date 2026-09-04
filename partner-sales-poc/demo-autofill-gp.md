# Global Payroll demo autofill

A one-click bookmarklet that fills the embedded Remote GP onboarding forms (admin
and employee, Germany and US) so you can drive the demo and talk about the fields
instead of typing them.

Companion to the PR autofill bookmarklet. That one dispatches by form heading and
only covers the BambooHR / EOR / COR flows — it never matches the Global Payroll
SDK forms (different headings, and the SDK marks no field `required`, so its
required-only engine fills nothing here). This one is purpose-built for the GP SDK:
it walks every `[data-slot="form-item"]`, keys off the SDK's `data-field`
attribute, and drives the SDK's real component types (native selects, Radix radios,
Radix/command dropdowns, the react-day-picker date + birthdate calendars, and the
custom `RemoteFlows__CountryField` popover).

## Install

1. Open the file `demo-autofill-gp.bookmarklet.txt`.
2. Copy its entire contents (starts with `javascript:void(`).
3. Create a new bookmark (name it e.g. **GP Autofill**) and paste that as the URL.

## Use

On each step of the flow, click **GP Autofill**, watch the toast confirm what it
filled, glance at the values, then click the flow's own **Continue / Save & continue
/ Submit**. Repeat per step. It's idempotent — fields already filled are skipped,
so re-clicking is safe.

## Coverage (verified live against sandbox)

| Flow | Status |
|---|---|
| **Germany — Admin** (Employee details → Contract → Payroll details → Invite) | ✅ Full. Fills all 4 steps incl. the ~46-field German payroll step (Steuer-ID, German SSN, tax class, religious denomination, KV/RV/AV/PV insurance, federal state, etc.). Reaches the Invite screen. |
| **US — Admin** (Employee details → Contract → Work address + comp → SSN/marital → Invite) | ✅ Full. Reaches the Invite screen. |
| **US — Employee** (Personal → Home address → Bank → Federal W-4) | ✅ Fills all form fields incl. W-4 amounts. |
| **Germany — Employee** (Personal → Home address → Bank/IBAN) | ✅ Fills names, sex, DOB, city, nationality, **phone (dial code + number)**, address, and the **IBAN** bank step. **One field is manual: "Country of birth"** (see note). |
| Tax steps showing "Available after activation" | Nothing to fill by design — no fields. You narrate this (transcript §4) and click Skip / Finish. |

## Usage note — click twice per step

The SDK's Radix popovers (dial-code, country pickers) can race when filled
back-to-back. **Click the bookmarklet twice per step** (it's idempotent — the second
pass only re-touches anything the first missed). Then click the flow's Continue.

## One manual field (Germany employee, personal step)

**"Country of birth"** must be picked by hand — one dropdown click. Its component
(a cmdk combobox) accepts a real human click but won't commit a synthetic one in a
way that survives submit, so the autofill can't reliably set it. Everything else on
that step autofills. Pick Germany there, then Continue.

## What it fills (so you know what's on screen)

- **Identity:** random realistic name; personal email is always
  **`mohit.mahindroo+server_<N>@remote.com`**. `<N>` comes from the POC server counter:
  the first fill of a fresh hire (empty email on step 1) **increments** it
  (`POST /api/counter/increment`) so every hire gets a unique number; a second click or
  later step reuses the same number. Falls back to a timestamp if the server is unreachable.
  **Work email is left blank** (not autofilled). Plus a job title and birthdate ≈ 1990-06-15.
- **Contract:** indefinite, full-time, salary €/$65,000, 40h/week, 3-month probation,
  20 PTO days, a one-line role description.
- **Country-specific IDs:** German Steuer-ID `12345678901`, German SSN `65170839J003`;
  US SSN `123-45-6789`; German test IBAN `DE89370400440532013000`; US routing
  `021000021` + account `12345678`.
- **Choices:** work address = same as residential (avoids an extra address form),
  no non-compete, no equity, capital-forming = no, W-4 amounts = 0. Unknown dropdowns
  take the first valid option; country fields resolve to the flow's country
  (Germany / United States) detected from the page.

## Point-at fields in the transcript — all autofilled

Germany payroll: **Steuer-ID, German social security number, health insurance,
religious denomination (Kirchensteuer), tax class (Steuerklasse), federal state**.
US: **SSN, W-4 fields, work state, routing + account**. Employee bank: **IBAN (DE) /
routing + account (US)**. You point and talk; the values are already in.

## Source

`demo-autofill-gp.js` is the readable source. Edit override values there (the
`BY_FIELD` map near the top), then regenerate the bookmarklet:

```bash
{ printf 'javascript:void('; sed 's|//.*$||' demo-autofill-gp.js; printf ');'; } > demo-autofill-gp.bookmarklet.txt
```
