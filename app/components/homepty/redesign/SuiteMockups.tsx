"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Bath, BedDouble, Bell, BrainCircuit, Briefcase, Building, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, CirclePlus, ClipboardList, Filter, Globe, Heart, LayoutGrid, MapPin, MessageCircle, MoreHorizontal, PanelLeft, Paperclip, Plus, Search, Send, Sparkles, SquareArrowOutUpRight, TrendingUp, Trash2, User, Users, X } from "lucide-react";
import s from "./SuiteMockups.module.css";

// Presentation-only snapshots of homepty_new. No auth, providers or business logic.
const items = [
  ["Inicio", LayoutGrid], ["Agentes IA", BrainCircuit], ["Explorar", MapPin],
  ["Solicitudes", ClipboardList], ["CRM", Briefcase], ["Hub", Sparkles],
  ["Perfil", User], ["Mi Sitio Web", Globe], ["Mensajes", MessageCircle], ["Inteligencia", BrainCircuit],
] as const;

function Sidebar({ active, expanded }: { active: string; expanded: boolean }) {
  return <aside className={`${s.sidebar} ${expanded ? s.expanded : s.collapsed}`}>
    <div className={s.logo}><span className={s.brandMark} />{expanded && <><b>Homepty</b><PanelLeft /></>}</div>
    <div className={s.account}><User />{expanded && <>Cuenta personal<ChevronsUpDown /></>}</div>
    {expanded && <div className={s.menuLabel}>MENU</div>}
    <div className={s.nav}>{items.map(([label, Icon]) => <div key={label}>
      <div className={`${s.navItem} ${active === label ? s.selected : ""}`}><Icon />{expanded && <span>{label}</span>}{expanded && label === "Agentes IA" && <ChevronDown />}</div>
      {expanded && active === "Agentes IA" && label === active && <div className={s.subnav}>{["Precalificación", "Conversacional", "Inteligencia", "Investigación"].map(x => <div key={x}>{x}</div>)}</div>}
    </div>)}</div>
    <div className={s.profile}><span className={s.avatar}>H</span>{expanded && <div><b>Homepty</b><small>Cuenta personal</small></div>}</div>
  </aside>;
}

function Copilot() {
  return <div className={s.copilot}><Sparkles /><span>Pregúntale al Copilot...</span><small>ABRIR</small></div>;
}

function Shell({ active, expanded = false, rail, children }: { active: string; expanded?: boolean; rail?: ReactNode; children: ReactNode }) {
  return <div className={s.shell}><Sidebar active={active} expanded={expanded} /><div className={s.workspace}>{children}<Copilot /></div>{rail}</div>;
}

function Header({ title, tools }: { title: string; tools?: ReactNode }) {
  return <div className={s.header}><h3>{title}</h3><div className={s.headerTools}>{tools}<span className={s.notification}><Bell /><i>2</i></span><span className={s.round}><PanelLeft /></span></div></div>;
}

const properties = [
  { price: "$4,500,000", title: "CASA EN VENTA AL ...", beds: 5, baths: 3, area: 340, x: 306, y: 287 },
  { price: "$2,164,386", title: "CASAS EN VENTA E...", beds: 3, baths: 3, area: 123, x: 653, y: 287 },
  { price: "$3,095,000", title: "CASA EN PREVENTA...", beds: 3, baths: 3, area: 160, x: 1000, y: 287 },
  { price: "$9,150,000", title: "CASA EN VENTA EN ...", beds: 3, baths: 3, area: 299, x: 1347, y: 287 },
  { price: "$35,000", title: "CASA EN RENTA AL ...", beds: 3, baths: 2, area: 300, x: 306, y: 678 },
  { price: "$16,000", title: "CASA EN RENTA AL ...", beds: 3, baths: 2, area: 140, x: 653, y: 678 },
  { price: "$40,000", title: "CASA EN RENTA AL ...", beds: 5, baths: 5, area: 375, x: 1000, y: 678 },
  { price: "$16,000", title: "DEPARTAMENTO A...", beds: 2, baths: 2, area: 62, x: 1347, y: 678 },
];

