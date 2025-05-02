import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import FeederMotor from "./components/pages/FeederMotor.jsx";
import TrayCalibration from "./components/pages/TrayCalibration.jsx";
import CameraModule from "./components/pages/CameraModule.jsx";
import { MqttContext } from "./mqtt/MqttPublisher.jsx";

const App = () => {
  return (

    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<div className="flex items-center justify-center h-screen w-full">
                <p className="text-3xl">Welcome to Dashboard</p>
              </div>} />
            <Route path="/feeder-motor" element={<FeederMotor />} />
            <Route path="/tray-calibration" element={<TrayCalibration />} />
            <Route path="/camera-module" element={<CameraModule />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>

  );
};

export default App;
