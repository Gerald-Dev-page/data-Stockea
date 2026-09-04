// src/App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./services/supabase";

// Componentes
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
import Stock from "./pages/Stock";
import "./styles/global.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    // 1. Obtener la sesión inicial almacenada
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Suscribirse a cambios de estado (LOGIN, LOGOUT, TOKEN REFRESH)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "ventas":
        return <Ventas />;
      case "productos":
        return <Productos />;
      case "clientes":
        return <Clientes />;
      case "stock":
        return <Stock />;
      default:
        return <Dashboard />;
    }
  };

  // Pantalla de carga con la paleta de fondo corporativa para evitar saltos en blanco
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'var(--color-bg-main)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-main)'
      }}>
        <p>Verificando seguridad de acceso...</p>
      </div>
    );
  }

  // Si no hay sesión válida, se restringe el acceso y se muestra únicamente el Login
  if (!session) {
    return <Login setSession={setSession} />;
  }

  // Estructura DOM original preservada al 100%
  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="page-container">{renderPage()}</main>
    </div>
  );
}

export default App;