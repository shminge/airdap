import http from "http";
import crypto from "crypto";
import { WebSocketServer } from "ws";
import { compare } from "./compare.js";

// registries
const sessions = new Map();
const connections = new Map();

const PURGE_TIME = 3_000;
const pending = new Map();

function purge() {
    const cutoff = Date.now() - PURGE_TIME;
    for (const [id, entry] of pending) {
        if (entry.timestamp < cutoff) pending.delete(id);
    }
}

function findMatch(pid, incomingSignal) {
    for (const [id, entry] of pending) {
        if (id != pid && compare(entry.signal, incomingSignal)) return id;
    }
    return null;
}

function send(socket, msg) {
    if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(msg));
    }
}

// Fetch short-lived TURN credentials from Metered.
// Returns an iceServers array, or null on error.
async function getTurnCredentials() {
    const apiKey = process.env.METERED_API_KEY;
    try {
        const res = await fetch(
            `https://airdap.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
        );
        if (!res.ok) {
            console.error("TURN credential fetch failed:", res.status);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error("TURN credential error:", err);
        return null;
    }
}

// server setup
const port = 3000; // to match fly.io deployment

const httpServer = http.createServer();

const wss = new WebSocketServer({
    server: httpServer
});

httpServer.listen(port, "0.0.0.0", () => {
    console.log(`WebSocket server listening on 0.0.0.0:${port}`);
});

// connection handling
wss.on("connection", (socket) => {
    const id = crypto.randomUUID();
    console.log(`Client connected: ${id}`);

    connections.set(id, socket);

    socket.on("message", async (raw) => {
        let msg;

        try {
            msg = JSON.parse(raw);
        } catch {
            send(socket, { error: "Invalid JSON" });
            return;
        }

        let peerId, peerSocket;

        switch (msg.type) {
            case "handshake-data": {
                purge();

                const signal = msg.samples ?? msg.mag;

                if (signal == null) {
                    send(socket, { error: "Invalid data provided." });
                    return;
                }

                const matchId = findMatch(id, signal);

                if (matchId == null) {
                    pending.set(id, {
                        signal,
                        timestamp: Date.now()
                    });

                    send(socket, {
                        type: "waiting",
                        message: "Waiting for a peer..."
                    });

                } else {
                    pending.delete(matchId);

                    sessions.set(id, matchId);
                    sessions.set(matchId, id);

                    const matchSocket = connections.get(matchId);

                    // Fetch TURN credentials once and share with both peers.
                    const iceServers = await getTurnCredentials();

                    send(matchSocket, {
                        type: "match-success",
                        role: "offerer",
                        iceServers,
                    });

                    send(socket, {
                        type: "match-success",
                        role: "answerer",
                        iceServers,
                    });
                }

                break;
            }

            case "sdp-offer": {
                peerId = sessions.get(id);
                peerSocket = connections.get(peerId);

                if (peerSocket) {
                    send(peerSocket, {
                        type: "sdp-offer",
                        sdp: msg.sdp
                    });
                }

                break;
            }

            case "sdp-answer": {
                peerId = sessions.get(id);
                peerSocket = connections.get(peerId);

                if (peerSocket) {
                    send(peerSocket, {
                        type: "sdp-answer",
                        sdp: msg.sdp
                    });
                }

                break;
            }

            case "ice-candidate": {
                peerId = sessions.get(id);
                peerSocket = connections.get(peerId);

                if (peerSocket) {
                    send(peerSocket, {
                        type: "ice-candidate",
                        candidate: msg.candidate
                    });
                }

                break;
            }

            default:
                send(socket, {
                    error: `Unknown message type: ${msg.type}`
                });
        }
    });

    socket.on("close", () => {
        const peerId = sessions.get(id);

        if (peerId) {
            const peerSocket = connections.get(peerId);

            if (peerSocket) {
                send(peerSocket, {
                    type: "peer-disconnected"
                });
            }

            sessions.delete(peerId);
        }

        sessions.delete(id);
        connections.delete(id);
        pending.delete(id);
    });
});
