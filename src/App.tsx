import { useState } from 'react'
import useWebSocket from './ws';
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'


interface UserInterfaceMsg {
  src: string;
  dst: string;
  command: string;
}

function App() {
  const [count, setCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState(0)
  const [url, setUrl] = useState('ws://localhost:28000/main');
  const [socket, setSocket] = useState<WebSocket | null>(null);

  async function send_and_wait_remote(url:string) {
    const ws = new WebSocket(url);
    setSocket(ws);
    ws.onopen = (event) => {
      console.log('onopen');
      const message: UserInterfaceMsg = {
        src: '1',
        dst: '22',
        command: '333'
      };
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.error('WebSocket is not connected.');
      }
    };
    ws.onclose = (event) => {
      console.log('onclose');
    };
    ws.onerror = (event) => {
      console.log('onerror');
    };
    ws.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };
  }

  return (
    <div className='App'>
      <div className='logo-box'>
        <a href='https://github.com/electron-vite/electron-vite-react' target='_blank'>
          <img src={logoVite} className='logo vite' alt='Electron + Vite logo' />
          <img src={logoElectron} className='logo electron' alt='Electron + Vite logo' />
        </a>
      </div>
      <h1>Electron + Vite + React</h1>
      <div className='card'>
        <button onClick={() => send_and_wait_remote(url)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
      </p>
      <div className='card'>
        <p>WebSocket Status: {connectionStatus}</p>
      </div>
      </div>
      <p className='read-the-docs'>
        Click on the Electron + Vite logo to learn more
      </p>
      <div className='flex-center'>
        Place static files into the<code>/public</code> folder <img style={{ width: '5em' }} src='./node.svg' alt='Node logo' />
      </div>

      <UpdateElectron />
    </div>
  )
}

export default App