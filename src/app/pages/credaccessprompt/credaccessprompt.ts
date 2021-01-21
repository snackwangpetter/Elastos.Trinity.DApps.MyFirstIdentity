import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DAppService } from 'src/app/services/dapp.service';
import { IdentityService } from 'src/app/services/identity.service';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from '@ngx-translate/core';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-credaccessprompt',
  templateUrl: 'credaccessprompt.html',
  styleUrls: ['credaccessprompt.scss']
})
export class CredAccessPromptPage {
  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    public theme: ThemeService,
    public translate: TranslateService
  ) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle(this.translate.instant('credaccessprompt.titlebar-title'));
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  async elastOSSignIn() {
    await this.identityService.saveUsingExternalIdentityWalletPreference();

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
  async useTemporaryIdentity() {
    await this.identityService.saveUsingBuiltInIdentityWalletPreference();

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
