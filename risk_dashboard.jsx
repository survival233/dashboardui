import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap, ScatterChart, Scatter, ZAxis } from "recharts";
import _ from "lodash";

// ─── Embedded Aggregated Data ─────────────────────────────────────────────
const DATA = {"kpis":{"totalLoans":316955,"totalVolume":3988551700,"avgIntRate":11.86,"defaultRate":15.78,"avgReturn":4.95,"avgLoan":12584,"chargedOff":50022,"fullyPaid":266933},"byState":[{"state":"CA","count":43673,"volume":578809775,"defaultRate":16.5,"avgReturn":3.92},{"state":"TX","count":27151,"volume":357405325,"defaultRate":15.9,"avgReturn":4.91},{"state":"NY","count":26806,"volume":340783375,"defaultRate":16.9,"avgReturn":5.1},{"state":"FL","count":23895,"volume":288566700,"defaultRate":17.6,"avgReturn":3.94},{"state":"IL","count":12990,"volume":168992500,"defaultRate":14.1,"avgReturn":6.54},{"state":"NJ","count":11577,"volume":154622100,"defaultRate":16.1,"avgReturn":5.0},{"state":"OH","count":10704,"volume":124206375,"defaultRate":15.7,"avgReturn":4.73},{"state":"GA","count":10372,"volume":132227750,"defaultRate":14.7,"avgReturn":6.17},{"state":"PA","count":10066,"volume":120110750,"defaultRate":15.7,"avgReturn":5.17},{"state":"NC","count":8691,"volume":103946800,"defaultRate":16.1,"avgReturn":4.43},{"state":"MI","count":8539,"volume":100122200,"defaultRate":15.8,"avgReturn":4.99},{"state":"VA","count":8199,"volume":110524950,"defaultRate":15.6,"avgReturn":5.13},{"state":"AZ","count":7703,"volume":93952350,"defaultRate":15.6,"avgReturn":4.29},{"state":"MA","count":7175,"volume":96950575,"defaultRate":15.1,"avgReturn":4.85},{"state":"MD","count":6964,"volume":91104875,"defaultRate":16.9,"avgReturn":4.58},{"state":"CO","count":6334,"volume":78501725,"defaultRate":12.9,"avgReturn":5.73},{"state":"WA","count":6177,"volume":81371225,"defaultRate":13.3,"avgReturn":6.44},{"state":"MN","count":5477,"volume":66102950,"defaultRate":15.7,"avgReturn":4.47},{"state":"IN","count":5341,"volume":63047150,"defaultRate":15.8,"avgReturn":4.88},{"state":"TN","count":5227,"volume":63148250,"defaultRate":15.7,"avgReturn":5.03}],"allStates":[{"state":"LA","count":3548,"volume":42631825,"defaultRate":17.6},{"state":"MN","count":5477,"volume":66102950,"defaultRate":15.7},{"state":"PA","count":10066,"volume":120110750,"defaultRate":15.7},{"state":"MO","count":4937,"volume":58396925,"defaultRate":16.1},{"state":"WV","count":518,"volume":6095750,"defaultRate":12.2},{"state":"NY","count":26806,"volume":340783375,"defaultRate":16.9},{"state":"IL","count":12990,"volume":168992500,"defaultRate":14.1},{"state":"CA","count":43673,"volume":578809775,"defaultRate":16.5},{"state":"GA","count":10372,"volume":132227750,"defaultRate":14.7},{"state":"AZ","count":7703,"volume":93952350,"defaultRate":15.6},{"state":"TN","count":5227,"volume":63148250,"defaultRate":15.7},{"state":"OH","count":10704,"volume":124206375,"defaultRate":15.7},{"state":"WA","count":6177,"volume":81371225,"defaultRate":13.3},{"state":"VA","count":8199,"volume":110524950,"defaultRate":15.6},{"state":"WI","count":4182,"volume":49299450,"defaultRate":13.2},{"state":"FL","count":23895,"volume":288566700,"defaultRate":17.6},{"state":"KS","count":2538,"volume":30886025,"defaultRate":12.2},{"state":"TX","count":27151,"volume":357405325,"defaultRate":15.9},{"state":"WY","count":633,"volume":7950750,"defaultRate":13.1},{"state":"KY","count":2941,"volume":33761825,"defaultRate":15.8},{"state":"NC","count":8691,"volume":103946800,"defaultRate":16.1},{"state":"IN","count":5341,"volume":63047150,"defaultRate":15.8},{"state":"AL","count":3745,"volume":43529800,"defaultRate":18.9},{"state":"MD","count":6964,"volume":91104875,"defaultRate":16.9},{"state":"NJ","count":11577,"volume":154622100,"defaultRate":16.1},{"state":"ND","count":769,"volume":9934000,"defaultRate":14.7},{"state":"OK","count":2871,"volume":34996600,"defaultRate":18.3},{"state":"OR","count":3409,"volume":39845100,"defaultRate":11.3},{"state":"NV","count":4692,"volume":58033500,"defaultRate":17.8},{"state":"SC","count":3870,"volume":46742800,"defaultRate":12.4},{"state":"NH","count":1527,"volume":19315125,"defaultRate":12.2},{"state":"DE","count":898,"volume":10606300,"defaultRate":14.9},{"state":"DC","count":754,"volume":10575850,"defaultRate":10.1},{"state":"CO","count":6334,"volume":78501725,"defaultRate":12.9},{"state":"AR","count":2386,"volume":27053425,"defaultRate":18.7},{"state":"HI","count":1475,"volume":20386525,"defaultRate":16.8},{"state":"UT","count":1987,"volume":25089075,"defaultRate":14.1},{"state":"MA","count":7175,"volume":96950575,"defaultRate":15.1},{"state":"CT","count":4938,"volume":64389450,"defaultRate":12.3},{"state":"VT","count":689,"volume":7816900,"defaultRate":9.6},{"state":"ID","count":833,"volume":9887825,"defaultRate":14.9},{"state":"MI","count":8539,"volume":100122200,"defaultRate":15.8},{"state":"NM","count":1625,"volume":19607425,"defaultRate":16.0},{"state":"MS","count":2077,"volume":24257550,"defaultRate":18.4},{"state":"SD","count":627,"volume":7633775,"defaultRate":15.9},{"state":"MT","count":836,"volume":9693050,"defaultRate":12.0},{"state":"NE","count":1508,"volume":16957125,"defaultRate":18.2},{"state":"RI","count":1384,"volume":15865675,"defaultRate":13.6},{"state":"AK","count":701,"volume":10615550,"defaultRate":15.7},{"state":"ME","count":996,"volume":12199025,"defaultRate":8.8}],"byPurpose":[{"purpose":"debt_consolidation","count":173917,"volume":2347946275,"defaultRate":16.7,"avgReturn":4.63,"avgRate":12.12},{"purpose":"credit_card","count":67994,"volume":905648525,"defaultRate":13.7,"avgReturn":5.29,"avgRate":10.59},{"purpose":"other","count":24030,"volume":202550200,"defaultRate":16.1,"avgReturn":6.23,"avgRate":13.21},{"purpose":"home_improvement","count":22999,"volume":276283600,"defaultRate":13.6,"avgReturn":5.25,"avgRate":11.31},{"purpose":"major_purchase","count":8144,"volume":80656975,"defaultRate":14.4,"avgReturn":4.94,"avgRate":11.58},{"purpose":"medical","count":4490,"volume":33998800,"defaultRate":17.9,"avgReturn":4.1,"avgRate":12.53},{"purpose":"car","count":4021,"volume":31673100,"defaultRate":12.8,"avgReturn":6.44,"avgRate":11.33},{"purpose":"small_business","count":3738,"volume":52181575,"defaultRate":22.9,"avgReturn":3.39,"avgRate":14.28},{"purpose":"vacation","count":3035,"volume":16787875,"defaultRate":16.6,"avgReturn":5.42,"avgRate":12.65},{"purpose":"moving","count":2836,"volume":18822225,"defaultRate":18.6,"avgReturn":4.67,"avgRate":13.93},{"purpose":"house","count":1493,"volume":19771350,"defaultRate":19.8,"avgReturn":3.86,"avgRate":14.71},{"purpose":"renewable_energy","count":257,"volume":2216200,"defaultRate":16.3,"avgReturn":5.76,"avgRate":14.07},{"purpose":"wedding","count":1,"volume":15000,"defaultRate":0.0,"avgReturn":18.57,"avgRate":13.49}],"byGrade":[{"grade":"A","count":66004,"volume":909978500,"defaultRate":5.6,"avgReturn":5.82,"avgRate":6.85,"defaults":3726},{"grade":"B","count":112597,"volume":1343282875,"defaultRate":12.5,"avgReturn":5.88,"avgRate":10.25,"defaults":14052},{"grade":"C","count":90119,"volume":1104439000,"defaultRate":19.7,"avgReturn":4.66,"avgRate":13.71,"defaults":17780},{"grade":"D","count":35769,"volume":472823475,"defaultRate":27.6,"avgReturn":2.97,"avgRate":18.1,"defaults":9890},{"grade":"E","count":9664,"volume":123936875,"defaultRate":35.0,"avgReturn":0.54,"avgRate":21.43,"defaults":3387},{"grade":"F","count":2290,"volume":27941075,"defaultRate":40.6,"avgReturn":-1.61,"avgRate":22.08,"defaults":929},{"grade":"G","count":512,"volume":6149900,"defaultRate":50.4,"avgReturn":-8.7,"avgRate":22.0,"defaults":258}],"byMonth":[{"month":"2016-01","count":22370,"volume":307453950,"defaultRate":14.5,"avgReturn":4.92,"avgRate":10.87,"defaults":3246,"earlyDefaultRate":5.6},{"month":"2016-02","count":28094,"volume":379963775,"defaultRate":15.3,"avgReturn":4.88,"avgRate":11.27,"defaults":4312,"earlyDefaultRate":5.7},{"month":"2016-03","count":43776,"volume":572235975,"defaultRate":16.1,"avgReturn":4.36,"avgRate":11.37,"defaults":7036,"earlyDefaultRate":6.2},{"month":"2016-04","count":27607,"volume":354490425,"defaultRate":16.5,"avgReturn":4.31,"avgRate":11.51,"defaults":4554,"earlyDefaultRate":6.5},{"month":"2016-05","count":21354,"volume":272028800,"defaultRate":17.1,"avgReturn":4.05,"avgRate":11.77,"defaults":3649,"earlyDefaultRate":6.8},{"month":"2016-06","count":24433,"volume":313147325,"defaultRate":14.6,"avgReturn":4.83,"avgRate":11.18,"defaults":3568,"earlyDefaultRate":5.7},{"month":"2016-07","count":25274,"volume":302254900,"defaultRate":16.9,"avgReturn":4.83,"avgRate":12.47,"defaults":4268,"earlyDefaultRate":6.7},{"month":"2016-08","count":27021,"volume":329441225,"defaultRate":16.7,"avgReturn":4.99,"avgRate":12.42,"defaults":4501,"earlyDefaultRate":6.6},{"month":"2016-09","count":20968,"volume":251654375,"defaultRate":16.0,"avgReturn":5.43,"avgRate":12.6,"defaults":3359,"earlyDefaultRate":6.5},{"month":"2016-10","count":24030,"volume":286410475,"defaultRate":14.4,"avgReturn":6.03,"avgRate":12.31,"defaults":3471,"earlyDefaultRate":5.9},{"month":"2016-11","count":25180,"volume":300788225,"defaultRate":15.2,"avgReturn":5.8,"avgRate":12.34,"defaults":3823,"earlyDefaultRate":6.0},{"month":"2016-12","count":26848,"volume":318682250,"defaultRate":15.8,"avgReturn":5.46,"avgRate":12.55,"defaults":4235,"earlyDefaultRate":6.5}],"byHomeOwnership":[{"ownership":"MORTGAGE","count":144046,"volume":2009489575,"defaultRate":13.0,"avgReturn":5.77},{"ownership":"RENT","count":132398,"volume":1482038575,"defaultRate":18.8,"avgReturn":4.07},{"ownership":"OWN","count":40422,"volume":496021725,"defaultRate":16.0,"avgReturn":4.94},{"ownership":"ANY","count":89,"volume":1001825,"defaultRate":16.9,"avgReturn":4.02}],"byVerification":[{"status":"Verified","count":89851,"volume":1238488225,"defaultRate":20.0},{"status":"Source Verified","count":138516,"volume":1668136200,"defaultRate":16.0},{"status":"Not Verified","count":88588,"volume":1081927275,"defaultRate":11.1}],"byEmpLength":[{"empLength":"< 1 year","count":24220,"defaultRate":16.1,"avgReturn":4.6},{"empLength":"1 year","count":21824,"defaultRate":16.5,"avgReturn":4.52},{"empLength":"2 years","count":29631,"defaultRate":15.9,"avgReturn":5.01},{"empLength":"3 years","count":25975,"defaultRate":16.3,"avgReturn":4.75},{"empLength":"4 years","count":18964,"defaultRate":15.7,"avgReturn":5.24},{"empLength":"5 years","count":19403,"defaultRate":15.7,"avgReturn":5.26},{"empLength":"6 years","count":13698,"defaultRate":15.0,"avgReturn":5.58},{"empLength":"7 years","count":10250,"defaultRate":15.7,"avgReturn":4.86},{"empLength":"8 years","count":13407,"defaultRate":15.3,"avgReturn":5.04},{"empLength":"9 years","count":12022,"defaultRate":15.2,"avgReturn":5.12},{"empLength":"10+ years","count":104803,"defaultRate":14.2,"avgReturn":5.63},{"empLength":"Unknown","count":22758,"defaultRate":22.5,"avgReturn":1.82}],"byFico":[{"range":"650-699","count":197358,"defaultRate":18.8,"avgReturn":4.53,"avgRate":12.95},{"range":"700-749","count":95533,"defaultRate":12.0,"avgReturn":5.66,"avgRate":10.54},{"range":"750-799","count":24064,"defaultRate":6.3,"avgReturn":5.66,"avgRate":8.16}],"byDti":[{"range":"0-10","count":57042,"defaultRate":12.2},{"range":"10-20","count":130288,"defaultRate":14.2},{"range":"20-30","count":96880,"defaultRate":17.9},{"range":"30-40","count":30935,"defaultRate":21.8},{"range":"40+","count":1810,"defaultRate":26.0}],"bySubGrade":[{"subGrade":"A1","count":18541,"defaultRate":3.2,"avgRate":5.32,"avgReturn":5.3},{"subGrade":"A2","count":10257,"defaultRate":5.0,"avgRate":6.7,"avgReturn":5.86},{"subGrade":"A3","count":9572,"defaultRate":5.9,"avgRate":7.17,"avgReturn":5.96},{"subGrade":"A4","count":13443,"defaultRate":6.9,"avgRate":7.53,"avgReturn":6.06},{"subGrade":"A5","count":14191,"defaultRate":7.9,"avgRate":8.08,"avgReturn":6.14},{"subGrade":"B1","count":20607,"defaultRate":9.8,"avgRate":8.54,"avgReturn":5.56},{"subGrade":"B2","count":20196,"defaultRate":10.6,"avgRate":9.49,"avgReturn":6.13},{"subGrade":"B3","count":20945,"defaultRate":11.7,"avgRate":10.26,"avgReturn":6.42},{"subGrade":"B4","count":23085,"defaultRate":13.8,"avgRate":10.96,"avgReturn":6.02},{"subGrade":"B5","count":27764,"defaultRate":15.3,"avgRate":11.48,"avgReturn":5.43},{"subGrade":"C1","count":24499,"defaultRate":17.2,"avgRate":12.42,"avgReturn":5.18},{"subGrade":"C2","count":19290,"defaultRate":19.2,"avgRate":13.25,"avgReturn":4.56},{"subGrade":"C3","count":16319,"defaultRate":19.7,"avgRate":13.82,"avgReturn":4.79},{"subGrade":"C4","count":16155,"defaultRate":21.3,"avgRate":14.56,"avgReturn":4.47},{"subGrade":"C5","count":13856,"defaultRate":23.1,"avgRate":15.52,"avgReturn":3.96},{"subGrade":"D1","count":11120,"defaultRate":25.3,"avgRate":16.65,"avgReturn":3.26},{"subGrade":"D2","count":8692,"defaultRate":26.2,"avgRate":17.63,"avgReturn":3.63},{"subGrade":"D3","count":6562,"defaultRate":29.0,"avgRate":18.59,"avgReturn":2.59},{"subGrade":"D4","count":5389,"defaultRate":30.0,"avgRate":19.44,"avgReturn":2.63},{"subGrade":"D5","count":4006,"defaultRate":31.9,"avgRate":20.51,"avgReturn":1.81},{"subGrade":"E1","count":3154,"defaultRate":32.9,"avgRate":20.96,"avgReturn":1.67},{"subGrade":"E2","count":2402,"defaultRate":33.9,"avgRate":21.4,"avgReturn":1.39},{"subGrade":"E3","count":1811,"defaultRate":36.4,"avgRate":21.58,"avgReturn":-0.07},{"subGrade":"E4","count":1286,"defaultRate":37.2,"avgRate":21.94,"avgReturn":-0.68},{"subGrade":"E5","count":1011,"defaultRate":39.4,"avgRate":22.05,"avgReturn":-2.39},{"subGrade":"F1","count":771,"defaultRate":38.3,"avgRate":22.09,"avgReturn":-0.13},{"subGrade":"F2","count":481,"defaultRate":41.0,"avgRate":22.06,"avgReturn":-2.1},{"subGrade":"F3","count":403,"defaultRate":40.2,"avgRate":22.09,"avgReturn":-0.34},{"subGrade":"F4","count":355,"defaultRate":42.0,"avgRate":22.09,"avgReturn":-2.26},{"subGrade":"F5","count":280,"defaultRate":45.0,"avgRate":22.09,"avgReturn":-5.85},{"subGrade":"G1","count":168,"defaultRate":44.0,"avgRate":21.99,"avgReturn":-3.21},{"subGrade":"G2","count":124,"defaultRate":54.8,"avgRate":21.96,"avgReturn":-12.86},{"subGrade":"G3","count":88,"defaultRate":44.3,"avgRate":22.09,"avgReturn":-3.32},{"subGrade":"G4","count":69,"defaultRate":56.5,"avgRate":22.09,"avgReturn":-12.54},{"subGrade":"G5","count":63,"defaultRate":60.3,"avgRate":21.83,"avgReturn":-18.5}]};

