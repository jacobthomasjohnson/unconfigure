'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

export default function DateSelector({ selectedDate, setSelectedDate, minDate, maxDate }) {
      const [open, setOpen] = useState(false)

      const handleDayClick = (day) => {
            setSelectedDate(day.toISOString().split('T')[0])
            setOpen(false)
      }

      return (
            <div className="relative">
                  <button
                        onClick={() => setOpen(!open)}
                        className="w-full p-2 bg-neutral-800 text-neutral-100 border border-neutral-600 rounded text-left"
                  >
                        {selectedDate ? selectedDate : 'Pick a date'}
                  </button>

                  {open && (
                        <div className="absolute top-full left-0 z-10 bg-neutral-900 p-2 mt-2 rounded border border-neutral-600 shadow-lg">
                              <DayPicker
                                    mode="single"
                                    numberOfMonths={1}
                                    selected={selectedDate ? new Date(selectedDate) : undefined}
                                    onDayClick={handleDayClick}
                                    disabled={[
                                          {
                                                before: new Date(minDate),
                                                after: new Date(maxDate),
                                          },
                                    ]}
                                    captionLayout="dropdown"
                                    classNames={{
                                          caption: 'text-neutral-200',
                                          day: 'text-neutral-100',
                                          selected: 'bg-blue-200 text-neutral-900',
                                          today: 'bg-green-800 rounded-md text-white',
                                          disabled: 'text-neutral-500',
                                          outside: 'text-neutral-500',
                                          head: 'text-neutral-300',
                                          head_row: 'flex justify-between',
                                          head_cell: 'text-neutral-300 font-semibold',
                                          nav_button: 'text-neutral-300 hover:text-white',
                                          nav_button_disabled: 'text-neutral-500',
                                          nav_button: 'text-neutral-300 hover:bg-neutral-700 rounded p-1',
                                          nav_icon: 'w-2 h-2', // size of the arrow SVGs
                                    }}
                              />
                        </div>
                  )}
            </div>
      )
}
