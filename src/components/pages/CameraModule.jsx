import React, { useState, useEffect } from "react";
import mqtt from "mqtt";

const CameraModule = () => {
  const [imageData, setImageData] = useState([]);
  
  useEffect(() => {
    const socket = new WebSocket("ws://192.168.31.208:8001/ws/thermal-images/");
    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket Message Received:", data);

        if (
          data.type === "thermal_images" &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setImageData(data.data);
        } else {
          console.warn("⚠️ No valid image data received:", data);
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleCapture = () => {
    console.log("Capture button clicked");
    // Implement capture logic here
  };

  const handleAutoCapture = () => {
    console.log("Auto Capture button clicked");
    // Implement auto capture logic here
  };

  const staticData = [
    { id: 1, name: "Image 1", type: "PNG", time: "12:30 PM" },
    { id: 2, name: "Image 2", type: "JPEG", time: "12:45 PM" },
    { id: 3, name: "Image 3", type: "PNG", time: "01:00 PM" },
    { id: 4, name: "Image 4", type: "JPEG", time: "01:15 PM" }
  ];

  return (
    <div className="flex flex-col items-center w-full space-y-4 mt-16">
      {/* Buttons Section */}
      <div className="flex space-x-4">
        <button
          onClick={handleCapture}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Capture
        </button>
        <button
          onClick={handleAutoCapture}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Auto Capture
        </button>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-4xl mt-6">
        <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2 rounded-tl-lg">#</th>
              <th className="border border-gray-300 px-4 py-2">Image Name</th>
              <th className="border border-gray-300 px-4 py-2">Type</th>
              <th className="border border-gray-300 px-4 py-2 rounded-tr-lg">Time</th>
            </tr>
          </thead>
          <tbody>
            {staticData.map((item, index) => (
              <tr key={item.id} className="text-center">
                <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                <td className="border border-gray-300 px-4 py-2">{item.type}</td>
                <td className="border border-gray-300 px-4 py-2">{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gallery View */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {imageData.map((img, index) => (
          <div key={index} className="w-48 h-48 border-2 rounded-lg overflow-hidden shadow-md">
            <img
              src={`data:image/png;base64,${img.thermal_image}`}
              alt={`Thermal Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraModule;
