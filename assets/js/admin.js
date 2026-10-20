
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = selector => document.querySelector(selector);

const form = $("#login-form");
const status = $("#status");

let currentUser = null;
let currentDraftId = null;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function showStatus(message) {
  if (status) status.textContent = message;
}

function renderEditor() {
  let panel = $("#admin-panel");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "admin-panel";
    document.querySelector("main").appendChild(panel);
  }

  panel.innerHTML = `
    <hr>
    <h2>Gerenciar notícias</h2>
    <p>Usuário: ${escapeHTML(currentUser.email || "")}</p>

    <button type="button" id="new-news">Nova notícia</button>
    <button type="button" id="show-drafts">Meus rascunhos</button>
    <button type="button" id="logout">Sair</button>

    <div id="editor">
      <h3 id="editor-title">Nova notícia</h3>

      <label for="news-title">Título</label>
      <input id="news-title" maxlength="200" required>

      <label for="news-category">Categoria</label>
      <input id="news-category" placeholder="Cidade, Polícia, Política...">

      <label for="news-summary">Resumo</label>
      <textarea id="news-summary" rows="3"></textarea>

      <label for="news-image">URL da imagem</label>
      <input id="news-image" type="url" placeholder="https://...">

      <label for="news-content">Texto da notícia</label>
      <textarea id="news-content" rows="12"></textarea>

      <button type="button" id="save-draft">Salvar rascunho</button>
      <button type="button" id="publish-news">Publicar notícia</button>
      <button type="button" id="cancel-edit">Limpar editor</button>
    </div>

    <div id="draft-list"></div>
  `;

  $("#new-news").addEventListener("click", clearEditor);
  $("#cancel-edit").addEventListener("click", clearEditor);
  $("#save-draft").addEventListener("click", saveDraft);
  $("#publish-news").addEventListener("click", publishNews);
  $("#show-drafts").addEventListener("click", loadDrafts);
  $("#logout").addEventListener("click", async () => {
    await signOut(auth);
    location.reload();
  });
}

function getNewsData() {
  return {
    title: $("#news-title").value.trim(),
    category: $("#news-category").value.trim() || "Geral",
    summary: $("#news-summary").value.trim(),
    imageUrl: $("#news-image").value.trim(),
    content: $("#news-content").value.trim()
  };
}

