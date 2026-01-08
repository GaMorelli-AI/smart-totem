import React, { useMemo, useRef, useState, useEffect } from "react";

const VIDEO = {
  standby: "/videos/bio_extratus_standby.mp4",
  step1: "/videos/bio_extratus_pt1.mp4",
  step2: "/videos/bio_extratus_pt2.mp4",
  step3: "/videos/bio_extratus_pt3.mp4",
};

const TIPOS = ["Liso", "Ondulado", "Cacheado", "Crespo"];

const QUALIDADES = [
  "Seco",
  "Oleoso",
  "Misto",
  "Quebradiço",
  "Queima",
  "Ressecado",
  "Elástico",
  "Frizz",
  "Opaco",
  "Poroso",
];

const PROCEDIMENTOS = [
  "Progressiva",
  "Botox",
  "Coloração",
  "Descoloração",
  "Bioplastia Capilar",
  "Henna",
  "Nenhum procedimento",
];

const CATALOGO = {
  hidratacao: [
    { categoria: "SHAMPOO", nome: "Bio Extratus Shampoo Hidratante" },
    { categoria: "CONDICIONADOR", nome: "Bio Extratus Condicionador Hidratante" },
    { categoria: "TRATAMENTO", nome: "Bio Extratus Máscara Hidratação Profunda" },
  ],
  nutricao: [
    { categoria: "SHAMPOO", nome: "Bio Extratus Shampoo Nutritivo" },
    { categoria: "CONDICIONADOR", nome: "Bio Extratus Condicionador Nutritivo" },
    { categoria: "TRATAMENTO", nome: "Bio Extratus Máscara Nutrição Intensa" },
  ],
  reconstrucao: [
    { categoria: "SHAMPOO", nome: "Bio Extratus Shampoo Reconstrutor" },
    { categoria: "CONDICIONADOR", nome: "Bio Extratus Condicionador Reconstrutor" },
    { categoria: "TRATAMENTO", nome: "Bio Extratus Máscara Reconstrução" },
  ],
};

function decidirPilar({ qualidade, procedimento }) {
  const q = qualidade || [];
  const p = procedimento || "Nenhum procedimento";

  const temDano =
    q.includes("Quebradiço") ||
    q.includes("Elástico") ||
    q.includes("Poroso") ||
    q.includes("Queima");

  const temRessecamento =
    q.includes("Seco") ||
    q.includes("Ressecado") ||
    q.includes("Opaco") ||
    q.includes("Frizz");

  const temQuimica = [
    "Progressiva",
    "Botox",
    "Coloração",
    "Descoloração",
    "Bioplastia Capilar",
    "Henna",
  ].includes(p);

  if (temDano || temQuimica) return "reconstrucao";
  if (temRessecamento) return "hidratacao";
  return "nutricao";
}

function Pill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 shadow-sm border border-black/10 backdrop-blur">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#5C9B74]/15">
        <span className="h-2.5 w-2.5 rounded-full bg-[#5C9B74]" />
      </span>
      <span className="text-sm font-semibold text-[#0F1E16]">Bio Extratus</span>
    </div>
  );
}

function SectionHeader({ label, title, subtitle }) {
  return (
    <div className="text-center">
      <div className="mb-2 flex justify-center">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#2F6B48]">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#2F6B48]/30">
            ✓
          </span>
          {label}
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F1E16]">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm md:text-base text-black/55">{subtitle}</p> : null}
    </div>
  );
}

function OptionButton({ text, onClick, active, leftIcon = "≡", rightHint }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        "w-full rounded-2xl bg-white px-10 py-7 md:py-8 text-xl md:text-2xl font-semibold",
        "shadow-md border border-black/5 transition",
        "hover:shadow-lg active:scale-[0.99]",
        active ? "ring-2 ring-[#5C9B74]/35 border-[#5C9B74]/30" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-center gap-4">
        <span className="text-black/35">{leftIcon}</span>
        <span className="text-[#0F1E16]">{text}</span>
        {rightHint ? <span className="ml-2 text-sm font-medium text-black/40">{rightHint}</span> : null}
      </div>
    </button>
  );
}

function ArrowButton({ direction = "right", onClick, disabled }) {
  const isRight = direction === "right";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={[
        "h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center",
        "transition shadow-md",
        disabled
          ? "bg-black/10 text-black/30 cursor-not-allowed shadow-none"
          : "bg-[#5C9B74] text-white hover:shadow-lg active:scale-95",
      ].join(" ")}
      aria-label={isRight ? "Próximo" : "Voltar"}
    >
      <span className="text-3xl md:text-4xl font-bold leading-none -translate-y-[2px]">
        {isRight ? "›" : "‹"}
      </span>
    </button>
  );
}

