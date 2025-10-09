import { Header, Footer } from "@/components/layout";
import { Hero } from "@/components/landing/hero";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { Features } from "@/components/landing/features";
import { Personas } from "@/components/landing/personas";
import { TechStack } from "@/components/landing/tech-stack";
import { CTA } from "@/components/landing/cta";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <section id="problem-solution">
          <ProblemSolution />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="use-cases">
          <Personas />
        </section>
        <section id="technology">
          <TechStack />
        </section>
        <section id="get-started">
          <CTA />
        </section>
      </main>
      <Footer />
    </div>
  );
}
