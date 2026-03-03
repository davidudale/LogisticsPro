import React from "react";

const services = [
  {
    title: "Go Digital",
    description:
      "Replace paper logs with guided workflows, structured updates, and centralized delivery records.",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1887&auto=format&fit=crop",
  },
  {
    title: "Real-time Visibility",
    description:
      "Monitor shipment state and warehouse movement as soon as teams update tasks in the field.",
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop",
  },
  {
    title: "Connected Operations",
    description:
      "Sync LogisticsPro with your existing ERP, carrier, and customer systems for end-to-end control.",
    image:
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1975&auto=format&fit=crop",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 sm:py-24 lg:py-28 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-3xl">
            <h2 className="text-orange-500 font-bold uppercase tracking-[0.28em] text-xs sm:text-sm mb-3">
              Core Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-syncopate font-bold text-white leading-[1.05]">
              SMART TOOLS FOR
              <span className="block text-slate-300">MODERN LOGISTICS</span>
            </h3>
          </div>
          <button className="self-start lg:self-auto text-slate-300 hover:text-orange-400 flex items-center gap-2 group transition-colors uppercase tracking-[0.18em] text-[11px] font-bold" type="button">
            Explore Features
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {services.map((service) => (
            <article
              key={service.title}
              className="group relative min-h-[360px] sm:min-h-[420px] overflow-hidden rounded-2xl border border-slate-800/80 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]"
            >
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/5" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h4 className="text-xl sm:text-2xl font-syncopate font-bold text-white mb-2">
                  {service.title}
                </h4>
                <p className="text-slate-200/90 text-sm leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-4 w-10 h-1 bg-orange-500 group-hover:w-20 transition-all duration-500" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
