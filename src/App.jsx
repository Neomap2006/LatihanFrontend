import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainRoutes from './routes';

function App() {
  return (
    <Router>
      <MainRoutes />
      <Toaster position="top-right" richColors />
    </Router>
  );
}

export default App;