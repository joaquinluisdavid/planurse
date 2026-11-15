import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { AccountEntryPage } from '@/pages/DemoEntryPage'
import { UpcomingPage } from '@/pages/UpcomingPage'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceProvider } from '@/data/WorkspaceProvider'
import { AuthProvider } from '@/auth/AuthProvider'
import { AuthContext, type AuthValue } from '@/auth/useAuth'
import { createDemoRepository } from '@/demo/repository'
import type { User } from '@supabase/supabase-js'
import { useMemo } from 'react'

const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ShiftsPage = lazy(() => import('@/pages/ShiftsPage'))
const NewShiftPage = lazy(() => import('@/pages/NewShiftPage'))
const ShiftPage = lazy(() => import('@/pages/ShiftPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ReflectionSamplesPage = lazy(
  () => import('@/pages/ReflectionSamplesPage'),
)
const ReflectionEditorPage = lazy(() => import('@/pages/ReflectionEditorPage'))
const LearningNotesPage = lazy(() => import('@/pages/LearningNotesPage'))
const NotebookPage = lazy(() => import('@/pages/NotebookPage'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))

export function AppRoutes({ demo = false }: { demo?: boolean } = {}) {
  return (
    <Routes>
      <Route path="/" element={demo ? <Navigate to="/dashboard" replace /> : <AccountEntryPage />} />
      <Route path="/login" element={<AccountEntryPage mode="login" />} />
      <Route path="/signup" element={<AccountEntryPage mode="signup" />} />
      <Route
        path="/forgot-password"
        element={<AccountEntryPage mode="forgot-password" />}
      />
      <Route
        path="/update-password"
        element={<AccountEntryPage mode="update-password" />}
      />
      <Route element={<ProtectedRoute allowIncompleteProfile />}>
        <Route
          path="/onboarding"
          element={<AccountEntryPage mode="onboarding" />}
        />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/journal" element={<Navigate to="/notebook" replace />} />
          <Route path="/journal/new" element={<Navigate to="/notebook/new" replace />} />
          <Route path="/notebook" element={<NotebookPage />} />
          <Route path="/notebook/new" element={<NotebookPage />} />
          <Route path="/notebook/:entryId/edit" element={<NotebookPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/shifts/new" element={<NewShiftPage />} />
          <Route path="/shifts/:shiftId" element={<ShiftPage />} />
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
  const demo = window.location.pathname.includes('/demo')
  if (demo) return <DemoApp />
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <WorkspaceProvider>
          <AppRoutes />
          <Toaster richColors position="bottom-right" />
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function DemoApp() {
  const repository = useMemo(() => createDemoRepository(), [])
  const authValue: AuthValue = {
    user: { id: '00000000-0000-4000-8000-000000000001', email: 'demo@planurse.example' } as User,
    profile: {
      userId: '00000000-0000-4000-8000-000000000001',
      role: 'student-nurse',
      firstName: 'Demo',
      lastName: 'Learner',
      nickname: 'Demo Learner',
      position: 'Student Nurse',
      avatarPath: null,
      avatarUrl: null,
    },
    loading: false,
    error: null,
    configured: true,
    refreshProfile: async () => {},
    saveProfile: async () => {},
    uploadAvatar: async () => {},
    removeAvatar: async () => {},
    signOut: async () => {},
  }
  return (
    <BrowserRouter basename={`${import.meta.env.BASE_URL}demo`}>
      <AuthContext.Provider value={authValue}>
        <WorkspaceProvider repository={repository}>
          <AppRoutes demo />
          <Toaster richColors position="bottom-right" />
        </WorkspaceProvider>
      </AuthContext.Provider>
    </BrowserRouter>
  )
}
