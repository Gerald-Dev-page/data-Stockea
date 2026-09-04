// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  LogOut,
  UserCircle,
} from "lucide-react";
import logo from "../public/Logo.png";
import logoG from "../public/Logo-Gerald.png";
import "../styles/sidebar.css";

export default function Sidebar({ currentPage, setCurrentPage }) {
  const [usuario, setUsuario] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Obtenemos el perfil o mostramos el email
        supabase
          .from("perfiles")
          .select("nombre_completo")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setUsuario(data?.nombre_completo || user.email);
          });
      }
    });
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error al cerrar sesión:", error.message);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "ventas", label: "Ventas", Icon: ShoppingCart },
    { id: "productos", label: "Productos", Icon: Package },
    { id: "clientes", label: "Clientes", Icon: Users },
    { id: "stock", label: "Stock", Icon: Truck },
  ];

  return (
    <nav className="sidebar">
      {/* ── Logo de la Marca ── */}
      <div className="sidebar-logo">
        <img src={logo} alt="Data Stockear" className="nav-logo" />
      </div>

      {/* ── Menú de Navegación ── */}
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={currentPage === item.id ? "active" : ""}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="menu-icon">
              <item.Icon size={19} strokeWidth={2} />
            </span>
            <span className="menu-label">{item.label}</span>
          </li>
        ))}

        {/* Únicamente visible en barra inferior móvil */}
        <li className="logout-item-mobile" onClick={handleLogout}>
          <span className="menu-icon">
            <LogOut size={19} strokeWidth={2} />
          </span>
          <span className="menu-label">Salir</span>
        </li>
      </ul>

      {/* ── Perfil de Operador y Cierre (Solo Desktop) ── */}
      <div className="sidebar-bottom">
        <div className="user-profile">
          <UserCircle size={26} className="user-icon" />
          <div className="user-details">
            <span className="user-role">Operador Actual</span>
            <strong className="user-email" title={usuario}>
              {usuario || "Cargando..."}
            </strong>
          </div>
        </div>

        <button 
          type="button" 
          className="logout-btn-desktop" 
          onClick={handleLogout}
        >
          <LogOut size={15} strokeWidth={2} />
          <span>Cerrar Sesión</span>
        </button>

        <div className="sidebar-footer">
          <span className="sidebar-footer-label">Powered by</span>
          <img src={logoG} alt="Gerald Agency" className="agency-logo" />
        </div>
      </div>
    </nav>
  );
}