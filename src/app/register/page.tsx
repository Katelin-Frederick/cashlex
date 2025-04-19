import Link from 'next/link'
import React from 'react'

import Register from './Register'

const page = () => (
  <div>
    <h1 className='text-2xl font-bold'>Register</h1>

    <ul>
      <li className='text-blue-800 underline'><Link href='/'>Home</Link></li>
      <li className='text-blue-800 underline'><Link href='/login'>Login</Link></li>
      <li className='text-blue-800 underline'><Link href='/dashboard'>Dashboard</Link></li>
    </ul>

    <Register />
  </div>
)

export default page