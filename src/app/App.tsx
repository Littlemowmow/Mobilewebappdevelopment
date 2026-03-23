import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { TripProvider } from './context/TripContext';
import { BudgetProvider } from './context/BudgetContext';

export default function App() {
  return (
    <ThemeProvider>
      <TripProvider>
        <BudgetProvider>
          <RouterProvider router={router} />
        </BudgetProvider>
      </TripProvider>
    </ThemeProvider>
  );
}