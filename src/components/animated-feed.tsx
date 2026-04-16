"use client";

import { motion } from "framer-motion";
import { ContentCard } from "./content-card";
import type { Content } from "@/types";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
};

const hoverSpring = {
  y: -3,
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

const tapSpring = {
  scale: 0.98,
  transition: { type: "spring" as const, stiffness: 400, damping: 25 },
};

export function AnimatedFeed({
  featured,
  rest,
}: {
  featured: Content | undefined;
  rest: Content[];
}) {
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {featured && (
        <motion.div variants={itemVariants} whileTap={tapSpring}>
          <ContentCard content={featured} featured />
        </motion.div>
      )}

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
          variants={containerVariants}
        >
          {rest.map((item, i) => (
            <motion.div
              key={item.id}
              className={
                i === 0 && rest.length >= 3
                  ? "md:col-span-2 lg:col-span-1"
                  : ""
              }
              variants={itemVariants}
              whileHover={hoverSpring}
              whileTap={tapSpring}
            >
              <ContentCard content={item} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
