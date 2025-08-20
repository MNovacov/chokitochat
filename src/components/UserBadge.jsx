import React from 'react';

const UserBadge = ({ name, isOnline, showStatus }) => {
  return (
    <div className="user-badge">
      <span>{name}</span>
      {showStatus && isOnline && <span className="online-dot"></span>}
    </div>
  );
};

export default UserBadge;
