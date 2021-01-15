import { Injectable } from '@angular/core';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { HiveCreationStatus } from '../model/hivecreationstatus.model';
import { IdentityService } from './identity.service';
import { PersistenceService } from './persistence.service';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class HiveService {
    private availableHideNodeProviders: string[] = [
        "https://hive1.trinity-tech.io",
        "https://hive2.trinity-tech.io"
    ];

    private hiveClient: HivePlugin.Client;

    constructor(private storage: StorageService, private persistence: PersistenceService) {}

    public async getHiveClient(): Promise<HivePlugin.Client> {
        if (this.hiveClient)
            return this.hiveClient;

        let hiveAuthHelper = new TrinitySDK.Hive.AuthHelper();
        this.hiveClient = await hiveAuthHelper.getClientWithAuth((e)=>{
            // Auth error
            console.error("Authentication error", e); // TODO: inform user.
        });
        return this.hiveClient;
    }

    public async getUserVault(): Promise<HivePlugin.Vault> {
        let signedInUserDID = await this.storage.getSignedInDID();
        return await (await this.getHiveClient()).getVault(signedInUserDID);
    }

    /**
     * Returns a random hive node address among the nodes that we can choose as default quick start
     * vault provider for new users.
     */
    public getRandomQuickStartHiveNodeAddress(): string {
        let randomIndex = Math.floor(Math.random()*this.availableHideNodeProviders.length);
        return this.availableHideNodeProviders[randomIndex];
    }

    /**
     * Makes hive vault ready for the current user.
     */
    public async prepareHiveVault() {
        console.log("Preparing hive vault");

        let hiveAuthHelper = new TrinitySDK.Hive.AuthHelper();
        let hiveClient = await hiveAuthHelper.getClientWithAuth((err)=>{
            console.error("Hive authentication error!", err);
        });

        console.log("Got hive client");

        let persistenceInfo = await this.persistence.getPersistentInfo();
        try {
            let vault = await hiveClient.createVault(persistenceInfo.did.didString, "https://hive2.trinity-tech.io" /* TODO TMP persistenceInfo.hive.vaultProviderAddress*/);
            // We don't check if the vault is null or not. NULL without exception means the vault already exists, so that's ok.

            vault = await hiveClient.getVault(persistenceInfo.did.didString);
            if (!vault) {
                console.error("NULL vault returned, unable to get the vault for this DID.");
            }
            else {
                // Now try to call an API to see if everything is ok. This will initiate a authentication flow.
                try {
                    console.log("Calling an api on the hive vault to make sure everything is fine");

                    let pricingPlan = await vault.getPayment().getActivePricingPlan();
                    if (!pricingPlan) {
                        console.error("Error while calling a test hive vault API. No data returned");
                    }
                    else {
                        console.log("Vault API could be called, all good!");

                        // Everything is all right, now we can consider the hive setup as successfully completed.
                        persistenceInfo.hive.creationStatus = HiveCreationStatus.VAULT_CREATED_AND_VERIFIED;
                        await this.persistence.savePersistentInfo(persistenceInfo);
                    }
                }
                catch (e) {
                    console.error("Exception while calling a test vault API:", e);
                }
            }
        }
        catch (e) {
            console.error("Exception while creating the vault:", e);
        }
    }
}
