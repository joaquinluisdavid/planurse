import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DemoSessionProvider } from '@/demo/DemoSessionProvider'
import { DemoGate } from '@/components/DemoGate'
import { AppLayout } from '@/components/AppLayout'
import { DemoEntryPage } from '@/pages/DemoEntryPage'
import { UpcomingPage } from '@/pages/UpcomingPage'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceProvider } from '@/data/WorkspaceProvider'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ShiftsPage = lazy(() => import('@/pages/ShiftsPage'))
const NewShiftPage = lazy(() => import('@/pages/NewShiftPage'))
const ShiftPage = lazy(() => import('@/pages/ShiftPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const HandoffSamplesPage = lazy(() => import('@/pages/HandoffSamplesPage'))
const ReflectionSamplesPage = lazy(
  () => import('@/pages/ReflectionSamplesPage'),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DemoEntryPage />} />
      <Route path="/login" element={<DemoEntryPage mode="login" />} />
      <Route path="/signup" element={<DemoEntryPage mode="signup" />} />
      <Route path="/onboarding" element={<DemoEntryPage mode="onboarding" />} />
      <Route element={<DemoGate />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/shifts/new" element={<NewShiftPage />} />
          <Route path="/shifts/:shiftId" element={<ShiftPage />} />
          <Route path="/handoffs" element={<HandoffSamplesPage />} />
          <Route
            path="/handoffs/new"
            element={
              <UpcomingPage
                title="Create a handoff"
                description="The SBAR editor arrives in stage 7."
              />
            }
          />
          <Route path="/reflections" element={<ReflectionSamplesPage />} />
          <Route
            path="/learning-notes"
            element={
              <UpcomingPage
                title="Learning notes"
                description="General topics and questions for your preceptor. No clinical answers are generated."
              />
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <UpcomingPage
            title="Page not found"
            description="This address is not part of your workspace."
          />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoSessionProvider>
        <WorkspaceProvider>
          <AppRoutes />
          <Toaster richColors position="bottom-right" />
        </WorkspaceProvider>
      </DemoSessionProvider>
    </BrowserRouter>
  )
}
