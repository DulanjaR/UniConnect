import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Register() {
  const [step, setStep] = useState('request-otp'); // request-otp, verify-otp
  const [formData, setFormData] = useState({
    itNumber: '',
    email: '',
    name: '',
    university: 'malabe',
    academicYear: '1',
    semester: '1',
    intake: 'regular'
  });
  const [passwordData, setPasswordData] = useState({
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Normalize IT number to uppercase
    const normalizedValue = name === 'itNumber' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: normalizedValue }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate IT Number format (case-insensitive)
    const itPattern = /^IT\d{8}$/i;
    if (!itPattern.test(formData.itNumber)) {
      setError('Invalid IT Number format. Use format: IT23227736');
      return;
    }

    // Validate email matches IT number
    const expectedEmail = `${formData.itNumber}@my.sliit.lk`;
    if (formData.email.toLowerCase() !== expectedEmail.toLowerCase()) {
      setError(`Email must be: ${expectedEmail}`);
      return;
    }

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/request-otp`, {
        itNumber: formData.itNumber,
        email: formData.email,
        name: formData.name,
        university: formData.university,
        academicYear: formData.academicYear,
        semester: formData.semester,
        intake: formData.intake
      });

      setSuccess(response.data.message);
      setStep('verify-otp');
      setOtpTimer(600); // 10 minutes
      
      // Start countdown timer
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.otp) {
      setError('OTP is required');
      return;
    }

    if (!passwordData.password) {
      setError('Password is required');
      return;
    }

    if (passwordData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, {
        email: formData.email,
        otp: passwordData.otp,
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword
      });

      setSuccess('Registration completed! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/resend-otp`, {
        email: formData.email
      });

      setSuccess(response.data.message);
      setOtpTimer(600);

      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-vibrant">
      <div className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
          {/* Left Side - Image */}
          <div className="hidden md:flex items-center justify-center overflow-hidden">
            <img 
              src="/images/regpage.png" 
              alt="UniConnect" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center px-4 py-8 overflow-y-auto">
            <div className="w-full max-w-md">
              <h1 className="section-title-accent text-center mb-2">Join UniConnect</h1>
              <p className="text-center text-gray-600 mb-6">Create your account</p>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              {step === 'request-otp' ? (
                // Step 1: Request OTP
                <form onSubmit={requestOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">IT Number *</label>
              <input
                type="text"
                name="itNumber"
                value={formData.itNumber}
                onChange={handleChange}
                placeholder="e.g., IT23227736"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: IT followed by 8 digits</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SLIIT Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={formData.itNumber ? `${formData.itNumber}@my.sliit.lk` : 'IT23227736@my.sliit.lk'}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must match your IT Number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Dulanja Tharaka"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">University Branch *</label>
              <select
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="malabe">MALABE - CAMPUS</option>
                <option value="metro">METRO - CAMPUS</option>
                <option value="jaffna">NORTHERN UNI - JAFFNA</option>
                <option value="colombo">SLIIT CITY UNI</option>
                <option value="kandy">SLIIT KANDY UNI</option>
                <option value="matara">MATARA - CENTER</option>
                <option value="kurunagala">KURUNAGALA - CENTER</option>
                <option value="curtin">SLIIT INTERNATIONAL (CURTIN COLOMBO)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Year *</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Intake Type *</label>
              <select
                name="intake"
                value={formData.intake}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Sending OTP...' : 'Send OTP to Email'}
            </button>
              </form>
              ) : (
                // Step 2: Verify OTP and Set Password
                <form onSubmit={verifyAndRegister} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                    <p className="text-sm text-blue-800">
                      An OTP has been sent to <strong>{formData.email}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Enter OTP *
                      {otpTimer > 0 && (
                        <span className="text-gray-500 text-xs ml-2">
                          Expires in {formatTime(otpTimer)}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      name="otp"
                      value={passwordData.otp}
                      onChange={handlePasswordChange}
                      placeholder="6-digit OTP"
                      maxLength="6"
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={passwordData.password}
                      onChange={handlePasswordChange}
                      placeholder="Minimum 6 characters"
                      className="input-field pr-24"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 mr-3 flex items-center text-sm font-medium text-primary-teal hover:text-primary-dark"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Use a strong password with mix of letters and numbers</p>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">Confirm Password *</label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm your password"
                      className="input-field pr-24"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 mr-3 flex items-center text-sm font-medium text-primary-teal hover:text-primary-dark"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

            <button
              type="submit"
              disabled={loading || otpTimer === 0}
              className="btn-primary w-full"
            >
                    {loading ? 'Completing Registration...' : 'Complete Registration'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('request-otp')}
                    className="btn-outline w-full"
                  >
                    Back to Step 1
                  </button>

                  {otpTimer > 0 && otpTimer < 120 && (
                    <p className="text-center text-sm text-gray-600">
                      Didn't receive OTP?{' '}
                      <button
                        type="button"
                        onClick={resendOTP}
                        disabled={loading}
                        className="text-primary-blue font-semibold hover:underline"
                      >
                                Resend OTP
                      </button>
                    </p>
                  )}
                </form>
              )}

              <p className="text-center mt-6 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-accent-orange font-semibold hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
