import React, { createContext, useEffect, useState } from "react";
import mqtt from "mqtt";

export const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [initialWeight, setInitialWeight] = useState(100);
  const [isFeederStarted, setIsFeederStarted] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect({
      hostname: "mqttbroker.bc-pl.com",
      port: 443,
      protocol: "wss",
      path: "/mqtt",
      username: "mqttuser",
      password: "Bfl@2025",
    });

    mqttClient.on("connect", () => {
      console.log("✅ MQTT connected");
      
      setIsConnected(true);
      mqttClient.subscribe("weight/1");
    });

    mqttClient.on("message", (topic, payload) => {
      const message = payload.toString();
      console.log(`📩 ${topic}: ${message}`);
      setMessages((prev) => [...prev, { topic, message }]);
    
      const numeric = parseFloat(message);
      if (!isNaN(numeric)) {
        setCurrentWeight(numeric);
      }
    });
    

    mqttClient.on("error", (err) => console.error("❌ MQTT error", err));
    mqttClient.on("close", () => setIsConnected(false));

    setClient(mqttClient);
    return () => mqttClient.end();
  }, []);


  // const sendStartCommand = () => {
  //   if (client && isConnected) {
  //     const topic = "weight/subscribe";  
  //     const payload = "Feeder Start";  
  //     client.publish(topic, payload);
  //     console.log("📤 Published: Feeder Start");
  
  //     // Subscribe to weight/1 topic for receiving updates after starting the feeder
  //     client.subscribe("weight/1", { qos: 1 });
  //     setIsFeederStarted(true);  // Set the flag to start receiving updates
  //   }
  // };

  const publishMessage = (topic, message) => {
    if (client && client.connected) {
      client.publish(topic, message);
      console.log(`🚀 Published to ${topic}:`, message);
    } else {
      console.warn("❌ MQTT client not connected");
    }
  };
  
  
  
  return (
    <MqttContext.Provider
      value={{
        isConnected,
        messages,
        currentWeight,
        initialWeight,
        setInitialWeight,
        // sendStartCommand,
        publishMessage
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};
