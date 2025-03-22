import { useState } from "react";
import { FaCogs, FaCamera, FaToolbox } from "react-icons/fa";
import { NavLink } from "react-router";

const Sidebar = () => {
  const [active, setActive] = useState();

  const menuItems = [
    { name: "Feeder Motor Test", icon: <FaCogs />, path: "/feeder-motor" },
    { name: "Tray Calibration", icon: <FaToolbox />, path: "/tray-calibration" },
    { name: "Camera Module", icon: <FaCamera />, path: "/camera-module" },
  ];

  return (
    <div className="h-screen w-60 bg-gray-900 text-white flex flex-col p-4">
      <h2 className="text-xl font-bold mb-6">Menu</h2>
      <nav className="flex flex-col gap-4">

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left hover:bg-gray-700 
              ${active === item.name ? "bg-gray-700" : ""}`}
            onClick={() => setActive(item.name)}
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
