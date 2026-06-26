// ============================================================
//  BANKA - kompletny vycisteny kod
// ============================================================

class BANK {
  constructor() {
    this.ucty = [];
    this.dalsieID = 1;
  }

  // Vytvori bezny ucet s automatickym ID
  vytvorUcet(majitel, zostatok, pin, dennyLimit) {
    const novyUcet = new Account(majitel, zostatok, this.dalsieID, pin, dennyLimit);
    this.dalsieID += 1;
    this.ucty.push(novyUcet);
    console.log("Vytvoreny ucet " + majitel + " s ID " + novyUcet.id);
    return novyUcet;
  }

  // Prida uz hotovy ucet (sporiaci, kreditny, pod-ucet) a pridelí mu ID
  pridajUcet(ucet) {
    ucet.id = this.dalsieID;
    this.dalsieID += 1;
    this.ucty.push(ucet);
    console.log("Pridany ucet: " + ucet.majitel + " s ID " + ucet.id);
    return ucet;
  }

  vypisUcty() {
    console.log("----- UCTY V BANKE SLSP -----");
    for (const ucet of this.ucty) {
      console.log("ID " + ucet.id + " | " + ucet.majitel + ": " + ucet.zostatok + " EUR");
    }
  }

  najdiIDUCET(id) {
    const najdeny = this.ucty.find((ucet) => ucet.id === id);
    if (najdeny === undefined) {
      console.log("Ucet s ID " + id + " neexistuje.");
      return null;
    }
    return najdeny;
  }

  prevod(zID, naID, suma) {
    const odosielatel = this.najdiIDUCET(zID);
    const prijemca = this.najdiIDUCET(naID);

    if (odosielatel === null || prijemca === null) {
      console.log("Prevod zlyhal - ucet neexistuje.");
      return;
    }
    if (suma <= 0) {
      console.log("Zadajte platnu sumu prosim.");
      return;
    }
    if (odosielatel.zostatok < suma) {
      console.log("Nedostatok prostriedkov na ucte.");
      return;
    }

    odosielatel.zostatok = odosielatel.zostatok - suma;
    prijemca.zostatok = prijemca.zostatok + suma;

    // Zapis do historie OBOM uctom - ako objekt (rovnako ako vklad/vyber)
    odosielatel.historia.push({
      typ: "Prevod odoslany",
      suma: suma,
      zostatokPotom: odosielatel.zostatok,
      kedy: new Date()
    });
    prijemca.historia.push({
      typ: "Prevod prijaty",
      suma: suma,
      zostatokPotom: prijemca.zostatok,
      kedy: new Date()
    });

    console.log("Previedlo sa " + suma + " EUR z uctu " + odosielatel.majitel + " na ucet " + prijemca.majitel);
  }

  celkoveImanie() {
    return this.ucty.reduce((spolu, ucet) => spolu + ucet.zostatok, 0);
  }

  bohateUcty(hranica) {
    return this.ucty.filter((ucet) => ucet.zostatok > hranica);
  }

  vratMena() {
    return this.ucty.map((ucet) => ucet.majitel);
  }

  menaBohatych(hranica) {
    return this.ucty
      .filter((ucet) => ucet.zostatok > hranica)
      .map((ucet) => ucet.majitel);
  }
  uloz() {
  const data = JSON.stringify(this.ucty);   // pole účtov → text
  localStorage.setItem("bankaUcty", data);  // ulož pod menovku "bankaUcty"
  localStorage.setItem("bankaID", this.dalsieID);   // ulož aj počítadlo ID
  console.log("Dáta uložené.");
}
}

// ============================================================
//  ZAKLADNY UCET
// ============================================================

class Account {
  constructor(majitel, zostatok, id, pin, dennyLimit) {
    this.majitel = majitel;
    this.zostatok = zostatok;
    this.id = id;
    this.pin = pin;
    this.dennyLimit = dennyLimit;
    this.dnesVybrane = 0;
    this.historia = [];
  }

