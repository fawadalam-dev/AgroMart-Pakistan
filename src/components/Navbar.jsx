import React, { useEffect, useState } from 'react'
import { getSession } from '../utils/auth'
import agromartLogo from '../assets/agromart-mark.png'

function readTheme() {
    const saved = localStorage.getItem('agro_theme')
    try { return JSON.parse(saved) === 'dark' ? 'dark' : 'light' } catch { return saved === 'dark' ? 'dark' : 'light' }
}

export default function Navbar() {
    const brandName = 'AgroMart Pakistan'
    const [session, setSession] = useState(getSession)
    const [currentHash, setCurrentHash] = useState(() => window.location.hash || '#/')
    const [darkMode, setDarkMode] = useState(() => readTheme() === 'dark')
    const displayName = session?.name?.trim() || (session?.role === 'admin' ? 'Super Admin' : 'Customer')
    const customerName = `${displayName.charAt(0).toUpperCase()}${displayName.slice(1)}`
    const topItems = [
        { label: 'Home', href: '#/home' },
        { label: 'Weather', href: '#/weather' }
    ]
    const customerShopItems = session?.role === 'admin' ? [] : [
        { label: 'Agro Shop', href: '#/shop', icon: '▦' }
    ]
    const sidebarItems = [
        ...(session?.role === 'customer' || session?.role === 'admin' ? [{ label: customerName, href: '#/profile', isProfile: true, icon: '♙' }] : []),
        { label: 'Home', href: '#/home', icon: '⌂' },
        ...(session?.role === 'farmer' ? [{ label: 'Farmer Dashboard', href: '#/farmer-dashboard', icon: '▦' }] : []),
        ...customerShopItems,
        { label: 'View your order', href: '#/order', icon: '≡' },
        { label: 'Market Prices', href: '#/prices', icon: '◆' },
        { label: 'About', href: '#/about', icon: 'i' },
        { label: 'FAQs', href: '#/faq', icon: '?' },
        { label: 'AI Farmer Assistant', href: '#/assistant', icon: '✦' },
        ...(session?.role === 'admin' ? [{ label: 'Admin Dashboard', href: '#/admin', icon: '♛' }] : []),
        ...(session ? [] : [{ label: 'Sign up', href: '#/register', icon: '+' }]),
    ]
    const categoryItems = []
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
        const updateTheme = (event) => setDarkMode(event.detail === 'dark' || readTheme() === 'dark')
        window.addEventListener('agro-theme-updated', updateTheme)
        return () => window.removeEventListener('agro-theme-updated', updateTheme)
    }, [])

    function toggleTheme() {
        const nextTheme = darkMode ? 'light' : 'dark'
        localStorage.setItem('agro_theme', nextTheme)
        setDarkMode(nextTheme === 'dark')
        window.dispatchEvent(new CustomEvent('agro-theme-updated', { detail: nextTheme }))
    }

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
                <div className="navbar-brand"><img className="navbar-brand-logo" src={agromartLogo} alt="" /><span className="navbar-brand-name"><span className="navbar-brand-initial">A</span>gro<span className="navbar-brand-initial">M</span>art-<span className="navbar-brand-initial">P</span>ak</span></div>
                <nav className="desktop-nav" aria-label="Main navigation">
                    <ul className="nav-list">
                        {renderLinks(topItems)}
                    </ul>
                </nav>
                <div className="navbar-actions">
                    <button type="button" className="navbar-theme-toggle" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
                        <svg className="fm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{darkMode ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.7 8.7 0 1 0 20.5 15.3Z" />}</svg>
                    </button>
                    <a className="navbar-login" href={session ? '#/profile' : '#/login'} aria-label={session ? `Open profile for ${customerName}` : 'Login'} title={session ? 'Open profile' : 'Login'}>
                        <svg className="mobile-login-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <circle cx="12" cy="8" r="3.2" />
                            <path d="M5.5 20c.7-3.3 3.1-5 6.5-5s5.8 1.7 6.5 5" />
                        </svg>
                    </a>
                </div>
                <nav className="mobile-top-nav" aria-label="Quick navigation">
                    <ul className="nav-list">
                        {renderLinks([{ label: 'Weather', href: '#/weather' }])}
                        <li className="nav-item mobile-theme-item"><button type="button" className="navbar-theme-toggle" onClick={toggleTheme} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}><svg className="fm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{darkMode ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.7 8.7 0 1 0 20.5 15.3Z" />}</svg></button></li>
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
                {categoryItems.length > 0 && <div className="sidebar-categories">
                    <p className="sidebar-category-heading">{categorySectionName}</p>
                    {categoryItems.map((category) => <a key={category.label} href={category.href} className="sidebar-category-link" onClick={closeSidebar}><span><b className="nav-item-icon" aria-hidden="true">{category.icon}</b>{category.label}</span><span aria-hidden="true">&rsaquo;</span></a>)}
                </div>}
                <a href="#/settings" className="sidebar-settings-link" onClick={closeSidebar}>
                    <span className="nav-item-icon" aria-hidden="true">⚙</span>
                    <strong>Settings</strong>
                </a>
            </aside>
        </header>
    )
}
