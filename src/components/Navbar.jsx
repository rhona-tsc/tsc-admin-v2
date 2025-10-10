import React from 'react'
import {assets} from '../assets/assets'

const Navbar = ({ onLogout}) => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between bg-white'>
        <img className='w-[max(30%,80px)]' src={assets.logo} alt="" />
        <button onClick={onLogout} className='bg-black text-white hover:bg-[#ff6667] px-5 py-2 sm:px-7 sm:py-2 text-xs sm:text-sm'>Logout</button>
    </div>
  )
}

export default Navbar