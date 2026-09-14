import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container-site flex flex-col items-center py-24 text-center">
      <p className="text-5xl font-extrabold text-castmog-green">404</p>
      <h1 className="mt-3 text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back to Home
      </Link>
    </section>
  );
}
