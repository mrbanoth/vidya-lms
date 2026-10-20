import { Component } from "react";
import { Button } from "@/components/ui";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="grid max-w-md justify-items-center gap-4">
          <span className="font-display text-7xl font-extrabold text-primary">500</span>
          <h1 className="text-2xl font-bold">Something broke on this page</h1>
          <p className="text-muted-foreground">Reload to try again. If it keeps happening, contact support from the Contact page.</p>
          <Button onClick={() => window.location.assign("/")}>Go home</Button>
        </div>
      </div>
    );
  }
}
