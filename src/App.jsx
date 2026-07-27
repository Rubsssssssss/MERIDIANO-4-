import { useState, useEffect, useCallback, useRef } from "react";
import { Compass, TrendingUp, TrendingDown, Sparkles, ShieldAlert, Loader2, Home, PieChart, Calculator, Wand2, Users, Lock, Megaphone } from "lucide-react";
import { supabase } from "./supabaseClient";

const MARCA = "MERIDIANO";

// Universo amplio: acciones diversificadas + oro + petróleo + cripto.
// Reemplacen/ajusten esta lista con lo que definan en Finviz.
const UNIVERSO = [
  "NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "AVGO", "AMD", "INTC", "CSCO", "CRM", "ORCL",
  "JPM", "BAC", "GS", "MS", "V", "MA", "AXP", "WFC", "C", "CIB",
  "XOM", "CVX", "EC", "VLO", "OIL",
  "JNJ", "LLY", "ABBV", "MRK", "PFE",
  "WMT", "COST", "HD", "KO", "PG", "MCD",
  "TSLA", "CAT", "GE", "BA",
  "GLD", "BTC", "ETH",
];

const PORTAFOLIOS = [
  { nombre: "Conservador", riesgo: "Riesgo bajo", riesgoColor: "#34C795", descripcion: "Prioriza estabilidad, con la mayor parte en renta fija y acciones grandes.", simple: "Ideal si es tu primera vez invirtiendo o prefieres dormir tranquilo: prioriza no perder por encima de crecer rápido.", activos: "CDT, AAPL, MSFT, oro", partes: [55, 30, 15], colores: ["#1baf7a", "#2a78d6", "#eda100"] },
  { nombre: "Moderado", riesgo: "Riesgo medio", riesgoColor: "#EDA100", descripcion: "Balance entre crecimiento y estabilidad, con algo de exposición a cripto.", simple: "Un punto medio: acepta algo de sube y baja a cambio de la posibilidad de crecer más que un CDT tradicional.", activos: "CDT, AAPL, NVDA, CIB, oro, BTC", partes: [25, 40, 20, 15], colores: ["#1baf7a", "#2a78d6", "#eda100", "#4a3aa7"] },
  { nombre: "Agresivo", riesgo: "Riesgo alto", riesgoColor: "#E8637A", descripcion: "Busca mayor crecimiento, con más peso en cripto y acciones de alto movimiento.", simple: "Para quien puede ver caer su inversión sin asustarse, buscando el mayor crecimiento posible a cambio de más riesgo.", activos: "NVDA, EC, oro, BTC, ETH", partes: [15, 10, 75], colores: ["#2a78d6", "#eda100", "#4a3aa7"] },
];

const PORTAFOLIOS_BLOQUEADOS = [
  { nombre: "Tecnológico", riesgo: "Riesgo medio-alto", riesgoColor: "#EDA100", descripcion: "Enfocado en empresas de tecnología grandes y emergentes.", simple: "Apuesta por las empresas que hacen los computadores, apps e inteligencia artificial que usamos todos los días." },
  { nombre: "Dividendos", riesgo: "Riesgo bajo-medio", riesgoColor: "#34C795", descripcion: "Empresas que reparten utilidades de forma constante.", simple: "Empresas grandes y estables que reparten parte de sus ganancias cada cierto tiempo, como un ingreso extra periódico." },
  { nombre: "Diversificado global", riesgo: "Riesgo medio", riesgoColor: "#EDA100", descripcion: "Mezcla de mercados y monedas para repartir el riesgo.", simple: "No apuesta todo a un solo país o moneda — reparte la inversión en varias partes del mundo." },
];

function TradingViewHeatmap() {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!contenedorRef.current) return;
    contenedorRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: "SPX500",
      grouping: "sector",
      blockSize: "market_cap_basic",
      blockColor: "change",
      locale: "es",
      colorTheme: "dark",
      hasTopBar: true,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      width: "100%",
      height: "480",
    });
    contenedorRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, padding: 4, height: 490, marginBottom: 24 }}>
      <div className="tradingview-widget-container" ref={contenedorRef} style={{ height: "100%" }}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}

