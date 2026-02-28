import { BrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'

/**
 * App — thin root that wraps the router around the Layout shell.
 * All state (theme, sidebar, notifications, routes) lives in Layout.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
