/* eslint-disable linebreak-style */
import Dialog from "sap/m/Dialog";
import ListItemBase from "sap/m/ListItemBase";
import Table from "sap/m/Table";
import Fragment from "sap/ui/core/Fragment";
import Controller from "sap/ui/core/mvc/Controller";
import Binding from "sap/ui/model/Binding";
import JSONModel from "sap/ui/model/json/JSONModel";
import Context from "sap/ui/model/odata/v4/Context";
import ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import MessageToast from "sap/m/MessageToast";

/**
 * @namespace flexso.cap.htf.symboltranslation.controller
 */
export default class Master extends Controller {
  creationDialog: Dialog;
  table: Table;

  /*eslint-disable @typescript-eslint/no-empty-function*/
  public onInit(): void {
    this.table = this.byId("idProductsTable") as Table;
  }

/**
 * Loads available subnautic locations and sets them as a JSON model for the ComboBox.
 */
  private async _loadLocations(): Promise<void> {
    const oDataModel = this.getView()?.getModel() as ODataModel;
    if (!oDataModel) return;

    try {
      // Create a list binding to /SubnauticLocation
      const listBinding = oDataModel.bindList("/SubnauticLocation");
      const contexts = await listBinding.requestContexts();
      const locations = contexts.map((ctx) => ctx.getObject());

      // Map only what we need
      const formatted = locations.map((loc: any) => ({
        id: loc.ID,
        name: loc.name
      }));

      const locationModel = new JSONModel(formatted);
      this.getView()?.setModel(locationModel, "locations");
      console.log("✅ Loaded locations:", formatted);
    } catch (err) {
      console.error("❌ Failed to load locations:", err);
      MessageToast.show("Error loading subnautic locations.");
    }
  }


  /**
   * Loads unique languages from /Languages (preferred) or /SymbolTranslations (fallback)
   * and sets them as a JSON model for the ComboBox in the creation dialog.
   */
  private async _loadLanguages(): Promise<void> {
    const oDataModel = this.getView()?.getModel() as ODataModel;
    if (!oDataModel) return;

    try {
      // Create a list binding to /Languages
      const listBinding = oDataModel.bindList("/Languages");

      // Execute the read
      const contexts = await listBinding.requestContexts();
      const langs = contexts.map((ctx) => ctx.getObject());

      // Build unique list of languages
      const uniqueLangs = [...new Set(langs.map((r: any) => r.language))].map(
        (lang) => ({ language: lang })
      );

      const languageModel = new JSONModel(uniqueLangs);
      this.getView()?.setModel(languageModel, "languages");
      console.log("✅ Loaded unique languages:", uniqueLangs);

    } catch (err) {
      console.error("❌ Failed to load languages:", err);
      MessageToast.show("Error loading available languages.");
    }
  }


  async addIcon() {
    const createModel = new JSONModel({
      symbol: "",
      whereFound: "",
      language: "",
    });

    if (!this.creationDialog) {
      this.creationDialog ??= (await Fragment.load({
        name: "flexso.cap.htf.symboltranslation.view.fragments.create",
        controller: this,
      })) as Dialog;

      this.getView()?.addDependent(this.creationDialog);
    }

    // Load available unique languages before opening dialog
    await this._loadLanguages();
    await this._loadLocations();

    this.creationDialog.setModel(createModel, "create");

    this.creationDialog.open();
  }

  save() {
    //This is save logic for creating a new Symbol
    const listBinding = this.getView()
      ?.getModel()
      ?.bindList("/Symbols") as ODataListBinding;

    const data = this.creationDialog.getModel("create");

    listBinding.create({
      symbol: data?.getProperty("/symbol") as string,
      whereFound: data?.getProperty("/whereFound") as string,
      language: data?.getProperty("/language") as string,
    });

    this.creationDialog.close();
    (this.table.getBinding("items") as Binding).refresh();
  }

  closeDialog() {
    this.creationDialog.close();
  }

  async translate() {
    //The code below is standard code for calling an OData Action bound to an entity in a list
    this.table.getSelectedItems().forEach(async (item: ListItemBase) => {
      const contextBinding = this.getView()
        ?.getModel()
        ?.bindContext(
          `${(
            item.getBindingContext() as Context
          ).getPath()}/AdminService.translateSymbolBound(...)`,
          item.getBindingContext() as Context
        ) as ODataContextBinding;

      await contextBinding.invoke();
      (this.table.getBinding("items") as Binding).refresh();
    });
  }
}
