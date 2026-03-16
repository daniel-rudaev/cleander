import { Toaster } from "sonner";
import { AuthProvider } from '@/components/auth/AuthContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Review from './pages/Review';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Review" element={<Review />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
