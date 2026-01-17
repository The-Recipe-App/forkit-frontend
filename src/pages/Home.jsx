export default function Home() {
  return (
    <div className="relative text-neutral-200 overflow-hidden">

      {/* HERO */}
      <section className="min-h-screen flex items-center px-6">
        <div className="max-w-6xl">
          <h1 className="text-6xl md:text-8xl font-extrabold leading-[0.95]">
            Recipes
            <br />
            that don't
            <br />
            stand still
          </h1>

          <p className="mt-10 text-xl md:text-2xl text-neutral-400 max-w-2xl">
            Forkit is a place where recipes are shared,
            challenged, forked, and improved -
            together.
          </p>

          <div className="mt-14 flex gap-5">
            <button className="px-9 py-5 bg-neutral-100 text-black font-medium rounded-md">
              Explore evolving recipes
            </button>
            <button className="px-9 py-5 border border-neutral-700 rounded-md">
              Fork your first one
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-32 border-t border-neutral-800">
        <div className="max-w-5xl">
          <h2 className="text-3xl font-semibold mb-16">
            How recipes evolve on Forkit
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <Step
              title="Someone shares a recipe"
              desc="A starting point. Never the final word."
            />
            <Step
              title="Others fork and tweak it"
              desc="Less salt. More spice. A better idea."
            />
            <Step
              title="The best versions rise"
              desc="Not perfect - just better than before."
            />
          </div>
        </div>
      </section>

      {/* EVOLVING RECIPES */}
      <section className="py-32 px-6">
        <div className="max-w-6xl">
          <h2 className="text-3xl font-semibold mb-4">
            Evolving right now
          </h2>
          <p className="text-neutral-400 mb-14">
            These recipes changed recently.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <RecipeCard
              title="Simple Dal"
              change="Added garlic tempering"
              mood="quietly improving"
              forks={12}
            />
            <RecipeCard
              title="Butter Chicken"
              change="Reduced cream, deeper spice"
              mood="heated discussion"
              forks={15}
            />
            <RecipeCard
              title="Sourdough Bread"
              change="Longer fermentation"
              mood="wild experimentation"
              forks={20}
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-40 px-6 border-t border-neutral-800">
        <div className="max-w-5xl">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Find a recipe.
            <br />
            Change it.
            <br />
            See what happens.
          </h2>

          <p className="mt-10 text-xl text-neutral-400 max-w-2xl">
            Forkit isn't about the perfect recipe.
            It's about better ideas - discovered together.
          </p>

          <button className="mt-16 px-12 py-6 bg-neutral-100 text-black font-medium rounded-md">
            Start cooking together
          </button>
        </div>
      </section>

    </div>
  );
}

/* --------- Helpers --------- */

const Step = ({ title, desc }) => (
  <div className="space-y-3">
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-neutral-400">{desc}</p>
  </div>
);

const RecipeCard = ({ title, change, mood, forks }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
    <h3 className="font-semibold text-lg">{title}</h3>

    <p className="mt-3 text-sm text-neutral-400">
      {change}
    </p>

    <div className="mt-4 text-xs text-neutral-500 italic">
      mood: {mood}
    </div>

    <div className="mt-6 flex justify-between text-xs text-neutral-500">
      <span>🍴 {forks} forks</span>
      <span className="text-amber-400">recently updated</span>
    </div>
  </div>
);
