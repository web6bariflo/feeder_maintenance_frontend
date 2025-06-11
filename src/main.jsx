import React from "react";
import { createRoot } from "react-dom/client"; // React 18+ way to render the app
import App from "./App.jsx"; // Your main app component
import "./index.css"; // Assuming you have global styles here

// Assuming MqttProvider is needed at the root level, you can wrap App with it here
import { MqttProvider } from "./mqtt/MqttPublisher.jsx";

const rootElement = document.getElementById("root"); // Get the root element

createRoot(rootElement).render(
  <React.StrictMode>
    <MqttProvider>
      <App />
    </MqttProvider>
  </React.StrictMode>
);
