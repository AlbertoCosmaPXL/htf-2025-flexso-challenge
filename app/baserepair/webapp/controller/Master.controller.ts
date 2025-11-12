import Controller from "sap/ui/core/mvc/Controller";
import Component from "../Component";
import formatter from "../model/formatter";
import ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import Context from "sap/ui/model/odata/v4/Context";
import Binding from "sap/ui/model/Binding";
import ListItemBase from "sap/m/ListItemBase";
import Table from "sap/m/Table";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import Sorter from "sap/ui/model/Sorter";
import BusyIndicator from "sap/ui/core/BusyIndicator";
import ProcessFlowLaneHeader from "sap/suite/ui/commons/ProcessFlowLaneHeader";
import ProcessFlow from "sap/suite/ui/commons/ProcessFlow";
import ListItem from "sap/ui/core/ListItem";
import ui5Event from "sap/ui/base/Event";
/**
 * @namespace flexso.cap.htf.baserepair.controller
 */
export default class Master extends Controller {
  formatter = formatter;
  table: Table;
  orderDialog: Dialog;

  public onInit(): void {
    (this.getOwnerComponent() as Component)
      .getRouter()
      .attachRouteMatched(this.onRouteMatched, this);
  }

  onRouteMatched() {
    this.getView()?.bindObject({
      path: "/ProductCamera('0a85863f-100d-4e0b-91a1-89897f4490d6')",
      parameters: {
        $expand: "materials",
      },
    });

    this.table = this.byId("idMaterialTable") as Table;
  }

  async order() {
    const orderModel = new JSONModel({
      amount: 0,
    });

    if (!this.orderDialog) {
      this.orderDialog ??= (await Fragment.load({
        name: "flexso.cap.htf.baserepair.view.fragments.order",
        controller: this,
      })) as Dialog;

      this.getView()?.addDependent(this.orderDialog);
    }

    this.orderDialog.setModel(orderModel, "order");

    this.orderDialog.open();
  }

  async saveOrder() {
    this.orderDialog.close();
    BusyIndicator.show();
    const amount = parseInt(
      this.orderDialog.getModel("order")?.getProperty("/amount") as string
    );

    if (amount === 0 || amount === undefined) {
      BusyIndicator.hide();
      return;
    }
    this.table.getSelectedItems().forEach(async (item: ListItemBase) => {
      const contextBinding = this.getView()
        ?.getModel()
        ?.bindContext(
          `${(
            item.getBindingContext() as Context
          ).getPath()}/AdminService.order(...)`,
          item.getBindingContext() as Context
        ) as ODataContextBinding;

      contextBinding.setParameter(
        "amount",
        parseInt(
          this.orderDialog.getModel("order")?.getProperty("/amount") as string
        )
      );

      contextBinding.setParameter(
        "id",
        item.getBindingContext()!.getProperty("ID")
      );

      await contextBinding.invoke();
      this.refresh();
      BusyIndicator.hide();
    });
  }
  closeDialog() {
    this.orderDialog.close();
  }

  refresh() {
    this.table.getModel()?.refresh();
  }

  async produce() {
    //HACK THE FUTURE Challenge:
    //Write code to trigger AdminService.produce action 
    //You can base yourself on existing action code from the symboltranslation app
    BusyIndicator.show();
    try {
      const viewCtx = this.getView()?.getBindingContext() as Context;
      if (!viewCtx) return;

      const ctxBinding = this.getView()
        ?.getModel()
        ?.bindContext(`${viewCtx.getPath()}/AdminService.produce(...)`, viewCtx) as ODataContextBinding;

      // No parameters for produce()
      await ctxBinding.invoke();

      this.refresh();
    } finally {
      BusyIndicator.hide();
    }
  }


  refeshProducton() {
    const processFlow = this.byId("processflow") as ProcessFlow;
    processFlow.updateModel();
  }

  async replaceCamera(event: ui5Event) {
  const listItem = event.getParameter("listItem" as never) as ListItem;

  //HACK THE FUTURE Challenge:
  //Write code to trigger AdminService.replace action on the selected installation
  //Some backend code will have to be implemented as well!
  if (!listItem) return;

  BusyIndicator.show();
  try {
    const ctx = listItem.getBindingContext() as Context;
    const id = ctx.getProperty("ID"); // UUID of the selected Installation
    if (!id) return;

    // Using fully-qualified entity set name to avoid relative path issues
    const actionPath = `/AdminService.Installation('${id}')/AdminService.replace(...)`;

    const actionBinding = this.getView()
      ?.getModel()
      ?.bindContext(actionPath) as ODataContextBinding;

    actionBinding.setParameter("id", id);

    await actionBinding.invoke();

    this.refresh();
    this.refeshProducton();
  } finally {
    BusyIndicator.hide();
  }
}


}
