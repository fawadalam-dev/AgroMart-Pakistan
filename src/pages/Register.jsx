import React, { useState } from "react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    window.location.hash = '#/';
  };

  const handleGoogleRegister = () => {
    window.location.hash = '#/';
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p>Join AgroMart today</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            required
          />

          <input
            type="tel"
            placeholder="Phone Number"
            required
          />

          <div className="password-box">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
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

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleRegister}>
          Continue with Google
        </button>

        <p className="switch-page">
          Already have an account?{" "}
          <a href="#/login">Login</a>
        </p>
      </div>
    </div>
  );
}