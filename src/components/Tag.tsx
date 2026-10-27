import React from 'react';

interface TagProps {
  label: string;
  variant?: 'default' | 'matched' | 'missing' | 'outline' | 'accent';
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({
  label,
  variant = 'default',
  onRemove,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantStyles = {
    // Padrão neutro institucional sóbrio
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    // Verde Sereno com texto Verde Profundo (Padrão Oficial FIA de Acessibilidade - pg. 11)
    matched: 'bg-[#e9f2dc] text-[#084734] border border-[#abbd88]/60 font-medium',
    // Destaque com toque de Verde Decidido
    accent: 'bg-[#c3fa75]/25 text-[#084734] border border-[#c3fa75]/80 font-medium',
    // Quando a competência está faltando
    missing: 'bg-transparent text-slate-400 border border-dashed border-slate-300',
    // Variante de contorno
    outline: 'bg-white text-slate-700 border border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md leading-none tracking-tight ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-slate-900 ml-0.5 text-slate-400 hover:text-red-600 focus:outline-none cursor-pointer"
          aria-label={`Remover ${label}`}
        >
          &times;
        </button>
      )}
    </span>
  );
};
