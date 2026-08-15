import { MapPin, Mail, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

export default function Contact() {
  const [isSent, setIsSent] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitError("");
    setIsSent(false);
    const formData = new FormData(form);
    const requestSubmissionId = submissionId ?? crypto.randomUUID();
    setSubmissionId(requestSubmissionId);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        message: String(formData.get("message") ?? "").trim(),
        submissionId: requestSubmissionId,
      }),
    });

    if (!response.ok) {
      setSubmitError("Your message could not be sent. Please try again.");
      return;
    }

    setIsSent(true);
    setSubmissionId(null);
    form.reset();
  };

  return (
    <main className="min-h-screen bg-[#f5f8f9] text-[#17223b]">
      <section className="bg-gradient-to-r from-[#263bd0] via-[#5266f0] to-[#182a9f] text-white">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 pb-14 pt-28 text-center sm:px-8 sm:pb-16 sm:pt-32">
          <h1 className="mx-auto max-w-3xl text-[32px] font-extrabold leading-[1.05] tracking-[-0.05em] sm:text-[48px]">
            Questions? We don&apos;t bite <span aria-label="cat" role="img">🐱</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Send us an email or contact us via live chat. We are always happy to help you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.04em]">Contact Information</h2>
            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <Mail className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-[#3155e8]/10 p-2 text-[#3155e8] shadow-sm shadow-[#3155e8]/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#3155e8] hover:text-white hover:shadow-lg hover:shadow-[#3155e8]/30" />
                <div><h3 className="font-bold text-[#243653]">Email</h3><p className="mt-1 text-sm text-[#71809d]">support@purelistverifier.com</p></div>
              </div>
              <div className="flex gap-4">
                <Phone className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-[#3155e8]/10 p-2 text-[#3155e8] shadow-sm shadow-[#3155e8]/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#3155e8] hover:text-white hover:shadow-lg hover:shadow-[#3155e8]/30" />
                <div><h3 className="font-bold text-[#243653]">Phone</h3><p className="mt-1 text-sm text-[#71809d]">+1 (555) 123-4567</p></div>
              </div>
              <div className="flex gap-4">
                <MapPin className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-[#3155e8]/10 p-2 text-[#3155e8] shadow-sm shadow-[#3155e8]/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#3155e8] hover:text-white hover:shadow-lg hover:shadow-[#3155e8]/30" />
                <div><h3 className="font-bold text-[#243653]">Address</h3><p className="mt-1 text-sm text-[#71809d]">123 Business St, Suite 100<br />San Francisco, CA 94107</p></div>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#243653]" htmlFor="contact-name">Name</label>
              <input id="contact-name" name="name" type="text" required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#3155e8] focus:outline-none focus:ring-2 focus:ring-[#3155e8]/15" placeholder="Your name" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#243653]" htmlFor="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" required className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#3155e8] focus:outline-none focus:ring-2 focus:ring-[#3155e8]/15" placeholder="your@email.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#243653]" htmlFor="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows={6} required className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-[#3155e8] focus:outline-none focus:ring-2 focus:ring-[#3155e8]/15" placeholder="Your message here..." />
            </div>
            <button type="submit" className="group relative isolate w-fit overflow-hidden rounded-full bg-gradient-to-r from-[#3155e8] to-[#5266f0] px-6 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:from-[#254fb8] hover:to-[#4055d7] hover:shadow-lg hover:shadow-[#3155e8]/35 after:absolute after:inset-y-0 after:-left-1/2 after:w-1/3 after:-skew-x-12 after:bg-white/30 after:blur-md after:transition-transform after:duration-500 after:content-[''] hover:after:translate-x-[420%]">
              <span className="relative z-10">{isSent ? "Message Sent" : "Send Message"}</span>
            </button>
            {isSent && <p className="text-sm font-semibold text-[#3155e8]" role="status" aria-live="polite">Thanks! Your message has been sent successfully.</p>}
            {submitError && <p className="text-sm font-semibold text-red-600" role="alert">{submitError}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
