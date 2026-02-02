import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export default function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <button style={styles.button}>Select All</button>
        <span style={styles.hint}>Drag to select enabled</span>
      </div>

      <LogoutButton />
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    height: "60px",
    backgroundColor: "#111",
    color: "white",
  },
  leftSection: { display: "flex", gap: "15px", alignItems: "center" },
  rightSection: { cursor: "pointer" },
  avatar: { borderRadius: "50%", border: "2px solid #555" },
  button: { padding: "5px 12px", cursor: "pointer" },
  hint: { fontSize: "12px", color: "#888" },
};
