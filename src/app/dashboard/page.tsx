import React from 'react'
import Link from "next/link";

const page = () => {
  return (
    <div>
      <h1 className='text-2xl font-bold'>Dashboard</h1>

      <ul>
        <li className='text-blue-800 underline'><Link href='/'>Home</Link></li>
        <li className='text-blue-800 underline'><Link href='/register'>Register</Link></li>
        <li className='text-blue-800 underline'><Link href='/login'>Login</Link></li>
      </ul>
    </div>
  )
}

export default page