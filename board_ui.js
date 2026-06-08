const elNoSessionOverlay = document.getElementById("no-session-overlay");
const elPropertiesBoardGrid = document.getElementById("properties-board-grid");
const elCurrentPlayerAvatar = document.getElementById("current-player-avatar");
const elCurrentPlayerName = document.getElementById("current-player-name");
const elSpectatorDiceBox = document.getElementById("spectator-dice-box");
const elSpectatorPlayersList = document.getElementById("spectator-players-list");
const elBtnFullscreenSpec = document.getElementById("btn-fullscreen-spec");
const elBtnToggleLayout = document.getElementById("btn-toggle-layout");

const elModalSpec = document.getElementById("spectator-modal");

let showDetailedPlayerCards = localStorage.getItem("monopoly_spec_detailed_cards") === "true";

function updateToggleLayoutButtonText() {
  if (showDetailedPlayerCards) {
    elBtnToggleLayout.innerHTML = `<span>🎛️</span> Show Simple List`;
  } else {
    elBtnToggleLayout.innerHTML = `<span>🎛️</span> Show Detailed Cards`;
  }
}

if (elBtnToggleLayout) {
  updateToggleLayoutButtonText();
  elBtnToggleLayout.addEventListener("click", () => {
    showDetailedPlayerCards = !showDetailedPlayerCards;
    localStorage.setItem("monopoly_spec_detailed_cards", showDetailedPlayerCards ? "true" : "false");
    updateToggleLayoutButtonText();
    refreshBoardView();
  });
}

// ─── INITIALIZE AND SYNC ──────────────────────────────────────────────────
function refreshBoardView() {
  const loaded = Monopoly.loadFromLocalStorage();
  if (!loaded) {
    elNoSessionOverlay.style.display = "flex";
    return;
  }
  
  elNoSessionOverlay.style.display = "none";
  const state = Monopoly.getState();
  const currentEdition = Monopoly.EDITIONS[state.edition];

  renderTurnInfo(state);
  renderPlayers(state, currentEdition);
  renderBoardGrid(state);
  renderDrawnCard(state);
}

// Refresh when local storage updates from other tabs
window.addEventListener("storage", (e) => {
  if (e.key === "monopoly_companion_session") {
    refreshBoardView();
  } else if (e.key === "monopoly_theme") {
    applyTheme(e.newValue);
  }
});

// ─── RENDER TURN INFO ─────────────────────────────────────────────────────
function renderTurnInfo(state) {
  if (!state.players || state.players.length === 0) return;
  const activePlayer = state.players[state.currentPlayerIndex];
  elCurrentPlayerAvatar.innerText = activePlayer.token;
  elCurrentPlayerName.innerText = activePlayer.name;
  elCurrentPlayerName.style.color = activePlayer.color;

  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  if (state.dice) {
    const isRolling = state.dice.isRolling;
    const hasValues = state.dice.values && state.dice.values.length === 2;
    
    const val1 = hasValues ? (diceFaces[state.dice.values[0] - 1] || "🎲") : "🎲";
    const val2 = hasValues ? (diceFaces[state.dice.values[1] - 1] || "🎲") : "🎲";

    elSpectatorDiceBox.innerHTML = `
      <div class="die ${isRolling ? 'rolling' : ''}">${val1}</div>
      <div class="die ${isRolling ? 'rolling' : ''}">${val2}</div>
    `;
  }
}

