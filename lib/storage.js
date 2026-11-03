// One atomic IndexedDB record for the new collection; legacy stores stay intact.
const NAME = "beautycalendar-v2";
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readCollection() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state");
    const request = tx.objectStore("state").get("products");
    request.onsuccess = () => resolve(request.result || []);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}
export async function writeCollection(products) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    try {
      tx.objectStore("state").put(products, "products");
    } catch (error) {
      tx.abort();
      db.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
