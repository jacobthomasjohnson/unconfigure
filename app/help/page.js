'use client'

import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'

export default function HelpPage () {
  return (
    <>
      <Header />
      <div className='px-3 max-w-md mx-auto'>
        <div className='flex flex-col items-center gap-4'>
          <div className='border-2 my-8 rounded-full overflow-hidden'>
            <Image
              src='/help-grab.png'
              width={200}
              height={200}
              alt={`Image of cursor grabbing`}
            />
          </div>
          <div>
            Your goal is to place the inventions in the correct order, from earliest to most recent.
            <ol className="list-decimal mx-8 flex flex-col gap-4 my-8">
              <li><span className="font-bold">Drag and drop</span> each invention using the handles on the right.</li>
              <li>Once you've arranged them how you think they go, hit <span className="text-blue-200 font-bold">Submit</span>.</li>
              <li>You'll get visual feedback showing which items are in the correct spot.</li>
              <li>You have <span className="font-bold">3 chances</span> to get the full order right.</li>
            </ol>
          </div>
          <Link className='p-6 border w-full text-center rounded-md mb-8' href='/'>
            Got it! Bring me back to the game
          </Link>
        </div>
      </div>
    </>
  )
}
