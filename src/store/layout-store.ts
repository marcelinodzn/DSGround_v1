import { create } from 'zustand'

interface LayoutState {
  isFullscreen: boolean
  setIsFullscreen: (isFullscreen: boolean) => void
}

export const useLayout = create<LayoutState>((set) => ({
  isFullscreen: false,
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
}))
