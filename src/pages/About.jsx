import React from 'react'

export default function About() {
  return (
    <section className="about-page">
      <div className="about-hero">
        <p className="section-kicker">About AgroMart Pakistan</p>
        <h1>Growing better decisions for every farm.</h1>
        <p>AgroMart is a practical digital agriculture platform helping farmers find reliable products, understand market movement, and plan their work with confidence.</p>
      </div>

      <div className="about-grid">
        <article className="about-panel">
          <span className="about-number">01</span>
          <h2>Our mission</h2>
          <p>We connect farmers with useful crop inputs, transparent product information, live weather conditions, and market insights in one simple place.</p>
        </article>
        <article className="about-panel">
          <span className="about-number">02</span>
          <h2>Built for Pakistan</h2>
          <p>From Buner and Khyber Pakhtunkhwa to farms across Pakistan, our tools are designed around local crops, practical decisions, and dependable access.</p>
        </article>
        <article className="about-panel">
          <span className="about-number">03</span>
          <h2>What we offer</h2>
          <p>Shop farming essentials, check current weather, compare agricultural prices, and place delivery orders with your complete contact details.</p>
        </article>
      </div>

      <div className="about-callout">
        <div>
          <p className="section-kicker">Our promise</p>
          <h2>Useful information. Honest service. Stronger harvests.</h2>
        </div>
        <a className="about-action" href="#/crops">Explore the shop</a>
      </div>
    </section>
  )
}