export default function SmartTotemMockup() {
  const [step, setStep] = useState(1);
  const [started, setStarted] = useState(false);

  const [tipo, setTipo] = useState(null);
  const [qualidade, setQualidade] = useState([]);
  const [procedimento, setProcedimento] = useState(null);

  const videoARef = useRef(null);
  const videoBRef = useRef(null);

  // A = vídeos falados (step1/2/3), B = standby loop
  const [activeVideo, setActiveVideo] = useState("B");
  const [videoASrc, setVideoASrc] = useState(VIDEO.step1);

  const INACTIVITY_MS = 40000;      
  const RESULT_INACTIVITY_MS = 45000; // 45s no resultado (step 4)

  // 🔁 TIMER DE RESET AUTOMÁTICO (RESULTADO)
  const resetTimerRef = useRef(null);

  function getTimeoutForStep() {
    // timer menor no resultado, maior no resto
    return step === 4 ? RESULT_INACTIVITY_MS : INACTIVITY_MS;
  }

  function clearResetTimer() {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }

  function getTimeoutForStep() {
  // timer menor no resultado, maior no resto
  return step === 4 ? RESULT_INACTIVITY_MS : INACTIVITY_MS;
  }

    // ✅ PASSO 3 — qualquer interação no step 4 reinicia o timer
  function bumpAutoReset() {
    // só roda enquanto o questionário estiver ativo
    if (!started) return;

    clearResetTimer();

    resetTimerRef.current = setTimeout(() => {
      reset(); // volta pro "Toque para iniciar"
    }, getTimeoutForStep());
  }

  useEffect(() => {
    clearResetTimer();

    if (!started) return;   // se tá na tela do PLAY, não reseta por inatividade
    bumpAutoReset();        // sempre que entrar num step, começa a contagem

    return () => clearResetTimer();
  }, [started, step]);

  useEffect(() => {
    if (!started) return;

    const events = ["pointerdown", "touchstart", "mousemove", "keydown", "scroll"];
    const onActivity = () => bumpAutoReset();

    events.forEach((evt) =>
      window.addEventListener(evt, onActivity, { passive: true })
    );

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
    };
  }, [started, step]);


  // troca o vídeo A conforme step (apenas depois que started = true)
  useEffect(() => {
    if (!started) return;

    // STEP 4 = sempre standby em loop no vídeo B
    if (step === 4) {
      ensureStandbyLoop();
      return;
    }

    // STEP 1/2/3 = vídeo falado no A
    const main = videoARef.current;
    if (!main) return;

    const src =
      step === 1 ? VIDEO.step1 :
      step === 2 ? VIDEO.step2 :
      VIDEO.step3;

    main.src = src;
    try { main.currentTime = 0; } catch {}
    main.loop = false;
    main.muted = false;
    main.volume = 1;

    main.play().catch(() => {});
    setActiveVideo("A");
  }, [step, started]);


  // sempre que videoASrc mudar, toca o vídeo A (com som)
  useEffect(() => {
    if (!started) return;

    const v = videoARef.current;
    if (!v) return;

    v.load();
    v.currentTime = 0;
    v.loop = false;
    v.muted = false;
    v.volume = 1;

    v.play().catch(() => {});
  }, [videoASrc, started]);

  function handleEndedA() {
    const main = videoARef.current;
    const standby = videoBRef.current;

    // mata o vídeo de fala (A)
    if (main) {
      main.pause();
      try { main.currentTime = 0; } catch {}
    }

    // garante standby rodando em loop
    if (standby) {
      standby.loop = true;
      standby.muted = true;
      try { standby.currentTime = 0; } catch {}
      standby.play().catch(() => {});
    }

    setActiveVideo("B");
  }


  const pilar = useMemo(() => decidirPilar({ qualidade, procedimento }), [qualidade, procedimento]);
  const recomendados = useMemo(() => CATALOGO[pilar] || [], [pilar]);

  function toggleQualidade(item) {
    setQualidade((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  function reset() {
    setStarted(false);
    setStep(1);
    setTipo(null);
    setQualidade([]);
    setProcedimento(null);

    setActiveVideo("B");

    const a = videoARef.current;
    if (a) a.pause();

    const b = videoBRef.current;
    if (b) {
      b.loop = true;
      b.muted = true;
      b.play().catch(() => {});
    }
  }

  function startApp() {
    // clique do usuário: libera áudio e inicia step1
    setStarted(true);
    setStep(1);
    setVideoASrc(VIDEO.step1);
    setActiveVideo("A");
  }

  const canContinue =
    (step === 1 && !!tipo) ||
    (step === 2 && qualidade.length > 0) ||
    (step === 3 && !!procedimento);

  function ensureStandbyLoop() {
    const main = videoARef.current;     // vídeo A (fala)
    const standby = videoBRef.current;  // vídeo B (standby)

    // pausa e limpa o vídeo A para não "congelar" frame no topo
    if (main) {
      main.pause();
      try { main.currentTime = 0; } catch {}
    }

    // garante standby rodando em loop
    if (standby) {
      standby.loop = true;
      standby.muted = true; // standby sempre mudo
      try { standby.currentTime = 0; } catch {}
      standby.play().catch(() => {});
    }

    setActiveVideo("B");
  }


  function goNext() {
    if (step === 1 && !tipo) return;
    if (step === 2 && qualidade.length === 0) return;
    if (step === 3 && !procedimento) return;

    // 👇 SE ESTIVER SAINDO DO STEP 3, FORÇA STANDBY
    if (step === 3) {
      handleEndedA();
    }

    setStep((s) => Math.min(4, s + 1));
  }


  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="relative h-screen bg-[#DDEBDD] grid overflow-hidden grid-rows-[55vh_1fr] md:grid-rows-[60vh_1fr]">
      {/* HERO VIDEO */}
      <div className="relative h-full w-full overflow-visible bg-black">
        <div className="absolute inset-0">
          {/* Vídeo A (falado) */}
          <video
            ref={videoARef}
            src={videoASrc}
            playsInline
            preload="auto"
            onEnded={handleEndedA}
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
              activeVideo === "A" ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          {/* Vídeo B (standby loop) */}
          <video
            ref={videoBRef}
            src={VIDEO.standby}
            autoPlay
            playsInline
            muted
            loop
            preload="auto"
            className={[
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-150",
              activeVideo === "B" ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        </div>

        <div className="absolute inset-0 bg-black/10" />

        {/* Pill */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
          <Pill />
        </div>
      </div>

      {/* BASE */}
      <div className="min-h-0">
        <div className="mx-auto max-w-[980px] h-full px-6 pt-10 pb-6">
          <div className="mx-auto max-w-[760px] h-full min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto pr-2">
              {step === 1 && (
                <>
                  <SectionHeader label="CONSULTORIA CAPILAR" title="Análise Capilar" subtitle="Tipo de cabelo:" />
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {TIPOS.map((t) => (
                      <OptionButton key={t} text={t} onClick={() => setTipo(t)} active={tipo === t} />
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <SectionHeader
                    label="CONSULTORIA CAPILAR"
                    title="Análise Capilar"
                    subtitle={`Qualidade do cabelo (selecionados: ${qualidade.length})`}
                  />
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {QUALIDADES.map((q) => (
                      <OptionButton
                        key={q}
                        text={q}
                        onClick={() => toggleQualidade(q)}
                        active={qualidade.includes(q)}
                        leftIcon={qualidade.includes(q) ? "✓" : "≡"}
                        rightHint={qualidade.includes(q) ? "Selecionado" : ""}
                      />
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <SectionHeader label="CONSULTORIA CAPILAR" title="Análise Capilar" subtitle="Procedimentos realizados:" />
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {PROCEDIMENTOS.map((p) => (
                      <OptionButton key={p} text={p} onClick={() => setProcedimento(p)} active={procedimento === p} />
                    ))}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <SectionHeader label="INDICAÇÕES" title="Produtos recomendados para você" />
                  <div className="mt-8 grid gap-4">
                    {recomendados.map((item, idx) => (
                      <div key={idx} className="rounded-2xl bg-white/70 border border-black/5 px-6 py-5 shadow-sm">
                        <div className="text-xs font-extrabold tracking-widest text-[#2F6B48]">{item.categoria}</div>
                        <div className="mt-1 text-lg font-semibold text-[#0F1E16]">{item.nome}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={reset}
                      type="button"
                      className="w-full rounded-2xl bg-[#5C9B74] px-8 py-5 text-white text-xl font-extrabold shadow-md hover:shadow-lg active:scale-[0.98] transition"
                    >
                      Nova consulta
                    </button>
                  </div>
                </>
              )}
              
            </div>

            <div className="pt-6 flex items-center justify-between">
              <ArrowButton direction="left" onClick={goBack} disabled={step === 1} />
              <ArrowButton direction="right" onClick={goNext} disabled={step !== 4 && !canContinue} />
            </div>

            <div className="mt-4 text-center text-xs text-black/35">Smart Totem • Mockup interativo (kiosk)</div>
          </div>
        </div>
      </div>

      {/* PLAY OVERLAY */}
      {!started && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={startApp}
              className="h-44 w-44 md:h-52 md:w-52 rounded-full bg-[#5C9B74] shadow-2xl flex items-center justify-center active:scale-95 hover:scale-105 transition"
            >
              <span className="text-white text-7xl md:text-8xl translate-x-[4px]">▶</span>
            </button>

            <div className="text-center">
              <div className="text-white text-2xl md:text-3xl font-extrabold">Toque para iniciar</div>
              <div className="mt-1 text-white/80 text-sm md:text-base">Consultoria capilar • Bio Extratus</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
