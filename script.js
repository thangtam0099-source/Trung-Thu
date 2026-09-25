/* global supabase, QRCode */

const cfg = window.APP_CONFIG || {};
const hasSupabaseConfig =
  cfg.SUPABASE_URL &&
  cfg.SUPABASE_ANON_KEY &&
  !cfg.SUPABASE_URL.includes("YOUR_") &&
  !cfg.SUPABASE_ANON_KEY.includes("YOUR_");

const sb = hasSupabaseConfig
  ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;

const BUCKET = cfg.STORAGE_BUCKET || "card-images";
const app = document.getElementById("app");

const state = {
  images: [],
  subMessages: [
    "Trung thu vui vẻ",
    "Trung thu ấm áp",
    "Trung thu an lành nhé"
  ]
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCardIdFromPath() {
  const parts = location.pathname.split("/").filter(Boolean);
  const index = parts.findIndex(x => x.toLowerCase() === "card");
  return index >= 0 ? parts[index + 1] : null;
}

function normalizeHex(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#ff72b5";
}

function hexToRgba(hex, alpha) {
  const h = normalizeHex(hex).slice(1);
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderCreatePage() {
  app.innerHTML = `
    <main class="create-page">
      <div class="create-shell">
        <header class="brand">
          <div class="moon"></div>
          <h1>🎑 Tạo thiệp Trung Thu</h1>
          <p>Tạo một bầu trời Trung Thu chứa đầy lời chúc và kỷ niệm.</p>
        </header>

        <section class="form-card">
          <div class="grid">
            <div class="field">
              <label for="recipient">Tên người nhận *</label>
              <input id="recipient" maxlength="80" placeholder="Ví dụ: Đô" />
            </div>

            <div class="field">
              <label for="sender">Tên người gửi</label>
              <input id="sender" maxlength="80" placeholder="Ví dụ: Tâm" />
            </div>

            <div class="field full">
              <label for="mainMessage">Lời chúc chính *</label>
              <textarea id="mainMessage" maxlength="300" placeholder="Chúc Đô là một mùa Trung thu đáng nhớ"></textarea>
            </div>

            <div class="field full">
              <label>Lời chúc phụ</label>
              <div id="subMessages"></div>
              <button class="add-message" id="addMessage" type="button">＋ Thêm lời chúc</button>
            </div>

            <div class="field full">
              <label>Ảnh kỷ niệm</label>
              <div class="upload-zone" id="uploadZone">
                <input id="imageInput" type="file" accept="image/*" multiple />
                <label for="imageInput" class="upload-btn">📷 Chọn nhiều ảnh</label>
                <div class="hint" style="margin-top:8px">Nên chọn 3–12 ảnh. Ảnh sẽ được lưu trên Supabase Storage.</div>
                <div class="preview-images" id="previewImages"></div>
              </div>
            </div>

            <div class="field">
              <label>Màu chủ đạo</label>
              <div class="color-row">
                <input id="primaryColor" type="color" value="#ff72b5" />
                <span class="hint">Màu glow của chữ và hiệu ứng.</span>
              </div>
            </div>

            <div class="field">
              <label>Theme</label>
              <div class="chips" id="themes">
                <button type="button" class="chip active" data-theme="pink">Hồng</button>
                <button type="button" class="chip" data-theme="gold">Vàng</button>
                <button type="button" class="chip" data-theme="blue">Xanh</button>
                <button type="button" class="chip" data-theme="purple">Tím</button>
              </div>
            </div>

            <div class="field full">
              <label>Cài đặt hiệu ứng</label>

              <div class="switch-row">
                <span>✨ Ngôi sao lấp lánh</span>
                <label class="switch">
                  <input id="stars" type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="switch-row">
                <span>🏮 Đèn trời</span>
                <label class="switch">
                  <input id="lanterns" type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="switch-row">
                <span>💫 Hiệu ứng chuyển động</span>
                <label class="switch">
                  <input id="motion" type="checkbox" checked>
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <div class="field">
              <label for="musicUrl">Nhạc nền (URL MP3, tùy chọn)</label>
              <input id="musicUrl" type="url" placeholder="https://.../nhac.mp3" />
              <div class="hint">Trình duyệt thường yêu cầu người xem chạm màn hình trước khi phát nhạc.</div>
            </div>

            <div class="field">
              <label for="speed">Tốc độ hiệu ứng</label>
              <select id="speed">
                <option value="slow">Chậm</option>
                <option value="normal" selected>Bình thường</option>
                <option value="fast">Nhanh</option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="primary" id="createCard">💌 Tạo thiệp & tạo QR</button>
          </div>
          <div class="status" id="status"></div>
        </section>
      </div>
    </main>
  `;

  renderSubMessages();
  bindCreateEvents();
}

function renderSubMessages() {
  const box = document.getElementById("subMessages");
  if (!box) return;

  box.innerHTML = state.subMessages.map((msg, i) => `
    <div class="sub-message-row">
      <input class="sub-input" data-index="${i}" maxlength="100" value="${escapeHtml(msg)}" placeholder="Lời chúc ${i + 1}" />
      <button type="button" class="small-danger" data-remove-message="${i}">×</button>
    </div>
  `).join("");

  box.querySelectorAll(".sub-input").forEach(input => {
    input.addEventListener("input", e => {
      state.subMessages[Number(e.target.dataset.index)] = e.target.value;
    });
  });

  box.querySelectorAll("[data-remove-message]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.subMessages.splice(Number(btn.dataset.removeMessage), 1);
      renderSubMessages();
    });
  });
}

