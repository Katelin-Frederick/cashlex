'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Dashboard = () => {
  const { data: session, status } = useSession(); // Retrieves session data
  const router = useRouter();

  // Check the session status and redirect if user is not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      console.log('session dashboard:', session)
    }
  }, [session]);

  if (status === "loading") {
    // You can show a loading spinner or placeholder until session is checked
    return <div>Loading...</div>;
  }

  return (
    <div>
      {session ? (
        <p>Welcome, {session.user?.name}!</p>
      ) : (
        <p>You are not logged in. Please log in to view the dashboard.</p>
      )}
    </div>
  );
};

export default Dashboard;
