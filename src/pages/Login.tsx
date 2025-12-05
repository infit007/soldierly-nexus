import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/context/AuthContext'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, LogIn, AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'

const schema = z.object({
  usernameOrEmail: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<z.infer<typeof schema>>({ 
    resolver: zodResolver(schema), 
    defaultValues: { usernameOrEmail: '', password: '' } 
  })
  const from = location.state?.from?.pathname as string | undefined

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await login(values.usernameOrEmail, values.password)
      
      if (result.success && result.user) {
        // After login, redirect by role or to intended page
        if (from) return navigate(from, { replace: true })
        if (result.user.role === 'ADMIN') navigate('/admin-dashboard')
        else navigate('/')
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField name="usernameOrEmail" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                No account? <Link to="/signup" className="text-primary">Sign up</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
