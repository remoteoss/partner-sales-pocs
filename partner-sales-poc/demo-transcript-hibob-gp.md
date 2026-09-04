# HiBob Global Payroll, Powered by Remote — Live Demo Transcript

**Purpose:** A spoken script Mohit reads and adapts while driving the working POC, for HiBob product and exec stakeholders.
**Total run-time:** 15 to 20 minutes.

## At a glance

| Section | Minutes | On-screen action | The one line that must land |
|---|---|---|---|
| 1. Cold open / framing | ~2 | HiBob shell open, "Powered by Remote" footer visible | "You already run Global Payroll with us for 30-plus shared customers. Embedded builds on that, it does not rebuild it." |
| 2. Admin adds a German new hire | ~5 | Global Payroll → Add hire → Germany → 4 steps | "Everything stays in HiBob. The payroll fields are captured here and stored in Remote. HiBob builds and maintains zero of them." |
| 3. The contrast moment (Germany vs US) | ~3 | Open a US new hire, verbally contrast the fields | "The same embedded flow adapts per country with zero HiBob effort. When Germany changes church-tax handling next year, that is our job, not yours." |
| 4. Employee experience | ~3 | Flip persona toggle → employee self-onboarding, US W-4 + state steps | "The employee never leaves HiBob. A US hire gets W-4 and state tax steps a German hire never sees." |
| 5. Magic-link / security moment | ~3 | Admin → View pay runs → 1-click into Remote's authenticated surface | "Approval and payment live in Remote behind step-up 2FA, on purpose. HiBob stays the control tower." |
| 6. Close / roadmap and ask | ~2 | Back to HiBob home | "Magic-link MVP is the near-term path, the embeddable SDK is the deeper phase. We own implementation and support. Low-lift for you." |

---

## Section 1 — Cold open and framing (~2 min)

**[STAGE: Share screen with the HiBob-branded shell already open. Coral accent visible, left-nav showing Home / People / Time & Attendance / Global Payroll / Documents / Settings. Point briefly at the "Powered by Remote" footer in the bottom-left of the sidebar.]**

Thanks everyone. I am going to keep this concrete and show you a working product, not slides. What you are looking at is HiBob. Same shell, same navigation, same look your customers already know. The one thing I want you to notice before we do anything else is right here in the corner: "Powered by Remote." That is the whole idea of what we are proposing today. Remote is not hidden and it is not bolted on. It is embedded inside HiBob and clearly co-branded.

Here is the framing, and then we will get straight into the product. You are choosing one preferred Global Payroll partner for an embedded offering. The instinct after your US payroll build is to brace for another heavy engineering lift. I want to take that fear off the table in the first two minutes.

We are not starting from zero together. Remote already runs Global Payroll for more than thirty of your shared customers today, on a two-way integration that is live right now. So "embedded" is not a new integration we are asking you to fund and staff. It builds on the pipes that already move data between HiBob and Remote every day. The work in front of us is surfacing that inside your product, not rebuilding the payroll engine underneath it.

And the deliberate split is this: Remote is on the paper, Remote leads implementation, Remote owns support and CX. HiBob is the control tower. Your customers stay in HiBob for their day to day, and Remote does the regulated heavy lifting behind the co-branded surface. Let me show you what that actually feels like.

---

## Section 2 — Admin adds a new hire in Germany (~5 min)

**[STAGE: In the left nav, click "Global Payroll." The admin landing appears with the "Add a new hire" country picker: two cards, Germany and United States. Do not click yet.]**

I am the payroll admin at one of your customers. I have a new hire in Germany and I need to get them set up for payroll. I click into Global Payroll, right here in HiBob, and I add a hire. The first thing it asks is where the person is based, because payroll is a per-country problem from the very first field.

**[STAGE: Click the "Germany" card. The screen transitions into the embedded Remote admin onboarding flow. Point at the step rail across the top: "Employee details," "Contract," "Payroll details," "Invite." Point at the small pill that reads "Country: Germany · prefilled from HiBob."]**

Notice two things. First, the country I picked in HiBob is already carried through. See the pill: "Germany, prefilled from HiBob." The admin does not re-enter context that HiBob already has. Second, look at the top of the flow. Four steps: employee details, contract, payroll details, invite. This looks and feels like HiBob, but the forms rendering inside are Remote's own forms. This is our SDK, mounted inside your chrome.

