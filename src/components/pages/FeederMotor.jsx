import React, { useContext, useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { MqttContext } from "../../mqtt/MqttPublisher";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import axios from "axios";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const FeederMotorTest = () => {
  const {
    currentWeight,
    initialWeight,
    setInitialWeight,
    publishMessage,
    topicMessages
  } = useContext(MqttContext);

  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const hasSubmittedRef = useRef(false);

  const [cycleLogs, setCycleLogs] = useState([]);
  const [remainingWeight, setRemainingWeight] = useState(null);
  const [feederDone, setFeederDone] = useState(false);
  const [weightData, setWeightData] = useState([{ weight: initialWeight }]);
  const [wasReset, setWasReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callibration, setCallibration] = useState("")


  const status = topicMessages["feeder/fdtryA00/maintenance/status"];

  useEffect(() => {
    console.log("🛠 Maintenance Status:", status);
  }, [status]);


  // Process weight updates and submit data immediately
  useEffect(() => {
    if (!initialWeight || currentWeight === null || feederDone) return;

    const processWeightUpdate = () => {
      if (remainingWeight === null) {
        // First cycle
        const newRemaining = Math.max(initialWeight - currentWeight, 0);
        setRemainingWeight(newRemaining);
        setWeightData([{ weight: initialWeight }, { weight: newRemaining }]);
        const newLog = {
          cycle: 1,
          startWeight: initialWeight,
          endWeight: newRemaining,
          dropRate: currentWeight,
        };
        
        setCycleLogs([newLog]);
        submitCycleData(newLog);

        if (newRemaining === 0) setFeederDone(true);
        return;
      }

      if (remainingWeight > 0) {
        // Subsequent cycles
        const newRemaining = Math.max(remainingWeight - currentWeight, 0);
        setRemainingWeight(newRemaining);
        setWeightData((prevData) => [...prevData, { weight: newRemaining }]);

        const newLog = {
          cycle: cycleLogs.length + 1,
          startWeight: remainingWeight,
          endWeight: newRemaining,
          dropRate: currentWeight,
        };

        setCycleLogs((prevLogs) => [...prevLogs, newLog]);
        submitCycleData(newLog);

        if (newRemaining === 0) {
          setFeederDone(true);
          submitTestCompletion();
        }
      }
    };

    processWeightUpdate();
  }, [currentWeight]);

  // Submit individual cycle data
  const submitCycleData = async (log) => {
    try {
      setIsSubmitting(true);
      const formattedData = {
        Cycle: String(log.cycle ?? ""),
        Start: String(log.startWeight ?? ""),
        End: String(log.endWeight ?? ""),
        Drop_Rate: String(log.dropRate ?? "")
      };

      const response = await axios.post(`${API_BASE_URL}/post_cycle_log/`, formattedData);
      console.log("✅ Cycle data submitted:", response.data);
    } catch (error) {
      console.error("❌ Error submitting cycle data:", error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optional: Submit test completion confirmation
  const submitTestCompletion = async () => {
    try {
      await axios.post(`${API_BASE_URL}/test_completion/`, {
        status: "completed",
        totalCycles: cycleLogs.length,
        initialWeight,
        finalWeight: 0
      });
      console.log("✅ Test completion submitted");
    } catch (error) {
      console.error("Test completion error:", error);
    }
  };

  const handleStart = () => {
    if (initialWeight) {
      if (wasReset) {
        alert("This is a new test after reset.");
        setWasReset(false);
      }

      setRemainingWeight(null);
      setFeederDone(false);
      setWeightData([{ weight: initialWeight }]);
      setCycleLogs([]);
      hasSubmittedRef.current = false;
      publishMessage("feeder/fdtryA00/dispenser_request", "start");
    } else {
      alert("Set the initial weight first.");
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm("Are you sure you want to reset all data?");
    if (!confirmed) return;

    setInitialWeight(null);
    setRemainingWeight(null);
    setFeederDone(false);
    setCycleLogs([]);
    setWeightData([{ weight: 0 }]);
    setWasReset(true);
    hasSubmittedRef.current = false;
  };

  const remainingPercent =
    initialWeight && remainingWeight !== null
      ? Math.max((remainingWeight / initialWeight) * 100, 0).toFixed(1)
      : "--";

  const DropRateChart = ({ weightData }) => {
    const labels = weightData.map((_, index) => `Cycle ${index + 1}`);
    const weights = weightData.map((entry) => entry.weight);

    const data = {
      labels,
      datasets: [
        {
          label: "Weight Drop",
          data: weights,
          fill: false,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.3,
          pointBackgroundColor: "#0ea5e9",
          pointBorderWidth: 1,
          pointRadius: 3,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#374151",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#6b7280",
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#6b7280",
          },
        },
      },
    };

    return (
      <div className="bg-white p-4 rounded-xl shadow-md h-80">
        <Line data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 h-screen">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-medium text-gray-800">Feeder Motor Test</h1>
        <p className="text-gray-500">Monitor and control the feeder motor performance</p>
      </div>
 
      <div>status: {status}</div>

      <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end flex-wrap">
          <div className="w-full sm:flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Weight (g)</label>
            <input
              type="number"
              value={initialWeight || ""}
              onChange={(e) => setInitialWeight(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter initial weight"
            />
          </div>

          <div className="flex flex-row gap-2">
            <button
              onClick={handleStart}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Start Test"}
            </button>

            <button
              onClick={handleReset}
              className="px-2 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              disabled={isSubmitting}
            >
              Reset Test
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Current Weight</span>
              <span className="text-sm font-semibold">{currentWeight || "--"}g</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Remaining</span>
              <span className="text-sm font-semibold">{remainingPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${remainingPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {feederDone && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
            Feeder test completed successfully. Remaining weight is 0g.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
        {/* <!-- Top row buttons --> */}
        <div className="flex justify-around">
          <button className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-5 rounded-md"
            onClick={() => publishMessage("feeder/fdtryA00/tare_request", "start")}
          >
            tare_request
          </button>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-5 rounded-md"
            onClick={() => publishMessage("feeder/fdtryA00/tare_confirm", "yes")}
          >
            tare_confirm
          </button>
        </div>

        {/* <!-- Bottom row input and submit --> */}
        <div className="flex">
          <input
            type="number"
            placeholder="Enter number"
            value={callibration || " "}
            onChange={(e) => setCallibration(Number(e.target.value))}
            className="w-full mx-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-row gap-2">
            <button
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              submit
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Weight Reduction Trend</h2>
            {initialWeight && (
              <div className="text-sm text-gray-500">
                Total: <span className="font-medium">{initialWeight}g</span>
              </div>
            )}
          </div>
          <div className="relative mt-4">
            <DropRateChart weightData={weightData} />
            {feederDone && (
              <div className="absolute">
                <span className="inline-block bg-red-50 text-red-600 text-xs px-5 py-1 rounded">
                  Feeder Completed at 0g
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Cycle Logs</h2>
          <div className="overflow-x-auto h-72">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cycle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start (g)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End (g)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Drop Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {cycleLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.cycle}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.startWeight}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.endWeight}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{log.dropRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeederMotorTest;