import { Injectable } from '@angular/core';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { DIDPublicationStatus } from '../model/didpublicationstatus.model';
import { HiveCreationStatus } from '../model/hivecreationstatus.model';
import { PersistentInfo } from '../model/persistentinfo.model';
import { StorageService } from './storage.service';

declare let didManager: DIDPlugin.DIDManager;

@Injectable({
    providedIn: 'root'
})
export class PersistenceService {
    private persistentInfo: PersistentInfo = null;

    constructor(private storage: StorageService) {}

    public async init() {
        let persistentInfoJsonStr = await this.storage.get("persistentinfo") as string;
        this.persistentInfo = (persistentInfoJsonStr ? JSON.parse(persistentInfoJsonStr) : this.createNewPersistentInfo());
        console.log("Persistent info:", this.persistentInfo);
    }

    private createNewPersistentInfo(): PersistentInfo {
        return {
            did: {
                storeId: null,
                storePassword: null,
                didString: null,
                publicationStatus: DIDPublicationStatus.PUBLICATION_NOT_REQUESTED,
                assistPublicationID: null
            },
            hive: {
                vaultProviderAddress: null,
                creationStatus: HiveCreationStatus.VAULT_NOT_CREATED
            }
        }
    }

    public getPersistentInfo(): PersistentInfo {
        return this.persistentInfo;
    }

    public async savePersistentInfo(persistentInfo: PersistentInfo) {
        this.persistentInfo = persistentInfo;
        await this.storage.set("persistentinfo", JSON.stringify(this.persistentInfo));
    }

    public async reset() {
        await this.savePersistentInfo(this.createNewPersistentInfo());
    }
}
