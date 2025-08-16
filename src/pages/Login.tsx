import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'

const schema = z.object({
  usernameOrEmail: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { usernameOrEmail: '', password: '' } })
  const from = location.state?.from?.pathname as string | undefined

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const loggedIn = await login(values.usernameOrEmail, values.password)
    // After login, redirect by role or to intended page
    if (from) return navigate(from, { replace: true })
    if (loggedIn.role === 'ADMIN') navigate('/admin-dashboard')
    else navigate('/')
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="usernameOrEmail" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
              <p className="text-sm text-muted-foreground text-center">No account? <Link to="/signup" className="text-primary">Sign up</Link></p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
