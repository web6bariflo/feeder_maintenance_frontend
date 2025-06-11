import React, { createContext, useEffect, useState } from "react";
import mqtt from "mqtt";

export const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [initialWeight, setInitialWeight] = useState(100);
  const [topicMessages, setTopicMessages] = useState({}); // ✅ Added topic-wise state

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

      const topics = [
        "feeder/fdtryA00/maintenance/status",
      ];

      topics.forEach((topic) => {
        mqttClient.subscribe(topic, (err) => {
          if (!err) {
            console.log(`📡 Subscribed to: ${topic}`);
          }
        });
      });

      setIsConnected(true); // ✅ Ensure we set connected status
    });

    mqttClient.on("message", (topic, payload) => {
      const message = payload.toString();
      console.log(`📩 ${topic}: ${message}`);

      // Keep full message history (optional)
      setMessages((prev) => [...prev, { topic, message }]);

      // ✅ Store latest message by topic
      setTopicMessages((prev) => ({
        ...prev,
        [topic]: message,
      }));

      // ✅ Only update currentWeight for "weight/1"
      if (topic === "weight/1") {
        const numeric = parseFloat(message);
        if (!isNaN(numeric)) {
          setCurrentWeight(numeric);
        }
      }
    });

    mqttClient.on("error", (err) => console.error("❌ MQTT error", err));
    mqttClient.on("close", () => setIsConnected(false));

    setClient(mqttClient);
    return () => mqttClient.end();
  }, []);

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
        publishMessage,
        topicMessages, // ✅ Expose topic-wise message access
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};
