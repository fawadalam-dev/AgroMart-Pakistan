import React, { useRef, useState } from "react";
import { getUsers, saveUsers } from '../utils/auth'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [formVersion, setFormVersion] = useState(0);
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget)
    const email = form.get('email').toLowerCase().trim()
    const users = getUsers()
    if (users.some((user) => user.email === email)) {
      setMessage('This email is already registered.')
      return
    }
    saveUsers([...users, {
      id: `customer-${Date.now()}`,
      name: form.get('name').trim(), email, password: form.get('password'), phone: form.get('phone'),
      role: 'customer', status: 'approved'
    }])
    setMessage('Account created successfully. You can now login.')
    formRef.current?.reset()
    setFormVersion((version) => version + 1)
    setShowPassword(false)
  };

  const handleGoogleRegister = () => {
    setMessage('Google registration is not connected in this local demo. Please use the form.')
  };

  const handleFacebookRegister = () => {
    setMessage('Facebook registration is not connected in this local demo. Please use the form.')
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p>Join AgroMart today</p>
        <form key={formVersion} ref={formRef} onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            name="name" placeholder="Full Name" autoComplete="off"
            required
          />

          <input
            type="email"
            name="email" placeholder="Email Address" autoComplete="off"
            required
          />

          <input
            type="tel"
            name="phone" placeholder="Phone Number" autoComplete="off"
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

          <div className="terms">
            <label>
              <input type="checkbox" required />
              I agree to the Terms & Conditions
            </label>
          </div>

          <button type="submit" className="auth-btn">
            Register
          </button>
        </form>
        {message && <p className="auth-message">{message}</p>}

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="auth-social-grid">
          <button type="button" className="social-btn google-btn" onClick={handleGoogleRegister}><strong>G</strong> Continue with Google</button>
          <button type="button" className="social-btn facebook-btn" onClick={handleFacebookRegister}><strong>f</strong> Continue with Facebook</button>
        </div>

        <p className="switch-page">
          Already have an account?{" "}
          <a href="#/login">Login</a>
        </p>
      </div>
    </div>
  );
}