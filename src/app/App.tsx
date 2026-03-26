import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { TripProvider } from './context/TripContext';
import { BudgetProvider } from './context/BudgetContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TripProvider>
            <BudgetProvider>
              <RouterProvider router={router} />
            </BudgetProvider>
          </TripProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
