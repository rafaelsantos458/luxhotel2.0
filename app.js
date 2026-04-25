import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI",
  projectId: "COLE_AQUI",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.salvar = async function () {
  const nome = document.getElementById("nome").value;
  const quarto = document.getElementById("quarto").value;

  await addDoc(collection(db, "clientes"), {
    nome,
    quarto
  });

  alert("Salvo!");
};
