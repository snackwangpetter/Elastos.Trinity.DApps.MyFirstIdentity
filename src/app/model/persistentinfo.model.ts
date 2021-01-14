import { DIDPublicationStatus } from "./didpublicationstatus.model";

/**
 * Model that holds all information we want to store locally for later reuse.
 */
export type PersistentInfo = {
    did: {
        storeId: string;
        storePassword: string;
        didString: string;
        publicationStatus: DIDPublicationStatus
    },
    hive: {
    }
}