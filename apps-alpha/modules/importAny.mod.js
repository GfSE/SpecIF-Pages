"use strict";
/*!	GUI and control for all importers
    Dependencies: jQuery 3.1+, bootstrap 3.1
    Copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
moduleManager.construct({
    name: 'importAny'
}, function (self) {
    const actions = [{
            id: 'create',
            title: i18n.BtnCreate,
            desc: 'Create a new project with the given id.'
        }, {
            id: 'clone',
            title: i18n.BtnClone,
            desc: 'Copy the project with a new id.'
        }, {
            id: 'replace',
            title: i18n.BtnReplace,
            desc: 'Replace the project having the same id; existing content will be lost.'
        }, {
            id: 'adopt',
            title: i18n.BtnAdopt,
            desc: 'Add the new project without effect on the existing one; existing resources having an identical name will be adopted.'
        }, {
            id: 'update',
            title: i18n.BtnUpdate,
            desc: 'Update the project: New objects will be created, modified ones will be superseded.',
        }];
    var iFormats = [];
    self.projectName = '';
    self.importFormat = undefined;
    var showFileSelect, importMode = { id: 'replace' }, myFullName = 'app.' + self.loadAs, urlP, urlOntology = (LIB.useRemotePath() ?
        CONFIG.ontologyURL
        : CONFIG.localOntologyURL), importing = false;
    self.clear = function () {
        $('input[type=file]').val('');
        setTextValue(i18n.LblFileName, '');
        setTextValue(i18n.LblProjectName, '');
        self.file = { name: '' };
        self.projectName = '';
        setProgress('', 0);
        setImporting(false);
        app.busy.reset();
        self.enableActions();
    };
    self.init = function () {
        if (!browser.supportsFileAPI) {
            message.show(i18n.MsgFileApiNotSupported, { severity: 'danger' });
            return false;
        }
        ;
        iFormats = [{
                id: 'ddp',
                name: 'ioDdpSchema',
                desc: 'Schema (.xsd) of the Prostep iViP Digital Data Package (DDP)',
                label: 'DDP',
                extensions: [".xsd"],
                opts: { mediaTypeOf: LIB.attachment2mediaType },
                help: "Experimental: Import a DDP-Schema file (Dictionary.xsd)."
            }, {
                id: 'specif',
                name: 'ioSpecif',
                desc: 'Specification Integration Facility',
                label: 'SpecIF',
                extensions: [".specif", ".specifz", ".specif.zip"],
                opts: { mediaTypeOf: LIB.attachment2mediaType, doCheck: ['statementClass.subjectClasses', 'statementClass.objectClasses'] },
                help: i18n.MsgImportSpecif
            }, {
                id: 'archimate',
                name: 'ioArchimate',
                desc: 'ArchiMate Open Exchange',
                label: 'ArchiMate®',
                extensions: [".xml"],
                opts: { mediaTypeOf: LIB.attachment2mediaType },
                help: "Experimental: Import an ArchiMate Open Exchange file (*.xml) and add the diagrams (*.png or *.svg) to their respective resources using the 'edit' function."
            }, {
                id: 'bpmn',
                name: 'ioBpmn',
                desc: 'Business Process',
                label: 'BPMN',
                extensions: [".bpmn"],
                opts: { ingest: ["source"] },
                help: i18n.MsgImportBpmn
            }, {
                id: 'sysml',
                name: 'ioSysml',
                desc: 'System Modeling Language',
                label: 'UML/SysML',
                extensions: [".mdzip", ".mdzip.bak"],
                help: "Experimental: Import an XMI file from Cameo v19.0."
            }, {
                id: 'reqif',
                name: 'ioReqif',
                desc: 'Requirement Interchange Format',
                label: 'ReqIF',
                extensions: [".reqif", ".reqifz"],
                opts: { multipleMode: "adopt", mediaTypeOf: LIB.attachment2mediaType, dontCheck: ["statement.subject", "statement.object"] },
                help: i18n.MsgImportReqif
            }, {
                id: 'xls',
                name: 'ioXls',
                desc: 'MS Excel® or LibreOffice Spreadsheet',
                label: 'Excel®',
                extensions: [".xlsx", ".xls", ".csv", ".ods", ".fods"],
                opts: { dontCheck: ["statement.object"] },
                help: i18n.MsgImportXls
            }];
        let h = '<div style="max-width:768px; margin-top:1em">'
            + '<div class="fileSelect" style="display:none;" >'
            + '<div class="attribute-label" style="vertical-align:top; padding-top:0.2em" >' + i18n.LblOntology + '</div>'
            + '<div class="attribute-value" >'
            + '<div id="ontologySelector" style="margin: 0 0 0.4em 0" ></div>'
            + '</div>'
            + '</div>'
            + '<div class="fileSelect" style="display:none;" >'
            + '<div class="attribute-label" style="vertical-align:top; font-size:140%; padding-top:0.2em" >' + i18n.LblImport + '</div>'
            + '<div class="attribute-value" >'
            + '<div id="formatSelector" class="btn-group" style="margin: 0 0 0.4em 0" ></div>'
            + '<div id="helpImport" style="margin: 0 0 0.4em 0" ></div>'
            + '<div id="fileSelectBtn" class="btn btn-light btn-fileinput" style="margin: 0 0 0.8em 0" ></div>'
            + '</div>'
            + '</div>'
            + '<form id="formNames" class="form-horizontal" role="form"></form>'
            + '<div class="fileSelect" style="display:none;" >'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >'
            + '<div id="modeSelector" class="btn-group mt-1" style="margin: 0 0 0.4em 0" >'
            + function () {
                let btns = '';
                actions.forEach((a) => {
                    btns += '<button id="' + a.id + 'Btn" onclick="' + myFullName + '.importLocally(\'' + a.id + '\')"' + (a.desc ? ' data-toggle="popover" title="' + a.desc + '"' : '') + ' type="button" class="btn btn-primary text-nowrap">' + a.title + '</button>';
                });
                return btns;
            }()
            + '</div>'
            + '</div>'
            + '</div>'
            + '<div>'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >'
            + '<div id="progress" class="progress" >'
            + '<div class="progress-bar progress-bar-primary" ></div>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '<div style="padding-top:2em">'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >' + i18n.MsgIntro + '</div>'
            + '</div>'
            + '</div>';
        $(self.view).prepend(h);
        self.clear();
        importMode = { id: 'replace' };
        showFileSelect = new State({
            showWhenSet: ['.fileSelect'],
            hideWhenSet: []
        });
        return true;
    };
    self.show = function (opts) {
        if (!opts)
            opts = {};
        $('#pageTitle').html(app.title);
        if (!opts.urlParams)
            setUrlParams({
                view: self.view
            });
        function getFormat(uParms) {
            for (var f of iFormats) {
                for (var ext of f.extensions) {
                    if (uParms[CONFIG.keyImport].endsWith(ext) && moduleManager.isReady(f.name))
                        return f;
                }
                ;
            }
            ;
        }
        function getOntologyURL(uP) {
            return uP ? uP[CONFIG.keyOntology] : undefined;
        }
        urlP = opts.urlParams;
        urlOntology = getOntologyURL(urlP) || urlOntology;
        if (urlP && urlP[CONFIG.keyImport]) {
            importMode = { id: urlP[CONFIG.keyMode] || 'replace' };
            self.file.name = urlP[CONFIG.keyImport];
            self.importFormat = getFormat(urlP);
            if (self.importFormat && app[self.importFormat.name]) {
                app[self.importFormat.name].init(self.importFormat.opts);
                if (app[self.importFormat.name].verify({ name: urlP[CONFIG.keyImport] })) {
                    let rF = makeTextField(i18n.LblFileName, self.file.name);
                    $("#formNames").html(rF);
                    self.projectName = self.file.name.fileName();
                    setImporting(true);
                    getOntology(urlOntology)
                        .then((ont) => {
                        app.ontology = ont;
                        LIB.httpGet({
                            url: urlP[CONFIG.keyImport] + '?' + Date.now().toString(),
                            responseType: 'arraybuffer',
                            withCredentials: false,
                            done: function (result) {
                                app[self.importFormat.name].toSpecif(result.response)
                                    .progress(setProgress)
                                    .done(handleResult)
                                    .fail(handleError);
                            },
                            fail: handleError
                        });
                    })
                        .catch(noOntologyFound);
                    return;
                }
            }
            ;
            message.show(i18n.lookup('ErrInvalidFileType', self.file.name), { severity: 'error' });
            self.clear();
            self.show();
            return;
        }
        ;
        let str = '';
        iFormats.forEach((s) => {
            if (moduleManager.isReady(s.name)) {
                if (!self.importFormat)
                    self.setFormat(s.id);
                if (typeof (app[s.name].toSpecif) == 'function' && typeof (app[s.name].verify) == 'function') {
                    str += '<button id="formatSelector-' + s.id + '" onclick="' + myFullName + '.setFormat(\'' + s.id + '\')" type="button" class="btn btn-light' + (self.importFormat.id == s.id ? ' active' : '') + '" data-toggle="popover" title="' + s.desc + '">' + s.label + '</button>';
                }
                ;
            }
            ;
        });
        $('#formatSelector').html(str);
        $('#ontologySelector').html(urlOntology);
        showFileSelect.set();
        setImporting(false);
    };
    self.hide = function () {
        app.busy.reset();
    };
    self.setFormat = function (fId) {
        if (importing || !fId)
            return;
        if (typeof (self.importFormat) == 'object' && fId != self.importFormat.id)
            $('#formatSelector-' + self.importFormat.id).removeClass('active');
        if (typeof (self.importFormat) != 'object' || fId != self.importFormat.id) {
            $('#formatSelector-' + fId).addClass('active');
            self.importFormat = LIB.itemById(iFormats, fId);
        }
        ;
        app[self.importFormat.name].init(self.importFormat.opts);
        let rF = makeTextField(i18n.LblFileName, '');
        if (fId == 'xls')
            rF += makeTextField(i18n.LblProjectName, self.projectName, { typ: 'line', handle: myFullName + '.enableActions()' });
        $('#helpImport').html(self.importFormat.help);
        $("#formNames").html(rF);
        $("#fileSelectBtn").html('<span>' + i18n.BtnFileSelect + '</span>'
            + '<input id="importFile" type="file" accept="' + self.importFormat.extensions.toString() + '" onchange="' + myFullName + '.pickFiles()" />');
        self.enableActions();
    };
    function getState() {
        let state = new CStateImport(), pnl = getTextLength(i18n.LblProjectName) > 0;
        state.cacheLoaded = typeof (app.projects) == 'object' && typeof (app.projects.selected) == 'object' && app.projects.selected.isLoaded();
        state.allValid = self.file && self.file.name.length > 0 && (self.importFormat.id != 'xls' || pnl);
        setTextState(i18n.LblProjectName, pnl ? 'is-valid' : 'is-invalid');
        return state;
    }
    ;
    self.enableActions = function () {
        let state = getState();
        try {
            document.getElementById("createBtn").disabled = !state.allValid || state.cacheLoaded;
            document.getElementById("cloneBtn").disabled = true;
            document.getElementById("updateBtn").disabled =
                document.getElementById("adoptBtn").disabled =
                    document.getElementById("replaceBtn").disabled = !state.allValid || !state.cacheLoaded;
        }
        catch (e) {
            console.error("importAny: enabling actions has failed (" + e + ").");
        }
        ;
    };
    function setImporting(st) {
        importing = st;
        app.busy.set(st);
        let state = getState();
        try {
            document.getElementById("fileSelectBtn").disabled = st;
            document.getElementById("createBtn").disabled = st || !state.allValid || state.cacheLoaded;
            document.getElementById("cloneBtn").disabled = true;
            document.getElementById("updateBtn").disabled =
                document.getElementById("adoptBtn").disabled =
                    document.getElementById("replaceBtn").disabled = st || !state.allValid || !state.cacheLoaded;
        }
        catch (e) {
            console.error("importAny: setting state 'importing' has failed (" + e + ").");
        }
        ;
    }
    self.pickFiles = function () {
        let f = document.getElementById("importFile").files[0];
        if (app[self.importFormat.name].verify(f)) {
            self.file = f;
            setTextValue(i18n.LblFileName, f.name);
            if (self.importFormat.id == 'xls' && getTextLength(i18n.LblProjectName) < 1) {
                self.projectName = self.file.name.fileName();
                setTextValue(i18n.LblProjectName, self.projectName);
                setFocus(i18n.LblProjectName);
            }
            ;
            self.enableActions();
        }
        else {
            self.clear();
        }
    };
    self.importLocally = function (mode) {
        if (importing || !mode)
            return;
        setImporting(true);
        importMode = { id: mode };
        setProgress(i18n.MsgReading, 10);
        getOntology(urlOntology)
            .then((ont) => {
            app.ontology = ont;
            self.projectName = textValue(i18n.LblProjectName);
            readFile(self.file, app[self.importFormat.name].toSpecif);
        })
            .catch(noOntologyFound);
        return;
        function readFile(f, fn) {
            let rdr = new FileReader();
            rdr.onload = (evt) => {
                if (evt.target && evt.target.result)
                    fn(evt.target.result)
                        .progress(setProgress)
                        .done(handleResult)
                        .fail(handleError);
            };
            rdr.readAsArrayBuffer(f);
        }
    };
    function terminateWithSuccess() {
        message.show(i18n.lookup('MsgImportSuccessful', self.file.name), { severity: "success", duration: CONFIG.messageDisplayTimeShort });
        setTimeout(() => {
            self.clear();
            if (urlP)
                delete urlP[CONFIG.keyImport];
            moduleManager.show({ view: '#' + (app.title == "check" ? CONFIG.importAny : (urlP && urlP[CONFIG.keyView] ? urlP[CONFIG.keyView] : CONFIG.specifications)), urlParams: urlP });
        }, CONFIG.showTimelag);
    }
    function handleError(xhr) {
        self.clear();
        LIB.stdError(xhr);
        self.show();
    }
    function noOntologyFound(xhr) {
        handleError(new resultMsg(xhr.status == 0 ? 404 : xhr.status, xhr.statusText, "text", "Ontology not found"));
    }
    function handleResult(data) {
        var resQ = [], resIdx = 0;
        if (Array.isArray(data)) {
            resQ = data;
            handle(resQ.shift(), resIdx);
        }
        else {
            resQ.length = 0;
            handle(data, 0);
        }
        ;
        return;
        function handleNext() {
            if (resQ.length > 0)
                handle(resQ.shift(), ++resIdx);
            else
                terminateWithSuccess();
        }
        function handle(dta, idx) {
            setProgress(importMode.id + ' project', 20);
            let opts = self.importFormat.opts || {};
            opts.sourceFileName = self.file.name;
            opts.mode = idx < 1 ? importMode.id : opts.multipleMode || 'update';
            opts.normalizeTerms = true;
            opts.deduplicate =
                opts.addGlossary =
                    opts.addUnreferencedResources = resQ.length < 1;
            switch (opts.mode) {
                case 'create':
                case 'replace':
                    opts.collectProcesses = false;
                    app.projects.create(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
                    break;
                case 'update':
                    opts.collectProcesses = false;
                    app.projects.selected.update(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
                    break;
                case 'adopt':
                    opts.collectProcesses = true;
                    app.projects.selected.adopt(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
            }
            ;
            console.info(importMode.id + ' project ' + (dta.title ? (typeof (dta.title) == 'string' ? dta.title : LIB.languageTextOf(dta.title, { targetLanguage: browser.language })) : dta.id));
        }
        ;
    }
    ;
    function setProgress(msg, perc) {
        $('#progress .progress-bar').css('width', perc + '%').html(msg);
    }
    function getOntology(urlO) {
        return new Promise((resolve, reject) => {
            LIB.httpGet({
                url: urlO + "?" + new Date().toISOString(),
                responseType: 'arraybuffer',
                withCredentials: false,
                done: (xhr) => {
                    let txt = JSON.parse(LIB.ab2str(xhr.response)), ont = new COntology(txt);
                    if (ont.isValid()) {
                        resolve(ont);
                    }
                    else
                        reject(new resultMsg(539, "bad file", "text", "Ontology is invalid."));
                },
                fail: reject
            });
        });
    }
    return self;
});
