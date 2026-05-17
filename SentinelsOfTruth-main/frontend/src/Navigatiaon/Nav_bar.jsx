import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/70 border-b border-line">
      <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-[15px] tracking-tight text-ink">
          Sentinels<span className="text-faint"> of Truth</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            to="/"
            className={
              pathname === "/" ? "text-ink" : "text-faint hover:text-ink transition-colors"
            }
          >
            Verify
          </Link>
          <Link
            to="/about"
            className={
              pathname === "/about" ? "text-ink" : "text-faint hover:text-ink transition-colors"
            }
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
