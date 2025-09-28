import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  return (
    <section className="relative py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-gray-300 text-xl md:text-2xl mb-10">
            Join leading companies using Weave AI to build the future of work
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-3 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Developer Credits */}
          <p className="text-gray-500 text-sm mt-12">
            Developed by <span className="font-medium">RAVIRAJ</span>, <span className="font-medium">RAJAT</span>, <span className="font-medium">MAAZ</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
