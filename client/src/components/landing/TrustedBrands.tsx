interface BrandCardProps {
  src: string;
  alt: string;
}

function BrandCard({ src, alt }: BrandCardProps) {
  return (
    <div className="flex items-center justify-center
      h-28 w-36 md:h-32 md:w-48 lg:h-36 lg:w-56
      transition-all duration-300
      hover:scale-105 hover:bg-white/0"
    >
      <img
        src={src}
        alt={alt}
        className="max-h-20 md:max-h-24 lg:max-h-28 object-contain"
        loading="lazy"
      />
    </div>
  );
}

export default function TrustedBrands() {
  return (
    <>
      <section
        className="relative w-full overflow-hidden px-4 py-16 md:py-20 lg:py-24 bg-fixed bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
            url("/trust.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-display">
            Brands Who Trust Us
          </h2>
        </div>

        {/* Marquee Wrapper */}
        <div className="relative overflow-hidden">
          {/* Gradient fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-18 bg-gradient-to-r from-black/80 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-18 bg-gradient-to-l from-black/80 to-transparent z-10" />

          {/* Marquee Track */}
          <div className="brands-marquee-track flex w-max gap-10">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex gap-10">
                <BrandCard src="/logos/konga.png" alt="Konga" />
                <BrandCard src="/logos/jumia.png" alt="Jumia" />
                <BrandCard src="/logos/zenith.png" alt="Zenith" />
                <BrandCard src="/logos/flutterwave.png" alt="Flutterwave" />
                {/* Add more brands freely */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSS - Right to left flow */}
      <style>
        {`
          .brands-marquee-track {
            display: flex;
            animation: brands-marquee-right-to-left 40s linear infinite;
          }

          @keyframes brands-marquee-right-to-left {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }

          /* Optional smooth parallax effect */
          section.bg-fixed {
            background-attachment: fixed;
            background-position: center center;
            background-repeat: no-repeat;
          }
          
          /* Responsive adjustments */
          @media (max-width: 640px) {
            .brands-marquee-track {
              animation-duration: 30s; /* Faster on mobile for better UX */
            }
          }
          
          @media (min-width: 1024px) {
            .brands-marquee-track {
              animation-duration: 50s; /* Slower on desktop for better reading */
            }
          }
        `}
      </style>
    </>
  );
}
