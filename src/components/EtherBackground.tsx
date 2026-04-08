import { useEffect, useRef } from 'react';

const EtherBackground = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };

    let ticking = false;
    const throttled = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      animId = requestAnimationFrame(() => {
        handleMove(e);
        ticking = false;
      });
    };

    window.addEventListener('mousemove', throttled, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttled);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div ref={ref} className="absolute -inset-[20%] transition-transform duration-[2000ms] ease-out">
        {/* Primary green nebula */}
        <div className="absolute top-[10%] left-[15%] w-[60vw] h-[60vh] rounded-full bg-primary/8 blur-[120px] animate-float-slow" />
        {/* Golden wheat glow */}
        <div className="absolute bottom-[20%] right-[10%] w-[50vw] h-[50vh] rounded-full bg-accent/6 blur-[100px] animate-float-medium" />
        {/* Deep earth accent */}
        <div className="absolute top-[50%] left-[50%] w-[40vw] h-[40vh] rounded-full bg-earth/5 blur-[90px] animate-float-fast" />
      </div>
      {/* Frosted overlay */}
      <div className="absolute inset-0 backdrop-blur-[80px]" />
    </div>
  );
};

export default EtherBackground;
