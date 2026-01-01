import Logo from "../features/Logo";

const Footer = ({ isAuthorized }) => {
    return (
        <footer className="bg-[#18181B] text-gray-400 text-sm">
            <div id="footer-sentinel" className="h-px" />

            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-gray-700 pb-8">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Logo
                            width={300}
                            src="footer_logo.svg"
                            alt="Forkit logo"
                        />
                        <p className="text-gray-500 leading-relaxed mt-2">
                            A community-driven platform to cook, share,
                            and evolve recipes together.
                        </p>
                    </div>

                    {/* Explore */}
                    <nav aria-label="Explore">
                        <h4 className="text-white font-medium mb-3">Explore</h4>
                        <ul className="space-y-2">
                            <FooterLink href="/recipes" label="Browse Recipes" />
                            {isAuthorized && <FooterLink href="/recipes/new" label="Create Recipe" />}
                            {isAuthorized && <FooterLink href="/favorites" label="Favorites" />}
                            {isAuthorized && <FooterLink href="/changelogs" label="Changelogs" />}
                        </ul>
                    </nav>

                    {/* Community */}
                    <nav aria-label="Community">
                        <h4 className="text-white font-medium mb-3">
                            Forkit Dev Community
                        </h4>
                        <ul className="space-y-4">
                            <FooterLink
                                href="https://github.com/The-Recipe-App/Forkit/blob/main/README.md"
                                label="READMEs"
                                external
                            />
                            <FooterLink
                                href="https://github.com/The-Recipe-App"
                                label="GitHub"
                                external
                            />
                            <FooterLink href="/contribute" label="Contribute" />
                        </ul>
                    </nav>

                    {/* Legal */}
                    <nav aria-label="Legal">
                        <h4 className="text-white font-medium mb-3">Legal</h4>
                        <ul className="space-y-4">
                            <FooterLink
                                href="https://github.com/The-Recipe-App/Forkit/blob/main/LICENSE"
                                label="License (AGPL-3.0)"
                                external
                            />
                            <FooterLink href="/privacy" external label="Privacy Policy" />
                            <FooterLink href="/terms" external label="Terms of Use" />
                        </ul>
                    </nav>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
                    <p className="text-gray-500 text-center md:text-left">
                        An open-source project ·{" "}
                        <a
                            href="https://github.com/The-Recipe-App/Forkit/blob/main/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white underline"
                        >
                            Licensed under AGPL-3.0
                        </a>{" "}
                        · Forkit
                    </p>

                    <p className="text-gray-500 text-center md:text-right">
                        © 2026 Forkit · Built with ❤️
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

/* --------- Helper --------- */

const FooterLink = ({ href, label, external = false }) => (
    <li>
        <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-gray-400 hover:text-white transition-colors "
        >
            {label}
        </a>
    </li>
);
