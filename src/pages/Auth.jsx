import React, { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../utils/api'
import { loginWithApi, registerWithApi, setSession } from '../utils/auth'

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const [forgotMode, setForgotMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetComplete, setResetComplete] = useState(false)
  const formRef = useRef(null)
  const isRegister = mode === 'register'

  useEffect(() => {
    setMode(initialMode)
    setForgotMode(false)
    setOtpSent(false)
    setResetEmail('')
    setResetComplete(false)
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
    const emailInput = event.currentTarget.elements.namedItem('email')
    const email = String(form.get('email') || '').trim().toLowerCase()
    const enteredEmail = forgotMode && otpSent ? resetEmail : email
    const normalizedEmail = enteredEmail && !enteredEmail.includes('@') ? `${enteredEmail}@gmail.com` : enteredEmail
    if (emailInput instanceof HTMLInputElement) emailInput.value = normalizedEmail

    setIsSubmitting(true)
    setMessage('')
    try {
      if (forgotMode) {
        if (!otpSent) {
          const result = await apiRequest('/auth/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email: normalizedEmail })
          })
          setResetEmail(normalizedEmail)
          setOtpSent(true)
          setMessage(result.message)
          return
        }

        const password = String(form.get('password') || '')
        if (password !== form.get('confirmPassword')) throw new Error('Passwords do not match.')
        const result = await apiRequest('/auth/password-reset/confirm', {
          method: 'POST',
          body: JSON.stringify({
            email: resetEmail,
            code: form.get('code'),
            password,
            confirmPassword: form.get('confirmPassword')
          })
        })
        setResetComplete(true)
        setMessage(result.message)
        return
      }

      if (!isRegister) {
        const { user, token } = await loginWithApi(normalizedEmail, form.get('password'))
        setSession(user, token)
        window.location.hash = user.role === 'admin' ? '#/admin' : '#/home'
        return
      }

      await registerWithApi(form.get('name'), normalizedEmail, form.get('password'), form.get('phone'))
      setMessage('Account created successfully. You can now login.')
      formRef.current?.reset()
      setFormVersion((version) => version + 1)
      setShowPassword(false)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode) {
    setMessage('')
    setForgotMode(false)
    setOtpSent(false)
    setResetComplete(false)
    setMode(nextMode)
    window.location.hash = nextMode === 'register' ? '#/register' : '#/login'
  }

  async function resendResetCode() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setMessage('')
    try {
      const result = await apiRequest('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail })
      })
      setMessage(result.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="auth-container">
    <div className={`auth-box${isRegister ? ' auth-register-box' : ''}`}>
      <h2>{forgotMode ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <p>{forgotMode ? otpSent ? `Enter the code sent to ${resetEmail}, then choose a new password.` : 'Enter your account email and we will send a reset code.' : isRegister ? 'One account to shop and manage your farm.' : 'Login to your AgroMart account'}</p>

      {resetComplete ? <div className="forgot-password-form">
        <p className="auth-form-note" role="status">{message}</p>
        <button type="button" className="auth-secondary-btn" onClick={() => { window.location.hash = '#/login' }}>Back to sign in</button>
      </div> : forgotMode ? <form key={`forgot-${otpSent}-${formVersion}`} onSubmit={handleSubmit} autoComplete="on">
        {!otpSent ? <input
          type="email"
          name="email"
          placeholder="name@gmail.com"
          autoComplete="email"
          onBlur={(event) => {
            const value = event.currentTarget.value.trim()
            if (value && !value.includes('@')) event.currentTarget.value = `${value}@gmail.com`
          }}
          required
        /> : <>
          <input type="email" name="email" value={resetEmail} autoComplete="email" readOnly aria-label="Account email" />
          <input type="text" name="code" placeholder="6-digit email code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required />
          <input type="password" name="password" placeholder="New password (at least 8 characters)" autoComplete="new-password" minLength={8} maxLength={128} required />
          <input type="password" name="confirmPassword" placeholder="Confirm new password" autoComplete="new-password" minLength={8} maxLength={128} required />
        </>}
        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (otpSent ? 'Updating password...' : 'Sending code...') : otpSent ? 'Set new password' : 'Send OTP'}
        </button>
        {otpSent && <button type="button" className="forgot-link" onClick={resendResetCode} disabled={isSubmitting}>Resend code</button>}
        <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setOtpSent(false); setMessage('') }}>Back to sign in</button>
      </form> : <form key={`${mode}-${formVersion}`} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
        {isRegister && <input type="text" name="name" placeholder="Full Name" autoComplete="name" required />}

        <input
          type="email"
          name="email"
          placeholder="name@gmail.com"
          autoComplete="email"
          onBlur={(event) => {
            const value = event.currentTarget.value.trim()
            if (value && !value.includes('@')) event.currentTarget.value = `${value}@gmail.com`
          }}
          required
        />

        {isRegister && <input type="tel" name="phone" placeholder="Phone Number" autoComplete="tel" required />}

        <div className="password-box">
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 6 : undefined} required />
          <button type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>

        {!isRegister && <div className="auth-options"><label><input type="checkbox" />Remember me</label><button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setOtpSent(false); setResetComplete(false); setMessage('') }}>Forgot password?</button></div>}
        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting} onClick={() => setMessage('')}>
          {isSubmitting && <span className="auth-loading-spinner" aria-hidden="true" />}
          {isSubmitting ? (isRegister ? 'Creating account...' : 'Signing in...') : isRegister ? 'Register' : 'Login'}
        </button>
        {isRegister && <button type="button" className="auth-secondary-btn" onClick={() => { window.location.hash = '#/login' }}>Back to sign in</button>}
      </form>}

      {message && !resetComplete && <p className="auth-message" role="status">{message}</p>}

      {!forgotMode && <p className="switch-page">{isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}<a href={isRegister ? '#/login' : '#/register'} onClick={(event) => { event.preventDefault(); switchMode(isRegister ? 'login' : 'register') }}>{isRegister ? 'Login' : 'Create Account'}</a></p>}
    </div>
  </div>
}
