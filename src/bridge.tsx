import { useState } from 'react';
import { UserInterfaceMsg } from './Com'

interface WebSocketServerConfig {
  url: string;
  initial_message: UserInterfaceMsg;
  receive_callback_fn: (msg: UserInterfaceMsg) => void;
}

export async function begin_contact_websocket_server(config: WebSocketServerConfig) {
  const ws = new WebSocket(config.url);

  ws.onopen = () => {
    console.log('WebSocket connection opened.');
    ws.send(JSON.stringify(config.initial_message));
  };

  ws.onmessage = (event) => {
    try {
      const parsedMessage: UserInterfaceMsg = JSON.parse(event.data);
      config.receive_callback_fn(parsedMessage);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
  };

  ws.onerror = (event) => {
    console.error('WebSocket error:', event);
  };
}
