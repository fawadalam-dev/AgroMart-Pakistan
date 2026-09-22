import React, { useState } from 'react'
import { getSession } from '../utils/auth'

const customerSections = [
    ['Profile', 'Manage your name and account details.'],
    ['Address', 'Update your delivery address and location.'],
    ['Security', 'Review your account security settings.'],
    ['Notifications', 'Choose the updates you want to receive.'],
    ['Payment', 'Manage your preferred payment method.'],
    ['Privacy', 'Control your account privacy preferences.']
]

const adminSections = [
    ['Website', 'Manage website-wide preferences.'],
    ['Users', 'Review customer accounts and access.'],
    ['Products', 'Manage the AgroMart catalog.'],
    ['Categories', 'Organize product categories.'],
    ['Orders', 'Configure order workflow settings.'],
    ['Payments', 'Manage payment preferences.'],
    ['Delivery', 'Configure delivery options.'],
    ['Marketing', 'Manage marketplace promotions.'],
    ['Reports & Analytics', 'Review dashboard reporting options.'],
    ['Notifications', 'Configure admin alerts.'],
    ['Security', 'Review Super Admin security settings.']
]

const paymentMethods = [
    ['cod', 'Cash on Delivery'],
    ['easypaisa', 'Easypaisa'],
    ['jazzcash', 'JazzCash'],
    ['bank', 'Bank Transfer']
]

export default function Settings() {
    const session = getSession()
    const sections = session?.role === 'admin' ? adminSections : customerSections
    const [selected, setSelected] = useState(sections[0][0])
    const [saved, setSaved] = useState(false)
    const [settings, setSettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem(`agro_settings_${session?.id || 'guest'}`) || '{"emailNotifications":true,"orderUpdates":true,"marketing":false,"publicProfile":false,"cod":true,"easypaisa":true,"jazzcash":true,"bank":true,"paymentStatus":"Active","maintenance":false,"requireApproval":false,"adminAlerts":true}') } catch { return {} }
    })
    const selectedSection = sections.find(([title]) => title === selected)
    function updateSetting(name, value) { setSettings((current) => ({ ...current, [name]: value })); setSaved(false) }
    function saveSettings() {
        localStorage.setItem(`agro_settings_${session?.id || 'guest'}`, JSON.stringify(settings))
        setSaved(true)
    }
    function renderControls() {
        if (selected === 'Profile' || selected === 'Address') return <a className="settings-action-link" href="#/profile">Open profile details and edit information →</a>
        if (selected === 'Products' || selected === 'Categories') return <a className="settings-action-link" href="#/admin">Open product management →</a>
        if (selected === 'Orders' || selected === 'Reports & Analytics') return <a className="settings-action-link" href="#/admin">Open Admin Dashboard →</a>
        if (selected === 'Website') return <label className="settings-toggle"><input type="checkbox" checked={settings.maintenance || false} onChange={(event) => updateSetting('maintenance', event.target.checked)} /> Maintenance mode</label>
        if (selected === 'Security') return <><label className="settings-toggle"><input type="checkbox" checked={settings.requireApproval || false} onChange={(event) => updateSetting('requireApproval', event.target.checked)} /> Require approval for new accounts</label><a className="settings-action-link" href="#/profile">Update account details →</a></>
        if (selected === 'Payment' || selected === 'Payments') return <><div className="payment-method-settings">{paymentMethods.map(([key, label]) => <label className="settings-toggle" key={key}><input type="checkbox" checked={settings[key] !== false} onChange={(event) => updateSetting(key, event.target.checked)} /> {label}</label>)}</div><label className="settings-field">Payment status<select value={settings.paymentStatus || 'Active'} onChange={(event) => updateSetting('paymentStatus', event.target.value)}><option>Active</option><option>Paused</option><option>Maintenance</option></select></label></>
        if (selected === 'Delivery') return <a className="settings-action-link" href="#/admin">Manage delivery through Admin Dashboard →</a>
        if (selected === 'Notifications') return <><label className="settings-toggle"><input type="checkbox" checked={settings.orderUpdates !== false} onChange={(event) => updateSetting('orderUpdates', event.target.checked)} /> Order updates</label><label className="settings-toggle"><input type="checkbox" checked={settings.adminAlerts !== false} onChange={(event) => updateSetting('adminAlerts', event.target.checked)} /> Admin alerts</label></>
        if (selected === 'Marketing') return <label className="settings-toggle"><input type="checkbox" checked={settings.marketing || false} onChange={(event) => updateSetting('marketing', event.target.checked)} /> Enable marketplace promotions</label>
        if (selected === 'Privacy') return <label className="settings-toggle"><input type="checkbox" checked={settings.publicProfile || false} onChange={(event) => updateSetting('publicProfile', event.target.checked)} /> Allow public profile visibility</label>
        return <a className="settings-action-link" href="#/profile">Manage account →</a>
    }
    return <section className="settings-page">
        <div className="settings-heading"><div><p className="section-kicker">{session?.role === 'admin' ? 'Super Admin controls' : 'Customer controls'}</p><h1>Settings</h1><p>Manage your AgroMart preferences from one place.</p></div></div>
        <div className="settings-layout">
            <nav className="settings-menu" aria-label="Settings sections">{sections.map(([title, description], index) => <button type="button" className={selected === title ? 'is-active' : ''} onClick={() => setSelected(title)} key={title}><span>{index + 1}</span>{title}</button>)}</nav>
            <article className="settings-panel"><p className="panel-kicker">Selected setting</p><h2>{selectedSection[0]}</h2><p>{selectedSection[1]}</p><div className="settings-controls">{renderControls()}</div><button type="button" className="admin-primary-btn" onClick={saveSettings}>Save settings</button>{saved && <p className="settings-saved">Settings saved successfully.</p>}</article>
        </div>
    </section>
}
