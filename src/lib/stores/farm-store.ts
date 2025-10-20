import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FarmStore {
  currentFarmId: string | null
  setCurrentFarmId: (id: string | null) => void
}

export const useFarmStore = create<FarmStore>()(
  persist(
    (set) => ({
      currentFarmId: null,
      setCurrentFarmId: (id) => set({ currentFarmId: id }),
    }),
    {
      name: 'farm-store',
    }
  )
)