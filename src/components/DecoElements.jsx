import { motion } from "framer-motion";

// 云朵装饰
export function CloudDeco({ className = "" }) {
  return (
    <motion.svg
      className={className}
      width="60"
      height="40"
      viewBox="0 0 60 40"
      fill="none"
      initial={{ y: 0 }}
      animate={{ y: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M15 25C15 25 10 25 10 20C10 15 15 15 15 15C15 15 15 10 20 10C25 10 25 15 25 15C25 15 30 15 30 20C30 25 25 25 25 25H15Z"
        fill="#FFE082"
        fillOpacity="0.3"
      />
    </motion.svg>
  );
}

// 星星装饰
export function StarDeco({ className = "" }) {
  return (
    <motion.svg
      className={className}
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <path
        d="M15 2L17 13L28 15L17 17L15 28L13 17L2 15L13 13L15 2Z"
        fill="#FFD7D7"
        fillOpacity="0.5"
      />
    </motion.svg>
  );
}

// 爱心装饰
export function HeartDeco({ className = "" }) {
  return (
    <motion.svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M20 35C20 35 5 27 5 17C5 12 8 9 12 9C15 9 18 11 20 14C22 11 25 9 28 9C32 9 35 12 35 17C35 27 20 35 20 35Z"
        fill="#FFD7D7"
        fillOpacity="0.4"
      />
    </motion.svg>
  );
}

// 纸飞机装饰
export function PlaneDeco({ className = "" }) {
  return (
    <motion.svg
      className={className}
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M10 40L40 10L25 20L20 30L10 40Z"
        fill="#9B8BDA"
        fillOpacity="0.3"
      />
    </motion.svg>
  );
}
