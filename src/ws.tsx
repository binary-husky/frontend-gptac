import React, { useState, useEffect, useCallback } from 'react';

// Define the UserInterfaceMsg schema
interface UserInterfaceMsg {
  src: string;
  dst: string;
  command: string;
}

const useWebSocket = (url: string) => {
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket
    const ws = new WebSocket(url);
    setSocket(ws);
    setConnectionStatus('Connecting');

    ws.onopen = () => setConnectionStatus('Connected');
    ws.onclose = () => setConnectionStatus('Disconnected');
    ws.onerror = () => setConnectionStatus('Error');
    ws.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: UserInterfaceMsg) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.error('WebSocket is not connected.');
      }
    },
    [socket],
  );

  return { connectionStatus, sendMessage };
};

export default useWebSocket;
