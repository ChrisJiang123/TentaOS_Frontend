import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TentaLogo from '../components/brand/TentaLogo';

export default function PageNotFound() {
  const pageName = window.location.pathname.substring(1);
  const isFetched = true;
  const authData = { user: null, isAuthenticated: false };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06060B]">
      <div className="max-w-md w-full text-center">
        {/* Glitch-style 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] font-bold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/5 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-sm text-white/40 mb-2">
          The page <span className="text-white/60 font-mono text-xs bg-white/[0.06] px-2 py-0.5 rounded">/{pageName}</span> doesn't exist.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/Landing">
            <Button variant="outline" className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to="/Dashboard">
            <Button className="bg-[#00E5FF] text-[#06060B] hover:bg-[#00E5FF]/80 font-medium">
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <TentaLogo size="sm" />
        </div>
      </div>
    </div>
  );
}