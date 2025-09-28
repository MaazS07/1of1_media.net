import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Playground from './pages/Playground';
import Templates from './pages/MarketPlace';
import ApiKeyManager from './components/ApiKeyManager';
import Auth from './pages/Auth';
import PromptPlayground from './components/PromptPlayground';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth/>} />


        <Route path="/playground" element={<Playground />} />
        <Route path="/marketplace" element={<Templates />} />
        <Route path="/api" element={<ApiKeyManager/>} />
        <Route path="/prompt" element={<PromptPlayground/>} />


      </Routes>
    </Router>
  );
}

export default App;