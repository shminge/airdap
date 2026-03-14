import { useState } from "react"
import { startMotion } from "../logic/motion"
import {makeSnippetDetector, snippetToPacketData} from "../logic/spike"
import {sendPacket} from "../domain/connect.ts";

export default function Pending() {
    const [enabled, setEnabled] = useState(false)

    const handleStart = async () => {
        try {
            const snippetDetector = makeSnippetDetector(15)

            await startMotion(({ x, y, z }) => {
                const snippet = snippetDetector(x, y, z)
                if (snippet) {
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
        </div>
    )
}