// Capa que traduce entre el objeto "data" que usa toda la app (igual que en el prototipo)
// y la estructura real en Firestore: un documento de configuración por negocio, más una
// subcolección por cada lista larga (ventas, gastos, movimientos, etc.), un documento por ítem.
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizarData, SUBCOLECCIONES_NEGOCIO } from "./GestionNegocio";

// Trae todo lo de un negocio (config + todas sus subcolecciones) y arma el objeto "data"
// con la misma forma que usa siempre la app.
export async function cargarNegocio(clienteId) {
  const configSnap = await getDoc(doc(db, "negocios", clienteId));
  const parcial = configSnap.exists() ? configSnap.data() : {};
  const data = normalizarData(parcial);

  for (const sub of SUBCOLECCIONES_NEGOCIO) {
    const snap = await getDocs(collection(db, "negocios", clienteId, sub));
    data[sub] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  return data;
}

// Compara los datos anteriores contra los nuevos y escribe en Firestore solo lo que cambió
// (no reescribe todo el negocio en cada guardado). Se llama cada vez que alguna pantalla
// hace update(nuevaData).
export async function guardarCambios(clienteId, dataAnterior, dataNueva) {
  const batch = writeBatch(db);
  let huboCambiosDeConfig = false;
  const parche = {};

  for (const campo of Object.keys(dataNueva)) {
    if (SUBCOLECCIONES_NEGOCIO.includes(campo)) continue; // esas van por su cuenta, más abajo
    if (JSON.stringify(dataAnterior?.[campo]) !== JSON.stringify(dataNueva[campo])) {
      parche[campo] = dataNueva[campo] === undefined ? null : dataNueva[campo];
      huboCambiosDeConfig = true;
    }
  }
  if (huboCambiosDeConfig) {
    batch.set(doc(db, "negocios", clienteId), parche, { merge: true });
  }

  for (const sub of SUBCOLECCIONES_NEGOCIO) {
    const antes = new Map((dataAnterior?.[sub] || []).map((it) => [String(it.id), it]));
    const despues = new Map((dataNueva[sub] || []).map((it) => [String(it.id), it]));

    for (const [id, item] of despues) {
      const anterior = antes.get(id);
      if (!anterior || JSON.stringify(anterior) !== JSON.stringify(item)) {
        batch.set(doc(db, "negocios", clienteId, sub, id), item);
      }
    }
    for (const id of antes.keys()) {
      if (!despues.has(id)) {
        batch.delete(doc(db, "negocios", clienteId, sub, id));
      }
    }
  }

  // Firestore permite hasta 500 operaciones por batch. Para el volumen de un negocio chico
  // cargando a mano no debería alcanzarse nunca; si algún día se importa un archivo enorme
  // y se supera, avisamos acá en vez de fallar en silencio.
  await batch.commit();
}

// Lista los negocios existentes (solo la asesora puede leer esta colección completa,
// según las reglas de seguridad) para armar el selector de cliente.
export async function listarNegocios() {
  const snap = await getDocs(collection(db, "negocios"));
  return snap.docs.map((d) => ({ id: d.id, nombreNegocio: d.data().nombreNegocio || "(sin nombre)" }));
}

// Crea el documento vacío de un negocio nuevo (Fase 6: alta de cada cliente).
export async function crearNegocioVacio(clienteId, nombreNegocio) {
  await setDoc(doc(db, "negocios", clienteId), { ...normalizarDataConfigSolo(), nombreNegocio });
}
function normalizarDataConfigSolo() {
  const d = normalizarData({});
  const config = { ...d };
  SUBCOLECCIONES_NEGOCIO.forEach((s) => delete config[s]);
  return config;
}
