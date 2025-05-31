"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import authService from "./auth";
import { useState } from "react"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z.string().min(1, {
    message: "Password is required"
  })
})


export default function ProfileForm() {
  const [passwordErr, setPasswordErr] = useState("")
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    },
  })


  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        const {username, password} = values
        const data = await authService.login(username, password);
        window.location.href = "/"
    } catch (err) {
      setPasswordErr("Incorrect credentials")
      console.error("Login failed", err)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 w-full max-w-sm">
        <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input type="text" id="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" id="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {passwordErr !== "" && <p>{passwordErr}</p>}
            <Button type="submit">Submit</Button>
        </form>
        </Form>
    </div>
  )
}
