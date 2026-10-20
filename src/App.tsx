/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Menu from './components/layout/Menu';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import QuemSomos from './pages/QuemSomos';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';
import TermosUso from './pages/TermosUso';
import Anuncie from './pages/Anuncie';
import Contato from './pages/Contato';
import Seed from './pages/Seed';
import Login from './pages/Login';
import PostNews from './pages/PostNews';
import CategoryPage from './pages/CategoryPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans w-full max-w-full overflow-x-hidden">
        <Header />
        <Menu />
        <main className="flex-grow w-full max-w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/noticia/:id" element={<NewsDetail />} />
            <Route path="/categoria/:category" element={<CategoryPage />} />
            <Route path="/quem-somos" element={<QuemSomos />} />
            <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/termos-uso" element={<TermosUso />} />
            <Route path="/anuncie" element={<Anuncie />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/seed" element={<Seed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/postar" element={<PostNews />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
