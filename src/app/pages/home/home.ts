import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DAppService } from 'src/app/services/dapp.service';
import { IdentityService } from 'src/app/services/identity.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['home.scss']
})
export class HomePage {
  constructor(public navCtrl: NavController, public dappService: DAppService, private identityService: IdentityService) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Identity setup");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  async newDID() {
    await this.identityService.createLocalIdentity();
  }

  async finalizeOriginalIntent() {
    let presentation = await this.identityService.createCredaccessPresentation();
    let presentationJson = await presentation.toJson();

    // We send the presentaiton directly here, no JWT, because we know we remain inside the same native package.
    let responseParams = {
      presentation: JSON.parse(presentationJson)
    };
    appManager.sendIntentResponse(null, responseParams, this.dappService.getReceivedIntent().intentId, ()=>{
      console.log("Intent response sent, original request:", this.dappService.getReceivedIntent(), "Response params:", responseParams);
    }, (err)=>{
      console.log("Failed to send intent response:", err);
    });
  }
}
