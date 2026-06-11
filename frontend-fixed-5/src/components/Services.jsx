import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Services.css";
import "./Style.css";
import logo from "../assets/logo.png";
import speechImg from "../assets/speech.jpg";
import occupationalImg from "../assets/occupational.jpg";
import abaImg from "../assets/aba.jpg";
import psychologyImg from "../assets/psychology.jpg";

const services = [
  {
    id: "speech",
    title: "Speech Therapy",
    subtitle: "Helping Children Communicate Better",
    image: speechImg,
    accent: "teal",
    emoji: "🗣️",
    description:
      "Speech therapy is a specialised treatment that helps children improve their speaking, language, communication, and swallowing abilities. It targets delayed speech, unclear pronunciation, stammering, autism-related communication difficulties, and language comprehension challenges. Our certified speech-language pathologists use play-based, evidence-driven methods — games, storytelling, sound practice, and interactive activities — so children learn while having fun. Speech therapy helps people speak more clearly, express thoughts better, gain confidence, and communicate effectively in daily life.",
    features: [
      "Communication Improvement",
      "Pronunciation Practice",
      "Language Development",
      "Confidence Building",
    ],
    stat: { value: "95%", label: "Improvement Rate" },
  },
  {
    id: "occupational",
    title: "Occupational Therapy",
    subtitle: "Supporting Daily Life Skills & Independence",
    image: occupationalImg,
    accent: "amber",
    emoji: "🤲",
    description:
      "Occupational therapy helps children develop the physical, sensory, and cognitive skills required for everyday life. We work with children facing challenges related to autism, developmental delay, ADHD, or fine motor difficulties through sensory play, balancing exercises, hand coordination, and structured self-care training such as eating, dressing, and grooming. Our therapy helps children become more independent, improve their concentration, motor skills, social interaction, and confidence in school and daily life.",
    features: [
      "Motor Skill Development",
      "Sensory Activities",
      "Hand Coordination",
      "Daily Living Skills",
    ],
    stat: { value: "200+", label: "Children Supported" },
  },
  {
    id: "aba",
    title: "ABA Therapy",
    subtitle: "Improving Learning & Positive Behaviour",
    image: abaImg,
    accent: "green",
    emoji: "🧠",
    description:
      "Applied Behaviour Analysis (ABA) Therapy is a structured, evidence-based approach to supporting children with autism spectrum disorder and developmental challenges. Our trained therapists use positive reinforcement — rewards, praise, structured games — to encourage constructive behaviour, improve focus, and teach vital social and communication skills. Every session is personalised according to the child's pace and needs, conducted in a supportive, child-friendly environment. The goal is to help children achieve better independence, learning ability, and social development.",
    features: [
      "Behaviour Improvement",
      "Positive Reinforcement",
      "Social Interaction",
      "Focus & Attention",
    ],
    stat: { value: "1:1", label: "Personalised Sessions" },
  },
  {
    id: "psychology",
    title: "Child Psychology",
    subtitle: "Supporting Emotional & Mental Growth",
    image: psychologyImg,
    accent: "coral",
    emoji: "💛",
    description:
      "Child psychology focuses on understanding the mental, emotional, social, and behavioural development of children from infancy through adolescence. Our child psychologists help identify and support children experiencing anxiety, ADHD, behavioural difficulties, or social challenges through counselling, play therapy, and parent guidance. We equip children with emotional regulation tools, resilience, and the confidence to thrive in school and daily life while maintaining healthy social relationships.",
    features: [
      "Emotional Support",
      "Behaviour Guidance",
      "Confidence Building",
      "Mental Development",
    ],
    stat: { value: "5+", label: "Years Experience" },
  },
];

