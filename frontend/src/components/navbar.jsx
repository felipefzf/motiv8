import { Link, Navigate } from "react-router-dom";



export default function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee", width:"100%", alignItems:"center",justifyContent:"center",display:"flex"}}>
      
      <Link to="/about">About</Link> |{" "}
      <Link to="/profile">Profile</Link>|{" "}
      <Link to="/">Home</Link> |{" "}
      <Link to="/login">Login</Link>|{" "}
      <Link to="/teams">Teams</Link>
    </nav>
  );
}
