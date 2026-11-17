import React, { useEffect, useRef, useState } from 'react'
import { apiRequest } from '../utils/api'
import { loginWithApi, registerWithApi, setSession } from '../utils/auth'

export default function Auth({ initialMode = 'login', resetToken = '' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)
  const formRef = useRef(null)
  const isRegister = mode === 'register'
  const isReset = Boolean(resetToken)

  useEffect(() => {
    setMode(initialMode)
    setForgotMode(false)
    setResetComplete(false)
    setMessage('')
  }, [initialMode, resetToken])

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
    const normalizedEmail = email && !email.includes('@') ? `${email}@gmail.com` : email
    if (emailInput instanceof HTMLInputElement) emailInput.value = normalizedEmail

    setIsSubmitting(true)
    setMessage('')
    try {
      if (forgotMode) {
        const result = await apiRequest('/auth/password-reset/request', {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail })
        })
        setMessage(result.message)
        return
      }

      if (isReset) {
        const password = String(form.get('password') || '')
        if (password !== form.get('confirmPassword')) throw new Error('Passwords do not match.')
        const result = await apiRequest('/auth/password-reset/confirm', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, password })
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
    setResetComplete(false)
    setMode(nextMode)
    window.location.hash = nextMode === 'register' ? '#/register' : '#/login'
  }

  return <div className="auth-container">
    <div className={`auth-box${isRegister ? ' auth-register-box' : ''}`}>
      <h2>{isReset || forgotMode ? 'Reset Password' : isRegister ? 'Create Account' : 'Welcome Back'}</h2>
      <p>{isReset ? 'Choose a new password for your account.' : forgotMode ? 'Enter your account email and we will send a reset link.' : isRegister ? 'One account to shop and manage your farm.' : 'Login to your AgroMart account'}</p>

      {resetComplete ? <div className="forgot-password-form">
        <p className="auth-form-note" role="status">{message}</p>
        <button type="button" className="auth-secondary-btn" onClick={() => { window.location.hash = '#/login' }}>Back to sign in</button>
      </div> : forgotMode ? <form key={`forgot-${formVersion}`} onSubmit={handleSubmit} autoComplete="on">
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
        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Sending link...' : 'Send reset link'}
        </button>
        <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setMessage('') }}>Back to sign in</button>
      </form> : <form key={`${mode}-${formVersion}`} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
        {isRegister && <input type="text" name="name" placeholder="Full Name" autoComplete="name" required />}

        {!isReset && <input
          type="email"
          name="email"
          placeholder="name@gmail.com"
          autoComplete="email"
          onBlur={(event) => {
            const value = event.currentTarget.value.trim()
            if (value && !value.includes('@')) event.currentTarget.value = `${value}@gmail.com`
          }}
          required
        />}

        {isRegister && <input type="tel" name="phone" placeholder="Phone Number" autoComplete="tel" required />}

        <div className="password-box">
          <input type={showPassword ? 'text' : 'password'} name="password" placeholder={isReset ? 'New password' : 'Password'} autoComplete={isReset ? 'new-password' : isRegister ? 'new-password' : 'current-password'} minLength={isReset ? 8 : isRegister ? 6 : undefined} required />
          <button type="button" onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>

        {isReset && <input type="password" name="confirmPassword" placeholder="Confirm new password" autoComplete="new-password" minLength={8} required />}

        {!isRegister && !isReset && <div className="auth-options"><label><input type="checkbox" />Remember me</label><button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setMessage('') }}>Forgot password?</button></div>}
        <button type="submit" className={`auth-btn${isSubmitting ? ' is-loading' : ''}`} disabled={isSubmitting} aria-busy={isSubmitting} onClick={() => setMessage('')}>
          {isSubmitting && <span className="auth-loading-spinner" aria-hidden="true" />}
          {isSubmitting ? (isReset ? 'Updating password...' : isRegister ? 'Creating account...' : 'Signing in...') : (isReset ? 'Update password' : isRegister ? 'Register' : 'Login')}
        </button>
        {(isReset || isRegister) && <button type="button" className="auth-secondary-btn" onClick={() => { window.location.hash = '#/login' }}>Back to sign in</button>}
      </form>}

      {message && !resetComplete && <p className="auth-message" role="status">{message}</p>}

      {!forgotMode && !isReset && <p className="switch-page">{isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}<a href={isRegister ? '#/login' : '#/register'} onClick={(event) => { event.preventDefault(); switchMode(isRegister ? 'login' : 'register') }}>{isRegister ? 'Login' : 'Create Account'}</a></p>}
    </div>
  </div>
}
