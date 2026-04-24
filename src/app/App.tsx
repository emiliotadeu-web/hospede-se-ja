import { useEffect, useMemo, useState } from "react";
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
  financial_status?: string;
  total_amount?: number;
};

type OwnerLead = {
  id: string;
  name: string;
  phone: string;
  region?: string | null;
  property_type?: string | null;
  message?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at?: string;
};

type OwnerLeadImage = {
  id: string;
  owner_lead_id: string;
  image_url: string;
  created_at?: string;
};

type ExternalCalendar = {
  id: string;
  property_id: string;
  platform: string;
  ical_url: string;
  is_active?: boolean;
  last_synced_at?: string | null;
  created_at?: string;
};

type PropertyBlock = {
  id: string;
  property_id: string;
  source: string;
  external_calendar_id?: string | null;
  start_date: string;
  end_date: string;
  external_event_uid?: string | null;
  notes?: string | null;
  created_at?: string;
};

type ViewMode = "list" | "details" | "admin";

const WHATSAPP_NUMBER = "5561999999999";
const PLATFORM_FEE_PERCENT = 0.1;

export default function App() {
  const auth = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [ownerLeads, setOwnerLeads] = useState<OwnerLead[]>([]);
  const [ownerLeadImages, setOwnerLeadImages] = useState<OwnerLeadImage[]>([]);
  const [externalCalendars, setExternalCalendars] = useState<ExternalCalendar[]>([]);
  const [propertyBlocks, setPropertyBlocks] = useState<PropertyBlock[]>([]);

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

  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadRegion, setLeadRegion] = useState("");
  const [leadPropertyType, setLeadPropertyType] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadSuccessMessage, setLeadSuccessMessage] = useState("");
  const [leadFiles, setLeadFiles] = useState<FileList | null>(null);

  const [leadFilter, setLeadFilter] = useState("todos");
  const [leadUpdateMessage, setLeadUpdateMessage] = useState("");

  const [calendarPropertyId, setCalendarPropertyId] = useState("");
  const [calendarPlatform, setCalendarPlatform] = useState("airbnb");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [calendarMessage, setCalendarMessage] = useState("");

  useEffect(() => {
    loadPublicData();
  }, []);

  useEffect(() => {
    if (auth.session && view === "admin") {
      loadAll();
    }
  }, [auth.session, view]);

  async function loadPublicData() {
    setLoading(true);

    const [propertyResponse, propertyBlockResponse] = await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_blocks")
        .select("*")
        .order("start_date", { ascending: true }),
    ]);

    setProperties((propertyResponse.data as Property[]) || []);
    setPropertyBlocks((propertyBlockResponse.data as PropertyBlock[]) || []);
    setLoading(false);
  }

  async function loadAll() {
    setLoading(true);

    const [
      propertyResponse,
      reservationResponse,
      ownerLeadResponse,
      ownerLeadImageResponse,
      externalCalendarResponse,
      propertyBlockResponse,
    ] = await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("owner_leads")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("owner_lead_images")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_external_calendars")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_blocks")
        .select("*")
        .order("start_date", { ascending: true }),
    ]);

    setProperties((propertyResponse.data as Property[]) || []);
    setReservations((reservationResponse.data as Reservation[]) || []);
    setOwnerLeads((ownerLeadResponse.data as OwnerLead[]) || []);
    setOwnerLeadImages((ownerLeadImageResponse.data as OwnerLeadImage[]) || []);
    setExternalCalendars((externalCalendarResponse.data as ExternalCalendar[]) || []);
    setPropertyBlocks((propertyBlockResponse.data as PropertyBlock[]) || []);
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
    setLeadUpdateMessage("");
    setCalendarMessage("");
  }

  function goToAdmin() {
    setView("admin");
    setSelectedProperty(null);
  }

  function openWhatsApp(message: string) {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
  }

  function handleOwnerWhatsApp() {
    const message =
      "Olá! Quero anunciar meu flat na Hospede-se Já e entender como funciona a plataforma com taxa de 10% sobre reservas geradas.";
    openWhatsApp(message);
  }

  function handleReserveWhatsAppDirect(property: Property) {
    const message =
      `Olá! Tenho interesse neste flat:\n\n` +
      `Imóvel: ${property.title}\n` +
      `Região: ${property.region}\n` +
      `Endereço: ${property.address}\n` +
      `Valor: R$ ${property.nightly_rate} por noite\n\n` +
      `Gostaria de mais informações.`;

    openWhatsApp(message);
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
      setView("admin");
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

    if (checkOut <= checkIn) {
      alert("A data de check-out deve ser maior que a data de check-in.");
      return;
    }

    const { data: conflicts, error: conflictError } = await supabase
      .from("property_blocks")
      .select("*")
      .eq("property_id", selectedProperty.id)
      .lt("start_date", checkOut)
      .gt("end_date", checkIn);

    if (conflictError) {
      alert(`Erro ao verificar disponibilidade: ${conflictError.message}`);
      return;
    }

    if (conflicts && conflicts.length > 0) {
      alert(
        "Este imóvel está bloqueado nesse período por reserva em outra plataforma ou bloqueio manual."
      );
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
        financial_status: "pendente",
        total_amount: totalAmount,
      },
    ]);

    if (error) {
      alert(`Erro ao criar reserva: ${error.message}`);
      return;
    }

    const whatsappMessage =
      `Olá! Recebi uma nova solicitação de reserva pelo site.\n\n` +
      `Imóvel: ${selectedProperty.title}\n` +
      `Nome: ${guestName}\n` +
      `E-mail: ${guestEmail}\n` +
      `Telefone: ${guestPhone || "Não informado"}\n` +
      `Check-in: ${checkIn}\n` +
      `Check-out: ${checkOut}\n` +
      `Hóspedes: ${guests}\n` +
      `Valor estimado: R$ ${totalAmount}`;

    setSuccessMessage("Reserva enviada com sucesso.");
    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);

    await loadPublicData();
    openWhatsApp(whatsappMessage);
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

  async function handleCreateOwnerLead() {
    if (!leadName || !leadPhone) {
      alert("Preencha nome e telefone.");
      return;
    }

    const { data: leadData, error: leadError } = await supabase
      .from("owner_leads")
      .insert([
        {
          name: leadName,
          phone: leadPhone,
          region: leadRegion || null,
          property_type: leadPropertyType || null,
          message: leadMessage || null,
          status: "novo",
          notes: null,
        },
      ])
      .select()
      .single();

    if (leadError) {
      alert(`Erro ao salvar lead: ${leadError.message}`);
      return;
    }

    if (leadFiles && leadFiles.length > 0) {
      for (const file of Array.from(leadFiles)) {
        const ext = file.name.split(".").pop();
        const filePath = `owner-leads/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("owner-property-images")
          .upload(filePath, file);

        if (uploadError) {
          alert(`Erro ao enviar imagem: ${uploadError.message}`);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from("owner-property-images")
          .getPublicUrl(filePath);

        await supabase.from("owner_lead_images").insert([
          {
            owner_lead_id: leadData.id,
            image_url: publicUrlData.publicUrl,
          },
        ]);
      }
    }

    const whatsappMessage =
      `Olá! Acabei de preencher o formulário para anunciar meu flat.\n\n` +
      `Nome: ${leadName}\n` +
      `Telefone: ${leadPhone}\n` +
      `Região: ${leadRegion || "Não informada"}\n` +
      `Tipo do imóvel: ${leadPropertyType || "Não informado"}\n` +
      `Mensagem: ${leadMessage || "Sem mensagem"}\n` +
      `Fotos enviadas: ${leadFiles && leadFiles.length > 0 ? leadFiles.length : 0}`;

    setLeadSuccessMessage("Lead enviado com sucesso.");
    setLeadName("");
    setLeadPhone("");
    setLeadRegion("");
    setLeadPropertyType("");
    setLeadMessage("");
    setLeadFiles(null);

    openWhatsApp(whatsappMessage);
  }

  async function handleUpdateLead(
    id: string,
    updates: { status?: string; notes?: string }
  ) {
    const { error } = await supabase.from("owner_leads").update(updates).eq("id", id);

    if (error) {
      alert(`Erro ao atualizar lead: ${error.message}`);
      return;
    }

    setLeadUpdateMessage("Lead atualizado com sucesso.");
    loadAll();
  }

  async function handleUpdateReservationFinancialStatus(
    id: string,
    financialStatus: string
  ) {
    const { error } = await supabase
      .from("reservations")
      .update({ financial_status: financialStatus })
      .eq("id", id);

    if (error) {
      alert(`Erro ao atualizar status financeiro: ${error.message}`);
      return;
    }

    loadAll();
  }

  async function handleCreateExternalCalendar() {
    setCalendarMessage("");

    if (!calendarPropertyId || !calendarPlatform || !calendarUrl) {
      setCalendarMessage("Selecione o imóvel, a plataforma e informe a URL iCal.");
      return;
    }

    const { error } = await supabase.from("property_external_calendars").insert([
      {
        property_id: calendarPropertyId,
        platform: calendarPlatform,
        ical_url: calendarUrl,
        is_active: true,
      },
    ]);

    if (error) {
      alert(`Erro ao salvar calendário externo: ${error.message}`);
      return;
    }

    setCalendarMessage("Calendário externo cadastrado com sucesso.");
    setCalendarPropertyId("");
    setCalendarPlatform("airbnb");
    setCalendarUrl("");
    loadAll();
  }

  const filteredOwnerLeads =
    leadFilter === "todos"
      ? ownerLeads
      : ownerLeads.filter((lead) => lead.status === leadFilter);

  const financialReservations = reservations.filter((reservation) =>
    ["confirmada", "paga_ao_proprietario"].includes(
      reservation.financial_status || "pendente"
    )
  );

  const totalReservationsAmount = financialReservations.reduce(
    (sum, reservation) => sum + Number(reservation.total_amount || 0),
    0
  );

  const totalPlatformFee = financialReservations.reduce(
    (sum, reservation) =>
      sum + Number(reservation.total_amount || 0) * PLATFORM_FEE_PERCENT,
    0
  );

  const totalOwnerNet = financialReservations.reduce(
    (sum, reservation) =>
      sum + Number(reservation.total_amount || 0) * (1 - PLATFORM_FEE_PERCENT),
    0
  );

  const selectedPropertyBlocks = useMemo(() => {
    if (!selectedProperty) return [];
    return propertyBlocks.filter((block) => block.property_id === selectedProperty.id);
  }, [propertyBlocks, selectedProperty]);

  if (loading && view !== "admin") {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Carregando...</div>
      </div>
    );
  }

  if (view === "admin" && auth.loading) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>Carregando...</div>
      </div>
    );
  }

  if (view === "admin" && !auth.session) {
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
            <button onClick={goToList} style={secondaryWideButton}>
              Voltar ao site
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
            <button onClick={goToAdmin} style={primaryButton}>
              Admin
            </button>
            <button onClick={handleOwnerWhatsApp} style={greenButton}>
              Anunciar meu flat
            </button>
            {auth.session && (
              <button onClick={handleLogout} style={secondaryButton}>
                Sair
              </button>
            )}
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
                    Plataforma com taxa de 10%
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 48,
                      lineHeight: 1.1,
                      color: "#111",
                    }}
                  >
                    Anuncie seu flat em Brasília e pague apenas 10% sobre reservas geradas
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
                    <button
                      onClick={() => window.scrollTo({ top: 1300, behavior: "smooth" })}
                      style={secondaryButton}
                    >
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
                      "5. Cobramos apenas 10% do aluguel gerado",
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
                  <p style={{ margin: 0, color: "#555", lineHeight: 1.7, fontSize: 17 }}>
                    {item.text}
                  </p>
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
                  "Modelo simples: só paga 10% sobre o que gerar",
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
                  Você paga apenas <strong>10%</strong> sobre reservas confirmadas geradas pela plataforma.
                  Se não tiver reserva, você não paga nada.
                </p>
              </div>
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
                Quero anunciar meu flat
              </h2>
              <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                Preencha os dados abaixo e nossa equipe entra em contato. Você paga apenas 10% sobre reservas geradas.
              </p>

              {leadSuccessMessage && (
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
                  {leadSuccessMessage}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Seu nome"
                  style={inputStyle}
                />
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Telefone / WhatsApp"
                  style={inputStyle}
                />
                <input
                  value={leadRegion}
                  onChange={(e) => setLeadRegion(e.target.value)}
                  placeholder="Região do flat"
                  style={inputStyle}
                />
                <input
                  value={leadPropertyType}
                  onChange={(e) => setLeadPropertyType(e.target.value)}
                  placeholder="Tipo do imóvel"
                  style={inputStyle}
                />
              </div>

              <textarea
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Conte um pouco sobre o imóvel"
                style={{ ...inputStyle, minHeight: 120, resize: "vertical", marginTop: 14 }}
              />

              <div style={{ marginTop: 14 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    color: "#444",
                    fontWeight: 600,
                  }}
                >
                  Fotos do imóvel
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setLeadFiles(e.target.files)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={handleCreateOwnerLead} style={primaryButton}>
                  Enviar e anunciar meu flat
                </button>
                <button onClick={handleOwnerWhatsApp} style={greenButton}>
                  Falar no WhatsApp
                </button>
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
                Publique com a Hospede-se Já e pague apenas 10% sobre o que for gerado em aluguel.
                Sem taxa fixa, sem mensalidade e sem custo antecipado.
              </p>
              <div style={{ marginTop: 20, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button onClick={handleOwnerWhatsApp} style={greenButton}>
                  Quero anunciar meu flat
                </button>
                <button onClick={goToAdmin} style={secondaryButton}>
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

                  {selectedPropertyBlocks.length > 0 && (
                    <div
                      style={{
                        marginTop: 20,
                        background: "#fff7ed",
                        color: "#9a3412",
                        padding: 16,
                        borderRadius: 16,
                        border: "1px solid #fed7aa",
                      }}
                    >
                      <strong>Datas bloqueadas encontradas</strong>
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {selectedPropertyBlocks.slice(0, 5).map((block) => (
                          <div key={block.id}>
                            {block.start_date} até {block.end_date} • origem: {block.source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

        {view === "admin" && auth.session && (
          <div style={{ display: "grid", gap: 28 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 34, color: "#111" }}>Painel Admin</h2>
              <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                Cadastre imóveis e acompanhe reservas, leads e bloqueios externos.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 18,
              }}
            >
              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#666", fontSize: 16 }}>Total gerado</p>
                <h3 style={{ margin: "10px 0 0", fontSize: 32, color: "#111" }}>
                  R$ {totalReservationsAmount.toFixed(2)}
                </h3>
              </div>

              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#666", fontSize: 16 }}>Sua comissão (10%)</p>
                <h3 style={{ margin: "10px 0 0", fontSize: 32, color: "#111" }}>
                  R$ {totalPlatformFee.toFixed(2)}
                </h3>
              </div>

              <div style={cardStyle}>
                <p style={{ margin: 0, color: "#666", fontSize: 16 }}>Líquido do proprietário</p>
                <h3 style={{ margin: "10px 0 0", fontSize: 32, color: "#111" }}>
                  R$ {totalOwnerNet.toFixed(2)}
                </h3>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "0.9fr 1.1fr",
                gap: 24,
              }}
            >
              <div style={{ display: "grid", gap: 24 }}>
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

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                    Calendário externo (iCal)
                  </h3>

                  {calendarMessage && (
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
                      {calendarMessage}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 12 }}>
                    <select
                      value={calendarPropertyId}
                      onChange={(e) => setCalendarPropertyId(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Selecione o imóvel</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={calendarPlatform}
                      onChange={(e) => setCalendarPlatform(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="airbnb">Airbnb</option>
                      <option value="booking">Booking</option>
                      <option value="vrbo">Vrbo</option>
                      <option value="outro">Outro</option>
                    </select>

                    <input
                      value={calendarUrl}
                      onChange={(e) => setCalendarUrl(e.target.value)}
                      placeholder="URL iCal / ICS"
                      style={inputStyle}
                    />

                    <button onClick={handleCreateExternalCalendar} style={primaryWideButton}>
                      Salvar calendário externo
                    </button>
                  </div>
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
                    Calendários externos cadastrados
                  </h3>

                  <div style={{ display: "grid", gap: 14 }}>
                    {externalCalendars.length === 0 && (
                      <p style={{ color: "#666" }}>Nenhum calendário externo cadastrado ainda.</p>
                    )}

                    {externalCalendars.map((calendar) => {
                      const property = properties.find((p) => p.id === calendar.property_id);
                      return (
                        <div
                          key={calendar.id}
                          style={{
                            border: "1px solid #ececec",
                            borderRadius: 16,
                            padding: 16,
                          }}
                        >
                          <strong style={{ fontSize: 18 }}>
                            {property?.title || "Imóvel"}
                          </strong>
                          <p style={{ margin: "8px 0 0", color: "#666" }}>
                            Plataforma: {calendar.platform}
                          </p>
                          <p style={{ margin: "8px 0 0", color: "#666", wordBreak: "break-all" }}>
                            {calendar.ical_url}
                          </p>
                          <p style={{ margin: "8px 0 0", color: "#666" }}>
                            Última sincronização: {calendar.last_synced_at || "Ainda não sincronizado"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ marginTop: 0, fontSize: 28, color: "#111" }}>
                    Bloqueios externos
                  </h3>

                  <div style={{ display: "grid", gap: 14 }}>
                    {propertyBlocks.length === 0 && (
                      <p style={{ color: "#666" }}>Nenhum bloqueio encontrado ainda.</p>
                    )}

                    {propertyBlocks.map((block) => {
                      const property = properties.find((p) => p.id === block.property_id);
                      return (
                        <div
                          key={block.id}
                          style={{
                            border: "1px solid #ececec",
                            borderRadius: 16,
                            padding: 16,
                          }}
                        >
                          <strong style={{ fontSize: 18 }}>
                            {property?.title || "Imóvel"}
                          </strong>
                          <p style={{ margin: "8px 0 0", color: "#666" }}>
                            Origem: {block.source}
                          </p>
                          <p style={{ margin: "8px 0 0", color: "#111" }}>
                            {block.start_date} até {block.end_date}
                          </p>
                          {block.notes && (
                            <p style={{ margin: "8px 0 0", color: "#666" }}>
                              {block.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
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
                          Total da reserva: R$ {Number(r.total_amount || 0).toFixed(2)}
                        </p>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>
                          Comissão da plataforma (10%): R$ {(Number(r.total_amount || 0) * PLATFORM_FEE_PERCENT).toFixed(2)}
                        </p>
                        <p style={{ margin: "8px 0 0", color: "#666" }}>
                          Líquido do proprietário: R$ {(Number(r.total_amount || 0) * (1 - PLATFORM_FEE_PERCENT)).toFixed(2)}
                        </p>

                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                          <label style={{ color: "#444", fontWeight: 600 }}>
                            Status financeiro
                          </label>

                          <select
                            value={r.financial_status || "pendente"}
                            onChange={(e) =>
                              handleUpdateReservationFinancialStatus(r.id, e.target.value)
                            }
                            style={{
                              ...inputStyle,
                              padding: "10px 14px",
                            }}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="paga_ao_proprietario">Paga ao proprietário</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <h3 style={{ marginTop: 0, fontSize: 28, color: "#111", marginBottom: 0 }}>
                      Leads de proprietários
                    </h3>

                    <select
                      value={leadFilter}
                      onChange={(e) => setLeadFilter(e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 220,
                        padding: "10px 14px",
                      }}
                    >
                      <option value="todos">Todos</option>
                      <option value="novo">Novo</option>
                      <option value="contato_feito">Contato feito</option>
                      <option value="visita_agendada">Visita agendada</option>
                      <option value="aguardando_documentos">Aguardando documentos</option>
                      <option value="publicado">Publicado</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>

                  {leadUpdateMessage && (
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
                      {leadUpdateMessage}
                    </div>
                  )}

                  <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                    {filteredOwnerLeads.length === 0 && (
                      <p style={{ color: "#666" }}>Nenhum lead encontrado nesse estágio.</p>
                    )}

                    {filteredOwnerLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        images={ownerLeadImages.filter((img) => img.owner_lead_id === lead.id)}
                        onUpdate={handleUpdateLead}
                      />
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

function LeadCard({
  lead,
  images,
  onUpdate,
}: {
  lead: OwnerLead;
  images: OwnerLeadImage[];
  onUpdate: (id: string, updates: { status?: string; notes?: string }) => void;
}) {
  const [notesValue, setNotesValue] = useState(lead.notes || "");
  const [statusValue, setStatusValue] = useState(lead.status || "novo");

  return (
    <div
      style={{
        border: "1px solid #ececec",
        borderRadius: 16,
        padding: 16,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong style={{ fontSize: 20 }}>{lead.name}</strong>
          <p style={{ margin: "8px 0 0", color: "#666" }}>{lead.phone}</p>
          <p style={{ margin: "8px 0 0", color: "#666" }}>
            Região: {lead.region || "Não informada"}
          </p>
          <p style={{ margin: "8px 0 0", color: "#666" }}>
            Tipo: {lead.property_type || "Não informado"}
          </p>
          <p style={{ margin: "8px 0 0", color: "#111" }}>
            {lead.message || "Sem mensagem"}
          </p>
        </div>

        <div
          style={{
            minWidth: 220,
            display: "grid",
            gap: 10,
          }}
        >
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            style={{
              ...inputStyle,
              padding: "10px 14px",
            }}
          >
            <option value="novo">Novo</option>
            <option value="contato_feito">Contato feito</option>
            <option value="visita_agendada">Visita agendada</option>
            <option value="aguardando_documentos">Aguardando documentos</option>
            <option value="publicado">Publicado</option>
            <option value="perdido">Perdido</option>
          </select>

          <button
            onClick={() => onUpdate(lead.id, { status: statusValue })}
            style={primaryWideButton}
          >
            Salvar status
          </button>
        </div>
      </div>

      <textarea
        value={notesValue}
        onChange={(e) => setNotesValue(e.target.value)}
        placeholder="Observações comerciais"
        style={{
          ...inputStyle,
          minHeight: 100,
          resize: "vertical",
          marginTop: 14,
        }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => onUpdate(lead.id, { notes: notesValue })}
          style={secondaryWideButton}
        >
          Salvar observações
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        {images.map((img) => (
          <img
            key={img.id}
            src={img.image_url}
            alt="Imóvel enviado"
            style={{
              width: 110,
              height: 80,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #ececec",
            }}
          />
        ))}
      </div>
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

const secondaryWideButton: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  color: "#222",
  border: "1px solid #ddd",
  borderRadius: 14,
  padding: "14px 16px",
  fontWeight: 700,
  cursor: "pointer",
};