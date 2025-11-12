import * as cds from "@sap/cds";
const { Symbol, SymbolTranslation } = cds.entities;

export const translate = async (req: cds.Request) => {
  req.params.forEach(async (id) => {
    //HACK THE FUTURE Challenge
    //The Symbol entity contains all records that are already translated or will be translated by this action
    //The Symbol Translation entity contains all translation mapping
    //Don't forget that we should be able to translate whole strings, not only singluar symbols

    // Normalize the bound key: { ID } / { id } 

    // Read the symbol row that will be translated
    const sym = await SELECT.one.from(Symbol).columns("ID", "symbol", "language").where({ ID: key });
    if (!sym) return;

    // Full-string mapping first
    let direct = await SELECT.one
      .from(SymbolTranslation)
      .columns("translation")
      .where({ language: sym.language, symbol: sym.symbol });

    let translated: string;

    if (direct?.translation) {
      translated = direct.translation;
    } else {
      // NOT FOUND then apply all rules to support whole strings
      const rules = (await SELECT.from(SymbolTranslation)
        .columns("symbol", "translation")
        .where({ language: sym.language })) as Array<{ symbol: string; translation: string }>;

      translated = sym.symbol;
      if (Array.isArray(rules) && rules.length) {
        for (const r of rules) {
          if (r.symbol) translated = translated.split(r.symbol).join(r.translation);
        }
      }

      // Fallback if nothing changed
      if (translated === sym.symbol) translated = `[${sym.language}] ${sym.symbol}`;
    }

    // Translation back on Symbol
    await UPDATE(Symbol).set({ translation: translated }).where({ ID: sym.ID });


    const record = await SELECT.from(Symbol).where({ ID: id });

  });
};
