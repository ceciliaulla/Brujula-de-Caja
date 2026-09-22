// Conexión a Firebase (proyecto "brujula-de-caja").
// Estas claves no son secretas: están hechas para viajar dentro del código de la app.
// La seguridad real la dan el login (Authentication) y las reglas de Firestore (firestore.rules),
// no esta configuración.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcxBIFUR95vm3xOtgy1Be8-RQPyslfvcA",
  authDomain: "brujula-de-caja.firebaseapp.com",
  projectId: "brujula-de-caja",
  storageBucket: "brujula-de-caja.firebasestorage.app",
  messagingSenderId: "777987549210",
  appId: "1:777987549210:web:e80b1492d395e40505c9a3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// ignoreUndefinedProperties: campos como "clienteId" quedan en undefined cuando una venta
// no tiene cliente asociado (una venta de mostrador común). Esta opción hace que Firestore
// simplemente no guarde esos campos, en vez de rechazar todo el guardado — el mismo
// comportamiento que tenía el prototipo con window.storage.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
