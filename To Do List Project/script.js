// Ambil elemen dari HTML
const addBtn = document.getElementById("addBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

addBtn.addEventListener("click", function () {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    alert("Tugas tidak boleh kosong!");
    return;
  }

  // Buat elemen list baru
  const li = document.createElement("li");

  // Buat span untuk teks tugas
  const taskSpan = document.createElement("span");
  taskSpan.textContent = taskText;

  // Buat wadah tombol
  const btnGroup = document.createElement("div");
  btnGroup.classList.add("btn-group");

  // Tombol complete
  const completeBtn = document.createElement("button");
  completeBtn.textContent = "✔";
  completeBtn.classList.add("complete");
  completeBtn.addEventListener("click", function () {
    taskSpan.classList.toggle("completed");
  });

  // Tombol edit
  const editBtn = document.createElement("button");
  editBtn.textContent = "✎";
  editBtn.classList.add("edit");
  editBtn.addEventListener("click", function () {
    // Buat input untuk edit
    const inputEdit = document.createElement("input");
    inputEdit.type = "text";
    inputEdit.value = taskSpan.textContent;
    inputEdit.classList.add("edit-input");

    // Ganti teks dengan input
    li.replaceChild(inputEdit, taskSpan);
    inputEdit.focus();

    // Saat enter atau blur, simpan teks baru
    inputEdit.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        saveEdit();
      }
    });

    inputEdit.addEventListener("blur", saveEdit);

    function saveEdit() {
      taskSpan.textContent = inputEdit.value.trim() || taskSpan.textContent;
      li.replaceChild(taskSpan, inputEdit);
    }
  });

  // Tombol delete
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "✖";
  deleteBtn.classList.add("delete");
  deleteBtn.addEventListener("click", function () {
    li.remove();
  });

  // Masukkan tombol ke dalam btnGroup
  btnGroup.appendChild(completeBtn);
  btnGroup.appendChild(editBtn);
  btnGroup.appendChild(deleteBtn);

  // Susun li: teks + tombol
  li.appendChild(taskSpan);
  li.appendChild(btnGroup);

  // Masukkan li ke ul
  taskList.appendChild(li);

  // Kosongkan input
  taskInput.value = "";
});
