import { BackgroundVideo } from "./_components/BackgroundVideo";
import { HeroContent } from "./_components/HeroContent";
import { MarketingNav } from "./_components/MarketingNav";

// Landing → connect → dashboard. `HERMES_FORCE_DEMO=1` surfaces a demo entry
// straight to the console (read on the server, never exposed as a public env).
export default function LandingPage() {
  const forceDemo = process.env.HERMES_FORCE_DEMO === "1";

  return (
    <>
      <MarketingNav />
      <BackgroundVideo />
      <HeroContent forceDemo={forceDemo} />
    </>
  );
}
