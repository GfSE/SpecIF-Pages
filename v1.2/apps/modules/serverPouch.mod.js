"use strict";
moduleManager.construct({
    name: 'serverPouch'
}, (self) => {
    const sep = '|', srvType = 'PouchDB';
    let db;
    self.init = () => { return true; };
    self.open = (dbName, callback) => {
        try {
            db = new PouchDB(dbName);
            self.remoteCouch = dbName.startsWith('http');
            if (typeof (callback) === 'function') {
                db.changes({
                    since: 0,
                    live: true
                }).on('change', callback);
            }
            ;
            db.info()
                .then((info) => {
                console.info(srvType + ': ' + JSON.stringify(info));
            })
                .catch((err) => {
                console.error(srvType + ': Error when getting DB-Info', err);
            });
        }
        catch (err) {
            console.error(srvType + ': Error when opening the pouchDB', err);
            db = null;
        }
    };
    self.close = () => {
        if (db)
            db.close();
        db = null;
    };
    self.get = (ctg, el) => {
        console.debug('server.get: ', ctg, el);
        if (!el || !el.id)
            return getL(ctg, 'all');
        return getE(ctg, el);
    };
    self.put = (ctg, el) => {
        console.debug('server.put: ', ctg, el);
        return putE(ctg, el);
    };
    self.remove = (ctg, el) => {
        console.debug('server.remove: ', ctg, el);
        return removeE(ctg, el);
    };
    self.abort = function () {
    };
    function getL(ctg, sel, opts) {
        ensureDbOpen();
        if (ctg == 'node')
            throw new Error(srvType + ": Reading a 'node' is not supported.");
        if (!opts)
            opts = {};
        return new Promise((resolve, reject) => {
            if (sel === 'all') {
                const path = dbPath(ctg), options = {
                    include_docs: true,
                    startkey: path,
                    endkey: path + '\ufff0'
                };
                if (ctg == 'file') {
                    options.attachments = true;
                    options.binary = true;
                }
                ;
                db.allDocs(options)
                    .then((res) => {
                    if (opts) {
                        let i = null;
                        switch (ctg) {
                            case 'statement':
                                if (opts.resource)
                                    for (i = res.rows.length - 1; i > -1; i--) {
                                        if (res.rows[i].doc.subject.id != opts.resource.id && res.rows[i].doc.object.id != opts.resource.id)
                                            res.rows.splice(i, 1);
                                    }
                                ;
                            case 'resource':
                            case 'hierarchy':
                                if (opts.type)
                                    for (i = res.rows.length - 1; i > -1; i--) {
                                        if (res.rows[i].doc.specType != opts.type)
                                            res.rows.splice(i, 1);
                                    }
                                ;
                        }
                        ;
                    }
                    ;
                    resolve(new resultMsg(200, "ok", "json", clientL(ctg, res)));
                })
                    .catch((err) => {
                    console.debug('Read-list fail:', err);
                    reject(new resultMsg(411, 'Reading list from DB failed'));
                });
                return;
            }
            ;
            if (Array.isArray(sel)) {
                if (sel.length > 0) {
                    var options = {
                        include_docs: true,
                        keys: sel.map((e) => { return dbId(ctg, e); })
                    };
                    if (ctg == 'file') {
                        options.attachments = true;
                        options.binary = true;
                    }
                    ;
                    db.allDocs(options)
                        .then((res) => {
                        resolve(new resultMsg(200, "ok", "json", clientL(ctg, res)));
                    })
                        .catch((err) => {
                        console.debug('getL fail:', err);
                        reject(new resultMsg(411, 'Reading list from DB failed'));
                    });
                }
                else
                    resolve(new resultMsg(200, "ok", "json", []));
                return;
            }
            ;
            console.error(srvType + ': Invalid parameter when reading from DB');
            reject(new resultMsg(412, 'Invalid parameter when reading from DB'));
        });
    }
    function getE(ctg, el, opts) {
        ensureDbOpen();
        if (ctg == 'node')
            throw new Error(srvType + ": Reading a 'node' is not supported.");
        if (!opts)
            opts = {};
        if (el.revision)
            opts.rev = el.revision;
        if (ctg == 'file') {
            opts.attachments = true;
            opts.binary = true;
        }
        ;
        return new Promise((resolve, reject) => {
            db.get(dbId(ctg, el), opts)
                .then((res) => {
                console.debug('getE done:', res);
                resolve(new resultMsg(200, "ok", "json", clientE(ctg, res)));
            })
                .catch((err) => {
                console.debug('Reading element from DB failed:', ctg, err);
                reject(new resultMsg(411, 'Reading element from DB failed'));
            });
        });
    }
    function putE(ctg, el) {
        ensureDbOpen();
        if (ctg == 'node')
            throw new Error(srvType + ": Updating a 'node' is not supported.");
        let nE = dbE(ctg, el);
        nE._rev = el.revision;
        return new Promise((resolve, reject) => {
            console.debug('putE', ctg, el, nE);
            db.put(nE)
                .then(() => {
                console.debug('putE done', ctg);
                resolve(new resultMsg(200, "ok"));
            })
                .catch((err) => {
                console.debug('putE fail:', ctg, err);
                reject({ status: 414, statusText: 'Updating element in DB failed' });
            });
        });
    }
    function removeE(ctg, el) {
        ensureDbOpen();
        if (ctg == 'node')
            throw new Error(srvType + ": Deleting a 'node' is not supported.");
        return new Promise((resolve, reject) => {
            el = { id: el.id };
            db.get(dbId(ctg, el))
                .then((doc) => {
                console.debug('db.get done:', doc);
                db.remove(doc._id, doc._rev);
            })
                .then(() => {
                console.debug('db.remove done');
                resolve(new resultMsg(200, "ok"));
            })
                .catch((err) => {
                console.debug('removeE fail:', err);
                reject({ status: 413, statusText: 'Delete element from DB failed' });
            });
        });
    }
    function dbPath(ctg) {
        switch (ctg) {
            case 'project': return 'P' + sep;
            case 'dataType': return 'DT' + sep;
            case 'resourceClass': return 'RC' + sep;
            case 'statementClass': return 'SC' + sep;
            case 'resource': return 'R' + sep;
            case 'statement': return 'S' + sep;
            case 'hierarchy': return 'H' + sep;
            case 'file': return 'F' + sep;
            default:
                throw new Error(srvType + ": Invalid category");
        }
        ;
        return;
    }
    function dbId(ctg, e) {
        return dbPath(ctg) + e.id;
    }
    function dbE(ctg, e) {
        var n = clone(e);
        n._id = dbId(ctg, e);
        delete n.id;
        switch (ctg) {
            case 'file':
                if (e.blob) {
                    n._attachments = {};
                    n._attachments[e.id] = { content_type: e.blob.type || e.type, data: e.blob };
                    delete n.type;
                }
        }
        ;
        console.debug('dbE', ctg, e, n);
        return n;
    }
    function clientId(id) {
        return id.split(sep).pop();
    }
    function clientE(ctg, e) {
        e.id = clientId(e._id);
        delete e._id;
        e.revision = e._rev;
        delete e._rev;
        return e;
    }
    function clientL(ctg, l) {
        return l.rows.map((e) => clientE(ctg, e.doc));
    }
    function ensureDbOpen() {
        if (!db)
            throw new Error(srvType + ': Database has not been opened.');
    }
    function clone(o) {
        function clonePrp(p) {
            return (typeof (p) == 'object') ? clone(p) : p;
        }
        var n = {};
        for (var p in o) {
            if (['upd', 'del', 'blob', 'objectRefs', 'cre', 'rea', 'revision', 'parent', 'predecessor', 'hierarchy'].includes(p))
                continue;
            if (Array.isArray(o[p])) {
                n[p] = [];
                for (var i = 0, I = o[p].length; i < I; i++)
                    n[p].push(clonePrp(o[p][i]));
                continue;
            }
            ;
            n[p] = clonePrp(o[p]);
        }
        ;
        return n;
    }
    return self;
});
