import { FirebaseBounty } from '@/lib/bounties';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FeaturedBountyCardProps {
  bounty: FirebaseBounty;
  index: number;
}

export default function FeaturedBountyCard({
  bounty,
  index,
}: FeaturedBountyCardProps) {
  return (
    <motion.div
      key={bounty.id}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{
        y: -8,
        boxShadow: '0 8px 30px rgba(255,255,255,0.15)',
      }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 120,
      }}
      viewport={{ once: true }}
      className="group relative overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg rounded-2xl p-6 text-white"
    >
      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-300 rounded-2xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="px-3 py-1 bg-blue-300/20 text-blue-100 border border-blue-200/30 rounded-full text-sm font-medium">
            {bounty.category || 'Other'}
          </span>
          <span className="font-semibold text-green-300">
            ${bounty.reward?.amount || '0'} {bounty.reward?.asset || 'USDC'}
          </span>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">
          {bounty.title}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60">
            {`Posted ${formatDistanceToNow(new Date(bounty.createdAt), {
              addSuffix: true,
            })}` || 'Recently posted'}
          </span>
          <Link
            href={`/bounties/${bounty.id}`}
            className="text-blue-200 hover:underline font-medium transition-colors duration-200"
          >
            View Details →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
