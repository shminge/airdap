# AirDap

Share files between phones by physically shaking hands.

*Built in 48 hours for UniHack 2026.*


## Motivation & Other Stuff
Non-technical details can be found on the Devpost submission page (TODO Add link). If you want to know a bit more about how it works, however, then scroll down.


## How it works on a high level

1. Both people open the site on their phones and press the Start button
2. Each phone begins sampling its accelerometer
3. They shake hands with their phones, and the phones record the motion during the shake
4. Both phones send their motion snippets to the signaling server
5. The server compares the two signals, and if they correlate above a threshold, the pair is matched
6. A direct peer-to-peer WebRTC connection is established between the two phones
7. Files are transferred over the WebRTC connection, meaning the server never handles file data

## Gesture matching

The core technical challenge is matching a particular handshake from other people shaking hands nearby at the same time. The algorithm runs on the server in `server/compare.js`:

- Each phone samples accelerometer output at ~60 Hz for the duration of the shake, recording `{x, y, z}` acceleration per frame.

- Four signals are derived from the raw samples:
    - Vector magnitude: `sqrt(x² + y² + z²)`
    - The three individual axes: `x`, `y`, `z`

- All signals are resampled to a fixed 64-point length using nearest-neighbour interpolation. This makes the comparison length-independent, so it doesn't matter if one phone only recorded 40 frames when the other recorded 55.

- Each signal is z-score normalised by subtracting the mean, and dividing by the standard deviation. This removes differences in shake intensity (as different phones may have different sensitivity levels), so only the shape of the motion is compared.

- The correlation coefficient is computed between each of the four signal pairs. The maximum correlation across all four signals is taken.

- If the max correlation out of the pairwise x, y, z, and the magnitude signals exceed 0.75, the handshakes are considered a match. Using the max across four signals means a match succeeds if any axis captured the shared motion clearly, which makes it robust to the fact that people hold their phones differently.

## Architecture Diagrams (courtesy of Claude)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Fly.io (iad)                             │
│                                                                 │
│   server/server.js — Node.js WebSocket server                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  sessions map   connections map   pending map            │  │
│   │  compare()      getTurnCredentials() → Metered API       │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲ WebSocket (wss://)               ▲ WebSocket (wss://)
         │                                  │
  ┌──────┴──────┐                    ┌──────┴──────┐
  │   Phone A   │◄══ RTCDataChannel ═►   Phone B   │
  │  (offerer)  │     (P2P / TURN)   │  (answerer) │
  └─────────────┘                    └─────────────┘
```

### Signaling flow

```
Phone A (offerer)          Server              Phone B (answerer)
     │                       │                       │
     │─── handshake-data ───►│                       │
     │                       │◄── handshake-data ────│
     │                       │   [compare() → match] │
     │◄── match-success ─────│                       │
     │{offerer, iceServers}  │──── match-success ───►│
     │                       │ {answerer, iceServers}│
     │                       │                       │
     │─── sdp-offer ─────────►──── sdp-offer ───────►│
     │◄── sdp-answer ─────────◄─── sdp-answer ───────│
     │─── ice-candidate ─────►──── ice-candidate ───►│
     │◄── ice-candidate ──────◄─── ice-candidate ────│
     │                       │                       │
     │◄══════════════ data channel open (P2P) ══════►│
```

We fetch TURN credentials from Metered server-side when a match occurs and send them both peers in the `match-success` message. This avoids embedding credentials in client code and ensures fresh short-lived credentials
## Stack
- **Frontend:**  React + TypeScript, Vite
- **Styling:** Vanilla CSS
- **Font:**  Space Grotesk
- **Server:**  Node.js, `ws`
- **Hosting:** Fly.io (server) + GitHub Pages (frontend)
- **P2P transport:**  WebRTC `RTCDataChannel`
- **TURN relay:**  Metered.ca  


