export default function Privacy() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-gray-300">
            <h1 className="text-3xl font-semibold text-white mb-6">
                Privacy Policy
            </h1>

            <p className="mb-4">
                Forkit respects your privacy. This page explains what information
                we collect and how it is used.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Information We Collect
            </h2>
            <p className="mb-4">
                When you sign in or use Forkit, we may collect basic account
                information such as your email address, name, and profile image
                (for example, when you use Google sign-in).
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                How We Use Information
            </h2>
            <p className="mb-4">
                This information is used only to authenticate users, provide
                core functionality, and improve the Forkit experience.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Data Sharing
            </h2>
            <p className="mb-4">
                Forkit does not sell, rent, or trade personal data to third
                parties.
            </p>

            <h2 className="text-xl text-white mt-8 mb-2">
                Contact
            </h2>
            <p>
                If you have questions about this policy, contact us at{" "}
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
