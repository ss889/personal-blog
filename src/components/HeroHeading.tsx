'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function HeroHeading({ children }: { children: ReactNode }) {
  return (
    <motion.h1
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      {children}
    </motion.h1>
  );
}
