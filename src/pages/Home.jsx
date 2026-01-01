export default function Home() {
  return (
    <div className="relative text-neutral-200 overflow-hidden">

      {/* HERO */}
      <section className="min-h-screen flex items-center px-6 relative">
        <div className="max-w-6xl relative z-10">
          <h1 className="text-7xl md:text-9xl font-extrabold leading-[0.95]">
            Steal This Recipe
          </h1>

          <p className="mt-10 text-2xl md:text-3xl text-neutral-400 max-w-2xl">
            Recipes don’t get better alone.
            <br />
            People argue. Fork. Break things.
          </p>

          <div className="mt-16 flex gap-5">
            <button className="px-9 py-5 bg-neutral-100 text-black font-medium rounded-md">
              Watch it evolve
            </button>
            <button className="px-9 py-5 border border-neutral-700 rounded-md">
              Cause trouble
            </button>
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY SIDEBAR */}
      <section className="px-6 pb-24">
        <h3 className="text-sm text-neutral-500 mb-6">
          activity · last few seconds
        </h3>

        <div className="space-y-2 max-w-xl">
          <div className="text-sm text-neutral-400">
            → Someone changed the recipe name
          </div>
          <div className="text-sm text-neutral-400">
            → Someone added 2 forks
          </div>
          <div className="text-sm text-neutral-400">
            → Someone changed the recipe description
          </div>
        </div>
      </section>

      {/* LIVE FEED */}
      <section className="py-32 px-6">
        <h2 className="text-3xl font-semibold mb-14">
          Evolving right now
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-0 bg-neutral-900" />
            <div className="relative z-10">
              <h3 className="font-semibold text-lg">
                Simple Dal
              </h3>

              <p className="mt-3 text-sm text-neutral-400">
                Added garlic tempering
              </p>

              <div className="mt-4 text-xs text-neutral-500 italic">
                mood: quietly improving
              </div>

              <div className="mt-6 flex justify-between text-xs text-neutral-500">
                <span>🍴 12 forks</span>
                <span className="text-amber-400">
                  live
                </span>
              </div>
            </div>
          </div>
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-0 bg-neutral-900" />
            <div className="relative z-10">
              <h3 className="font-semibold text-lg">
                Butter Chicken
              </h3>

              <p className="mt-3 text-sm text-neutral-400">
                Reduced cream, deeper spice
              </p>

              <div className="mt-4 text-xs text-neutral-500 italic">
                mood: heated discussion
              </div>

              <div className="mt-6 flex justify-between text-xs text-neutral-500">
                <span>🍴 15 forks</span>
                <span className="text-amber-400">
                  live
                </span>
              </div>
            </div>
          </div>
          <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-0 bg-neutral-900" />
            <div className="relative z-10">
              <h3 className="font-semibold text-lg">
                Sourdough Bread
              </h3>

              <p className="mt-3 text-sm text-neutral-400">
                Longer fermentation
              </p>

              <div className="mt-4 text-xs text-neutral-500 italic">
                mood: wild experimentation
              </div>

              <div className="mt-6 flex justify-between text-xs text-neutral-500">
                <span>🍴 20 forks</span>
                <span className="text-amber-400">
                  live
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL TEMPTATION */}
      <section className="py-40 px-6">
        <h2 className="text-5xl md:text-6xl font-bold">
          Find something broken.
          <br />
          Make it worse.
          <br />
          Or better.
        </h2>

        <p className="mt-10 text-xl text-neutral-400 max-w-2xl">
          ForkIt isn’t a library.
          <br />
          It’s a kitchen during a fight.
        </p>

        <button className="mt-16 px-12 py-6 bg-neutral-100 text-black font-medium rounded-md">
          Start meddling
        </button>
      </section>
    </div>
  );
}

