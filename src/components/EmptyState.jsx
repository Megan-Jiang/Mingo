import { motion } from "framer-motion";

// 空状态组件
export function EmptyState({ icon: Icon, emoji, message, submessage }) {
  return (
    <motion.div
      className="bg-white rounded-3xl p-10 text-center shadow-lg shadow-warm-purple/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 图标或Emoji */}
      <motion.div
        className="mb-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {Icon ? (
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-warm-yellow to-[#FFEAA7] flex items-center justify-center">
            <Icon className="w-10 h-10 text-warm-purple" />
          </div>
        ) : (
          <div className="text-6xl">{emoji || "✨"}</div>
        )}
      </motion.div>

      {/* 消息 */}
      <p className="text-gray-500 mb-2 leading-relaxed tracking-wide">
        {message}
      </p>

      {/* 副消息 */}
      {submessage && (
        <p className="text-sm text-gray-400 tracking-wide">
          {submessage}
        </p>
      )}
    </motion.div>
  );
}
