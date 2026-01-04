import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GitFork } from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/* ───────────────────────── Fork Editor ───────────────────────── */

export default function ForkEditor() {
    const { recipeId } = useParams();
    const navigate = useNavigate();
    const { isAuthorized } = useContextManager();

    // Replace with API fetch
    const original = mockRecipe;

    const [mode, setMode] = useState("evolve"); // evolve | copy
    const [ingredients, setIngredients] = useState([...original.ingredients]);
    const [steps, setSteps] = useState([...original.steps]);
    const [summary, setSummary] = useState("");

    const publishFork = () => {
        if (mode === "evolve" && summary.trim().length < 5) {
            alert("Please describe what you changed.");
            return;
        }

        const diff = generateDiff(original, ingredients, steps);

        console.log("Publishing fork:", {
            parent_id: original.id,
            mode,
            summary,
            ingredients,
            steps,
            diff,
        });

        // TODO: POST to backend
        navigate(`/recipes/${original.slug}`);
    };

    return (
        <div className="max-w-[900px] mx-auto px-6 py-6 space-y-8">
            { isAuthorized ?
                (
                    <>
                        <Header original={original} />

                        <ForkIntent mode={mode} setMode={setMode} />

                        <EditBlock
                            title="Ingredients"
                            items={ingredients}
                            setItems={setIngredients}
                        />

                        <EditBlock
                            title="Steps"
                            items={steps}
                            setItems={setSteps}
                            numbered
                        />

                        {mode === "evolve" && (
                            <ChangeSummary
                                summary={summary}
                                setSummary={setSummary}
                            />
                        )}

                        <button
                            onClick={publishFork}
                            className="
                    flex items-center gap-2 px-6 py-3 rounded-lg
                    bg-orange-500 hover:bg-orange-600
                    text-black font-medium
                "
                        >
                            <GitFork size={18} />
                            Publish fork
                        </button>
                    </>
                ) : (
                    <p className="text-center text-neutral-400">
                        Please log in to fork recipes.
                    </p>
                )}
        </div>
    );
}

/* ───────────────────────── Components ───────────────────────── */

function Header({ original }) {
    return (
        <header>
            <h1 className="text-2xl font-semibold text-white">
                Forking: {original.title}
            </h1>
            <p className="text-neutral-400">
                Original by {original.author.username}
            </p>
        </header>
    );
}

function ForkIntent({ mode, setMode }) {
    return (
        <section className="bg-[#141414] rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-medium text-white">
                What do you want to do?
            </h3>

            <label className="flex items-center gap-2 text-neutral-300">
                <input
                    type="radio"
                    checked={mode === "copy"}
                    onChange={() => setMode("copy")}
                />
                Copy recipe for myself
            </label>

            <label className="flex items-center gap-2 text-neutral-300">
                <input
                    type="radio"
                    checked={mode === "evolve"}
                    onChange={() => setMode("evolve")}
                />
                Evolve this recipe publicly
            </label>
        </section>
    );
}

function EditBlock({ title, items, setItems, numbered }) {
    const updateItem = (i, value) => {
        const next = [...items];
        next[i] = value;
        setItems(next);
    };

    const addItem = () => setItems([...items, ""]);

    const removeItem = (i) =>
        setItems(items.filter((_, idx) => idx !== i));

    return (
        <section className="bg-[#141414] rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-medium text-white">
                {title}
            </h3>

            {items.map((item, i) => (
                <div key={i} className="flex gap-2">
                    {numbered && (
                        <span className="text-neutral-500 mt-2">
                            {i + 1}.
                        </span>
                    )}
                    <input
                        value={item}
                        onChange={(e) =>
                            updateItem(i, e.target.value)
                        }
                        className="
                            flex-1 bg-black/40 rounded px-3 py-2
                            text-neutral-200
                        "
                    />
                    <button
                        onClick={() => removeItem(i)}
                        className="text-neutral-500 hover:text-red-400"
                    >
                        ✕
                    </button>
                </div>
            ))}

            <button
                onClick={addItem}
                className="text-sm text-orange-400 hover:text-orange-300"
            >
                + Add
            </button>
        </section>
    );
}

function ChangeSummary({ summary, setSummary }) {
    return (
        <section className="bg-[#141414] rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-2">
                What changed?
            </h3>
            <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Reduced oil, added garlic tempering"
                className="
                    w-full h-24 bg-black/40 rounded p-3
                    text-neutral-200
                "
            />
        </section>
    );
}

/* ───────────────────────── Diff Logic ───────────────────────── */

function generateDiff(original, ingredients, steps) {
    const diffList = (oldArr, newArr) => ({
        added: newArr.filter((i) => !oldArr.includes(i)),
        removed: oldArr.filter((i) => !newArr.includes(i)),
    });

    return {
        ingredients: diffList(original.ingredients, ingredients),
        steps: diffList(original.steps, steps),
    };
}

/* ───────────────────────── Mock ───────────────────────── */

const mockRecipe = {
    id: "r1",
    slug: "juicy-smash-burgers",
    title: "Juicy Smash Burgers",
    author: { username: "BurgerDude" },
    ingredients: [
        "1 lb ground beef",
        "Salt",
        "Pepper",
        "Burger buns",
    ],
    steps: [
        "Heat skillet until very hot",
        "Smash beef balls",
        "Season generously",
        "Flip and add cheese",
    ],
};
