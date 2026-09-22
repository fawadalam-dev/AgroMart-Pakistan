import React from 'react'
export default function Home() {
    return (
        <section className="home">
            <div className="hero">
                <img src="https://images.unsplash.com/photo-1500382017468-9049fed8d5f8?q=85&w=1400&auto=format&fit=crop" alt="Green agricultural field at sunrise" className="hero-img" />

                <div className="hero-text">
                    <h1>Welcome to AgroMart</h1>
                    <h2>
                        Empowering Farmers with Technologies, Crop Inputs &
                        Advancements in Agriculture.
                    </h2>
                </div>
            </div>

            <div className="cards">
                <a className="card card-crops" href="#/crops">
                    <span className="card-eyebrow">Seeds & field crops</span>
                    <h3>Crops</h3>
                    <p>Seeds, grains, vegetables, and fruits for every growing season.</p>
                </a>
                <a className="card card-seeds" href="#/seeds">
                    <span className="card-eyebrow">Quality seed varieties</span>
                    <h3>Seeds</h3>
                    <p>Browse seed products managed by AgroMart Super Admin.</p>
                </a>
                <a className="card card-shop" href="#/shop">
                    <span className="card-eyebrow">Sprayers & farm tools</span>
                    <h3>Agri Shop</h3>
                    <p>Sprayers, gloves, garden tools, irrigation, and farm equipment.</p>
                </a>
                <a className="card card-prices" href="#/prices">
                    <span className="card-eyebrow">Produce trading</span>
                    <h3>Market Prices</h3>
                    <p>Track current crop prices before you buy, sell, or plan your harvest.</p>
                </a>
            </div>
        </section>
    )
}
