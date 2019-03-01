import { NgModule } from "@angular/core";
import { IonicPageModule, IonicModule } from "ionic-angular";
import { AddMacPage } from "./add-mac";

@NgModule({
  declarations: [AddMacPage],
  imports: [IonicPageModule.forChild(AddMacPage), IonicModule],
  exports: [AddMacPage]
})
export class AddMacPageModule {}
