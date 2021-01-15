import { Component } from '@angular/core';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-deadend',
  templateUrl: 'deadend.html',
  styleUrls: ['deadend.scss']
})
export class DeadEndPage {
  constructor() {}

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Forbidden");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }
}
