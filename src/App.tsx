import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"

export default function App() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    const { data } = await supabase.from("properties").select("*")
    setProperties(data || [])
    setLoading(false)
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🏠 Hospede-se Já</h1>
      <h2>Flats disponíveis</h2>

      {loading && <p>Carregando...</p>}

      {!loading && properties.length === 0 && (
        <p>Nenhum imóvel cadastrado ainda</p>
      )}

      {properties.map((p) => (
        <div key={p.id} style={{ marginTop: 20 }}>
          <h3>{p.title}</h3>
          <p>{p.address}</p>
          <p>R$ {p.nightly_rate} / noite</p>
        </div>
      ))}
    </div>
  )
}

