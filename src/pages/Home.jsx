import React from 'react'
import hero from '../assets/hero.jpg'

export default function Home() {
    return (
        <section className="home">
            <div className="hero">
                <img src={hero} alt="Farmer working in agricultural field" className="hero-img" />

                <div className="hero-text">
                    <h1>Welcome to AgroMart</h1>
                    <h2>
                        Empowering Farmers with Technologies, Crop Inputs &
                        Advancements in Agriculture.
                    </h2>
                </div>
            </div>

            <div className="cards">
                <a className="card" href="#/crops">
                    <h3>Crops</h3>
                    <p>Information and care guides for different crops.</p>
                </a>
                <a className="card" href="#/shop">
                    <h3>Agri Shop</h3>
                    <p>Buy agricultural products and tools online.</p>
                </a>
                <a className="card" href="#/prices">
                    <h3>Market Prices</h3>
                    <p>Check daily market prices for major crops.</p>
                </a>
            </div>
        </section>
    )
}
