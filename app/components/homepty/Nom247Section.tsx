import {
    FileText,
    CheckCircle2,
    ShieldCheck,
    MessageSquareHeart,
    ArrowRight,
    Check,
    Lock,
    Shield
} from "lucide-react";

export default function Nom247Section() {
    return (
        <section className="relative w-full flex flex-col justify-center items-center py-24 px-4 sm:px-6 lg:px-8 bg-white bg-mesh overflow-hidden border-y border-slate-100">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse-slow">
                </div>
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-pulse-slow"
                    style={{ animationDelay: "2s" }}></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-indigo-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-50 animate-pulse-slow"
                    style={{ animationDelay: "4s" }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
                <div className="mb-20 space-y-6">
                    <div className="inline-flex items-center space-x-2 bg-white/40 border border-white/60 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md shadow-sm">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">Compliance 2.0 Active</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Cumple con la <br />
                        <span className="bg-iridescent bg-clip-text text-transparent">NOM-247</span> sin esfuerzo.
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-light">
                        Automatiza tu marco legal con nuestra capa de cumplimiento inteligente. Transparencia total, cero
                        fricción y protección jurídica en cada transacción.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mb-24 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent -z-10 hidden md:block"></div>

                    <div className="glass-card rounded-[2rem] p-8 text-left hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden bg-white/65 backdrop-blur-[20px] border border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02),inset_0_0_0_1px_rgba(255,255,255,0.6)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 text-indigo-600 border border-indigo-50">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Información Comercial</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Datos claros del inmueble</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Formas de pago visibles</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Costo total anual (CAT)</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-card rounded-[2rem] p-8 text-left hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden bg-white/65 backdrop-blur-[20px] border border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02),inset_0_0_0_1px_rgba(255,255,255,0.6)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 text-purple-600 border border-purple-50">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Publicidad Veraz</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Sin leyendas engañosas</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Imágenes reales vs renders</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Validación automática</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-card rounded-[2rem] p-8 text-left hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden bg-white/65 backdrop-blur-[20px] border border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02),inset_0_0_0_1px_rgba(255,255,255,0.6)]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-6 text-pink-600 border border-pink-50">
                            <MessageSquareHeart className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Atención a Quejas</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-pink-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Canales de atención 24/7</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-pink-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Folios de seguimiento</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <CheckCircle2 className="w-5 h-5 text-pink-500 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)] shrink-0" />
                                <span>Reportes a Profeco listos</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="w-full max-w-5xl mx-auto relative perspective-1000 mt-12">
                    <div className="glass-card-dark rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden shadow-glass-heavy text-white animate-float bg-slate-900/85 backdrop-blur-[24px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}>
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 text-left space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                                    Tu blindaje legal,<br />ahora en <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">autopiloto.</span>
                                </h2>
                                <p className="text-slate-300 max-w-md">
                                    Activa la capa de cumplimiento NOM-247 hoy mismo y evita multas millonarias con nuestra tecnología preventiva.
                                </p>
                                <button className="group relative px-8 py-4 bg-white text-indigo-900 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 overflow-hidden transform hover:scale-105">
                                    <span className="relative z-10 flex items-center gap-2">
                                        Iniciar Setup
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-white to-indigo-200 opacity-0 group-hover:opacity-50 transition-opacity duration-300 animate-shimmer"></div>
                                </button>
                            </div>

                            <div className="flex-1 w-full max-w-md relative group">
                                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <div className="relative bg-[#1e293b]/90 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden transform rotate-y-[-10deg] rotate-x-[5deg] transition-transform duration-700 group-hover:rotate-0">
                                    <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center px-4 space-x-2">
                                        <div className="flex space-x-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="bg-slate-900/50 rounded text-[10px] text-slate-400 py-0.5 px-2 inline-block font-mono">
                                                compliance.layer // nom-247
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                                    <Check className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">Status Legal</div>
                                                    <div className="text-xs text-emerald-400">100% Verificado</div>
                                                </div>
                                            </div>
                                            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono tracking-wider">
                                                NOM-247 OK
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                                <span>Auditoría en tiempo real</span>
                                                <span>980ms</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex gap-3 items-center">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            <div className="flex-1">
                                                <div className="h-2 w-20 bg-slate-600 rounded mb-1.5"></div>
                                                <div className="h-1.5 w-12 bg-slate-700 rounded"></div>
                                            </div>
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
