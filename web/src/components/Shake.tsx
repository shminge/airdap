type ShakePhase = 'starting' | 'ready' | 'waiting' | 'matched';

export default function Shake({ phase }: { phase: ShakePhase }) {
    return (
        <div className={`shake-card${phase === 'matched' ? ' matched' : ''}`}>
            {phase === 'starting' && (
                <>
                    <div className="block-loader">
                        <span /><span /><span />
                    </div>
                    <div className="phase-label">Connecting</div>
                </>
            )}

            {phase === 'ready' && (
                <>
                    <div className="shake-emoji">🤝</div>
                    <div className="phase-label">Shake!</div>
                    <div className="phase-sub">Hold your phone and shake hands with a friend</div>
                </>
            )}

            {phase === 'waiting' && (
                <>
                    <div className="block-loader">
                        <span /><span /><span />
                    </div>
                    <div className="phase-label">Searching...</div>
                    <div className="phase-sub">Shake again if needed</div>
                </>
            )}

            {phase === 'matched' && (
                <>
                    <div className="matched-check">✓</div>
                    <div className="phase-label">Match found!</div>
                    <div className="phase-sub">Establishing connection...</div>
                </>
            )}
        </div>
    );
}
