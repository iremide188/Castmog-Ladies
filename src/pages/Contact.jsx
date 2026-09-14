import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { PageHero } from "../components/ui";
import { site } from "../data/content";

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if (!form.phone.trim()) errs.phone = "Please enter your phone / WhatsApp number.";
    if (!form.email.trim()) errs.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Please enter a valid email address.";
    if (!form.message.trim()) errs.message = "Please enter your message.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSending(true);
    // In the production Castmog platform this message is stored securely for
    // academy administrators. This standalone copy shows the confirmation state.
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    }, 600);
  }

  return (
    <>
      <PageHero title="Contact" subtitle="Get in touch with Castmog Ladies Football Academy." />

      <section className="container-site py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title">Contact Information</h2>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 text-castmog-green" />
                <div>
                  <p className="text-sm font-bold">Phone / WhatsApp</p>
                  <a href={`tel:${site.phone}`} className="text-sm text-gray-600 hover:text-castmog-green">
                    {site.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="mt-0.5 text-castmog-green" />
                <div>
                  <p className="text-sm font-bold">Email</p>
                  <a href={`mailto:${site.email}`} className="break-all text-sm text-gray-600 hover:text-castmog-green">
                    {site.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-castmog-green" />
                <div>
                  <p className="text-sm font-bold">Training Location</p>
                  <p className="text-sm text-gray-500">To be announced.</p>
                </div>
              </li>
            </ul>
            <p className="mt-6 text-sm text-gray-500">
              Social media links coming soon.
            </p>
          </div>

          <div>
            <h2 className="section-title">Send a Message</h2>
            {sent ? (
              <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-6 py-8 text-center">
                <p className="text-base font-bold text-castmog-green">Message Sent</p>
                <p className="mt-2 text-sm text-gray-600">
                  Thank you for reaching out. The academy will get back to you.
                </p>
                <button
                  type="button"
                  className="btn-outline mt-5"
                  onClick={() => setSent(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="c-name" className="label">Name</label>
                  <input id="c-name" className="input" value={form.name} onChange={set("name")} />
                  {errors.name && <p className="error-text">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-phone" className="label">Phone / WhatsApp</label>
                  <input id="c-phone" className="input" value={form.phone} onChange={set("phone")} />
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className="label">Email</label>
                  <input id="c-email" type="email" className="input" value={form.email} onChange={set("email")} />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="c-message" className="label">Message</label>
                  <textarea id="c-message" rows={4} className="input" value={form.message} onChange={set("message")} />
                  {errors.message && <p className="error-text">{errors.message}</p>}
                </div>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={sending}>
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
