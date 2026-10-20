import React, { useEffect, useRef, useState } from 'react'
import { getOAuthUrl, loginWithApi, registerWithApi, resetPasswordWithApi, setSession } from '../utils/auth'

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
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
        window.location.hash = user.role === 'admin' ? '#/admin' : '#/home'
        return
      }

      await registerWithApi(form.get('name'), email, form.get('password'), form.get('phone'))
      setMessage('Account created successfully. You can now login.')
      formRef.current?.reset()
      setFormVersion((version) => version + 1)
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
      <p>{forgotMode ? 'Choose a new password for your account.' : isRegister ? 'Create your AgroMart account.' : 'Login to your AgroMart account'}</p>

      {forgotMode ? <form onSubmit={handleResetPassword} className="forgot-password-form" autoComplete="off">
        <p className="auth-form-note">Enter your registered email and choose a new password.</p>
        <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Email Address" required />
        <input type="password" name="newPassword" placeholder="New password" minLength="6" required />
        <button type="submit" className="auth-btn">Update password</button>
        <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setMessage('') }}>Back to sign in</button>
      </form> : <form key={`${mode}-${formVersion}`} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
        {isRegister && <>
          <input type="text" name="name" placeholder="Full Name" autoComplete="off" required />
        </>}

        <input type="email" name="email" placeholder="Email Address" autoComplete="off" required />

        {isRegister && <>
          <input type="tel" name="phone" placeholder="Phone Number" autoComplete="off" required />
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