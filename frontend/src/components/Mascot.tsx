// === Маскот WeCRM: Карлсон-супергерой с пропеллером и логотипом на пряжке ===
import React from 'react'

type MascotSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface MascotProps {
  size?: MascotSize
  variant?: 'full' | 'bust' | 'badge'
  hover?: boolean       // ускорение пропеллера при наведении
  title?: string
  style?: React.CSSProperties
}

const SIZES: Record<MascotSize, number> = { xs: 40, sm: 64, md: 110, lg: 190, xl: 300 }

export function Mascot({ size = 'md', variant = 'full', hover = false, title = 'Карлсон — маскот WeCRM', style }: MascotProps) {
  const px = SIZES[size]
  return (
    <img
      src="/mascot/karlsson.png"
      alt={title}
      title={title}
      className={`mascot mascot-${variant}${hover ? ' mascot-hover' : ''}`}
      style={{ width: variant === 'bust' ? px * 1.15 : px, height: 'auto', ...style }}
      draggable={false}
    />
  )
}

// Бюст для сайдбара/аватаров (обрезка по пояс через CSS)
export function MascotBust(props: Omit<MascotProps, 'variant'>) {
  return <Mascot {...props} variant="bust" />
}
