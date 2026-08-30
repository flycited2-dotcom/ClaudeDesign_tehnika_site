import Image from "next/image";
import Link from "next/link";

type IllustratedEmptyStateProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export function IllustratedEmptyState({
  imageSrc,
  imageAlt,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: IllustratedEmptyStateProps) {
  return (
    <div className="glass illustrated-empty-state">
      <div className="illustrated-empty-copy">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <Link href={ctaHref} className="btn btn-primary">
          {ctaLabel}
        </Link>
      </div>
      <div className="illustrated-empty-media">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1448}
          height={1086}
          priority
          sizes="(max-width: 760px) 86vw, 48vw"
        />
      </div>
    </div>
  );
}
