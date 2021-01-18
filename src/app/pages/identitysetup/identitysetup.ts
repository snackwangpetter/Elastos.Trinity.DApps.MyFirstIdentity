import { Component, NgZone } from '@angular/core';
import { NavController } from '@ionic/angular';
import { DIDPublicationStatus } from 'src/app/model/didpublicationstatus.model';
import { HiveCreationStatus } from 'src/app/model/hivecreationstatus.model';
import { PersistentInfo } from 'src/app/model/persistentinfo.model';
import { DAppService } from 'src/app/services/dapp.service';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { ThemeService } from 'src/app/services/theme.service';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-identitysetup',
  templateUrl: 'identitysetup.html',
  styleUrls: ['identitysetup.scss']
})
export class IdentitySetupPage {
  public suggestRestartingFromScratch = false;
  private hiveIsBeingConfigured = false;

  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private hiveService: HiveService,
    private persistence: PersistenceService,
    public theme: ThemeService,
    private zone: NgZone
  ) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle("Identity Setup");
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
    await new Promise((resolve)=>{
      setTimeout(async ()=>{
        try {
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
        catch (e) {
          // Catch all unhandled exceptions. When this happens, we:
          // TODO 1) send a silent sentry report to be able to understand what's going on remotely
          // 2) suggest user to restart the process fresh, as something is broken.
          console.warn("Handled global exception:", e);
          this.zone.run(()=>this.suggestRestartingFromScratch = true);
          resolve();
        }
      }, 1000);
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
    let persistenceInfo = this.persistence.getPersistentInfo();
    return persistenceInfo.hive.creationStatus == HiveCreationStatus.VAULT_CREATED_AND_VERIFIED;
  }

  public isHiveBeingConfigured(): boolean {
    return this.hiveIsBeingConfigured;
  }

  public isEverythingReady(): boolean {
    return this.isHiveVaultReady();
  }

  private async prepareHiveVault() {
    this.hiveIsBeingConfigured = true;
    try {
      await this.hiveService.prepareHiveVault();
    }
    catch (e) {
      throw e;
    } finally {
      this.hiveIsBeingConfigured = false;
    }
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

  /**
   * Clears all context and restarts identity creation from 0.
   */
  public async restartProcessFromScratch() {
    this.suggestRestartingFromScratch = false;
    await this.identityService.resetOnGoingProcess();
    this.resumeIdentitySetupFlow();
  }
}
