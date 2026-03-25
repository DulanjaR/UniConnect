import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    academicYear: '1',
    semester: '1'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      university: formData.university,
      academicYear: Number.parseInt(formData.academicYear, 10),
      semester: Number.parseInt(formData.semester, 10)
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="card space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="section-title">Create Account</h1>
          <p className="text-gray-600">Register as a UniConnect user to create and manage groups.</p>
        </div>

        {error && <div className="rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Full Name</label>
            <input className="input-field" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              className="input-field"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">University</label>
            <input className="input-field" name="university" value={formData.university} onChange={handleChange} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Academic Year</label>
            <select className="input-field" name="academicYear" value={formData.academicYear} onChange={handleChange}>
              {[1, 2, 3, 4].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Semester</label>
            <select className="input-field" name="semester" value={formData.semester} onChange={handleChange}>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              className="input-field"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Confirm Password</label>
            <input
              className="input-field"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary-teal hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
