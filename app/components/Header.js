'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store/store'

export default function Header () {
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen)
  }

  useEffect(() => {
    if (headerRef.current) {
      const element = headerRef.current
      const styles = getComputedStyle(element)
      const marginTop = parseFloat(styles.marginTop)
      const marginBottom = parseFloat(styles.marginBottom)
      const totalHeight =
        element.getBoundingClientRect().height + marginTop + marginBottom
      setHeaderHeight(totalHeight)
    }
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className='fixed top-0 left-1/2 -translate-x-1/2 flex flex-col justify-center items-start w-full max-w-md mx-auto py-4 px-4 md:px-0'
        style={{
          backgroundImage: `linear-gradient(to bottom, #161616 0%, #161616 70%, rgba(16,16,16,0) 100%)`
        }}
      >
        <h1 className='text-3xl tracking-tight font-black flex items-center justify-between w-full'>
          UNCONFIGURE
          <span className='text-neutral-500 font-medium text-xs ml-2'>{today}</span>
        </h1>
      </header>
      <div style={{ height: headerHeight + 'px' }} />
    </>
  )
}
