import Image from 'next/image';

type BrandVariant = 'primary' | 'reverse' | 'monochrome' | 'symbol';

const assetByVariant: Record<BrandVariant, string> = {
  primary: '/brand/cladora-logo-primary.svg',
  reverse: '/brand/cladora-logo-reverse.svg',
  monochrome: '/brand/cladora-logo-monochrome.svg',
  symbol: '/brand/cladora-symbol.svg',
};

interface CladoraBrandProps {
  variant?: BrandVariant;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}

export function CladoraBrand({
  variant = 'primary',
  className,
  priority = false,
  decorative = false,
}: CladoraBrandProps) {
  const isSymbol = variant === 'symbol';

  return (
    <Image
      src={assetByVariant[variant]}
      alt={decorative ? '' : 'CLADORA'}
      width={isSymbol ? 120 : 650}
      height={isSymbol ? 120 : 130}
      className={className}
      priority={priority}
    />
  );
}
