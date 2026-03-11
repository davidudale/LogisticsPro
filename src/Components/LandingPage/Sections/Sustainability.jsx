import React from "react";

const Sustainability = () => {
  return (
    <section id="network" className="py-20 sm:py-24 lg:py-28 bg-slate-900 overflow-hidden relative">
      {/* Low-opacity background image adds texture while keeping the text column dominant. */}
      <div className="absolute top-0 right-0 w-full lg:w-[45%] h-full opacity-10">
        <img
          src="https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?q=80&w=1935&auto=format&fit=crop"
          alt="Logistics analytics"
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <h2 className="text-orange-500 font-bold uppercase tracking-[0.28em] text-xs sm:text-sm mb-3">
              Global control tower
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-syncopate font-bold text-white mb-6 sm:mb-8 leading-tight">
              WAREHOUSE AND <br />
              <span className="text-orange-500">NETWORK SYNC</span>
            </h3>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Dock scheduling, slot optimization, and real-time inventory status
              aligned with dispatch operations.
            </p>

            <div className="space-y-4 sm:space-y-5">
              {/* Bullet points summarize operational capabilities without adding extra card UI. */}
              {[
                "Dynamic lane balancing",
                "Carbon-aware routing",
                "Integrated carrier scoring",
                "Predictive demand planning",
              ].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 border border-orange-500 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-500" />
                  </div>
                  <span className="text-slate-100 text-sm sm:text-base font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group mt-8 lg:mt-0">
            <div className="absolute -inset-4 bg-orange-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full" />
            <div className="relative glass-effect p-2 rounded-2xl transform hover:rotate-1 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=2070&auto=format&fit=crop"
                alt="Control tower dashboard"
                className="w-full rounded-xl"
              />
              <div className="absolute -bottom-6 sm:-bottom-8 left-4 sm:-left-8 bg-slate-950 p-4 sm:p-6 border-l-4 border-orange-500 shadow-2xl max-w-[240px] sm:max-w-xs rounded-r-xl">
                <p className="text-orange-500 font-syncopate font-bold text-lg sm:text-xl mb-1">Real-time</p>
                <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
                  Operations Across Warehouse and Fleet Teams
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Sustainability;
