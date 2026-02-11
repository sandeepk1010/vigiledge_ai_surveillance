import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        
        {/* LOGO */}
        <div style={styles.logo}>🚗 ANPR Control</div>

        {/* HAMBURGER */}
        <div style={styles.menuBtn} onClick={() => setOpen(!open)}>
          ☰
        </div>

        {/* NAV LINKS */}
        <nav style={{
          ...styles.nav,
          display: open ? "flex" : "",
        }}>
          <Link to="/" style={styles.link}>Dashboard</Link>
          <Link to="/vehicle-log" style={styles.link}>In/Out-Reports</Link>
          <Link to="/daily-graph" style={styles.link}>Daily Graph</Link>
        </nav>

      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "#0b132b",
    color: "#fff",
    padding: "12px 0",
    position: "sticky",
    top: 0,
    zIndex: 1000
  },
  container: {
    maxWidth: 1200,
    margin: "auto",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  logo: {
    fontWeight: "bold",
    fontSize: 20
  },
  nav: {
    display: "flex",
    gap: 20
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: 500
  },
  menuBtn: {
    display: "none",
    fontSize: 22,
    cursor: "pointer"
  }
};
