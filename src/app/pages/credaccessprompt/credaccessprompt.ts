import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DAppService } from 'src/app/services/dapp.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-credaccessprompt',
  templateUrl: 'credaccessprompt.html',
  styleUrls: ['credaccessprompt.scss']
})
export class CredAccessPromptPage {
  constructor(public navCtrl: NavController, public dappService: DAppService) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Sign in");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  elastOSSignIn() {
    let responseParams = {
      action: "external"
    };
    appManager.sendIntentResponse(null, responseParams, this.dappService.getReceivedIntent().intentId, ()=>{
      console.log("Proxy intent response sent, original request:", this.dappService.getReceivedIntent(), "Response params:", responseParams);
    }, (err)=>{
      console.log("Failed to send intent response:", err);
    });
  }

  /**
   * User wants to create a temporary identity internally in the trinity native app. We send this information to the
   * runtime, and the runtime is going to launch this identity app in a normal way with credaccess.
   * At that time, we will create the identity.
   */
  createIdentity() {
    let responseParams = {
      action: "internal"
    };
    appManager.sendIntentResponse(null, responseParams, this.dappService.getReceivedIntent().intentId, ()=>{
      console.log("Proxy intent response sent, original request:", this.dappService.getReceivedIntent(), "Response params:", responseParams);
    }, (err)=>{
      console.log("Failed to send intent response:", err);
    });
  }
}
