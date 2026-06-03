/**
 * Monopoly Game Companion Engine - Core Logic & State Coordinator
 * Supports VN, US, and International (UK) editions with standardized pricing,
 * transaction ledgers, undos, and offline persistence.
 */

const Monopoly = (() => {
  // ─── BOARD NAMES DEFINITION ──────────────────────────────────────────────────
  const EDITIONS = {
    VN: {
      name: "Vietnam Edition",
      currency: "M",
      names: {
        1: "Chợ Bình Tây",
        3: "Chợ Lớn",
        5: "Ga Sài Gòn",
        6: "Đà Lạt",
        8: "Nha Trang",
        9: "Vũng Tàu",
        11: "Cố đô Huế",
        12: "Công ty Điện lực",
        13: "Phố cổ Hội An",
        14: "Bãi biển Đà Nẵng",
        15: "Ga Đà Nẵng",
        16: "Sầm Sơn",
        18: "Đồ Sơn",
        19: "Đảo Cát Bà",
        21: "Tràng An",
        23: "Phong Nha",
        24: "Vịnh Hạ Long",
        25: "Ga Hà Nội",
        26: "Sa Pa",
        27: "Phan Thiết",
        28: "Công ty Nước sạch",
        29: "Mũi Né",
        31: "Đảo Phú Quốc",
        32: "Côn Đảo",
        34: "Măng Đen",
        35: "Ga Hải Phòng",
        37: "Chợ Bến Thành",
        39: "Nguyễn Huệ"
      }
    },
    US: {
      name: "United States Edition",
      currency: "$",
      names: {
        1: "Mediterranean Avenue",
        3: "Baltic Avenue",
        5: "Reading Railroad",
        6: "Oriental Avenue",
        8: "Vermont Avenue",
        9: "Connecticut Avenue",
        11: "St. Charles Place",
        12: "Electric Company",
        13: "States Avenue",
        14: "Virginia Avenue",
        15: "Pennsylvania Railroad",
        16: "St. James Place",
        18: "Tennessee Avenue",
        19: "New York Avenue",
        21: "Kentucky Avenue",
        23: "Indiana Avenue",
        24: "Illinois Avenue",
        25: "B. & O. Railroad",
        26: "Atlantic Avenue",
        27: "Ventnor Avenue",
        28: "Water Works",
        29: "Marvin Gardens",
        31: "Pacific Avenue",
        32: "North Carolina Avenue",
        34: "Pennsylvania Avenue",
        35: "Short Line Railroad",
        37: "Park Place",
        39: "Boardwalk"
      }
    },
    INT: {
      name: "International Edition",
      currency: "£",
      names: {
        1: "Old Kent Road",
        3: "Whitechapel Road",
        5: "King's Cross Station",
        6: "The Angel Islington",
        8: "Euston Road",
        9: "Pentonville Road",
        11: "Pall Mall",
        12: "Electric Company",
        13: "Whitehall",
        14: "Northumberland Avenue",
        15: "Marylebone Station",
        16: "Bow Street",
        18: "Marlborough Street",
        19: "Vine Street",
        21: "Strand",
        23: "Fleet Street",
        24: "Trafalgar Square",
        25: "Fenchurch Street Station",
        26: "Leicester Square",
        27: "Coventry Street",
        28: "Water Works",
        29: "Piccadilly",
        31: "Regent Street",
        32: "Oxford Street",
        34: "Bond Street",
        35: "Liverpool Street Station",
        37: "Park Lane",
        39: "Mayfair"
      }
    }
  };

  // ─── BOARD TILE SCHEMA & STRUCTURE ──────────────────────────────────────────
  // Layout contains types: 'go', 'property', 'chest', 'tax', 'railroad', 'chance', 'jail', 'utility', 'parking', 'gotojail'
  const BOARD_LAYOUT = [
    { id: 0, type: "go", name: "GO" },
    { id: 1, type: "property", group: "brown", cost: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
    { id: 2, type: "chest", name: "Community Chest" },
    { id: 3, type: "property", group: "brown", cost: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
    { id: 4, type: "tax", name: "Income Tax", taxAmount: 200 },
    { id: 5, type: "railroad", group: "railroad", cost: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
    { id: 6, type: "property", group: "light-blue", cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
    { id: 7, type: "chance", name: "Chance" },
    { id: 8, type: "property", group: "light-blue", cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
    { id: 9, type: "property", group: "light-blue", cost: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
    { id: 10, type: "jail", name: "In Jail / Just Visiting" },
    { id: 11, type: "property", group: "magenta", cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
    { id: 12, type: "utility", group: "utility", cost: 150, mortgageValue: 75 },
    { id: 13, type: "property", group: "magenta", cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
    { id: 14, type: "property", group: "magenta", cost: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
    { id: 15, type: "railroad", group: "railroad", cost: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
    { id: 16, type: "property", group: "orange", cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
    { id: 17, type: "chest", name: "Community Chest" },
    { id: 18, type: "property", group: "orange", cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
    { id: 19, type: "property", group: "orange", cost: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },
    { id: 20, type: "parking", name: "Free Parking" },
    { id: 21, type: "property", group: "red", cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
    { id: 22, type: "chance", name: "Chance" },
    { id: 23, type: "property", group: "red", cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
    { id: 24, type: "property", group: "red", cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
    { id: 25, type: "railroad", group: "railroad", cost: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
    { id: 26, type: "property", group: "yellow", cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
    { id: 27, type: "property", group: "yellow", cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
    { id: 28, type: "utility", group: "utility", cost: 150, mortgageValue: 75 },
    { id: 29, type: "property", group: "yellow", cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
    { id: 30, type: "gotojail", name: "Go to Jail" },
    { id: 31, type: "property", group: "green", cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
    { id: 32, type: "property", group: "green", cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
    { id: 33, type: "chest", name: "Community Chest" },
    { id: 34, type: "property", group: "green", cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
    { id: 35, type: "railroad", group: "railroad", cost: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
    { id: 36, type: "chance", name: "Chance" },
    { id: 37, type: "property", group: "dark-blue", cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
    { id: 38, type: "tax", name: "Luxury Tax", taxAmount: 100 },
    { id: 39, type: "property", group: "dark-blue", cost: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 }
  ];

  // ─── CARDS DEFINITION ────────────────────────────────────────────────────────
  const CHANCE_CARDS = [
    {
      get title() { return state.edition === "VN" ? "Tiến thẳng về ô Bắt đầu" : "Advance to GO"; },
      get desc() { return state.edition === "VN" ? "Tiến thẳng về ô Bắt đầu (Nhận 200)" : "Advance to GO (Collect 200)"; },
      action: (s, p) => movePlayerTo(s, p, 0, true)
    },
    {
      get title() { return state.edition === "VN" ? "Đi thẳng đến Vịnh Hạ Long" : "Advance to Illinois / Vịnh Hạ Long"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến Vịnh Hạ Long (Nếu đi qua ô Bắt đầu, nhận 200)" : "Advance to Space 24 (If you pass GO, collect 200)"; },
      action: (s, p) => movePlayerTo(s, p, 24, true)
    },
    {
      get title() { return state.edition === "VN" ? "Đi thẳng đến Cố đô Huế" : "Advance to St. Charles / Cố đô Huế"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến Cố đô Huế (Nếu đi qua ô Bắt đầu, nhận 200)" : "Advance to Space 11 (If you pass GO, collect 200)"; },
      action: (s, p) => movePlayerTo(s, p, 11, true)
    },
    {
      get title() { return state.edition === "VN" ? "Tiến tới Tiện ích gần nhất" : "Advance to nearest Utility"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến công ty tiện ích gần nhất. Nếu đã có chủ, trả tiền thuê gấp 10 lần số xúc xắc. Nếu chưa có chủ, bạn có thể mua nó." : "Advance to nearest Utility. If owned, pay owner 10x dice roll. If unowned, you may buy it."; },
      action: (s, p) => {
        let target = p.position > 12 && p.position <= 28 ? 28 : 12;
        movePlayerTo(s, p, target, true, { nearestUtilityOverride: true });
      }
    },
    {
      get title() { return state.edition === "VN" ? "Tiến tới Ga tàu gần nhất" : "Advance to nearest Railroad"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến ga tàu gần nhất. Nếu đã có chủ, trả tiền thuê gấp đôi. Nếu chưa có chủ, bạn có thể mua nó." : "Advance to nearest Railroad. If owned, pay owner double rent. If unowned, you may buy it."; },
      action: (s, p) => {
        let pos = p.position;
        let target = 5;
        if (pos > 5 && pos <= 15) target = 15;
        else if (pos > 15 && pos <= 25) target = 25;
        else if (pos > 25 && pos <= 35) target = 35;
        movePlayerTo(s, p, target, true, { nearestRailroadDoubleRent: true });
      }
    },
    {
      get title() { return state.edition === "VN" ? "Ngân hàng trả cổ tức" : "Bank Pays Dividend"; },
      get desc() { return state.edition === "VN" ? "Ngân hàng thanh toán cổ tức cho bạn trị giá 50" : "Bank pays you dividend of 50"; },
      action: (s, p) => payFromBank(s, p, 50, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Thẻ Vượt ngục miễn phí" : "Get Out of Jail Free"; },
      get desc() { return state.edition === "VN" ? "Thẻ Vượt ngục. Thẻ này được giữ lại cho đến khi cần dùng." : "Get Out of Jail Free card. This card may be kept until needed."; },
      action: (s, p) => { p.getOutOfJailCards++; }
    },
    {
      get title() { return state.edition === "VN" ? "Đi lùi lại 3 ô" : "Go Back 3 Spaces"; },
      get desc() { return state.edition === "VN" ? "Đi lùi về phía sau 3 ô." : "Retreat 3 spaces."; },
      action: (s, p) => {
        let target = (p.position - 3 + 40) % 40;
        movePlayerTo(s, p, target, false);
      }
    },
    {
      get title() { return state.edition === "VN" ? "Đi thẳng vào Tù" : "Go to Jail"; },
      get desc() { return state.edition === "VN" ? "Đi thẳng vào Tù. Không đi qua ô Bắt đầu, không nhận 200." : "Go directly to Jail. Do not pass GO, do not collect 200."; },
      action: (s, p) => sendToJail(s, p)
    },
    {
      get title() { return state.edition === "VN" ? "Sửa chữa nhà cửa toàn diện" : "General Repairs"; },
      get desc() { return state.edition === "VN" ? "Nộp phí sửa chữa cho tất cả bất động sản bạn sở hữu: 25 cho mỗi căn nhà, 100 cho mỗi khách sạn." : "Make general repairs on all your property. For each house pay 25. For each hotel pay 100."; },
      action: (s, p) => {
        let { houses, hotels } = countPlayerBuildings(s, p.id);
        let total = houses * 25 + hotels * 100;
        payToBank(s, p, total, "CARD_EFFECT");
      }
    },
    {
      get title() { return state.edition === "VN" ? "Phạt lỗi quá tốc độ" : "Speeding Fine"; },
      get desc() { return state.edition === "VN" ? "Phạt chạy quá tốc độ 15." : "Speeding fine 15"; },
      action: (s, p) => payToBank(s, p, 15, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Bắt chuyến tàu đến Ga Sài Gòn" : "Take a trip to Reading Railroad / Ga Sài Gòn"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến Ga Sài Gòn (Nếu đi qua ô Bắt đầu, nhận 200)" : "Advance to Space 5 (If you pass GO, collect 200)"; },
      action: (s, p) => movePlayerTo(s, p, 5, true)
    },
    {
      get title() { return state.edition === "VN" ? "Đi thẳng đến đường Nguyễn Huệ" : "Advance to Boardwalk / Nguyễn Huệ"; },
      get desc() { return state.edition === "VN" ? "Di chuyển đến ô Nguyễn Huệ." : "Advance to Space 39"; },
      action: (s, p) => movePlayerTo(s, p, 39, true)
    },
    {
      get title() { return state.edition === "VN" ? "Được bầu làm Chủ tịch Hội đồng" : "Elected Chairman of the Board"; },
      get desc() { return state.edition === "VN" ? "Bạn đã được bầu làm Chủ tịch Hội đồng Quản trị. Trả cho mỗi người chơi khác 50." : "You have been elected Chairman of the Board. Pay each player 50."; },
      action: (s, p) => {
        s.players.forEach(other => {
          if (other.id !== p.id && !other.isBankrupt) {
            payPlayerToPlayer(s, p, other, 50, "CARD_EFFECT");
          }
        });
      }
    },
    {
      get title() { return state.edition === "VN" ? "Khoản vay xây dựng đáo hạn" : "Building Loan Matures"; },
      get desc() { return state.edition === "VN" ? "Khoản vay xây dựng đáo hạn. Nhận 150." : "Your building loan matures. Collect 150."; },
      action: (s, p) => payFromBank(s, p, 150, "CARD_EFFECT")
    }
  ];

  const CHEST_CARDS = [
    {
      get title() { return state.edition === "VN" ? "Tiến thẳng về ô Bắt đầu" : "Advance to GO"; },
      get desc() { return state.edition === "VN" ? "Tiến thẳng về ô Bắt đầu (Nhận 200)" : "Advance to GO (Collect 200)"; },
      action: (s, p) => movePlayerTo(s, p, 0, true)
    },
    {
      get title() { return state.edition === "VN" ? "Sai sót của Ngân hàng có lợi cho bạn" : "Bank Error in your favor"; },
      get desc() { return state.edition === "VN" ? "Ngân hàng có sự sai sót và có lợi cho bạn. Nhận 200." : "Bank error in your favor. Collect 200."; },
      action: (s, p) => payFromBank(s, p, 200, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Phí khám bệnh" : "Doctor's Fees"; },
      get desc() { return state.edition === "VN" ? "Trả bác sĩ phí khám bệnh 50." : "Doctor's fees. Pay 50."; },
      action: (s, p) => payToBank(s, p, 50, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Bán cổ phiếu" : "Stock Sale"; },
      get desc() { return state.edition === "VN" ? "Từ đợt bán cổ tích lũy bạn nhận được 50." : "From sale of stock you get 50."; },
      action: (s, p) => payFromBank(s, p, 50, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Thẻ Vượt ngục miễn phí" : "Get Out of Jail Free"; },
      get desc() { return state.edition === "VN" ? "Thẻ Vượt ngục miễn phí. Thẻ này có thể giữ lại cho đến khi cần dùng." : "Get Out of Jail Free card. This card may be kept until needed."; },
      action: (s, p) => { p.getOutOfJailCards++; }
    },
    {
      get title() { return state.edition === "VN" ? "Đi thẳng vào Tù" : "Go directly to Jail"; },
      get desc() { return state.edition === "VN" ? "Đi thẳng vào Tù. Không đi qua ô Bắt đầu, không nhận 200." : "Go directly to Jail. Do not pass GO, do not collect 200."; },
      action: (s, p) => sendToJail(s, p)
    },
    {
      get title() { return state.edition === "VN" ? "Quỹ nghỉ lễ đáo hạn" : "Holiday Fund Matures"; },
      get desc() { return state.edition === "VN" ? "Quỹ tiết kiệm nghỉ lễ đáo hạn. Nhận 100." : "Holiday fund matures. Receive 100."; },
      action: (s, p) => payFromBank(s, p, 100, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Hoàn thuế thu nhập" : "Income Tax Refund"; },
      get desc() { return state.edition === "VN" ? "Hoàn trả thuế thu nhập. Nhận 20." : "Income tax refund. Collect 20."; },
      action: (s, p) => payFromBank(s, p, 20, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Tiệc sinh nhật" : "Birthday Party"; },
      get desc() { return state.edition === "VN" ? "Hôm nay là sinh nhật bạn. Thu đóng đóng góp 10 từ mỗi người chơi khác." : "It is your birthday. Collect 10 from every player."; },
      action: (s, p) => {
        s.players.forEach(other => {
          if (other.id !== p.id && !other.isBankrupt) {
            payPlayerToPlayer(s, other, p, 10, "CARD_EFFECT");
          }
        });
      }
    },
    {
      get title() { return state.edition === "VN" ? "Bảo hiểm nhân thọ đáo hạn" : "Life Insurance Matures"; },
      get desc() { return state.edition === "VN" ? "Hợp đồng bảo hiểm nhân thọ đáo hạn. Nhận 100." : "Life insurance matures. Collect 100."; },
      action: (s, p) => payFromBank(s, p, 100, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Phí bệnh viện" : "Hospital Fees"; },
      get desc() { return state.edition === "VN" ? "Nộp phí bệnh viện 100." : "Pay hospital fees of 100."; },
      action: (s, p) => payToBank(s, p, 100, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Nộp học phí" : "School Fees"; },
      get desc() { return state.edition === "VN" ? "Đóng học phí 50." : "Pay school fees of 50."; },
      action: (s, p) => payToBank(s, p, 50, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Phí tư vấn dịch vụ" : "Consultancy Fee"; },
      get desc() { return state.edition === "VN" ? "Nhận 25 phí dịch vụ tư vấn." : "Receive 25 consultancy fee."; },
      action: (s, p) => payFromBank(s, p, 25, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Chi phí trùng tu đường sá" : "Street Repairs"; },
      get desc() { return state.edition === "VN" ? "Bạn phải đóng góp trùng tu đường sá: 40 cho mỗi căn nhà, 115 cho mỗi khách sạn bạn sở hữu." : "You are assessed for street repairs. For each house pay 40. For each hotel pay 115."; },
      action: (s, p) => {
        let { houses, hotels } = countPlayerBuildings(s, p.id);
        let total = houses * 40 + hotels * 115;
        payToBank(s, p, total, "CARD_EFFECT");
      }
    },
    {
      get title() { return state.edition === "VN" ? "Giải nhì Cuộc thi sắc đẹp" : "Beauty Contest"; },
      get desc() { return state.edition === "VN" ? "Bạn giành giải nhì cuộc thi sắc đẹp. Nhận thưởng 10." : "You have won second prize in a beauty contest. Collect 10."; },
      action: (s, p) => payFromBank(s, p, 10, "CARD_EFFECT")
    },
    {
      get title() { return state.edition === "VN" ? "Nhận tài sản thừa kế" : "Inheritance"; },
      get desc() { return state.edition === "VN" ? "Bạn thừa kế 100." : "You inherit 100."; },
      action: (s, p) => payFromBank(s, p, 100, "CARD_EFFECT")
    }
  ];

  // ─── ACTIVE STATE ───────────────────────────────────────────────────────────
  let state = {
    edition: "VN",
    players: [],
    bank: { balance: 20500 },
    properties: [],
    currentPlayerIndex: 0,
    dice: { values: [1, 1], doublesCount: 0, lastRolled: false },
    landedActionResolved: true,
    chanceDeck: [],
    chestDeck: [],
    history: []
  };

  // ─── DEEP COPY UTILITY ──────────────────────────────────────────────────────
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ─── STATE PERSISTENCE ──────────────────────────────────────────────────────
  function saveToLocalStorage() {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("monopoly_companion_session", JSON.stringify(state));
    }
  }

  function loadFromLocalStorage() {
    if (typeof localStorage !== "undefined") {
      const data = localStorage.getItem("monopoly_companion_session");
      if (data) {
        try {
          state = JSON.parse(data);
          return true;
        } catch (e) {
          console.error("Failed to parse local storage session data.", e);
        }
      }
    }
    return false;
  }

  function clearLocalStorage() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("monopoly_companion_session");
    }
  }

  // ─── INITIALIZATION ──────────────────────────────────────────────────────────
  function initGame(playerList, selectedEdition = "VN", startingCash = 1500) {
    state.edition = selectedEdition;
    state.currentPlayerIndex = 0;
    state.dice = { values: [1, 1], doublesCount: 0, lastRolled: false };
    state.landedActionResolved = true;
    state.history = [];
    state.bank = { balance: 20500 };

    // Setup players
    state.players = playerList.map((p, idx) => ({
      id: `player_${idx}`,
      name: p.name || `Player ${idx + 1}`,
      token: p.token || "token_car",
      color: p.color || "#3b82f6",
      balance: startingCash,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      isBankrupt: false
    }));

    // Setup Properties dynamically based on layout & selected edition
    const namesMap = EDITIONS[selectedEdition].names;
    state.properties = BOARD_LAYOUT.map(layout => {
      const prop = {
        id: layout.id,
        name: namesMap[layout.id] || layout.name,
        type: layout.type
      };

      if (layout.type === "property") {
        prop.group = layout.group;
        prop.cost = layout.cost;
        prop.rent = layout.rent;
        prop.houseCost = layout.houseCost;
        prop.mortgageValue = layout.mortgageValue;
        prop.ownerId = null;
        prop.houses = 0; // 0-4 houses, 5 = hotel
        prop.isMortgaged = false;
      } else if (layout.type === "railroad") {
        prop.group = layout.group;
        prop.cost = layout.cost;
        prop.rent = layout.rent;
        prop.mortgageValue = layout.mortgageValue;
        prop.ownerId = null;
        prop.isMortgaged = false;
      } else if (layout.type === "utility") {
        prop.group = layout.group;
        prop.cost = layout.cost;
        prop.mortgageValue = layout.mortgageValue;
        prop.ownerId = null;
        prop.isMortgaged = false;
      }
      return prop;
    });

    // Shuffle Chance and Chest Decks
    state.chanceDeck = shuffleDeck([...Array(CHANCE_CARDS.length).keys()]);
    state.chestDeck = shuffleDeck([...Array(CHEST_CARDS.length).keys()]);

    // Push initial setup to history log
    logEvent("SETUP", `Game initialized with ${state.players.length} players in ${EDITIONS[selectedEdition].name}`);
    saveToLocalStorage();
  }

  function shuffleDeck(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ─── TRANSACTIONS ENGINE ────────────────────────────────────────────────────
  function executeTransaction(senderId, receiverId, amount, type, propertyId = null) {
    if (amount < 0) return { success: false, error: "Amount cannot be negative" };

    let sender = senderId === "bank" ? state.bank : state.players.find(p => p.id === senderId);
    let receiver = receiverId === "bank" ? state.bank : state.players.find(p => p.id === receiverId);

    if (senderId !== "bank" && sender && sender.balance < amount) {
      return {
        success: false,
        error: `Insufficient funds: ${sender.name} needs ${getFormattedAmount(amount)} but only has ${getFormattedAmount(sender.balance)}`,
        shortfall: amount - sender.balance
      };
    }

    // Process balances
    if (sender) sender.balance -= amount;
    if (receiver) receiver.balance += amount;

    // Check if tax or fine resolved active player's space action
    const activePlayer = state.players[state.currentPlayerIndex];
    if (activePlayer && senderId === activePlayer.id) {
      if (type === "PAY_TAX" || type === "JAIL_FINE") {
        state.landedActionResolved = true;
      }
    }

    // Log detail
    let logDesc = "";
    const senderName = senderId === "bank" ? "The Bank" : sender.name;
    const receiverName = receiverId === "bank" ? "The Bank" : receiver.name;
    const formatted = getFormattedAmount(amount);

    switch (type) {
      case "BUY_PROPERTY":
        logDesc = `${receiverName} purchased ${getPropertyName(propertyId)} from Bank for ${formatted}`;
        break;
      case "PAY_RENT":
        logDesc = `${senderName} paid ${formatted} rent to ${receiverName} for ${getPropertyName(propertyId)}`;
        break;
      case "PAY_TAX":
        logDesc = `${senderName} paid ${formatted} tax to the Bank`;
        break;
      case "PASS_GO":
        logDesc = `${receiverName} received ${formatted} for passing GO`;
        break;
      case "BUY_HOUSE":
        logDesc = `${senderName} built a house on ${getPropertyName(propertyId)} costing ${formatted}`;
        break;
      case "SELL_HOUSE":
        logDesc = `${receiverName} sold house on ${getPropertyName(propertyId)} returning ${formatted}`;
        break;
      case "MORTGAGE":
        logDesc = `${receiverName} mortgaged ${getPropertyName(propertyId)} for ${formatted}`;
        break;
      case "UNMORTGAGE":
        logDesc = `${senderName} unmortgaged ${getPropertyName(propertyId)} for ${formatted}`;
        break;
      case "JAIL_FINE":
        logDesc = `${senderName} paid ${formatted} jail fine to the Bank`;
        break;
      case "CARD_EFFECT":
        logDesc = senderId === "bank" 
          ? `${receiverName} received ${formatted} from bank card effect`
          : `${senderName} paid ${formatted} to ${receiverName} from card effect`;
        break;
      default:
        logDesc = `${senderName} transferred ${formatted} to ${receiverName}`;
    }

    logEvent(type, logDesc);
    saveToLocalStorage();
    return { success: true };
  }

  function payToBank(s, player, amount, type, propertyId = null) {
    player.balance -= amount;
    s.bank.balance += amount;
  }

  function payFromBank(s, player, amount, type, propertyId = null) {
    s.bank.balance -= amount;
    player.balance += amount;
  }

  function payPlayerToPlayer(s, sender, receiver, amount, type, propertyId = null) {
    sender.balance -= amount;
    receiver.balance += amount;
  }

  // ─── LEDGER LOGGING & EVENT SOURCING ─────────────────────────────────────────
  function logEvent(type, description) {
    // We clean history to remove state snapshots in old objects if size becomes a concern,
    // but a standard game is normally ~200 events, which takes < 500KB.
    const event = {
      id: `evt_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      timestamp: Date.now(),
      type: type,
      description: description,
      stateSnapshot: JSON.stringify({
        edition: state.edition,
        players: state.players,
        bank: state.bank,
        properties: state.properties,
        currentPlayerIndex: state.currentPlayerIndex,
        dice: state.dice,
        landedActionResolved: state.landedActionResolved,
        chanceDeck: state.chanceDeck,
        chestDeck: state.chestDeck
      })
    };

    // Store in active history
    state.history.push(event);
  }

  function undoLastEvent() {
    if (state.history.length <= 1) {
      // Setup is at index 0, so we can't undo setup
      return false;
    }

    // Remove the current active state (last action)
    state.history.pop();
    
    // Get the previous action's snapshot
    const lastEvent = state.history[state.history.length - 1];
    try {
      const restored = JSON.parse(lastEvent.stateSnapshot);
      state.edition = restored.edition;
      state.players = restored.players;
      state.bank = restored.bank;
      state.properties = restored.properties;
      state.currentPlayerIndex = restored.currentPlayerIndex;
      state.dice = restored.dice;
      state.landedActionResolved = restored.landedActionResolved;
      state.chanceDeck = restored.chanceDeck;
      state.chestDeck = restored.chestDeck;

      saveToLocalStorage();
      return true;
    } catch (e) {
      console.error("Failed to restore state snapshot during undo", e);
      return false;
    }
  }

  // ─── PROPERTY MANAGEMENT FUNCTIONS ──────────────────────────────────────────
  function buyProperty(playerId, propertyId, customPrice = null) {
    const player = state.players.find(p => p.id === playerId);
    const prop = state.properties.find(pr => pr.id === propertyId);

    if (!player || !prop) return { success: false, error: "Invalid player or property" };
    if (prop.ownerId) return { success: false, error: "Property already owned" };

    const price = customPrice !== null ? customPrice : prop.cost;
    const result = executeTransaction(playerId, "bank", price, "BUY_PROPERTY", propertyId);
    
    if (result.success) {
      prop.ownerId = playerId;
      if (propertyId === player.position) {
        state.landedActionResolved = true;
      }
      saveToLocalStorage();
    }
    return result;
  }

  function mortgageProperty(playerId, propertyId) {
    const player = state.players.find(p => p.id === playerId);
    const prop = state.properties.find(pr => pr.id === propertyId);

    if (!player || !prop) return { success: false, error: "Invalid player or property" };
    if (prop.ownerId !== playerId) return { success: false, error: "Player does not own this property" };
    if (prop.isMortgaged) return { success: false, error: "Property is already mortgaged" };
    if (prop.houses && prop.houses > 0) return { success: false, error: "Must sell all houses in color group before mortgaging" };

    const value = prop.mortgageValue;
    const result = executeTransaction("bank", playerId, value, "MORTGAGE", propertyId);
    
    if (result.success) {
      prop.isMortgaged = true;
      saveToLocalStorage();
    }
    return result;
  }

  function unmortgageProperty(playerId, propertyId) {
    const player = state.players.find(p => p.id === playerId);
    const prop = state.properties.find(pr => pr.id === propertyId);

    if (!player || !prop) return { success: false, error: "Invalid player or property" };
    if (prop.ownerId !== playerId) return { success: false, error: "Player does not own this property" };
    if (!prop.isMortgaged) return { success: false, error: "Property is not mortgaged" };

    // Standard rule: Unmortgaging costs mortgage value + 10% fee
    const cost = Math.ceil((prop.mortgageValue * 11) / 10);
    const result = executeTransaction(playerId, "bank", cost, "UNMORTGAGE", propertyId);
    
    if (result.success) {
      prop.isMortgaged = false;
      saveToLocalStorage();
    }
    return result;
  }

  function checkColorGroupOwnership(playerId, group) {
    if (!group || group === "railroad" || group === "utility") return false;
    const groupProps = state.properties.filter(p => p.group === group);
    return groupProps.every(p => p.ownerId === playerId);
  }

  function checkEvenBuilding(prop, action) {
    const groupProps = state.properties.filter(p => p.group === prop.group);
    const currentHouses = prop.houses;
    
    if (action === "BUILD") {
      // Standard rule: Cannot build if any property in the group has fewer houses than current - 1
      // e.g. To build a 2nd house on A, all others must have at least 1 house.
      return groupProps.every(p => p.houses >= currentHouses && !p.isMortgaged);
    } else if (action === "SELL") {
      // Standard rule: Cannot sell house if other properties in group have more houses
      // e.g. To sell house on A (current 2), no other property can have 3 houses.
      return groupProps.every(p => p.houses <= currentHouses);
    }
    return false;
  }

  function buildHouse(playerId, propertyId) {
    const player = state.players.find(p => p.id === playerId);
    const prop = state.properties.find(pr => pr.id === propertyId);

    if (!player || !prop) return { success: false, error: "Invalid player or property" };
    if (prop.ownerId !== playerId) return { success: false, error: "Player does not own this property" };
    if (prop.isMortgaged) return { success: false, error: "Property is mortgaged" };
    if (prop.houses >= 5) return { success: false, error: "Maximum buildings reached (Hotel built)" };

    // Check complete color set
    if (!checkColorGroupOwnership(playerId, prop.group)) {
      return { success: false, error: "You must own the complete color group to build houses" };
    }

    // Check mortgaged properties in group
    const groupProps = state.properties.filter(p => p.group === prop.group);
    if (groupProps.some(p => p.isMortgaged)) {
      return { success: false, error: "Cannot build while properties in the same color group are mortgaged" };
    }

    // Check even building
    if (!checkEvenBuilding(prop, "BUILD")) {
      return { success: false, error: "Rule violation: You must build evenly across properties in this color group" };
    }

    const cost = prop.houseCost;
    const result = executeTransaction(playerId, "bank", cost, "BUY_HOUSE", propertyId);
    if (result.success) {
      prop.houses++;
      saveToLocalStorage();
    }
    return result;
  }

  function sellHouse(playerId, propertyId) {
    const player = state.players.find(p => p.id === playerId);
    const prop = state.properties.find(pr => pr.id === propertyId);

    if (!player || !prop) return { success: false, error: "Invalid player or property" };
    if (prop.ownerId !== playerId) return { success: false, error: "Player does not own this property" };
    if (prop.houses <= 0) return { success: false, error: "No houses to sell on this property" };

    // Check even building
    if (!checkEvenBuilding(prop, "SELL")) {
      return { success: false, error: "Rule violation: You must sell houses evenly across this color group" };
    }

    // Standard rule: selling returns 50% of original house cost
    const returnVal = Math.floor(prop.houseCost / 2);
    const result = executeTransaction("bank", playerId, returnVal, "SELL_HOUSE", propertyId);
    if (result.success) {
      prop.houses--;
      saveToLocalStorage();
    }
    return result;
  }

  // ─── RENT FORMULA CALCULATIONS ─────────────────────────────────────────────
  function calculateRent(propertyId, diceSum = 7) {
    const prop = state.properties.find(p => p.id === propertyId);
    if (!prop || !prop.ownerId || prop.isMortgaged) return 0;

    const ownerId = prop.ownerId;

    if (prop.type === "property") {
      // If houses are built, rent is determined by building count
      if (prop.houses > 0) {
        return prop.rent[prop.houses];
      }
      // If full set is owned but no houses, rent is doubled
      const hasFullGroup = checkColorGroupOwnership(ownerId, prop.group);
      return hasFullGroup ? prop.rent[0] * 2 : prop.rent[0];

    } else if (prop.type === "railroad") {
      // Rent scales based on how many railroads owner holds
      const rrProps = state.properties.filter(p => p.type === "railroad" && p.ownerId === ownerId && !p.isMortgaged);
      const count = rrProps.length;
      return prop.rent[Math.max(0, count - 1)] || 25;

    } else if (prop.type === "utility") {
      // Rent = sum of dice * (4 if 1 utility, 10 if 2 utilities)
      const utilProps = state.properties.filter(p => p.type === "utility" && p.ownerId === ownerId && !p.isMortgaged);
      const multiplier = utilProps.length === 2 ? 10 : 4;
      return diceSum * multiplier;
    }
    return 0;
  }

  function triggerRentPayment(senderId, propertyId, diceSum = 7) {
    const prop = state.properties.find(p => p.id === propertyId);
    if (!prop || !prop.ownerId || prop.isMortgaged || prop.ownerId === senderId) {
      return { success: false, error: "Rent is not due" };
    }
    const rent = calculateRent(propertyId, diceSum);
    const result = executeTransaction(senderId, prop.ownerId, rent, "PAY_RENT", propertyId);
    if (result.success && senderId === state.players[state.currentPlayerIndex].id && propertyId === state.players[state.currentPlayerIndex].position) {
      state.landedActionResolved = true;
    }
    return result;
  }

  // ─── AUCTION & TRADING IMPLEMENTATIONS ───────────────────────────────────────
  function executeAuction(propertyId, winnerId, winningBid) {
    const prop = state.properties.find(p => p.id === propertyId);
    const winner = state.players.find(p => p.id === winnerId);

    if (!prop || !winner) return { success: false, error: "Invalid property or winning player" };
    if (prop.ownerId) return { success: false, error: "Property already owned" };

    const result = executeTransaction(winnerId, "bank", winningBid, "AUCTION_WIN", propertyId);
    if (result.success) {
      prop.ownerId = winnerId;
      const activePlayer = state.players[state.currentPlayerIndex];
      if (activePlayer && propertyId === activePlayer.position) {
        state.landedActionResolved = true;
      }
      logEvent("AUCTION_WIN", `Auction won: ${winner.name} bought ${prop.name} for ${getFormattedAmount(winningBid)}`);
      saveToLocalStorage();
    }
    return result;
  }

  function executeTrade(p1Id, p2Id, cash1, p1PropsIds, cash2, p2PropsIds) {
    const player1 = state.players.find(p => p.id === p1Id);
    const player2 = state.players.find(p => p.id === p2Id);

    if (!player1 || !player2) return { success: false, error: "Invalid trading players" };
    
    // Balance check
    if (player1.balance < cash1) return { success: false, error: `${player1.name} has insufficient cash for this trade` };
    if (player2.balance < cash2) return { success: false, error: `${player2.name} has insufficient cash for this trade` };

    // Validate property ownership
    for (let id of p1PropsIds) {
      const pr = state.properties.find(p => p.id === id);
      if (!pr || pr.ownerId !== p1Id) return { success: false, error: `${player1.name} does not own property ID ${id}` };
      if (pr.houses > 0) return { success: false, error: "Cannot trade properties with houses built on them. Sell houses first." };
    }
    for (let id of p2PropsIds) {
      const pr = state.properties.find(p => p.id === id);
      if (!pr || pr.ownerId !== p2Id) return { success: false, error: `${player2.name} does not own property ID ${id}` };
      if (pr.houses > 0) return { success: false, error: "Cannot trade properties with houses built on them. Sell houses first." };
    }

    // Execute Cash swaps
    player1.balance = player1.balance - cash1 + cash2;
    player2.balance = player2.balance - cash2 + cash1;

    // Swap property ownerships
    p1PropsIds.forEach(id => {
      const pr = state.properties.find(p => p.id === id);
      pr.ownerId = p2Id;
    });
    p2PropsIds.forEach(id => {
      const pr = state.properties.find(p => p.id === id);
      pr.ownerId = p1Id;
    });

    const getPropNames = (ids) => ids.map(id => state.properties.find(p => p.id === id).name).join(", ") || "no properties";
    const desc = `Trade Completed: ${player1.name} traded [Cash: ${getFormattedAmount(cash1)}, Properties: ${getPropNames(p1PropsIds)}] with ${player2.name} for [Cash: ${getFormattedAmount(cash2)}, Properties: ${getPropNames(p2PropsIds)}]`;
    
    logEvent("TRADE", desc);
    saveToLocalStorage();
    return { success: true };
  }

  // ─── PLAYER POSITION & GAMEPLAY MECHANICS ────────────────────────────────────
  function rollDice() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;
    const isDouble = d1 === d2;

    const player = state.players[state.currentPlayerIndex];
    
    state.dice.values = [d1, d2];
    state.dice.lastRolled = true;

    let jailActionDesc = "";

    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        state.dice.doublesCount = 0;
        movePlayer(player, sum);
        checkLandedSpaceAction(player);
        jailActionDesc = `${player.name} rolled doubles (${d1}, ${d2}) and escaped Jail! Moved to ${getCurrentProperty(player).name}`;
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          // Force pay $50 to get out on 3rd turn failure
          player.inJail = false;
          player.jailTurns = 0;
          player.balance -= 50;
          state.bank.balance += 50;
          movePlayer(player, sum);
          checkLandedSpaceAction(player);
          jailActionDesc = `${player.name} failed to roll doubles for 3 turns. Forced to pay $50 fine and moved to ${getCurrentProperty(player).name}`;
        } else {
          state.landedActionResolved = true;
          jailActionDesc = `${player.name} rolled (${d1}, ${d2}) in Jail. Turn ${player.jailTurns} of 3.`;
        }
      }
    } else {
      if (isDouble) {
        state.dice.doublesCount++;
        if (state.dice.doublesCount === 3) {
          sendToJail(state, player);
          state.dice.doublesCount = 0;
          state.dice.lastRolled = true; // Turn ends, but rolling doubles is reset
          state.landedActionResolved = true;
          jailActionDesc = `${player.name} rolled 3 consecutive doubles and went directly to JAIL!`;
        } else {
          movePlayer(player, sum);
          checkLandedSpaceAction(player);
          jailActionDesc = `${player.name} rolled doubles (${d1}, ${d2}). Moves to ${getCurrentProperty(player).name} and rolls again.`;
        }
      } else {
        state.dice.doublesCount = 0;
        movePlayer(player, sum);
        checkLandedSpaceAction(player);
        jailActionDesc = `${player.name} rolled (${d1}, ${d2}) and moved to ${getCurrentProperty(player).name}`;
      }
    }

    logEvent("DICE_ROLL", jailActionDesc);
    saveToLocalStorage();
    return { values: [d1, d2], isDouble, message: jailActionDesc };
  }

  function checkLandedSpaceAction(player) {
    const prop = getCurrentProperty(player);
    
    if (prop.type === "go" || prop.type === "parking" || prop.type === "jail" || prop.type === "gotojail") {
      state.landedActionResolved = true;
      return;
    }

    if (prop.type === "property" || prop.type === "railroad" || prop.type === "utility") {
      if (!prop.ownerId) {
        state.landedActionResolved = false;
      } else if (prop.ownerId === player.id) {
        state.landedActionResolved = true;
      } else {
        state.landedActionResolved = prop.isMortgaged; // resolved if mortgaged, else not
      }
      return;
    }

    if (prop.type === "tax") {
      state.landedActionResolved = false;
      return;
    }

    if (prop.type === "chance" || prop.type === "chest") {
      state.landedActionResolved = false;
      return;
    }

    state.landedActionResolved = true;
  }

  function movePlayer(player, steps) {
    const oldPos = player.position;
    const newPos = (oldPos + steps) % 40;
    
    player.position = newPos;
    
    // Pass GO logic (GO index is 0)
    if (newPos < oldPos) {
      player.balance += 200;
      state.bank.balance -= 200;
      logEvent("PASS_GO", `${player.name} collected $200 for passing GO`);
    }
  }

  function movePlayerTo(s, player, targetSpace, passGoEarn = true, overrides = {}) {
    const oldPos = player.position;
    player.position = targetSpace;

    if (passGoEarn && targetSpace < oldPos) {
      player.balance += 200;
      s.bank.balance -= 200;
      logEvent("PASS_GO", `${player.name} collected $200 for passing GO`);
    }

    const prop = s.properties.find(p => p.id === targetSpace);
    let desc = `${player.name} advanced to ${prop.name}`;
    logEvent("MOVE_TO", desc);

    checkLandedSpaceAction(player);
  }

  function sendToJail(s, player) {
    player.inJail = true;
    player.jailTurns = 0;
    player.position = 10; // Jail Space is index 10
    logEvent("JAIL", `${player.name} was sent directly to Jail`);
  }

  function payJailFine(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player || !player.inJail) return { success: false, error: "Player is not in jail" };

    const result = executeTransaction(playerId, "bank", 50, "JAIL_FINE");
    if (result.success) {
      player.inJail = false;
      player.jailTurns = 0;
      saveToLocalStorage();
    }
    return result;
  }

  function useJailCard(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player || !player.inJail) return { success: false, error: "Player is not in jail" };
    if (player.getOutOfJailCards <= 0) return { success: false, error: "Player has no Get Out of Jail Free cards" };

    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    logEvent("JAIL_ESCAPE", `${player.name} used a Get Out of Jail Free card and was released.`);
    saveToLocalStorage();
    return { success: true };
  }

  function nextTurn() {
    // Determine next active player
    let attempts = 0;
    do {
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      attempts++;
    } while (state.players[state.currentPlayerIndex].isBankrupt && attempts < state.players.length);

    state.dice.lastRolled = false;
    state.dice.doublesCount = 0;
    state.landedActionResolved = true; // Clear resolved state for new turn (must roll to proceed)

    const nextPlayer = state.players[state.currentPlayerIndex];
    logEvent("NEXT_TURN", `It is now ${nextPlayer.name}'s turn`);
    saveToLocalStorage();
    return nextPlayer;
  }

  // ─── CHANCE & COMMUNITY CHEST DECK SYSTEM ───────────────────────────────────
  function drawChanceOrChest(playerId, type) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return null;

    let deck = type === "chance" ? state.chanceDeck : state.chestDeck;
    let cards = type === "chance" ? CHANCE_CARDS : CHEST_CARDS;

    if (deck.length === 0) {
      // Reshuffle deck
      deck = shuffleDeck([...Array(cards.length).keys()]);
      if (type === "chance") state.chanceDeck = deck;
      else state.chestDeck = deck;
      logEvent("RESHUFFLE", `Reshuffled the ${type} card deck`);
    }

    const cardIndex = deck.pop();
    const card = cards[cardIndex];
    
    const oldPos = player.position;

    // Execute action
    card.action(state, player);

    // If card did not move player, we resolve the landed space action immediately.
    // If it did move, movePlayerTo will run checkLandedSpaceAction for the new position.
    if (player.position === oldPos) {
      state.landedActionResolved = true;
    }

    logEvent("CARD_DRAW", `${player.name} drew ${type.toUpperCase()}: "${card.title}" - ${card.desc}`);
    saveToLocalStorage();

    return { card, deckLeft: deck.length };
  }

  // ─── BANKRUPTCY ENGINE ──────────────────────────────────────────────────────
  function declareBankruptcy(playerId, creditorId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { success: false, error: "Invalid player" };

    player.isBankrupt = true;
    player.balance = 0;

    let desc = "";

    if (creditorId === "bank") {
      // Assets transfer back to the Bank. Properties are unmortgaged and houses are cleared.
      state.properties.forEach(p => {
        if (p.ownerId === playerId) {
          p.ownerId = null;
          p.houses = 0;
          p.isMortgaged = false;
        }
      });
      desc = `${player.name} declared bankruptcy to the Bank. All properties returned to the Bank.`;
    } else {
      const creditor = state.players.find(p => p.id === creditorId);
      // Properties transfer to the creditor. 
      // Rule: Creditor must pay 10% fee immediately for mortgaged properties transferred, 
      // or unmortgage them immediately by paying cost + 10%.
      state.properties.forEach(p => {
        if (p.ownerId === playerId) {
          p.ownerId = creditorId;
          p.houses = 0; // Houses are demolished upon transfer
        }
      });
      creditor.getOutOfJailCards += player.getOutOfJailCards;
      player.getOutOfJailCards = 0;
      desc = `${player.name} declared bankruptcy to ${creditor.name}. All assets and cards transferred.`;
    }

    logEvent("BANKRUPTCY", desc);
    saveToLocalStorage();
    return { success: true };
  }

  // ─── HELPERS & GETTERS ──────────────────────────────────────────────────────
  function getFormattedAmount(amount) {
    const symbol = EDITIONS[state.edition].currency;
    return `${symbol}${amount}`;
  }

  function getPropertyName(id) {
    if (id === null || id === undefined) return "";
    const prop = state.properties.find(p => p.id === id);
    return prop ? prop.name : `Space ${id}`;
  }

  function getCurrentProperty(player) {
    return state.properties.find(p => p.id === player.position);
  }

  function countPlayerBuildings(s, playerId) {
    let houses = 0;
    let hotels = 0;
    s.properties.forEach(p => {
      if (p.ownerId === playerId && p.type === "property") {
        if (p.houses === 5) hotels++;
        else houses += p.houses;
      }
    });
    return { houses, hotels };
  }

  // ─── PUBLIC API ─────────────────────────────────────────────────────────────
  return {
    EDITIONS,
    BOARD_LAYOUT,
    CHANCE_CARDS,
    CHEST_CARDS,
    getState: () => state,
    initGame,
    executeTransaction,
    undoLastEvent,
    buyProperty,
    mortgageProperty,
    unmortgageProperty,
    buildHouse,
    sellHouse,
    calculateRent,
    triggerRentPayment,
    executeAuction,
    executeTrade,
    rollDice,
    payJailFine,
    useJailCard,
    nextTurn,
    drawChanceOrChest,
    declareBankruptcy,
    getFormattedAmount,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  };
})();

// Export support
if (typeof module !== "undefined" && module.exports) {
  module.exports = Monopoly;
} else if (typeof window !== "undefined") {
  window.Monopoly = Monopoly;
}
