'use client';

import { FeaturedBountyCard, ParticlesBackground } from '@/components';
import { FirebaseBounty, getFeaturedBounties } from '@/lib/bounties';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaAngleRight } from 'react-icons/fa6';

export default function Home() {
  const [featuredBounties, setFeaturedBounties] = useState<FirebaseBounty[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadFeaturedBounties = async () => {
      try {
        const bounties = await getFeaturedBounties(3);
        setFeaturedBounties(bounties);
      } catch (error) {
        console.error('Error loading featured bounties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedBounties();
  }, []);

  return (
    <>
      <ParticlesBackground />

      <div className="relative overflow-hidden">
        <motion.div
          className="absolute left-[0%] top-[15%] z-0 pointer-events-none sm:left-[24%] sm:top-[10%]"
          animate={{ x: [0, 5, 0], y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/images/moon.svg"
            alt="etm Logo"
            width={60}
            height={60}
            className="rounded-full w-[60px] h-[60px]"
          />
        </motion.div>

        <motion.div
          className="absolute top-[16%] z-0 pointer-events-none flex justify-center md:top-[20%]   sm:top-[18%]  w-full"
          animate={{
            y: [0, 15, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Image
            src="/images/Subtract.svg"
            alt="etm Logo"
            width={1100}
            height={100}
            className="rounded-full transform rotate-180"
          />
        </motion.div>
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4 md:px-6 max-w-7xl mx-auto">
          <motion.div
            className="p-10 text-center mb-2 relative z-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="relative text-4xl md:text-6xl font-bold mb-6">
              <span className="text-white hero-text">
                Where Talent Shape the <br />
                Future of Web3
                <span className="inline-flex items-center">
                  .
                  <Image
                    src="/images/stellar.svg"
                    alt="Stellar Logo"
                    width={40}
                    height={40}
                    className="ml-0.5"
                  />
                </span>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto mb-8 small-hero-text">
              Connect, contribute, and earn rewards on the Stellar blockchain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
              <Link
                href="/create"
                className="bg-white text-black font-medium py-3 px-6 rounded-[40px] flex items-center justify-between text-[15px] hover:bg-white/90 transition-colors w-full"
              >
                Create Bounty
                <FaAngleRight className="" />
              </Link>
              <Link
                href="/bounties"
                className="backdrop-blur-xl bg-white/10 text-white font-medium py-3 px-6 rounded-[40px] flex items-center justify-between text-[15px] border border-white/20 hover:bg-white/20 transition-colors w-full"
              >
                Browse Bounties
                <FaAngleRight className="" />
              </Link>
            </div>
          </motion.div>
        </section>
        <div className="relative overflow-hidden py-8">
          <div className="flex whitespace-nowrap animate-scroll w-full">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-6 mr-10">
                  <span className="text-[150px] font-[700] opacity-40 text-white/40 font-['Druk_Wide_Trial']">
                    STALLIONS
                  </span>
                  <div className="mx-4 opacity-40">
                    <Image
                      src="/images/mad.png"
                      alt="Stallion Logo"
                      width={180}
                      height={180}
                      className="min-w-[160px]"
                    />
                  </div>
                  <span className="text-[150px] font-[700] opacity-40 text-white/40 font-['Druk_Wide_Trial']">
                    ASSEMBLE
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* How It Works */}
        <section className="py-20 px-4 md:px-6 mt-[140px]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Browse Bounties',
                  description:
                    'Explore open opportunities across various projects and skill sets.',
                },
                {
                  title: 'Submit Work',
                  description:
                    'Complete tasks and submit your work for review.',
                },
                {
                  title: 'Get Rewarded',
                  description:
                    'Receive payment directly to your Stellar wallet upon approval.',
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.05,
                    y: -4,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 14,
                    delay: index * 0.15,
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-white"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-stellar-blue to-stellar-purple text-white flex items-center justify-center text-xl font-bold mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/80">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Bounties Preview */}
        <section className="py-20 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Featured Bounties
              </h2>
              <Link
                href="/bounties"
                className="text-white hover:underline font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Skeleton loaders for loading state
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-white animate-pulse"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-6 bg-white/20 rounded-full w-24"></div>
                        <div className="h-6 bg-white/20 rounded-full w-16"></div>
                      </div>
                      <div className="h-7 bg-white/20 rounded-md w-3/4 mb-2"></div>
                      <div className="h-20 bg-white/20 rounded-md w-full mb-6"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-white/20 rounded-full w-32"></div>
                        <div className="h-4 bg-white/20 rounded-full w-24"></div>
                      </div>
                    </div>
                  ))
              ) : featuredBounties.length > 0 ? (
                // Display actual bounties
                featuredBounties.map((bounty, index) => (
                  <FeaturedBountyCard
                    index={index}
                    key={index}
                    bounty={bounty}
                  />
                ))
              ) : (
                // No bounties available
                <div className="col-span-3 text-center py-12">
                  <h3 className="text-xl text-white mb-4">
                    No featured bounties available right now
                  </h3>
                  <Link
                    href="/bounties"
                    className="text-blue-300 hover:underline"
                  >
                    Browse all bounties
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        {/* <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-stellar-blue to-stellar-purple text-white"> */}
        <section className="py-20 px-4 md:px-6 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to start earning with your skills?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join our growing community of developers, designers, and creators
              working on cutting-edge Web3 projects on the Stellar blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-black font-medium py-2 px-6 rounded-lg hover:bg-white/90 transition-colors"
              >
                Create Account
              </Link>
              <Link
                href="/bounties"
                className="backdrop-blur-xl bg-white/10 text-white font-medium py-2 px-6 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
              >
                Browse Bounties
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="backdrop-blur-xl bg-white/5 border-t border-white/10 text-white py-12 px-4 md:px-6 shadow-inner">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-8 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Stallion</h2>
                <p className="text-gray-200">Built on the Stellar blockchain</p>
              </div>
              <div className="flex gap-8">
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Privacy
                </Link>
              </div>
            </div>

            {/* Social Icons */}
            <div className="mt-8 flex justify-center md:justify-start space-x-6">
              <a
                href="https://x.com/Stallionsassmbl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>

              <a
                href="https://discord.gg/8rKFQHNtb3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <span className="sr-only">Discord</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>

              <a
                href="https://stallionss.gitbook.io/stallions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white transition-colors"
              >
                <span className="sr-only">Gitbook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M10.802 17.77a.703.703 0 11-.002 1.406.703.703 0 01.002-1.406m11.024-4.347a.703.703 0 11.001-1.406.703.703 0 01-.001 1.406m0-2.876a2.176 2.176 0 00-2.174 2.174c0 .233.039.465.115.691l-7.181 3.823a2.165 2.165 0 00-1.784-.937c-.829 0-1.584.475-1.95 1.216l-6.451-3.402c-.682-.358-1.192-1.48-1.138-2.502.028-.533.212-.947.493-1.107.178-.1.392-.092.62.027l.042.023c1.71.9 7.304 3.847 7.54 3.956.363.169.565.237 1.185-.057l11.564-6.014c.17-.064.368-.227.368-.474 0-.342-.354-.477-.355-.477-.658-.315-1.669-.788-2.655-1.25-2.108-.987-4.497-2.105-5.546-2.655-.906-.474-1.635-.074-1.765.006l-.252.125C7.78 6.048 1.46 9.178 1.1 9.397.457 9.789.058 10.57.006 11.539c-.08 1.537.703 3.14 1.824 3.727l6.822 3.518a2.175 2.175 0 002.15 1.862 2.177 2.177 0 002.173-2.14l7.514-4.073c.38.298.853.461 1.337.461A2.176 2.176 0 0024 12.72a2.176 2.176 0 00-2.174-2.174" />
                </svg>
              </a>
            </div>

            <div className="mt-8 pt-8 border-t border-white text-center md:text-left text-gray-200">
              <p>© {new Date().getFullYear()} Stallion. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
