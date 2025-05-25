'use client'

import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { ListOrderedIcon } from 'lucide-react'

export default function HelpPage () {
  return (
    <>
      <Header />
      <div className='px-3'>
        <div className='flex flex-col items-center'>
          {/* <div className='flex items-center justify-center w-[60px] h-[60px] rounded-full border-2 border-neutral-500'>
            1
          </div> */}

          <div className='border-2 my-8 rounded-full overflow-hidden'>
            <Image
              src='/help-grab.png'
              width={200}
              height={200}
              alt={`Image of cursor grabbing`}
            />
          </div>
          <div className='flex gap-2'>
            <span>
              Grab the <strong className='text-blue-100'>drag handles</strong>{' '}
              next to inventions to place them in the order you believe they
              were invented, from earliest to latest.
            </span>
          </div>
          <div className='border-2 my-8 rounded-full overflow-hidden'>
            <Image
              src='/help-submit.png'
              width={200}
              height={200}
              alt={`Image of submitting`}
            />
          </div>
          <div className='flex gap-2'>
            <span>
              Grab the <strong className='text-blue-100'>drag handles</strong>{' '}
              next to inventions to place them in the order you believe they
              were invented, from earliest to latest:
            </span>
          </div>
          <Link
            className='fixed bottom-0 left-0 p-6 border w-full text-center rounded-t-md border-x-0'
            href='/'
          >
            Got it! Bring me back to the game
          </Link>
        </div>
      </div>
    </>
  )
}
