import { Link, Navigate } from "react-router-dom";



export default function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/">Home</Link> |{" "}
      <Link to="/about">About</Link> |{" "}
      <Link to="/profile">Profile</Link>|{" "}
      <Link to="/teams">Teams</Link>
    </nav>
  );
}
