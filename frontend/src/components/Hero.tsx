import { motion } from 'framer-motion';
import { Brain, Workflow, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-6 text-bistre"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            weave ai
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-byzantium mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Build, Deploy, and Scale Your AI Workflows with Drag-and-Drop Simplicity
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="p-6 bg-white shadow-xl rounded-xl border border-timberwolf"
            >
              <div className="w-12 h-12 bg-timberwolf rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-byzantium" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-bistre">AI-Powered Agents</h3>
              <p className="text-byzantium">Create intelligent workflows with pre-built AI agents</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="p-6 bg-white shadow-xl rounded-xl border border-timberwolf"
            >
              <div className="w-12 h-12 bg-timberwolf rounded-full flex items-center justify-center mx-auto mb-4">
                <Workflow className="w-6 h-6 text-byzantium" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-bistre">Visual Workflow Builder</h3>
              <p className="text-byzantium">Drag-and-drop interface for seamless integration</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="p-6 bg-white shadow-xl rounded-xl border border-timberwolf"
            >
              <div className="w-12 h-12 bg-timberwolf rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-byzantium" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-bistre">Multi-Input Processing</h3>
              <p className="text-byzantium">Handle PDFs, images, text, and URLs with ease</p>
            </motion.div>
          </div>

          <motion.button
            onClick={() => navigate('/playground')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-byzantium text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-opacity-90 transition-all cursor-pointer"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}