function bindCreateEvents() {
  const add = document.getElementById("addMessage");
  add.addEventListener("click", () => {
    if (state.subMessages.length >= 12) return;
    state.subMessages.push("");
    renderSubMessages();
  });

  const themes = document.querySelectorAll("#themes .chip");
  themes.forEach(btn => {
    btn.addEventListener("click", () => {
      themes.forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  const input = document.getElementById("imageInput");
  input.addEventListener("change", e => addFiles([...e.target.files]));

  const zone = document.getElementById("uploadZone");
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    addFiles([...e.dataTransfer.files].filter(f => f.type.startsWith("image/")));
  });

  document.getElementById("createCard").addEventListener("click", createCard);
}

function addFiles(files) {
  const max = 15;
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (state.images.length >= max) break;
    if (file.size > 8 * 1024 * 1024) {
      setStatus(`Ảnh "${file.name}" lớn hơn 8 MB và đã được bỏ qua.`);
      continue;
    }
    state.images.push(file);
  }
  renderImagePreviews();
}

function renderImagePreviews() {
  const box = document.getElementById("previewImages");
  if (!box) return;

  box.innerHTML = state.images.map((file, i) => {
    const url = URL.createObjectURL(file);
    return `
      <div class="preview-item">
        <img src="${url}" alt="">
        <button type="button" class="remove-image" data-remove-image="${i}">×</button>
      </div>
    `;
  }).join("");

  box.querySelectorAll("[data-remove-image]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.images.splice(Number(btn.dataset.removeImage), 1);
      renderImagePreviews();
    });
  });
}

