'use client';

interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

interface PresenceIndicatorProps {
  users?: PresenceUser[];
}

const DEFAULT_USERS: PresenceUser[] = [
  { id: '1', name: 'Alice Chen', color: '#6366f1' },
  { id: '2', name: 'Bob Kim', color: '#22c55e' },
  { id: '3', name: 'Carol Davis', color: '#f59e0b' },
];

export default function PresenceIndicator({ users = DEFAULT_USERS }: PresenceIndicatorProps) {
  const displayUsers = users.slice(0, 5);
  const extra = users.length - displayUsers.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ display: 'flex' }}>
        {displayUsers.map((user, i) => (
          <div
            key={user.id}
            title={user.name}
            style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: user.color,
              border: '2px solid #0f1120',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 700, color: '#fff',
              marginLeft: i === 0 ? 0 : '-8px',
              zIndex: displayUsers.length - i,
              position: 'relative',
              cursor: 'default',
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid #0f1120',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8',
            marginLeft: '-8px',
            position: 'relative',
          }}>
            +{extra}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{users.length} online</span>
      </div>
    </div>
  );
}