// Cambien estas cuentas por las que ustedes sigan para noticias del mercado.
const CUENTAS_X = ["DeItaone", "unusual_whales"];

function TimelineX({ cuenta }) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!contenedorRef.current) return;
    contenedorRef.current.innerHTML = "";
    const link = document.createElement("a");
    link.className = "twitter-timeline";
    link.setAttribute("data-theme", "dark");
    link.setAttribute("data-height", "420");
    link.href = `https://twitter.com/${cuenta}?ref_src=twsrc%5Etfw`;
    link.textContent = `Tweets de @${cuenta}`;
    contenedorRef.current.appendChild(link);

    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load(contenedorRef.current);
    } else {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [cuenta]);

  return <div ref={contenedorRef} style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, overflow: "hidden" }} />;
}

const PREGUNTAS = [
  { id: "monto", label: "¿Cuánto quieres invertir? (USD)", type: "number", placeholder: "500" },
  { id: "plazo", label: "¿Por cuántos meses puedes dejar esta plata quieta?", type: "select", options: ["3", "6", "12", "24"] },
  { id: "riesgo", label: "Si el portafolio baja 15% en un mes, ¿qué haces?", type: "select", options: ["Vendo todo, no aguanto la caída", "Me preocupo pero espero", "No me afecta, sigo esperando"] },
  { id: "interes", label: "¿Algún sector que te interese más?", type: "select", options: ["Tecnología", "Finanzas", "Energía", "Sin preferencia"] },
  { id: "conocimiento", label: "¿Qué tanto conoces de inversiones en bolsa?", type: "select", options: ["Nada, es mi primera vez", "Algo básico", "Tengo experiencia"] },
];

export default function AppUnificada() {
  const [tab, setTab] = useState("landing");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#0A0F1C", color: "#EDEFF3", minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid #23304A", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setTab("landing")}>
          <Compass size={20} color="#C9A15A" />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: 1 }}>{MARCA}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: "1px solid #23304A", overflowX: "auto" }}>
        <NavButton icon={<Megaphone size={14} />} label="Inicio" active={tab === "landing"} onClick={() => setTab("landing")} />
        <NavButton icon={<Home size={14} />} label="Mapa de mercado" active={tab === "inicio"} onClick={() => setTab("inicio")} />
        <NavButton icon={<PieChart size={14} />} label="Portafolios modelo" active={tab === "portafolios"} onClick={() => setTab("portafolios")} />
        <NavButton icon={<Calculator size={14} />} label="Simulador CDT" active={tab === "cdt"} onClick={() => setTab("cdt")} />
        <NavButton icon={<Wand2 size={14} />} label="Te asesoramos" active={tab === "motor"} onClick={() => setTab("motor")} />
        <NavButton icon={<Users size={14} />} label="Panel" active={tab === "panel"} onClick={() => setTab("panel")} />
      </div>

      <div style={{ maxWidth: tab === "landing" ? "100%" : 700, margin: "0 auto", padding: tab === "landing" ? 0 : "28px 20px 60px" }}>
        {tab === "landing" && <SeccionLanding irA={setTab} />}
        {tab === "inicio" && <SeccionInicio />}
        {tab === "portafolios" && <SeccionPortafolios />}
        {tab === "cdt" && <SeccionCDT />}
        {tab === "motor" && <SeccionMotor />}
        {tab === "panel" && <SeccionPanel />}
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        background: active ? "#111827" : "transparent", color: active ? "#EDEFF3" : "#8B94A7",
        border: active ? "1px solid #23304A" : "1px solid transparent", borderRadius: 4,
        padding: "8px 12px", fontSize: 13, cursor: "pointer",
      }}
    >
      {icon}{label}
    </button>
  );
}

