import React from "react";
import { useState } from "react";
import { FaCogs, FaCamera, FaToolbox } from "react-icons/fa";
import { HiOutlineHome } from 'react-icons/hi2';
import { NavLink } from "react-router-dom"; // ✅ Fix import here

const Sidebar = ({ onLinkClick }) => {
  const [active, setActive] = useState();

  const menuItems = [
    { name: "Home",icon: <HiOutlineHome />,  path: "/" },
    { name: "Feeder Motor Test", icon: <FaCogs />, path: "/feeder-motor" },
    { name: "Tray Calibration", icon: <FaToolbox />, path: "/tray-calibration" },
    { name: "Camera Module", icon: <FaCamera />, path: "/camera-module" },
  ];

  return (
    <div className="h-screen w-54 bg-gray-900 text-white flex flex-col p-4">
      <h2 className="text-sm font-bold mb-6">Menu</h2>
      <nav className="flex flex-col gap-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left hover:bg-gray-700 ${
                isActive ? "bg-gray-700" : ""
              }`
            }
            onClick={() => {
              setActive(item.name);
              if (onLinkClick) onLinkClick(); // ✅ Close sidebar on mobile
            }}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
