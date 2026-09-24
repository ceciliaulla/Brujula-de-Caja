import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { cargarNegocio, guardarCambios, listarNegocios } from "./firestoreSync";
import { Negocio, ErrorBoundary } from "./GestionNegocio";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Usuario o contraseña incorrectos.");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif", background: "#EEEBF3", padding: 16, boxSizing: "border-box" }}>
      <form onSubmit={entrar} style={{ background: "#fff", padding: 32, borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", width: "100%", maxWidth: 320, boxSizing: "border-box" }}>
        <h2 style={{ marginTop: 0, color: "#2E293B" }}>Ingresar</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 9, marginBottom: 10, borderRadius: 6, border: "1px solid #DCD5E6", boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 9, marginBottom: 10, borderRadius: 6, border: "1px solid #DCD5E6", boxSizing: "border-box" }}
        />
        {error && <div style={{ color: "#9C3B6B", fontSize: 13, marginBottom: 10 }}>{error}</div>}
        <button
          type="submit"
          style={{ width: "100%", padding: 10, background: "#4A3F66", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

function SelectorCliente({ negocios, onElegir, onCerrarSesion }) {
  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif", color: "#2E293B", padding: "0 16px", boxSizing: "border-box" }}>
      <h2>Elegí un cliente</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {negocios.map((n) => (
          <button
            key={n.id}
            onClick={() => onElegir(n.id)}
            style={{ padding: 12, textAlign: "left", borderRadius: 8, border: "1px solid #DCD5E6", cursor: "pointer", background: "#fff", fontSize: 14 }}
          >
            {n.nombreNegocio}
          </button>
        ))}
        {negocios.length === 0 && <div style={{ color: "#726C82" }}>Todavía no hay ningún negocio cargado en Firestore.</div>}
      </div>
      <button onClick={onCerrarSesion} style={{ marginTop: 24, background: "transparent", border: "none", color: "#726C82", cursor: "pointer", fontSize: 13 }}>
        Cerrar sesión
      </button>
    </div>
  );
}

function CargandoNegocio({ clienteId, esAsesora, onCambiarCliente, onCerrarSesion }) {
  const [data, setData] = useState(null);
  const dataRef = useRef(null);

  useEffect(() => {
    let activo = true;
    setData(null);
    cargarNegocio(clienteId).then((d) => {
      if (activo) {
        setData(d);
        dataRef.current = d;
      }
    });
    return () => {
      activo = false;
    };
  }, [clienteId]);

  function update(nuevaData) {
    const anterior = dataRef.current;
    setData(nuevaData);
    dataRef.current = nuevaData;
    guardarCambios(clienteId, anterior, nuevaData).catch((err) => {
      console.error("No se pudo guardar en Firestore", err);
      window.alert("No se pudo guardar el último cambio. Revisá tu conexión a internet e intentá de nuevo.");
    });
  }

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#726C82" }}>
        Cargando...
      </div>
    );
  }

  const cabecera = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginBottom: 10, fontSize: 13 }}>
      {esAsesora && (
        <button onClick={onCambiarCliente} style={{ background: "none", border: "none", color: "#4A3F66", cursor: "pointer", fontSize: 13 }}>
          Cambiar de cliente
        </button>
      )}
      <button onClick={onCerrarSesion} style={{ background: "none", border: "none", color: "#726C82", cursor: "pointer", fontSize: 13 }}>
        Cerrar sesión
      </button>
    </div>
  );

  return <Negocio data={data} update={update} cabecera={cabecera} esAsesora={esAsesora} />;
}

export default function AppRoot() {
  const [usuario, setUsuario] = useState(undefined); // undefined = todavía no se sabe si hay sesión
  const [esAsesora, setEsAsesora] = useState(false);
  const [negocios, setNegocios] = useState(null);
  const [clienteId, setClienteId] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUsuario(u);
      setClienteId(null);
      setNegocios(null);
      if (u) {
        const rolSnap = await getDoc(doc(db, "roles", u.uid));
        const asesora = rolSnap.exists() && rolSnap.data().rol === "asesora";
        setEsAsesora(asesora);
        if (!asesora) setClienteId(u.uid); // un cliente entra directo a su propio negocio
      }
    });
  }, []);

  useEffect(() => {
    if (usuario && esAsesora && !clienteId) {
      listarNegocios().then(setNegocios);
    }
  }, [usuario, esAsesora, clienteId]);

  if (usuario === undefined) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Cargando...</div>;
  }
  if (!usuario) {
    return <Login />;
  }
  if (esAsesora && !clienteId) {
    return <SelectorCliente negocios={negocios || []} onElegir={setClienteId} onCerrarSesion={() => signOut(auth)} />;
  }
  return (
    <ErrorBoundary>
      <CargandoNegocio
        clienteId={clienteId}
        esAsesora={esAsesora}
        onCambiarCliente={() => setClienteId(null)}
        onCerrarSesion={() => signOut(auth)}
      />
    </ErrorBoundary>
  );
}
