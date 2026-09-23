import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import cloudStorage, { hydrateCloudStorage } from './utils/cloudStorage'

async function startApp() {
    await hydrateCloudStorage()
    Object.defineProperty(window, 'localStorage', { configurable: true, value: cloudStorage })
    createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
}

startApp()
