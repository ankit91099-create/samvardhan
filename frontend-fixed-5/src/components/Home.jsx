import React, { useEffect, useRef } from "react";
import "./Style.css";
import logo from "../assets/logo.png";
import videoFile from "../assets/Child_Play_Video.mp4";
import ADHDimg from "../assets/ADHD.png";
import Behaviour from "../assets/behaviour.png";
import learn from "../assets/Learn dis.png";
import speech from "../assets/speech delays.png";
import Autism from "../assets/Autism Disorder.png";
import { FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp } from "react-icons/fa";
import doctorImg from "../assets/doctor.png";
import BookingForm from "./BookingForm";

const Home = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
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
          <a href="#registration" className="nav-cta">Book Now</a>
        </nav>
      </header>

      <section className="hero" ref={heroRef}>
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src={videoFile} type="video/mp4" />
        </video>
        <div className="hero-overlay" />

        <div className="hero-content">
          <span className="hero-badge">Trusted Care for Every Child</span>
          <h1>
            Helping Children <br />
            <span className="hero-accent">Grow, Learn &amp; Bloom</span>
          </h1>
          <p>
            Professional therapy and rehabilitation services designed to help
            every child reach their full potential.
          </p>
          <div className="hero-actions">
            <a href="#registration" className="btn btn-primary">
              Book a Consultation
            </a>
            <a href="/services" className="btn btn-outline">
              Explore Services
            </a>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span />
        </div>
      </section>

      <div className="stats-strip fade-in">
        <div className="stat-item">
          <strong>500+</strong>
          <span>Children Helped</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong>5+</strong>
          <span>Therapy Programs</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong>Expert</strong>
          <span>Certified Therapists</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <strong>Patna</strong>
          <span>Bihar's Premier Centre</span>
        </div>
      </div>

      <section className="services fade-in">
        <div className="section-label">What We Offer</div>
        <h2>Our Core Services</h2>
        <p className="section-subtext">
          Comprehensive, evidence-based therapies delivered by compassionate specialists.
        </p>

        <div className="service-grid">
          {[
            {
              icon: "🗣️",
              title: "Speech Therapy",
              desc: "Improve communication, language development and speech clarity for children of all ages.",
              color: "teal",
            },
            {
              icon: "✋",
              title: "Occupational Therapy",
              desc: "Develop fine motor skills and independence in daily activities.",
              color: "amber",
            },
            {
              icon: "🧩",
              title: "ABA Therapy",
              desc: "Behaviour therapy designed for children with autism and developmental delays.",
              color: "green",
            },
            {
              icon: "💛",
              title: "Child Psychology",
              desc: "Emotional and behavioural support for children and their families.",
              color: "coral",
            },
          ].map((s) => (
            <div className={`service-card service-card--${s.color}`} key={s.title}>
              <div className="service-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <a href="/services" className="card-link">Learn more →</a>
            </div>
          ))}
        </div>
      </section>

      {/* DOCTOR SECTION */}
      <section className="doctor-section fade-in">
        <div className="doctor-container">

          <div className="doctor-text">
            <p className="tag">PEDIATRIC OCCUPATIONAL THERAPIST</p>

            <h1 className="doctor-name">Dr. Sanit Ranjan</h1>
            <h3 className="doctor-role">Pediatric Occupational Therapist</h3>

            <p className="highlight">
              Provide Effective, Child-Centered Care and Family Support
              for Developmental Challenges.
            </p>

            <p className="desc">
              Dr. Sanit Ranjan is a dedicated Pediatric Occupational Therapist with
              extensive experience in neurodevelopmental and sensory processing disorders.
              He has successfully assessed and treated over 300 children, focusing on
              achieving independence.
            </p>

            <h2>Education</h2>
            <ul>
              <li>Master of Occupational Therapy (MOT - Pediatrics) (KMCH)</li>
              <li>Certified Sensory Integration Therapist (USC)</li>
              <li>Founder/Samvardhan bloom rehabilitation centre</li>
            </ul>

            <h2>Description</h2>
            <ul>
              <li>5+ Years Experience in Pediatric Occupational Therapy</li>
              <li>Specializes in ASD, ADHD, Sensory Processing Disorder</li>
            </ul>
          </div>

          {/* RIGHT IMAGE */}
          <div className="doctor-image">
            <img src={doctorImg} alt="Doctor" />
          </div>

        </div>
      </section>

      {/*  CONDITIONS  */}
      <section className="conditions fade-in">
        <div className="section-label">Conditions We Address</div>
        <h2>Helping Children with Common Challenges</h2>
        <p className="section-subtext">
          At Samvardhan Bloom, we specialise in a range of childhood conditions.
        </p>

        <div className="conditions-grid">
          {[
            { img: ADHDimg,   label: "ADHD" },
            { img: Behaviour, label: "Behaviour Issues" },
            { img: learn,     label: "Learning Disabilities" },
            { img: speech,    label: "Speech-Language Delays" },
            { img: Autism,    label: "Autism Spectrum Disorder" },
          ].map((c) => (
            <div className="condition-card" key={c.label}>
              <div className="condition-img-wrap">
                <img src={c.img} alt={c.label} />
              </div>
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/*  WHY US  */}
      <section className="why-us fade-in">
        <div className="why-us-text">
          <div className="section-label">Why Choose Us</div>
          <h2>A Centre Built Around Your Child</h2>
          <p>
            We combine clinical expertise with a warm, nurturing environment so
            children feel safe to learn, grow, and thrive. Every treatment plan
            is personalised to the individual child.
          </p>
          <ul className="why-list">
            <li>
              <span className="check">✓</span> Certified &amp; experienced therapists
            </li>
            <li>
              <span className="check">✓</span> Individual, goal-driven therapy plans
            </li>
            <li>
              <span className="check">✓</span> Family involvement &amp; parent coaching
            </li>
            <li>
              <span className="check">✓</span> Safe, child-friendly environment
            </li>
            <li>
              <span className="check">✓</span> Regular progress tracking &amp; reports
            </li>
          </ul>
        </div>

        <div className="why-us-visual">
          <div className="blob-card">
            <div className="blob-stat">
              <strong>98%</strong>
              <span>Parent Satisfaction</span>
            </div>
            <div className="blob-stat">
              <strong>Early</strong>
              <span>Intervention Focus</span>
            </div>
            <div className="blob-quote">
              "Every child deserves the chance to bloom."
            </div>
          </div>
        </div>
      </section>

      {/*  BOOKING FORM — wired to backend  */}
      <section id="registration" className="registration fade-in">
        <div className="registration-inner">
          <div className="reg-info">
            <div className="section-label">Get Started</div>
            <h2>Book a Free Consultation</h2>
            <p>
              Take the first step towards your child's brighter future. Fill in
              your details and our team will reach out within 24 hours.
            </p>
            <div className="contact-pill">
              <FaPhoneAlt size={14} />
              <a href="tel:9587246814">+91 95872 46814</a>
            </div>
            <div className="contact-pill">
              <FaWhatsapp size={14} />
              <a
                href="https://wa.me/919587246814"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/*  BookingForm component */}
          <div className="reg-form-wrap">
            <BookingForm />
          </div>
        </div>
      </section>

      {/*  ABOUT  */}
      <section className="about fade-in">
        <div className="about-inner">
          <div className="section-label">About Us</div>
          <h2>About Samvardhan Bloom</h2>
          <p>
            Samvardhan Bloom Rehabilitation Centre provides specialised therapy
            and rehabilitation programs for children with developmental, learning,
            and behavioural challenges. Located in Patna, Bihar, our mission is to
            help every child achieve their full potential through evidence-based,
            compassionate care.
          </p>
          <a href="/about" className="btn btn-outline">Read Our Story →</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              <div className="logo-text">
                <span className="samvardhan" style={{ color: "#fff" }}>Samvardhan</span>
                <span className="bloom" style={{ color: "#ffd166" }}>BLOOM</span>
              </div>
            </div>
            <p>
              Helping children grow, learn, and bloom through compassionate,
              professional rehabilitation care.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/services">Services</a>
            <a href="/therapy">Therapies</a>
            <a href="#registration">Book Appointment</a>
          </div>

          <div className="footer-col">
            <h4>Contact Us</h4>
            <div className="footer-contact-item">
              <FaMapMarkerAlt size={14} color="#ffd166" />
              <a
                href="https://www.google.com/maps?q=Samvardhan+Bloom+Rehabilitation+Centre"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pillar No 15, B/60, Maurya Path,<br />
                near Bailey Road, Ashokpuri,<br />
                Khajpura, Patna, Bihar 800014
              </a>
            </div>
            <div className="footer-contact-item">
              <FaPhoneAlt size={13} color="#ffd166" />
              <a href="tel:9587246814">+91 95872 46814</a>
            </div>
            <div className="footer-contact-item">
              <FaWhatsapp size={14} color="#ffd166" />
              <a
                href="https://wa.me/919587246814"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Samvardhan Bloom Rehabilitation Centre. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;
