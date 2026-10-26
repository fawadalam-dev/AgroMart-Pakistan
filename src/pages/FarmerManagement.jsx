import React, { useEffect, useMemo, useRef, useState } from 'react'
import { clearSession, getSession } from '../utils/auth'
import './FarmerManagement.css'

const expenseCategories = ['Seeds', 'Fertilizer', 'Tractor', 'Labour', 'Irrigation', 'Pesticides', 'Other costs']
const incomeCategories = ['Crop sales', 'Other income']
const cropStatuses = ['Planned', 'Growing', 'Harvested', 'Completed']
const areaUnits = ['acres', 'kanal', 'marla']
const soilTypes = ['Sandy', 'Clay', 'Loamy', 'Silty', 'Sandy Loam', 'Other']
const sections = [
    ['overview', 'Overview', '▦'], // Keeping the original context
    ['farmers', 'Farmers', '♙'],
    ['land', 'Land management', '⌂'],
    ['crops', 'Crop management', '❧'],
    ['finance', 'Expenses & income', '₨'],
    ['reports', 'Reports', '▤']
]

function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '')
}

function readJson(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null')
        return parsed && typeof parsed === 'object' ? parsed : fallback
    } catch {
        return fallback
    }
}

function loadWorkspace(session) {
    const key = `agro_farm_management_${session.id}`
    const stored = readJson(key, null)
    if (stored && Array.isArray(stored.farmers) && Array.isArray(stored.lands) && Array.isArray(stored.crops) && Array.isArray(stored.transactions)) {
        const accountFarmers = stored.farmers.filter((farmer) => farmer.accountOwner)
        if (accountFarmers.length === 1) {
            const owner = accountFarmers[0]
            const ownerCropLandIds = new Set(stored.crops.filter((crop) => crop.farmerId === owner.id && crop.landId).map((crop) => crop.landId))
            const farmerIds = new Set(stored.farmers.map((farmer) => farmer.id))
            const lands = stored.lands.map((land) => !farmerIds.has(land.farmerId) && ownerCropLandIds.has(land.id) ? { ...land, farmerId: owner.id } : land)
            return lands.some((land, index) => land !== stored.lands[index]) ? { ...stored, lands } : stored
        }
        return stored
    }
    const profile = readJson(`agro_farmer_${session.id}`, null)
    const account = readJson(`agro_account_${session.id}`, {})
    const farmer = profile ? {
        id: `F-${String(Date.now()).slice(-6)}`,
        fullName: session.name || account.name || '',
        fatherName: '',
        phone: account.phone || '',
        cnic: '',
        photo: '',
        registeredAt: new Date().toISOString().slice(0, 10),
        notes: 'Primary account farmer',
        accountOwner: true
    } : null
    const land = profile ? {
        id: makeId('L'),
        farmerId: farmer.id,
        area: Number(profile.farmArea) || 0,
        unit: 'acres',
        ownership: 'Owned',
        irrigation: 'Canal',
        soilType: 'Not recorded',
        document: null
    } : null
    const crop = profile ? {
        id: makeId('C'),
        farmerId: farmer.id,
        landId: land.id,
        cropName: profile.primaryCrop || '',
        sowDate: '',
        harvestDate: '',
        yieldAmount: 0,
        yieldUnit: 'kg',
        fertilizer: '',
        seeds: '',
        irrigation: profile.farmingType || '',
        status: 'Growing'
    } : null
    return { farmers: farmer ? [farmer] : [], lands: land ? [land] : [], crops: crop ? [crop] : [], transactions: [] }
}

function toAcres(amount, unit) {
    const value = Number(amount) || 0
    if (unit === 'kanal') return value / 8
    if (unit === 'marla') return value / 160
    return value
}

function formatArea(acres) {
    const safe = Number(acres) || 0
    const whole = Math.floor(safe)
    const kanal = Math.floor((safe - whole) * 8)
    const marla = Math.round(((safe - whole) * 8 - kanal) * 20)
    return `${safe.toFixed(2)} ac · ${whole} ac ${kanal} kanal ${marla} marla`
}

