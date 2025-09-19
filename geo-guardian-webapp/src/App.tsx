
import Logo from '/geo-guardian.png'
import './App.css'
import data from './assets/data.json'

function App() {
  return (
    <div className="geo-guardian-home">
      <nav className="gg-navbar">
        <div className="gg-navbar-brand">
          <img src={Logo} alt="Geo Guardian Logo" className="gg-logo" />
          <span className="gg-title">Geo Guardian</span>
        </div>
        <div className="gg-navbar-sub">MVP — Prototype</div>
      </nav>

      <main className="gg-main">
        {/* Hero Section */}
        <section className="gg-hero fade-in">
          <h1>{data.hero.title}</h1>
          <h2>{data.hero.subtitle}</h2>
          <p>{data.hero.pilot} | <span className="gg-date">{data.hero.date}</span> | Presenter: <span className="gg-presenter">{data.hero.presenter}</span></p>
          <a href="#contact" className="gg-btn">Contact Us</a>
        </section>

        {/* Executive Summary */}
        <section className="gg-section fade-in-delay">
          <h2>Executive Summary</h2>
          <div className="gg-summary-grid">
            <div>
              <h3>Problem</h3>
              <ul>
                {data.executiveSummary.problem.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3>Solution</h3>
              <ul>
                {data.executiveSummary.solution.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3>Ask</h3>
              <ul>
                {data.executiveSummary.ask.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* Strategic Objectives */}
        <section className="gg-section fade-in-delay">
          <h2>Strategic Objectives</h2>
          <ul>
            {data.objectives.map((item, idx) => <li key={idx}>{item}</li>)}
          </ul>
        </section>

        {/* Contact & Team */}
        <section id="contact" className="gg-section fade-in-delay">
          <h2>Contact & Team</h2>
          <ul>
            <li>Core contacts: {data.contacts.core}</li>
            <li>Dev lead: {data.contacts.devLead}</li>
            <li>Product owner: {data.contacts.productOwner}</li>
            <li>Legal advisor: {data.contacts.legalAdvisor}</li>
          </ul>
        </section>
      </main>

      <footer className="gg-footer">
        &copy; {new Date().getFullYear()} Geo Guardian. All rights reserved.
      </footer>
    </div>
  )
}

export default App
