import { useRef, useEffect, useState } from "react"
import { startMotion } from "../logic/motion"
import {makeSnippetDetector, type Snippet, snippetToPacketData} from "../logic/spike"
import {sendPacket} from "../domain/connect.ts";

export default function Pending() {
    const [enabled, setEnabled] = useState(false)
    const [lastSnippet, setLastSnippet] = useState<Snippet | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const formatTime = (ts: number) => {
        const d = new Date(ts)
        const ms = String(d.getMilliseconds()).padStart(3, "0")
        const s = String(d.getSeconds()).padStart(2, "0")
        const m = String(d.getMinutes()).padStart(2, "0")
        const h = String(d.getHours()).padStart(2, "0")
        return `${h}:${m}:${s}.${ms}`
    }

    useEffect(() => {
        if (!lastSnippet || !canvasRef.current) return
        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        const width = canvasRef.current.width
        const height = canvasRef.current.height

        ctx.clearRect(0, 0, width, height)

        // fixed y-scale 0 -> 40
        ctx.beginPath()
        lastSnippet.forEach((s, i) => {
            const x = (i / lastSnippet.length) * width
            const y = height - (Math.min(s.magnitude, 40) / 40) * height
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        })
        ctx.strokeStyle = "blue"
        ctx.lineWidth = 2
        ctx.stroke()
    }, [lastSnippet])

    const handleStart = async () => {
        try {
            const snippetDetector = makeSnippetDetector(15)

            await startMotion(({ x, y, z }) => {
                const snippet = snippetDetector(x, y, z)
                if (snippet) {
                    setLastSnippet(snippet)
                    sendPacket(snippetToPacketData(snippet))
                }
            })

            setEnabled(true)
        } catch (err) {
            alert(err)
        }
    }

    return (
        <div>
            <button onClick={handleStart} disabled={enabled}>
                {enabled ? "Motion Enabled" : "Start Motion"}
            </button>

            <canvas
                ref={canvasRef}
                width={400}
                height={150}
                style={{ border: "1px solid #ccc" }}
            />

            {lastSnippet && (
                <div style={{ textAlign: "center", marginTop: "4px", fontFamily: "monospace", fontSize: "12px" }}>
                    {formatTime(lastSnippet[0].time)} – {formatTime(lastSnippet[lastSnippet.length - 1].time)}
                </div>
            )}
        </div>
    )
}