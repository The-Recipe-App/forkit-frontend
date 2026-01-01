export default function Terms() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-gray-300">
            <h1 className="text-3xl font-semibold text-white mb-6">
                Terms of Service
            </h1>

            <p className="mb-4">
                By accessing or using Forkit, you agree to these terms.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Use of the Service
            </h2>
            <p className="mb-4">
                Forkit is a platform for creating, sharing, and evolving recipes.
                You agree to use the service responsibly and lawfully.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                User Content
            </h2>
            <p className="mb-4">
                You retain ownership of any content you create or upload.
                By posting content on Forkit, you grant Forkit permission to
                display and distribute that content within the platform.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Availability
            </h2>
            <p className="mb-4">
                Forkit is provided on an “as is” basis and may change or
                discontinue features at any time.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Contact
            </h2>
            <p>
                Questions about these terms can be sent to{" "}
                <a
                    href="mailto:support@forkit.app"
                    className="text-orange-400 hover:underline"
                >
                    support@forkit.app
                </a>
                .
            </p>

            <p className="mt-12 text-sm text-gray-500">
                Last updated: 2026
            </p>
        </div>
    );
}
