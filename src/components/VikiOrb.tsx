import { motion } from 'framer-motion';

export default function VikiOrb() {
  // Thinking state animation - pulsing orb with particles
  return (
    <div style={{ 
      width: 80, 
      height: 80, 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Outer glow ring */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Main orb */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 50%, #006699 100%)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.5), inset 0 -10px 20px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Inner highlight */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '30%',
          height: '20%',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.4)',
          filter: 'blur(3px)',
        }} />
      </motion.div>
      
      {/* Orbiting particles */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: 60 + i * 10,
            height: 60 + i * 10,
          }}
        >
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: 6,
              height: 6,
              marginLeft: -3,
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 10px #00d4ff',
            }}
          />
        </motion.div>
      ))}
      
      {/* Thinking indicator */}
      <motion.div
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          times: [0, 0.5, 1],
        }}
        style={{
          position: 'absolute',
          bottom: -20,
          fontSize: 10,
          color: '#00d4ff',
          letterSpacing: 2,
        }}
      >
        ⚡
      </motion.div>
    </div>
  );
}
