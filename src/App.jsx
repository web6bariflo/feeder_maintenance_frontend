import React, { useContext, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import FeederMotor from "./components/pages/FeederMotor.jsx";
import TrayCalibration from "./components/pages/TrayCalibration.jsx";
import CameraModule from "./components/pages/CameraModule.jsx";
import { MqttContext } from "./mqtt/MqttPublisher.jsx";
import { Menu } from "lucide-react";

const App = () => {
  const { publishMessage } = useContext(MqttContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleClick = () => {
    publishMessage("feeder/maintenance_request", "Start");
  };

  const handleLinkClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar: Always visible on md+ screens, toggle on mobile */}
        <div
          className={`fixed z-40 inset-y-0 left-0 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}
        >
          <Sidebar onLinkClick={handleLinkClick} />
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-30 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-col flex-1 w-full md:ml-64">
          {/* Top Navbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-white shadow-md md:hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu className="h-6 w-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-3xl mb-5">Welcome to Dashboard</p>
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={handleClick}
                    >
                      Start
                    </button>
                  </div>
                }
              />
              <Route path="/feeder-motor" element={<FeederMotor />} />
              <Route path="/tray-calibration" element={<TrayCalibration />} />
              <Route path="/camera-module" element={<CameraModule />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