function setStatus(text) {
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function getFormData() {
  const theme = document.querySelector("#themes .chip.active")?.dataset.theme || "pink";
  return {
    recipient_name: document.getElementById("recipient").value.trim(),
    sender_name: document.getElementById("sender").value.trim(),
    main_message: document.getElementById("mainMessage").value.trim(),
    sub_messages: state.subMessages.map(x => x.trim()).filter(Boolean),
    theme,
    primary_color: normalizeHex(document.getElementById("primaryColor").value),
    music_url: document.getElementById("musicUrl").value.trim(),
    effects: {
      stars: document.getElementById("stars").checked,
      lanterns: document.getElementById("lanterns").checked,
      motion: document.getElementById("motion").checked,
      speed: document.getElementById("speed").value
    }
  };
}

async function uploadImages(cardId) {
  if (!sb || state.images.length === 0) return [];

  const urls = [];

  for (let i = 0; i < state.images.length; i++) {
    const file = state.images[i];
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ext || "jpg";
    const path = `cards/${cardId}/${crypto.randomUUID()}.${safeExt}`;

    const { error } = await sb.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
    setStatus(`Đang tải ảnh ${i + 1}/${state.images.length}...`);
  }

  return urls;
}

async function createCard() {
  const button = document.getElementById("createCard");
  const data = getFormData();

  if (!data.recipient_name) {
    setStatus("Vui lòng nhập tên người nhận.");
    document.getElementById("recipient").focus();
    return;
  }

  if (!data.main_message) {
    setStatus("Vui lòng nhập lời chúc chính.");
    document.getElementById("mainMessage").focus();
    return;
  }

  if (!sb) {
    setStatus("Bạn chưa cấu hình Supabase. Hãy mở config.js và điền SUPABASE_URL + SUPABASE_ANON_KEY.");
    return;
  }

  button.disabled = true;
  button.textContent = "⏳ Đang tạo thiệp...";

  try {
    // ID mới cho MỖI thiệp. Không dùng latest/current nên QR cũ không bị ghi đè.
    const cardId = crypto.randomUUID();

    const imageUrls = await uploadImages(cardId);

    const payload = {
      id: cardId,
      recipient_name: data.recipient_name,
      sender_name: data.sender_name,
      main_message: data.main_message,
      sub_messages: data.sub_messages,
      images: imageUrls,
      theme: data.theme,
      primary_color: data.primary_color,
      music_url: data.music_url || null,
      effects: data.effects
    };

    setStatus("Đang lưu thiệp...");

    const { error } = await sb.from("cards").insert(payload);
    if (error) throw error;

    const url = new URL(`/card/${cardId}`, location.origin).href;
    sessionStorage.setItem("lastCardUrl", url);

    showQrModal(url, true);
  } catch (error) {
    console.error(error);
    setStatus(`Không thể tạo thiệp: ${error.message || "Lỗi không xác định"}`);
  } finally {
    button.disabled = false;
    button.textContent = "💌 Tạo thiệp & tạo QR";
  }
}

function showQrModal(url, canOpen = true) {
  const old = document.querySelector(".qr-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.className = "qr-modal";
  modal.innerHTML = `
    <div class="qr-box">
      <h2>🎉 Thiệp đã được tạo!</h2>
      <p>QR này trỏ đến một ID riêng. Khi bạn tạo thiệp khác, QR này vẫn giữ nguyên.</p>
      <div id="qrcode"></div>
      <div class="qr-url">${escapeHtml(url)}</div>
      <div class="qr-actions">
        <button id="downloadQr">📥 Tải QR</button>
        <button id="copyLink">📋 Sao chép link</button>
        ${canOpen ? '<button id="openCard">💌 Mở thiệp</button>' : ""}
        <button class="close" id="closeQr">Đóng</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const qrEl = modal.querySelector("#qrcode");
  new QRCode(qrEl, {
    text: url,
    width: 230,
    height: 230,
    correctLevel: QRCode.CorrectLevel.H
  });

  modal.querySelector("#copyLink").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      modal.querySelector("#copyLink").textContent = "✓ Đã sao chép";
    } catch {
      window.prompt("Sao chép liên kết:", url);
    }
  });

  modal.querySelector("#downloadQr").addEventListener("click", () => {
    const img = qrEl.querySelector("img");
    if (!img) return;

    const a = document.createElement("a");
    a.href = img.src;
    a.download = `thiep-trung-thu-${url.split("/").pop()}.png`;
    a.click();
  });

  if (canOpen) {
    modal.querySelector("#openCard").addEventListener("click", () => {
      location.href = url;
    });
  }

  modal.querySelector("#closeQr").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

async function fetchCard(cardId) {
  if (!sb) throw new Error("Supabase chưa được cấu hình.");

  const { data, error } = await sb
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function showLoading() {
  app.innerHTML = `
    <div class="loading">
      <div class="loading-box">
        <div class="spinner"></div>
        <div>Đang mở thiệp... ✨</div>
      </div>
    </div>
  `;
}

function showError(message) {
  app.innerHTML = `
    <main class="error-page">
      <section class="error-card">
        <div style="font-size:52px">💌</div>
        <h1>Không tìm thấy thiệp</h1>
        <p>${escapeHtml(message)}</p>
        <button onclick="location.href='/'">＋ Tạo thiệp mới</button>
      </section>
    </main>
  `;
}

function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function() {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) / 4294967296);
  };
}

function addStars(stage, random, enabled) {
  if (!enabled) return;

  for (let i = 0; i < 115; i++) {
    const s = document.createElement("span");
    s.className = "star" + (random() > .9 ? " big" : "");
    s.style.left = `${random() * 100}%`;
    s.style.top = `${random() * 100}%`;
    s.style.setProperty("--duration", `${1.5 + random() * 4}s`);
    s.style.animationDelay = `${-random() * 4}s`;
    stage.appendChild(s);
  }
}

function addLanterns(stage, random, enabled) {
  if (!enabled) return;

  const positions = [
    [7, 24], [78, 40], [39, 73], [86, 78], [25, 54]
  ];

  positions.forEach(([x,y], i) => {
    const el = document.createElement("div");
    el.className = "lantern";
    el.style.left = `${x + (random() * 6 - 3)}%`;
    el.style.top = `${y + (random() * 6 - 3)}%`;
    el.style.animationDelay = `${-random() * 4}s`;
    el.style.transform = `scale(${.7 + random() * .6})`;
    stage.appendChild(el);
  });

  const shoot = document.createElement("div");
  shoot.className = "shooting-star";
  shoot.style.left = `${55 + random()*25}%`;
  shoot.style.top = `${10 + random()*30}%`;
  stage.appendChild(shoot);
}

function placeText(stage, text, random, main, index, color) {
  const el = document.createElement("div");
  el.className = `floating-text${main ? " main" : ""}`;
  el.textContent = text;

  let left, top;
  if (main) {
    left = 50;
    top = 45 + (random() * 8 - 4);
  } else {
    left = 7 + random() * 86;
    top = 12 + random() * 77;
  }

  el.style.left = `${left}%`;
  el.style.top = `${top}%`;
  el.style.transform = `translate(-50%, -50%) rotate(${random()*8 - 4}deg)`;
  el.style.setProperty("--rot", `${random()*8 - 4}deg`);
  el.style.setProperty("--td", `${5 + random()*5}s`);
  el.style.color = color;
  stage.appendChild(el);
}

function placePhotos(stage, urls, random, motion) {
  urls.slice(0, 15).forEach((url, i) => {
    const img = document.createElement("img");
    img.className = "card-photo";
    img.src = url;
    img.alt = "Ảnh kỷ niệm";
    img.loading = "eager";

    const width = 12 + random() * 18;
    const left = 3 + random() * (94 - width);
    const top = 12 + random() * 75;

    img.style.width = `${width}vw`;
    img.style.height = `${Math.max(12, width * .78)}vw`;
    img.style.maxHeight = "28vh";
    img.style.left = `${left}%`;
    img.style.top = `${top}%`;
    img.style.setProperty("--rot", `${random()*10 - 5}deg`);
    img.style.setProperty("--pd", `${6 + random()*5}s`);
    img.style.animationPlayState = motion ? "running" : "paused";

    stage.appendChild(img);
  });
}

function renderCard(card) {
  const color = normalizeHex(card.primary_color);
  const effects = card.effects || {};
  const random = seededRandom(card.id);

  app.innerHTML = `
    <main class="card-page">
      <div class="card-stage theme-${escapeHtml(card.theme || "pink")}" style="--theme:${color}; --theme-soft:${hexToRgba(color, .9)}">
        <div class="space-bg"></div>
        <div class="moon"></div>

        <div class="card-toolbar">
          <button class="tool-btn" id="backEdit">← Tạo mới</button>
          <button class="tool-btn" id="musicButton">🔇 Nhạc</button>
          <button class="tool-btn" id="qrButton">▦ QR</button>
        </div>

        <div id="visualLayer"></div>

        <div class="card-footer">
          <button class="tool-btn" id="shareButton">📤 Chia sẻ</button>
        </div>

        <audio id="bgMusic" loop preload="none" src="${escapeHtml(card.music_url || "")}"></audio>
      </div>
    </main>
  `;

  const stage = document.querySelector(".card-stage");
  const layer = document.getElementById("visualLayer");
  const motion = effects.motion !== false;
  const speed = effects.speed || "normal";

  if (effects.stars !== false) addStars(layer, random, true);
  if (effects.lanterns !== false) addLanterns(layer, random, true);

  // Bunny
  const bunny = document.createElement("div");
  bunny.className = "bunny";
  bunny.textContent = "🐇";
  bunny.style.left = `${random()*22 + 3}%`;
  bunny.style.top = `${random()*25 + 58}%`;
  bunny.style.animationPlayState = motion ? "running" : "paused";
  layer.appendChild(bunny);

  placePhotos(layer, Array.isArray(card.images) ? card.images : [], random, motion);

  const subMessages = Array.isArray(card.sub_messages) ? card.sub_messages : [];
  subMessages.slice(0, 12).forEach((msg, i) => {
    if (!msg) return;
    placeText(layer, msg, random, false, i, color);
  });

  placeText(
    layer,
    card.main_message || `Chúc ${card.recipient_name || ""} một mùa Trung thu đáng nhớ`,
    random,
    true,
    0,
    color
  );

  // Sender line
  if (card.sender_name) {
    const sender = document.createElement("div");
    sender.className = "floating-text";
    sender.textContent = `— ${card.sender_name} gửi ${card.recipient_name || ""} —`;
    sender.style.left = "50%";
    sender.style.top = "58%";
    sender.style.fontSize = "clamp(11px, 2.5vw, 18px)";
    sender.style.setProperty("--rot", "0deg");
    sender.style.setProperty("--td", "6s");
    layer.appendChild(sender);
  }

  const multiplier = speed === "slow" ? 1.45 : speed === "fast" ? .65 : 1;
  document.querySelectorAll(".floating-text, .card-photo, .lantern, .bunny").forEach(el => {
    const current = getComputedStyle(el).animationDuration;
    if (current && current !== "0s") {
      const seconds = parseFloat(current);
      if (!Number.isNaN(seconds)) el.style.animationDuration = `${seconds * multiplier}s`;
    }
  });

  const audio = document.getElementById("bgMusic");
  const musicButton = document.getElementById("musicButton");

  if (!card.music_url) {
    musicButton.disabled = true;
    musicButton.textContent = "♪ Không nhạc";
  } else {
    musicButton.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
          musicButton.textContent = "🔊 Nhạc";
        } catch {
          musicButton.textContent = "▶ Chạm để phát";
        }
      } else {
        audio.pause();
        musicButton.textContent = "🔇 Nhạc";
      }
    });
  }

  document.getElementById("backEdit").addEventListener("click", () => {
    location.href = "/";
  });

  document.getElementById("qrButton").addEventListener("click", () => {
    showQrModal(location.href, false);
  });

  document.getElementById("shareButton").addEventListener("click", async () => {
    const shareData = {
      title: "Thiệp Trung Thu 💌",
      text: `Bạn nhận được một tấm thiệp Trung Thu${card.recipient_name ? ` gửi ${card.recipient_name}` : ""}!`,
      url: location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(location.href);
        alert("Đã sao chép liên kết thiệp.");
      } catch {
        window.prompt("Sao chép liên kết:", location.href);
      }
    }
  });

  // Cho phép người xem chạm màn hình để bắt đầu nhạc nếu có.
  if (card.music_url) {
    const startMusicOnce = async () => {
      try {
        await audio.play();
        musicButton.textContent = "🔊 Nhạc";
      } catch {}
      window.removeEventListener("pointerdown", startMusicOnce);
    };
    window.addEventListener("pointerdown", startMusicOnce, { once: true });
  }

  // Parallax rất nhẹ trên thiết bị hỗ trợ.
  if (motion && window.matchMedia("(pointer:fine)").matches) {
    window.addEventListener("pointermove", e => {
      const x = (e.clientX / innerWidth - .5) * 2;
      const y = (e.clientY / innerHeight - .5) * 2;
      layer.style.transform = `translate(${x * 3}px, ${y * 3}px)`;
    }, { passive: true });
  }
}

async function renderCardPage(cardId) {
  showLoading();

  if (!cardId) {
    showError("URL thiệp không hợp lệ.");
    return;
  }

  if (!hasSupabaseConfig) {
    showError("Website chưa được cấu hình Supabase.");
    return;
  }

  try {
    const card = await fetchCard(cardId);

    if (!card) {
      showError("Thiệp này không tồn tại hoặc đã bị xóa.");
      return;
    }

    renderCard(card);
  } catch (error) {
    console.error(error);
    showError("Không thể tải dữ liệu thiệp. Kiểm tra cấu hình Supabase và kết nối mạng.");
  }
}

function init() {
  const cardId = getCardIdFromPath();

  if (cardId) {
    renderCardPage(cardId);
  } else {
    renderCreatePage();
  }
}

init();
