import { Link } from "react-router-dom";
import { MessageSquare, Mic, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Video,
    title: "Record once",
    description: "Capture short video answers to the questions that matter most.",
  },
  {
    icon: MessageSquare,
    title: "Converse anytime",
    description: "Visitors ask questions and your avatar replies with the right clip.",
  },
  {
    icon: Sparkles,
    title: "Smart suggestions",
    description: "AI proposes natural follow-up questions to keep the conversation flowing.",
  },
  {
    icon: Mic,
    title: "Speak or type",
    description: "Interact by voice or text, in multiple languages.",
  },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 to-background" />
        <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Interactive video avatars
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Have a conversation with a recorded you
          </h1>
          <p className="max-w-2xl text-balance text-lg text-muted-foreground">
            TOIA lets you record video answers and turns them into an avatar people can
            talk to — by voice or text, whenever they like.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">Create your avatar</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/explore">Explore avatars</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