// ─── RENDER PLAYERS LIST ──────────────────────────────────────────────────
function renderPlayers(state, edition) {
  elSpectatorPlayersList.innerHTML = "";
  
  if (showDetailedPlayerCards) {
    elSpectatorPlayersList.className = "spectator-detailed-cards";
    state.players.forEach((p, idx) => {
      const isCurrent = idx === state.currentPlayerIndex;
      const formattedCash = Monopoly.getFormattedAmount(p.balance);
      
      let statusBadge = `<span class="player-status-badge active">Active</span>`;
      if (p.inJail) statusBadge = `<span class="player-status-badge jail">In Jail</span>`;
      if (p.isBankrupt) statusBadge = `<span class="player-status-badge bankrupt">Bankrupt</span>`;

      const playerProps = state.properties.filter(pr => pr.ownerId === p.id);
      const propBadges = playerProps.map(pr => {
        const colorVal = getGroupColor(pr.group);
        const houseText = pr.houses === 5 ? "🏨" : pr.houses > 0 ? `🏠x${pr.houses}` : "";
        const mortText = pr.isMortgaged ? "🚫" : "";
        return `
          <span class="prop-badge ${pr.isMortgaged ? 'mortgaged' : ''}" style="background-color: ${colorVal}; color: ${pr.group === 'yellow' || pr.group === 'light-blue' ? '#222' : '#fff'}">
            ${pr.name} ${houseText} ${mortText}
          </span>`;
      }).join("");

      let jailCardsBadge = "";
      if (p.getOutOfJailCards > 0) {
        jailCardsBadge = `<span class="player-status-badge jail-card" title="Get Out of Jail Free Card">🎟️ x${p.getOutOfJailCards}</span>`;
      }

      const card = document.createElement("div");
      card.className = `player-card glass ${isCurrent ? 'active-player-glow' : ''}`;
      card.style.setProperty("--player-color", p.color);
      card.style.marginBottom = "12px";
      
      card.innerHTML = `
        <div class="player-card-header" style="margin-bottom: 8px;">
          <div class="player-name-group">
            <div class="avatar-circle" style="border-color: ${p.color};">${p.token}</div>
            <h3 style="margin: 0; font-size: 16px;">${p.name}</h3>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            ${statusBadge}
            ${jailCardsBadge}
          </div>
        </div>
        <div class="player-card-balance" style="font-size: 20px; margin-bottom: 8px;">${formattedCash}</div>
        <div class="player-assets">
          <div class="assets-label" style="font-size: 11px;">Properties Owned (${playerProps.length})</div>
          <div class="properties-badges-list">
            ${propBadges || '<span style="color: var(--text-dim); font-style: italic;">None</span>'}
          </div>
        </div>
      `;
      elSpectatorPlayersList.appendChild(card);
    });
  } else {
    elSpectatorPlayersList.className = "spectator-simple-list";
    state.players.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = `spectator-player-item ${idx === state.currentPlayerIndex ? 'active-turn' : ''} ${p.isBankrupt ? 'bankrupt' : ''}`;
      
      let statusText = "Active";
      if (p.isBankrupt) statusText = "Bankrupt";
      else if (p.inJail) statusText = "In Jail 🔒";

      if (p.getOutOfJailCards > 0) {
        statusText += ` | 🎟️ x${p.getOutOfJailCards}`;
      }

      item.innerHTML = `
        <div class="player-identity">
          <span class="player-badge" style="background: ${p.color};">${p.token}</span>
          <div class="player-details">
            <span class="name">${p.name}</span>
            <span class="status">${statusText}</span>
          </div>
        </div>
        <div class="player-balance">${Monopoly.getFormattedAmount(p.balance)}</div>
      `;
      elSpectatorPlayersList.appendChild(item);
    });
  }
}