function SeccionLanding({ irA }) {
  return (
    <div>
      <div style={{ padding: "70px 20px 60px", textAlign: "center", borderBottom: "1px solid #23304A" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <Compass size={28} color="#C9A15A" />
          <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: 1 }}>{MARCA}</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 600, margin: "0 0 14px", maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.25 }}>
          Portafolios diversificados, pensados para crecer con el tiempo.
        </h1>
        <p style={{ fontSize: 14, color: "#8B94A7", maxWidth: 420, margin: "0 auto 28px" }}>
          Mapa de mercado en vivo, portafolios modelo, y asesoría a tu medida. Inversión a más de 6 meses, con riesgo, como toda inversión real.
        </p>
        <button onClick={() => irA("motor")} style={{ background: "#C9A15A", color: "#0A0F1C", border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Quiero mi portafolio
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px", borderBottom: "1px solid #23304A" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 30 }}>
          <div>
            <h2 style={{ fontSize: 13, color: "#C9A15A", letterSpacing: 2, margin: "0 0 10px" }}>QUIÉNES SOMOS</h2>
            <p style={{ fontSize: 14, color: "#EDEFF3", lineHeight: 1.6, margin: 0 }}>
              Somos un equipo que cree que invertir en bolsa no debería ser solo para expertos. Armamos portafolios diversificados y explicamos cada decisión en palabras simples, sin tecnicismos innecesarios.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: 13, color: "#C9A15A", letterSpacing: 2, margin: "0 0 10px" }}>QUÉ HACEMOS</h2>
            <p style={{ fontSize: 14, color: "#EDEFF3", lineHeight: 1.6, margin: 0 }}>
              Analizamos el mercado y armamos combinaciones de acciones, cripto y materias primas pensadas para distintos niveles de riesgo. Tú decides cuál se ajusta a ti, y te acompañamos en el camino.
            </p>
          </div>
          <div>
            <h2 style={{ fontSize: 13, color: "#C9A15A", letterSpacing: 2, margin: "0 0 10px" }}>CÓMO TE AYUDAMOS A CRECER</h2>
            <p style={{ fontSize: 14, color: "#EDEFF3", lineHeight: 1.6, margin: 0 }}>
              En vez de dejar tus ahorros parados, los ponemos a trabajar en activos diversificados, con un horizonte de mediano a largo plazo. No es magia ni es sin riesgo — es una forma más informada de invertir.
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "50px 20px" }}>
        <h2 style={{ fontSize: 13, color: "#C9A15A", letterSpacing: 2, textAlign: "center", margin: "0 0 30px" }}>NUESTROS PORTAFOLIOS MODELO</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
          {PORTAFOLIOS.map((p) => (
            <div key={p.nombre} style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 8, padding: 18 }}>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{p.nombre}</p>
              <span style={{ fontSize: 11, color: p.riesgoColor, border: `1px solid ${p.riesgoColor}`, borderRadius: 4, padding: "2px 8px" }}>{p.riesgo}</span>
              <p style={{ fontSize: 12, color: "#8B94A7", margin: "12px 0 0", lineHeight: 1.5 }}>{p.simple}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={() => irA("portafolios")} style={{ background: "transparent", color: "#C9A15A", border: "1px solid #C9A15A", borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Ver todos los portafolios
          </button>
        </div>
      </div>

      <div style={{ background: "#111827", borderTop: "1px solid #23304A", borderBottom: "1px solid #23304A", padding: "50px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: 13, color: "#C9A15A", letterSpacing: 2, margin: "0 0 20px" }}>SÍGUENOS</h2>
        <p style={{ fontSize: 13, color: "#8B94A7", maxWidth: 380, margin: "0 auto 20px" }}>
          Contenido educativo sobre inversión y actualizaciones de nuestros portafolios, todos los días.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" style={redSocialStyle}>Instagram</a>
          <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" style={redSocialStyle}>TikTok</a>
          <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" style={redSocialStyle}>Facebook</a>
          <a href="https://wa.me/57" target="_blank" rel="noopener noreferrer" style={redSocialStyle}>WhatsApp</a>
        </div>
        <p style={{ fontSize: 11, color: "#8B94A7", marginTop: 14 }}>
          Reemplacen estos links por las cuentas reales de Meridiano.
        </p>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "40px 20px 60px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#8B94A7", lineHeight: 1.6 }}>
          Contenido informativo, no es asesoría financiera regulada. Toda inversión conlleva riesgo de pérdida.
          Horizonte de inversión recomendado: superior a 6 meses.
        </p>
      </div>
    </div>
  );
}

const redSocialStyle = {
  color: "#EDEFF3", border: "1px solid #23304A", borderRadius: 6, padding: "8px 16px",
  fontSize: 13, textDecoration: "none", background: "#0A0F1C",
};

function SeccionInicio() {
  const [crypto, setCrypto] = useState(null);

  const fetchCrypto = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await res.json();
      setCrypto({
        btc: { price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change },
        eth: { price: data.ethereum.usd, change: data.ethereum.usd_24h_change },
      });
    } catch (e) {
      setCrypto("error");
    }
  }, []);

  useEffect(() => {
    fetchCrypto();
    const i = setInterval(fetchCrypto, 60000);
    return () => clearInterval(i);
  }, [fetchCrypto]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Mapa de calor de acciones</h1>
      <p style={{ fontSize: 12, color: "#8B94A7", margin: "0 0 12px" }}>Datos reales en vivo, provistos por TradingView.</p>

      <TradingViewHeatmap />

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Cripto y materias primas en vivo</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
        <PrecioCard label="BTC / USD" data={crypto?.btc} />
        <PrecioCard label="ETH / USD" data={crypto?.eth} />
        <PrecioCard label="Oro" data={{ price: 2634.2, change: 0.41 }} />
        <PrecioCard label="Petróleo WTI" data={{ price: 78.3, change: -0.9 }} />
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Noticias del mercado, en vivo desde X</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {CUENTAS_X.map((cuenta) => (
          <TimelineX key={cuenta} cuenta={cuenta} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#8B94A7", marginTop: 8 }}>
        Cambien las cuentas en la constante CUENTAS_X del código por las que ustedes sigan.
      </p>
    </div>
  );
}

function PrecioCard({ label, data }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, padding: 14 }}>
      <p style={{ fontSize: 12, color: "#8B94A7", margin: "0 0 4px" }}>{label}</p>
      {data ? (
        <>
          <p style={{ fontSize: 20, margin: 0, fontFamily: "monospace" }}>${data.price?.toLocaleString()}</p>
          <p style={{ fontSize: 12, margin: "4px 0 0", color: data.change >= 0 ? "#34C795" : "#E8637A" }}>
            {data.change >= 0 ? "+" : ""}{data.change?.toFixed(2)}%
          </p>
        </>
      ) : (
        <p style={{ fontSize: 12, color: "#8B94A7" }}>cargando…</p>
      )}
    </div>
  );
}

