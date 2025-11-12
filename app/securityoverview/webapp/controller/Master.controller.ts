import Controller from "sap/ui/core/mvc/Controller";
import ui5Event from "sap/ui/base/Event";
import Component from "../Component";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";
import MessageToast from "sap/m/MessageToast";
import ODataModelV4 from "sap/ui/model/odata/v4/ODataModel";

/**
 * @namespace flexso.cap.htf.securityoverview.controller
 */
export default class Master extends Controller {
  private appViewModel: JSONModel;

  public onInit(): void {
    // Routing setup
    const router = (this.getOwnerComponent() as Component).getRouter();
    router.getRoute("master")?.attachMatched(this.onRouteMatched.bind(this));
    router.getRoute("masterWithSelection")?.attachMatched(this.onRouteMatched.bind(this));

    // Local model to track if a location is selected
    this.appViewModel = new JSONModel({
      hasSelectedLocation: false
    });

    this.getView()?.setModel(this.appViewModel, "app");
  }

  private onRouteMatched(event: Route$MatchedEvent): void {
    let cameraImageGuid = "";

    const routeName = event.getParameter("name");
    if (routeName === "master") {
      this.appViewModel.setProperty("/hasSelectedLocation", false);
      this.getView()?.unbindElement("");
      return;
    }

    if (routeName === "masterWithSelection") {
      const args = (event.getParameter("arguments") as any) || {};
      cameraImageGuid = args.id || "";

      this.appViewModel.setProperty("/hasSelectedLocation", !!cameraImageGuid);

      if (!cameraImageGuid) return;

      const keySegment = cameraImageGuid.startsWith("guid'")
        ? `(${cameraImageGuid})`
        : `(guid'${cameraImageGuid}')`;

      this.getView()?.bindElement({ path: `/CameraImages${keySegment}` });
    }
  }

  /**
   * Triggered when a user selects a location from the dropdown.
   * Uses the backend function getCamerarecordingIdForLocation(location)
   * to fetch the corresponding camera image ID for that location.
   */
  //HACK THE FUTURE Challenge:
  //When a location is selected, we want to route to a different page with the details for the camera image of that location
  //The camera image GUID is different than the location guid, maybe you can write some code to get the correct one?
    
  public async onSelectLocation(oEvent: ui5Event): Promise<void> {
    const selectedItem = (oEvent as any).getParameter("selectedItem");
    const ctx = selectedItem?.getBindingContext();
    if (!ctx) return;

    const locationId = ctx.getProperty("ID");
    if (!locationId) return;

    const model = (this.getOwnerComponent() as UIComponent).getModel() as ODataModelV4;
    if (!model) return;

    try {
      // Construct function call
      const functionPath = `/getCamerarecordingIdForLocation(location=guid'${locationId}')`;
      const functionContext = model.bindContext(functionPath);

      // Execute the function and await result
      const result = await functionContext.requestObject();

      console.log("Function result (V4):", result);

      const cameraImageGuid = result?.value;
      if (!cameraImageGuid) {
        MessageToast.show("No camera image found for this location.");
        return;
      }

      // Navigate to detail route
      const router = (this.getOwnerComponent() as UIComponent).getRouter();
      router.navTo("masterWithSelection", { id: cameraImageGuid });

    } catch (err) {
      console.error("Failed to load camera image for location:", err);
      MessageToast.show("Error loading camera image data.");
    }
  }
}
