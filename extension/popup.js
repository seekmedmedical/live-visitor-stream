async function render() {
  const { data, error } = await chrome.storage.local.get(["data", "error"]);
  const count = document.getElementById("count");
  const list = document.getElementById("pages");
  const warn = document.getElementById("warn");
  const time = document.getElementById("time");

  if (error || !data) {
    count.textContent = "—";
    list.innerHTML = "";
    warn.hidden = false;
    warn.textContent = error
      ? "Não consegui buscar os dados agora."
      : "Carregando…";
    return;
  }

  count.textContent = (data.activeUsers || 0).toLocaleString("pt-BR");
  const pages = (data.pages || []).slice(0, 8);
  const max = Math.max(1, ...pages.map((p) => p.users));
  list.innerHTML =
    pages
      .map(
        (p) => `<li>
          <div class="row"><span class="path">${p.path}</span><span class="num">${p.users}</span></div>
          <div class="bar"><i style="width:${Math.round((p.users / max) * 100)}%"></i></div>
        </li>`,
      )
      .join("") ||
    `<li><div class="row"><span class="path">Ninguém navegando agora.</span></div></li>`;

  warn.hidden = !data.demo;
  if (data.demo) warn.textContent = "Dados de exemplo — falta conectar a chave do Analytics.";
  time.textContent = data.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("pt-BR")
    : "—";
}

document.getElementById("reload").addEventListener("click", async () => {
  await chrome.runtime.sendMessage("refresh");
  render();
});

chrome.runtime.sendMessage("refresh").then(render).catch(render);
render();
