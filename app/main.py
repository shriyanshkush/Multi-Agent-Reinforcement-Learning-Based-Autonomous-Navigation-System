import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json
from app.train import run_simulation_stream

app = FastAPI(title="MARL Autonomous Production Studio 🚀")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "MARL Backend Studio Running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected ✅")

    simulation_task = None
    state = {"paused": False, "running": False}

    async def run_sim_task(config):
        state["running"] = True
        try:
            async for data in run_simulation_stream(config):
                while state["paused"] and state["running"]:
                    await asyncio.sleep(0.1)
                if not state["running"]:
                    break
                await websocket.send_json(data)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print("Error during simulation stream:", e)
        finally:
            state["running"] = False

    try:
        # Start default simulation on connect after short delay if client doesn't send immediate config
        default_config = {
            "algorithm": "q_learning",
            "exploration": "epsilon_greedy",
            "team_mode": "independent",
            "grid_size": 5,
            "num_agents": 3,
            "episodes": 25,
            "steps": 50,
            "delay": 0.15,
            "obstacles": "standard",
            "lr": 0.1,
            "gamma": 0.9,
            "epsilon": 0.5,
            "epsilon_decay": 0.98
        }
        simulation_task = asyncio.create_task(run_sim_task(default_config))

        while True:
            raw_message = await websocket.receive_text()
            try:
                message = json.loads(raw_message)
                command = message.get("command")

                if command == "start":
                    if simulation_task and not simulation_task.done():
                        state["running"] = False
                        simulation_task.cancel()
                        await asyncio.sleep(0.05)
                    state["paused"] = False
                    config = message.get("config", default_config)
                    simulation_task = asyncio.create_task(run_sim_task(config))
                elif command == "pause":
                    state["paused"] = True
                elif command == "resume":
                    state["paused"] = False
                elif command == "stop":
                    state["running"] = False
                    if simulation_task and not simulation_task.done():
                        simulation_task.cancel()
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        print("Client disconnected ❌")
    except Exception as e:
        print("WebSocket endpoint closed:", e)
    finally:
        state["running"] = False
        if simulation_task and not simulation_task.done():
            simulation_task.cancel()

# Mount dashboard static files (serves index.html at root / and /dashboard)
app.mount("/dashboard", StaticFiles(directory="marl-dashboard", html=True), name="dashboard")
app.mount("/", StaticFiles(directory="marl-dashboard", html=True), name="root")