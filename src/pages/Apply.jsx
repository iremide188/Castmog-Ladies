import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageHero } from "../components/ui";
import { positions } from "../data/content";

const LEVELS = ["Beginner / Learner", "Developing Player", "Experienced Player"];
const FEET = ["Right", "Left", "Both"];
const MIN_AGE = 17;

const initialForm = {
  fullName: "",
  dob: "",
  phone: "",
  whatsapp: "",
  email: "",
  location: "",
  level: "",
  preferredPosition: "",
  secondaryPosition: "",
  preferredFoot: "",
  currentClub: "",
  noCurrentClub: false,
  previousClub: "",
  noPreviousClub: false,
  experience: "",
  photo: null,
  videoLink: "",
  reason: "",
  consent: false,
};

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function makeReference(taken) {
  const year = new Date().getFullYear();
  let ref;
  do {
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    ref = `CM-${year}-${digits}`;
  } while (taken.includes(ref));
  taken.push(ref);
  return ref;
}

export default function Apply() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submittedRef, setSubmittedRef] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // References already issued in this session (the production platform
  // guarantees uniqueness in the database).
  const issuedRefs = useMemo(() => [], []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));
  const setFile = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.files[0] || null }));

  function validate() {
    const errs = {};
    const f = form;

    if (!f.fullName.trim()) errs.fullName = "Please enter your full name.";

    if (!f.dob) errs.dob = "Please enter your date of birth.";
    else {
      const age = calcAge(f.dob);
      if (age === null) errs.dob = "Please enter a valid date of birth.";
      else if (age < MIN_AGE)
        errs.dob = "You must be at least 17 years old to apply to Castmog Ladies Football Academy.";
    }

    const phoneOk = (v) => /^[+]?[\d\s-]{7,15}$/.test(v.trim());
    if (!f.phone.trim()) errs.phone = "Please enter your phone number.";
    else if (!phoneOk(f.phone)) errs.phone = "Please enter a valid phone number.";
    if (!f.whatsapp.trim()) errs.whatsapp = "Please enter your WhatsApp number.";
    else if (!phoneOk(f.whatsapp)) errs.whatsapp = "Please enter a valid WhatsApp number.";

    if (!f.email.trim()) errs.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
      errs.email = "Please enter a valid email address.";

    if (!f.location.trim()) errs.location = "Please enter your current location.";
    if (!f.level) errs.level = "Please select your player level.";
    if (!f.preferredPosition) errs.preferredPosition = "Please select your preferred position.";
    if (!f.preferredFoot) errs.preferredFoot = "Please select your preferred foot.";

    if (!f.noCurrentClub && !f.currentClub.trim())
      errs.currentClub = "Please enter your current club/academy or select 'Not currently registered'.";
    if (!f.noPreviousClub && !f.previousClub.trim())
      errs.previousClub = "Please enter your previous club/academy or select 'No previous club/academy'.";

    if (!f.experience.trim()) errs.experience = "Please briefly describe your football experience.";
    if (!f.photo) errs.photo = "Please upload a clear player photo.";
    if (f.videoLink.trim() && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(f.videoLink.trim()))
      errs.videoLink = "Please enter a valid video link (or leave it empty).";

    if (!f.reason.trim()) errs.reason = "Please tell us why you want to join the academy.";
    if (!f.consent) errs.consent = "Please confirm the declaration to submit your application.";

    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = document.querySelector("[data-error='true']");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    // The production Castmog platform stores this application securely and
    // generates the unique reference server-side. This standalone copy
    // performs the same validation and shows the confirmation screen.
    setTimeout(() => {
      setSubmitting(false);
      setSubmittedRef(makeReference(issuedRefs));
    }, 800);
  }

  if (submittedRef) {
    return (
      <section className="container-site flex flex-col items-center py-20 text-center sm:py-24">
        <CheckCircle2 size={48} className="text-castmog-green" />
        <h1 className="mt-4 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
          Application Submitted Successfully
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600">
          Thank you for applying to Castmog Ladies Football Academy. Please keep your application
          reference safe — the academy will contact you regarding the next stage.
        </p>
        <div className="mt-6 rounded-lg border border-castmog-yellow bg-castmog-soft px-8 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Application Reference
          </p>
          <p className="mt-1 text-xl font-extrabold text-castmog-green">{submittedRef}</p>
        </div>
        <button
          type="button"
          className="btn-outline mt-8"
          onClick={() => {
            setSubmittedRef(null);
            setForm(initialForm);
          }}
        >
          Submit another application
        </button>
      </section>
    );
  }

  return (
    <>
      <PageHero
        title="Player Application"
        subtitle="Apply to join Castmog Ladies Football Academy. Open to female players aged 17 and above."
      />

      <section className="container-site py-12 sm:py-14">
        <div className="mb-8 rounded-lg border-l-4 border-castmog-yellow bg-castmog-soft px-5 py-4">
          <p className="text-sm text-gray-700">
            <span className="font-bold">Note:</span> The online application collects information
            only. Player assessment takes place in person — our coaching staff will see you play
            before any decision is made.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* Personal information */}
          <fieldset>
            <legend className="section-title mb-4">Personal Information</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-error={!!errors.fullName}>
                <label htmlFor="fullName" className="label">Full Name *</label>
                <input id="fullName" className="input" value={form.fullName} onChange={set("fullName")} />
                {errors.fullName && <p className="error-text">{errors.fullName}</p>}
              </div>
              <div data-error={!!errors.dob}>
                <label htmlFor="dob" className="label">Date of Birth *</label>
                <input id="dob" type="date" className="input" value={form.dob} onChange={set("dob")} />
                {errors.dob && <p className="error-text">{errors.dob}</p>}
              </div>
              <div data-error={!!errors.phone}>
                <label htmlFor="phone" className="label">Phone Number *</label>
                <input id="phone" type="tel" className="input" value={form.phone} onChange={set("phone")} />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div data-error={!!errors.whatsapp}>
                <label htmlFor="whatsapp" className="label">WhatsApp Number *</label>
                <input id="whatsapp" type="tel" className="input" value={form.whatsapp} onChange={set("whatsapp")} />
                {errors.whatsapp && <p className="error-text">{errors.whatsapp}</p>}
              </div>
              <div data-error={!!errors.email}>
                <label htmlFor="email" className="label">Email Address *</label>
                <input id="email" type="email" className="input" value={form.email} onChange={set("email")} />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
              <div data-error={!!errors.location}>
                <label htmlFor="location" className="label">Current Location *</label>
                <input id="location" className="input" value={form.location} onChange={set("location")} />
                {errors.location && <p className="error-text">{errors.location}</p>}
              </div>
            </div>
          </fieldset>

          {/* Football information */}
          <fieldset>
            <legend className="section-title mb-4">Football Information</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-error={!!errors.level}>
                <label htmlFor="level" className="label">Player Level *</label>
                <select id="level" className="input" value={form.level} onChange={set("level")}>
                  <option value="">Select your level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {errors.level && <p className="error-text">{errors.level}</p>}
              </div>
              <div data-error={!!errors.preferredPosition}>
                <label htmlFor="prefPos" className="label">Preferred Position *</label>
                <select id="prefPos" className="input" value={form.preferredPosition} onChange={set("preferredPosition")}>
                  <option value="">Select a position</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.preferredPosition && <p className="error-text">{errors.preferredPosition}</p>}
              </div>
              <div>
                <label htmlFor="secPos" className="label">Secondary Position (optional)</label>
                <select id="secPos" className="input" value={form.secondaryPosition} onChange={set("secondaryPosition")}>
                  <option value="">None</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div data-error={!!errors.preferredFoot}>
                <label htmlFor="foot" className="label">Preferred Foot *</label>
                <select id="foot" className="input" value={form.preferredFoot} onChange={set("preferredFoot")}>
                  <option value="">Select preferred foot</option>
                  {FEET.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                {errors.preferredFoot && <p className="error-text">{errors.preferredFoot}</p>}
              </div>
              <div data-error={!!errors.currentClub}>
                <label htmlFor="currentClub" className="label">Current Club / Academy *</label>
                <input
                  id="currentClub"
                  className="input"
                  placeholder="e.g. a local club"
                  value={form.noCurrentClub ? "Not currently registered" : form.currentClub}
                  disabled={form.noCurrentClub}
                  onChange={set("currentClub")}
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={form.noCurrentClub} onChange={setBool("noCurrentClub")} />
                  Not currently registered
                </label>
                {errors.currentClub && <p className="error-text">{errors.currentClub}</p>}
              </div>
              <div data-error={!!errors.previousClub}>
                <label htmlFor="previousClub" className="label">Previous Club / Academy *</label>
                <input
                  id="previousClub"
                  className="input"
                  placeholder="e.g. a school or club team"
                  value={form.noPreviousClub ? "No previous club/academy" : form.previousClub}
                  disabled={form.noPreviousClub}
                  onChange={set("previousClub")}
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={form.noPreviousClub} onChange={setBool("noPreviousClub")} />
                  No previous club/academy
                </label>
                {errors.previousClub && <p className="error-text">{errors.previousClub}</p>}
              </div>
              <div className="sm:col-span-2" data-error={!!errors.experience}>
                <label htmlFor="experience" className="label">
                  Football Experience — briefly describe your football experience. *
                </label>
                <textarea id="experience" rows={4} className="input" value={form.experience} onChange={set("experience")} />
                {errors.experience && <p className="error-text">{errors.experience}</p>}
              </div>
            </div>
          </fieldset>

          {/* Media */}
          <fieldset>
            <legend className="section-title mb-4">Player Media</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-error={!!errors.photo}>
                <label htmlFor="photo" className="label">Player Photo *</label>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-castmog-green file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-castmog-deep"
                  onChange={setFile("photo")}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Upload a clear photo of yourself. {form.photo && `Selected: ${form.photo.name}`}
                </p>
                {errors.photo && <p className="error-text">{errors.photo}</p>}
              </div>
              <div data-error={!!errors.videoLink}>
                <label htmlFor="videoLink" className="label">Football Video / Highlight (optional)</label>
                <input
                  id="videoLink"
                  className="input"
                  placeholder="Paste a link to your highlight video"
                  value={form.videoLink}
                  onChange={set("videoLink")}
                />
                {errors.videoLink && <p className="error-text">{errors.videoLink}</p>}
              </div>
            </div>
          </fieldset>

          {/* Application question */}
          <fieldset>
            <legend className="section-title mb-4">Application Question</legend>
            <div data-error={!!errors.reason}>
              <label htmlFor="reason" className="label">
                Why do you want to join Castmog Ladies Football Academy? *
              </label>
              <textarea id="reason" rows={4} className="input" value={form.reason} onChange={set("reason")} />
              {errors.reason && <p className="error-text">{errors.reason}</p>}
            </div>
          </fieldset>

          {/* Consent */}
          <fieldset data-error={!!errors.consent}>
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-castmog-soft px-5 py-4">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={setBool("consent")}
                className="mt-0.5 h-4 w-4 accent-[#15803d]"
              />
              <span className="text-sm leading-relaxed text-gray-700">
                I confirm that the information I have provided is accurate and I agree to be
                contacted by Castmog regarding my application.
              </span>
            </label>
            {errors.consent && <p className="error-text">{errors.consent}</p>}
          </fieldset>

          {Object.keys(errors).length > 0 && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              We couldn't submit your application. Please check the highlighted fields and try
              again.
            </p>
          )}

          <div>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
