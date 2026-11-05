import React, { useEffect, useState } from 'react'
import { loginWithApi, registerWithApi, resendVerificationCode, setSession, verifyEmailWithApi } from '../utils/auth'

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [verificationMode, setVerificationMode] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const isRegister = mode === 'register'

  useEffect(() => {
    setMode(initialMode)
    setForgotMode(false)
    setVerificationMode(false)
    setVerificationCode('')
    setMessage('')
  }, [initialMode])

  useEffect(() => {
    if (!message) return undefined
    const timeoutId = window.setTimeout(() => setMessage(''), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSubmitting) return

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()

    setIsSubmitting(true)
    setMessage('')
    try {
      if (!isRegister) {
        const { user, token } = await loginWithApi(email, form.get('password'))
        setSession(user, token)
        window.location.hash = user.role === 'admin' ? '#/admin' : '#/home'
        return
      }

      const result = await registerWithApi(form.get('name'), email, form.get('password'), form.get('phone'))
      setVerificationEmail(result.email || email)
      setVerificationMode(true)
      setVerificationCode('')
      setMessage(result.message || 'Check your email for a verification code.')
    } catch (error) {
      if (error.data?.verificationRequired && error.data.email) {
        setVerificationEmail(error.data.email)
        setVerificationMode(true)
        setVerificationCode('')
      }
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setMessage('')
    try {
      const { user, token } = await verifyEmailWithApi(verificationEmail, verificationCode)
      setSession(user, token)
      window.location.hash = user.role === 'admin' ? '#/admin' : '#/home'
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setMessage('')
    try {
      const result = await resendVerificationCode(verificationEmail)
      setMessage(result.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode) {
    setMessage('')
    setForgotMode(false)
    setVerificationMode(false)
    setVerificationCode('')
    setMode(nextMode)
    window.location.hash = nextMode === 'register' ? '#/register' : '#/login'
  }

  return <div className="auth-container">
    <div className={`auth-box${isRegister ? ' auth-register-box' : ''}`}>
      <h2>{verificationMode ? 'Verify your email' : forgotMode ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <p>{verificationMode ? `Enter the 6-digit code sent to ${verificationEmail}.` : forgotMode ? 'Choose a new password for your account.' : isRegister ? 'One account to shop and manage your farm.' : 'Login to your AgroMart account'}</p>

      {verificationMode ? <form onSubmit={handleVerify}>
        <input
          type="text"
          name="verificationCode"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="6-digit verification code"
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <span className="auth-loading-spinner" aria-hidden="true" />}
          {isSubmitting ? 'Verifying...' : 'Verify email'}
        </button>
        <button type="button" className="auth-secondary-btn" onClick={handleResendCode} disabled={isSubmitting}>Resend code</button>
        <button type="button" className="auth-secondary-btn" onClick={() => switchMode('register')}>Use another email</button>
      </form> : forgotMode ? <div className="forgot-password-form">
        <p className="auth-form-note">Password reset is not available yet for server accounts. Please contact the administrator.</p>
        <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setMessage('') }}>Back to sign in</button>
      </div> : <form key={mode} onSubmit={handleSubmit} autoComplete="off">
        {isRegister && <input type="text" name="name" placeholder="Full Name" autoComplete="name" required />}

        <input
          type="email"
          name="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
        />

        {isRegister && <input type="tel" name="phone" placeholder="Phone Number" autoComplete="tel" required />}

        <div className="password-box">
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 6 : undefined} required />
          <button type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>

        {!isRegister && <div className="auth-options"><label><input type="checkbox" />Remember me</label><button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setMessage('') }}>Forgot password?</button></div>}
        {isRegister && <div className="terms"><label><input type="checkbox" required />I agree to the Terms &amp; Conditions</label></div>}

        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting} onClick={() => setMessage('')}>
          {isSubmitting && <span className="auth-loading-spinner" aria-hidden="true" />}
          {isSubmitting ? (isRegister ? 'Sending verification code...' : 'Signing in...') : (isRegister ? 'Register' : 'Login')}
        </button>
      </form>}

      {message && <p className="auth-message" role="status">{message}</p>}

      {!forgotMode && !verificationMode && <p className="switch-page">{isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}<a href={isRegister ? '#/login' : '#/register'} onClick={(event) => { event.preventDefault(); switchMode(isRegister ? 'login' : 'register') }}>{isRegister ? 'Login' : 'Create Account'}</a></p>}
    </div>
  </div>
}