// CSS crops only the photographic regions of the supplied reference; the UI is DOM.
function PropertyPhoto({ index, className = "" }: { index: number; className?: string }) {
  const p = properties[index];
  return <div className={`${s.photo} ${className}`} style={{ "--photo-x": `${p.x / (2048 - 327) * 100}%`, "--photo-y": `${(p.y + 38) / (1173 - 137) * 100}%` } as CSSProperties} />;
}

function PropertyCard({ index }: { index: number }) {
  const p = properties[index];
  return <div className={s.property}><div className={s.propertyImage}><PropertyPhoto index={index} /><span className={`${s.operation} ${index > 3 ? s.rent : ""}`}>{index > 3 ? "RENTA" : "COMPRA-VENTA"}</span><div className={s.imageActions}><CirclePlus /><Heart /></div></div><div className={s.propertyBody}><strong>{p.price}</strong>{index > 3 && <small> /mes</small>}<div>{p.title}</div><p className={s.facts}><span><BedDouble />{p.beds}</span><span><Bath />{p.baths}</span><span><SquareArrowOutUpRight />{p.area} m²</span><span><Building />1 piso</span></p></div></div>;
}

function ActivityRail() {
  return <aside className={s.rail}><h4>Actividad Reciente <MoreHorizontal /></h4><div className={s.agenda}><b>AGENDA HOY <em>Ver todo</em></b><Calendar /><p>Sin agenda para hoy</p><a>Ir al calendario</a></div><div className={s.railLabel}>BORRADORES <span>5</span></div>{["Local Plaza Andares", "Rancho Los Encinos", "Suite Central Reforma", "Nave Parque Industrial 7", "Villa Punta Serena"].map(name => <div className={s.draft} key={name}><ClipboardList /><div>{name}<small>Unidad</small></div><a>Continuar</a><Trash2 /></div>)}<div className={s.railLabel}>NUEVOS LEADS</div>{["Betsabee", "Edu", "Edu", "Edu Prueba 2"].map((name, i) => <div key={`${name}-${i}`} className={s.lead}><span style={{ background: ["#fce7f3", "#d1fae5", "#dbeafe", "#fef3c7"][i] }}>{name === "Edu Prueba 2" ? "EP" : name[0]}</span><div><b>{name}</b><small>En proceso · {i === 3 ? "Rentar" : "Comprar"}</small></div></div>)}</aside>;
}

function Marketplace() {
  return <Shell active="Inicio" expanded rail={<ActivityRail />}><Header title="Marketplace" tools={<><span className={s.search}><Search />Buscar propiedades...</span><span className={s.pill}><Filter />Filtros</span><span className={s.blueButton}><Plus />Crear</span></>} /><div className={s.market}><div className={s.quickActions}>{[["Análisis de Rentabilidad", BarChart3], ["Ofertas Inmobiliarias", Sparkles], ["Estimar Valor", Briefcase]].map(([label, Icon], i) => { const ActionIcon = Icon as typeof BarChart3; return <div key={String(label)}><span className={s.actionIcon} data-tone={i}><ActionIcon /></span><ArrowUpRight /><h4>{String(label)}</h4></div>; })}</div>{["En Venta", "En Renta", "Desarrollos"].map((label, row) => <section className={s.listingSection} key={label}><div className={s.listingTitle}><h4>{label}</h4><span>{[13, 10, 22][row]} en Saltillo</span><div><ChevronLeft /><ChevronRight /><a>Ver todos ›</a></div></div><div className={s.propertyGrid}>{[0, 1, 2, 3].map(i => <PropertyCard key={i} index={(row === 1 ? 4 : 0) + i} />)}</div></section>)}</div></Shell>;
}

function Checked({ children }: { children: ReactNode }) { return <div className={s.checked}><span><Check /></span><div>{children}</div></div>; }

