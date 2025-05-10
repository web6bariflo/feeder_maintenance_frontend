import React, { useContext, useEffect, useState } from "react";
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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const FeederMotorTest = () => {
  const {
    currentWeight,
    initialWeight,
    setInitialWeight,
    // sendStartCommand,
    publishMessage
  } = useContext(MqttContext);

  const [cycleLogs, setCycleLogs] = useState([]);
  const [remainingWeight, setRemainingWeight] = useState(null);
  const [feederDone, setFeederDone] = useState(false);
  const [weightData, setWeightData] = useState([{ weight: initialWeight }]);
  const [wasReset, setWasReset] = useState(false); // ✅ New state to track reset

  useEffect(() => {
    if (!initialWeight || currentWeight === null || feederDone) return;

    if (remainingWeight === null) {
      const newRemaining = Math.max(initialWeight - currentWeight, 0);
      setRemainingWeight(newRemaining);
      setWeightData([{ weight: initialWeight }, { weight: newRemaining }]);
      setCycleLogs([
        {
          cycle: 1,
          startWeight: initialWeight,
          endWeight: newRemaining,
          dropRate: currentWeight,
        },
      ]);

      if (newRemaining === 0) setFeederDone(true);
      return;
    }

    if (remainingWeight > 0) {
      const newRemaining = Math.max(remainingWeight - currentWeight, 0);
      setRemainingWeight(newRemaining);

      setWeightData((prevData) => [...prevData, { weight: newRemaining }]);

      setCycleLogs((prevLogs) => [
        ...prevLogs,
        {
          cycle: prevLogs.length + 1,
          startWeight: remainingWeight,
          endWeight: newRemaining,
          dropRate: currentWeight,
        },
      ]);

      if (newRemaining === 0) setFeederDone(true);
    }
  }, [currentWeight]);

  const handleStart = () => {
    if (initialWeight) {
      if (wasReset) {
        alert("This is a new test after reset."); // ✅ Alert on new test
        setWasReset(false); // ✅ Reset flag after alert
      }

      setRemainingWeight(null);
      setFeederDone(false);
      setWeightData([{ weight: initialWeight }]);
      setCycleLogs([]);
      // sendStartCommand();
      publishMessage("weight/subscribe", "Start"); // ✅ Publish start command
      // console.log("Feeder started with initial weight:", initialWeight);

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
    setWasReset(true); // ✅ Set reset flag
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
            >
              Start Test
            </button>

            <button
              onClick={handleReset}
              className="px-2 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
