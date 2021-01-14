import { Injectable } from '@angular/core';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { StorageService } from './storage.service';

@Injectable({
    providedIn: 'root'
})
export class HiveService {
    private hiveClient: HivePlugin.Client;

    constructor(private storage: StorageService) {}

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
}
