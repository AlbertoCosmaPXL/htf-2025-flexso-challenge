import Controller from "sap/ui/core/mvc/Controller";
import ui5Event from "sap/ui/base/Event";
import Component from "../Component";
import { LayoutType } from "sap/f/library";
import JSONModel from "sap/ui/model/json/JSONModel";
import UIComponent from "sap/ui/core/UIComponent";
import { Route$MatchedEvent } from "sap/ui/core/routing/Route";

/**
 * @namespace flexso.cap.htf.securityoverview.controller
 */
export default class Master extends Controller {
  private appViewModel: JSONModel;

  public onInit(): void {
    //Routings can be tricky! Don't hesitate to ask for help if you get stuck
    const router = (this.getOwnerComponent() as Component).getRouter();
    router.getRoute("master")?.attachMatched(this.onRouteMatched.bind(this));
    router.getRoute("masterWithSelection")?.attachMatched(this.onRouteMatched.bind(this));

    //This is a local JSON Model that tracks whether a location is selected or not
    this.appViewModel = new JSONModel({
      hasSelectedLocation: false
    });

    // Making the view model available to the view
    this.getView()?.setModel(this.appViewModel, "app");
  }

  private onRouteMatched(event: Route$MatchedEvent): void {
    //Here we will also have to pass along the correct camera image guid to the view
    //Once that happens, we can start filling our frontend with data about the camera image
    //That way we will discovered what is happening at that location and possibly solve the mystery
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

      // Binding to the specific CameraImage entity
      const keySegment = cameraImageGuid.startsWith("guid'")
        ? `(${cameraImageGuid})`
        : `(guid'${cameraImageGuid}')`;

      this.getView()?.bindElement({ path: `/CameraImages${keySegment}` });
    }
  }

  public onSelectLocation(oEvent: ui5Event): void {
    //HACK THE FUTURE Challenge:
    //When a location is selected, we want to route to a different page with the details for the camera image of that location
    //The camera image GUID is different than the location guid, maybe you can write some code to get the correct one?
    let cameraImageGuid = "";

    const listItemOrSource: any =
      (oEvent as any).getParameter?.("listItem") ?? oEvent.getSource?.();

    const ctx = listItemOrSource?.getBindingContext?.();
    if (ctx) {
      cameraImageGuid =
        ctx.getProperty("cameraImage_ID") ??
        ctx.getProperty("cameraImageId") ??
        ctx.getProperty("CameraImage_ID") ??
        ctx.getProperty("CameraImageId") ??
        "";

      // Fallback: if the navigation object is expanded
      if (!cameraImageGuid) {
        const nav = ctx.getProperty("cameraImage") ?? ctx.getProperty("CameraImage");
        if (nav?.ID) cameraImageGuid = nav.ID;
      }
    }

    if (!cameraImageGuid) return;

    const router = (this.getOwnerComponent() as UIComponent).getRouter();
    router.navTo("masterWithSelection", {
      id: cameraImageGuid
    });
  }
}