function Agent() {
  return <Shell active="Agentes IA" expanded><Header title="Agente de precalificación" /><div className={s.agent}><div className={s.agentStatus}>● DISPONIBLE　● TRABAJANDO</div><p>Revisa la documentación del prospecto, detecta lo que falta y da seguimiento hasta completarla.</p><div className={s.agentStats}>{[["COMPLETADOS", "7"], ["PENDIENTES DE TI", "0"], ["FALLIDOS", "9"], ["ÚLTIMA VEZ", "24-sep"]].map(([label, value]) => <div key={label}><small>{label}</small><div>{value}</div></div>)}</div><small>Últimos 30 días.</small><div className={s.risk}>CAPACIDADES Y TECHO DE RIESGO</div><div className={s.config}><h4>PASO 1 — CONFIGURA</h4><p>Defines sobre qué trabaja y con qué ritmo. Lo que sabe hacer no se configura: viene con el agente.</p><Checked>Dejar que trabaje solo<small>Despierta por su ritmo, por lo que pasa en la plataforma, o cuando el Copilot se lo pide.</small></Checked><div className={s.field}><div>Cada cuánto barre</div><div className={s.cadence}>{["Sin barrida", "Cada hora", "Una vez al día", "Una vez por semana"].map((x, i) => <span className={i === 2 ? s.cadenceSelected : ""} key={x}>{x}</span>)}</div><small>Sin barrida sigue reaccionando a hechos y a lo que le pida el Copilot.</small></div><div className={s.field}><div>Cuántos revisa por corrida</div><div className={s.input}>10</div><small>El presupuesto de cada corrida es acotado. Un tope alto hace que se quede sin saldo a la mitad.</small></div><div className={s.field}><div>Qué quieres que priorice</div><div className={s.textarea}>Todo prospecto con capacidad de compra este mes</div><small>Ajusta su prioridad dentro de lo que ya sabe hacer. No le das permisos ni herramientas nuevas.</small></div><div className={s.permissions}><div>Qué puede hacer sin preguntarte</div><Checked>Mover prospectos de etapa cuando califiquen<small>ACTUALIZAR_ETAPA_PROSPECTO</small></Checked><Checked>Escribir por WhatsApp para pedir documentos que faltan<small>ENVIAR WHATSAPP</small></Checked><small>Lo demás te lo propone y espera tu aprobación.</small></div><div className={s.save}>Guardar configuración</div></div></div></Shell>;
}

function Explore() {
  return <Shell active="Explorar" rail={<aside className={`${s.rail} ${s.results}`}><h4>Resultados <Filter /></h4><div className={s.railLabel}>PROPIEDADES DETECTADAS (366)</div>{[0, 4, 0, 5, 2, 3, 6, 7].map((index, i) => <div className={s.result} key={i}><PropertyPhoto index={index} /><div><b>{properties[index].title}</b><small>{properties[index].beds} Hab · {properties[index].baths} Baños · {properties[index].area} m²</small><strong>{properties[index].price}</strong></div></div>)}</aside>}><div className={s.map}><div className={s.mapSearch}><PanelLeft /><span className={s.search}><Search />Buscar zona, calle o ID...</span><div><span className={s.pill}>Operación <ChevronDown /></span><span className={s.pill}><Filter />Filtros</span></div><span className={s.blueButton}><Search />Buscar</span><Bell /></div><div className={s.mapPanels}><div className={s.mapCard}><h4>Puntos de interés <X /></h4><p>Radio: 1 km</p><div className={s.slider}><i /></div><div className={s.poiChips}>{["Todas", "Supermercados", "Farmacias", "Plazas comerciales", "Mercados y abasto", "Hospitales y clínicas", "Escuelas"].map((x, i) => <span key={x} className={i === 1 || i === 4 ? s.chipSelected : ""}>{x}</span>)}</div><p>35 lugares encontrados</p><small>Google muestra una selección de hasta 20 lugares por categoría. La búsqueda no garantiza un censo exhaustivo.</small><small>INEGI · DENUE · © OpenStreetMap contributors · ODbL · Google Maps</small></div><div className={s.mapCard}><h4>Movilidad</h4><p>Selecciona un punto de interés para consultar el traslado.</p></div><div className={s.mapCard}><h4><TrendingUp /> Análisis de inversión</h4><p>Calcula rendimiento, flujo y valor presente a partir del escenario financiero que declares.</p><span className={s.blueButton}>Analizar inversión</span></div><div className={s.mapCard}><h4>Precio de zona</h4><small className={s.warning}>Evidencia local limitada</small><div className={s.zonePrice}>$14,116 <small>/m²</small></div><div className={s.zoneScale} /><p>Precio publicado <b>$19,313</b></p><p>Valor por área (m2) <b>$3.29M</b></p><small>Base local 2023-12-31 · estimación local ajustada por evidencia disponible. No equivale a un avalúo certificado.</small></div></div><div className={s.mapProperty}><X /><div className={s.selectedHouse} /><h4>CASA FRACC. EMILIO CARRANZA</h4><small>CASA</small><strong>$4,500,000</strong><p>□ 206 m²　♙ 4 hab</p><div className={s.outlineButton}>Ver entorno</div><div className={s.blueButton}>Ver propiedad <ArrowRight /></div></div></div></Shell>;
}

