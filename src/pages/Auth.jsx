import React, { useEffect, useRef, useState } from 'react'
import { getOAuthUrl, loginWithApi, registerWithApi, resetPasswordWithApi, setSession } from '../utils/auth'
import { pakistanLocations } from '../utils/pakistanLocations'

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState('customer')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')
  const [formVersion, setFormVersion] = useState(0)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const formRef = useRef(null)
  const isRegister = mode === 'register'

  useEffect(() => {
    setMode(initialMode)
    setForgotMode(false)
    setMessage('')
  }, [initialMode])

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()

    try {
      if (!isRegister) {
        const { user, token } = await loginWithApi(email, form.get('password'))
        setSession(user, token)
        window.location.hash = user.role === 'admin' ? '#/admin' : user.role === 'farmer' ? '#/farmer-dashboard' : '#/home'
        return
      }

      const farmerProfile = accountType === 'farmer' ? {
        farmName: String(form.get('farmName') || '').trim(),
        province: String(form.get('province') || ''),
        city: String(form.get('city') || ''),
        farmArea: String(form.get('farmArea') || ''),
        primaryCrop: String(form.get('primaryCrop') || '').trim(),
        farmingType: String(form.get('farmingType') || 'Conventional')
      } : null
      await registerWithApi(form.get('name'), email, form.get('password'), form.get('phone'), accountType, farmerProfile)
      setMessage(`${accountType === 'farmer' ? 'Farmer' : 'Customer'} account created successfully. You can now login.`)
      formRef.current?.reset()
      setFormVersion((version) => version + 1)
      setAccountType('customer')
      setProvince('')
      setCity('')
      setShowPassword(false)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    const email = resetEmail.trim().toLowerCase()
    const form = new FormData(event.currentTarget)
    try {
      await resetPasswordWithApi(email, form.get('newPassword'))
      setMessage('Password updated successfully. You can now sign in.')
      setForgotMode(false)
      setResetEmail('')
    } catch (error) {
      setMessage(error.message)
    }
  }

  function switchMode(nextMode) {
    setMessage('')
    setForgotMode(false)
    setMode(nextMode)
    window.location.hash = nextMode === 'register' ? '#/register' : '#/login'
  }

  function startSocialLogin(provider) {
    window.location.href = getOAuthUrl(provider)
  }

  return <div className="auth-container">
    <div className={`auth-box${isRegister ? ' auth-register-box' : ''}`}>
      <h2>{forgotMode ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <p>{forgotMode ? 'Choose a new password for your account.' : isRegister ? 'Choose how you want to use AgroMart.' : 'Login to your AgroMart account'}</p>

      {forgotMode ? <form onSubmit={handleResetPassword} className="forgot-password-form" autoComplete="off">
        <p className="auth-form-note">Enter your registered email and choose a new password.</p>
        <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Email Address" required />
        <input type="password" name="newPassword" placeholder="New password" minLength="6" required />
        <button type="submit" className="auth-btn">Update password</button>
        <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setMessage('') }}>Back to sign in</button>
      </form> : <form key={`${mode}-${formVersion}`} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
        {isRegister && <>
          <div className="account-type-choice" role="group" aria-label="Choose account type">
            <button type="button" className={accountType === 'customer' ? 'is-selected' : ''} aria-pressed={accountType === 'customer'} onClick={() => setAccountType('customer')}><span aria-hidden="true">♙</span><strong>Customer</strong><small>Shop farming products</small></button>
            <button type="button" className={accountType === 'farmer' ? 'is-selected' : ''} aria-pressed={accountType === 'farmer'} onClick={() => setAccountType('farmer')}><span aria-hidden="true">⌂</span><strong>Farmer</strong><small>Manage your farm</small></button>
          </div>
          <input type="hidden" name="role" value={accountType} />
          <input type="text" name="name" placeholder="Full Name" autoComplete="off" required />
        </>}

        <input type="email" name="email" placeholder="Email Address" autoComplete="off" required />

        {isRegister && <>
          <input type="tel" name="phone" placeholder="Phone Number" autoComplete="off" required />
          {accountType === 'farmer' && <div className="farmer-registration-fields">
            <p className="farmer-registration-title">Farm details</p>
            <input type="text" name="farmName" placeholder="Farm name" required />
            <label className="auth-label">Province<select name="province" value={province} onChange={(event) => { setProvince(event.target.value); setCity('') }} required><option value="">Select province</option>{Object.keys(pakistanLocations).map((name) => <option key={name}>{name}</option>)}</select></label>
            <label className="auth-label">District / City<select name="city" value={city} onChange={(event) => setCity(event.target.value)} disabled={!province} required><option value="">Select district / city</option>{(pakistanLocations[province] || []).map((name) => <option key={name}>{name}</option>)}</select></label>
            <input type="number" name="farmArea" min="0.1" step="0.1" placeholder="Farm area (acres)" required />
            <input type="text" name="primaryCrop" placeholder="Primary crop" required />
            <label className="auth-label">Farming method<select name="farmingType" defaultValue="Conventional"><option>Conventional</option><option>Organic</option><option>Mixed</option></select></label>
          </div>}
        </>}

        <div className="password-box">
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" autoComplete="new-password" minLength={isRegister ? 6 : undefined} required />
          <button type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>

        {!isRegister && <div className="auth-options"><label><input type="checkbox" />Remember me</label><button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setMessage('') }}>Forgot password?</button></div>}
        {isRegister && <div className="terms"><label><input type="checkbox" required />I agree to the Terms &amp; Conditions</label></div>}

        <button type="submit" className="auth-btn">{isRegister ? 'Register' : 'Login'}</button>
      </form>}

      {message && <p className="auth-message" role="status">{message}</p>}

      {!forgotMode && <>
        <div className="divider"><span>OR</span></div>
        <div className="auth-social-grid">
          <button type="button" className="social-btn google-btn" onClick={() => startSocialLogin('google')}><strong>G</strong> Continue with Google</button>
          <button type="button" className="social-btn facebook-btn" onClick={() => startSocialLogin('facebook')}><strong>f</strong> Continue with Facebook</button>
        </div>
        <p className="switch-page">{isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}<a href={isRegister ? '#/login' : '#/register'} onClick={(event) => { event.preventDefault(); switchMode(isRegister ? 'login' : 'register') }}>{isRegister ? 'Login' : 'Create Account'}</a></p>
      </>}
    </div>
  </div>
}