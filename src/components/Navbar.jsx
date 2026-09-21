import React, { useEffect, useState } from 'react'

export default function Navbar() {
    const brandName = 'AgroMart Pakistan'
    const categorySectionName = 'Browse Products'
    const topItems = [
        { label: 'Home', href: '#/home' },
        { label: 'Weather', href: '#/weather' },
        { label: 'Sign in', href: '#/login' },
        { label: 'Sign up', href: '#/register' }
    ]
    const sidebarItems = [
        { label: 'Home', href: '#/home' },
        { label: 'Crops', href: '#/crops' },
        { label: 'Agri Shop', href: '#/shop' },
        { label: 'Medicine & Treatment', href: '#/medicine' },
        { label: 'View your order', href: '#/order' },
        { label: 'Market Prices', href: '#/prices' },
        { label: 'Chart', href: '#/chart' },
        { label: 'About', href: '#/about' },
        { label: 'AI Farmer Assistant', href: '#/assistant' },
        { label: 'Admin Dashboard', href: '#/admin' },
        { label: 'Sign in', href: '#/login' },
        { label: 'Sign up', href: '#/register' },
    ]
    const categoryItems = ['Major Crops', 'Vegetables', 'Fruits', 'More Products']
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/')

    useEffect(() => {
        const updateHash = () => setCurrentHash(window.location.hash || '#/')
        window.addEventListener('hashchange', updateHash)
        return () => window.removeEventListener('hashchange', updateHash)
    }, [])

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setIsSidebarOpen(false)
        }
        document.addEventListener('keydown', closeOnEscape)
        return () => document.removeEventListener('keydown', closeOnEscape)
    }, [])

    function closeSidebar() {
        setIsSidebarOpen(false)
    }

    function renderLinks(items) {
        return items.map((item) => (
            <li key={item.label} className="nav-item">
                <a
                    href={item.href}
                    className={currentHash === item.href ? 'active' : ''}
                    onClick={closeSidebar}
                >
                    {item.label}
                </a>
            </li>
        ))
    }

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <button
                    type="button"
                    className="sidebar-toggle"
                    aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isSidebarOpen}
                    onClick={() => setIsSidebarOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>
                <div className="navbar-brand" aria-label="AgroMart Pakistan">
                    <span className="navbar-brand-mark" aria-hidden="true">A</span>
                    <span className="navbar-brand-name navbar-brand-full">{brandName}</span>
                    <span className="navbar-brand-name navbar-brand-mobile">AgroMart-Pak</span>
                </div>
                <nav className="desktop-nav" aria-label="Main navigation">
                    <ul className="nav-list">
                        {renderLinks(topItems)}
                    </ul>
                </nav>
                <nav className="mobile-top-nav" aria-label="Quick navigation">
                    <ul className="nav-list">
                        {renderLinks([{ label: 'Weather', href: '#/weather' }])}
                        <li className="nav-item">
                            <a href="#/login" className={`mobile-login-link${currentHash === '#/login' ? ' active' : ''}`} aria-label="Login or sign up" title="Login or sign up" onClick={closeSidebar}>
                                <svg className="mobile-login-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <circle cx="12" cy="8" r="3.2" />
                                    <path d="M5.5 20c.7-3.3 3.1-5 6.5-5s5.8 1.7 6.5 5" />
                                </svg>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className={`sidebar-backdrop${isSidebarOpen ? ' is-visible' : ''}`} onClick={closeSidebar} />
            <aside className={`sidebar${isSidebarOpen ? ' is-open' : ''}`} aria-hidden={!isSidebarOpen}>
                <div className="sidebar-heading">
                    <span>Explore AgroMart</span>
                    <button type="button" className="sidebar-close" onClick={closeSidebar} aria-label="Close navigation menu">&times;</button>
                </div>
                <nav aria-label="More navigation">
                    <ul className="sidebar-list">{renderLinks(sidebarItems)}</ul>
                </nav>
                <div className="sidebar-categories">
                    <p className="sidebar-category-heading">{categorySectionName}</p>
                    {categoryItems.map((category) => (
                        <a key={category} href="#/crops" className="sidebar-category-link" onClick={closeSidebar}>
                            <span>{category}</span>
                            <span aria-hidden="true">&rsaquo;</span>
                        </a>
                    ))}
                </div>
            </aside>
        </header>
    )
}
