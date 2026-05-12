import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route change scroll reset.
 *
 * In TentaOS, most app pages scroll inside AppLayout's main container (`#app-scroll-container`).
 * Public/legal pages may scroll on window.
 *
 * We reset both, instantly, on pathname changes.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll (public pages).
    try {
      window.scrollTo(0, 0);
    } catch {}

    // Reset app main scroll container (sidebar routes).
    try {
      const el = document.getElementById('app-scroll-container');
      if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {}
  }, [pathname]);

  return null;
}

