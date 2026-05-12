import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-serif font-semibold">404</h1>
      <p className="text-sm text-muted-foreground mt-2">Page not found.</p>
      <Link to="/" className="inline-block mt-6 text-sm text-primary underline underline-offset-2">
        Back to home
      </Link>
    </div>
  </div>
);

export default NotFound;