// ─── Color Palette ────────────────────────────────────────────────────────
const COLORS = {
  purple: "#8B5CF6", purpleLight: "#C4B5FD", purpleBg: "#F5F3FF",
  pink: "#EC4899", pinkLight: "#F9A8D4", pinkBg: "#FDF2F8",
  cyan: "#06B6D4", cyanLight: "#67E8F9", cyanBg: "#ECFEFF",
  teal: "#14B8A6", tealLight: "#5EEAD4", tealBg: "#F0FDFA",
  red: "#EF4444", redLight: "#FCA5A5",
  amber: "#F59E0B", amberLight: "#FCD34D",
  green: "#10B981", greenLight: "#6EE7B7",
  gray: {50:"#F9FAFB",100:"#F3F4F6",200:"#E5E7EB",300:"#D1D5DB",400:"#9CA3AF",500:"#6B7280",600:"#4B5563",700:"#374151",800:"#1F2937",900:"#111827"}
};
const GRADE_COLORS = { A:"#10B981", B:"#06B6D4", C:"#8B5CF6", D:"#F59E0B", E:"#EC4899", F:"#EF4444", G:"#991B1B" };
const CHART_PALETTE = ["#8B5CF6","#EC4899","#06B6D4","#14B8A6","#F59E0B","#10B981","#EF4444","#6366F1","#F97316","#84CC16"];

