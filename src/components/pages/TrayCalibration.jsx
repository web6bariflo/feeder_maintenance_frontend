import React, { useState, useEffect } from "react";
import axios from "axios";
import { MqttContext } from "../../mqtt/MqttPublisher";
import { useContext } from "react";


const TrayCalibration = () => {
  const [stepCount, setStepCount] = useState("");
  const [measuredHeight, setMeasuredHeight] = useState("");
  const [logs, setLogs] = useState([]);
  const [targetLogs, setTargetLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stepSubmitted, setStepSubmitted] = useState(false);
  const [id, setId] = useState()
  const [targetId, setTargetId] = useState()
  const [targetHeight, setTargetHeight] = useState("");
  const [confirmationHeight, setConfirmationHeight] = useState("");
  const [tableMode, setTableMode] = useState('check');
  const { publishMessage } = useContext(MqttContext);

  const API_BASE_URL = import.meta.env.VITE_API_URL
  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get_feeders/`);
      setLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // Post Step Count
  const handleStepSubmit = async () => {
    if (stepCount.trim() === "") return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/create_feeder/`, { stepCount: stepCount });
      console.log(res.data.id);
      setId(res.data.id)
      setStepSubmitted(true); // Allow measured height input
    } catch (error) {
      console.error("Error submitting step count:", error);
    } finally {
      setLoading(false);
    }
  };
  // Post Measured Height and Fetch Logs
  const handleMeasuredHeightSubmit = async () => {
    if (measuredHeight.trim() === "") return;
    setLoading(true);
    try {
      await axios.patch(`${API_BASE_URL}/create_feeder/`, { mesuredHeight: measuredHeight, id: id });
      setMeasuredHeight(""); //clear input field
      setStepCount(""); // clear input field
      setStepSubmitted(false);// Reset step submission state
      fetchLogs(); // Fetch updated logs
    } catch (error) {
      console.error("Error submitting measured height:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationHeightSubmit = async () => {
    if (confirmationHeight.trim() === "") return;

    try {
      await axios.patch(`${API_BASE_URL}/create_feeder/`, { confirmationHeight: confirmationHeight, id: targetId });
      checkTargetHeight(); // Fetch updated logs
      setTargetHeight("");//clear input filed
      setConfirmationHeight("");//clear input field
    } catch (error) {
      console.error("Error submitting measured height:", error);
    }
  };

  const checkTargetHeight = async () => {
    if (!targetHeight.trim()) return; // Prevent empty request

    try {
      const response = await axios.post(`${API_BASE_URL}/create_feeder_view/`, { targetHeight: targetHeight });
      if (response.status === 200) {
        setTargetLogs(response.data.data);
        setTargetId(response.data.data[0].feeder_id)
      }

    } catch (error) {
      console.log(error);
    }
  };

  console.log(targetLogs);


  useEffect(() => {
    fetchLogs()
  }, [])

  const handleClick = (topic, message) => {
    publishMessage(topic, message);
  }




  return (
    <div className="p-6">

      <div className="flex justify-center mb-4">
        <button className="bg-gray-500 text-white px-4 py-2 rounded-lg ml-2 hover:bg-gray-600"
          onClick={() => handleClick("feeder/calibration_request", "start page")}
        // disabled={loading}
        >
          Start
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4 underline">Manual Calibration</h1>

      {/* Step Count Input */}
      <div className="mb-4">
        <p>Step Count</p>
        <input
          type="number"
          placeholder="Enter value"
          className="border border-gray-300 p-2 rounded-lg w-64"
          value={stepCount}
          onChange={(e) => setStepCount(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg ml-2 hover:bg-blue-600"
          onClick={handleStepSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        <button className="bg-green-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-green-700"
          // onClick={() => handleClick("feeder/calibration_value" , stepCount)}
          onClick={() => handleClick("" , stepCount)}
        // disabled={loading}
        >
          StepSubmit
        </button>
      </div>

      {/* Measured Height Input */}
      <div className="mb-4">
        <p>Measured Height</p>
        <input
          type="number"
          placeholder="Enter value"
          className="border border-gray-300 p-2 rounded-lg w-64"
          value={measuredHeight}
          onChange={(e) => setMeasuredHeight(e.target.value)}
          disabled={!stepSubmitted}
        />
        <button
          className={`px-6 py-2 rounded-lg ml-2 text-white ${stepSubmitted ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
            }`}
          onClick={handleMeasuredHeightSubmit}
          disabled={!stepSubmitted || loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Display Logs Table */}
      <h1 className="text-2xl font-bold mt-6 underline">Display Logs</h1>
      {logs.length > 0 ? (
        <div className="max-h-65 overflow-y-auto border border-gray-300 rounded">
          <table className="mt-4 border-collapse w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">ID</th>
                <th className="border border-gray-300 p-2">Step Count</th>
                <th className="border border-gray-300 p-2">Measured Height</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{log.stepCount || "N/A"}</td>
                  <td className="border border-gray-300 p-2">{log.mesuredHeight || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-gray-500">No logs available.</p>
      ) : null}

      <h1 className="text-2xl font-bold mb-4 mt-6 underline">Automatic Calibration</h1>

      {/* target height */}
      <div className="mb-4">
        <p>target height</p>
        <input
          type="number"
          placeholder="Enter value"
          className="border border-gray-300 p-2 rounded-lg w-64"
          value={targetHeight}
          onChange={(e) => setTargetHeight(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-5 py-2 rounded-lg ml-2 hover:bg-blue-600"
          onClick={() => {
            checkTargetHeight();
            setTableMode('check');
          }}
        >
          Check
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-green-700"
          onClick={() => handleClick("feeder/calibration_confirm", "yes")}
        // disabled={loading}
        >
          Calibration
        </button>
      </div>

      {/* Measured Height Input */}
      <div className="mb-4">
        <p>Confirmation height</p>
        <input
          type="number"
          placeholder="Enter value"
          className="border border-gray-300 p-2 rounded-lg w-64"
          value={confirmationHeight}
          onChange={(e) => setConfirmationHeight(e.target.value)}
          disabled={targetLogs.length === 0} // Disable if no target height logs
        />
        <button
          className={`px-6 py-2 rounded-lg ml-2 text-white ${targetLogs.length > 0 ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"}`}
          onClick={() => {
            handleConfirmationHeightSubmit(); // Your existing function
            setTableMode("save"); // Set table mode to "save" to show full data
          }}
          disabled={targetLogs.length === 0 || loading} // Disable if no logs or loading
        >
          {loading ? "Saving..." : "Save"}

        </button>
      </div>

      {/* Display Logs Table */}
      <h1 className="text-2xl font-bold mt-6 underline">Display Logs</h1>
      {targetLogs.length > 0 ? (

        <table className="mt-4 border-collapse w-full border border-gray-300 ">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">ID</th>
              <th className="border border-gray-300 p-2">Measured Height</th>
              <th className="border border-gray-300 p-2">stepCount</th>
              {tableMode === "save" && (
                <>
                  <th className="border border-gray-300 p-2">conformation Height</th>
                  <th className="border border-gray-300 p-2">Deviation</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {targetLogs.map((log, index) => (
              <tr key={index} className="text-center">
                <td className="border border-gray-300 p-2">{index + 1}</td>
                <td className="border border-gray-300 p-2">{log.targetHeight || "N/A"}</td>
                <td className="border border-gray-300 p-2">{log.stepCount || "N/A"}</td>
                {tableMode === "save" && (
                  <>
                    <td className="border border-gray-300 p-2">{log.confirmationHeight || "N/A"}</td>
                    <td className="border border-gray-300 p-2">{log.targetHeight - log.confirmationHeight || "N/A"}</td>
                  </>)}
              </tr>
            ))}
          </tbody>

        </table>

      ) : (
        <p className="mt-4 text-gray-500">No logs available.</p>
      )}
    </div>
  );
};

export default TrayCalibration;
