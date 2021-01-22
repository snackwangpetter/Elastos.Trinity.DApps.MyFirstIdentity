import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, IonSlides, ModalController } from '@ionic/angular';
import { DIDPublicationStatus } from 'src/app/model/didpublicationstatus.model';
import { HiveCreationStatus } from 'src/app/model/hivecreationstatus.model';
import { PersistentInfo } from 'src/app/model/persistentinfo.model';
import { DAppService } from 'src/app/services/dapp.service';
import { HiveService } from 'src/app/services/hive.service';
import { IdentityService } from 'src/app/services/identity.service';
import { PersistenceService } from 'src/app/services/persistence.service';
import { ThemeService } from 'src/app/services/theme.service';
import { EditProfileComponent, Page } from 'src/app/components/edit-profile/edit-profile.component';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from 'src/app/services/storage.service';

import * as moment from 'moment';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

@Component({
  selector: 'page-identitysetup',
  templateUrl: 'identitysetup.html',
  styleUrls: ['identitysetup.scss']
})
export class IdentitySetupPage {

  @ViewChild('slider', {static: false}) slider: IonSlides;

  public slideIndex = 0;
  public progress = 0;
  public showSpinner = false;

  public suggestRestartingFromScratch = false;
  private hiveIsBeingConfigured = false;

  constructor(
    public navCtrl: NavController,
    public dappService: DAppService,
    private identityService: IdentityService,
    private hiveService: HiveService,
    private persistence: PersistenceService,
    public theme: ThemeService,
    private storage: StorageService,
    private zone: NgZone,
    private modalCtrl: ModalController,
    private translate: TranslateService
  ) {
  }

  ionViewDidEnter() {
    appManager.setVisible("show");
    titleBarManager.setTitle(this.translate.instant('identitysetup.titlebar-title'));
    titleBarManager.setNavigationMode(TitleBarPlugin.TitleBarNavigationMode.CLOSE);

    if (!this.isEverythingReady() && this.wasTemporaryIdentityCreationStarted()) {
      // Basic Identityh configuration is not complete. So we are going to resume at the step we were earlier.
      this.resumeIdentitySetupFlow();
    }
  }

  slideNext() {
    this.slider.slideNext();
  }

  async getActiveSlide() {
    this.slideIndex = await this.slider.getActiveIndex();
  }

  async newDID() {
    await this.resumeIdentitySetupFlow();
  }

  async editProfile() {
    const modal = await this.modalCtrl.create({
      component: EditProfileComponent,
      componentProps: {
        from: Page.IDENTITYSETUP
      },
      cssClass: 'fullscreen'
    });
    modal.onDidDismiss().then((params) => {
      if(params.data) {
        if(params.data.profileFilled) {
          this.showSpinner = true;
          this.newDID();
        }
      }
    });
    await modal.present()
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
            this.progress = 0.01;
            await this.identityService.createLocalIdentity();
          }

          if (!this.isDIDOnChain() && !this.isDIDBeingPublished()) {
            this.progress = 0.01;
            let interval = setInterval(() => {
              if(this.progress >= 0.90) {
                clearInterval(interval);
              } else {
                this.progress += 0.01;
                this.storage.set('progressDate', new Date());
                this.storage.set('progress', this.progress);
              }
            }, 10000);
            await this.identityService.publishIdentity();
          }

          if (!this.isDIDOnChain() && this.isDIDBeingPublished()) {
            const progressDate = await this.storage.get('progressDate');
            const progress = await this.storage.get('progress');
            let newProgress: number = null;

            // If progress was previously initiated before starting app
            if(progressDate && progress) {
              console.log('Last progress time', moment(progressDate).format('LT'));
              console.log('Left off at progress', progress);

              // Get saved date
              const before = moment(progressDate);
              const now = moment(new Date());
              // Find duration in seconds between saved date and now
              const duration = moment.duration(now.diff(before));
              const durationInSeconds = duration.asSeconds();
              console.log('Progress in between in seconds', durationInSeconds);
              // Divide duration in a way progress can handle. ex: 10 seconds / 1000 = 0.01 which is 1%
              const additionalProgress = durationInSeconds / 1000;
              console.log('Progress while user was absent', additionalProgress);
              // Add new progress to saved progress
              newProgress = additionalProgress + progress;
            }

            if(newProgress && newProgress <= 0.9) {
              this.progress = newProgress
            } else if(this.progress >= 0.9) {
              this.progress = 0.9;
            } else {
              this.progress = 0.01;
            }

            console.log('Progress', this.progress);
            let interval = setInterval(() => {
              if(this.progress >= 0.90) {
                clearInterval(interval);
              } else {
                this.progress += 0.01;
                this.storage.set('progressDate', new Date());
                this.storage.set('progress', this.progress);
              }
            }, 10000);
            await this.repeatinglyCheckAssistPublicationStatus();
          }

          if (!this.isHiveVaultReady()) {
            this.progress = 0.90;
            let interval = setInterval(() => {
              if(this.progress >= 0.99) {
                clearInterval(interval);
              } else {
                this.progress += 0.01;
              }
            }, 10000);
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

  getProgress() {
    let percent = this.progress * 100;
    return percent.toFixed(0);
  }
}
