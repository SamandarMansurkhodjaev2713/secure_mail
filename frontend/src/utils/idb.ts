export function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('securemail', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('attachments')) {
        db.createObjectStore('attachments')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putAttachment(key: string, data: Blob) {
  const db = await openDB()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('attachments', 'readwrite')
    const store = tx.objectStore('attachments')
    const req = store.put(data, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function getAttachment(key: string) {
  const db = await openDB()
  return new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction('attachments', 'readonly')
    const store = tx.objectStore('attachments')
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}
