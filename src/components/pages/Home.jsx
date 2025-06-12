import React from 'react';
import  { useContext } from 'react'
import { MqttContext } from "../../mqtt/MqttPublisher";

const Home = () => {
     const { publishMessage } = useContext(MqttContext);

    const handleClick = () => {
    publishMessage("feeder/fdtryA00/maintenance_request", "Start");
  };
    return (<>
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
    </>
    )
}

export default Home