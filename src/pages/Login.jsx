import React, { useRef, useState } from "react";
import { getOAuthUrl, loginWithApi, resetPasswordWithApi, setSession } from '../utils/auth'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget)
    try {
      const { user, token } = await loginWithApi(form.get('email'), form.get('password'))
      setSession(user, token)
      setMessage('')
      formRef.current?.reset()
      setFormVersion((version) => version + 1)
      setShowPassword(false)
      window.location.hash = user.role === 'admin' ? '#/admin' : '#/home'
    } catch (error) {
      setMessage(error.message)
      return
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = getOAuthUrl('google')
  };

  const handleFacebookLogin = () => {
    window.location.href = getOAuthUrl('facebook')
  };

  const handleResetPassword = async (event) => {
    event.preventDefault()
    const email = resetEmail.trim().toLowerCase()
    const form = new FormData(event.currentTarget)
    try {
      await resetPasswordWithApi(email, form.get('newPassword'))
      setMessage('Password updated successfully. You can now sign in.')
    } catch (error) {
      setMessage(error.message)
      return
    }
    setForgotMode(false)
    setResetEmail('')
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome Back</h2>
        <p>Login to your AgroMart account</p>

        {forgotMode ? <form onSubmit={handleResetPassword} className="forgot-password-form" autoComplete="off">
          <p className="auth-form-note">Enter your registered email and choose a new password.</p>
          <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} placeholder="Email Address" required />
          <input type="password" name="newPassword" placeholder="New password" minLength="6" required />
          <button type="submit" className="auth-btn">Update password</button>
          <button type="button" className="auth-secondary-btn" onClick={() => { setForgotMode(false); setMessage('') }}>Back to sign in</button>
        </form> : <form key={formVersion} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
          <input
            type="email"
            name="email" placeholder="Email Address" autoComplete="off"
            required
          />

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              name="password" placeholder="Password" autoComplete="new-password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="auth-options">
            <label>
              <input type="checkbox" />
              Remember me
            </label>

            <button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setMessage('') }}>Forgot password?</button>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>}
        {message && <p className="auth-message">{message}</p>}

        {!forgotMode && <><div className="divider">
          <span>OR</span>
        </div>

        <div className="auth-social-grid">
          <button type="button" className="social-btn google-btn" onClick={handleGoogleLogin}><strong>G</strong> Continue with Google</button>
          <button type="button" className="social-btn facebook-btn" onClick={handleFacebookLogin}><strong>f</strong> Continue with Facebook</button>
        </div>

        <p className="switch-page">
          Don't have an account?{" "}
          <a href="#/register">Create Account</a>
        </p></>}
      </div>
    </div>
  );
}