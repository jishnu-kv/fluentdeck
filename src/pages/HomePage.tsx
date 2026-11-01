import React, { useEffect, useState, useRef, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CONTRIBUTORS_LOCAL_URL } from '@/constants';
import IconDisplay from '@/components/IconDisplay';
import { getIconUrl } from '@/utils';
import { IconType } from '@/types';

// Icons - only import critical ones initially
import { AppsIcon, FluentIconsIcon } from '@/components/Icons';

// Lazy load heavy component and non-critical icons
const NetworkVisualization = lazy(() =>
  import('@/components/NetworkVisualization').then(module => ({
    default: module.default
  }))
);

// --- STATIC DATA ---
const CARD_DATA = [
  {
    icon: 'AppsIcon',
    title: "WinUI Apps",
    description: "Discover the potential of Windows UI. A curated gallery of real-world applications demonstrating the power of Fluent Design.",
    link: "/apps",
    count: 520,
    cardStyle: { '--hue': 217, '--saturation': '91%', '--lightness': '60%' } as React.CSSProperties
  },
  {
    icon: 'EmojiIcon',
    title: "Fluent Emojis",
    description: "Add personality to your projects. Access the full Microsoft library of 3D, Color, and Flat emojis in high resolution.",
    link: "/emoji",
    count: 1595,
    cardStyle: { '--hue': 48, '--saturation': '99%', '--lightness': '50%' } as React.CSSProperties
  },
  {
    icon: 'FluentIconsIcon',
    title: "System Icons",
    description: "The official language of Windows. A searchable index of standard Fluent system icons for your next application.",
    link: "/icons",
    count: 2986,
    cardStyle: { '--hue': 291, '--saturation': '96%', '--lightness': '62%' } as React.CSSProperties
  }
];

const STATS = [
  { label: "Open Source", value: "MIT License" },
  { label: "Version", value: "2.5.0" },
  { label: "Assets", value: "7,000+" },
];

