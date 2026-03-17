import { Toaster } from "sonner";
import { AuthProvider } from '@/components/auth/AuthContext';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import Review from './pages/Review';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/Review" element={<Review />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/cleander">
        <AnimatedRoutes />
      </Router>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default App;
