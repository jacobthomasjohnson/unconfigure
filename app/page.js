'use client'

import { Suspense } from 'react'
import GamePage from './GamePage'

export default function Page () {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePage />
    </Suspense>
  )
}
