import React, { useState, useEffect } from "react";
import { MqttContext } from "../../mqtt/MqttPublisher";
import axios from "axios";
import { FiDownload } from "react-icons/fi";
 
const CameraModule = () => {
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const wsUrl = import.meta.env.VITE_WS_URL;
  const [imageData, setImageData] = useState([]);
  const [colorImageData, setColorImageData] = useState([]);
  const { publishMessage } = React.useContext(MqttContext);
 
  useEffect(() => {
    const socket = new WebSocket(`${wsUrl}/ws/thermal-images/`);
    const pingInterval = setInterval(() => {
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
        } else if (
          data.type === "colour_images" &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          setColorImageData(data.data);
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
      clearInterval(pingInterval);
      socket.close();
    };
  }, []);
 
  const handleCapture = () => {
    console.log("Capture button clicked");
    publishMessage("feeder/fdtryA00/camera_capture", "start");
  };

  const handleAutoCapture = () => {
    console.log("Auto Capture button clicked");
    publishMessage("feeder/fdtryA00/camera_auto_toggle", "on");
  };
 
  const handleDownloadAll = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/download_all_thermal_images/`,
        null,
        { responseType: "blob" }
      );
 
      const fileURL = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = "thermal_images.zip";
      link.click();
      URL.revokeObjectURL(fileURL);
    } catch (error) {
      console.error("Error during downloading thermal images:", error);
    }
  };
 
  return (
    <div className="flex flex-col items-center w-full mt-4 px-2 max-w-screen-xl mx-auto">
      {/* Buttons Section */}
      <div className="flex flex-row flex-wrap justify-center gap-6 mb-4">
        <button
          onClick={handleCapture}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transform transition duration-300 ease-in-out"
        >
          Capture
        </button>
        <button
          onClick={handleAutoCapture}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold rounded-xl shadow-lg hover:scale-105 transform transition duration-300 ease-in-out"
        >
          Auto Capture
        </button>
      </div>
 
      {/* Top-right Download All Button */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleDownloadAll}
          className="flex items-center px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded gap-1 text-sm hover:scale-105 transform transition duration-300 ease-in-out font-semibold"
        >
          <FiDownload className="w-4 h-4" />
          Download All
        </button>
      </div>
 
      {/* Combined Image Display - Side by Side on Large Screens */}
      <div className="flex flex-col lg:flex-row w-full gap-8 mt-4">
        {/* Thermal Images Section */}
        <div className="flex-1 border-r pr-6">
          {imageData.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-left w-full mb-2">
                Thermal Images
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {imageData
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((img, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center w-full bg-white rounded-2xl shadow-xl transition hover:shadow-2xl p-2"
                    >
                      <div className="rounded-xl overflow-hidden border-4 border-gray-200">
                        {img.thermal_image ? (
                          <img
                            src={`data:image/png;base64,${img.thermal_image}`}
                            alt={`Thermal Image ${index + 1}`}
                            className="object-cover w-full h-auto transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="text-red-500 text-xs p-2">⚠️ Thermal image not available</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 mb-1 w-full px-1 text-xs gap-1 text-gray-700 font-medium">
                        <div className="bg-gray-200 px-2 py-1 rounded-md shadow-sm text-[9.5px]">
                          {new Date(img.created_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => {
                            const base64Data = img.thermal_image;
                            const fileName = `thermal_image_${index + 1}.png`;
                            const url = `data:image/png;base64,${base64Data}`;
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = fileName;
                            link.click();
                          }}
                          className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md shadow-sm transition duration-200"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
 
        {/* Color Images Section */}
        <div className="flex-1">
          {colorImageData.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-left w-full mb-2">
                Color Images
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                {colorImageData
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((img, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center w-full bg-white rounded-2xl shadow-xl transition hover:shadow-2xl p-2"
                    >
                      <div className="rounded-xl overflow-hidden border-4 border-gray-200">
                        {img.colour_image ? (
                          <img
                            src={`data:image/jpeg;base64,${img.colour_image}`}
                            alt={`Color Image ${index + 1}`}
                            className="object-cover w-full h-auto transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="text-red-500 text-xs p-2">⚠️ Color image not available</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 mb-1 w-full px-1 text-xs text-gray-700 font-medium gap-1">
                        <div className="bg-gray-200 px-2 py-1 rounded-md shadow-sm text-[9.5px]">
                          {new Date(img.created_at).toLocaleString()}
                        </div>
                        <button
                          onClick={() => {
                            const base64Data = img.colour_image;
                            const fileName = `colour_image_${index + 1}.jpg`;
                            const url = `data:image/jpeg;base64,${base64Data}`;
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = fileName;
                            link.click();
                          }}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md shadow-sm transition duration-200"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default CameraModule;