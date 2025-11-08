"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("sales")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  // Password validation rules
  const minLength = 8
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const lengthOk = password.length >= minLength
  const strengthScore = [lengthOk, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  const strengthPercent = Math.round((strengthScore / 5) * 100)
  const strengthLabel = strengthPercent < 40 ? 'Weak' : strengthPercent < 80 ? 'Medium' : 'Strong'
  const isPasswordValid = strengthScore >= 4 && lengthOk

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.error || "Registration failed")
        setLoading(false)
        return
      }
      // Try to auto-login the user after successful registration
      try {
        const loginRes = await fetch("http://localhost:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })
        const loginData = await loginRes.json()
        if (loginRes.ok && loginData.access_token) {
          // store token in localStorage for now (dev). For production, use httpOnly cookies.
          localStorage.setItem("bp_token", loginData.access_token)
          router.push("/")
          return
        }
        // if login failed, show success and send to login page
        setSuccess("Account created — please sign in")
        setLoading(false)
        setTimeout(() => router.push("/login"), 900)
      } catch (err) {
        // auto-login attempt failed; fall back to redirecting to login
        setSuccess("Account created — please sign in")
        setLoading(false)
        setTimeout(() => router.push("/login"), 900)
      }
    } catch (err: any) {
      setError(err.message || "Network error")
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4">
        <div className="max-w-[480px] w-full">
          <a href="#" className="block">
            <img src="https://readymadeui.com/readymadeui.svg" alt="logo" className="w-40 mb-8 mx-auto block" />
          </a>

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <h1 className="text-slate-900 text-center text-3xl font-semibold">Create account</h1>
            <form onSubmit={submit} className="mt-12 space-y-6">
              {error && <div className="text-red-500">{error}</div>}
              {success && <div className="text-green-600">{success}</div>}

              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">User name</label>
                <div className="relative flex items-center">
                  <input
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600"
                    placeholder="Enter user name"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-900 text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type="password"
                    required
                    aria-describedby="password-requirements"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 pr-8 rounded-md outline-blue-600"
                    placeholder="Enter password"
                  />

                  {/* strength bar */}
                  <div className="mt-2">
                    <div className="w-full bg-slate-100 rounded h-2">
                      <div
                        className={`h-2 rounded ${strengthPercent < 40 ? 'bg-red-500' : strengthPercent < 80 ? 'bg-yellow-400' : 'bg-green-500'}`}
                        style={{ width: `${strengthPercent}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Strength: <span className="font-medium">{strengthLabel}</span></div>
                  </div>

                  {/* checklist */}
                  <ul id="password-requirements" className="mt-3 grid grid-cols-1 gap-1 text-xs">
                    <li className={`${lengthOk ? 'text-green-600' : 'text-slate-500'}`}>• At least {minLength} characters</li>
                    <li className={`${hasLower ? 'text-green-600' : 'text-slate-500'}`}>• Lowercase letter</li>
                    <li className={`${hasUpper ? 'text-green-600' : 'text-slate-500'}`}>• Uppercase letter</li>
                    <li className={`${hasNumber ? 'text-green-600' : 'text-slate-500'}`}>• Number</li>
                    <li className={`${hasSpecial ? 'text-green-600' : 'text-slate-500'}`}>• Special character (e.g. !@#$%)</li>
                  </ul>
                </div>
              </div>

              <div className="mb-2">
                <label className="text-slate-900 text-sm font-medium mb-2 block">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full text-slate-900 text-sm border border-slate-300 px-4 py-3 rounded-md">
                  <option value="sales">Sales</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div className="!mt-12">
                <button
                  type="submit"
                  disabled={loading || !isPasswordValid}
                  className={`w-full py-2 px-4 text-[15px] font-medium tracking-wide rounded-md text-white ${loading || !isPasswordValid ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none`}
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>
                {!isPasswordValid && (
                  <div className="mt-2 text-xs text-red-600">Password must meet at least 4 of 5 rules and be at least {minLength} characters.</div>
                )}
              </div>

              <p className="text-slate-900 text-sm !mt-6 text-center">Already have an account? <a href="/login" className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold">Sign in</a></p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
