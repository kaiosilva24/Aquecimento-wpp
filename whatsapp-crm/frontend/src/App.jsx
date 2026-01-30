import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Image, Settings, Activity, Users, Globe, Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Messages from './pages/Messages';
import Media from './pages/Media';
import Configuration from './pages/Configuration';
import Proxy from './pages/Proxy';
import VPN from './pages/VPN';
import './App.css';

function Navigation() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/accounts', icon: Users, label: 'Contas' },
        { path: '/messages', icon: MessageSquare, label: 'Mensagens' },
        { path: '/media', icon: Image, label: 'Mídia' },
        { path: '/proxy', icon: Globe, label: 'Proxy' },
        { path: '/vpn', icon: Shield, label: 'VPN (Novo)' },
        { path: '/config', icon: Settings, label: 'Configurações' },
    ];

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <Activity className="logo-icon" size={32} />
                <h2 className="logo-text">WPP Warming</h2>
            </div>

            <div className="nav-items">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

function App() {
    return (
        <Router>
            <div className="app">
                <Navigation />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/media" element={<Media />} />
                        <Route path="/proxy" element={<Proxy />} />
                        <Route path="/vpn" element={<VPN />} />
                        <Route path="/config" element={<Configuration />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
