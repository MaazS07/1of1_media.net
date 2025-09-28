import { Background } from '../components/Background';
import { Hero } from '../components/Hero';

import { UseCases } from '../components/UseCases';
import { CallToAction } from '../components/CallToAction';
import HeroBackground from '../components/HeroBackground';
import Features from '../components/Features';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white bg-opacity-80">
   <HeroBackground />
      {/* <Hero /> */}
      <Features/>
      <UseCases />
      <CallToAction />
    </div>
  );
}