// ─── RENDER 11x11 BOARD GRID ──────────────────────────────────────────────
function renderBoardGrid(state) {
  elPropertiesBoardGrid.innerHTML = "";
  
  state.properties.forEach(p => {
    const card = document.createElement("div");
    card.className = "board-space";
    
    const colorVal = (p.type === "property" || p.type === "railroad" || p.type === "utility") ? getGroupColor(p.group) : null;
    const owner = p.ownerId ? state.players.find(pl => pl.id === p.ownerId) : null;
    const formattedPrice = p.cost ? Monopoly.getFormattedAmount(p.cost) : "";

    // Determine grid position
    const coords = getBoardGridCoords(p.id);
    card.style.gridRow = coords.row;
    card.style.gridColumn = coords.col;

    // Side classes
    if (p.id === 0 || p.id === 10 || p.id === 20 || p.id === 30) {
      card.classList.add("corner-space");
      if (p.id === 0) card.classList.add("go-corner");
      if (p.id === 10) card.classList.add("jail-corner");
      if (p.id === 20) card.classList.add("parking-corner");
      if (p.id === 30) card.classList.add("gotojail-corner");
    } else if (coords.row === 1) {
      card.classList.add("vertical-space", "top-side");
    } else if (coords.row === 11) {
      card.classList.add("vertical-space", "bottom-side");
    } else if (coords.col === 1) {
      card.classList.add("horizontal-space", "left-side");
    } else if (coords.col === 11) {
      card.classList.add("horizontal-space", "right-side");
    }

    // landed tokens
    const activePlayer = state.players[state.currentPlayerIndex];
    const isLanded = activePlayer && activePlayer.position === p.id;
    if (isLanded) {
      card.classList.add("landed-on");
      if (state.dice.lastRolled && !state.landedActionResolved) {
        if (!p.ownerId && (p.type === "property" || p.type === "railroad" || p.type === "utility")) {
          card.classList.add("can-buy-highlight");
        } else if (p.ownerId && p.ownerId !== activePlayer.id && !p.isMortgaged) {
          card.classList.add("must-pay-rent-highlight");
        }
      }
    }

    if (p.isMortgaged) {
      card.classList.add("mortgaged");
    }

    let buildingEmoji = "";
    if (p.houses === 5) buildingEmoji = "🏨";
    else if (p.houses > 0) buildingEmoji = "🏠".repeat(p.houses);

    const landedPlayers = state.players.filter(pl => pl.position === p.id && !pl.isBankrupt);
    let landedTokensHtml = "";
    if (landedPlayers.length > 0) {
      landedTokensHtml = `
        <div class="landed-players-tokens">
          ${landedPlayers.map(pl => `<span class="landed-token" title="${pl.name}" style="background: ${pl.color};">${pl.token}</span>`).join("")}
        </div>
      `;
    }

    let headerHtml = "";
    if (colorVal) {
      headerHtml = `<div class="property-card-header" style="background-color: ${colorVal};"></div>`;
    }

    let bodyContent = "";
    if (p.type === "property" || p.type === "railroad" || p.type === "utility") {
      bodyContent = `
        <div class="space-name">${p.name}</div>
        <div class="space-meta">
          <span class="space-price">${formattedPrice}</span>
          <span class="space-owner-building">${buildingEmoji}${owner ? ' ' + owner.token : ''}</span>
        </div>
      `;
    } else {
      let iconEmoji = "⚙️";
      if (p.type === "go") iconEmoji = "🏁";
      else if (p.type === "chance") iconEmoji = "❓";
      else if (p.type === "chest") iconEmoji = "📦";
      else if (p.type === "tax") iconEmoji = "💸";
      else if (p.type === "jail") iconEmoji = "🔒";
      else if (p.type === "parking") iconEmoji = "🚗";
      else if (p.type === "gotojail") iconEmoji = "🚨";

      bodyContent = `
        <div class="space-icon">${iconEmoji}</div>
        <div class="space-name special-space-name">${p.name}</div>
      `;
    }

    card.innerHTML = `
      ${headerHtml}
      <div class="board-space-body">
        ${landedTokensHtml}
        ${bodyContent}
      </div>
    `;
    
    // Show deed modal when clicked
    card.addEventListener("click", () => openPropertyModal(p.id));
    elPropertiesBoardGrid.appendChild(card);
  });

  // Central logo branding
  const centerCell = document.createElement("div");
  centerCell.className = "monopoly-board-center";
  centerCell.innerHTML = `
    <div class="center-logo">MONOPOLY</div>
    <div class="center-sub">COMPANION</div>
    <div class="center-edition">${Monopoly.EDITIONS[state.edition].name}</div>
  `;
  elPropertiesBoardGrid.appendChild(centerCell);
}

