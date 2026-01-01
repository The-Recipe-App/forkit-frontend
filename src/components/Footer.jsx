import Logo from "../features/Logo";

const Footer = ({ isAuthorized }) => {
    return (
        <footer className="bg-[#18181B] text-gray-400 text-sm">
            <div id="footer-sentinel" className="h-px" />
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 border-b border-gray-700 pb-8">

                    <div className="md:col-span-2"> 
                        <h3 className="text-white font-semibold text-base mb-2">
                            <Logo width={300} src="footer_logo.svg"/>
                        </h3>
                        <p className="text-gray-500 leading-relaxed">
                            A community-driven platform to cook, share,
                            and evolve recipes together.
                        </p>
                    </div>
                    {/* Brand */}

                    {/* Explore */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Explore</h4>
                        <ul className="space-y-2">
                            <FooterLink label="Browse Recipes" />
                            {isAuthorized && <FooterLink label="Create Recipe" />}
                            {isAuthorized && <FooterLink label="Favorites" />}
                            {isAuthorized && <FooterLink label="Changelogs" />}
                        </ul>
                    </div>

                    {/* Community */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Forkit Dev Community</h4>
                        <ul className="space-y-2">
                            <FooterLink label="READMEs" onClick={() => window.open("https://github.com/The-Recipe-App/Forkit/blob/main/README.md", "_blank")} />
                            <FooterLink label="GitHub" onClick={() => window.open("https://github.com/The-Recipe-App", "_blank")} />
                            <FooterLink label="Contribute" />
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-medium mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <FooterLink label="License (AGPL-3.0)" onClick={() => window.open("https://github.com/The-Recipe-App/Forkit/blob/main/LICENSE", "_blank")}/>
                            <FooterLink label="Privacy Policy" />
                            <FooterLink label="Terms of Use" />
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">

                    {/* Left */}
                    <p className="text-gray-500 text-center md:text-left">
                        An open-source project · <a href="https://github.com/The-Recipe-App/Forkit/blob/271a7201f25f86dedd43d5f69d4330f811c99964/LICENSE" target="_blank">Licensed under AGPL-3.0</a> · Forkit
                    </p>

                    {/* Right */}
                    <p className="text-gray-500 text-center md:text-right">
                        © 2026 Forkit · Built with ❤️
                    </p>

                </div>
            </div>
        </footer>
    );
};

export default Footer;

/* --------- Small helper --------- */

const FooterLink = ({ label, onClick }) => (
    <li>
        <button
            className="
                text-gray-400 hover:text-white
                transition-colors
                text-left
            "
            onClick={onClick}
        >
            {label}
        </button>
    </li>
);
