
type PacketData = {};
let socket: WebSocket | null = null;

export function connect(url: string): void {
    if (socket?.readyState === WebSocket.OPEN) return;

    socket = new WebSocket(url);

    socket.onopen = () => console.log("WebSocket connected");
    socket.onclose = () => console.log("WebSocket disconnected");
    socket.onerror = (err) => console.error("WebSocket error:", err);
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handlePacket(data);
    };
}

export function sendPacket(data: PacketData): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("WebSocket is not connected");
        return;
    }
    socket.send(JSON.stringify(data));
}

function handlePacket(data: PacketData): void {
    // handle incoming packets
}