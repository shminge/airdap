export default function Start({ onStart }: { onStart: () => void }) {
    return (
        <div className="start-section">
            <h1>How it works</h1>
            <ol className="start-steps">
                <li>
                    <span className="step-num">1</span>
                    Press start and allow motion access
                </li>
                <li>
                    <span className="step-num">2</span>
                    Shake hands with your friend's phone
                </li>
                <li>
                    <span className="step-num">3</span>
                    Share files instantly
                </li>
            </ol>
            <button className="start-btn" onClick={onStart}>
                Start
            </button>
        </div>
    );
}
