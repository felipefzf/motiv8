import React from "react";
import "./Header.css";

function Header({ title, rightContent }) {
  return (
    <header className="app-header">
      <div className="header-left">MOTIV8</div>

      <div className="header-center">
        {title}
      </div>

      <div className="header-right">
        {rightContent}
      </div>
    </header>
  );
}

export default Header;
