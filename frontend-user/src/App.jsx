import { BrowserRouter } from 'react-router-dom';
import { LucideProvider } from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ChatProvider } from '@/context/ChatContext';
import AppRoutes from '@/routes/AppRoutes';
import '@/styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <LucideProvider strokeWidth={1.5}>
        <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <AppRoutes />
            </ChatProvider>
          </AuthProvider>
        </ThemeProvider>
      </LucideProvider>
    </BrowserRouter>
  );
}

export default App;