function Messages() {
  return <Shell active="Mensajes"><div className={s.messages}><div className={s.conversations}><div className={s.conversationHeader}><h3>Mensajes</h3><span className={s.round}><Plus /></span></div><div className={s.contact}><span className={s.contactAvatar}><Users /></span><div>Homeptiers<small>Aquí queremos conectar sus canales...</small></div><time>06-ago</time></div><div className={`${s.contact} ${s.contactActive}`}><span className={s.contactAvatar}>LG</span><div><b>Leonardo González Tejeda</b><small>Hey</small></div><time>21-jul</time></div></div><div className={s.chat}><div className={s.chatHeader}><span className={s.contactAvatar}>LG</span><div><b>Leonardo González Tejeda</b><small>Mensaje directo</small></div></div><div className={s.sent}>Leo<small>06:18 a.m.</small></div><div className={s.received}>Hey<small>08:09 p.m.</small></div><div className={s.composer}><Paperclip /><span>Escribe un mensaje... (Enter para enviar)</span><span><Send /></span></div></div></div></Shell>;
}

const graphNodes = Array.from({ length: 33 }, (_, i) => {
  const angle = (i * 137.508 - 90) * Math.PI / 180;
  const radius = 95 + Math.sqrt(i / 32) * 165;
  return { x: 540 + Math.cos(angle) * radius * 1.05, y: 306 + Math.sin(angle) * radius * .82 };
});

function ContextGraph() {
  return <div className={s.graphCard}><div className={s.graphHeader}><h4>Contexto de tu negocio</h4><small>PROYECCIÓN PARCIAL · HIPERGRAFO HOMEPTY</small><span>35 nodos　/　41 relaciones</span></div><svg className={s.graph} viewBox="0 0 1064 550" aria-hidden="true">{graphNodes.map((p, i) => <path key={`e${i}`} d={`M540 306 Q${(p.x + 540) / 2 + 35} ${(p.y + 306) / 2 - 30} ${p.x} ${p.y}`} fill="none" stroke="#d5dce4" strokeWidth="1.4" />)}{graphNodes.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="10" fill={i > 30 ? "#b0b7c0" : "#4e86c4"} stroke="white" strokeWidth="2" />)}<circle cx="540" cy="306" r="59" fill="#eef1f4" /><circle cx="540" cy="306" r="44" fill="white" stroke="#cdd5df" strokeWidth="2" /><text x="540" y="305" textAnchor="middle" fill="#20252b" fontSize="18" fontWeight="700">H</text><text x="540" y="326" textAnchor="middle" fill="#8792a2" fontSize="9" letterSpacing="1">TU NEGOCIO</text></svg>{[["Edu", "CLIENTE", "3 relaciones · observado"], ["Saltillo", "MUNICIPIO", "5 relaciones · observado"], ["Edu", "CLIENTE", "3 relaciones · observado"], ["Edu Prueba 2", "CLIENTE", "2 relaciones · observado"]].map(([name, kind, text], i) => <div key={i} className={s.nodeCard} data-position={i}><b>{name}</b><small>{kind}</small><span>{text}</span></div>)}<div className={s.graphLegend}>🔵 Tu contexto　 ● Contexto Homepty Brain　　33 entidades propias · 2 de contexto · 41 relaciones</div><div className={s.graphControls}>−　＋　◎</div></div>;
}

