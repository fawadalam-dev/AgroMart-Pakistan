import React, { useRef, useState } from "react";
import { ensureAdmin, getUsers, setSession } from '../utils/auth'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    ensureAdmin()
    const form = new FormData(event.currentTarget)
    const user = getUsers().find((item) => item.email === form.get('email').toLowerCase().trim() && item.password === form.get('password'))
    if (!user) { setMessage('Email or password is incorrect.'); return }
    if (user.role === 'vendor' && user.status !== 'approved') { setMessage('Your vendor account is waiting for admin approval.'); return }
    setSession(user)
    formRef.current?.reset()
    setFormVersion((version) => version + 1)
    setShowPassword(false)
    window.location.hash = user.role === 'admin' ? '#/admin' : user.role === 'vendor' ? '#/vendor' : '#/home'
  };

  const handleGoogleLogin = () => {
    setMessage('Google login is not connected in this local demo. Please use email and password.')
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome Back</h2>
        <p>Login to your AgroMart account</p>

        <form key={formVersion} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
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

            <a href="mailto:support@agromart.pk">Forgot Password?</a>
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="switch-page">
          Don't have an account?{" "}
          <a href="#/register">Create Account</a>
        </p>
      </div>
    </div>
  );
}