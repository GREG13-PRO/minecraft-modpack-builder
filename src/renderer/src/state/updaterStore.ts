import { create } from 'zustand'
import type { UpdaterStatus } from '@shared/types'

interface UpdaterState {
  status: UpdaterStatus
  version: string | null
  setStatus: (status: UpdaterStatus) => void
  setVersion: (version: string) => void
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  status: { state: 'idle' },
  version: null,
  setStatus: (status) => set({ status }),
  setVersion: (version) => set({ version })
}))
