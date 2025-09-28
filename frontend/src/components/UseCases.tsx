import { motion } from 'framer-motion';

export function UseCases() {
  const cases = [
    {
      image: "https://assertiveindustries.com/wp-content/uploads/2021/07/Oracle-E-Business-Background.jpg",
      title: "Enterprise Solutions",
      description: "Automate complex business processes and decision-making workflows."
    },
    {
      image: "https://woxsen.edu.in/blog/wp-content/uploads/2021/02/financial-services.jpg",
      title: "Financial Services",
      description: "Streamline document processing and regulatory compliance checks."
    },
    {
      image: "https://www.astronhealthcare.com/blog/wp-content/uploads/2021/04/H14-P-De-Raeve-3003-atl-image-3-696x392-1.jpg",
      title: "Healthcare",
      description: "Enhance patient care with automated data analysis and reporting."
    }
  ];

  return (
    <section className="relative py-24 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "10vh",
              fontWeight: "700",
              fontFamily: "'Syncopate', sans-serif",
              letterSpacing: "2px",
              margin: 0,
              color: "pink"
            }}
          >
           USE CASES
          </h1>
          </div>
          <p className="text-gray-300 text-xl">See how Weave AI transforms industries</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {cases.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300"
            >
              <img src={item.image} alt={item.title} className="w-full h-56 object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-300 text-lg">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
