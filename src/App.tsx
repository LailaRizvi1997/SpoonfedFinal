import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './contexts/auth-context'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { NavigationBar } from './components/navigation-bar'
import { Toaster } from './components/ui/toaster'
import { useAuth } from './contexts/auth-context'
import HomePage from './pages/home'
import OnboardingPage from './pages/onboarding'
import ProfilePage from './pages/profile'
import UserProfilePage from './pages/profile/[id]'
import NewReviewPage from './pages/review/new'
import SearchPage from './pages/search'
import RestaurantProfilePage from './pages/restaurant/[id]'
import ListPage from './pages/lists/ListPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="spoon-fed-theme">
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/profile/:id" element={<UserProfilePage />} />
              <Route 
                path="/review/new" 
                element={
                  <ProtectedRoute>
                    <NewReviewPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/restaurant/:id" element={<RestaurantProfilePage />} />
              <Route 
                path="/lists/:id" 
                element={
                  <ProtectedRoute>
                    <ListPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <NavigationBar />
            <Toaster />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App