// Minimal IndexedDB helper for storing image blobs locally

const DB_NAME = "vm-images";
const STORE_NAME = "images";

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === "undefined") {
			reject(new Error("IndexedDB is not available in this environment"));
			return;
		}
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export function generateImageKey(prefix: string = "img"): string {
	return `idb://vm-images/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function keyToIdbKey(key: string): string {
	// Accept both idb://vm-images/<id> and raw keys; normalize to the latter
	if (key.startsWith("idb://")) return key.replace(/^idb:\/\/vm-images\//, "");
	return key;
}

export async function saveBlob(key: string, blob: Blob): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.put({ blob, type: blob.type }, keyToIdbKey(key));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function getBlob(key: string): Promise<Blob | null> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const req = store.get(keyToIdbKey(key));
		req.onsuccess = () => {
			const val = req.result as { blob?: Blob; type?: string } | undefined;
			if (!val) return resolve(null);
			if (val.blob) return resolve(val.blob);
			resolve(null);
		};
		req.onerror = () => reject(req.error);
	});
}

export async function deleteBlob(key: string): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		store.delete(keyToIdbKey(key));
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function objectUrlForKey(key: string): Promise<string | null> {
	const blob = await getBlob(key);
	if (!blob) return null;
	return URL.createObjectURL(blob);
}

