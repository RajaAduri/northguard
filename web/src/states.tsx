import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import { StatesHarness } from './harness/StatesHarness'

// The state-harness entry point (dev only). Renders every §1.1 composer state + the
// management surfaces so Playwright can capture one screenshot per [data-screenshot] node.
// German is the design case (Handoff §0).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StatesHarness locale="de" />
  </StrictMode>,
)