**[STAGE: Step 1 — "Employee details." Fill the basic fields the SelectCountry step shows (name, and the Germany employee basics). Click "Create & continue."]**

Step one is the employee's basic details. I fill these in, and when I continue, this is the moment where a Remote employment record gets created for the German legal entity behind the scenes. Nothing for HiBob to store or reconcile. The record lives in Remote.

**[STAGE: Step 2 — "Contract." The ContractDetails step renders. Slow down here. Point at the German contract fields as you name them.]**

Step two is the contract. And here is where "payroll is per country" starts to show its teeth. For Germany this asks about things like the notice period, whether the role falls under a collective bargaining agreement, a Tarifvertrag, and the statutory working hours. These are not fields a US-centric HRIS would think to ask, and they are not fields you would want to design, validate, and keep current yourselves. Remote already knows the 2026 German rules for all of this. I fill it in and continue.

**[STAGE: Step 3 — "Payroll details" (AdministrativeDetails). Point at the gray helper banner that reads "These are Germany-specific payroll fields — collected here in HiBob, stored in Remote." Then walk the German-specific payroll fields.]**

Step three is the one I really want you to sit with. Payroll details. Read the banner: "These are Germany-specific payroll fields, collected here in HiBob, stored in Remote." This is the punchline of the whole product in one screen.

Look at what Germany actually requires. A Steuer-ID, the German tax identification number. A Sozialversicherungsnummer, the social insurance number. Whether the employee is on statutory or private health insurance, and which provider. Church tax, Kirchensteuer, which depends on the person's religious affiliation and is a real payroll input in Germany, not an edge case. And the IBAN for payment.

**[POINT AT: Steuer-ID (German tax ID), Sozialversicherungsnummer (social insurance number), statutory vs private health insurance provider, church tax / Kirchensteuer, IBAN]**

I want to be blunt about why this matters to you. These are exactly the fields you would never want to build. Each one has its own format, its own validation, its own regulatory meaning, and its own annual change cycle. You would be signing up to maintain German payroll law inside your product forever. In this model you maintain none of it. HiBob captures these fields, but they are Remote's forms and they are stored in Remote. HiBob builds and maintains zero custom payroll fields.

**[STAGE: Click "Save & continue" to reach Step 4 — "Invite."]**

Step four is the invite. I send the new hire an invitation so they complete their own part of onboarding, and I will show you their side in a moment.

**[STAGE: Click "Send invitation." The confirmation appears: "Invitation sent." Two buttons: "View employee experience" and "Add another hire."]**

Done. Invitation sent. That was the full admin path for a German hire, and every screen lived inside HiBob.

---

## Section 3 — The contrast moment: Germany vs the United States (~3 min)

**[STAGE: Click "Add another hire." Back at the country picker. This time click the "United States" card. Note aloud the card subtitle difference: the US card says "Includes federal + state tax setup," the Germany card said "Country-specific payroll fields."]**

Now here is the part I am most excited to show you, and I am going to do it by contrast rather than by rebuilding two screens side by side. I just walked Germany. Let me start the exact same flow for a hire in the United States and tell you what changes, because what changes is the entire argument for a single embedded partner.

**[STAGE: Proceed into the US admin flow. Walk quickly to the "Payroll details" step. Point at the US-specific fields as you name them.]**

Same four steps. Same HiBob chrome. Same SDK. But the fields underneath are completely different, because the country is different. Watch the payroll details step for the US.

**[POINT AT: SSN (Social Security number), federal W-4 filing status, dependents / withholding, work-state withholding, routing number + account number]**

For the United States I am now asked for a Social Security number, not a Steuer-ID. Federal W-4 information, filing status and dependents, which has no German equivalent at all. State withholding tied to the employee's work state, which is a uniquely American layer of complexity. And a routing number and account number instead of an IBAN.

Nothing on this screen carried over from Germany, and nothing needed to. The flow re-shaped itself to the country. Here is the sentence I want you to take away: Remote already knows the 2026 rules for every one of these, per country, and HiBob captures nothing custom. When Germany changes how church tax is handled next year, or the US updates the W-4, that is our job, not yours. You do not ship a release. You do not touch a field. The embedded surface updates because the rules live in Remote.

