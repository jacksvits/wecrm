import { useState } from 'react';

interface AvatarProps {
  name: string;
  avatar?: string | null;
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar({ name, avatar, size = 32, style }: AvatarProps) {
  const [error, setError] = useState(false);

  if (avatar && !error) {
    return (
      <img
        src={avatar}
        alt={name}
        onError={() => setError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  // Fallback to initials
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const colors = [
    { bg: '#e8f5e9', text: '#2e7d32' },
    { bg: '#e3f2fd', text: '#1565c0' },
    { bg: '#fff3e0', text: '#ef6c00' },
    { bg: '#fce4ec', text: '#c62828' },
    { bg: '#f3e5f5', text: '#7b1fa2' },
    { bg: '#e0f2f1', text: '#00695c' },
    { bg: '#fff8e1', text: '#f57f17' },
    { bg: '#eceff1', text: '#455a64' },
  ];
  const colorIdx = name?.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) || 0;
  const color = colors[colorIdx % colors.length];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color.bg,
        color: color.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.45,
        fontWeight: 600,
        flexShrink: 0,
        ...style,
      }}
    >
      {initial}
    </div>
  );
}
