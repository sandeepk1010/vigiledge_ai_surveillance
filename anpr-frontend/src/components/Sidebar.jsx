import { Link } from "react-router-dom";

export default function Sidebar({ open, setOpen }) {
  return (
    <>
      {/* TOGGLE */}
      <div style={styles.toggle} onClick={() => setOpen(!open)}>
        ☰
      </div>

      {/* SIDEBAR */}
      <div
        style={{
          ...styles.sidebar,
          width: open ? 220 : 60
        }}
      >
        <div style={styles.logo}>
          {open ? "🚗 ANPR" : "🚗"}
        </div>

        <Link to="/" style={styles.link}>
          📊 {open && "Dashboard"}
        </Link>

        <Link to="/vehicle-log" style={styles.link}>
          🚘 {open && "Vehicle Log"}
        </Link>

        <Link to="/anpr-raw" style={styles.link}>
          🧾 {open && "ANPR Raw"}
        </Link>

        <Link to="/daily-graph" style={styles.link}>
          📈 {open && "Daily Graph"}
        </Link>
      </div>
    </>
  );
}

const styles = {
  sidebar: {
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    background: "#0b132b",
    color: "white",
    paddingTop: 20,
    transition: "0.3s",
    overflow: "hidden"
  },
  logo: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 30,
    fontSize: 18
  },
  link: {
    display: "block",
    padding: "14px 20px",
    color: "white",
    textDecoration: "none"
  },
  toggle: {
    position: "fixed",
    top: 10,
    left: 10,
    fontSize: 22,
    cursor: "pointer",
    zIndex: 2000,
    background: "#0b132b",
    color: "white",
    padding: "6px 10px",
    borderRadius: 6
  }
};
