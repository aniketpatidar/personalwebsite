'use client'

import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const workerUrl = process.env.NEXT_PUBLIC_AUTH_WORKER_URL
      
      const res = await fetch(`${workerUrl}/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          site: window.location.host,
        }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch (err) {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="container py-28 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a sign-in link to <strong className="text-foreground">{email}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-28 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign in to the CMS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email address to receive a sign-in link.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="relative block w-full rounded-md border py-1.5 text-foreground bg-transparent border-border placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm sm:leading-6 px-3"
              placeholder="claire@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send sign-in link'}
            </button>
          </div>

          {status === 'error' && (
            <p className="text-center text-sm text-error">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}