function money(value) {
    return `Rs ${Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}

function dateLabel(value) {
    if (!value) return 'Not set'
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mask(value, start = 2, end = 2) {
    if (!value) return 'Not provided'
    const text = String(value)
    if (text.length <= start + end) return `${text.slice(0, 1)}•••`
    return `${text.slice(0, start)}${'•'.repeat(Math.min(8, text.length - start - end))}${text.slice(-end)}`
}

function csvCell(value) {
    return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function readThemePreference() {
    const saved = localStorage.getItem('agro_theme')
    try { return JSON.parse(saved) === 'dark' ? 'dark' : 'light' } catch { return saved === 'dark' ? 'dark' : 'light' }
}

function downloadFile(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
}

function readFileData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

function Icon({ name }) {
    const paths = {
        search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.5 4.5" /></>,
        add: <><path d="M12 5v14M5 12h14" /></>,
        download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 20h14" /></>,
        upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M5 20h14" /></>,
        print: <><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M7 14h10v7H7z" /></>,
        close: <><path d="m6 6 12 12M18 6 6 18" /></>,
        menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
        sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
        moon: <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.7 8.7 0 1 0 20.5 15.3Z" />,
        edit: <><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z" /><path d="m13.8 6.7 3.5 3.5" /></>,
        trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
        view: <><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
        pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
        sprout: <><path d="M12 21v-9m0 3C7 15 4 12 4 7c5 0 8 2 8 7m0-2c0-5 3-8 8-8 0 5-3 8-8 8" /></>
    }
    return <svg className="fm-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || null}</svg>
}

function ActionButton({ icon, label, onClick, tone = '' }) {
    return <button type="button" className={`fm-icon-button ${tone}`} aria-label={label} title={label} onClick={onClick}><Icon name={icon} /></button>
}

function MetricCard({ icon, label, value, detail, tint = 'green' }) {
    return <article className={`fm-metric fm-tint-${tint}`}><span className="fm-metric-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>
}

function FarmerForm({ record, farmers, onSave, onCancel }) {
    const [form, setForm] = useState(() => record || { fullName: '', fatherName: '', phone: '', cnic: '', photo: '', registeredAt: new Date().toISOString().slice(0, 10), notes: '' })
    const [fileError, setFileError] = useState('')
    const [formError, setFormError] = useState('')
    async function submit(event) {
        event.preventDefault()
        const phone = form.phone.trim()
        const duplicate = farmers.some((farmer) => farmer.id !== record?.id && normalizePhone(farmer.phone) === normalizePhone(phone))
        if (duplicate) return setFormError('This phone number is already used for another farmer ID.')
        setFormError('')
        onSave({ ...form, phone, id: phone, registeredAt: form.registeredAt || new Date().toISOString().slice(0, 10) })
    }
    async function changePhoto(event) {
        const file = event.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) return setFileError('Choose an image file.')
        if (file.size > 4 * 1024 * 1024) return setFileError('Photo must be smaller than 4 MB.')
        setFileError('')
        const photo = await readFileData(file)
        setForm((current) => ({ ...current, photo }))
    }
    function field(name, label, props = {}) {
        return <label className="fm-field" key={name}>{label}<input name={name} value={form[name] || ''} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} {...props} /></label>
    }
    return <form className="fm-form-grid" onSubmit={submit}>
        {field('fullName', 'Farmer name', { autoComplete: 'name', required: true })}
        {field('fatherName', 'Father name', { required: true })}
        {field('phone', 'Phone number', { type: 'tel', autoComplete: 'tel', required: true, maxLength: 20, inputMode: 'tel' })}
        {formError && <p className="fm-error fm-span-2" role="alert">{formError}</p>}
        {field('cnic', 'CNIC (optional)', { inputMode: 'numeric', placeholder: 'XXXXX-XXXXXXX-X', maxLength: 15 })}
        {field('registeredAt', 'Registration date', { type: 'date', required: true })}
        <label className="fm-field">Photo<input type="file" accept="image/*" onChange={changePhoto} />{fileError && <small className="fm-error">{fileError}</small>}</label>
        {form.photo && <img className="fm-upload-preview" src={form.photo} alt="Farmer portrait preview" />}
        <label className="fm-field fm-span-2">Notes<textarea rows="3" value={form.notes || ''} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        <div className="fm-form-actions fm-span-2"><button className="fm-button fm-button-primary" type="submit">{record ? 'Save farmer' : 'Add farmer'}</button><button className="fm-button fm-button-quiet" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
}

function LandForm({ record, farmers, onSave, onCancel }) {
    const [form, setForm] = useState(() => record || { farmerId: farmers[0]?.id || '', area: '', unit: 'acres', ownership: 'Owned', location: '', irrigation: '', soilType: '', document: null })
    const [fileError, setFileError] = useState('')
    async function submit(event) { event.preventDefault(); onSave({ ...form, id: record?.id || makeId('L'), area: Number(form.area) }) }
    async function handleDocument(event) {
        const file = event.target.files?.[0]
        if (!file) return
        if (file.size > 8 * 1024 * 1024) return setFileError('Document must be smaller than 8 MB.')
        setFileError('')
        const data = await readFileData(file)
        setForm((current) => ({ ...current, document: { name: file.name, data } }))
    }
    return <form className="fm-form-grid" onSubmit={submit}>
        <label className="fm-field">Farmer<select value={form.farmerId} onChange={(event) => setForm({ ...form, farmerId: event.target.value })} required><option value="">Select farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.fullName} · {farmer.id}</option>)}</select></label>
        <label className="fm-field">Land area<div className="fm-input-combo"><input type="number" min="0.01" step="0.01" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required /><select aria-label="Area unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>{areaUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></div></label>
        <label className="fm-field">Ownership<select value={form.ownership} onChange={(event) => setForm({ ...form, ownership: event.target.value })}><option>Owned</option><option>Leased</option><option>Shared</option></select></label>
        <label className="fm-field">Farm location<input value={form.location || ''} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Enter village, town, or area name" required /></label>
        <label className="fm-field">Irrigation<select value={form.irrigation} onChange={(event) => setForm({ ...form, irrigation: event.target.value })}><option value="">Select irrigation</option><option>Canal</option><option>Tube well</option><option>Solar System</option><option>Rain-fed</option><option>River</option><option>Drip</option><option>Other</option></select></label>
        <label className="fm-field">Soil type<select value={form.soilType} onChange={(event) => setForm({ ...form, soilType: event.target.value })}><option value="">Select soil type</option>{soilTypes.map((soilType) => <option key={soilType}>{soilType}</option>)}</select></label>
        <label className="fm-field fm-span-2">Ownership document<input type="file" accept=".pdf,image/*" onChange={handleDocument} />{form.document && <small>{form.document.name}</small>}{fileError && <small className="fm-error">{fileError}</small>}</label>
        <div className="fm-form-actions fm-span-2"><button className="fm-button fm-button-primary" type="submit">{record ? 'Save land record' : 'Add land record'}</button><button className="fm-button fm-button-quiet" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
}

function CropForm({ record, farmers, lands, onSave, onCancel }) {
    const [form, setForm] = useState(() => record || { farmerId: farmers[0]?.id || '', landId: '', cropName: '', sowDate: '', harvestDate: '', yieldAmount: '', yieldUnit: 'kg', fertilizer: '', seeds: '', irrigation: '', status: 'Planned' })
    const farmerLands = lands.filter((land) => land.farmerId === form.farmerId)
    function field(name, label, type = 'text', required = false) { return <label className="fm-field" key={name}>{label}<input type={type} value={form[name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={required} /></label> }
    function submit(event) { event.preventDefault(); onSave({ ...form, id: record?.id || makeId('C'), yieldAmount: Number(form.yieldAmount) || 0 }) }
    return <form className="fm-form-grid" onSubmit={submit}>
        <label className="fm-field">Farmer<select value={form.farmerId} onChange={(event) => setForm({ ...form, farmerId: event.target.value, landId: '' })} required><option value="">Select farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.fullName}</option>)}</select></label>
        <label className="fm-field">Land<select value={form.landId} onChange={(event) => setForm({ ...form, landId: event.target.value })} required><option value="">Select land</option>{farmerLands.map((land) => <option key={land.id} value={land.id}>{formatArea(toAcres(land.area, land.unit))}</option>)}</select></label>
        {field('cropName', 'Crop name', 'text', true)}{field('sowDate', 'Sowing date', 'date')}{field('harvestDate', 'Expected / actual harvest', 'date')}
        <label className="fm-field">Yield amount<div className="fm-input-combo"><input type="number" min="0" step="0.1" value={form.yieldAmount} onChange={(event) => setForm({ ...form, yieldAmount: event.target.value })} /><select value={form.yieldUnit} onChange={(event) => setForm({ ...form, yieldUnit: event.target.value })}><option>kg</option><option>quintal</option><option>ton</option></select></div></label>
        {field('seeds', 'Seeds / variety')}{field('fertilizer', 'Fertilizer plan')}{field('irrigation', 'Irrigation notes')}
        <label className="fm-field">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{cropStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <div className="fm-form-actions fm-span-2"><button className="fm-button fm-button-primary" type="submit">{record ? 'Save crop' : 'Add crop'}</button><button className="fm-button fm-button-quiet" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
}

function TransactionForm({ record, initialType = 'expense', farmers, crops, onSave, onCancel }) {
    const [form, setForm] = useState(() => record || { farmerId: farmers[0]?.id || '', cropId: '', type: initialType, category: initialType === 'income' ? incomeCategories[0] : expenseCategories[0], amount: '', date: new Date().toISOString().slice(0, 10), description: '' })
    const categories = form.type === 'income' ? incomeCategories : expenseCategories
    function submit(event) { event.preventDefault(); onSave({ ...form, id: record?.id || makeId('T'), amount: Number(form.amount) }) }
    return <form className="fm-form-grid" onSubmit={submit}>
        <label className="fm-field">Type<select value={form.type} onChange={(event) => { const type = event.target.value; setForm({ ...form, type, category: type === 'income' ? incomeCategories[0] : expenseCategories[0] }) }}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label className="fm-field">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="fm-field">Farmer<select value={form.farmerId} onChange={(event) => setForm({ ...form, farmerId: event.target.value })} required><option value="">Select farmer</option>{farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.fullName}</option>)}</select></label>
        <label className="fm-field">Related crop<select value={form.cropId} onChange={(event) => setForm({ ...form, cropId: event.target.value })}><option value="">No linked crop</option>{crops.filter((crop) => !form.farmerId || crop.farmerId === form.farmerId).map((crop) => <option key={crop.id} value={crop.id}>{crop.cropName}</option>)}</select></label>
        <label className="fm-field">Amount (PKR)<input type="number" min="1" step="1" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></label>
        <label className="fm-field">Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
        <label className="fm-field fm-span-2">Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short note" /></label>
        <div className="fm-form-actions fm-span-2"><button className="fm-button fm-button-primary" type="submit">{record ? 'Save transaction' : 'Add transaction'}</button><button className="fm-button fm-button-quiet" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
}

function Modal({ title, children, onClose, wide = false }) {
    useEffect(() => {
        function closeOnEscape(event) { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [onClose])
    return <div className="fm-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`fm-modal${wide ? ' fm-modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><ActionButton icon="close" label="Close dialog" onClick={onClose} /></header>{children}</section></div>
}

function EmptyState({ title, detail, action }) { return <div className="fm-empty"><span>↗</span><strong>{title}</strong><p>{detail}</p>{action}</div> }

function FarmSetup({ session, farmers, onSave }) {
    const [form, setForm] = useState({ farmName: '', phone: '', location: '', area: '', unit: 'acres', ownership: 'Owned', irrigation: '', soilType: '', cropName: '', expense: '', expenseCategory: 'Seeds' })
    const [formError, setFormError] = useState('')
    function update(name, value) { setForm((current) => ({ ...current, [name]: value })) }
    function submit(event) {
        event.preventDefault()
        if (farmers.some((farmer) => normalizePhone(farmer.phone) === normalizePhone(form.phone))) {
            setFormError('This phone number is already used for another farmer ID.')
            return
        }
        setFormError('')
        onSave(form)
    }
    return <>
        <header className="fm-page-heading"><div><p className="fm-eyebrow">Farmer workspace setup</p><h1>Set up your farm dashboard</h1><p>Add your land and crop details. You can record expenses now or add them later.</p></div></header>
        <section className="fm-panel">
            <form className="fm-form-grid" onSubmit={submit}>
                <label className="fm-field">Farm name<input value={form.farmName} onChange={(event) => update('farmName', event.target.value)} required /></label>
                <label className="fm-field">Farmer name<input value={session?.name || ''} readOnly /></label>
                <label className="fm-field">Phone number<input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="e.g. 03XXXXXXXXX" required /></label>
                <label className="fm-field">Farm location<input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Enter village, town, or area name" required /></label>
                <label className="fm-field">Land area<div className="fm-input-combo"><input type="number" min="0.01" step="0.01" value={form.area} onChange={(event) => update('area', event.target.value)} required /><select aria-label="Area unit" value={form.unit} onChange={(event) => update('unit', event.target.value)}>{areaUnits.map((unit) => <option key={unit}>{unit}</option>)}</select></div></label>
                <label className="fm-field">Ownership<select value={form.ownership} onChange={(event) => update('ownership', event.target.value)}><option>Owned</option><option>Leased</option><option>Shared</option></select></label>
                <label className="fm-field">Irrigation<select value={form.irrigation} onChange={(event) => update('irrigation', event.target.value)}><option value="">Select irrigation</option><option>Canal</option><option>Tube well</option><option>Solar System</option><option>Rain-fed</option><option>River</option><option>Drip</option><option>Other</option></select></label>
                <label className="fm-field">Soil type<select value={form.soilType} onChange={(event) => update('soilType', event.target.value)}><option value="">Select soil type</option>{soilTypes.map((soilType) => <option key={soilType}>{soilType}</option>)}</select></label>
                <label className="fm-field">Main crop<input value={form.cropName} onChange={(event) => update('cropName', event.target.value)} required /></label>
                <label className="fm-field">Starting expense (PKR, optional)<input type="number" min="0" step="1" value={form.expense} onChange={(event) => update('expense', event.target.value)} placeholder="0" /></label>
                {Number(form.expense) > 0 && <label className="fm-field">Expense category<select value={form.expenseCategory} onChange={(event) => update('expenseCategory', event.target.value)}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></label>}
                {formError && <p className="fm-error fm-span-2" role="alert">{formError}</p>}
                <div className="fm-form-actions fm-span-2"><button className="fm-button fm-button-primary" type="submit">Create farm dashboard</button></div>
            </form>
        </section>
    </>
}

export default function FarmerManagement() {
    const session = getSession()
    const storageKey = `agro_farm_management_${session?.id || 'guest'}`
    const [workspace, setWorkspace] = useState(() => loadWorkspace(session || { id: 'guest' }))
    const [active, setActive] = useState('overview')
    const [modal, setModal] = useState(null)
    const [search, setSearch] = useState('')
    const [landFilter, setLandFilter] = useState('')
    const [sort, setSort] = useState({ key: 'fullName', direction: 'asc' })
    const [selectedFarmer, setSelectedFarmer] = useState(null)
    const [theme, setTheme] = useState(readThemePreference)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [notice, setNotice] = useState('')
    const [reportPeriod, setReportPeriod] = useState('month')
    const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 7))
    const restoreInput = useRef(null)

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(workspace))
    }, [storageKey, workspace])

    useEffect(() => {
        localStorage.setItem('agro_theme', theme)
        window.dispatchEvent(new CustomEvent('agro-theme-updated', { detail: theme }))
    }, [theme])

    useEffect(() => {
        function closeSidebarOnEscape(event) {
            if (event.key === 'Escape') setSidebarOpen(false)
        }
        window.addEventListener('keydown', closeSidebarOnEscape)
        return () => window.removeEventListener('keydown', closeSidebarOnEscape)
    }, [])

    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        if (sidebarOpen) document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = previousOverflow }
    }, [sidebarOpen])

    const farmerById = useMemo(() => Object.fromEntries(workspace.farmers.map((farmer) => [farmer.id, farmer])), [workspace.farmers])
    const landById = useMemo(() => Object.fromEntries(workspace.lands.map((land) => [land.id, land])), [workspace.lands])
    const cropById = useMemo(() => Object.fromEntries(workspace.crops.map((crop) => [crop.id, crop])), [workspace.crops])
    const landArea = workspace.lands.reduce((total, land) => total + toAcres(land.area, land.unit), 0)
    const expenses = workspace.transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount || 0), 0)
    const income = workspace.transactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount || 0), 0)
    const filteredFarmers = useMemo(() => workspace.farmers.filter((farmer) => {
        const matchSearch = `${farmer.fullName} ${farmer.fatherName} ${farmer.phone} ${farmer.id}`.toLowerCase().includes(search.trim().toLowerCase())
        const areaForFarmer = workspace.lands.filter((land) => land.farmerId === farmer.id).reduce((total, land) => total + toAcres(land.area, land.unit), 0)
        const matchLand = !landFilter || (landFilter === 'none' ? areaForFarmer === 0 : areaForFarmer > 0)
        return matchSearch && matchLand
    }).sort((a, b) => {
        const first = String(a[sort.key] || '').toLowerCase()
        const second = String(b[sort.key] || '').toLowerCase()
        return first.localeCompare(second, undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1)
    }), [workspace.farmers, workspace.lands, search, landFilter, sort])

    const reportTransactions = useMemo(() => workspace.transactions.filter((item) => reportPeriod === 'year' ? item.date?.startsWith(reportDate.slice(0, 4)) : item.date?.startsWith(reportDate)), [workspace.transactions, reportPeriod, reportDate])
    const reportExpenses = reportTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const reportIncome = reportTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const expenseBreakdown = expenseCategories.map((category) => ({ category, amount: workspace.transactions.filter((item) => item.type === 'expense' && item.category === category).reduce((sum, item) => sum + Number(item.amount || 0), 0) }))
    const monthlyBars = Array.from({ length: 6 }, (_, index) => {
        const date = new Date()
        date.setDate(1)
        date.setMonth(date.getMonth() - (5 - index))
        const month = date.toISOString().slice(0, 7)
        const monthItems = workspace.transactions.filter((item) => item.date?.startsWith(month))
        return { month: date.toLocaleString('en', { month: 'short' }), income: monthItems.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0), expenses: monthItems.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0) }
    })
    const recentTransactions = [...workspace.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6)

    function showNotice(message) {
        setNotice(message)
        window.setTimeout(() => setNotice(''), 3200)
    }

    function saveFarmSetup(form) {
        const farmerId = form.phone.trim()
        const landId = makeId('L')
        const crop = { id: makeId('C'), farmerId, landId, cropName: form.cropName.trim(), sowDate: '', harvestDate: '', yieldAmount: 0, yieldUnit: 'kg', fertilizer: '', seeds: '', irrigation: form.irrigation, status: 'Growing' }
        const farmer = { id: farmerId, fullName: session?.name || '', fatherName: '', phone: farmerId, cnic: '', photo: '', registeredAt: new Date().toISOString().slice(0, 10), notes: form.farmName.trim(), accountOwner: true }
        const land = { id: landId, farmerId, area: Number(form.area), unit: form.unit, ownership: form.ownership, location: form.location.trim(), irrigation: form.irrigation, soilType: form.soilType.trim() || 'Not recorded', document: null }
        const transactions = Number(form.expense) > 0 ? [{ id: makeId('T'), farmerId, cropId: crop.id, type: 'expense', category: form.expenseCategory, amount: Number(form.expense), date: new Date().toISOString().slice(0, 10), description: `${form.farmName.trim()} initial farm expense` }] : []
        setWorkspace((current) => ({ ...current, farmers: [...current.farmers, farmer], lands: [...current.lands, land], crops: [...current.crops, crop], transactions: [...current.transactions, ...transactions] }))
        setActive('overview')
        showNotice('Farm dashboard created. Your land and expense records are ready.')
    }

    function openAdd(type) { setModal({ type, record: null }) }
    function openTransaction(type) { setModal({ type: 'transaction', record: null, initialType: type }) }
    function openEdit(type, record) { setModal({ type, record }) }
    function saveRecord(type, record) {
        const listName = type === 'farmer' ? 'farmers' : type === 'land' ? 'lands' : type === 'crop' ? 'crops' : 'transactions'
        setWorkspace((current) => {
            const oldId = type === 'farmer' ? modal?.record?.id : null
            const exists = current[listName].some((item) => item.id === record.id || (oldId && item.id === oldId))
            const updated = { ...current, [listName]: exists ? current[listName].map((item) => item.id === record.id || (oldId && item.id === oldId) ? record : item) : [...current[listName], record] }
            if (type === 'farmer' && oldId && oldId !== record.id) {
                updated.lands = current.lands.map((land) => land.farmerId === oldId ? { ...land, farmerId: record.id } : land)
                updated.crops = current.crops.map((crop) => crop.farmerId === oldId ? { ...crop, farmerId: record.id } : crop)
                updated.transactions = current.transactions.map((item) => item.farmerId === oldId ? { ...item, farmerId: record.id } : item)
            }
            return updated
        })
        setModal(null)
        showNotice(`${type[0].toUpperCase()}${type.slice(1)} saved.`)
    }
    function deleteRecord(type, id) {
        const labels = { farmer: 'farmer', land: 'land record', crop: 'crop record', transaction: 'transaction' }
        if (!window.confirm(`Delete this ${labels[type]}? This cannot be undone.`)) return
        const listName = type === 'farmer' ? 'farmers' : type === 'land' ? 'lands' : type === 'crop' ? 'crops' : 'transactions'
        setWorkspace((current) => {
            const updated = { ...current, [listName]: current[listName].filter((item) => item.id !== id) }
            if (type === 'farmer') {
                updated.lands = updated.lands.filter((item) => item.farmerId !== id)
                updated.crops = updated.crops.filter((item) => item.farmerId !== id)
                updated.transactions = updated.transactions.filter((item) => item.farmerId !== id)
            }
            if (type === 'land') updated.crops = updated.crops.filter((item) => item.landId !== id)
            return updated
        })
        if (selectedFarmer === id) setSelectedFarmer(null)
        showNotice(`${labels[type][0].toUpperCase()}${labels[type].slice(1)} deleted.`)
    }
    function setSortKey(key) { setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' })) }

    function exportCsv() {
        const rows = [['Farmer ID', 'Name', 'Father name', 'Phone (masked)', 'CNIC (masked)', 'Land (acres)', 'Registration date']]
        filteredFarmers.forEach((farmer) => rows.push([farmer.id, farmer.fullName, farmer.fatherName, mask(farmer.phone, 3, 2), mask(farmer.cnic, 2, 2), workspace.lands.filter((land) => land.farmerId === farmer.id).reduce((sum, land) => sum + toAcres(land.area, land.unit), 0).toFixed(2), farmer.registeredAt]))
        downloadFile('agromart-farmers.csv', `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`, 'text/csv;charset=utf-8')
    }

    function exportBackup() {
        downloadFile(`agromart-farm-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), workspace }, null, 2), 'application/json')
    }

    async function restoreBackup(event) {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            const backup = JSON.parse(await file.text())
            const data = backup.workspace || backup
            if (!Array.isArray(data.farmers) || !Array.isArray(data.lands) || !Array.isArray(data.crops) || !Array.isArray(data.transactions)) throw new Error('This backup is not a valid AgroMart farm backup.')
            if (!window.confirm('Restore this backup and replace the current account dashboard data?')) return
            setWorkspace(data)
            showNotice('Backup restored successfully.')
        } catch (error) {
            showNotice(error.message || 'Could not read that backup file.')
        } finally {
            event.target.value = ''
        }
    }

    function printReport() { window.print() }

    function onModalSave(record) { saveRecord(modal.type, record) }

    function renderModal() {
        if (!modal) return null
        const titleMap = { farmer: modal.record ? 'Edit farmer' : 'Register farmer', land: modal.record ? 'Edit land record' : 'Add land record', crop: modal.record ? 'Edit crop' : 'Add crop', transaction: modal.record ? 'Edit transaction' : 'Record transaction' }
        const formProps = { record: modal.record, initialType: modal.initialType, farmers: workspace.farmers, lands: workspace.lands, crops: workspace.crops, onSave: onModalSave, onCancel: () => setModal(null) }
        return <Modal title={titleMap[modal.type]} onClose={() => setModal(null)} wide><div className="fm-modal-body">{modal.type === 'farmer' && <FarmerForm {...formProps} />}{modal.type === 'land' && <LandForm {...formProps} />}{modal.type === 'crop' && <CropForm {...formProps} />}{modal.type === 'transaction' && <TransactionForm {...formProps} />}</div></Modal>
    }

    function farmerActions(farmer) {
        return <div className="fm-row-actions"><ActionButton icon="view" label="View farmer profile" onClick={() => setSelectedFarmer(farmer.id)} /><ActionButton icon="edit" label="Edit farmer" onClick={() => openEdit('farmer', farmer)} /><ActionButton icon="trash" label="Delete farmer" tone="fm-danger" onClick={() => deleteRecord('farmer', farmer.id)} /></div>
    }

    function pageHeader(title, description, action) {
        return <header className="fm-page-heading"><div><p className="fm-eyebrow">Farm operations</p><h1>{title}</h1><p>{description}</p></div>{action}</header>
    }

    function renderOverview() {
        return <>
            {pageHeader('Farm overview', `Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${session?.name || 'Farmer'}. Here is your farm at a glance.`, <button className="fm-button fm-button-primary" onClick={() => openAdd('farmer')}><Icon name="add" /> Register farmer</button>)}
            <div className="fm-metric-grid">
                <MetricCard icon="♙" label="Total farmers" value={workspace.farmers.length} detail="Registered farmer profiles" />
                <MetricCard icon="⌂" label="Managed land" value={`${landArea.toFixed(2)} ac`} detail={formatArea(landArea)} tint="lime" />
                <MetricCard icon="▤" label="Land parcels" value={workspace.lands.length} detail="Registered land records" tint="blue" />
                <MetricCard icon="❧" label="Active crops" value={workspace.crops.filter((crop) => ['Growing', 'Planned'].includes(crop.status)).length} detail={`${workspace.crops.length} crop records`} tint="blue" />
                <MetricCard icon="↗" label="Total income" value={money(income)} detail={`${workspace.transactions.filter((item) => item.type === 'income').length} income records`} tint="gold" />
                <MetricCard icon="↘" label="Total expenses" value={money(expenses)} detail={`${workspace.transactions.filter((item) => item.type === 'expense').length} expense records`} tint="rose" />
                <MetricCard icon="₨" label="Net profit / loss" value={money(income - expenses)} detail={income >= expenses ? 'Operating in profit' : 'Expenses exceed income'} tint={income >= expenses ? 'green' : 'rose'} />
            </div>
            <div className="fm-overview-grid">
                <section className="fm-panel fm-chart-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Last six months</p><h2>Income vs expenses</h2></div><div className="fm-chart-legend"><span><i className="fm-dot-income" /> Income</span><span><i className="fm-dot-expense" /> Expenses</span></div></div><MonthlyChart rows={monthlyBars} /></section>
                <section className="fm-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Quick actions</p><h2>Keep records current</h2></div></div><div className="fm-quick-actions"><button onClick={() => openAdd('land')}><span>⌂</span><strong>Add land</strong><small>Track area and irrigation</small></button><button onClick={() => openAdd('crop')}><span>❧</span><strong>Plan a crop</strong><small>Record dates and inputs</small></button><button onClick={() => openTransaction('expense')}><span>₨</span><strong>Log expense</strong><small>Track farm spending</small></button><button onClick={() => openTransaction('income')}><span>↗</span><strong>Log income</strong><small>Record crop sales</small></button></div></section>
                <section className="fm-panel fm-recent-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Latest activity</p><h2>Recent transactions</h2></div><button className="fm-text-button" onClick={() => setActive('finance')}>View ledger →</button></div>{recentTransactions.length ? <div className="fm-transaction-list">{recentTransactions.map((item) => <div className="fm-transaction-row" key={item.id}><span className={`fm-transaction-sign ${item.type}`}>{item.type === 'income' ? '+' : '−'}</span><div><strong>{item.category}</strong><small>{farmerById[item.farmerId]?.fullName || 'Farmer'} · {dateLabel(item.date)}</small></div><b className={item.type}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</b></div>)}</div> : <EmptyState title="No transactions yet" detail="Record expenses and crop sales to see financial trends." action={<button className="fm-button fm-button-secondary" onClick={() => openAdd('transaction')}>Record transaction</button>} />}</section>
                <section className="fm-panel fm-area-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Land use</p><h2>Land by ownership</h2></div></div><OwnershipChart lands={workspace.lands} /></section>
            </div>
        </>
    }

    function renderFarmers() {
        return <>
            {pageHeader('Farmers', 'Farmer registry, village contacts, and account profiles.', <div className="fm-heading-actions"><button className="fm-button fm-button-secondary" onClick={exportCsv}><Icon name="download" /> Export CSV</button><button className="fm-button fm-button-primary" onClick={() => openAdd('farmer')}><Icon name="add" /> Add farmer</button></div>)}
            <section className="fm-panel fm-table-panel">
                <div className="fm-filter-bar"><label className="fm-search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, ID..." /></label><select aria-label="Filter by land status" value={landFilter} onChange={(event) => setLandFilter(event.target.value)}><option value="">Any land status</option><option value="has">Has land</option><option value="none">No land records</option></select></div>
                {filteredFarmers.length ? <div className="fm-table-scroll"><table className="fm-table"><thead><tr><th><button onClick={() => setSortKey('fullName')}>Farmer {sort.key === 'fullName' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th><th><button onClick={() => setSortKey('id')}>Farmer ID {sort.key === 'id' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}</button></th><th>Contact</th><th>Land area</th><th>Registered</th><th>Actions</th></tr></thead><tbody>{filteredFarmers.map((farmer) => { const area = workspace.lands.filter((land) => land.farmerId === farmer.id).reduce((sum, land) => sum + toAcres(land.area, land.unit), 0); return <tr key={farmer.id}><td><div className="fm-farmer-cell">{farmer.photo ? <img src={farmer.photo} alt="" /> : <span className="fm-avatar">{farmer.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>}<div><strong>{farmer.fullName}</strong><small>{farmer.fatherName}</small></div></div></td><td><span className="fm-id">{farmer.id}</span></td><td><span>{mask(farmer.phone, 3, 2)}</span><small className="fm-private">CNIC {mask(farmer.cnic, 2, 2)}</small></td><td>{area.toFixed(2)} ac</td><td>{dateLabel(farmer.registeredAt)}</td><td>{farmerActions(farmer)}</td></tr> })}</tbody></table></div> : <EmptyState title="No farmers match these filters" detail="Clear filters or register the first farmer." action={<button className="fm-button fm-button-primary" onClick={() => openAdd('farmer')}>Add farmer</button>} />}
            </section>
        </>
    }

    function renderLand() {
        return <>
            {pageHeader('Land management', 'Keep every parcel, ownership record, and irrigation detail in one place.', <button className="fm-button fm-button-primary" onClick={() => openAdd('land')}><Icon name="add" /> Add land</button>)}
            <div className="fm-summary-strip"><strong>{workspace.lands.length} parcels</strong><span>{formatArea(landArea)} in total</span><span>{money(0)} assessed value not entered</span></div>
            <section className="fm-panel fm-table-panel"><DataTable emptyTitle="No land records yet" emptyDetail="Add land parcels and assign each to a farmer." emptyAction={<button className="fm-button fm-button-primary" onClick={() => openAdd('land')}>Add land</button>} headers={['Farmer', 'Farm location', 'Area', 'Ownership', 'Irrigation', 'Soil', 'Document', 'Actions']} rows={workspace.lands.map((land) => [farmerById[land.farmerId]?.fullName || 'Unknown', land.location || 'Not provided', formatArea(toAcres(land.area, land.unit)), land.ownership, land.irrigation || 'Not set', land.soilType || 'Not set', land.document?.name || 'Not set', <div className="fm-row-actions"><ActionButton icon="edit" label="Edit land" onClick={() => openEdit('land', land)} /><ActionButton icon="trash" label="Delete land" tone="fm-danger" onClick={() => deleteRecord('land', land.id)} /></div>])} /></section>
        </>
    }

    function renderCrops() {
        return <>
            {pageHeader('Crop management', 'Sowing schedules, field inputs, harvests, and yield records.', <button className="fm-button fm-button-primary" onClick={() => openAdd('crop')}><Icon name="add" /> Add crop</button>)}
            <section className="fm-panel fm-table-panel"><DataTable emptyTitle="No crop plans yet" emptyDetail="Add a crop and link it to a farmer’s land parcel." emptyAction={<button className="fm-button fm-button-primary" onClick={() => openAdd('crop')}>Plan a crop</button>} headers={['Crop', 'Farmer / farm location', 'Sowing', 'Harvest', 'Yield', 'Seeds / fertilizer', 'Status', 'Actions']} rows={workspace.crops.map((crop) => [crop.cropName, `${farmerById[crop.farmerId]?.fullName || 'Unknown'} · ${landById[crop.landId]?.location || (landById[crop.landId] ? formatArea(toAcres(landById[crop.landId].area, landById[crop.landId].unit)) : 'Land')}`, dateLabel(crop.sowDate), dateLabel(crop.harvestDate), crop.yieldAmount ? `${crop.yieldAmount} ${crop.yieldUnit}` : '—', `${crop.seeds || '—'} / ${crop.fertilizer || '—'}`, <span className={`fm-status fm-status-${crop.status.toLowerCase()}`}>{crop.status}</span>, <div className="fm-row-actions"><ActionButton icon="edit" label="Edit crop" onClick={() => openEdit('crop', crop)} /><ActionButton icon="trash" label="Delete crop" tone="fm-danger" onClick={() => deleteRecord('crop', crop.id)} /></div>])} /></section>
        </>
    }

    function renderFinance() {
        return <>
            {pageHeader('Expenses & income', 'Record farm spending and crop sales to keep profit and loss current.', <div className="fm-heading-actions"><button className="fm-button fm-button-secondary" onClick={() => openTransaction('expense')}><Icon name="add" /> Record expense</button><button className="fm-button fm-button-primary" onClick={() => openTransaction('income')}><Icon name="add" /> Record income</button></div>)}
            <div className="fm-metric-grid fm-finance-metrics"><MetricCard icon="↗" label="Income" value={money(income)} detail="All recorded income" tint="green" /><MetricCard icon="↘" label="Expenses" value={money(expenses)} detail="All recorded costs" tint="rose" /><MetricCard icon="₨" label="Profit / loss" value={money(income - expenses)} detail={income >= expenses ? 'Positive net balance' : 'Negative net balance'} tint={income >= expenses ? 'lime' : 'rose'} /></div>
            <section className="fm-panel fm-table-panel"><DataTable emptyTitle="Ledger is empty" emptyDetail="Record seed, fertilizer, labour, irrigation, tractor, pesticide costs, or crop sales." emptyAction={<button className="fm-button fm-button-primary" onClick={() => openAdd('transaction')}>Add transaction</button>} headers={['Date', 'Farmer', 'Type', 'Category', 'Crop', 'Description', 'Amount', 'Actions']} rows={[...workspace.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).map((item) => [dateLabel(item.date), farmerById[item.farmerId]?.fullName || 'Unknown', <span className={`fm-status fm-status-${item.type}`}>{item.type}</span>, item.category, cropById[item.cropId]?.cropName || '—', item.description || '—', <strong className={item.type}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</strong>, <div className="fm-row-actions"><ActionButton icon="edit" label="Edit transaction" onClick={() => openEdit('transaction', item)} /><ActionButton icon="trash" label="Delete transaction" tone="fm-danger" onClick={() => deleteRecord('transaction', item.id)} /></div>])} /></section>
        </>
    }

    function renderReports() {
        return <>
            {pageHeader('Reports', 'Review financial performance and export a period summary.', <div className="fm-heading-actions"><button className="fm-button fm-button-secondary" onClick={printReport}><Icon name="print" /> Print</button><button className="fm-button fm-button-primary" onClick={exportCsv}><Icon name="download" /> Export farmer CSV</button></div>)}
            <section className="fm-panel fm-report-controls"><label>Report period<select value={reportPeriod} onChange={(event) => { setReportPeriod(event.target.value); setReportDate(event.target.value === 'year' ? new Date().toISOString().slice(0, 4) : new Date().toISOString().slice(0, 7)) }}><option value="month">Monthly</option><option value="year">Yearly</option></select></label><label>{reportPeriod === 'year' ? 'Year' : 'Month'}<input type={reportPeriod === 'year' ? 'number' : 'month'} min={reportPeriod === 'year' ? '2000' : undefined} max={reportPeriod === 'year' ? '2100' : undefined} value={reportDate} onChange={(event) => setReportDate(event.target.value)} /></label><div><span>Reporting range</span><strong>{reportPeriod === 'year' ? reportDate : new Date(`${reportDate}-01T00:00:00`).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</strong></div></section>
            <div className="fm-metric-grid fm-report-metrics"><MetricCard icon="↗" label="Period income" value={money(reportIncome)} detail={`${reportTransactions.filter((item) => item.type === 'income').length} records`} tint="green" /><MetricCard icon="↘" label="Period expenses" value={money(reportExpenses)} detail={`${reportTransactions.filter((item) => item.type === 'expense').length} records`} tint="rose" /><MetricCard icon="₨" label="Period profit / loss" value={money(reportIncome - reportExpenses)} detail={reportIncome >= reportExpenses ? 'Positive period' : 'Negative period'} tint={reportIncome >= reportExpenses ? 'lime' : 'rose'} /></div>
            <div className="fm-overview-grid"><section className="fm-panel fm-chart-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Income and spending</p><h2>Monthly trend</h2></div><div className="fm-chart-legend"><span><i className="fm-dot-income" /> Income</span><span><i className="fm-dot-expense" /> Expenses</span></div></div><MonthlyChart rows={monthlyBars} /></section><section className="fm-panel"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Cost distribution</p><h2>Expenses by category</h2></div></div><CategoryChart rows={expenseBreakdown} /></section></div>
            <section className="fm-panel fm-table-panel fm-report-table"><div className="fm-panel-heading"><div><p className="fm-eyebrow">Period details</p><h2>Transactions in selected period</h2></div></div><DataTable emptyTitle="No transactions in this period" emptyDetail="Choose another period or add transactions to generate a report." headers={['Date', 'Farmer', 'Type', 'Category', 'Description', 'Amount']} rows={reportTransactions.map((item) => [dateLabel(item.date), farmerById[item.farmerId]?.fullName || 'Unknown', item.type, item.category, item.description || '—', money(item.amount)])} /></section>
        </>
    }

    function profileModal() {
        if (!selectedFarmer) return null
        const farmer = farmerById[selectedFarmer]
        if (!farmer) return null
        const farmerLands = workspace.lands.filter((land) => land.farmerId === farmer.id)
        const farmerCrops = workspace.crops.filter((crop) => crop.farmerId === farmer.id)
        const farmerTransactions = workspace.transactions.filter((item) => item.farmerId === farmer.id)
        return <Modal title="Farmer profile" onClose={() => setSelectedFarmer(null)} wide><div className="fm-profile-view"><div className="fm-profile-top">{farmer.photo ? <img src={farmer.photo} alt="" /> : <span className="fm-avatar fm-avatar-large">{farmer.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>}<div><span className="fm-id">{farmer.id}</span><h3>{farmer.fullName}</h3><p>S/O {farmer.fatherName} · Registered {dateLabel(farmer.registeredAt)}</p></div><button className="fm-button fm-button-secondary" onClick={() => { setSelectedFarmer(null); openEdit('farmer', farmer) }}>Edit profile</button></div><div className="fm-profile-grid"><div><span>Phone</span><strong>{mask(farmer.phone, 3, 2)}</strong></div><div><span>CNIC</span><strong>{mask(farmer.cnic, 2, 2)}</strong></div></div><h3>Land and crops</h3>{farmerLands.map((land) => <p key={land.id}>{formatArea(toAcres(land.area, land.unit))} · {land.ownership}</p>)}{farmerCrops.map((crop) => <p key={crop.id}>{crop.cropName} · {crop.status} · {crop.yieldAmount ? `${crop.yieldAmount} ${crop.yieldUnit}` : 'No yield recorded'}</p>)}<h3>Financial summary</h3><p>Income {money(farmerTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0))} · Expenses {money(farmerTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0))}</p><p className="fm-profile-notes">{farmer.notes || 'No additional notes.'}</p></div></Modal>
    }

    const activeSection = sections.find(([id]) => id === active)
    const addButtons = { farmers: ['farmer', 'Add farmer'], land: ['land', 'Add land'], crops: ['crop', 'Add crop'], finance: ['transaction', 'Add transaction'] }

    const hasFarmSetup = workspace.farmers.some((farmer) => farmer.accountOwner)

    return <div className={`fm-app ${theme === 'dark' ? 'fm-dark' : ''}${sidebarOpen ? ' fm-sidebar-open' : ''}`}>
        <button type="button" className="fm-sidebar-backdrop" aria-label="Close navigation menu" tabIndex={sidebarOpen ? 0 : -1} onClick={() => setSidebarOpen(false)} />
        <aside className="fm-sidebar">
            <div className="fm-sidebar-heading"><a href="#/home" className="fm-brand"><img src="/Agromart-Pak.png" alt="" /><span><strong>AgroMart</strong><small>FARM MANAGEMENT</small></span></a><button type="button" className="fm-sidebar-close" aria-label="Close navigation menu" onClick={() => setSidebarOpen(false)}><Icon name="close" /></button></div>
            <div className="fm-account"><span className="fm-account-avatar">{(session?.name || 'F').slice(0, 1).toUpperCase()}</span><span><strong>{session?.name || 'Farmer'}</strong><small>Farmer workspace</small></span></div>
            <p className="fm-nav-label">WORKSPACE</p>
            <nav className="fm-nav" aria-label="Farmer management sections">{sections.map(([id, label, icon]) => <button type="button" key={id} className={active === id ? 'is-active' : ''} onClick={() => { setActive(id); setSelectedFarmer(null); setSidebarOpen(false) }}><span>{icon}</span>{label}{active === id && <i />}</button>)}</nav>
            <p className="fm-nav-label fm-tools-label">DATA TOOLS</p>
            <div className="fm-sidebar-tools"><button type="button" onClick={exportBackup}><Icon name="download" /> Backup records</button><button type="button" onClick={() => restoreInput.current?.click()}><Icon name="upload" /> Restore backup</button><input ref={restoreInput} type="file" accept="application/json,.json" hidden onChange={restoreBackup} /></div>
            <a href="#/home" className="fm-back-link">← Back to AgroMart</a>
        </aside>
        <main className="fm-main">
            <header className="fm-topbar"><button className="fm-sidebar-toggle" aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}><Icon name="menu" /></button><div className="fm-breadcrumb"><a href="#/home" className="fm-breadcrumb-home">AgroMart</a><b>/</b><strong>{activeSection?.[1]}</strong></div><div className="fm-top-actions"><label className="fm-global-search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search farmers" aria-label="Search farmers" /></label><ActionButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} /><ActionButton icon="print" label="Print current view" onClick={printReport} /><button className="fm-logout" onClick={() => { clearSession(); window.location.hash = '#/login' }}>Log out</button></div></header>
            <div className="fm-content">
                {!hasFarmSetup ? <FarmSetup session={session} farmers={workspace.farmers} onSave={saveFarmSetup} /> : <>
                    {active === 'overview' && renderOverview()}
                    {active === 'farmers' && renderFarmers()}
                    {active === 'land' && renderLand()}
                    {active === 'crops' && renderCrops()}
                    {active === 'finance' && renderFinance()}
                    {active === 'reports' && renderReports()}
                    {addButtons[active] && <button className="fm-floating-add" onClick={() => openAdd(addButtons[active][0])}><Icon name="add" />{addButtons[active][1]}</button>}
                </>}
            </div>
        </main>
        {notice && <div className="fm-toast" role="status">{notice}</div>}
        {renderModal()}
        {profileModal()}
    </div>
}

function DataTable({ headers, rows, emptyTitle, emptyDetail, emptyAction }) {
    if (!rows.length) return <EmptyState title={emptyTitle} detail={emptyDetail} action={emptyAction} />
    return <div className="fm-table-scroll"><table className="fm-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
}

function MonthlyChart({ rows }) {
    const maxValue = Math.max(1, ...rows.flatMap((row) => [row.income, row.expenses]))
    return <div className="fm-month-chart">{rows.map((row) => <div className="fm-month-column" key={row.month}><div className="fm-bars"><span className="fm-bar-income" style={{ height: `${Math.max(2, row.income / maxValue * 100)}%` }} title={`Income ${money(row.income)}`} /><span className="fm-bar-expense" style={{ height: `${Math.max(2, row.expenses / maxValue * 100)}%` }} title={`Expenses ${money(row.expenses)}`} /></div><small>{row.month}</small></div>)}</div>
}

function OwnershipChart({ lands }) {
    const groups = ['Owned', 'Leased', 'Shared'].map((ownership) => ({ ownership, acres: lands.filter((land) => land.ownership === ownership).reduce((sum, land) => sum + toAcres(land.area, land.unit), 0) }))
    const total = groups.reduce((sum, group) => sum + group.acres, 0)
    const colors = { Owned: 'fm-own', Leased: 'fm-lease', Shared: 'fm-shared' }
    return <div className="fm-ownership-chart">{total ? <div className="fm-stacked-bar">{groups.filter((group) => group.acres).map((group) => <span key={group.ownership} className={colors[group.ownership]} style={{ width: `${group.acres / total * 100}%` }} title={`${group.ownership}: ${group.acres.toFixed(2)} acres`} />)}</div> : <EmptyState title="No land to summarize" detail="Add a land record to compare ownership." />}<div className="fm-ownership-legend">{groups.map((group) => <div key={group.ownership}><i className={colors[group.ownership]} /><span>{group.ownership}</span><strong>{group.acres.toFixed(2)} ac</strong></div>)}</div></div>
}

function CategoryChart({ rows }) {
    const maxValue = Math.max(1, ...rows.map((row) => row.amount))
    return <div className="fm-category-chart">{rows.map((row) => <div key={row.category}><span>{row.category}</span><div><i style={{ width: `${row.amount / maxValue * 100}%` }} /></div><strong>{money(row.amount)}</strong></div>)}</div>
}