import React, { useEffect, useState } from 'react'
import { getSession } from '../utils/auth'

export default function Navbar() {
    const brandName = 'AgroMart Pakistan'
    const categorySectionName = 'Browse Products'
    const [session, setSession] = useState(getSession)
    const customerName = session?.name ? `${session.name.charAt(0).toUpperCase()}${session.name.slice(1)}` : 'Customer'
    const topItems = [
        { label: 'Home', href: '#/home' },
        { label: 'Weather', href: '#/weather' },
        ...(session?.role === 'customer' || session?.role === 'admin'
            ? [{ label: customerName, href: '#/profile', isProfile: true }]
            : [{ label: 'Sign in', href: '#/login' }, { label: 'Sign up', href: '#/register' }])
    ]
    const sidebarItems = [
        ...(session?.role === 'customer' || session?.role === 'admin' ? [{ label: customerName, href: '#/profile', isProfile: true, icon: '♙' }] : []),
        { label: 'Home', href: '#/home', icon: '⌂' },
        { label: 'Crops', href: '#/crops', icon: '▦' },
        { label: 'Seeds', href: '#/seeds', icon: '✿' },
        { label: 'Agri Shop', href: '#/shop', icon: '◇' },
        { label: 'Medicine & Treatment', href: '#/medicine', icon: '+' },
        { label: 'View your order', href: '#/order', icon: '≡' },
        { label: 'Market Prices', href: '#/prices', icon: '◆' },
        { label: 'About', href: '#/about', icon: 'i' },
        { label: 'AI Farmer Assistant', href: '#/assistant', icon: '✦' },
        { label: 'Admin Dashboard', href: '#/admin', icon: '♛' },
        ...(session ? [] : [{ label: 'Sign in', href: '#/login', icon: '↪' }, { label: 'Sign up', href: '#/register', icon: '+' }]),
    ]
    const categoryItems = [
        { label: 'Crops', href: '#/crops', icon: '▦' },
        { label: 'Agri Shop', href: '#/shop', icon: '◇' },
        { label: 'Medicine & Treatment', href: '#/medicine', icon: '+' }
    ]
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/')

    useEffect(() => {
        const updateHash = () => setCurrentHash(window.location.hash || '#/')
        window.addEventListener('hashchange', updateHash)
        return () => window.removeEventListener('hashchange', updateHash)
    }, [])

    useEffect(() => {
        const updateSession = () => setSession(getSession())
        window.addEventListener('agro-session-updated', updateSession)
        return () => window.removeEventListener('agro-session-updated', updateSession)
    }, [])

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setIsSidebarOpen(false)
        }
        document.addEventListener('keydown', closeOnEscape)
        return () => document.removeEventListener('keydown', closeOnEscape)
    }, [])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        if (isSidebarOpen) document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = previousOverflow }
    }, [isSidebarOpen])

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
                    {item.isProfile ? <svg className="nav-profile-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.7-3.3 3.1-5 6.5-5s5.8 1.7 6.5 5" /></svg> : <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>}
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
                            <a href={session ? '#/profile' : '#/login'} className={`mobile-login-link${currentHash === (session ? '#/profile' : '#/login') ? ' active' : ''}`} aria-label={session ? 'Open profile' : 'Login or sign up'} title={session ? 'Open profile' : 'Login or sign up'} onClick={closeSidebar}>
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
                        <a key={category.label} href={category.href} className="sidebar-category-link" onClick={closeSidebar}>
                            <span><b className="nav-item-icon" aria-hidden="true">{category.icon}</b>{category.label}</span>
                            <span aria-hidden="true">&rsaquo;</span>
                        </a>
                    ))}
                </div>
                <a href="#/settings" className="sidebar-settings-link" onClick={closeSidebar}>
                    <span className="nav-item-icon" aria-hidden="true">⚙</span>
                    <strong>Settings</strong>
                </a>
            </aside>
        </header>
    )
}
