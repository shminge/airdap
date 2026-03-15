

export default function Start(
    {onStart}: {onStart: () => {}}
) {
    return <div className="start-section">
        <div>
            <h1>
                How it works
            </h1>
            <ol>
                <li>Press start and allow motion access</li>
                <li>Handshake phones with your friend</li>
                <li>Share files</li>
            </ol>
        </div>
        <button onClick={onStart}>
            <span>
                Start
            </span>
        </button>
    </div>
}