  overPIN(pin) {
    if (this.pin !== pin) {
      console.log("NESPRAVNY PIN");
      return false;
    }
    return true;
  }

  overid(id) {
    if (id !== this.id) {
      console.log("ZLE ID STE ZADALI, SKUSTE ZNOVU.");
      return false;
    }
    return true;
  }

  vklad(suma, id, pin) {
    if (this.overid(id) === false) return;
    if (this.overPIN(pin) === false) return;

    this.zostatok = this.zostatok + suma;
    this.historia.push({
      typ: "Vklad",
      suma: suma,
      zostatokPotom: this.zostatok,
      kedy: new Date()
    });
    console.log("Vlozene: " + suma + " EUR, zostatok: " + this.zostatok + " EUR");
  }

  vyber(suma, id, pin) {
    if (this.overid(id) === false) return;
    if (this.overPIN(pin) === false) return;

    if (this.dnesVybrane + suma > this.dennyLimit) {
      console.log("Prekroceny denny limit. Dnes uz vybrane: " + this.dnesVybrane + " / " + this.dennyLimit + " EUR");
      return;
    }
    if (suma > this.zostatok) {
      console.log("NEMATE DOSTATOK PROSTRIEDKOV.");
      return;
    }

    this.zostatok = this.zostatok - suma;
    this.dnesVybrane = this.dnesVybrane + suma;
    this.historia.push({
      typ: "Vyber",
      suma: suma,
      zostatokPotom: this.zostatok,
      kedy: new Date()
    });
    console.log("Vybrane: " + suma + " EUR, zostatok: " + this.zostatok + " EUR");
  }

  vypisHistoriu() {
    console.log("--- Historia uctu " + this.majitel + " ---");
    for (const t of this.historia) {
      console.log(t.typ + ": " + t.suma + " EUR, zostatok: " + t.zostatokPotom + " EUR (" + t.kedy.toLocaleString() + ")");
    }
  }

  vypis() {
    console.log("Ucet majitela: " + this.majitel + ", Zostatok: " + this.zostatok + ", ID: " + this.id);
  }

  async zostatokVMene(mena) {
    try {
      const odpoved = await fetch("https://open.er-api.com/v6/latest/EUR");
      const data = await odpoved.json();
      const kurz = data.rates[mena];
      const prepocet = this.zostatok * kurz;
      return this.majitel + ": " + this.zostatok + " EUR = " + prepocet.toFixed(2) + " " + mena;
    } catch (chyba) {
      return "Nepodarilo sa zistit kurz";
    }
  }
}

// ============================================================
//  SPORIACI UCET - bezny ucet + urok
// ============================================================

class SporiaciUcet extends Account {
  constructor(majitel, zostatok, id, pin, dennyLimit, urok) {
    super(majitel, zostatok, id, pin, dennyLimit);
    this.urok = urok;
  }

  pripisUrok() {
    const pridane = this.zostatok * (this.urok / 100);
    this.zostatok = this.zostatok + pridane;
    this.historia.push({
      typ: "Urok",
      suma: pridane,
      zostatokPotom: this.zostatok,
      kedy: new Date()
    });
    console.log("Pripisany urok " + this.urok + "%: +" + pridane.toFixed(2) + " EUR, zostatok: " + this.zostatok + " EUR");
  }
}

// ============================================================
//  KREDITNY UCET - moze ist do minusu po limit
// ============================================================

class KreditnyUcet extends Account {
  constructor(majitel, zostatok, id, pin, dennyLimit, limit) {
    super(majitel, zostatok, id, pin, dennyLimit);
    this.limit = limit;   // kladne cislo, napr. 1000 = moze do -1000
  }

