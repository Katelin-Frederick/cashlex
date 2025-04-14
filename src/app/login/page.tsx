import React from 'react'
import Link from "next/link";
import Login from './Login';

const page = () => {
  return (
    <div>
      <h1 className='text-2xl font-bold'>Login</h1>

      <ul>
        <li className='text-blue-800 underline'><Link href='/'>Home</Link></li>
        <li className='text-blue-800 underline'><Link href='/register'>Register</Link></li>
        <li className='text-blue-800 underline'><Link href='/dashboard'>Dashboard</Link></li>
      </ul>

      <Login />
    </div>
  )
}

export default page