function getBoardGridCoords(id) {
  if (id >= 20 && id <= 30) {
    return { row: 1, col: id - 19 };
  } else if (id >= 11 && id <= 19) {
    return { row: 21 - id, col: 1 };
  } else if (id >= 31 && id <= 39) {
    return { row: id - 29, col: 11 };
  } else {
    return { row: 11, col: 11 - id };
  }
}

function getGroupColor(group) {
  switch (group) {
    case "brown": return "#955436";
    case "light-blue": return "#aae0fa";
    case "magenta": return "#d93a96";
    case "orange": return "#f7941d";
    case "red": return "#ed1c24";
    case "yellow": return "#fef200";
    case "green": return "#19a950";
    case "dark-blue": return "#002fbe";
    case "railroad": return "#334155";
    case "utility": return "#475569";
    default: return null;
  }
}

// ─── FULLSCREEN CONTROLS ──────────────────────────────────────────────────
elBtnFullscreenSpec.addEventListener("click", () => {
  toggleFullscreen(document.documentElement);
});

function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    elBtnFullscreenSpec.innerHTML = `<span>⛶</span> Exit Fullscreen`;
  } else {
    elBtnFullscreenSpec.innerHTML = `<span>⛶</span> Fullscreen View`;
  }
});

// ─── DEED DETAILS POPUP ───────────────────────────────────────────────────
function openPropertyModal(propertyId) {
  const state = Monopoly.getState();
  const p = state.properties.find(prop => prop.id === propertyId);
  if (!p || (p.type !== "property" && p.type !== "railroad" && p.type !== "utility")) return;
  
  const owner = p.ownerId ? state.players.find(pl => pl.id === p.ownerId) : null;
  const currentEdition = Monopoly.EDITIONS[state.edition];
  const currency = currentEdition.currency;
  const colorVal = getGroupColor(p.group);
  
  const elTitle = document.getElementById("spec-modal-title");
  const elHeader = document.getElementById("spec-modal-header");
  const elBody = document.getElementById("spec-modal-body");
  
  elHeader.style.backgroundColor = colorVal || 'rgba(255,255,255,0.08)';
  elHeader.innerText = p.name;
  elHeader.style.color = (p.group === 'yellow' || p.group === 'light-blue') ? '#222' : '#fff';
  
  let detailsHtml = "";
  if (p.type === "property") {
    detailsHtml = `
      <div class="rent-line">Rent: <strong>${currency}${p.rent[0]}</strong></div>
      <div class="rent-line">With 1 House: <strong>${currency}${p.rent[1]}</strong></div>
      <div class="rent-line">With 2 Houses: <strong>${currency}${p.rent[2]}</strong></div>
      <div class="rent-line">With 3 Houses: <strong>${currency}${p.rent[3]}</strong></div>
      <div class="rent-line">With 4 Houses: <strong>${currency}${p.rent[4]}</strong></div>
      <div class="rent-line">With Hotel: <strong>${currency}${p.rent[5]}</strong></div>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px 0;">
      <div class="meta-line">House Cost: <strong>${currency}${p.houseCost}</strong> each</div>
      <div class="meta-line">Mortgage Value: <strong>${currency}${p.mortgageValue}</strong></div>
    `;
  } else if (p.type === "railroad") {
    detailsHtml = `
      <div class="rent-line">Rent (1 Railroad owned): <strong>${currency}25</strong></div>
      <div class="rent-line">Rent (2 Railroads owned): <strong>${currency}50</strong></div>
      <div class="rent-line">Rent (3 Railroads owned): <strong>${currency}100</strong></div>
      <div class="rent-line">Rent (4 Railroads owned): <strong>${currency}200</strong></div>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px 0;">
      <div class="meta-line">Mortgage Value: <strong>${currency}${p.mortgageValue}</strong></div>
    `;
  } else if (p.type === "utility") {
    detailsHtml = `
      <div class="rent-line">If 1 Utility is owned, rent is <strong>4x</strong> dice value.</div>
      <div class="rent-line">If 2 Utilities are owned, rent is <strong>10x</strong> dice value.</div>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 12px 0;">
      <div class="meta-line">Mortgage Value: <strong>${currency}${p.mortgageValue}</strong></div>
    `;
  }
  
  let statusHtml = `
    <div style="margin-top: 16px; text-align: center; font-size: 14px;">
      Status: <strong>${owner ? owner.token + ' ' + owner.name : 'Unowned'}</strong>
      ${p.isMortgaged ? ' <span class="badge" style="background:var(--color-danger); padding:2px 6px; border-radius:4px; font-size:10px;">Mortgaged</span>' : ''}
      ${p.houses > 0 ? `<br>Buildings: <strong>${p.houses === 5 ? '1 Hotel 🏨' : p.houses + ' Houses 🏠'}</strong>` : ''}
    </div>
  `;
  
  elBody.innerHTML = detailsHtml + statusHtml;
  elModalSpec.classList.add("active");
}

