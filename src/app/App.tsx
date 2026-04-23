import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Property = {
  id: string;
  title: string;
  region: string;
  address: string;
  nightly_rate: number;
  image_url?: string | null;
  description?: string | null;
  status?: string;
};

type Reservation = {
  id: string;
  property_id: string;
  guest_name: string;
  email?: string | null;
  phone?: string | null;
  check_in: string;
  check_out: string;
  guests?: number;
  status?: string;
  total_amount?: number;
};

type ViewMode = "list" | "details" | "admin";

const WHATSAPP_NUMBER = "5561999999999";

export default function App() {
  const auth = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");

  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [nightlyRate, setNightlyRate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);

    const { data: propertyData } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const { data: reservationData } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false });

    setProperties((propertyData as Property[]) || []);
    setReservations((reservationData as Reservation[]) || []);
    setLoading(false);
  }

  function openDetails(property: Property) {
    setSelectedProperty(property);
    setView("details");
    setSuccessMessage("");
  }

  function goToList() {
    setView("list");
    setSelectedProperty(null);
    setSuccessMessage("");
  }

  function openWhatsApp(message: string) {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
  }

  function handleOwnerWhatsApp() {
    const message =
      "Olá! Quero anunciar meu flat na Hospede-se Já e entender como funciona a plataforma com taxa de 5% sobre reservas geradas.";
    openWhatsApp(message);
  }

  function handleReserveWhatsAppDirect(property: Property) {
    const message =
      `Olá! Tenho interesse neste flat:%0A%0A` +
      `Imóvel: ${property.title}%0A` +
      `Região: ${property.region}%0A` +
      `Endereço: ${property.address}%0A` +
      `Valor: R$ ${property.nightly_rate} por noite%0A%0A` +
      `Gostaria de mais informações.`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  }

  async function handleLogin() {
    setLoginMessage("");

    if (!loginEmail || !loginPassword) {
      setLoginMessage("Preencha e-mail e senha.");
      return;
    }

    try {
      await auth.signIn(loginEmail, loginPassword);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error: any) {
      setLoginMessage(error.message || "Erro ao fazer login.");
    }
  }

  async function handleLogout() {
    await auth.signOut();
    setView("list");
  }

  async function handleReserve() {
    if (!selectedProperty) return;

    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      alert("Preencha nome, e-mail, check-in e check-out.");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const totalAmount = selectedProperty.nightly_rate * nights;

    const { error } = await supabase.from("reservations").insert([
      {
        property_id: selectedProperty.id,
        guest_name: guestName,
        email: guestEmail,
        phone: guestPhone,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        status: "pending",
        total_amount: totalAmount,
      },
    ]);

    if (error) {
      alert(`Erro ao criar reserva: ${error.message}`);
      return;
    }

    const whatsappMessage =
      `Olá! Recebi uma nova solicitação de reserva pelo site.%0A%0A` +
      `Imóvel: ${selectedProperty.title}%0A` +
      `Nome: ${guestName}%0A` +
      `E-mail: ${guestEmail}%0A` +
      `Telefone: ${guestPhone || "Não informado"}%0A` +
      `Check-in: ${checkIn}%0A` +
      `Check-out: ${checkOut}%0A` +
      `Hóspedes: ${guests}%0A` +
      `Valor estimado: R$ ${totalAmount}`;

    setSuccessMessage("Reserva enviada com sucesso.");
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    loadAll();

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`, "_blank");
  }

  async function handleCreateProperty() {
    if (!title || !region || !address || !nightlyRate) {
      alert("Preencha título, região, endereço e diária.");
      return;
    }

    const { error } = await supabase.from("properties").insert([
      {
        title,
        region,
        address,
        nightly_rate: Number(nightlyRate),
        cleaning_fee: 0,
        guests: 2,
        bedrooms: 1,
        bathrooms: 1,
        status: "published",
        image_url: imageUrl || null,
        description: description || null,
      },
    ]);

    if (error) {
      alert(`Erro ao cadastrar imóvel: ${error.message}`);
      return;
    }

    setAdminMessage("Imóvel cadastrado com sucesso.");
    setTitle("");
    setRegion("");
    setAddress("");
    setNightlyRate("");
    setImageUrl("");
    setDescription("");
    loadAll();
  }

  if (auth.loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Carregando...</div>
      </div>
    );
  }

  if (!auth.session) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, width: 420 }}>
          <h2 style={{ margin: 0, fontSize: 32, color: "#111" }}>Login Admin</h2>
          <p style={{ marginTop: 10, color: "#666" }}>
            Entre com seu usuário para acessar o painel administrativo.
          </p>

          {loginMessage && (
            <div
              style={{
                marginTop: 16,
                background: "#fff7ed",
                color: "#9a3412",
                padding: 14,
                borderRadius: 14,
                fontWeight: 700,
              }}
            >
              {loginMessage}
            </div>
          )}

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <input
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="E-mail"
              style={inputStyle}
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Senha"
              style={inputStyle}
            />
            <button onClick={handleLogin} style={primaryWideButton}>
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f7",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e5e5",
          padding: "20px 32px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            onClick={goToList}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 34 }}>🏠</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 36,
                  lineHeight: 1,
                  color: "#111",
                }}
              >
                Hospede-se Já
              </h1>
              <p style={{ margin: "6px 0 0", color: "#666" }}>
                Plataforma de flats em Brasília
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={goToList} style={secondaryButton}>
              Início
            </button>
            <button onClick={() => setView("admin")} style={primaryButton}>
              Admin
            </button>
            <button onClick={handleOwnerWhatsApp} style={greenButton}>
              Anunciar meu flat
            </button>
            <button onClick={handleLogout} style={secondaryButton}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        {view === "list" && (
          <>
            <section
              style={{
                background: "linear-gradient(135deg, #fff 0%, #fff7f8 100%)",
                borderRadius: 28,
                padding: 36,
                border: "1px solid #ececec",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr",
                  gap: 28,
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#fff0f3",
                      color: "#ff385c",
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontWeight: 700,
                      marginBottom: 18,
                    }}
                  >
                    Plataforma com taxa de 5%
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 48,
                      lineHeight: 1.1,
                      color: "#111",
                    }}
                  >
                    Anuncie seu flat em Brasília e pague apenas 5% sobre reservas geradas
                  </h2>

                  <p
                    style={{
                      marginTop: 18,
                      fontSize: 20,
                      lineHeight: 1.6,
                      color: "#555",
                      maxWidth: 760,
                    }}
                  >
                    Publicamos seu imóvel, conectamos com hóspedes e você só paga quando gerar aluguel.
                    Sem mensalidade, sem custo fixo e sem administração do seu imóvel.
                  </p>

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 24 }}>
                    <button onClick={handleOwnerWhatsApp} style={primaryButton}>
                      Quero anunciar meu flat
                    </button>
                    <button onClick={() => window.scrollTo({ top: 900, behavior: "smooth" })} style={secondaryButton}>
                      Ver flats publicados
                    </button>
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                    Como funciona
                  </h3>

                  <div style={{ display: "grid", gap: 14 }}>
                    {[
                      "1. Você cadastra seu flat",
                      "2. Nós publicamos na plataforma",
                      "3. Recebemos pedidos de reserva",
                      "4. Você aprova e hospeda",
                      "5. Cobramos apenas 5% do aluguel gerado",
                    ].map((item) => (
                      <div
                        key={item}
                        style={{
                          background: "#fafafa",
                          border: "1px solid #ececec",
                          borderRadius: 16,
                          padding: 16,
                          fontWeight: 600,
                          color: "#222",
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                marginBottom: 32,
              }}
            >
              {[
                {
                  title: "Sem taxa fixa",
                  text: "Você não paga mensalidade. Só paga quando a plataforma gerar reserva para seu imóvel.",
                },
                {
                  title: "Você continua no controle",
                  text: "Você mantém a operação e a hospedagem do imóvel. Nós focamos em divulgação e geração de demanda.",
                },
                {
                  title: "Modelo leve e escalável",
                  text: "Sem administração e sem exclusividade pesada. Mais simples para entrar e começar a anunciar.",
                },
              ].map((item) => (
                <div key={item.title} style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 26, color: "#111" }}>{item.title}</h3>
                  <p style={{ margin: 0, color: "#555", lineHeight: 1.7, fontSize: 17 }}>{item.text}</p>
                </div>
              ))}
            </section>

            <section
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: 32,
                border: "1px solid #ececec",
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                marginBottom: 32,
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 34, color: "#111" }}>
                Por que anunciar com a Hospede-se Já
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 18,
                  marginTop: 18,
                }}
              >
                {[
                  "Mais visibilidade para flats em Brasília",
                  "Modelo simples: só paga 5% sobre o que gerar",
                  "Sem custo antecipado",
                  "Captação de hóspedes pela plataforma e WhatsApp",
                  "Entrada mais fácil para proprietários",
                  "Ideal para testar sem compromisso pesado",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      background: "#fafafa",
                      border: "1px solid #ececec",
                      borderRadius: 16,
                      padding: 18,
                      fontSize: 17,
                      color: "#222",
                      fontWeight: 600,
                    }}
                  >
                    ✔ {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 24,
                  background: "#fdf2f8",
                  border: "1px solid #fbcfe8",
                  borderRadius: 20,
                  padding: 22,
                }}
              >
                <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                  Transparência total da taxa
                </h3>
                <p style={{ margin: 0, color: "#444", fontSize: 18, lineHeight: 1.7 }}>
                  Você paga apenas <strong>5%</strong> sobre reservas confirmadas geradas pela plataforma.
                  Se não tiver reserva, você não paga nada.
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 30, color: "#111" }}>
                Flats disponíveis
              </h2>
              <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                Hospedagens selecionadas para curta temporada em Brasília
              </p>
            </section>

            {loading && <p>Carregando imóveis...</p>}

            {!loading && properties.length === 0 && (
              <div style={cardStyle}>Nenhum imóvel cadastrado ainda.</div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {properties.map((p) => (
                <div key={p.id} style={cardStyle}>
                  <div
                    style={{
                      height: 220,
                      background: "#ddd",
                      overflow: "hidden",
                      borderRadius: 18,
                    }}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                        }}
                      >
                        🏢
                      </div>
                    )}
                  </div>

                  <div style={{ paddingTop: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: 28, color: "#222" }}>
                          {p.title}
                        </h3>
                        <p style={{ margin: "8px 0 0", color: "#666", fontSize: 16 }}>
                          {p.region}
                        </p>
                      </div>

                      <span
                        style={{
                          background: "#fff0f3",
                          color: "#ff385c",
                          fontWeight: 700,
                          padding: "8px 12px",
                          borderRadius: 999,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Destaque
                      </span>
                    </div>

                    <p style={{ margin: "14px 0 0", color: "#666", fontSize: 17 }}>
                      {p.address}
                    </p>

                    <p
                      style={{
                        margin: "18px 0 0",
                        fontSize: 28,
                        fontWeight: 700,
                        color: "#111",
                      }}
                    >
                      R$ {p.nightly_rate}{" "}
                      <span style={{ fontSize: 18, fontWeight: 400 }}>/ noite</span>
                    </p>

                    <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                      <button onClick={() => openDetails(p)} style={primaryWideButton}>
                        Reservar
                      </button>
                      <button
                        onClick={() => handleReserveWhatsAppDirect(p)}
                        style={greenWideButton}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <section
              style={{
                marginTop: 40,
                background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
                borderRadius: 28,
                padding: 34,
                color: "#fff",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 36 }}>
                Tem um flat em Brasília?
              </h2>
              <p style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
                Publique com a Hospede-se Já e pague apenas 5% sobre o que for gerado em aluguel.
                Sem taxa fixa, sem mensalidade e sem custo antecipado.
              </p>
              <div style={{ marginTop: 20, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={handleOwnerWhatsApp} style={greenButton}>
                  Quero anunciar meu flat
                </button>
                <button onClick={() => setView("admin")} style={secondaryButton}>
                  Ir para o painel
                </button>
              </div>
            </section>
          </>
        )}

        {view === "details" && selectedProperty && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 28,
            }}
          >
            <div>
              <button onClick={goToList} style={secondaryButton}>
                ← Voltar
              </button>

              <div style={{ ...cardStyle, marginTop: 20 }}>
                <div style={{ height: 360, background: "#ddd", borderRadius: 18 }}>
                  {selectedProperty.image_url ? (
                    <img
                      src={selectedProperty.image_url}
                      alt={selectedProperty.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: 18,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 70,
                      }}
                    >
                      🏢
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 36, color: "#111" }}>
                    {selectedProperty.title}
                  </h2>

                  <p style={{ marginTop: 10, color: "#666", fontSize: 18 }}>
                    {selectedProperty.region}
                  </p>

                  <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                    {selectedProperty.address}
                  </p>

                  <p
                    style={{
                      marginTop: 20,
                      fontSize: 32,
                      fontWeight: 700,
                      color: "#111",
                    }}
                  >
                    R$ {selectedProperty.nightly_rate}{" "}
                    <span style={{ fontSize: 20, fontWeight: 400 }}>/ noite</span>
                  </p>

                  <p
                    style={{
                      marginTop: 20,
                      color: "#444",
                      lineHeight: 1.6,
                      fontSize: 17,
                    }}
                  >
                    {selectedProperty.description ||
                      "Flat premium para curta temporada em Brasília, com ótima localização e conforto para estadias executivas e lazer."}
                  </p>

                  <div style={{ marginTop: 20 }}>
                    <button
                      onClick={() => handleReserveWhatsAppDirect(selectedProperty)}
                      style={greenWideButton}
                    >
                      Falar sobre este flat no WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  ...cardStyle,
                  position: "sticky",
                  top: 110,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 28, color: "#111" }}>
                  Reservar este flat
                </h3>

                <p style={{ marginTop: 10, color: "#666" }}>
                  Preencha seus dados para solicitar a reserva.
                </p>

                {successMessage && (
                  <div
                    style={{
                      marginTop: 16,
                      background: "#ecfdf3",
                      color: "#166534",
                      padding: 14,
                      borderRadius: 14,
                      fontWeight: 700,
                    }}
                  >
                    {successMessage}
                  </div>
                )}

                <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                  <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nome completo" style={inputStyle} />
                  <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="E-mail" style={inputStyle} />
                  <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Telefone / WhatsApp" style={inputStyle} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={inputStyle} />
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} style={inputStyle} />
                  </div>

                  <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} placeholder="Hóspedes" style={inputStyle} />

                  <button onClick={handleReserve} style={primaryWideButton}>
                    Enviar reserva
                  </button>

                  <button
                    onClick={() => handleReserveWhatsAppDirect(selectedProperty)}
                    style={greenWideButton}
                  >
                    Reservar pelo WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "admin" && (
          <div style={{ display: "grid", gap: 28 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 34, color: "#111" }}>Painel Admin</h2>
              <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                Cadastre imóveis e acompanhe as reservas recebidas.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "0.9fr 1.1fr",
                gap: 24,
              }}
            >
              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                  Cadastrar imóvel
                </h3>

                {adminMessage && (
                  <div
                    style={{
                      marginBottom: 16,
                      background: "#ecfdf3",
                      color: "#166534",
                      padding: 14,
                      borderRadius: 14,
                      fontWeight: 700,
                    }}
                  >
                    {adminMessage}
                  </div>
                )}

                <div style={{ display: "grid", gap: 12 }}>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do imóvel" style={inputStyle} />
                  <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Região" style={inputStyle} />
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço" style={inputStyle} />
                  <input value={nightlyRate} onChange={(e) => setNightlyRate(e.target.value)} placeholder="Diária" style={inputStyle} />
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem" style={inputStyle} />
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição"
                    style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                  />

                  <button onClick={handleCreateProperty} style={primaryWideButton}>
                    Salvar imóvel
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 24 }}>
                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                    Imóveis cadastrados
                  </h3>

                  <div style={{ display: "grid", gap: 14 }}>
                    {properties.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <strong style={{ fontSize: 20 }}>{p.title}</strong>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>{p.address}</p>
                        <p style={{ margin: "8px 0 0", color: "#111", fontWeight: 700 }}>
                          R$ {p.nightly_rate} / noite
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                    Reservas recebidas
                  </h3>

                  <div style={{ display: "grid", gap: 14 }}>
                    {reservations.length === 0 && (
                      <p style={{ color: "#666" }}>Nenhuma reserva recebida ainda.</p>
                    )}

                    {reservations.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <strong style={{ fontSize: 20 }}>{r.guest_name}</strong>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>{r.email}</p>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>{r.phone}</p>
                        <p style={{ margin: "8px 0 0", color: "#111" }}>
                          {r.check_in} até {r.check_out}
                        </p>
                        <p style={{ margin: "8px 0 0", color: "#111", fontWeight: 700 }}>
                          Total: R$ {r.total_amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          background: "#25d366",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 999,
          padding: "14px 18px",
          fontWeight: 700,
          boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
        }}
      >
        WhatsApp
      </a>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f7f7f7",
  fontFamily: "Arial, sans-serif",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 24,
  border: "1px solid #ececec",
  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  padding: 24,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #ddd",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  background: "#ff385c",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "12px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const greenButton: React.CSSProperties = {
  background: "#25d366",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "12px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  background: "#fff",
  color: "#222",
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: "12px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryWideButton: React.CSSProperties = {
  flex: 1,
  background: "#ff385c",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const greenWideButton: React.CSSProperties = {
  flex: 1,
  background: "#25d366",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "14px 16px",
  fontWeight: 700,
  cursor: "pointer",
};