  // OVERRIDE - prepiseme vyber, povolime minus po limit
  vyber(suma, id, pin) {
    if (this.overid(id) === false) return;
    if (this.overPIN(pin) === false) return;

    if (this.zostatok - suma < -this.limit) {
      console.log("Prekroceny kreditny limit! Zostatok: " + this.zostatok + " EUR, limit: -" + this.limit + " EUR");
      return;
    }

    this.zostatok = this.zostatok - suma;
    this.historia.push({
      typ: "Vyber (kredit)",
      suma: suma,
      zostatokPotom: this.zostatok,
      kedy: new Date()
    });
    console.log("Vybrane: " + suma + " EUR, zostatok: " + this.zostatok + " EUR (limit: -" + this.limit + ")");
  }
}

// ============================================================
//  POD-UCET - patri pod hlavny ucet
// ============================================================

class PodUcet extends Account {
  constructor(zostatok, id, pin, dennyLimit, hlavnyUcet) {
    super(hlavnyUcet.majitel, zostatok, id, pin, dennyLimit);
    this.hlavnyUcet = hlavnyUcet;
    console.log("Vytvoreny POD-UCET pre " + hlavnyUcet.majitel);
  }

  posliNaHlavny(suma) {
    if (suma > this.zostatok) {
      console.log("Nedostatok prostriedkov na pod-ucte.");
      return;
    }
    this.zostatok = this.zostatok - suma;
    this.hlavnyUcet.zostatok = this.hlavnyUcet.zostatok + suma;
    console.log("Preslo " + suma + " EUR z pod-uctu na hlavny ucet " + this.hlavnyUcet.majitel);
  }
}

// ============================================================
//  SKUSANIE
// ============================================================

const banka = new BANK();

// Bezne ucty (majitel, zostatok, pin, dennyLimit) - ID automaticke
banka.vytvorUcet("Matus", 15000, 1234, 1000);   // ID 1
banka.vytvorUcet("Jana", 7820, 5678, 1000);     // ID 2

// Sporiaci ucet (majitel, zostatok, id, pin, dennyLimit, urok)
const sporenie = new SporiaciUcet("Anna", 10000, 0, 1111, 1000, 5);
banka.pridajUcet(sporenie);   // dostane ID 3

// Kreditny ucet (majitel, zostatok, id, pin, dennyLimit, limit)
const karta = new KreditnyUcet("Jozef", 500, 0, 4321, 1000, 1000);
banka.pridajUcet(karta);      // dostane ID 4

// --- Test bezneho uctu ---
const matus = banka.najdiIDUCET(1);
matus.vklad(500, 1, 1234);
matus.vyber(300, 1, 1234);
matus.vypisHistoriu();


banka.vypisUcty();

// ============================================================
//  PREPOJENIE NA STRANKU (DOM)
// ============================================================
const tlacidlo2 = document.getElementById("tlacidlo2");   // bez #
if (tlacidlo2) {
  tlacidlo2.addEventListener("click", function () {        // tlacidlo2.add..., nič nepriraď
    const odosielatel = Number(document.getElementById("fromAcc").value);
    const prijemca = Number(document.getElementById("toAcc").value);
    const suma = Number(document.getElementById("transferAmount").value);
    banka.prevod(odosielatel, prijemca, suma);
  });
}



// Vytvorenie uctu cez tlacidlo
const tlacidlo1 = document.getElementById("tlacidlo1");
if (tlacidlo1) {
  tlacidlo1.addEventListener("click", function () {
    const meno = document.getElementById("meno").value;
    const zostatok = Number(document.getElementById("zostatok").value);
    banka.vytvorUcet(meno, zostatok, 0, 1000);   // PIN 0, limit 1000 (zatial napevno)
  });
}

// Prepocet meny cez tlacidlo
const tlacidlo = document.getElementById("tlacidlo");
if (tlacidlo) {
  tlacidlo.addEventListener("click", async function () {
    const id = Number(document.getElementById("kurzId").value);
    const mena = document.getElementById("kurzMena").value;

    const ucet = banka.najdiIDUCET(id);
    if (ucet === null) {
      document.getElementById("kurzVysledok").textContent = "Ucet neexistuje!";
      return;
    }

    const vysledok = await ucet.zostatokVMene(mena);
    document.getElementById("kurzVysledok").textContent = vysledok;
  });
}