import { Component, ViewChild } from '@angular/core';
import { Platform, IonRouterOutlet, NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DAppService } from './services/dapp.service';

@Component({
  selector: 'my-app',
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(IonRouterOutlet, {static: true}) routerOutlet: IonRouterOutlet;

  constructor(private platform: Platform, private navCtrl: NavController, dappService: DAppService) {
    platform.ready().then(async () => {
      // Make sure to wait for platform to be ready before navigating to the first screen. Otherwise
      // plugins such as AppManager or TitleBarManager are not ready.

      // Root screen is decided by the dapp service
      await dappService.init();
    });
  }

  /**
   * Listen to back key events. If the default router can go back, just go back.
   * Otherwise, exit the application.
   */
  setupBackKeyNavigation() {
    this.platform.backButton.subscribeWithPriority(0, () => {
      console.log("BACK")
      if (this.routerOutlet && this.routerOutlet.canGoBack()) {
        this.routerOutlet.pop();
      } else {
        navigator['app'].exitApp();
      }
    });
  }
}
