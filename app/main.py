from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.train import run_simulation_stream

app = FastAPI(title="MARL Backend 🚀")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "MARL Backend Running"}

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()

#     num_agents = 3
#     episodes = 10

#     async for data in run_simulation_stream(num_agents, episodes):
#         await websocket.send_json(data)

#     await websocket.close()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected ✅")

    num_agents = 3
    episodes = 10

    try:
        async for data in run_simulation_stream(num_agents, episodes):
            await websocket.send_json(data)

    except Exception as e:
        print("Error:", e)

    print("Client disconnected ❌")