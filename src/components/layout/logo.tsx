import Image from "next/image";
import Link from "next/link";

const sizes = {
  sm: { height: 36, className: "h-9 w-auto max-w-[180px]" },
  md: { height: 52, className: "h-[52px] w-auto max-w-[260px]" },
  lg: { height: 72, className: "h-[72px] w-auto max-w-[360px]" },
} as const;

type LogoProps = {
  size?: keyof typeof sizes;
  href?: string | null;
  className?: string;
  priority?: boolean;
};

export function Logo({ size = "sm", href = "/", className = "", priority = false }: LogoProps) {
  const { height, className: sizeClass } = sizes[size];

  const image = (
    <Image
      src="/logo.png"
      alt="Værkstedet for kreativ begejstring"
      width={360}
      height={height}
      priority={priority}
      className={`object-contain object-left ${sizeClass} ${className}`}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}
