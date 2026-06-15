import { useEffect } from 'react'
import { BRANDING } from '@/constants/branding'

export function useDocumentTitle(title: string = BRANDING.documentTitle) {
  useEffect(() => {
    document.title = title
  }, [title])
}
