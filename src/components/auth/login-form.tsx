"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [logs, setLogs] = React.useState<string[]>([])

  // Function to add logs
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`])
    console.log(message)
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    addLog(`Starting sign in process for ${values.email}`)

    try {
      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      addLog("Authentication successful")
      
      // Set a mock auth token
      document.cookie = "auth-token=mock-token; path=/"
      addLog("Auth token set")

      toast.success("Signed in successfully")
      addLog("Success toast shown")

      // Small delay before navigation
      await new Promise((resolve) => setTimeout(resolve, 500))
      addLog("Attempting navigation to home page")

      // Use replace instead of push to avoid history issues
      router.replace("/")
      addLog("Navigation completed")
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      addLog(`Error: ${errorMessage}`)
      
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
      addLog("Sign in process completed")
    }
  }

  // Display logs in UI during development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Logs:', logs.join('\n'))
    }
  }, [logs])

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="name@example.com" 
                    {...field} 
                    type="email"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button 
            className="w-full" 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      {/* Debug Logs (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-muted rounded-lg text-sm font-mono">
          <h3 className="font-semibold mb-2">Debug Logs:</h3>
          <pre className="whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
} 