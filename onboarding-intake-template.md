# BackIn5 — Client Intake Template

Copy this whole template, fill in what you've gathered from the client, paste it back to me in Claude Code.
Anything left blank I'll skip or ask about. Square brackets are notes / examples.

---

## 1. Business basics

- **Business name:** [e.g. Summit Roofing Ltd]
- **Trade type:** [e.g. Roofer / Plumber / Electrician / Gas engineer]
- **Owner / main contact name:**
- **Contact mobile (where notifications go):**
- **Login email (the address that will receive their magic link / log into the PWA):**

## 2. Service area

- **Services they offer:** [comma-separated, e.g. Roof repair, Re-roofing, Guttering, Chimney work]
- **Towns they cover:** [comma-separated, e.g. Manchester, Stockport, Altrincham]
- **Postcode prefixes they cover:** [comma-separated, e.g. M, SK, WA]

## 3. Website

- **Website URL:**
- **Website platform:** [Wix / WordPress / Squarespace / Webflow / Shopify / Custom / None]
- **Who installs the widget:** [DIY / We install it / Their web dev does it]
- **Web dev contact (if applicable):** [name + email]

## 4. Customer-facing messages

- **Opening message (auto-sent to customer on widget enquiry):**
  [e.g. "Thanks for getting in touch with Summit Roofing! We'll be back to you within 5 minutes."]

- **Missed-call auto-text (sent if a call is missed):**
  [e.g. "Sorry we missed your call! We'll ring back within 5 minutes. — Summit Roofing"]

- **Expected reply time to show on widget:** [e.g. "Within 5 minutes" / "Within 1 hour" / "Same day"]

## 5. Widget customisation

- **Brand colour (hex if known):** [e.g. #2C4FC4 — defaults to BackIn5 blue if unsure]
- **Up to 3 custom questions** (extra questions added to their widget):

  **Q1:** [question text]
  **Type:** [text / number / yes-no / multi-choice]
  **Options if multi-choice:** [comma-separated]
  **Required:** [yes / no]

  **Q2:** [question text]
  **Type:**
  **Options:**
  **Required:**

  **Q3:** [question text]
  **Type:**
  **Options:**
  **Required:**

## 6. Photo uploads

- **Allow customers to attach a photo?** [yes / no]

## 7. Booking (self-serve appointments)

- **Allow customers to request appointments via widget?** [yes / no]
- **Booking types:** [Callback / Site visit / Quote consultation — pick any]
- **Existing booking tool to integrate?** [Calendly / Google Calendar / None / Other]
- **Booking link:** [if Calendly etc.]

## 8. Missed call handling (Twilio)

- **Want missed-call capture?** [yes / no — usually yes]
- **Twilio area code preference:** [e.g. 0161 for Manchester. Blank = any UK number]
- **Their phone number for call forwarding:** [usually the mobile from section 1]

## 9. Email enquiry handling (optional for now)

- **Existing email address customers email:** [e.g. info@summitroofing.co.uk]
- **Email provider:** [Gmail / Outlook / cPanel / Other]
- **Will they set up forwarding to our intake?** [yes / no / not yet]

## 10. Trial details

- **Go-live date:** [when they want to be live]
- **Trial length:** [e.g. 14 days / 30 days]
- **Trial pricing:** [Free / £X discount / Paid full]
- **Success metrics for the trial:** [e.g. "captured X enquiries", "replied to Y% in under 5 min"]
- **Notes / quirks / special requests:**
- **How did they find BackIn5:** [referral / Instagram / cold outreach / etc.]

---

## After you paste this back, I'll do:

1. **SQL to insert their `trades` row** in Supabase
2. **Create their Supabase auth user** (with a temp password you can share or magic link)
3. **Their unique widget embed code** — `<script src="..." data-trade-id="..."></script>` ready for the install
4. **Tailored welcome message** you can send them (their login link, what to expect)
5. **A go-live checklist** specific to this client (Twilio steps, widget install instructions for their platform, what to test)

## What you'll still need to do manually per client:

- Buy the Twilio number (your card)
- Install the widget on their site (if you said "we install it") or send to their web dev
- Send the welcome message to the client
- First test enquiry from your phone to confirm everything's flowing

## After they go live:

- Day 1 check-in: "Any enquiries come through? Anything weird?"
- Day 7 check-in: "How many enquiries? What would make it better?"
- End of trial: review metrics → convert to paid / extend / end

---

## What's NOT in the template yet (deferred until later)

These exist in the schema spec but aren't wired into production:

- `business_settings` table — opening_message, custom_questions config etc. are documented but not stored anywhere yet. For now I'll save them in notes per client and handle them manually in Make/widget config.
- Tally onboarding form — you're doing manual onboarding for the first batch, this is for later.

If your first client wants something we haven't built, flag it and I'll either build it fast or queue it.
