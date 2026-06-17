interface StageChainProps {
  stages: string[]
  currentIndex: number
  color: string
  onStageClick?: (index: number) => void
  compact?: boolean
}

export function StageChain({ stages, currentIndex, color, onStageClick, compact = false }: StageChainProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6, alignItems: 'center' }}>
      {stages.map((stage, idx) => {
        const done = idx < currentIndex
        const current = idx === currentIndex
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: compact ? 4 : 6 }}>
            <button
              onClick={() => onStageClick?.(idx)}
              title={stage}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: compact ? '3px 8px' : '5px 12px',
                borderRadius: 4,
                fontSize: compact ? 11 : 13,
                fontWeight: current ? 700 : 500,
                cursor: onStageClick ? 'pointer' : 'default',
                border: `1.5px solid ${done || current ? color : '#d1c5b4'}`,
                background: done ? color : current ? `${color}18` : '#f5f0ea',
                color: done ? '#fff' : current ? color : '#8c7b6a',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                maxWidth: compact ? 120 : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {done && <span style={{ fontSize: compact ? 10 : 12 }}>✓</span>}
              {!compact && <span>{stage}</span>}
              {compact && <span title={stage}>{idx + 1}</span>}
            </button>
            {idx < stages.length - 1 && (
              <span style={{ color: '#c9b99a', fontSize: compact ? 10 : 12, userSelect: 'none' }}>›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
