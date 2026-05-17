function Header() {
  return (
    <div className="text-center mb-10">
      <p className="label mb-4">Fact verification</p>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight text-ink leading-[1.08]">
        What would you like to verify?
      </h1>
      <p className="text-muted mt-4 text-sm md:text-base">
        Check any claim against live evidence.
      </p>
    </div>
  );
}

export default Header;
