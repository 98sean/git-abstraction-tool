// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('renderer harness', () => {
  it('renders JSX in jsdom', () => {
    const { container } = render(<div>integration harness ready</div>)
    expect(container.textContent).toBe('integration harness ready')
  })
})
