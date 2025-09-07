import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Feed from './pages/Feed';
import ArticleDetail from './pages/ArticleDetail';
import Dashboard from './pages/Dashboard';
import Saved from './pages/Saved';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

// Components
import PrivateRoute from './components/PrivateRoute';
import InterestsSetup from './components/Onboarding/InterestsSetup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/onboarding" 
                  element={
                    <PrivateRoute>
                      <InterestsSetup />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/feed" 
                  element={
                    <PrivateRoute>
                      <Feed />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/article/:articleId" 
                  element={
                    <PrivateRoute>
                      <ArticleDetail />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/saved" 
                  element={
                    <PrivateRoute>
                      <Saved />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/search" 
                  element={
                    <PrivateRoute>
                      <Search />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <PrivateRoute>
                      <Chat />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/chat/:articleId" 
                  element={
                    <PrivateRoute>
                      <Chat />
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                },
                success: {
                  style: {
                    background: 'var(--color-success)',
                    color: '#ffffff',
                  },
                },
                error: {
                  style: {
                    background: 'var(--color-error)',
                    color: '#ffffff',
                  },
                },
              }}
            />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
