
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

export default function App() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
                  R$ {p.nightly_rate} <span style={{ fontSize: 18, fontWeight: 400 }}>/ noite</span>
                </p>

                <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
                  <button
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
      </main>
    </div>
  )
}