import uuid
import json
import platform
import pickle
import asyncio
import threading
import traceback
from loguru import logger
from queue import Queue
from fastapi import FastAPI, WebSocket
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field
from enum import auto, Enum
from typing import List

class FutureEvent(threading.Event):
    def __init__(self) -> None:
        super().__init__()
        self.return_value = None

    def terminate(self, return_value):
        self.return_value = return_value
        self.set()

    def wait_and_get_result(self):
        self.wait()
        return self.return_value


# class UserInterfaceMsg_Command(Enum):
#     # matrix -> ue
#     connect_to_matrix   =  "connect_to_matrix"

#     # ue -> matrix
#     update_script       =  "update_script"
#     update_location     =  "update_location"
#     play_event          =  "play_event"
#     parent_play_event   =  "parent_play_event"
#     create_agent        =  "create_agent"
#     agent_activate      =  "agent_activate"
#     duplicate_agent     =  "duplicate_agent"
#     connect_agent       =  "connect_agent"
#     disconnect_agent    =  "disconnect_agent"

#     update_agents       =  "update_agents"


class UserInterfaceMsg(BaseModel):
    src: str = Field(default="")
    dst: str = Field(default="")
    command: str = Field(default="")
    realtime: bool =  Field(default=True)
    debug: str = Field(default="")


async def simple_task_demo(queue_blocking_from_client:asyncio.Queue, queue_back_to_client:asyncio.Queue):
    try:
        def update_ui(debug, realtime=True):
            queue_back_to_client.put_nowait(UserInterfaceMsg(
                debug=debug, realtime=realtime
            ))
        async def get_feedback():
            feedback = await queue_blocking_from_client.get()
            return feedback
        update_ui(debug="1 Starting simple task demo...")
        await asyncio.sleep(5)  # Simulate some delay
        update_ui(debug="2 Starting simple task demo...", realtime=False)
        await asyncio.sleep(2)  # Simulate some delay
        feedback = await get_feedback()
        await asyncio.sleep(2)  # Simulate some delay
        update_ui(debug=str(feedback))
    except Exception as e:
        logger.exception(f"Error in simple_task_demo: {e}")
        raise e


class PythonMethod_AsyncConnectionMaintainer_AgentcraftInterface():

    def make_queue(self):
        """
        Creates a message queue for the specified agentcraft interface and updates the connection information.

        Args:
            agentcraft_interface (str): The name of the agentcraft interface.
            websocket: The websocket connection object.
            client_id: The ID of the client.

        Returns:
            tuple: A tuple containing the message queue for outgoing messages, the message queue for incoming messages, and the agentcraft proxy object.
        """
        queue_back_to_client = asyncio.Queue()
        queue_realtime_from_client = asyncio.Queue()
        queue_blocking_from_client = asyncio.Queue()
        return queue_back_to_client, queue_realtime_from_client, queue_blocking_from_client

    async def maintain_connection_forever(self, initial_msg: UserInterfaceMsg, websocket: WebSocket, client_id: str):

        async def wait_message_to_send(queue_back_to_client: asyncio.Queue):
            # 🕜 wait message to send away -> front end
            msg_cnt = 0
            try:
                while True:
                    msg: UserInterfaceMsg = await queue_back_to_client.get()
                    msg_cnt += 1
                    await websocket.send_bytes(msg.model_dump_json())
            except Exception as e:
                logger.exception(f"Error in wait_message_to_send: {e}")
                raise e

        async def receive_forever(queue_realtime_from_client: asyncio.Queue, queue_blocking_from_client: asyncio.Queue, queue_back_to_client: asyncio.Queue):
            # 🕜 keep listening traffic <- front end
            msg_cnt:int = 0
            try:
                while True:
                    msg: UserInterfaceMsg = UserInterfaceMsg.model_validate_json(await websocket.receive_text())
                    msg_cnt += 1
                    logger.info(f"Received message {msg_cnt}: {msg}")
                    if msg.realtime:
                        # queue_realtime_from_client 好像没啥用呀，不过还是暂时留着吧
                        ...
                    else:
                        # blocking message, put it into the queue
                        queue_blocking_from_client.put_nowait(msg)
            except Exception as e:
                logger.exception(f"Error in receive_forever: {e}")
                raise e

        queue_back_to_client, queue_realtime_from_client, queue_blocking_from_client = self.make_queue()
        t_x = asyncio.create_task(wait_message_to_send(queue_back_to_client))
        t_r = asyncio.create_task(receive_forever(queue_realtime_from_client, queue_blocking_from_client, queue_back_to_client))
        t_z = asyncio.create_task(simple_task_demo(queue_blocking_from_client, queue_back_to_client))
        await t_x
        await t_r
        await t_z




class MasterMindWebSocketServer(PythonMethod_AsyncConnectionMaintainer_AgentcraftInterface):

    def __init__(self, host, port) -> None:
        self.websocket_connections = {}
        self.agentcraft_interface_websocket_connections = {}
        self._event_hub = {}
        self.host= host
        self.port = port
        pass

    def create_event(self, event_name: str):
        self._event_hub[event_name] = FutureEvent()
        return self._event_hub[event_name]

    def terminate_event(self, event_name: str, msg:UserInterfaceMsg):
        self._event_hub[event_name].terminate(return_value = msg)
        return

    async def long_task_01_wait_incoming_connection(self):
        # task 1 wait incoming agent connection
        logger.info("task 1 wait incoming agent connection")

        async def launch_websocket_server():
            app = FastAPI()
            @app.websocket("/main")
            async def main(websocket: WebSocket):
                try:
                    await websocket.accept()
                    logger.info(f"WebSocket connection established: {websocket.client.host}:{websocket.client.port}")
                    msg: UserInterfaceMsg = UserInterfaceMsg.model_validate_json(await websocket.receive_text())
                    logger.info(msg)
                    await self.maintain_connection_forever(msg, websocket, "client_id")
                except:
                    logger.exception("Error in WebSocket connection handler")
                    await websocket.close()
            import uvicorn
            config = uvicorn.Config(app, host=self.host, port=self.port, log_level="error", ws_ping_interval=300, ws_ping_timeout=600)
            server = uvicorn.Server(config)
            logger.info(f"uvicorn begin, serving at ws://{self.host}:{self.port}/main")
            await server.serve()

        await launch_websocket_server()
        logger.info("uvicorn terminated")

if __name__ == "__main__":
    mmwss = MasterMindWebSocketServer(host="0.0.0.0", port=28000)
    asyncio.run(mmwss.long_task_01_wait_incoming_connection())