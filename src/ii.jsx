import React, { useEffect, useState } from "react";
import "./App.css";

export default function Ii({ openAdmin }) {
  const [courses, setCourses] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    course: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/gallery").then((r) => r.json()),
      fetch("/api/notices").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ])
      .then(([c, g, n, e]) => {
        const coursesData = Array.isArray(c) ? c : c.courses || [];
        const galleryData = Array.isArray(g) ? g : g.gallery || [];
        const noticesData = Array.isArray(n) ? n : n.notices || [];
        const eventsData = Array.isArray(e) ? e : e.events || [];

        setCourses(coursesData);
        setGallery(galleryData);
        setNotices(noticesData);
        setEvents(eventsData);

        if (coursesData[0]) {
          setForm((f) => ({
            ...f,
            course: coursesData[0].name,
          }));
        }
      })
      .catch((err) => {
        console.error("API Error:", err);
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const r = await fetch("/api/admission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await r.json();

      if (!r.ok || !data.success) {
        throw new Error(data.message || "Submission failed");
      }

      setSubmitted(true);

      setForm({
        fullName: "",
        email: "",
        phone: "",
        course: courses[0]?.name || "",
        message: "",
      });
    } catch (err) {
      alert(err.message || "Server se connect nahi hua.");
    } finally {
      setLoading(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="public-site">

      {/* TOP BAR */}
      <div className="topbar">
        <div>
          <span>📞 +91 1800-123-9876</span>
          <span>✉️ admissions@apexinstitute.edu.in</span>
        </div>

        <div>
          <span>Admissions Open 2026</span>
        </div>
      </div>

      {/* HEADER */}
      <header className="main-header">
        <div className="header-inner">

          <a href="#home" className="brand" onClick={closeMenu}>
            <div className="brand-logo">AIT</div>

            <div className="brand-text">
              <strong>Apex Institute</strong>
              <small>of Technology</small>
            </div>
          </a>

          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

         <nav className={menuOpen ? "nav open" : "nav"}>
  <a href="#home" onClick={closeMenu}>Home</a>
  <a href="#about" onClick={closeMenu}>About</a>
  <a href="#courses" onClick={closeMenu}>Courses</a>
  <a href="#notices" onClick={closeMenu}>Notices</a>
  <a href="#gallery" onClick={closeMenu}>Gallery</a>
  <a href="#events" onClick={closeMenu}>Events</a>
  <a href="#contact" onClick={closeMenu}>Contact</a>

  <button
  className="nav-admin"
  onClick={openAdmin}
>
  🔐 Admin Login
</button>
  <a
    href="#admission"
    className="nav-apply"
    onClick={closeMenu}
  >
    Apply Now
  </a>
</nav>

        </div>
      </header>

      {/* HERO */}
     <section id="home" className="hero">

  <div className="hero-overlay"></div>

  <div className="hero-content">

    <div className="hero-left">

      <div className="hero-badge">
        🎓 QUALITY EDUCATION • INNOVATION • SUCCESS
      </div>

      <h1>
        Shape Your Future
        <br />
        <span>With AIT</span>
      </h1>

      <p>
        Build knowledge. Develop skills. Create your future.
        Experience career-focused education with modern learning.
      </p>

      <div className="hero-buttons">
        <a href="#courses" className="btn-primary">
          Explore Courses →
        </a>

        <a href="#admission" className="btn-outline">
          Apply for Admission
        </a>
      </div>

      <div className="hero-trust">
        <div>
          <strong>2026</strong>
          <span>Admissions Open</span>
        </div>

        <div>
          <strong>100%</strong>
          <span>Career Focused</span>
        </div>

        <div>
          <strong>24×7</strong>
          <span>Student Support</span>
        </div>
      </div>

    </div>

    <div className="hero-image">
      <img
        src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80"
        alt="AIT Campus"
      />
    </div>

  </div>

</section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-inner">

          <div className="stat">
            <strong>10+</strong>
            <span>Academic Programs</span>
          </div>

          <div className="stat">
            <strong>1000+</strong>
            <span>Students</span>
          </div>

          <div className="stat">
            <strong>50+</strong>
            <span>Faculty Members</span>
          </div>

          <div className="stat">
            <strong>15+</strong>
            <span>Years of Excellence</span>
          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section about-section">

        <div className="section-label">ABOUT OUR INSTITUTE</div>

        <div className="section-title-row">
          <div>
            <h2>
              Education that prepares you
              <br />
              <span>for tomorrow.</span>
            </h2>
          </div>

          <p>
            Apex Institute of Technology provides career-oriented
            education with a strong focus on practical learning,
            professional skills and holistic development.
          </p>
        </div>

        <div className="about-grid">

          <div className="about-card about-main">
            <div className="about-icon">🎓</div>
            <h3>Learn. Grow. Succeed.</h3>

            <p>
              Our academic environment combines classroom learning,
              practical exposure, technology and professional
              development to prepare students for real-world careers.
            </p>

            <a href="#courses">
              Discover our programs →
            </a>
          </div>

          <div className="about-card">
            <span className="big-icon">💻</span>
            <h3>Modern Labs</h3>
            <p>Practical learning with modern infrastructure.</p>
          </div>

          <div className="about-card">
            <span className="big-icon">🏆</span>
            <h3>Student Growth</h3>
            <p>Clubs, activities and personality development.</p>
          </div>

          <div className="about-card">
            <span className="big-icon">🤝</span>
            <h3>Career Support</h3>
            <p>Training and guidance for career development.</p>
          </div>

        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="section courses-section">

        <div className="section-label">ACADEMIC PROGRAMS</div>

        <div className="section-heading">
          <div>
            <h2>Explore Our Courses</h2>
            <p>
              Choose a program that matches your career goals.
            </p>
          </div>

          <span className="course-count">
            {courses.length} Programs
          </span>
        </div>

        <div className="course-grid">

          {Array.isArray(courses) &&
            courses.map((c) => (
              <article className="course-card" key={c.id}>

                <div className="course-top">
                  <span>{c.category || "PROGRAM"}</span>
                  <b>→</b>
                </div>

                <div className="course-number">
                  {String(c.id).padStart(2, "0")}
                </div>

                <h3>{c.name}</h3>

                <p>
                  {c.description ||
                    "Career-focused academic program designed for practical learning."}
                </p>

                <div className="course-info">
                  <div>
                    <small>Duration</small>
                    <strong>{c.duration || "As per program"}</strong>
                  </div>

                  <div>
                    <small>Fees</small>
                    <strong>{c.fees || "Contact office"}</strong>
                  </div>
                </div>

                <a
                  href="#admission"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      course: c.name,
                    }))
                  }
                >
                  Apply for this course →
                </a>

              </article>
            ))}

          {!courses.length && (
            <div className="empty-box">
              Courses will appear here.
            </div>
          )}

        </div>
      </section>

      {/* NOTICE */}
      <section id="notices" className="section notices-section">

        <div className="section-label">LATEST UPDATES</div>

        <div className="section-heading">
          <div>
            <h2>Notice Board</h2>
            <p>Stay updated with the latest institute announcements.</p>
          </div>
        </div>

        <div className="notice-grid">

          {Array.isArray(notices) &&
            notices.map((n) => (
              <article className="notice-card" key={n.id}>

                <div className="notice-date">
                  <strong>
                    {n.date ? new Date(n.date).getDate() : "--"}
                  </strong>

                  <span>
                    {n.date
                      ? new Date(n.date).toLocaleDateString("en-IN", {
                          month: "short",
                        })
                      : "NEWS"}
                  </span>
                </div>

                <div className="notice-content">
                  <span>IMPORTANT NOTICE</span>

                  <h3>{n.title}</h3>

                  <p>
                    {n.description ||
                      "Latest institute announcement and important information."}
                  </p>
                </div>

                <b className="notice-arrow">→</b>

              </article>
            ))}

          {!notices.length && (
            <div className="empty-box">
              No notices available.
            </div>
          )}

        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="section gallery-section">

        <div className="section-label">CAMPUS LIFE</div>

        <div className="section-heading">
          <div>
            <h2>Life at AIT</h2>
            <p>Explore moments from our campus.</p>
          </div>
        </div>

        <div className="gallery-grid">

          {Array.isArray(gallery) &&
            gallery.map((g, index) => (
              <figure
                className={`gallery-item gallery-${index % 5}`}
                key={g.id}
              >
                <img src={g.url} alt={g.title || "Campus"} />

                <figcaption>
                  <span>AIT CAMPUS</span>
                  <strong>{g.title || "Campus Life"}</strong>
                </figcaption>
              </figure>
            ))}

          {!gallery.length && (
            <div className="empty-box">
              Gallery images will appear here.
            </div>
          )}

        </div>
      </section>
      <section className="section">
  <div className="section-heading">
    <h2>Life At AIT</h2>
  </div>

  <div className="life-grid">

    <div className="life-card">
      <img
        src="https://images.unsplash.com/photo-1517649763962-0c623066013b"
        alt="Sports"
      />
      <h3>🏆 Sports</h3>
      <p>Annual sports meets and inter-college competitions.</p>
    </div>

    <div className="life-card">
      <img
        src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
        alt="Technical Events"
      />
      <h3>💻 Technical Events</h3>
      <p>Hackathons, coding contests and technical workshops.</p>
    </div>

    <div className="life-card">
      <img
        src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a"
        alt="Cultural Fest"
      />
      <h3>🎭 Cultural Fest</h3>
      <p>Music, dance and cultural celebrations throughout the year.</p>
    </div>

  </div>
