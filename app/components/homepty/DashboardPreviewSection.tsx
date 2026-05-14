export default function DashboardPreviewSection() {
    return (
        <section className="dashboard-preview-section py-24 px-6 relative overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="dashboard-title text-4xl md:text-5xl lg:text-6xl font-bold mb-20 tracking-tight text-foreground">
                    El control de la gestión en tus manos.
                </h2>

                <div className="dashboard-mockup-container relative">
                    <img
                        src="/images/crm-for-muckup (1).png"
                        alt="Dashboard Homepty"
                        className="dashboard-mockup w-full h-auto mx-auto"
                    />
                </div>
            </div>
        </section>
    );
}
