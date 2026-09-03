import { useState, useRef } from 'react';
import { api } from '../api/client';
import { Avatar } from './Avatar';

interface AvatarUploadProps {
  name: string;
  avatar?: string | null;
  onUpdate: (avatar: string | null) => void;
  size?: number;
}

export function AvatarUpload({ name, avatar, onUpdate, size = 80 }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 512 МБ');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await api.users.uploadAvatar(base64);
        onUpdate(res.avatar || null);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Ошибка загрузки: ' + err.message);
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Удалить аватарку?')) return;
    try {
      await api.users.deleteAvatar();
      onUpdate(null);
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'relative',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <Avatar name={name} avatar={avatar} size={size} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
        >
          {uploading ? '...' : 'Изменить'}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {avatar && (
        <button
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            fontSize: 12,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Удалить
        </button>
      )}
    </div>
  );
}
