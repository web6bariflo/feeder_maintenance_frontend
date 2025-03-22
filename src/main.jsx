import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import FeederMotor from "./components/pages/FeederMotor.jsx";
import TrayCalibration from "./components/pages/TrayCalibration.jsx";
import CameraModule from "./components/pages/CameraModule.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/feeder-motor" element={<FeederMotor/>} />
            <Route path="/tray-calibration" element={<TrayCalibration/>} />
            <Route path="/camera-module" element={<CameraModule/>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  </StrictMode>
);