</section>
<section className="placement">

  <div className="stat-box">
    <h2>500+</h2>
    <p>Students</p>
  </div>

  <div className="stat-box">
    <h2>25+</h2>
    <p>Faculty</p>
  </div>

  <div className="stat-box">
    <h2>15+</h2>
    <p>Courses</p>
  </div>

  <div className="stat-box">
    <h2>100%</h2>
    <p>Placement Support</p>
  </div>

</section>

      {/* EVENTS */}
      <section id="events" className="section events-section">

        <div className="section-label">WHAT'S HAPPENING</div>

        <div className="section-heading">
          <div>
            <h2>Upcoming Events</h2>
            <p>Activities, programs and events at our institute.</p>
          </div>
        </div>

        <div className="events-grid">

          {Array.isArray(events) &&
            events.map((event) => (
              <article className="event-card" key={event.id}>

                <div className="event-date">
                  📅 {event.date}
                </div>

                <h3>{event.title}</h3>

                <div className="event-time">
                  🕒 {event.time || "Time will be announced"}
                </div>

                <p>
                  {event.description ||
                    "Join us for this upcoming institute event."}
                </p>

                <span>View Event →</span>

              </article>
            ))}

          {!events.length && (
            <div className="empty-box">
              No upcoming events.
            </div>
          )}

        </div>
      </section>

      {/* ADMISSION */}
      <section id="admission" className="admission">

        <div className="admission-inner">

          <div className="admission-info">

            <div className="section-label">
              START YOUR JOURNEY
            </div>

            <h2>
              Your future
              <br />
              starts <span>here.</span>
            </h2>

            <p>
              Take the first step towards your career.
              Submit your application and our admission
              team will contact you.
            </p>

            <div className="admission-points">
              <div>✓ Easy online application</div>
              <div>✓ Expert admission guidance</div>
              <div>✓ Career-focused programs</div>
              <div>✓ Student support</div>
            </div>

          </div>

          <div className="admission-card">

            {submitted ? (
              <div className="success">

                <div className="success-icon">✓</div>

                <h3>Application Submitted!</h3>

                <p>
                  Thank you. Your details have been
                  saved successfully.
                </p>

                <button onClick={() => setSubmitted(false)}>
                  Submit Another Application
                </button>

              </div>
            ) : (

              <form onSubmit={submit}>

                <h3>Admission Application</h3>

                <p>Fill in your details below.</p>

                <input
                  placeholder="Full Name *"
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />

                <div className="form-two">

                  <input
                    type="email"
                    placeholder="Email *"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />

                  <input
                    type="tel"
                    placeholder="Phone *"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />

                </div>

                <select
                  value={form.course}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      course: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select Course</option>

                  {courses.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="Your message"
                  value={form.message}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      message: e.target.value,
                    })
                  }
                />

                <button disabled={loading}>
                  {loading
                    ? "Submitting..."
                    : "Submit Application →"}
                </button>

                <small>
                  Your information is safe and will only
                  be used for admission communication.
                </small>

              </form>

            )}

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact">

        <div className="footer-inner">

          <div className="footer-brand">
            <div className="brand-logo">AIT</div>

            <h3>Apex Institute of Technology</h3>

            <p>
              Career-oriented education with practical
              learning and holistic development.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <a href="#about">About</a>
            <a href="#courses">Courses</a>
            <a href="#notices">Notice Board</a>
            <a href="#gallery">Gallery</a>
            <a href="#admission">Admission</a>
          </div>

          <div>
            <h4>Contact Us</h4>
            <p>📍 Paharia Expressway, Tech City Zone, UP, India</p>
            <p>📞 +91 1800-123-9876</p>
            <p>✉️ admissions@apexinstitute.edu.in</p>
          </div>

        </div>

        <div className="copyright">
          © 2026 Apex Institute of Technology.
          All Rights Reserved.
        </div>

      </footer>

      {/* FLOATING BUTTON */}
      <a href="#admission" className="floating-apply">
        Apply Now
      </a>

    </div>
  );
}