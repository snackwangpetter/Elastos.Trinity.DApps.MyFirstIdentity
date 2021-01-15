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
  selector: 'page-identitysetup',
  templateUrl: 'identitysetup.html',
  styleUrls: ['identitysetup.scss']
})
export class IdentitySetupPage {
  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private hiveService: HiveService,
    private persistence: PersistenceService) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Identity setup");
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);

    if (!this.isEverythingReady() && this.wasTemporaryIdentityCreationStarted()) {
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

    if (!this.isDIDOnChain() && this.isDIDBeingPublished()) {
      await this.repeatinglyCheckAssistPublicationStatus();
    }

    if (!this.isHiveVaultReady()) {
      await this.prepareHiveVault();
    }
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

  private async prepareHiveVault() {
    await this.hiveService.prepareHiveVault();
  }

  /**
   * Checks assist publication status in a loop until we know the transaction is successful or failing.
   */
  private async repeatinglyCheckAssistPublicationStatus(): Promise<void> {
    let persistenceInfo: PersistentInfo = null;
    let firstAttempt = true;

    do {
      if (!firstAttempt) {
        console.log("Waiting a few seconds before checking again");
        await this.dappService.sleep(15000); // Wait 15s before trying again
      }

      await this.identityService.checkPublicationStatusAndUpdate();

      // Check the new status
      persistenceInfo = this.persistence.getPersistentInfo();

      firstAttempt = false;
    }
    while (persistenceInfo.did.publicationStatus == DIDPublicationStatus.AWAITING_PUBLICATION_CONFIRMATION);
  }

  /**
   * This identity setup screen is normally reached because an intent such as credaccess was received,
   * but no identity exists yet. After the identity is fully created, we can then continue to where we should have
   * been at first, if the identity existed.
   */
  public continueToOriginalLocation() {
    // NOTE: For now, we always consider we are coming from a "credaccess" intent request. To be improved later.
    this.navCtrl.navigateRoot("credaccess");
  }
}
