import { useRef } from 'react'

// Controlled dialogs without DialogTrigger need an explicit focus return target.
export function useDialogFocus() {
  const opener = useRef<HTMLElement | null>(null)
  function rememberFocus() {
    opener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
  }
  function restoreFocus(event: Event) {
    event.preventDefault()
    const target = opener.current?.isConnected
      ? opener.current
      : document.getElementById('main-content')
    target?.focus()
  }
  return { rememberFocus, restoreFocus }
}
