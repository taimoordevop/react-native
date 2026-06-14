"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CarouselItem {
  id: number
  title: string
  description: string
  image: string
  color: string
}

interface Carousel3DProps {
  items: CarouselItem[]
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function Carousel3D({ items, autoPlay = true, autoPlayInterval = 3000 }: Carousel3DProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleNext = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % items.length)
    setProgress(0)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isAnimating, items.length])

  const handlePrev = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
    setProgress(0)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isAnimating, items.length])

  const handleDotClick = useCallback(
    (index: number) => {
      if (isAnimating || index === currentIndex) return
      setIsAnimating(true)
      setCurrentIndex(index)
      setProgress(0)
      setTimeout(() => setIsAnimating(false), 800)
    },
    [isAnimating, currentIndex],
  )

  // Auto-play with progress
  useEffect(() => {
    if (!autoPlay || isPaused) return

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0
        }
        return prev + 100 / (autoPlayInterval / 50)
      })
    }, 50)

    const autoInterval = setInterval(() => {
      handleNext()
    }, autoPlayInterval)

    return () => {
      clearInterval(progressInterval)
      clearInterval(autoInterval)
    }
  }, [currentIndex, autoPlay, autoPlayInterval, isPaused, handleNext])

  // Reset progress when manually changing slides
  useEffect(() => {
    setProgress(0)
  }, [currentIndex])

  return (
    <div
      className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Container */}
      <div className="relative w-full h-full perspective-1000">
        <div className="relative w-full h-full preserve-3d">
          {items.map((item, index) => {
            const offset = index - currentIndex
            const absOffset = Math.abs(offset)

            // Calculate position for infinite loop
            let adjustedOffset = offset
            if (offset > items.length / 2) {
              adjustedOffset = offset - items.length
            } else if (offset < -items.length / 2) {
              adjustedOffset = offset + items.length
            }

            let transform = ""
            let zIndex = 0
            let opacity = 0
            let blur = 0

            if (adjustedOffset === 0) {
              // Center card
              transform = "translateX(0) translateZ(0) rotateY(0deg) scale(1)"
              zIndex = 10
              opacity = 1
              blur = 0
            } else if (adjustedOffset === 1 || adjustedOffset === -(items.length - 1)) {
              // Right card
              transform = "translateX(50%) translateZ(-150px) rotateY(-35deg) scale(0.85)"
              zIndex = 8
              opacity = 0.8
              blur = 1
            } else if (adjustedOffset === -1 || adjustedOffset === items.length - 1) {
              // Left card
              transform = "translateX(-50%) translateZ(-150px) rotateY(35deg) scale(0.85)"
              zIndex = 8
              opacity = 0.8
              blur = 1
            } else if (absOffset === 2) {
              // Far cards
              transform = `translateX(${adjustedOffset > 0 ? "90%" : "-90%"}) translateZ(-300px) rotateY(${adjustedOffset > 0 ? "-55deg" : "55deg"}) scale(0.7)`
              zIndex = 5
              opacity = 0.5
              blur = 2
            } else {
              // Very far cards
              transform = `translateX(${adjustedOffset > 0 ? "130%" : "-130%"}) translateZ(-450px) rotateY(${adjustedOffset > 0 ? "-75deg" : "75deg"}) scale(0.5)`
              zIndex = 2
              opacity = 0.2
              blur = 3
            }

            return (
              <div
                key={item.id}
                className="absolute inset-4 transition-all duration-700 ease-out cursor-pointer"
                style={{
                  transform,
                  zIndex,
                  opacity,
                  filter: `blur(${blur}px)`,
                }}
                onClick={() => adjustedOffset !== 0 && handleDotClick(index)}
              >
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl group">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${item.image})`,
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}60, ${item.color}90, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-white">
                    <div className="space-y-3 md:space-y-4 transform transition-transform duration-300 group-hover:translate-y-[-8px]">
                      <h3 className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-lg">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-lg opacity-90 leading-relaxed max-w-md drop-shadow-md">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  {/* Border Glow */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white border-white/20 hover:border-white/40 transition-all duration-300"
        onClick={handlePrev}
        disabled={isAnimating}
      >
        <ChevronLeft className="w-6 h-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white border-white/20 hover:border-white/40 transition-all duration-300"
        onClick={handleNext}
        disabled={isAnimating}
      >
        <ChevronRight className="w-6 h-6" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white border-white/20 hover:border-white/40 transition-all duration-300"
        onClick={() => setIsPaused(!isPaused)}
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </Button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {items.map((_, index) => (
          <button
            key={index}
            className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70"
            }`}
            onClick={() => handleDotClick(index)}
            disabled={isAnimating}
          >
            {index === currentIndex && (
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                style={{
                  clipPath: `inset(0 ${100 - progress}% 0 0)`,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-100 ease-linear"
          style={{
            width: `${((currentIndex + 1) / items.length) * 100}%`,
          }}
        />
      </div>

      {/* Auto-play Progress Ring on Current Dot */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-3 pointer-events-none">
        {items.map((_, index) => (
          <div key={index} className="w-3 h-3 relative">
            {index === currentIndex && !isPaused && (
              <svg className="absolute inset-0 w-6 h-6 -translate-x-1.5 -translate-y-1.5 rotate-[-90deg]">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset={62.83 - (62.83 * progress) / 100}
                  className="transition-all duration-100 ease-linear"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
