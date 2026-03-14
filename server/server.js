import { WebSocketServer } from 'ws';
import { compare } from "./compare";

// Create web sockets registry

// Create attempted connections registry

// Create signal backlog
const PURGE_TIME = 10_000;
const pending = new Map();

function purge() {
    const cutoff = Date.now() - PURGE_TIME;
    for (const [id, entry] of pending) {
        if (entry.timestamp < cutoff) pending.delete(id);
    }
}

function findMatch(incomingSignal) {
    for (const [id, entry] of pending) {
        if (compare(entry.signal, incomingSignal)) return id;
    }
    return null;
}

// Create web socket server
const port = 1234
const server = new WebSocketServer({
    port: port
});

function messageSocket() {
    
}

// Handle events
server.on("connection", (socket) => {
    const id = crypto.randomUUID;
    console.log(`Client connected: ${id}`);
    console.log(`Socket URL: ${socket.url}`);

    // Add socket to registry?

    socket.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            socket.send(JSON.stringify({ error: 'Invalid JSON' }));
            return;
        }

        if (msg.type == "handshake-data") {
            // Search for matches
            // If none, add
            // If matched, create pair and message back about ice-candidacy
        }
    })

    socket.on("close", () => {
        // Remove all trace of this id (pending, connections, etc)
    })
});


/*
const server = new WebSocketServer({ port: 1234 });

const pending = new Map();   // waiting for a match
const sessions = new Map();  // id -> peerId, for matched pairs

const PURGE_AFTER_MS = 30_000;

function compare(signal1, signal2) {
    return false;
}

function purgeOld() {
    const cutoff = Date.now() - PURGE_AFTER_MS;
    for (const [id, entry] of pending) {
        if (entry.timestamp < cutoff) pending.delete(id);
    }
}

function findMatch(incomingSignal) {
    for (const [id, entry] of pending) {
        if (compare(entry.signal, incomingSignal)) return id;
    }
    return null;
}

server.on('connection', (socket) => {
    const id = crypto.randomUUID();
    console.log(`Client connected: ${id}`);

    socket.on('message', (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            socket.send(JSON.stringify({ error: 'Invalid JSON' }));
            return;
        }

        // --- ICE candidate relay ---
        // Once matched, peers send candidates that the server forwards to their peer
        if (msg.type === 'ice-candidate') {
            const peerId = sessions.get(id);
            const peer = pending.get(peerId); // reuse pending as a socket store post-match
            if (peer) {
                peer.socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: msg.candidate,
                }));
            }
            return;
        }

        // --- SDP answer relay ---
        // Peer B sends their answer back to Peer A via the server
        if (msg.type === 'sdp-answer') {
            const peerId = sessions.get(id);
            const peer = pending.get(peerId);
            if (peer) {
                peer.socket.send(JSON.stringify({
                    type: 'sdp-answer',
                    sdp: msg.sdp,
                }));
            }
            return;
        }

        // --- Initial signal / matchmaking ---
        purgeOld();
        const matchId = findMatch(msg.signal);

        if (matchId) {
            const match = pending.get(matchId);
            pending.delete(matchId);

            // Track who is paired with whom
            sessions.set(id, matchId);
            sessions.set(matchId, id);

            // Keep sockets accessible for relaying ICE candidates
            pending.set(id, { socket });
            pending.set(matchId, { socket: match.socket });

            // Each peer gets the other's SDP offer so they can respond
            socket.send(JSON.stringify({
                type: 'matched',
                role: 'answerer',      // this peer should create an SDP answer
                offer: match.signal,  // peer A's SDP offer
            }));
            match.socket.send(JSON.stringify({
                type: 'matched',
                role: 'offerer',      // this peer waits for an SDP answer
                offer: msg.signal,    // peer B's SDP offer (may be useful for renegotiation)
            }));
        } else {
            pending.set(id, { socket, signal: msg.signal, timestamp: Date.now() });
            socket.send(JSON.stringify({ type: 'waiting' }));
        }
    });

    socket.on('close', () => {
        pending.delete(id);
        sessions.delete(id);
        console.log(`Client disconnected: ${id}`);
    });
});

console.log('WebSocket server running on ws://localhost:1234');
*/