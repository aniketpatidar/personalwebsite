import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')

  if (token) {
    redirect('/admin')
  }

  return <LoginForm />
}