const whyUs = [
  { icon: "🎓", title: "Expert Therapists", desc: "Certified professionals with deep expertise in child development and special education." },
  { icon: "🌈", title: "Child-Friendly Space", desc: "Colourful, safe, and stimulating environments designed specially for young learners." },
  { icon: "🎯", title: "Personalised Care", desc: "Every child receives a therapy plan built around their unique goals and progress." },
  { icon: "🔬", title: "Evidence-Based", desc: "All therapies follow internationally recognised, research-backed protocols." },
  { icon: "👨‍👩‍👧", title: "Family Involvement", desc: "We partner with parents and caregivers at every step of the journey." },
  { icon: "📊", title: "Progress Tracking", desc: "Regular assessments and detailed reports keep families informed and confident." },
];

const process = [
  { step: "01", title: "Initial Assessment", desc: "Comprehensive evaluation by our specialist to understand your child's unique needs." },
  { step: "02", title: "Personalised Plan", desc: "We design a tailored therapy plan with clear milestones and goals." },
  { step: "03", title: "Therapy Sessions", desc: "Regular, structured sessions in a warm and engaging environment." },
  { step: "04", title: "Progress Review", desc: "Continuous monitoring and plan adjustments to maximise outcomes." },
];

/* useInView hook */
function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

/*  Component */
export default function Services() {
  const [activeTab, setActiveTab] = useState("speech");
  const whyRef  = useRef(null);
  const procRef = useRef(null);
  const whyVisible  = useInView(whyRef);
  const procVisible = useInView(procRef);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const active = services.find((s) => s.id === activeTab);

  return (
    <div className="svc-page">

      {/*  SHARED HEADER (same as Home) */}
      <header className="site-header">
        <div className="logo">
          <img src={logo} alt="Samvardhan Bloom logo" />
          <div className="logo-text">
            <span className="samvardhan">Samvardhan</span>
            <span className="bloom">BLOOM</span>
          </div>
        </div>
        <nav className="site-nav">
          <a href="/">Home</a>
          {/*<a href="/about">About</a>*/}
          <a href="/services">Services</a>
          {/*<a href="/therapy">Therapies</a>*/}
          <a href="/contact">Contact</a>
          <a href="/#registration" className="nav-cta">Book Now</a>
        </nav>
      </header>

      {/* HERO  */}
      <section className="svc-hero">
        <div className="svc-hero-overlay" />
        <div className="svc-hero-content">
          <p className="section-label">Our Therapy Services</p>
          <h1>
            Therapy That <em className="hero-accent">Transforms</em><br />Young Lives
          </h1>
          <p>
            Professional, compassionate, and evidence-based therapy services for children with
            special needs — helping every child communicate, learn, and grow with confidence.
          </p>
          <div className="svc-hero-actions">
            <a href="#explore" className="btn btn-primary">Explore Services</a>
            <a href="/#registration" className="btn btn-outline">Book a Session</a>
          </div>
        </div>

        <div className="svc-hero-cards">
          {services.map((s, i) => (
            <div
              key={s.id}
              className={`svc-float-card svc-float-card--${i}`}
              style={{ animationDelay: `${i * 0.4}s` }}
              onClick={() => {
                setActiveTab(s.id);
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>{s.emoji}</span>
              <p>{s.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/*  STATS STRIP */}
      <div className="stats-strip">
        <div className="stat-item"><strong>500+</strong><span>Children Helped</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><strong>5+</strong><span>Years Experience</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><strong>4</strong><span>Specialist Therapies</span></div>
        <div className="stat-divider" />
        <div className="stat-item"><strong>98%</strong><span>Parent Satisfaction</span></div>
      </div>

      {/* TAB NAVIGATION  */}
      <section className="svc-tabs-section" id="explore">
        <div className="svc-tabs-header fade-in">
          <p className="section-label">What We Offer</p>
          <h2>Choose a Therapy to Learn More</h2>
        </div>

        <div className="svc-tabs">
          {services.map((s) => (
            <button
              key={s.id}
              className={`svc-tab svc-tab--${s.accent}${activeTab === s.id ? " active" : ""}`}
              onClick={() => setActiveTab(s.id)}
            >
              <span className="svc-tab-emoji">{s.emoji}</span>
              {s.title}
            </button>
          ))}
        </div>

        {/*  ACTIVE SERVICE DETAIL  */}
        {active && (
          <div className={`svc-detail svc-detail--${active.accent}`} key={active.id}>
            <div className="svc-detail-image">
              <img src={active.image} alt={active.title} />
              <div className={`svc-detail-badge svc-badge--${active.accent}`}>
                {active.emoji} {active.subtitle}
              </div>
            </div>

            <div className="svc-detail-body">
              <span className={`svc-tag svc-tag--${active.accent}`}>Special Care</span>
              <h2>{active.title}</h2>
              <h4 className={`svc-subtitle--${active.accent}`}>{active.subtitle}</h4>
              <p className="svc-desc">{active.description}</p>

              <div className="svc-features-grid">
                {active.features.map((f, i) => (
                  <div className={`svc-feature-box svc-feature-box--${active.accent}`} key={i}>
                    <span className="check">✓</span> {f}
                  </div>
                ))}
              </div>

              <div className="svc-detail-footer">
                <a href="/#registration" className="btn btn-primary">Book Consultation</a>
                <div className="svc-stat-pill">
                  <strong>{active.stat.value}</strong>
                  <span>{active.stat.label}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ALL SERVICES CARDS  */}
      <section className="svc-cards-section">
        <div className="svc-cards-header fade-in">
          <p className="section-label">At a Glance</p>
          <h2>All Four Therapy Programmes</h2>
          <p className="section-subtext">
            Click any card to view full details above, or book a consultation directly.
          </p>
        </div>

        <div className="service-grid">
          {services.map((s) => (
            <div
              key={s.id}
              className={`service-card service-card--${s.accent}${activeTab === s.id ? " service-card--active" : ""}`}
              onClick={() => {
                setActiveTab(s.id);
                document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className="service-icon">{s.emoji}</div>
              <h3>{s.title}</h3>
              <p>{s.subtitle}</p>
              <ul className="svc-mini-features">
                {s.features.map((f, i) => (
                  <li key={i}><span className="check">✓</span>{f}</li>
                ))}
              </ul>
              <span className="card-link">Learn More →</span>
            </div>
          ))}
        </div>
      </section>

      {/*  PROCESS  */}
      <section className="svc-process-section" ref={procRef}>
        <div className={`svc-process-inner${procVisible ? " proc-visible" : ""}`}>
          <p className="section-label" style={{ color: "rgba(255,209,102,0.8)" }}>How We Work</p>
          <h2>Your Journey With Us</h2>
          <div className="svc-process-grid">
            {process.map((p, i) => (
              <div className="svc-process-card" key={i} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="svc-process-num">{p.step}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  WHY US  */}
      <section className="svc-why-section" ref={whyRef}>
        <div className={`svc-why-inner${whyVisible ? " why-visible" : ""}`}>
          <div className="svc-why-header">
            <p className="section-label">Why Families Trust Us</p>
            <h2>The Samvardhan Bloom Difference</h2>
            <p className="section-subtext">
              We combine professional expertise with a warm, family-centred approach to deliver outcomes that truly matter.
            </p>
          </div>

          <div className="svc-why-grid">
            {whyUs.map((w, i) => (
              <div className="svc-why-card" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="svc-why-icon">{w.icon}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CTA BANNER  */}
      <section className="svc-cta-section">
        <div className="svc-cta-inner fade-in">
          <h2>Ready to Begin Your Child's Journey?</h2>
          <p>Take the first step — our specialists are here to listen, assess, and guide your family.</p>
          <div className="svc-cta-btns">
            <a href="/#registration" className="btn btn-primary">Book a Free Consultation</a>
            <a href="tel:+919587246814" className="btn btn-outline">📞 Call Us Now</a>
          </div>
        </div>
      </section>

    </div>
  );
}
