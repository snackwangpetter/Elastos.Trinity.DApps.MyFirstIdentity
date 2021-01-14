import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DIDPublicationStatus } from 'src/app/model/didpublicationstatus.model';
import { DAppService } from 'src/app/services/dapp.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['home.scss']
})
export class HomePage {
  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private persistence: PersistenceService) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Identity setup");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);

    if (!this.isEverythingReady()) {
      // Basic Identityh configuration is not complete. So we are going to resume at the step we were earlier.
      this.resumeIdentitySetupFlow();
    }
  }

  async newDID() {
    await this.resumeIdentitySetupFlow();
  }

  /**
   * Continues the identity creation process where it was stopped.
   */
  private async resumeIdentitySetupFlow() {
    // Local DID creation
    if (!this.isLocalDIDcreated()) {
      await this.identityService.createLocalIdentity();
    }

    if (!this.isDIDOnChain() && !this.isDIDBeingPublished()) {
      await this.identityService.publishIdentity();
    }
    else if (!this.isDIDOnChain() && this.isDIDBeingPublished()) {
      await this.repeatinglyCheckAssistPublicationStatus();
    }

    if (!this.isHiveVaultReady()) {
      await this.getHiveVaultReady();
    }
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

  public wasTemporaryIdentityCreationStarted(): boolean {
    return this.isLocalDIDcreated();
  }

  public isLocalDIDcreated(): boolean {
    let persistenceInfo = this.persistence.getPersistentInfo();
    return persistenceInfo.did.didString != null;
  }

  public isDIDBeingPublished(): boolean {
    let persistenceInfo = this.persistence.getPersistentInfo();
    return persistenceInfo.did.publicationStatus == DIDPublicationStatus.AWAITING_PUBLICATION_CONFIRMATION;
  }

  public isDIDOnChain(): boolean {
    let persistenceInfo = this.persistence.getPersistentInfo();
    return persistenceInfo.did.publicationStatus == DIDPublicationStatus.PUBLISHED_AND_CONFIRMED;
  }

  public isHiveVaultReady(): boolean {
    return false; // TODO
  }

  public isEverythingReady(): boolean {
    return this.isHiveVaultReady();
  }

  private getHiveVaultReady() {
    console.warn("TODO: hive setup");
  }

  /**
   * Checks assist publication status in a loop until we know the transaction is successful or failing.
   */
  private async repeatinglyCheckAssistPublicationStatus(): Promise<void> {
    await this.identityService.checkRemotePublicationStatus();
    // TODO: after this, get persisten info to know the new status + loop
  }
}
