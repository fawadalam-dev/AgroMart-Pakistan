import React, { useState } from "react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    window.location.hash = '#/';
  };

  const handleGoogleLogin = () => {
    window.location.hash = '#/';
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome Back</h2>
        <p>Login to your AgroMart account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
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