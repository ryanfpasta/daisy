// Progress photos for the browser version of Daisy, kept in this browser's
// IndexedDB (they never leave the phone). Used from lib/logic/web_photos_web.dart.
(function () {
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const r = indexedDB.open('daisy_photos', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('photos');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
    }
    return dbp;
  }
  function run(mode, fn) {
    return db().then((d) => new Promise((resolve, reject) => {
      const tx = d.transaction('photos', mode);
      const store = tx.objectStore('photos');
      let result;
      fn(store, (v) => { result = v; });
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }));
  }
  window.daisyPhotos = {
    // Resolves to [names, buffers] for every saved photo.
    all: () => run('readonly', (s, done) => {
      const names = [];
      const datas = [];
      const c = s.openCursor();
      c.onsuccess = () => {
        const cur = c.result;
        if (cur) { names.push(String(cur.key)); datas.push(new Uint8Array(cur.value)); cur.continue(); }
        else done([names, datas]);
      };
    }),
    put: (name, bytes) => run('readwrite', (s) => { s.put(bytes.slice().buffer, name); }),
    remove: (name) => run('readwrite', (s) => { s.delete(name); }),
    clear: () => run('readwrite', (s) => { s.clear(); }),
    persist: () => (navigator.storage && navigator.storage.persist)
      ? navigator.storage.persist().catch(() => false) : Promise.resolve(false),
  };
})();