function SeccionPortafolios() {
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px" }}>Portafolios modelo</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {PORTAFOLIOS.map((p) => (
          <div key={p.nombre} style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{p.nombre}</p>
            <span style={{ fontSize: 11, color: p.riesgoColor, border: `1px solid ${p.riesgoColor}`, borderRadius: 4, padding: "2px 8px" }}>{p.riesgo}</span>
            <p style={{ fontSize: 12, color: "#8B94A7", margin: "12px 0 8px" }}>{p.descripcion}</p>
            <p style={{ fontSize: 12, color: "#EDEFF3", margin: "0 0 12px", lineHeight: 1.5, background: "#0F1626", borderRadius: 4, padding: 10 }}>{p.simple}</p>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", margin: "0 0 8px" }}>
              {p.partes.map((val, i) => (
                <div key={i} style={{ width: `${val}%`, background: p.colores[i] }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#8B94A7", margin: "0 0 12px", filter: "blur(5px)", userSelect: "none" }}>{p.activos}</p>
            <button style={{ width: "100%", background: "#C9A15A", color: "#0A0F1C", border: "none", borderRadius: 4, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Desbloquear
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#8B94A7", margin: "16px 0 24px" }}>
        Composición ilustrativa, punto de partida. No constituye promesa de rendimiento.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Portafolios premium</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {PORTAFOLIOS_BLOQUEADOS.map((p) => (
          <div key={p.nombre} style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 8, padding: 16, position: "relative" }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{p.nombre}</p>
            <span style={{ fontSize: 11, color: p.riesgoColor, border: `1px solid ${p.riesgoColor}`, borderRadius: 4, padding: "2px 8px" }}>{p.riesgo}</span>
            <p style={{ fontSize: 12, color: "#8B94A7", margin: "12px 0 12px" }}>{p.descripcion}</p>
            <p style={{ fontSize: 12, color: "#EDEFF3", margin: "0 0 12px", lineHeight: 1.5, background: "#0F1626", borderRadius: 4, padding: 10 }}>{p.simple}</p>
            <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: "40%", background: "#2a78d6" }} /><div style={{ width: "35%", background: "#4a3aa7" }} /><div style={{ width: "25%", background: "#eda100" }} />
            </div>
            <button style={{ width: "100%", background: "#C9A15A", color: "#0A0F1C", border: "none", borderRadius: 4, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Desbloquear
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionCDT() {
  const [monto, setMonto] = useState(10000000);
  const [tasa, setTasa] = useState(11.5);
  const [plazo, setPlazo] = useState(12);
  const final = monto * Math.pow(1 + tasa / 100, plazo / 12);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 16px" }}>Simulador de CDT</h1>
      <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 8, padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          <Campo label="Monto (COP)"><input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} style={inputStyle} /></Campo>
          <Campo label="Tasa EA (%)"><input type="number" step="0.1" value={tasa} onChange={(e) => setTasa(Number(e.target.value))} style={inputStyle} /></Campo>
          <Campo label="Plazo (meses)"><input type="number" value={plazo} onChange={(e) => setPlazo(Number(e.target.value))} style={inputStyle} /></Campo>
        </div>
        <div style={{ borderTop: "1px solid #23304A", paddingTop: 12 }}>
          <p style={{ fontSize: 11, color: "#8B94A7", margin: 0 }}>MONTO FINAL ESTIMADO</p>
          <p style={{ fontSize: 22, fontFamily: "monospace", margin: "4px 0 0" }}>${Math.round(final).toLocaleString("es-CO")}</p>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#8B94A7", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function SeccionMotor() {
  const [respuestas, setRespuestas] = useState({});
  const [contacto, setContacto] = useState({ nombre: "", correo: "", telefono: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const actualizar = (id, valor) => setRespuestas((r) => ({ ...r, [id]: valor }));

  const CONTACTO_COMPLETO = contacto.nombre.trim() && contacto.correo.trim() && contacto.telefono.trim();
  const todasContestadas = PREGUNTAS.every((p) => respuestas[p.id]) && CONTACTO_COMPLETO;
  const contestadas = PREGUNTAS.filter((p) => respuestas[p.id]).length + (CONTACTO_COMPLETO ? 1 : 0);

  const enviar = async () => {
    setEnviando(true);
    setError("");
    try {
      const { error: errorDB } = await supabase.from("Clientes").insert([{
        nombre: contacto.nombre,
        correo: contacto.correo,
        telefono: contacto.telefono,
        monto: respuestas.monto,
        plazo: respuestas.plazo,
        riesgo: respuestas.riesgo,
        interes: respuestas.interes,
        conocimiento: respuestas.conocimiento,
        estado: "Activo",
      }]);
      if (errorDB) console.error("Error guardando en Supabase:", errorDB.message);

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: "30dc2cb4-be97-4da0-be34-981f0b9c1e5f",
          subject: `Nueva solicitud de portafolio — ${contacto.nombre}`,
          nombre: contacto.nombre,
          correo: contacto.correo,
          telefono: contacto.telefono,
          monto_a_invertir: respuestas.monto,
          plazo_meses: respuestas.plazo,
          tolerancia_riesgo: respuestas.riesgo,
          sector_interes: respuestas.interes,
          nivel_conocimiento: respuestas.conocimiento,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEnviado(true);
      } else {
        setError("No se pudo enviar. Intenta de nuevo en un momento.");
      }
    } catch (e) {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <Sparkles size={32} color="#C9A15A" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>¡Listo, {contacto.nombre.split(" ")[0]}!</h1>
        <p style={{ fontSize: 14, color: "#8B94A7", maxWidth: 380, margin: "0 auto" }}>
          Recibimos tus respuestas. Nuestro equipo va a armar tu portafolio y te contacta pronto a {contacto.correo}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Sparkles size={20} color="#C9A15A" />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Te asesoramos en tu portafolio</h1>
      </div>
      <p style={{ fontSize: 13, color: "#8B94A7", margin: "0 0 20px" }}>Contesta unas preguntas cortas. Nuestro equipo revisa tus respuestas y te contacta con tu portafolio personalizado.</p>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[...PREGUNTAS, { id: "contacto" }].map((p, i) => (
          <div key={p.id} style={{ flex: 1, height: 4, borderRadius: 2, background: (p.id === "contacto" ? CONTACTO_COMPLETO : respuestas[p.id]) ? "#C9A15A" : "#23304A" }} />
        ))}
      </div>

      <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: "#EDEFF3", display: "block", marginBottom: 8 }}>Tu nombre</label>
            <input type="text" placeholder="Nombre completo" value={contacto.nombre} onChange={(e) => setContacto((c) => ({ ...c, nombre: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#EDEFF3", display: "block", marginBottom: 8 }}>Tu correo</label>
            <input type="email" placeholder="correo@ejemplo.com" value={contacto.correo} onChange={(e) => setContacto((c) => ({ ...c, correo: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "#EDEFF3", display: "block", marginBottom: 8 }}>Tu teléfono</label>
            <input type="tel" placeholder="300 123 4567" value={contacto.telefono} onChange={(e) => setContacto((c) => ({ ...c, telefono: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {PREGUNTAS.map((p, i) => (
          <div key={p.id} style={{ marginBottom: i === PREGUNTAS.length - 1 ? 0 : 18 }}>
            <label style={{ fontSize: 13, color: "#EDEFF3", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", background: respuestas[p.id] ? "#C9A15A" : "#23304A", color: respuestas[p.id] ? "#0A0F1C" : "#8B94A7", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                {i + 1}
              </span>
              {p.label}
            </label>
            {p.type === "number" ? (
              <input type="number" placeholder={p.placeholder} value={respuestas[p.id] || ""} onChange={(e) => actualizar(p.id, e.target.value)} style={inputStyle} />
            ) : (
              <select value={respuestas[p.id] || ""} onChange={(e) => actualizar(p.id, e.target.value)} style={inputStyle}>
                <option value="">Selecciona…</option>
                {p.options.map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>
            )}
          </div>
        ))}
      </div>

      <button onClick={enviar} disabled={!todasContestadas || enviando} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: todasContestadas ? "#C9A15A" : "#3A3F4D", color: "#0A0F1C", border: "none", borderRadius: 6, padding: 14, fontSize: 14, fontWeight: 600, cursor: todasContestadas ? "pointer" : "not-allowed", transition: "background 0.2s" }}>
        {enviando ? <Loader2 size={16} /> : <Sparkles size={16} />}
        {enviando ? "Enviando…" : todasContestadas ? "Enviar y solicitar mi portafolio" : `Faltan ${PREGUNTAS.length + 1 - contestadas} campos`}
      </button>

      {error && <p style={{ color: "#E8637A", fontSize: 13, marginTop: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, background: "#15121A", border: "1px solid #3A2430", borderRadius: 4, padding: 14, marginTop: 24 }}>
        <ShieldAlert size={16} color="#E8637A" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: "#B9A3AA", lineHeight: 1.6, margin: 0 }}>
          Contenido informativo, no es asesoría financiera regulada. Toda inversión conlleva riesgo de pérdida.
        </p>
      </div>
    </div>
  );
}

function SeccionPanel() {
  const [autenticado, setAutenticado] = useState(false);
  const [clave, setClave] = useState("");
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Cambien esta clave por una propia. Es una protección simple, no de nivel bancario.
  const CLAVE_EQUIPO = "meridiano2026";

  const cargarClientes = async () => {
    setCargando(true);
    setError("");
    const { data, error: err } = await supabase.from("Clientes").select("*").order("created_at", { ascending: false });
    if (err) setError("No se pudo conectar con la base de datos.");
    else setClientes(data || []);
    setCargando(false);
  };

  useEffect(() => {
    if (autenticado) cargarClientes();
  }, [autenticado]);

  const cambiarEstado = async (id, estadoActual) => {
    const nuevo = estadoActual === "Activo" ? "Inactivo" : "Activo";
    await supabase.from("Clientes").update({ estado: nuevo }).eq("id", id);
    setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, estado: nuevo } : c)));
  };

  if (!autenticado) {
    return (
      <div style={{ maxWidth: 320, margin: "60px auto", textAlign: "center" }}>
        <Lock size={24} color="#C9A15A" style={{ marginBottom: 12 }} />
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>Panel del equipo</h1>
        <input
          type="password"
          placeholder="Clave del equipo"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && clave === CLAVE_EQUIPO && setAutenticado(true)}
          style={inputStyle}
        />
        <button
          onClick={() => setAutenticado(clave === CLAVE_EQUIPO)}
          style={{ width: "100%", marginTop: 10, background: "#C9A15A", color: "#0A0F1C", border: "none", borderRadius: 4, padding: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Entrar
        </button>
      </div>
    );
  }

  const activos = clientes.filter((c) => c.estado === "Activo").length;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>Panel de clientes</h1>
      <p style={{ fontSize: 12, color: "#8B94A7", margin: "0 0 20px" }}>Solo visible para el equipo.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, padding: "12px 18px" }}>
          <p style={{ fontSize: 11, color: "#8B94A7", margin: 0 }}>TOTAL</p>
          <p style={{ fontSize: 20, margin: "4px 0 0", fontFamily: "monospace" }}>{clientes.length}</p>
        </div>
        <div style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, padding: "12px 18px" }}>
          <p style={{ fontSize: 11, color: "#8B94A7", margin: 0 }}>ACTIVOS</p>
          <p style={{ fontSize: 20, margin: "4px 0 0", fontFamily: "monospace", color: "#34C795" }}>{activos}</p>
        </div>
      </div>

      {cargando && <p style={{ fontSize: 13, color: "#8B94A7" }}>Cargando…</p>}
      {error && <p style={{ fontSize: 13, color: "#E8637A" }}>{error} Revisa que ya hayas conectado tu proyecto de Supabase en supabaseClient.js.</p>}

      {!cargando && !error && clientes.length === 0 && (
        <p style={{ fontSize: 13, color: "#8B94A7" }}>Todavía no hay clientes registrados.</p>
      )}

      {clientes.map((c) => (
        <div key={c.id} style={{ background: "#111827", border: "1px solid #23304A", borderRadius: 4, padding: 14, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{c.nombre}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8B94A7" }}>{c.correo} · {c.telefono}</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8B94A7" }}>
              ${c.monto} USD · {c.plazo} meses · {c.interes}
            </p>
          </div>
          <button
            onClick={() => cambiarEstado(c.id, c.estado)}
            style={{
              fontSize: 11, fontWeight: 600, border: "none", borderRadius: 4, padding: "6px 12px", cursor: "pointer",
              background: c.estado === "Activo" ? "rgba(52,199,149,0.15)" : "rgba(232,99,122,0.15)",
              color: c.estado === "Activo" ? "#34C795" : "#E8637A",
            }}
          >
            {c.estado}
          </button>
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0F1626", border: "1px solid #23304A", borderRadius: 4,
  padding: "10px 12px", color: "#EDEFF3", fontSize: 14, outline: "none", boxSizing: "border-box",
};
