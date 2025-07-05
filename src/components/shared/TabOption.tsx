import { motion } from 'framer-motion';

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function TabOption({ label, active, onClick }: Props) {
  return (
    <motion.button
      className={`flex-1 py-2 px-4 text-sm font-medium focus:outline-none transition-all ${
        active
          ? 'text-white border-b-2 border-white'
          : 'text-gray-400 hover:text-white border-b-2 border-transparent'
      }`}
      onClick={onClick}
      whileHover={{ scale: active ? 1 : 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}