function validateNews(news) {
  if (!news.title) {
    showStatus("Informe o título da notícia.");
    return false;
  }

  if (!news.content) {
    showStatus("Informe o texto da notícia.");
    return false;
  }

  if (news.imageUrl) {
    try {
      const url = new URL(news.imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw Error();
    } catch {
      showStatus("Informe uma URL válida para a imagem.");
      return false;
    }
  }

  return true;
}

function clearEditor() {
  currentDraftId = null;

  $("#news-title").value = "";
  $("#news-category").value = "";
  $("#news-summary").value = "";
  $("#news-image").value = "";
  $("#news-content").value = "";
  $("#editor-title").textContent = "Nova notícia";

  showStatus("Editor pronto para uma nova notícia.");
}

async function saveDraft() {
  if (!currentUser) return;

  const news = getNewsData();
  if (!validateNews(news)) return;

  showStatus("Salvando rascunho...");

  try {
    const data = {
      ...news,
      authorId: currentUser.uid,
      authorEmail: currentUser.email || "",
      updatedAt: serverTimestamp()
    };

    if (currentDraftId) {
      await setDoc(
        doc(db, "rascunhos", currentDraftId),
        data,
        { merge: true }
      );
    } else {
      data.createdAt = serverTimestamp();
      const result = await addDoc(collection(db, "rascunhos"), data);
      currentDraftId = result.id;
    }

    showStatus("Rascunho salvo. A notícia NÃO foi publicada.");
    await loadDrafts();
  } catch (error) {
    console.error(error);
    showStatus(`Não foi possível salvar (${error.code || "erro"}). ${error.message || "Confira as regras e o projeto Firebase."}`);
  }
}

async function publishNews() {
  if (!currentUser) return;

  const news = getNewsData();
  if (!validateNews(news)) return;

  if (!confirm("Publicar esta notícia no portal?")) return;

  showStatus("Publicando notícia...");

  try {
    await addDoc(collection(db, "noticias"), {
      ...news,
      authorId: currentUser.uid,
      authorEmail: currentUser.email || "",
      createdAt: serverTimestamp(),
      publishedAt: serverTimestamp(),
      published: true
    });

    if (currentDraftId) {
      await deleteDoc(doc(db, "rascunhos", currentDraftId));
    }

    clearEditor();
    showStatus("Notícia publicada com sucesso.");
    await loadDrafts();
  } catch (error) {
    console.error(error);
    showStatus(`Falha ao publicar (${error.code || "erro"}). ${error.message || "Confira as regras e o projeto Firebase."}`);
  }
}

async function loadDrafts() {
  if (!currentUser) return;

  const list = $("#draft-list");
  list.innerHTML = "<p>Carregando rascunhos...</p>";

  try {
    const draftsQuery = query(
      collection(db, "rascunhos"),
      where("authorId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(draftsQuery);

    if (snapshot.empty) {
      list.innerHTML = "<h3>Meus rascunhos</h3><p>Nenhum rascunho salvo.</p>";
      return;
    }

    list.innerHTML = "<h3>Meus rascunhos</h3>";

    snapshot.forEach(item => {
      const data = item.data();
      const row = document.createElement("div");
      row.style.cssText =
        "padding:12px;margin:8px 0;border:1px solid #ddd;border-radius:6px";

      const title = document.createElement("strong");
      title.textContent = data.title || "Sem título";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Continuar edição";
      edit.addEventListener("click", () => {
        currentDraftId = item.id;
        $("#news-title").value = data.title || "";
        $("#news-category").value = data.category || "";
        $("#news-summary").value = data.summary || "";
        $("#news-image").value = data.imageUrl || "";
        $("#news-content").value = data.content || "";
        $("#editor-title").textContent = "Editando rascunho";
        showStatus("Rascunho carregado para edição.");
        $("#editor").scrollIntoView({ behavior: "smooth" });
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Excluir rascunho";
      remove.addEventListener("click", async () => {
        if (!confirm("Excluir este rascunho permanentemente?")) return;

        try {
          await deleteDoc(doc(db, "rascunhos", item.id));

          if (currentDraftId === item.id) clearEditor();

          showStatus("Rascunho excluído.");
          await loadDrafts();
        } catch (error) {
          console.error(error);
          showStatus("Não foi possível excluir o rascunho.");
        }
      });

      row.append(title, document.createElement("br"), edit, remove);
      list.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = "<p>Não foi possível carregar os rascunhos. Verifique as regras do Firestore.</p>";
  }
}

async function checkAdministrator(user) {
  const profile = await getDoc(doc(db, "admins", user.uid));

  if (!profile.exists() || profile.data().ativo !== true) {
    await signOut(auth);
    showStatus(
      "Seu usuário não está autorizado como administrador. Cadastre o perfil administrativo no Firestore."
    );
    return false;
  }

  return true;
}

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    showStatus("Verificando acesso...");

    try {
      await signInWithEmailAndPassword(
        auth,
        $("#email").value.trim(),
        $("#password").value
      );
    } catch (error) {
      console.error(error);
      showStatus("Login não realizado. Confira o e-mail e a senha.");
    }
  });
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    currentUser = null;
    if (form) form.hidden = false;

    const panel = $("#admin-panel");
    if (panel) panel.remove();
    return;
  }

  try {
    const allowed = await checkAdministrator(user);
    if (!allowed) return;

    currentUser = user;

    if (form) form.hidden = true;

    renderEditor();
    showStatus("Acesso administrativo autorizado.");
    await loadDrafts();
  } catch (error) {
    console.error(error);
    showStatus(`Não foi possível verificar o perfil administrativo (${error.code || "erro"}). Confirme se existe admins/${user.uid} com ativo=true no Firestore.`);
  }
});
