import { motion } from "framer-motion";
import { Bot, Cpu, Network, Shield } from "lucide-react";

const Features =()=> {
  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Advanced AI Agents",
      description:
        "Leverage state-of-the-art AI models to automate complex workflows and decision-making processes.",
      gradient: "from-[#1a1a1a] via-[#3827FF] to-[#9F6FFC]",
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Seamless Integration",
      description:
        "Connect with your existing tools and platforms through our extensive API ecosystem.",
      gradient: "from-[#3827FF] via-[#1a1a1a] to-[#9F6FFC]",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enterprise Security",
      description:
        "Bank-grade encryption and compliance measures to keep your data safe and secure.",
      gradient: "from-[#9F6FFC] via-[#1a1a1a] to-[#3827FF]",
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Scalable Infrastructure",
      description:
        "Built to handle millions of operations with consistent performance and reliability.",
      gradient: "from-[#1a1a1a] via-[#9F6FFC] to-[#3827FF]",
    },
  ];

  return (
    <>
    <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "10vh",
              fontWeight: "300",
              fontFamily: "'Syncopate', sans-serif",
              letterSpacing: "2px",

              padding: 4,
              backgroundColor: "#1A1A1A",
              color: "white",
            }}
          >
            Our Features
          </h1>
          </div>
    <section className="relative pt-10 h-[80vh] w-full bg-[#1A1A1A] flex items-center justify-center">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className={`relative group ${
              index % 2 === 1 ? "md:translate-y-12" : ""
            }`}
          >
            <div
              className={`bg-gradient-to-br ${feature.gradient} p-8 rounded-2xl shadow-2xl 
                backdrop-blur-sm backdrop-filter 
                hover:shadow-[0_0_30px_rgba(56,39,255,0.3)] 
                transition-all duration-500 
                hover:-translate-y-2`}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="text-white/90 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  </>
  );
}
export default Features ;
