import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DIDPublicationStatus } from 'src/app/model/didpublicationstatus.model';
import { PersistentInfo } from 'src/app/model/persistentinfo.model';
import { DAppService } from 'src/app/services/dapp.service';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-credaccess',
  templateUrl: 'credaccess.html',
  styleUrls: ['credaccess.scss']
})
export class CredAccessPage {
  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private hiveService: HiveService,
    private persistence: PersistenceService) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Profile request");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);
  }

  async finalizeOriginalIntent() {
    let persistenceInfo = this.persistence.getPersistentInfo();

    // Get the list of credentials that makes the calling application happy.
    let credentials = await this.generateCredentialsThatMatchTheInitialRequest();

    let presentation = await this.identityService.createCredaccessPresentation(credentials);
    let presentationJson = await presentation.toJson();

    // We send the presentaiton directly here, no JWT, because we know we remain inside the same native package.
    let responseParams = {
      did: persistenceInfo.did.didString,
      presentation: JSON.parse(presentationJson)
    };
    appManager.sendIntentResponse(null, responseParams, this.dappService.getReceivedIntent().intentId, ()=>{
      console.log("Intent response sent, original request:", this.dappService.getReceivedIntent(), "Response params:", responseParams);
    }, (err)=>{
      console.log("Failed to send intent response:", err);
    });
  }

  private async generateCredentialsThatMatchTheInitialRequest(): Promise<DIDPlugin.VerifiableCredential[]> {
    let persistenceInfo = this.persistence.getPersistentInfo();

    // Take all the claims requested in the original intent and return credentials for each of them, with fake data.
    let credentials: DIDPlugin.VerifiableCredential[] = [];
    let intentParams = this.dappService.getReceivedIntent().params;

    if (intentParams && intentParams.claims) {
      for(let claimName of Object.keys(intentParams.claims)) {
        let credential = await this.createCredential(claimName, persistenceInfo.did.storePassword);
        console.log("Created temporary credential for claim:", claimName, credential);

        if (credential)
          credentials.push(credential);
      }
    }

    return credentials;
  }

  private async createCredential(claimName: string, storePassword: string): Promise<DIDPlugin.VerifiableCredential> {
    let did = await this.identityService.getLocalDID();

    // Handle a few standard claims nicely. Others default to a default value.
    let properties: any = {};
    switch (claimName) {
      case "name":
        properties.name = "Anonymous user";
        break;
      case "email":
        properties.email = "unknown@email.com";
      default:
        // Empty properties
    }

    return new Promise((resolve)=>{
      did.issueCredential(did.getDIDString(), "#"+claimName, ["TemporaryCredential"], 365, properties, storePassword, (cred)=>{
        resolve(cred);
      }, (err)=>{
        console.error(err);
        resolve(null);
      });
    });
  }
}