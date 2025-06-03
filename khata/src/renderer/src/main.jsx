import { createRoot } from 'react-dom/client';
import App from './App';
import SignIn from './pages/SignIn.jsx';
import { AuthProvider, useAuth } from './hooks/useAuth';

function RootContent() {
  const { user } = useAuth();

  if (user === undefined) return <div>Loading...</div>;
  if (!user) return <SignIn />;
  return <App />;
}

createRoot(document.getElementById('root')).render(

    <AuthProvider>
      <RootContent />
    </AuthProvider>

);
