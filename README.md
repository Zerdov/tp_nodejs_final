# Project

## Backlog

- connexion
- consulter fichier ?
- ajouter fichier ✅
- supprimer fichier
- ouvrir un dossier
- ajouter un dossier
- supprimer un dossier
- partager un dossier
- notifier en cas de partage
- notifier en cas de création
- notifier en cas de suppression
- gestion de droits

```ts
function updateFileList(files) {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  files.forEach(file => {
    const li = document.createElement("li");

    // Nom du fichier
    const span = document.createElement("span");
    span.textContent = file;

    // Bouton de suppression
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Supprimer";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.onclick = () => {
      ws.send(JSON.stringify({
        type: "delete",
        filename: file
      }));
    };

    li.appendChild(span);
    li.appendChild(deleteBtn);
    fileList.appendChild(li);
  });
}

```