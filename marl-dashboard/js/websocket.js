let socket = null;
let reconnectTimer = null;

function getWebSocketURL() {
    if (window.location.protocol === "file:") {
        return "ws://localhost:8000/ws";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
}

function connectWebSocket(onInitCallback, onStepCallback, onEpisodeEndCallback) {
    const wsUrl = getWebSocketURL();
    console.log("Connecting to WebSocket stream:", wsUrl);

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
    }

    socket = new WebSocket(wsUrl);
    const statusBadge = document.getElementById('connectionStatus');

    socket.onopen = () => {
        statusBadge.innerHTML = '<span class="status-dot"></span> Live Connected';
        statusBadge.className = "status-badge status-connected";
        console.log("WebSocket stream network online ✅");
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "init") {
                if (onInitCallback) onInitCallback(data);
            } else if (data.type === "step") {
                if (onStepCallback) onStepCallback(data);
            } else if (data.type === "episode_end") {
                if (onEpisodeEndCallback) onEpisodeEndCallback(data);
            }
        } catch (err) {
            console.error("Error processing framework data packet:", err);
        }
    };

    socket.onclose = () => {
        statusBadge.innerHTML = '<span class="status-dot"></span> Disconnected';
        statusBadge.className = "status-badge status-disconnected";
        console.log("WebSocket connection closed ❌. Attempting reconnect in 3s...");
        reconnectTimer = setTimeout(() => connectWebSocket(onInitCallback, onStepCallback, onEpisodeEndCallback), 3000);
    };

    socket.onerror = (error) => {
        console.error("WebSocket pipeline hit an error:", error);
    };
}

function sendWebSocketCommand(command, config = null) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = { command };
        if (config) payload.config = config;
        socket.send(JSON.stringify(payload));
    } else {
        console.warn("Cannot send command, socket is not open. Command:", command);
    }
}