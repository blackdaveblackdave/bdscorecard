export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-24 md:px-8">
      <h1 className="text-4xl tracking-tighter">Not a collector path</h1>
      <p className="mt-4 max-w-[65ch] text-muted leading-relaxed">
        That wallet or ENS name could not be resolved. Go back to the catalog.
      </p>
      <a href="/" className="btn btn-ghost mt-8 inline-flex">
        Works
      </a>
    </div>
  );
}
