# BackIn5 — Customer Intake Template

Copy this whole template, fill in what you know from the customer, paste it back to me.
Anything left blank I'll either skip or ask you about. Square brackets are notes / examples.

---

## 1. Business

- **Business name:**
- **Contact name (owner/lead):**
- **Contact mobile:**
- **Contact email (where they log in):**
- **Trade type:** [e.g. Roofer, Plumber, Electrician]
- **Tier:** [Tier 1 / Tier 2 — default Tier 1]

## 2. Services & coverage

- **Services offered:** [comma-separated list, e.g. Roof repair, Re-roofing, Guttering, Chimney work, Flat roof]
- **Areas covered (towns):** [comma-separated, e.g. Manchester, Stockport, Altrincham]
- **Postcodes covered:** [comma-separated prefixes, e.g. M, SK, WA]

## 3. Website

- **Website URL:** [https://...]
- **Website platform:** [Wix / WordPress / Squarespace / Shopify / Webflow / Wix Studio / Other / No website]
- **Install route:** [DIY / We install it / Their web developer does it]
- **Web dev contact name:** [if "their web developer"]
- **Web dev contact email:** [if "their web developer"]

## 4. Customer-facing messages

- **Opening message (sent on enquiry receipt):**
  [e.g. "Thanks for getting in touch with Summit Roofing! We've got your details and will be back to you within 5 minutes."]

- **Confirmation message (sent on booking confirm):**
  [e.g. "Booking confirmed for {date} at {time}. Reply CANCEL to reschedule."]

- **Expected reply time:** [e.g. "Within 5 minutes", "Within 1 hour", "Same day"]

## 5. Custom questions (up to 3, optional)

These are extra questions added to their website form/widget.

### Question 1
- **Question:** [e.g. "What type of property?"]
- **Type:** [text / number / select / yes-no]
- **Options (if select):** [comma-separated, e.g. House, Bungalow, Flat, Commercial]
- **Required:** [yes / no]

### Question 2
- **Question:**
- **Type:**
- **Options:**
- **Required:**

### Question 3
- **Question:**
- **Type:**
- **Options:**
- **Required:**

## 6. Photo / video uploads

- **Enabled:** [yes / no]
- **For which job types:** [comma-separated, leave blank = all]

## 7. Booking

- **Enabled:** [yes / no]
- **Booking types:** [Callback, Site visit, Quote consultation — pick any]
- **Booking system:** [Calendly / Google Calendar / Manual / Other]
- **Booking link:** [if Calendly or similar]

## 8. Missed call handling

- **Enabled:** [yes / no — usually yes]
- **Missed call message:**
  [e.g. "Sorry we missed your call! We'll ring you back within 5 minutes. — Summit Roofing"]
- **Twilio number to buy:** [area code preference, e.g. 0161 for Manchester. Leave blank for default.]
- **Forward calls to:** [the contact mobile above, unless different]

## 9. Email handling (if pulling enquiries from email)

- **Email address that receives enquiries:** [e.g. info@summitroofing.co.uk]
- **Provider:** [Gmail / Outlook / Other]
- **Forwarding setup:** [Can they forward to our intake address, or do we need IMAP access?]

## 10. Anything else

- **Notes / special requirements:**
- **Source:** [How did they find BackIn5? Just for our records.]
- **Start date:** [When do they want to go live?]

---

## After you paste this back filled in, I will:

1. Insert the `businesses` row in Supabase
2. Insert the `business_settings` row in Supabase
3. Create their Supabase auth user and send you the magic link to forward
4. Generate the per-customer Make config (which scenarios to wire up, what filters)
5. Give you a checklist of manual steps:
   - Buy Twilio number + set call forwarding
   - Install widget / form on their website (or send to their web dev)
   - Set up Gmail filter / forwarding rule
   - Send customer their PWA link + magic link