// ─── Utility functions ────────────────────────────────────────────────────
const fmt = {
  currency: (v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `$${(v/1e3).toFixed(0)}K` : `$${v}`,
  number: (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : `${v}`,
  pct: (v) => `${v.toFixed(1)}%`,
  pct2: (v) => `${v.toFixed(2)}%`,
  purpose: (s) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  month: (s) => {const [,m] = s.split("-"); const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return months[parseInt(m)];}
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",fontSize:12}}>
      <div style={{fontWeight:600,color:COLORS.gray[800],marginBottom:6}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
          <div style={{width:8,height:8,borderRadius:4,background:p.color}} />
          <span style={{color:COLORS.gray[500]}}>{p.name}:</span>
          <span style={{fontWeight:600,color:COLORS.gray[800]}}>{formatter ? formatter(p.value, p.name) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Toggle Button Group ──────────────────────────────────────────────────
const ToggleGroup = ({ options, value, onChange }) => (
  <div style={{display:"flex",background:COLORS.gray[100],borderRadius:6,padding:2}}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)} style={{
        padding:"4px 12px",borderRadius:4,border:"none",fontSize:11,fontWeight:500,cursor:"pointer",
        transition:"all 0.2s",
        background: value === o.value ? "white" : "transparent",
        color: value === o.value ? COLORS.gray[800] : COLORS.gray[500],
        boxShadow: value === o.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
      }}>{o.label}</button>
    ))}
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color, icon, trend, trendLabel }) => (
  <div style={{
    background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:"20px 24px",
    transition:"all 0.2s",cursor:"default",position:"relative",overflow:"hidden"
  }} onMouseEnter={e => {e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,0.06)";e.currentTarget.style.borderColor=color;}}
     onMouseLeave={e => {e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="#E5E7EB";}}>
    <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`linear-gradient(135deg, ${color}08, ${color}15)`,borderRadius:"0 0 0 60px"}} />
    <div style={{fontSize:11,fontWeight:500,color:COLORS.gray[400],textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{label}</div>
    <div style={{fontSize:28,fontWeight:700,color:COLORS.gray[900],lineHeight:1.2,marginBottom:4}}>{value}</div>
    {sub && <div style={{fontSize:12,color:COLORS.gray[500]}}>{sub}</div>}
    {trend !== undefined && (
      <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
        <span style={{fontSize:11,fontWeight:600,color: trend >= 0 ? COLORS.green : COLORS.red,
          background: trend >= 0 ? "#ECFDF5" : "#FEF2F2",padding:"2px 6px",borderRadius:4}}>
          {trend >= 0 ? "+" : ""}{trend}%
        </span>
        {trendLabel && <span style={{fontSize:11,color:COLORS.gray[400]}}>{trendLabel}</span>}
      </div>
    )}
  </div>
);

// ─── Section Card Wrapper ─────────────────────────────────────────────────
const Card = ({ title, subtitle, children, headerRight, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:0,
    transition:"box-shadow 0.2s",...style
  }}>
    {title && (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px 8px",borderBottom:"none"}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:COLORS.gray[800]}}>{title}</div>
          {subtitle && <div style={{fontSize:11,color:COLORS.gray[400],marginTop:2}}>{subtitle}</div>}
        </div>
        {headerRight}
      </div>
    )}
    <div style={{padding:"8px 20px 20px"}}>{children}</div>
  </div>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────
const DetailModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)"}} />
      <div onClick={e => e.stopPropagation()} style={{
        position:"relative",background:"white",borderRadius:12,maxWidth:800,width:"90%",maxHeight:"85vh",overflow:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)",padding:0
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 24px",borderBottom:`1px solid ${COLORS.gray[200]}`}}>
          <div style={{fontSize:16,fontWeight:600,color:COLORS.gray[900]}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:COLORS.gray[400],width:32,height:32,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}
            onMouseEnter={e=>e.currentTarget.style.background=COLORS.gray[100]} onMouseLeave={e=>e.currentTarget.style.background="none"}>×</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────
export default function RiskDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState({ grade: null, purpose: null, state: null });
  const [timelineMetric, setTimelineMetric] = useState("defaultRate");
  const [gradeMetric, setGradeMetric] = useState("defaultRate");
  const [stateMetric, setStateMetric] = useState("volume");
  const [modalData, setModalData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "count", dir: "desc" });
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [hoveredGrade, setHoveredGrade] = useState(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 300); }, []);

  const bg = darkMode ? COLORS.gray[900] : "#F8F9FC";
  const cardBg = darkMode ? COLORS.gray[800] : "white";
  const textPrimary = darkMode ? "#F9FAFB" : COLORS.gray[900];
  const textSecondary = darkMode ? COLORS.gray[400] : COLORS.gray[500];
  const borderColor = darkMode ? COLORS.gray[700] : "#E5E7EB";

  // Grade donut data
  const gradeDonut = DATA.byGrade.map(g => ({
    name: g.grade, value: g.count, fill: GRADE_COLORS[g.grade],
    defaultRate: g.defaultRate, avgReturn: g.avgReturn
  }));

  // Status donut
  const statusDonut = [
    { name: "Fully Paid", value: DATA.kpis.fullyPaid, fill: COLORS.green },
    { name: "Charged Off", value: DATA.kpis.chargedOff, fill: COLORS.red }
  ];

  // Purpose bar (sorted by selected metric)
  const purposeBar = DATA.byPurpose.filter(p => p.count > 100).map(p => ({
    ...p, label: fmt.purpose(p.purpose)
  }));

  // Sub-grade scatter for risk-return
  const subGradeScatter = DATA.bySubGrade.map(sg => ({
    ...sg,
    grade: sg.subGrade[0],
    fill: GRADE_COLORS[sg.subGrade[0]]
  }));

  // Monthly data with labels
  const monthlyData = DATA.byMonth.map(m => ({ ...m, label: fmt.month(m.month) }));

  // Table data: state detail
  const tableData = useMemo(() => {
    let d = [...DATA.byState];
    d.sort((a, b) => sortConfig.dir === "asc" ? a[sortConfig.key] - b[sortConfig.key] : b[sortConfig.key] - a[sortConfig.key]);
    return d;
  }, [sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc" }));
  };

  // Grade drill-down data
  const gradeDetail = useMemo(() => {
    if (!modalData?.grade) return [];
    return DATA.bySubGrade.filter(sg => sg.subGrade.startsWith(modalData.grade));
  }, [modalData]);

  const navTabs = [
    { id: "overview", label: "Overview" },
    { id: "concentration", label: "Concentration" },
    { id: "risk", label: "Risk & Return" },
    { id: "defaults", label: "Defaults" },
    { id: "trends", label: "Trends" },
  ];

  return (
    <div style={{
      minHeight:"100vh",background:bg,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      transition:"background 0.3s",color:textPrimary
    }}>
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div style={{
        background:cardBg,borderBottom:`1px solid ${borderColor}`,padding:"0 32px",
        position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)",
        background: darkMode ? "rgba(31,41,55,0.95)" : "rgba(255,255,255,0.95)"
      }}>
        <div style={{maxWidth:1440,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:28,height:28,borderRadius:6,background:`linear-gradient(135deg, ${COLORS.purple}, ${COLORS.pink})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"white",fontSize:14,fontWeight:700}}>R</span>
            </div>
            <span style={{fontSize:15,fontWeight:600,color:textPrimary}}>Risk Analytics</span>
            <span style={{fontSize:11,color:COLORS.gray[400],background:darkMode?COLORS.gray[700]:COLORS.gray[100],padding:"2px 8px",borderRadius:4}}>2016 Portfolio</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            {navTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding:"6px 14px",borderRadius:6,border:"none",fontSize:12,fontWeight:500,cursor:"pointer",
                transition:"all 0.2s",
                background: activeTab === t.id ? (darkMode ? COLORS.gray[700] : COLORS.gray[100]) : "transparent",
                color: activeTab === t.id ? COLORS.purple : textSecondary
              }}>{t.label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",position:"relative",
              background: darkMode ? COLORS.purple : COLORS.gray[300],transition:"background 0.3s"
            }}>
              <div style={{
                width:16,height:16,borderRadius:8,background:"white",position:"absolute",top:2,
                transition:"left 0.3s",left: darkMode ? 18 : 2,
                boxShadow:"0 1px 3px rgba(0,0,0,0.2)"
              }} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────── */}
      <div style={{maxWidth:1440,margin:"0 auto",padding:"24px 32px",opacity:loaded?1:0,transition:"opacity 0.5s"}}>

        {/* ─── KPI Row ───────────────────────────────────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:24}}>
          <KPICard label="Total Loan Volume" value={fmt.currency(DATA.kpis.totalVolume)} sub={`${fmt.number(DATA.kpis.totalLoans)} loans originated`} color={COLORS.purple} />
          <KPICard label="Average Interest Rate" value={`${DATA.kpis.avgIntRate}%`} sub="Weighted across all grades" color={COLORS.cyan} />
          <KPICard label="Default Rate" value={`${DATA.kpis.defaultRate}%`} sub={`${fmt.number(DATA.kpis.chargedOff)} charged off`} color={COLORS.pink} trend={2.6} trendLabel="vs. Q1" />
          <KPICard label="Portfolio Return" value={`${DATA.kpis.avgReturn}%`} sub="Average realized return" color={COLORS.teal} trend={-1.2} trendLabel="vs. Q1" />
          <KPICard label="Average Loan Size" value={fmt.currency(DATA.kpis.avgLoan)} sub="Per origination" color={COLORS.amber} />
        </div>

        {/* ─── Row 1: Portfolio Status + Grade Mix ────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:24}}>

          {/* Loan Status Donut */}
          <Card title="Portfolio Status" subtitle="Loan outcome distribution" style={{background:cardBg,borderColor}}>
            <div style={{height:240,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                    {statusDonut.map((e,i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(v,n) => `${fmt.number(v)} (${(v/DATA.kpis.totalLoans*100).toFixed(1)}%)`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:-8}}>
              {statusDonut.map(s => (
                <div key={s.name} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:4,background:s.fill}} />
                  <span style={{fontSize:11,color:textSecondary}}>{s.name}</span>
                  <span style={{fontSize:11,fontWeight:600,color:textPrimary}}>{(s.value/DATA.kpis.totalLoans*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Grade Distribution Donut */}
          <Card title="Grade Distribution" subtitle="Click a grade to drill down" style={{background:cardBg,borderColor}}>
            <div style={{height:240,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDonut} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value"
                    onClick={(d) => setModalData({ grade: d.name, type: "grade" })} style={{cursor:"pointer"}}
                    animationBegin={200} animationDuration={800}>
                    {gradeDonut.map((e,i) => (
                      <Cell key={i} fill={e.fill} stroke="none" opacity={hoveredGrade && hoveredGrade !== e.name ? 0.3 : 1}
                        style={{transition:"opacity 0.2s"}} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(v,n) => `${fmt.number(v)} loans`} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginTop:-8}}>
              {DATA.byGrade.map(g => (
                <div key={g.grade} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer",padding:"2px 6px",borderRadius:4,
                  background: hoveredGrade === g.grade ? COLORS.gray[100] : "transparent"}}
                  onMouseEnter={() => setHoveredGrade(g.grade)} onMouseLeave={() => setHoveredGrade(null)}
                  onClick={() => setModalData({ grade: g.grade, type: "grade" })}>
                  <div style={{width:8,height:8,borderRadius:2,background:GRADE_COLORS[g.grade]}} />
                  <span style={{fontSize:11,color:textSecondary}}>{g.grade}</span>
                  <span style={{fontSize:11,fontWeight:600,color:textPrimary}}>{(g.count/DATA.kpis.totalLoans*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Home Ownership */}
          <Card title="Home Ownership" subtitle="Default rate by housing status" style={{background:cardBg,borderColor}}>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:8}}>
              {DATA.byHomeOwnership.filter(h=>h.ownership!=="ANY").map((h,i) => {
                const barWidth = (h.count / DATA.kpis.totalLoans) * 100;
                return (
                  <div key={h.ownership}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:500,color:textPrimary}}>{h.ownership}</span>
                      <span style={{fontSize:11,color:textSecondary}}>{fmt.number(h.count)} loans</span>
                    </div>
                    <div style={{position:"relative",height:28,background:darkMode?COLORS.gray[700]:COLORS.gray[100],borderRadius:4,overflow:"hidden"}}>
                      <div style={{
                        position:"absolute",left:0,top:0,height:"100%",borderRadius:4,
                        width:`${barWidth}%`,background:`linear-gradient(90deg, ${CHART_PALETTE[i]}, ${CHART_PALETTE[i]}aa)`,
                        transition:"width 0.8s ease-out"
                      }} />
                      <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:600,
                        color: barWidth > 30 ? "white" : textPrimary}}>
                        {h.defaultRate}% default
                      </div>
                    </div>
                    <div style={{display:"flex",gap:12,marginTop:4}}>
                      <span style={{fontSize:10,color:COLORS.teal}}>Avg Return: {h.avgReturn}%</span>
                      <span style={{fontSize:10,color:textSecondary}}>Volume: {fmt.currency(h.volume)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ─── Row 2: Why Borrowers Take Loans + Risk-Return Scatter ── */}
        <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:16,marginBottom:24}}>

          {/* Purpose Analysis */}
          <Card title="Why Borrowers Take Loans" subtitle="Loan purpose distribution and default rates"
            headerRight={<ToggleGroup options={[{value:"count",label:"Count"},{value:"volume",label:"Volume"},{value:"defaultRate",label:"Default %"}]} value={gradeMetric} onChange={setGradeMetric} />}
            style={{background:cardBg,borderColor}}>
            <div style={{height:360}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purposeBar.slice(0,10)} layout="vertical" margin={{left:100,right:20,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false}
                    tickFormatter={gradeMetric === "volume" ? (v) => fmt.currency(v) : gradeMetric === "count" ? (v) => fmt.number(v) : (v) => `${v}%`} />
                  <YAxis type="category" dataKey="label" tick={{fontSize:11,fill:textSecondary}} axisLine={false} tickLine={false} width={95} />
                  <Tooltip content={<CustomTooltip formatter={(v,n) => n.includes("Rate") || n.includes("Return") ? `${v}%` : n.includes("Volume") || n.includes("volume") ? fmt.currency(v) : fmt.number(v)} />} />
                  <Bar dataKey={gradeMetric} radius={[0,4,4,0]} animationDuration={600}
                    onClick={(d) => setModalData({purpose: d.purpose, type: "purpose"})}>
                    {purposeBar.slice(0,10).map((e,i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} cursor="pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk-Return Scatter */}
          <Card title="Risk vs. Return by Sub-Grade" subtitle="Are we being paid enough for the risk?" style={{background:cardBg,borderColor}}>
            <div style={{height:360}}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{left:0,right:20,top:8,bottom:24}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} />
                  <XAxis type="number" dataKey="defaultRate" name="Default Rate" unit="%" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false}
                    label={{value:"Default Rate %",position:"bottom",offset:8,style:{fontSize:11,fill:COLORS.gray[400]}}} />
                  <YAxis type="number" dataKey="avgReturn" name="Avg Return" unit="%" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false}
                    label={{value:"Return %",angle:-90,position:"insideLeft",offset:10,style:{fontSize:11,fill:COLORS.gray[400]}}} />
                  <ZAxis type="number" dataKey="count" range={[40, 400]} />
                  <Tooltip content={({active,payload}) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",fontSize:12}}>
                        <div style={{fontWeight:600,marginBottom:4}}>{d.subGrade}</div>
                        <div>Default Rate: <b>{d.defaultRate}%</b></div>
                        <div>Avg Return: <b style={{color:d.avgReturn>=0?COLORS.green:COLORS.red}}>{d.avgReturn}%</b></div>
                        <div>Int Rate: <b>{d.avgRate}%</b></div>
                        <div>Loans: <b>{fmt.number(d.count)}</b></div>
                      </div>
                    );
                  }} />
                  <Scatter data={subGradeScatter} animationDuration={600}>
                    {subGradeScatter.map((e,i) => <Cell key={i} fill={e.fill} fillOpacity={0.7} stroke={e.fill} strokeWidth={1} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginTop:4}}>
              {Object.entries(GRADE_COLORS).map(([g,c]) => (
                <div key={g} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:8,height:8,borderRadius:4,background:c}} />
                  <span style={{fontSize:10,color:textSecondary}}>Grade {g}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── Row 3: Timeline + Default by Grade Bar ────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1.3fr 0.7fr",gap:16,marginBottom:24}}>

          {/* Monthly Trend */}
          <Card title="Portfolio Trend Over Time" subtitle="Is our portfolio getting riskier?"
            headerRight={<ToggleGroup options={[
              {value:"defaultRate",label:"Default %"},{value:"avgRate",label:"Int Rate"},{value:"avgReturn",label:"Return"},{value:"volume",label:"Volume"}
            ]} value={timelineMetric} onChange={setTimelineMetric} />}
            style={{background:cardBg,borderColor}}>
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{left:0,right:8,top:8,bottom:8}}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} vertical={false} />
                  <XAxis dataKey="label" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false}
                    tickFormatter={timelineMetric === "volume" ? (v) => fmt.currency(v) : (v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip formatter={(v,n) => n.includes("olume") ? fmt.currency(v) : `${v}%`} />} />
                  <Area type="monotone" dataKey={timelineMetric} fill="url(#areaGrad)" stroke="none" animationDuration={600} />
                  <Line type="monotone" dataKey={timelineMetric} stroke={COLORS.purple} strokeWidth={2.5} dot={{fill:COLORS.purple,r:4,strokeWidth:2,stroke:"white"}}
                    activeDot={{r:6,stroke:COLORS.purple,strokeWidth:2,fill:"white"}} animationDuration={600} />
                  {timelineMetric === "defaultRate" && (
                    <Line type="monotone" dataKey="earlyDefaultRate" stroke={COLORS.pink} strokeWidth={1.5} strokeDasharray="5 5"
                      dot={{fill:COLORS.pink,r:3}} name="Early Default %" animationDuration={600} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Default Rate by Grade - Vertical */}
          <Card title="Default Rate by Grade" subtitle="Grade risk ladder" style={{background:cardBg,borderColor}}>
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA.byGrade} margin={{left:0,right:8,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} vertical={false} />
                  <XAxis dataKey="grade" tick={{fontSize:12,fontWeight:600,fill:textSecondary}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={({active,payload}) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",fontSize:12}}>
                        <div style={{fontWeight:600,marginBottom:4}}>Grade {d.grade}</div>
                        <div>Default Rate: <b style={{color:COLORS.red}}>{d.defaultRate}%</b></div>
                        <div>Avg Interest: <b>{d.avgRate}%</b></div>
                        <div>Avg Return: <b style={{color:d.avgReturn>=0?COLORS.green:COLORS.red}}>{d.avgReturn}%</b></div>
                        <div>Loans: <b>{fmt.number(d.count)}</b></div>
                        <div>Volume: <b>{fmt.currency(d.volume)}</b></div>
                      </div>
                    );
                  }} />
                  <Bar dataKey="defaultRate" radius={[4,4,0,0]} animationDuration={600}
                    onClick={(d) => setModalData({grade:d.grade,type:"grade"})} cursor="pointer">
                    {DATA.byGrade.map((e,i) => <Cell key={i} fill={GRADE_COLORS[e.grade]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{padding:"8px 0",borderTop:`1px solid ${borderColor}`,marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:textSecondary}}>
                <span>Grades E-G show <b style={{color:COLORS.red}}>negative returns</b></span>
                <span>Click bar to drill down</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Row 4: State Concentration + FICO + DTI ───────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:24}}>

          {/* State Bar */}
          <Card title="Geographic Concentration" subtitle="Top states by loan volume"
            headerRight={<ToggleGroup options={[{value:"volume",label:"Volume"},{value:"count",label:"Count"},{value:"defaultRate",label:"Default %"}]} value={stateMetric} onChange={setStateMetric} />}
            style={{background:cardBg,borderColor}}>
            <div style={{height:300}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA.byState.slice(0,10)} margin={{left:0,right:8,top:8,bottom:8}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} vertical={false} />
                  <XAxis dataKey="state" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false}
                    tickFormatter={stateMetric === "volume" ? (v) => fmt.currency(v) : stateMetric === "count" ? (v) => fmt.number(v) : (v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip formatter={(v,n) => n.includes("Rate") ? `${v}%` : n.includes("olume") || n.includes("volume") ? fmt.currency(v) : fmt.number(v)} />} />
                  <Bar dataKey={stateMetric} radius={[4,4,0,0]} animationDuration={600}>
                    {DATA.byState.slice(0,10).map((e,i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* FICO Score Distribution */}
          <Card title="FICO Score Impact" subtitle="Default rates by credit score range" style={{background:cardBg,borderColor}}>
            <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:12}}>
              {DATA.byFico.map((f,i) => {
                const maxCount = Math.max(...DATA.byFico.map(x => x.count));
                const barWidth = (f.count / maxCount) * 100;
                return (
                  <div key={f.range}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:13,fontWeight:600,color:textPrimary}}>FICO {f.range}</span>
                      <div style={{display:"flex",gap:12}}>
                        <span style={{fontSize:11,color:COLORS.red,fontWeight:600}}>{f.defaultRate}% default</span>
                        <span style={{fontSize:11,color:COLORS.teal,fontWeight:600}}>{f.avgReturn}% return</span>
                      </div>
                    </div>
                    <div style={{position:"relative",height:32,background:darkMode?COLORS.gray[700]:COLORS.gray[100],borderRadius:6,overflow:"hidden"}}>
                      <div style={{
                        position:"absolute",left:0,top:0,height:"100%",borderRadius:6,
                        width:`${barWidth}%`,
                        background:`linear-gradient(90deg, ${[COLORS.pink,COLORS.purple,COLORS.teal][i]}, ${[COLORS.pink,COLORS.purple,COLORS.teal][i]}88)`,
                        transition:"width 0.8s ease-out"
                      }} />
                      <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:600,color:"white"}}>
                        {fmt.number(f.count)} loans
                      </div>
                    </div>
                    <div style={{fontSize:10,color:textSecondary,marginTop:3}}>Avg rate: {f.avgRate}%</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* DTI + Verification Combo */}
          <Card title="Risk Segmentation" subtitle="DTI and verification breakdown" style={{background:cardBg,borderColor}}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:600,color:textPrimary,marginBottom:8}}>Default Rate by DTI</div>
              <div style={{height:140}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DATA.byDti} margin={{left:0,right:8,top:8,bottom:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} vertical={false} />
                    <XAxis dataKey="range" tick={{fontSize:10,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:10,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                    <Tooltip content={<CustomTooltip formatter={(v,n)=> n.includes("Rate") ? `${v}%` : fmt.number(v)} />} />
                    <Bar dataKey="defaultRate" radius={[4,4,0,0]} animationDuration={600}>
                      {DATA.byDti.map((e,i) => <Cell key={i} fill={[COLORS.teal,COLORS.cyan,COLORS.purple,COLORS.pink,COLORS.red][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:textPrimary,marginBottom:8}}>Verification Status</div>
              {DATA.byVerification.map((v,i) => (
                <div key={v.status} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom: i < DATA.byVerification.length-1 ? `1px solid ${borderColor}` : "none"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:textPrimary}}>{v.status}</div>
                    <div style={{fontSize:10,color:textSecondary}}>{fmt.number(v.count)} loans</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:v.defaultRate > 15 ? COLORS.red : v.defaultRate > 12 ? COLORS.amber : COLORS.green}}>
                      {v.defaultRate}%
                    </div>
                    <div style={{fontSize:10,color:textSecondary}}>default rate</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── Row 5: Employment + Grade Heatmap ──────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>

          {/* Employment Length */}
          <Card title="Employment Length Impact" subtitle="Default and return by tenure" style={{background:cardBg,borderColor}}>
            <div style={{height:280}}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={DATA.byEmpLength} margin={{left:0,right:8,top:8,bottom:40}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode?COLORS.gray[700]:COLORS.gray[200]} vertical={false} />
                  <XAxis dataKey="empLength" tick={{fontSize:9,fill:COLORS.gray[400],angle:-35,textAnchor:"end"}} axisLine={false} tickLine={false} height={50} />
                  <YAxis yAxisId="left" tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                  <Tooltip content={<CustomTooltip formatter={(v,n) => `${v}%`} />} />
                  <Bar yAxisId="left" dataKey="defaultRate" name="Default Rate" fill={COLORS.pink} fillOpacity={0.7} radius={[4,4,0,0]} animationDuration={600} />
                  <Line yAxisId="left" type="monotone" dataKey="avgReturn" name="Avg Return" stroke={COLORS.teal} strokeWidth={2.5}
                    dot={{fill:COLORS.teal,r:3,stroke:"white",strokeWidth:2}} animationDuration={600} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Sub-Grade Heatmap */}
          <Card title="Sub-Grade Performance Matrix" subtitle="Return vs Interest Rate across all sub-grades" style={{background:cardBg,borderColor}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginTop:4}}>
              {/* Header row */}
              {["A","B","C","D","E","F","G"].map(g => (
                <div key={g} style={{textAlign:"center",fontSize:11,fontWeight:600,color:GRADE_COLORS[g],padding:"4px 0"}}>{g}</div>
              ))}
              {/* Sub-grade cells */}
              {[1,2,3,4,5].map(n => (
                ["A","B","C","D","E","F","G"].map(g => {
                  const sg = DATA.bySubGrade.find(s => s.subGrade === `${g}${n}`);
                  if (!sg) return <div key={`${g}${n}`} style={{height:40,borderRadius:4,background:darkMode?COLORS.gray[700]:COLORS.gray[50]}} />;
                  const intensity = Math.max(0, Math.min(1, (sg.avgReturn + 20) / 27));
                  const r = Math.round(239 * (1 - intensity) + 16 * intensity);
                  const gr = Math.round(68 * (1 - intensity) + 185 * intensity);
                  const b = Math.round(68 * (1 - intensity) + 129 * intensity);
                  return (
                    <div key={`${g}${n}`} style={{
                      height:40,borderRadius:4,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                      background:`rgb(${r},${gr},${b})`,cursor:"pointer",transition:"transform 0.15s"
                    }} onClick={() => setModalData({grade:g, type:"grade"})}
                      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                      <div style={{fontSize:9,fontWeight:700,color:"white"}}>{g}{n}</div>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.85)"}}>{sg.avgReturn}%</div>
                    </div>
                  );
                })
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:10,color:textSecondary}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:12,height:8,borderRadius:2,background:COLORS.red}} /> Negative Return
              </span>
              <span style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:12,height:8,borderRadius:2,background:COLORS.green}} /> Positive Return
              </span>
            </div>
          </Card>
        </div>

        {/* ─── Row 6: Detailed Data Table ─────────────────────────── */}
        <Card title="State-Level Detail" subtitle="Click column headers to sort" style={{background:cardBg,borderColor,marginBottom:24}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"separate",borderSpacing:0,fontSize:12}}>
              <thead>
                <tr>
                  {[
                    {key:"state",label:"State",align:"left"},
                    {key:"count",label:"Loans",align:"right"},
                    {key:"volume",label:"Volume",align:"right"},
                    {key:"defaultRate",label:"Default Rate",align:"right"},
                    {key:"avgReturn",label:"Avg Return",align:"right"}
                  ].map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={{
                      padding:"10px 12px",textAlign:col.align,fontWeight:600,color:textSecondary,fontSize:11,
                      borderBottom:`2px solid ${borderColor}`,cursor:"pointer",userSelect:"none",
                      textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap",
                      background: sortConfig.key === col.key ? (darkMode?COLORS.gray[700]:COLORS.gray[50]) : "transparent"
                    }}>
                      {col.label} {sortConfig.key === col.key ? (sortConfig.dir === "desc" ? "↓" : "↑") : ""}
                    </th>
                  ))}
                  <th style={{padding:"10px 12px",textAlign:"center",fontWeight:600,color:textSecondary,fontSize:11,borderBottom:`2px solid ${borderColor}`,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    Risk Indicator
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row,i) => (
                  <tr key={row.state} style={{transition:"background 0.15s"}}
                    onMouseEnter={e => e.currentTarget.style.background = darkMode ? COLORS.gray[700] : COLORS.gray[50]}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,fontWeight:600}}>{row.state}</td>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{row.count.toLocaleString()}</td>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,textAlign:"right",fontVariantNumeric:"tabular-nums"}}>{fmt.currency(row.volume)}</td>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,textAlign:"right"}}>
                      <span style={{
                        fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:4,
                        background: row.defaultRate > 17 ? "#FEF2F2" : row.defaultRate > 15 ? "#FFFBEB" : "#ECFDF5",
                        color: row.defaultRate > 17 ? COLORS.red : row.defaultRate > 15 ? COLORS.amber : COLORS.green
                      }}>{row.defaultRate}%</span>
                    </td>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,textAlign:"right"}}>
                      <span style={{fontWeight:600,color:row.avgReturn >= 5 ? COLORS.green : row.avgReturn >= 4 ? COLORS.amber : COLORS.red}}>
                        {row.avgReturn}%
                      </span>
                    </td>
                    <td style={{padding:"10px 12px",borderBottom:`1px solid ${borderColor}`,textAlign:"center"}}>
                      <div style={{
                        width:Math.max(24, row.defaultRate * 4),height:6,borderRadius:3,margin:"0 auto",
                        background:`linear-gradient(90deg, ${COLORS.green}, ${row.defaultRate > 16 ? COLORS.red : COLORS.amber})`
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ─── Footer ──────────────────────────────────────────────── */}
        <div style={{textAlign:"center",padding:"24px 0",borderTop:`1px solid ${borderColor}`}}>
          <div style={{fontSize:11,color:COLORS.gray[400]}}>
            Risk Analytics Dashboard — LendingClub 2016 Portfolio — {fmt.number(DATA.kpis.totalLoans)} loans analyzed
          </div>
        </div>
      </div>

      {/* ─── Grade Drill-Down Modal ──────────────────────────────── */}
      <DetailModal isOpen={modalData?.type === "grade"} onClose={() => setModalData(null)} title={`Grade ${modalData?.grade} — Detailed Breakdown`}>
        {modalData?.grade && (() => {
          const detail = DATA.bySubGrade.filter(sg => sg.subGrade.startsWith(modalData.grade));
          const gradeInfo = DATA.byGrade.find(g => g.grade === modalData.grade);
          return (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:24}}>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Total Loans</div>
                  <div style={{fontSize:20,fontWeight:700}}>{fmt.number(gradeInfo.count)}</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Default Rate</div>
                  <div style={{fontSize:20,fontWeight:700,color:COLORS.red}}>{gradeInfo.defaultRate}%</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Avg Return</div>
                  <div style={{fontSize:20,fontWeight:700,color:gradeInfo.avgReturn>=0?COLORS.green:COLORS.red}}>{gradeInfo.avgReturn}%</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Avg Rate</div>
                  <div style={{fontSize:20,fontWeight:700}}>{gradeInfo.avgRate}%</div>
                </div>
              </div>
              <div style={{height:250}}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={detail} margin={{left:0,right:8,top:8,bottom:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} vertical={false} />
                    <XAxis dataKey="subGrade" tick={{fontSize:12,fontWeight:600}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                    <Tooltip content={<CustomTooltip formatter={(v)=>`${v}%`} />} />
                    <Bar dataKey="defaultRate" name="Default Rate" fill={COLORS.pink} fillOpacity={0.6} radius={[4,4,0,0]} />
                    <Line type="monotone" dataKey="avgReturn" name="Avg Return" stroke={COLORS.teal} strokeWidth={2.5}
                      dot={{fill:COLORS.teal,r:4,stroke:"white",strokeWidth:2}} />
                    <Line type="monotone" dataKey="avgRate" name="Int Rate" stroke={COLORS.purple} strokeWidth={1.5} strokeDasharray="5 5"
                      dot={{fill:COLORS.purple,r:3}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </DetailModal>

      {/* ─── Purpose Drill-Down Modal ────────────────────────────── */}
      <DetailModal isOpen={modalData?.type === "purpose"} onClose={() => setModalData(null)} title={`${fmt.purpose(modalData?.purpose || "")} — Grade Breakdown`}>
        {modalData?.purpose && (() => {
          const detail = DATA.gradePurpose
            .filter(gp => gp.purpose === modalData.purpose)
            .sort((a,b) => a.grade.localeCompare(b.grade));
          const purposeInfo = DATA.byPurpose.find(p => p.purpose === modalData.purpose);
          return (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:24}}>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Total Loans</div>
                  <div style={{fontSize:20,fontWeight:700}}>{fmt.number(purposeInfo.count)}</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Default Rate</div>
                  <div style={{fontSize:20,fontWeight:700,color:COLORS.red}}>{purposeInfo.defaultRate}%</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Avg Return</div>
                  <div style={{fontSize:20,fontWeight:700,color:purposeInfo.avgReturn>=0?COLORS.green:COLORS.red}}>{purposeInfo.avgReturn}%</div>
                </div>
                <div style={{background:COLORS.gray[50],borderRadius:8,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:11,color:COLORS.gray[400],marginBottom:4}}>Volume</div>
                  <div style={{fontSize:20,fontWeight:700}}>{fmt.currency(purposeInfo.volume)}</div>
                </div>
              </div>
              <div style={{height:250}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detail} margin={{left:0,right:8,top:8,bottom:8}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} vertical={false} />
                    <XAxis dataKey="grade" tick={{fontSize:12,fontWeight:600}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize:11,fill:COLORS.gray[400]}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} />
                    <Tooltip content={({active,payload}) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{background:"white",border:"1px solid #E5E7EB",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",fontSize:12}}>
                          <div style={{fontWeight:600,marginBottom:4}}>Grade {d.grade}</div>
                          <div>Default Rate: <b>{d.defaultRate}%</b></div>
                          <div>Loans: <b>{fmt.number(d.count)}</b></div>
                          <div>Volume: <b>{fmt.currency(d.volume)}</b></div>
                        </div>
                      );
                    }} />
                    <Bar dataKey="defaultRate" name="Default Rate" radius={[4,4,0,0]}>
                      {detail.map((e,i) => <Cell key={i} fill={GRADE_COLORS[e.grade]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </DetailModal>
    </div>
  );
}