window.closeSpecModal = function() {
  elModalSpec.classList.remove("active");
};

// Close modal when clicking outside
elModalSpec.addEventListener("click", (e) => {
  if (e.target === elModalSpec) {
    closeSpecModal();
  }
});

let currentDrawnCardKey = null;

function renderDrawnCard(state) {
  const elCardOverlay = document.getElementById("spectator-card-draw-overlay");
  const elFlipperElement = document.getElementById("card-flipper-element");
  const elCardFrontType = document.getElementById("card-front-type");
  const elCardBadge = document.getElementById("drawn-card-badge");
  const elCardTitle = document.getElementById("drawn-card-title");
  const elCardDesc = document.getElementById("drawn-card-desc");

  if (!elCardOverlay || !elFlipperElement) return;

  if (state.activeCard) {
    const card = state.activeCard;
    const cardKey = `${card.type}-${card.title}-${card.desc}`;
    
    if (currentDrawnCardKey !== cardKey) {
      currentDrawnCardKey = cardKey;
      const isChance = card.type === "chance";
      
      // Update front face classes & label
      elCardFrontType.className = `card-face ${isChance ? 'card-front-chance' : 'card-front-chest'}`;
      elCardFrontType.querySelector(".card-type-label").innerText = isChance ? "CHANCE" : "COMMUNITY CHEST";
      
      // Update back face contents & styles
      elCardBadge.innerText = isChance ? "CHANCE" : "COMMUNITY CHEST";
      elCardBadge.className = `card-badge ${isChance ? 'chance' : 'chest'}`;
      elCardTitle.innerText = card.title;
      elCardDesc.innerText = card.desc;
      
      // Reset flipped state and open overlay
      elFlipperElement.classList.remove("flipped");
      elCardOverlay.classList.add("active");
      
      // Flip the card after overlay animates in
      setTimeout(() => {
        elFlipperElement.classList.add("flipped");
      }, 500);
    }
  } else {
    currentDrawnCardKey = null;
    elCardOverlay.classList.remove("active");
    elFlipperElement.classList.remove("flipped");
  }
}

// ─── THEME SYNCHRONIZER ───────────────────────────────────────────────────
function applyTheme(theme) {
  const link = document.getElementById("theme-stylesheet");
  if (!link) return;
  if (theme === "kids") {
    link.href = "templates/style.css";
    document.body.classList.add("kids-theme");
  } else {
    link.href = "style.css";
    document.body.classList.remove("kids-theme");
  }
}

// Load and apply theme, then refresh board
const savedTheme = localStorage.getItem("monopoly_theme") || new URLSearchParams(window.location.search).get("theme") || "standard";
applyTheme(savedTheme);
refreshBoardView();

// Poll for changes every 1 second as a robust fallback
setInterval(refreshBoardView, 1000);