That is the difference between integrating with one partner who owns the regulated complexity, versus building and maintaining country-by-country payroll logic inside your own product. This is the low-lift wedge, made concrete.

---

## Section 4 — The employee experience (~3 min)

**[STAGE: Use the persona toggle in the top-right of the HiBob top bar. Click "Employee." The nav switches to the employee view: Home / Tasks / Time off / Expenses / Documents. A HiBob "task" card appears: "Complete your payroll onboarding."]**

Let me flip personas. In the real product this is the new hire opening HiBob. Same top-bar toggle, now I am the employee. And notice the nav changed to an employee's world: Home, Tasks, Time off, Expenses. Waiting for me is a HiBob task: "Complete your payroll onboarding." This is the magic-link handoff in our MVP. The employee gets a task inside HiBob, clicks it, and the embedded Remote flow opens right here. They never go find a separate Remote login.

**[STAGE: Open the task. The employee self-onboarding flow renders inside HiBob. Point at the step rail. For the US employee it shows: Personal details, Home address, Bank account, Federal taxes (W-4), State taxes.]**

The employee fills in what only they can provide. Personal details, their home address, their bank account. Clean, guided, inside HiBob the whole way.

**[STAGE: Walk to the tax steps. Point at "Federal taxes (W-4)" and "State taxes" in the rail.]**

And here is the per-country adaptation again, this time on the employee side. Because this hire is in the United States, they get two extra steps a German hire simply does not see: federal taxes, the W-4, and state taxes tied to their work state. A German employee's flow ends at bank account. There is no W-4 in Germany, so there is no W-4 step. The flow shows each employee exactly what their country requires and nothing it does not.

**[STAGE: If a tax step shows the "Available after activation" state, point at it and explain rather than trying to force it.]**

One honest note on sequencing. Some steps, like state taxes, only unlock after the employment is activated on Remote's side. You will see an "available after activation" state here. That is real payroll sequencing, not a demo limitation. It reflects that certain jurisdiction tasks are created at the right point in the lifecycle. The point stands: the employee does all of this inside HiBob, and the flow is country-correct without HiBob writing a single tax rule.

---

## Section 5 — The magic-link and security moment (~3 min)

