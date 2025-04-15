'use client'

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Button } from "~/components/ui/button";

const Dashboard = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      console.log('session dashboard:', session)
    }
  }, [session])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div>
      {session ? (
        <>
          <Button onClick={handleSignOut}>Sign out</Button>
          <p>Welcome, {session.user?.name}!</p>
        </>
      ) : (
        <p>You are not logged in. Please log in to view the dashboard.</p>
      )}
    </div>
  );
};

export default Dashboard;
