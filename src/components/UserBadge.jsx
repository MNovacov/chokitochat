export default function UserBadge({ name, isOnline, showStatus = false }) {
    return (
      <div className="user-badge">
        <span className={`pixel-status ${isOnline ? 'online' : 'offline'}`} />
        <span className="pixel-username">{name}</span>
        {showStatus && (
          <span className="pixel-status-text">
            {isOnline ? 'ON' : 'OFF'}
          </span>
        )}
      </div>
    );
  }