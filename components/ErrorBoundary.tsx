'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onReset: () => void
}

interface State {
  failed: boolean
}

/**
 * Nobody is in the room to fix a frozen screen, so an unhandled render error
 * shows a calm line and puts the board back after 5 seconds — never a stack
 * trace in front of the whole company.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }
  private timer: ReturnType<typeof setTimeout> | null = null

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidUpdate(_prev: Props, prevState: State) {
    if (!prevState.failed && this.state.failed) {
      this.timer = setTimeout(() => {
        this.setState({ failed: false })
        this.props.onReset()
      }, 5000)
    }
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer)
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex h-full w-full items-center justify-center p-8 text-center">
          <p className="display" style={{ fontSize: 'var(--step-title)', fontWeight: 400, maxWidth: '20ch' }}>
            One moment — back to the board.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