// --- REUSABLE COMPONENTS ---
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const Reveal: React.FC<RevealProps> = ({ children, className = "", delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, rootMargin: '50px' });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const FeatureCard = memo(({ icon, title, description, link, count, cardStyle }: any) => {
  const navigate = useNavigate();
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);

  // Lazy load icon component
  useEffect(() => {
    import('@/components/Icons').then(module => {
      setIconComponent(() => module[icon as keyof typeof module]);
    });
  }, [icon]);

  return (
    <div
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        navigate(link);
      }}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title} - ${count.toLocaleString()} items`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigate(link);
        }
      }}
      style={cardStyle}
      className="feature-card group relative rounded-2xl border border-border-primary bg-bg-secondary p-8 overflow-hidden cursor-pointer transition-[transform,border-color,box-shadow] duration-300 ease-out h-full flex flex-col hover:border-border-tertiary hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 [transform:translateZ(0)] [backface-visibility:hidden]"
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl ring-1 ring-blue-100 dark:ring-blue-800/30 transition-transform duration-300 group-hover:scale-110 [transform:translateZ(0)] [backface-visibility:hidden]" aria-hidden="true">
            {IconComponent ? <IconComponent className="w-6 h-6" /> : (
              <div className="w-6 h-6 bg-bg-active rounded animate-pulse" />
            )}
          </div>
          <div className="px-3 py-1 text-xs font-semibold text-text-secondary bg-bg-active rounded-full border border-border-primary">
            {count.toLocaleString()} Items
          </div>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-3">{title}</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-8 flex-grow">
          {description}
        </p>

        <div className="mt-auto flex items-center text-sm font-semibold text-text-primary border-t border-border-primary pt-4">
          <span className="group-hover:text-accent transition-colors">View Collection</span>
          <span className="ml-auto transform transition-transform duration-300 text-text-secondary group-hover:text-accent" aria-hidden="true">&rarr;</span>
        </div>
      </div>
    </div>
  );
});

// --- MAIN PAGE ---
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [contributors, setContributors] = useState<any[]>([]);
  const [contributorsLoading, setContributorsLoading] = useState(true);
  const [otherIcons, setOtherIcons] = useState<typeof import('@/components/Icons') | null>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const [showNetwork, setShowNetwork] = useState(false);
  const [newIcons, setNewIcons] = useState<IconType[]>([]);
  const [loadingNewIcons, setLoadingNewIcons] = useState(true);

  useEffect(() => {
    fetch('/data/new_icons.json')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((iconData: any) => ({
            name: iconData.name,
            styles: {
              filled: iconData.filled,
              regular: iconData.regular,
              color: iconData.color
            },
            filename: undefined,
            svgFileName: undefined
          }));
          setNewIcons(mapped);
        }
        setLoadingNewIcons(false);
      })
      .catch(() => setLoadingNewIcons(false));
  }, []);

  // Preload non-critical assets after initial render
  useEffect(() => {
    // Preload NetworkVisualization
    const preloadVisualization = setTimeout(() => {
      import('@/components/NetworkVisualization');
    }, 1000);

    // Preload other icons
    const preloadIcons = setTimeout(() => {
      import('@/components/Icons').then(icons => {
        setOtherIcons(icons);
      });
    }, 500);

    return () => {
      clearTimeout(preloadVisualization);
      clearTimeout(preloadIcons);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShowNetwork(true);
        fetch(CONTRIBUTORS_LOCAL_URL)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            if (Array.isArray(data)) setContributors(data);
            setContributorsLoading(false);
          })
          .catch(() => setContributorsLoading(false));
        observer.disconnect();
      }
    }, { threshold: 0.1 });

    if (communityRef.current) observer.observe(communityRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (page: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/${page.toLowerCase() === 'home' ? '' : page.toLowerCase()}`);
  };

  return (
    <div className="overflow-x-hidden bg-bg-primary font-sans selection:bg-blue-100 dark:selection:bg-blue-900">

      {/* --- HERO SECTION --- */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
          <div className="absolute inset-0 opacity-[0.6] dark:opacity-[0.1]" style={{ backgroundImage: "radial-gradient(hsl(var(--accent)) 1px,transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(circle at center,black,transparent 80%)", WebkitMaskImage: "radial-gradient(circle at center,black,transparent 80%)" }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-[100px] opacity-30 mix-blend-multiply dark:mix-blend-multiply"></div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center lcp-critical">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text-primary mb-8 leading-[1.1] md:leading-tight">
            Build Windows apps <br />
            <span className="text-text-secondary">with confidence.</span>
          </h1>

          <p className="mt-4 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Fluent Deck is the open-source reference for modern Windows development.
            Explore thousands of <strong>official Microsoft assets</strong>, icons, and real-world examples to speed up your WinUI workflow.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => handleNavigate("Apps")}
              className="group relative h-12 px-8 w-full sm:w-auto text-sm font-semibold text-bg-primary bg-accent rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Start Exploring WinUI Apps"
            >
              <AppsIcon className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
              <span>Start Exploring</span>
            </button>

            <button
              onClick={() => handleNavigate("Icons")}
              className="group h-12 px-8 w-full sm:w-auto text-sm font-semibold text-text-primary bg-bg-secondary border border-border-primary rounded-full transition-all duration-300 hover:bg-bg-active focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Browse System Icons"
            >
              <FluentIconsIcon className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
              <span>Browse Icons</span>
            </button>
          </div>
        </div>
      </section>

      {/* --- STATS STRIP --- */}
      <div className="border-y border-border-primary bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-primary">
            {STATS.map((stat, i) => (
              <div key={i} className="py-6 flex flex-col items-center justify-center text-center">
                <dt className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1">{stat.label}</dt>
                <dd className="text-2xl font-bold text-text-primary">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 sm:py-32 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <Reveal className="mb-20 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-6">
              The Essential Toolkit
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Everything you need to create native-feeling Windows experiences.
              From design mockups to production-ready code references.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CARD_DATA.map((card, index) => (
              <Reveal key={card.title} delay={index * 100}>
                <FeatureCard {...card} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- NEW ICONS STRIP --- */}
      <section className="py-20 bg-bg-secondary/40 border-t border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-accent border border-blue-100 dark:border-blue-800/30">
                New in v2.4.2
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl mb-4">
              Newly Added Icons
            </h2>
            <p className="text-base text-text-secondary">
              We've synced with the latest Microsoft release, bringing <strong>580 new variations</strong> and <strong>69 entirely new icon categories</strong> to the library. Explore all of the latest additions:
            </p>
          </Reveal>

          {loadingNewIcons ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-28 rounded-lg border border-border-primary bg-bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {newIcons.map((icon, index) => (
                <div
                  key={icon.name}
                  className="h-full animate-fadeIn"
                  style={{ animationDelay: `${index * 25}ms` }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      const query = icon.name;
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      navigate(`/icons?q=${encodeURIComponent(query)}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const query = icon.name;
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        navigate(`/icons?q=${encodeURIComponent(query)}`);
                      }
                    }}
                    title={icon.name}
                    aria-label={`Select icon: ${icon.name}`}
                    className="group relative cursor-pointer bg-card-primary border border-border-primary rounded-xl p-3 flex flex-col items-center h-28 duration-200 transition-transform [backface-visibility:hidden] [transform:translateZ(0)] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Tint layer - handles visual highlight without affecting image or border */}
                    <div className="absolute inset-0 rounded-xl pointer-events-none group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors duration-300" />

                    {/* Content Container */}
                    <div className="flex-1 flex items-center justify-center relative z-10">
                      <div className="w-10 h-10 flex items-center justify-center [backface-visibility:hidden] [transform:translateZ(0)]">
                        <IconDisplay
                          icon={icon}
                          style="Regular"
                          width={32}
                          height={32}
                          className="w-8 h-8"
                          urlResolver={getIconUrl}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <p className="text-xs text-center text-text-secondary group-hover:text-text-primary truncate w-full flex-shrink-0 relative z-10">
                      {icon.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Reveal className="mt-10 text-center">
            <button
              onClick={() => handleNavigate("Icons")}
              className="h-11 px-6 text-sm font-semibold text-text-primary bg-bg-secondary border border-border-primary rounded-full hover:bg-bg-active transition-all"
            >
              Explore All 2,986+ Icons &rarr;
            </button>
          </Reveal>
        </div>
      </section>

      {/* --- COMMUNITY SECTION --- */}
      <section
        id="community"
        className="bg-bg-secondary/20 py-24 sm:py-32 border-t border-border-primary"
      >
        <div ref={communityRef} className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center justify-center p-3 mb-6 bg-bg-secondary rounded-2xl shadow-sm border border-border-primary" aria-hidden="true">
              {otherIcons ? (
                <otherIcons.GitHubIcon className="w-6 h-6 text-text-primary" />
              ) : (
                <div className="w-6 h-6 bg-bg-active rounded animate-pulse" />
              )}
            </div>
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Powered by Community
            </h2>
            <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto">
              Join <strong>{contributors.length > 0 ? contributors.length : '...'} contributors</strong> helping to make Windows development accessible to everyone.
            </p>

            {/* Network Visualization */}
            <div className="mb-12">
              {showNetwork && (
                <Suspense fallback={<div className="h-32 w-full animate-pulse bg-bg-active rounded-3xl" role="status" aria-label="Loading contributor visualization"></div>}>
                  <NetworkVisualization
                    onNavigate={() => navigate('/contribute')}
                    contributors={contributors}
                    loading={contributorsLoading}
                  />
                </Suspense>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/contribute')}
                className="h-12 px-8 w-full sm:w-auto font-semibold text-bg-primary bg-accent rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Contribute on GitHub"
              >
                {otherIcons ? (
                  <otherIcons.GitHubIcon className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                ) : (
                  <div className="w-5 h-5 inline-block mr-2 bg-bg-active rounded animate-pulse" />
                )}
                Contribute on GitHub
              </button>
              <a
                href="https://discord.com/channels/714581497222398064/1424756200364576868"
                target="_blank"
                rel="noreferrer"
                className="h-12 px-8 w-full sm:w-auto inline-flex items-center justify-center font-semibold text-text-primary bg-bg-secondary border border-border-primary rounded-full hover:bg-bg-active transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Join Discord Community"
              >
                {otherIcons ? (
                  <otherIcons.DiscordIcon className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
                ) : (
                  <div className="w-5 h-5 inline-block mr-2 bg-bg-active rounded animate-pulse" />
                )}
                Join Discord
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default HomePage;