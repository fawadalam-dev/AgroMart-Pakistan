import React from 'react'

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-inner">
                <div className="footer-column">
                    <a href="#/home" className="footer-brand">AgroMart</a>
                    <p>Practical tools for better farming decisions. Discover crop care guides, agricultural products, market prices, and modern farming solutions to support farmers and improve agricultural productivity.</p>
                </div>
                <div className="footer-column">
                    <strong>Explore</strong>
                    <nav className="footer-links" aria-label="Footer navigation">
                        <a href="#/crops">Shop crops</a>
                        <a href="#/weather">Weather</a>
                        <a href="#/prices">Market prices</a>
                    </nav>
                </div>
                <div className="footer-column footer-contact">
                    <strong>Contact us</strong>
                    <a href="mailto:hello@fawadalam5813@gmail.com">hello@fawadalam5813@gmail.com</a>
                    <a href="tel:+923279102815">+92 327 910 2815</a>
                    <span>Buner, Khyber Pakhtunkhwa, Pakistan</span>
                </div>
                <div className="footer-column">
                    <strong>Follow AgroMart</strong>
                    <div className="social-links">
                        <a href="https://www.tiktok.com/@fawadalam_dev" target="_blank" rel="noreferrer" aria-label="AgroMart on TikTok">TikTok</a>
                        <a href="https://https://www.instagram.com/fawadalam_dev/" target="_blank" rel="noreferrer" aria-label="AgroMart on Instagram">Instagram</a>
                        <a href="https://www.youtube.com/@RoyalSquareMall" target="_blank" rel="noreferrer" aria-label="AgroMart on YouTube">YouTube</a>
                        <a href="https://wa.me/923141523463" target="_blank" rel="noreferrer" aria-label="Contact AgroMart on WhatsApp">WhatsApp</a>
                    </div>
                </div>
                <small className="footer-copyright">&copy; 2026 AgroMart Pakistan</small>
            </div>
        </footer>
    )
}