// AF-207 — Multi-pass extraction convergence at onboarding (US-040). Working set is
// never active (NG-3/NG-22); one convergence run per policy version (NG-6).
export { runExtractionPass } from './runExtractionPass'
export { hasConverged } from './hasConverged'
export { convergeExtraction } from './convergeExtraction'
