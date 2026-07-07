import { BackgroundVideo } from "./_components/BackgroundVideo";
import { Capabilities } from "./_components/Capabilities";
import { Ecosystem } from "./_components/Ecosystem";
import { Features } from "./_components/Features";
import { FinalCta } from "./_components/FinalCta";
import { Footer } from "./_components/Footer";
import { HeroContent } from "./_components/HeroContent";
import { Lifecycle } from "./_components/Lifecycle";
import { MarketingNav } from "./_components/MarketingNav";
import { OnChain } from "./_components/OnChain";
import { TrustBar } from "./_components/TrustBar";

// The landing surfaces live backend data (Ecosystem, OnChain receipt), so keep
// it dynamic rather than statically cached.
export const dynamic = "force-dynamic";

// Landing → connect → dashboard. `HERMES_FORCE_DEMO=1` surfaces a demo entry
// straight to the console (read on the server, never exposed as a public env).
export default function LandingPage() {
  const forceDemo = process.env.HERMES_FORCE_DEMO === "1";

  return (
    <>
      <MarketingNav />
      <main>
        <section
          id="top"
          className="relative flex min-h-[92vh] flex-col overflow-hidden lg:block lg:min-h-screen"
        >
          <BackgroundVideo />
          <HeroContent forceDemo={forceDemo} />
        </section>
        <TrustBar />
        <Lifecycle />
        <Features />
        <Capabilities />
        <OnChain />
        <Ecosystem />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