**[STAGE: Flip the persona toggle back to "Admin." In the Global Payroll area, click the "View pay runs" nav item / action. This triggers the 1-click magic-link handoff into Remote's own authenticated surface.]**

Back to the admin. The new hire is set up, and eventually I need to actually run and approve payroll. Watch what happens when I click "View pay runs."

**[STAGE: The 1-click magic-link opens Remote's own authenticated surface. Let the audience see the transition. Note the step-up authentication prompt if it appears.]**

That was one click, and it took me from HiBob straight into Remote's own authenticated surface, no separate login to hunt for, no password re-entry dance. That is the magic-link. It is the same mechanism behind the employee task you just saw. One click, authenticated, in context.

I want to be deliberate about what just happened, because it is a design decision, not a gap. Setup and data capture live embedded inside HiBob, where they belong for the day to day. But the sensitive actions, final payroll approval and actually moving money, live in Remote's own surface behind step-up two-factor authentication. That is on purpose.

Two reasons. One, security. Approving a payroll run and releasing payment are the highest-risk actions in this entire system. Those belong behind Remote's own authenticated, step-up-protected surface, so the security boundary is clean and auditable. Two, liability. Remote is on the paper for this payroll. The approval and the payment happening in Remote's surface is what lets us stand behind the compliance and the funds movement.

And critically, this does not demote HiBob. HiBob stays the control tower. You initiate, you have visibility, you are the front door your customer lives in. The one-click handoff means the customer never feels the seam. They just click, they are in, they approve, they are done. The security is a feature we can both point to, not a compromise either of us has to explain away.

---

## Section 6 — Close: crawl, walk, run, and the ask (~2 min)

**[STAGE: Click the persona back to Admin / navigate to a clean HiBob view. Stop clicking. Talk to the room.]**

Let me land this honestly, because I would rather you trust the roadmap than oversell the demo.

Crawl, walk, run. What you just saw is real and working. The near-term MVP leads with magic-links: the employee onboarding handoff and the admin one-click sign-in into Remote for the sensitive actions. That is the fastest path to a co-branded embedded product that is genuinely low-lift for HiBob, because it rides on the integration and the shared customers we already have live today.

The deeper phase is the embeddable Payroll Onboarding SDK, which is exactly the admin and employee flows I walked you through, mounted natively inside HiBob rather than reached by magic-link. That is the walk-to-run. It is more work, and it is where a genuine engineering partnership between our teams pays off, but it is additive. Nothing in the MVP gets thrown away to get there.

The reassurance I want to leave you with is the one I opened with. This is the opposite of your US payroll build. Remote owns implementation. Remote owns support and CX. Remote maintains the per-country payroll logic, forever, as the rules change. HiBob captures nothing custom and maintains no payroll fields. You stay the control tower and keep the customer relationship.

So the ask is simple. Pick Remote as your preferred Global Payroll partner and let us scope the MVP together off the shared-customer base we already run. Concretely, I would like to agree on a small first cohort from those thirty-plus shared customers, and a joint definition of "done" for the magic-link MVP, so that by the time you make the call at the end of the month you are deciding on a plan with real dates, not a pitch. What would you need to see from us to be comfortable moving in that direction?

---

## Appendix — Anticipated questions

**Q1. Where does the sensitive data live, and how secure is the magic-link handoff?**
Payroll data is stored in Remote, not duplicated into a HiBob custom schema. The magic-link is a short-lived, authenticated handoff into Remote's own surface, and the sensitive actions, approval and payment, sit behind step-up two-factor authentication. That boundary is deliberate. Live today: the authenticated Remote surface and the two-way data integration. Near-term: the polished one-click admin and employee magic-links as the MVP. We are happy to walk your security team through the token model and data-residency specifics in a dedicated session.

**Q2. What happens when a country's rules change, for example Germany changes church-tax handling or the US updates the W-4?**
That is our job, not yours. The per-country field logic and validation live in Remote. When a rule changes, the embedded surface updates because the rules update in Remote. HiBob does not ship a release, does not touch a field, and does not maintain payroll law. This is true today for the shared customers we run and it is the core promise of the embedded model.

**Q3. How much engineering effort is this for HiBob?**
Low, by design, and staged. The MVP is magic-links, which ride on the integration we already run with you, so it is closer to surfacing and co-branding than to a ground-up build. The deeper phase, the natively embedded SDK, is more work and is where our teams partner directly, but it is additive and optional in sequencing. You are not committing to the heavy lift to get value from the crawl phase.

**Q4. How is this different from our Gusto Embedded experience?**
That build had you owning the payroll surface and the engineering, which is why it took the team it took. This is the inverse. Remote is on the paper, Remote leads implementation, Remote owns support and CX, and Remote maintains the per-country logic. You capture nothing custom and you stay the control tower. The wedge here is low-lift for HiBob, not another multi-quarter engineering program.

**Q5. What is live today versus roadmap?**
Live today: Global Payroll running for thirty-plus shared customers on a two-way integration, and Remote's own authenticated surface for approval and payment. Near-term MVP: the magic-link employee onboarding handoff and the admin one-click sign-in, co-branded inside HiBob. Deeper phase, on the roadmap: the embeddable Payroll Onboarding SDK mounted natively in HiBob, which is the admin and employee flows you saw in this demo. I will always tell you which bucket a capability is in.

**Q6. Why do approval and payment stay in Remote instead of being embedded too?**
Because they are the highest-risk actions and because Remote is on the paper. Keeping approval and payment behind Remote's authenticated, step-up-protected surface gives a clean, auditable security boundary and lets Remote stand behind the compliance and the funds movement. The one-click magic-link means the customer never feels the seam. It is a security feature we can both point to, not a gap.

**Q7. What is the timeline?**
You are targeting a decision at the end of July, and the product deep-dive is this week. If we align on direction, the next step is scoping the MVP against a small first cohort from the shared-customer base, with a joint definition of done, so your end-of-month decision is about a dated plan rather than a promise. The crawl phase is achievable quickly precisely because it builds on what is already live.
