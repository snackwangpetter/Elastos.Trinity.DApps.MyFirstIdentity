import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as TrinitySDK from '@elastosfoundation/trinity-dapp-sdk';
import { DIDPublicationStatus } from '../model/didpublicationstatus.model';
import { PersistenceService } from './persistence.service';
import { StorageService } from './storage.service';
import { resolve } from 'url';

declare let didManager: DIDPlugin.DIDManager;

@Injectable({
    providedIn: 'root'
})
export class IdentityService {
    private didHelper: TrinitySDK.DID.DIDHelper;

    constructor(private persistence: PersistenceService, private http: HttpClient) {
        this.didHelper = new TrinitySDK.DID.DIDHelper();
    }

    public async createLocalIdentity() {
        let persistentInfo = this.persistence.getPersistentInfo();
        let createdDIDInfo = await this.didHelper.fastCreateDID(DIDPlugin.MnemonicLanguage.ENGLISH);

        // Save the created DID info. We don't bother user with manual passwords or mnemonics, as this is a "temporary"
        // identity only.
        persistentInfo.did.didString = createdDIDInfo.did.getDIDString();
        persistentInfo.did.storeId = createdDIDInfo.didStore.getId();
        persistentInfo.did.storePassword = createdDIDInfo.storePassword;
        persistentInfo.did.publicationStatus = DIDPublicationStatus.PUBLICATION_NOT_REQUESTED;

        await this.persistence.savePersistentInfo(persistentInfo);
    }

    /**
     * Queries the DID sidechain to check if the given DID is published or not.
     */
    public async getIdentityOnChain(didString: string): Promise<DIDPlugin.DIDDocument> {
        return new Promise((resolve, reject)=>{
            didManager.resolveDidDocument(didString, true, (document)=>{
                resolve(document);
            }, (err)=>{
                reject(err);
            });
        });
    }

    /**
     * Publish the DID using assist api
     */
    public async publishIdentity(): Promise<void> {
        let persistentInfo = this.persistence.getPersistentInfo();
        let didStore = await this.openDidStore(persistentInfo.did.storeId, (payload: string, memo: string)=>{
            // Callback called by the DID SDK when trying to publish a DID.
            let payloadAsJson = JSON.parse(payload);
            this.publishDIDOnAssist(persistentInfo.did.didString, payloadAsJson, memo);
        });
        let localDIDDocument = await this.loadLocalDIDDocument(didStore, persistentInfo.did.didString);

        localDIDDocument.publish(persistentInfo.did.storePassword, ()=>{
            // Publish process complete
        }, (err)=>{
            // Publish process errored
        });
    }

    // DOC FOR ASSIST API: https://github.com/tuum-tech/assist-restapi-backend#verify
    private publishDIDOnAssist(didString: string, payloadObject: any, memo: string) {
        let assistAPIEndpoint = "https://wogbjv3ci3.execute-api.us-east-1.amazonaws.com/prod/";
        let assistAPIKey = "IdSFtQosmCwCB9NOLltkZrFy5VqtQn8QbxBKQoHPw7zp3w0hDOyOYjgL53DO3MDH";

        let requestBody = {
            "did": didString,
            "memo": memo,
            "requestFrom": "org.elastos.trinity.dapp.myfirstidentity",
            "didRequest": payloadObject
        };

        this.http.post(assistAPIEndpoint+"/didtx/create", requestBody, {
            headers: {
                "Authorization": assistAPIKey
            }
        }).subscribe(async response => {
            console.log("Assist response:", response);
        }, (err) => {
            console.log("Assist api call error:", err);
        });
    }

    private openDidStore(storeId: string, createIdTransactionCallback: DIDPlugin.OnCreateIdTransaction): Promise<DIDPlugin.DIDStore> {
        return new Promise((resolve)=>{
            didManager.initDidStore(storeId, createIdTransactionCallback, (didstore)=>{
                resolve(didstore);
            }, (err)=>{
                resolve(null);
            })
        });
    }

    private loadLocalDIDDocument(didStore: DIDPlugin.DIDStore, didString: string): Promise<DIDPlugin.DIDDocument> {
        return new Promise((resolve)=>{
            didStore.loadDidDocument(didString, (didDocument)=>{
                resolve(didDocument);
            }, (err)=>{
                resolve(null);
            });
        });
    }

    public createCredaccessPresentation(): Promise<DIDPlugin.VerifiablePresentation> {
        return new Promise(async (resolve)=>{
            let persistentInfo = this.persistence.getPersistentInfo();
            let didStore = await this.didHelper.openDidStore(persistentInfo.did.storeId);
            let did = await this.didHelper.loadDID(didStore, persistentInfo.did.didString);

            // TODO: embed the "name" credential when we have this configuration available on the UI.
            did.createVerifiablePresentation([], "", "", persistentInfo.did.storePassword, (presentation)=>{
                resolve(presentation);
            }, (err)=>{
                console.error("Error while creating the credaccess presentation:", err);
                resolve(null);
            });
        });
    }
}
