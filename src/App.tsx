 import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

type Property = {
  id: string
  title: string
  region: string
  address: string
  nightly_rate: number
  image_url?: string | null
  description?: string | null
}

type ViewMode = "list" | "details"

export default function App() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>("list")
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (!error) {
      setProperties((data as Property[]) || [])
    }

    setLoading(false)
  }

  function openDetails(property: Property) {
    setSelectedProperty(property)
    setView("details")
    setSuccessMessage("")
  }

  function goBack() {
    setView("list")
    setSelectedProperty(null)
    setSuccessMessage("")
  }

  async function handleReserve() {
    if (!selectedProperty) return

    if (!guestName || !guestEmail || !checkIn || !checkOut) {
      alert("Preencha nome, e-mail, check-in e check-out.")
      return
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    const totalAmount = selectedProperty.nightly_rate * nights

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
    ])

    if (error) {
      alert("Erro ao criar reserva.")
      return
    }

    setSuccessMessage("Reserva enviada com sucesso.")
    setGuestName("")
    setGuestEmail("")
    setGuestPhone("")
    setCheckIn("")
    setCheckOut("")
    setGuests(1)
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
          }}
        >
          <div
            onClick={goBack}
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
                Flats em Brasília
              </p>
            </div>
          </div>

          <button
            style={{
              background: "#ff385c",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "12px 20px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cadastre seu flat
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
        {view === "list" && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: 0, fontSize: 30, color: "#111" }}>
                Flats disponíveis
              </h2>
              <p style={{ marginTop: 8, color: "#666", fontSize: 18 }}>
                Hospedagens selecionadas para curta temporada em Brasília
              </p>
            </div>

            {loading && <p>Carregando imóveis...</p>}

            {!loading && properties.length === 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 30,
                  border: "1px solid #ececec",
                }}
              >
                Nenhum imóvel cadastrado ainda.
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {properties.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#fff",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "1px solid #ececec",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      height: 220,
                      background: "#ddd",
                      overflow: "hidden",
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

                  <div style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 28,
                            color: "#222",
                          }}
                        >
                          {p.title}
                        </h3>
                        <p
                          style={{
                            margin: "8px 0 0",
                            color: "#666",
                            fontSize: 16,
                          }}
                        >
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

                    <p
                      style={{
                        margin: "14px 0 0",
                        color: "#666",
                        fontSize: 17,
                      }}
                    >
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
                      <span style={{ fontSize: 18, fontWeight: 400 }}>
                        / noite
                      </span>
                    </p>

                    <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                      <button
                        onClick={() => openDetails(p)}
                        style={{
                          flex: 1,
                          background: "#ff385c",
                          color: "#fff",
                          border: "none",
                          borderRadius: 14,
                          padding: "14px 16px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Reservar
                      </button>

                      <button
                        onClick={() => openDetails(p)}
                        style={{
                          flex: 1,
                          background: "#fff",
                          color: "#222",
                          border: "1px solid #ddd",
                          borderRadius: 14,
                          padding: "14px 16px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Ver detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <button
                onClick={goBack}
                style={{
                  marginBottom: 20,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ← Voltar
              </button>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "1px solid #ececec",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ height: 360, background: "#ddd" }}>
                  {selectedProperty.image_url ? (
                    <img
                      src={selectedProperty.image_url}
                      alt={selectedProperty.title}
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
                        fontSize: 70,
                      }}
                    >
                      🏢
                    </div>
                  )}
                </div>

                <div style={{ padding: 24 }}>
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
                    <span style={{ fontSize: 20, fontWeight: 400 }}>
                      / noite
                    </span>
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
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  border: "1px solid #ececec",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  padding: 24,
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
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nome completo"
                    style={inputStyle}
                  />

                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="E-mail"
                    style={inputStyle}
                  />

                  <input
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="Telefone / WhatsApp"
                    style={inputStyle}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    placeholder="Hóspedes"
                    style={inputStyle}
                  />

                  <button
                    onClick={handleReserve}
                    style={{
                      marginTop: 8,
                      background: "#ff385c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 14,
                      padding: "16px 18px",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                    }}
                  >
                    Enviar reserva
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #ddd",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
}