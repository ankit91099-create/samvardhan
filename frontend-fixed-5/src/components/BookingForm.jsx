import React, { useState } from "react";
import { bookingAPI } from "../services/api";
import "./BookingForm.css";

const SERVICES = [
  { value: "adhd",                label: "ADHD Support" },
  { value: "autism",              label: "Autism Therapy" },
  { value: "speech_therapy",      label: "Speech Therapy" },
  { value: "learning_disability", label: "Learning Disability Program" },
  { value: "behavioural_therapy", label: "Behavioural Therapy" },
  { value: "occupational_therapy",label: "Occupational Therapy" },
  { value: "other",               label: "Other / Consultation" },
];

const INITIAL = {
  name: "", age: "", phone: "", email: "", service: "", message: "",
};

const BookingForm = () => {
  const [form,    setForm]    = useState(INITIAL);
  const [status,  setStatus]  = useState(null); 
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())                    e.name    = "Name is required";
    const ageNum = Number(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 0 || ageNum > 25)
                                              e.age     = "Enter a valid child age (0–25)";
    if (!/^[6-9]\d{9}$/.test(form.phone))    e.phone   = "Enter a valid 10-digit Indian phone number";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
                                              e.email   = "Enter a valid email";
    if (!form.service)                        e.service = "Please select a service";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setStatus(null);
    try {
      await bookingAPI.submit({ ...form, age: Number(form.age) });
      setStatus("success");
      setMessage("Your booking has been submitted! Our team will contact you within 24 hours.");
      setForm(INITIAL);
      setErrors({});
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Please try again or call +91 95872 46814.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="booking-form" onSubmit={handleSubmit} noValidate>

      {status && (
        <div className={`booking-alert booking-alert--${status}`} role="alert">
          {status === "success" ? "✅" : "⚠️"} {message}
        </div>
      )}

      <div className="bf-row">
        <div className="bf-group">
          <label htmlFor="bf-name">Guardian / Patient Name *</label>
          <input
            id="bf-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Ankit Kumar"
            autoComplete="name"
          />
          {errors.name && <span className="bf-error" role="alert">{errors.name}</span>}
        </div>

        <div className="bf-group">
          <label htmlFor="bf-age">Child's Age *</label>
          <input
            id="bf-age"
            name="age"
            type="number"
            min="0"
            max="25"
            value={form.age}
            onChange={handleChange}
            placeholder="e.g. 7"
          />
          {errors.age && <span className="bf-error" role="alert">{errors.age}</span>}
        </div>
      </div>

      <div className="bf-row">
        <div className="bf-group">
          <label htmlFor="bf-phone">Phone Number *</label>
          <input
            id="bf-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
            autoComplete="tel"
          />
          {errors.phone && <span className="bf-error" role="alert">{errors.phone}</span>}
        </div>

        <div className="bf-group">
          <label htmlFor="bf-email">Email (optional)</label>
          <input
            id="bf-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="parent@example.com"
            autoComplete="email"
          />
          {errors.email && <span className="bf-error" role="alert">{errors.email}</span>}
        </div>
      </div>

      <div className="bf-group">
        <label htmlFor="bf-service">Service Required *</label>
        <select id="bf-service" name="service" value={form.service} onChange={handleChange}>
          <option value="">— Select a service —</option>
          {SERVICES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {errors.service && <span className="bf-error" role="alert">{errors.service}</span>}
      </div>

      <div className="bf-group">
        <label htmlFor="bf-message">Message / Concern</label>
        <textarea
          id="bf-message"
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="Briefly describe your child's condition or what kind of help you're looking for…"
          maxLength={1000}
        />
      </div>

      <button type="submit" className="bf-submit-btn" disabled={loading}>
        {loading ? "Submitting…" : "Book Appointment →"}
      </button>
    </form>
  );
};

export default BookingForm;
