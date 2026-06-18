import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Construction className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-muted-foreground">
        This screen is being rebuilt on the new interface and will be available shortly.
      </p>
      <Button asChild variant="outline">
        <Link to="/mytoia">Back to My TOIA</Link>
      </Button>
    </div>
  );
}
