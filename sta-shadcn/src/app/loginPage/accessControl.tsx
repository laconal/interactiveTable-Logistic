// utils/withAccessControl.tsx

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function withAccessControl(Component: React.FC, allowedUsernames: string[]) {
  return function ProtectedComponent(props: any) {
    const router = useRouter()

    useEffect(() => {
      const user = localStorage.getItem("userInfo")
      if (user) {
        const parsedUser = JSON.parse(user)
        if (!allowedUsernames.includes(parsedUser.username)) {
          router.push("/unauthorized") // redirect to error/403 page
        }
      } else {
        router.push("/loginPage")
      }
    }, [])

    return <Component {...props} />
  }
}