function OrganizationRail() {
  return <aside className={s.rail}><h4>Tu organización</h4><div className={s.railLabel}>ORGANIZACIONES</div><div className={s.orgCard}><b>Inmobiliaria Demo</b><div className={s.compliance}><span>0%</span><div><b>Cumplimiento</b><small>3 tareas en el equipo</small></div></div><div className={s.orgMetrics}><span><b>⚠ 2</b><small>VENCIDAS</small></span><span><b>◷ —</b><small>DÍAS CIERRE</small></span><span><b>ϟ 0</b><small>ACTIV./MIEMBRO</small></span></div></div></aside>;
}

function Intelligence() {
  return <Shell active="Inteligencia" rail={<OrganizationRail />}><div className={s.intelligence}><h3>Buenas tardes, <span>Homepty</span></h3><div className={s.date}>JUEVES, 24 DE SEPTIEMBRE DE 2026</div><div className={s.kpis}>{[["CLIENTES ACTIVOS", "8", Users, "clientes · últimos 30 días"], ["ALCANCE DEL EMBUDO", "5", Filter, "eventos · últimos 30 días"], ["OPERACIONES ABIERTAS", "0", Briefcase, "operaciones · últimos 30 días"], ["TASA DE CIERRE", "No disponible", TrendingUp, "Ninguna de tus operaciones se ha resuelto todavía."], ["PROPIEDADES EN VENTA", "7", Building, "cartera activa"], ["TOTAL DE INMUEBLES", "10", BarChart3, "7 venta · 3 renta"]].map(([label, value, Icon, detail]) => { const KpiIcon = Icon as typeof Users; return <div key={String(label)}><span><KpiIcon /></span><div><b>{String(label)}</b><div className={value === "No disponible" ? s.unavailable : s.kpiValue}>{String(value)}</div><small>{String(detail)}</small></div></div>; })}</div><div className={s.intelGrid}><ContextGraph /><div className={s.intelSummary}><h4>Inteligencia</h4><div className={s.degraded}>◐ DEGRADADA</div>{[["187", "contexto analizado"], ["0", "señales críticas"], ["7", "insights generados"], ["0", "preguntas resueltas"], ["85", "análisis en la ventana"], ["7", "estados con cobertura publicada"]].map(([n, label]) => <p key={label}><b>{n}</b> {label}</p>)}<p>Contexto actualizado: <b>24 sep</b></p><p>Fuentes al: <b>24 sep</b></p><div className={s.capabilities}><b>CAPACIDADES <span>5 de 16</span></b>{["Valuación de venta", "Valuación de renta", "Plusvalía", "Liquidez", "Absorción", "Análisis de inversión", "Capacidad de compra del mercado", "Escenarios de crédito", "Capacidad crediticia", "Selección de comparables"].map((x, i) => <div key={x}><i className={[0, 5, 7, 9].includes(i) ? s.available : ""} />{x}{![0, 5, 7, 9].includes(i) && <small>{i === 2 ? "VISTA PREVIA" : "NO DISPONIBLE"}</small>}</div>)}</div></div></div><div className={s.operationTitle}>TU OPERACIÓN</div><div className={s.operationPanel}><h4>Tu operación</h4><div><span>EMBUDO COMERCIAL</span><span>PROSPECTOS POR ETAPA</span><span>CANALES DE ATENCIÓN</span></div><p>Visita <i /></p></div></div></Shell>;
}

const screens = [Marketplace, Agent, Explore, Messages, Intelligence];
const names = ["Marketplace", "Agente de precalificación", "Explorar", "Mensajes", "Inteligencia"];

export default function SuiteMockup({ screen }: { screen: number }) {
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = () => element.style.setProperty("--suite-scale", String(element.clientWidth / 2048));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const Screen = screens[screen];
  return <div className={s.viewport} ref={viewport} role="img" aria-label={`Vista de Homepty Suite: ${names[screen]}`}><div className={s.canvas} aria-hidden="true"><Screen /></div></div>;
}
