import { useRef, useState } from "react";
import { startMotion } from "../logic/motion";
import { makeSnippetDetector, snippetToPacketData } from "../logic/spike";
import { sendPacket, connect } from "../domain/connect";
import { setupWebRTC } from "../domain/webrtc";
import { usePacketListener } from "../domain/usePacketListener";
import Shake from "./Shake";
import Start from "./Start";

const WS_URL = "wss://handshake-iv6dtq.fly.dev";

type Phase = 'idle' | 'starting' | 'ready' | 'waiting' | 'matched' | 'error';

export default function Pending({ onConnected }: { onConnected: (ch: RTCDataChannel) => void }) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [error, setError] = useState('');
    const phaseRef = useRef<Phase>('idle');

    const updatePhase = (p: Phase) => {
        phaseRef.current = p;
        setPhase(p);
    };

    // eslint-disable-next-line
    usePacketListener(async (msg: any) => {
        if (msg.type === 'waiting' && phaseRef.current === 'ready') {
            updatePhase('waiting');
        } else if (msg.type === 'match-success') {
            updatePhase('matched');
            try {
                const channel = await setupWebRTC(msg.role, msg.iceServers ?? undefined);
                onConnected(channel);
            } catch (err) {
                setError(String(err));
                updatePhase('error');
            }
        }
    });

    const handleStart = async () => {
        updatePhase('starting');
        try {
            // eslint-disable-next-line
            const DME = DeviceMotionEvent as any;
            if (typeof DME.requestPermission === "function") {
                const permission = await DME.requestPermission();
                if (permission !== "granted") {
                    setError("Motion permission denied");
                    updatePhase('error');
                    return;
                }
            }

            await connect(WS_URL);

            const detector = makeSnippetDetector(12);
            await startMotion(({ x, y, z }) => {
                const snippet = detector(x, y, z);
                if (snippet && phaseRef.current !== 'matched') {
                    sendPacket(snippetToPacketData(snippet));
                    if (phaseRef.current === 'ready') updatePhase('waiting');
                }
            });

            updatePhase('ready');
        } catch (err) {
            setError(String(err));
            updatePhase('error');
        }
    };

    const canStart = phase === 'idle' || phase === 'error';

    return (
        <div style={{ width: '100%' }}>
            {canStart ? (
                <>
                    {phase === 'error' && (
                        <div className="error-tag" style={{ marginBottom: 12 }}>
                            Error: {error}
                        </div>
                    )}
                    <Start onStart={handleStart} />
                </>
            ) : (
                <Shake phase={phase as 'starting' | 'ready' | 'waiting' | 'matched'} />
            )}
        </div>
    );
}
