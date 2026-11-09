import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { AccountEntryPage } from '@/pages/DemoEntryPage'
import { UpcomingPage } from '@/pages/UpcomingPage'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceProvider } from '@/data/WorkspaceProvider'
import { AuthProvider } from '@/auth/AuthProvider'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ShiftsPage = lazy(() => import('@/pages/ShiftsPage'))
const NewShiftPage = lazy(() => import('@/pages/NewShiftPage'))
const ShiftPage = lazy(() => import('@/pages/ShiftPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const HandoffSamplesPage = lazy(() => import('@/pages/HandoffSamplesPage'))
const ReflectionSamplesPage = lazy(
  () => import('@/pages/ReflectionSamplesPage'),
)
const HandoffEditorPage = lazy(() => import('@/pages/HandoffEditorPage'))
const ReflectionEditorPage = lazy(() => import('@/pages/ReflectionEditorPage'))
const LearningNotesPage = lazy(() => import('@/pages/LearningNotesPage'))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AccountEntryPage />} />
      <Route path="/login" element={<AccountEntryPage mode="login" />} />
      <Route path="/signup" element={<AccountEntryPage mode="signup" />} />
      <Route path="/forgot-password" element={<AccountEntryPage mode="forgot-password" />} />
      <Route path="/update-password" element={<AccountEntryPage mode="update-password" />} />
      <Route element={<ProtectedRoute allowIncompleteProfile />}>
        <Route path="/onboarding" element={<AccountEntryPage mode="onboarding" />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/shifts/new" element={<NewShiftPage />} />
          <Route path="/shifts/:shiftId" element={<ShiftPage />} />
          <Route path="/handoffs" element={<HandoffSamplesPage />} />
          <Route path="/handoffs/new" element={<HandoffEditorPage />} />
          <Route
            path="/handoffs/:handoffId/edit"
            element={<HandoffEditorPage />}
          />
          <Route path="/reflections" element={<ReflectionSamplesPage />} />
          <Route path="/reflections/new" element={<ReflectionEditorPage />} />
          <Route
            path="/reflections/:reflectionId/edit"
            element={<ReflectionEditorPage />}
          />
          <Route path="/learning-notes" element={<LearningNotesPage />} />
          <Route path="/learning-notes/new" element={<LearningNotesPage />} />
          <Route
            path="/learning-notes/:noteId/edit"
            element={<LearningNotesPage />}
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
      <AuthProvider>
        <WorkspaceProvider>
          <AppRoutes />
          <Toaster richColors position="bottom-right" />
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
