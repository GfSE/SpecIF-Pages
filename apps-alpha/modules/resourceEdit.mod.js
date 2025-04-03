"use strict";
/*!	SpecIF: Resource Edit.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
class CPropertyToEdit extends CPropertyToShow {
    constructor(p, rC) {
        super(p, rC);
    }
    dispOpts() {
        let opts = { hint: this.pC.description };
        if (!this.pC.permissionVector.U)
            opts.typ = 'display';
        return opts;
    }
    editField(opts) {
        let localOpts = Object.assign({
            lookupTitles: true,
            keepTitleLinkingPatterns: true,
            targetLanguage: this.selPrj.language
        }, opts), ti = LIB.titleOf(this, localOpts);
        if (this.dT.enumeration) {
            let entryL = this.dT.enumeration.map((eV) => {
                let val = this.dT.type == XsDataType.String ? app.ontology.localize(LIB.languageTextOf(eV.value, localOpts), localOpts) : eV.value;
                return { title: val, id: eV.id, checked: this.enumIdL.includes(eV.id) };
            });
            return makeSelectionField(ti, entryL, Object.assign(this.dispOpts(), { kind: this.pC.multiple ? 'checkbox' : 'radio' }));
        }
        ;
        if (this.dT.type == XsDataType.Boolean) {
            return makeBooleanField(ti, this.values.length > 0 ? LIB.isTrue(this.values[0]) : false, this.dispOpts());
        }
        ;
        if (this.dT.type == XsDataType.String && this.pC.title == CONFIG.propClassDiagram) {
            return this.makeDiagramField(localOpts);
        }
        ;
        if (this.pC.permissionVector.U) {
            let self = this;
            function makeInner() {
                let str = '';
                self.dT.sequence.forEach((d, i) => {
                    if (opts && opts.dialogForm)
                        opts.dialogForm.addField(d.title, LIB.itemByKey(app.projects.selected.cache.dataTypes, d.dataType));
                    str += makeTextField(d.title, self.values[0][i], {
                        typ: 'line',
                        handle: opts.myFullName + '.check()',
                        hint: d.description
                    });
                });
                return str;
            }
            if (this.dT.type == XsDataType.ComplexType) {
                return makeTextField(ti, makeInner(), {
                    typ: 'outer',
                    hint: this.pC.description
                });
            }
            else {
                if (opts && opts.dialogForm)
                    opts.dialogForm.addField(ti, this.dT);
                return makeTextField(ti, this.dT.type == XsDataType.String ? this.get(localOpts).escapeHTML() : this.get(localOpts), {
                    typ: this.dT.type == XsDataType.String && app.ontology.propertyClassIsText(this.pC.title) ? 'area' : 'line',
                    handle: opts.myFullName + '.check()',
                    hint: this.pC.description
                });
            }
            ;
        }
        else {
            return makeTextField(ti, this.get(localOpts), {
                typ: 'display',
                hint: this.pC.description
            });
        }
        ;
    }
    renderImg(opts) {
        return '<div id="' + tagId(this['class'].id) + '">'
            + this.renderFile(this.values.length > 0 ? LIB.languageTextOf(this.values[0], opts) : '', Object.assign({ renderFiles: true, imgClass: 'forImagePreview' }, opts))
            + '</div>';
    }
    makeDiagramField(opts) {
        function imgExts() {
            let str = '';
            CONFIG.imgExtensions.forEach((ext, idx) => {
                str += (idx < 1 ? '.' + ext : (str.includes(ext) ? '' : ',.' + ext));
            });
            return str;
        }
        if (this.pC.permissionVector.U) {
            return '<div class="row mx-0 my-1 attribute form-active" >'
                + '<div class="col-3 attribute-label" >' + LIB.titleOf(this, opts) + '</div>'
                + '<div class="col-9 attribute-value">'
                + '<div class="btn-group" style="float: right;" >'
                + '<span class="btn btn-light btn-fileinput">'
                + '<span>' + i18n.IcoEdit + '</span>'
                + '<input id="file' + simpleHash(this['class'].id)
                + '" type="file" accept="' + imgExts() + '" onchange="' + opts.myFullName + '.updateDiagram(\'' + this['class'].id + '\')" />'
                + '</span>'
                + '<button class="btn btn-danger" data-toggle="popover" '
                + 'onclick="' + opts.myFullName + '.removeDiagram(\'' + this['class'].id + '\')" title="' + i18n.LblDelete + '">' + i18n.IcoDelete
                + '</button>'
                + '</div>'
                + this.renderImg(opts)
                + '</div>'
                + '</div>';
        }
        else {
            return '<div class="row mx-0 my-1 attribute">'
                + '<div class="col-3 attribute-label" >' + LIB.titleOf(this, opts) + '</div>'
                + '<div class="col-9 attribute-value">' + this.renderImg(opts) + '</div>'
                + '</div>';
        }
    }
    getEditedValue(opts) {
        if (!this.pC.permissionVector.U)
            return;
        let localOpts = Object.assign({
            lookupTitles: true,
            keepTitleLinkingPatterns: true,
            targetLanguage: this.selPrj.language,
            imgClass: 'forImagePreview'
        }, opts), ti = LIB.titleOf(this, localOpts);
        if (this.dT.enumeration) {
            let valL;
            if (this.pC.multiple) {
                valL = checkboxValues(ti);
            }
            else {
                let val = radioValue(ti);
                valL = val ? [val] : [];
            }
            ;
            return { class: LIB.makeKey(this.pC.id), values: valL.map(v => { return { id: v }; }) };
        }
        ;
        let val;
        switch (this.dT.type) {
            case XsDataType.String:
                if (this.pC.title == CONFIG.propClassDiagram) {
                    return { class: LIB.makeKey(this.pC.id), values: this.values };
                }
                else {
                    val = textValue(ti);
                    if (LIB.hasContent(val)) {
                        let term = app.ontology.getTermResource('propertyClass', this.pC.title, { eligibleOnly: true });
                        if (term && app.ontology.valueByTitle(term, "SpecIF:multiLanguage") == 'true') {
                            if (this.values.length > 0 && LIB.multiLanguageValueHasContent(this.values[0])) {
                                let langV = LIB.languageValueOf(this.values[0], { targetLanguage: localOpts.targetLanguage, dontReturnDefaultValue: true });
                                if (langV) {
                                    langV.text = val;
                                    langV.language = localOpts.targetLanguage;
                                }
                                else {
                                    this.values[0].push({ text: val, language: localOpts.targetLanguage });
                                }
                                ;
                                return { class: LIB.makeKey(this.pC.id), values: this.values };
                            }
                            ;
                            return { class: LIB.makeKey(this.pC.id), values: [[{ text: val, language: localOpts.targetLanguage }]] };
                        }
                        ;
                        return { class: LIB.makeKey(this.pC.id), values: [[{ text: val }]] };
                    }
                    ;
                    return { class: LIB.makeKey(this.pC.id), values: [] };
                }
                ;
            case XsDataType.Boolean:
                val = booleanValue(ti).toString();
                return { class: LIB.makeKey(this.pC.id), values: [val] };
            case XsDataType.ComplexType:
            default:
                val = textValue(ti);
                return { class: LIB.makeKey(this.pC.id), values: (LIB.hasContent(val) ? [val] : []) };
        }
        ;
    }
}
class CResourceToEdit {
    constructor(el) {
        this.selPrj = app.projects.selected;
        this.id = el.id;
        this.rC = LIB.getExtendedClasses(this.selPrj.cache.get("resourceClass", "all"), [el['class']])[0];
        this.language = el.language || this.selPrj.language;
        this.dialogForm = new CCheckDialogInput();
        this.properties = el.properties.map((pr) => { return new CPropertyToEdit(pr, this.rC); });
        this.newFiles = [];
    }
    editForm(opts) {
        if (this.properties.length > 0) {
            let self = this, localOpts = {
                lookupTitles: true,
                targetLanguage: this.language
            }, editOpts = Object.assign({
                dialogForm: this.dialogForm,
            }, opts);
            const modalId = "editR";
            $('#' + modalId).remove();
            $('body').append('<div id="' + modalId + '" class="modal fade" tabindex="-1" >'
                + '<div class="modal-dialog modal-xl" >'
                + '<div class="modal-content">'
                + '<div class="modal-header ' + (opts.mode == 'update' ? 'bg-primary' : 'bg-success') + ' text-white" >'
                + '<h5 class="modal-title" >' + opts.dialogTitle + '</h5>'
                + '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" > </button>'
                + '</div>'
                + '<div class="modal-body" >'
                + '<div style="container max-height:' + (LIB.getHeight('#app') - 220) + 'px; overflow:auto" >'
                + function () {
                    let form = '';
                    self.properties.forEach((p) => { form += p.editField(editOpts); });
                    return form;
                }()
                + '</div>'
                + '</div>'
                + '<div class="modal-footer" >'
                + function () {
                    let btns = '';
                    opts.msgBtns.forEach((b) => { btns += '<button type="button" id="' + b.id + '" class="btn ' + b.cssClass + '">' + b.label + '</button>'; });
                    return btns;
                }()
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>');
            const editR = document.getElementById(modalId);
            editR.addEventListener('shown.bs.modal', () => { setFocus(app.ontology.localize(CONFIG.propClassTitle, localOpts)); self.check(); });
            opts.msgBtns.forEach((b) => {
                document.getElementById(b.id)
                    .addEventListener('click', () => { b.action(self.modalEditR); });
            });
            this.modalEditR = new bootstrap.Modal(editR);
            this.modalEditR.show();
        }
    }
    check() {
        let ok = this.dialogForm.check();
        Array.from(document.getElementsByClassName('btn-editR-save'), (btn) => { btn.disabled = !ok; });
    }
    ;
    updateDiagram(cId) {
        let f = document.getElementById("file" + simpleHash(cId)).files[0];
        readFile(f, (data) => {
            let fType = f.type || LIB.attachment2mediaType(f.name), fName = 'files_and_images/' + f.name, newFile = new CFileWithContent({ blob: data, id: 'F-' + simpleHash(fName), title: fName, type: fType, changedAt: new Date(f.lastModified).toISOString() });
            LIB.itemBy(this.properties, 'class', LIB.makeKey(cId))
                .values = [LIB.makeMultiLanguageValue('<object data="' + fName + '" type="' + fType + '">' + fName + '</object>')];
            this.newFiles.push(newFile);
            document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview ' + tagId(fName) + '">' + newFile.renderImage() + '</div>';
        });
        return;
        function readFile(f, fn) {
            const rdr = new FileReader();
            rdr.onload = () => {
                fn(new Blob([rdr.result], { type: f.type }));
            };
            rdr.readAsArrayBuffer(f);
        }
    }
    removeDiagram(cId) {
        LIB.itemBy(this.properties, 'class', LIB.makeKey(cId)).values = [];
        document.getElementById(tagId(cId)).innerHTML = '';
    }
    getNewFiles() {
        return this.newFiles;
    }
    getProperties() {
        let editedProps = LIB.forAll(this.properties, (p) => {
            return p.getEditedValue({ targetLanguage: this.language });
        });
        return editedProps;
    }
}
moduleManager.construct({
    name: CONFIG.resourceEdit
}, (self) => {
    "use strict";
    var modalSelectRC;
    self.init = () => {
        self.clear();
        return true;
    };
    self.clear = () => {
    };
    let msgBtns = {
        cancel: {
            id: 'btn-modal-cancel',
            label: i18n.BtnCancel,
            cssClass: 'btn-secondary',
            action: (thisModal) => {
                self.parent.doRefresh({ forced: true });
                thisModal.hide();
            }
        },
        update: {
            id: 'btn-modal-update',
            label: i18n.BtnUpdateObject,
            cssClass: 'btn-primary btn-editR-save',
            action: (thisModal) => {
                save('update');
                thisModal.hide();
            }
        },
        insert: {
            id: 'btn-modal-insert',
            label: i18n.BtnInsert,
            cssClass: 'btn-success btn-editR-save',
            action: (thisModal) => {
                save('insert');
                thisModal.hide();
            }
        },
        insertAfter: {
            id: 'btn-modal-insertAfter',
            label: i18n.BtnInsertSuccessor,
            cssClass: 'btn-success btn-editR-save',
            action: (thisModal) => {
                save('insertAfter');
                thisModal.hide();
            }
        },
        insertBelow: {
            id: 'btn-modal-insertBelow',
            label: i18n.BtnInsertChild,
            cssClass: 'btn-success btn-editR-save',
            action: (thisModal) => {
                save('insertBelow');
                thisModal.hide();
            }
        }
    };
    self.show = (opts) => {
        self.clear();
        self.localOpts = Object.assign({
            myFullName: 'app.' + self.loadAs + '.toEdit',
            mode: opts.mode
        }, opts);
        if (self.parent.tree.selectedNode)
            self.localOpts.selNodeId = self.parent.tree.selectedNode.id;
        switch (self.localOpts.mode) {
            case 'create':
                selectResClass(self.localOpts)
                    .then((rC) => {
                    self.localOpts.dialogTitle = i18n.MsgCreateResource + ' (' + rC.title + ')';
                    return app.projects.selected.makeEmptyResource(rC);
                })
                    .then((r) => {
                    self.newRes = r;
                    if (app.me.userName != CONFIG.userNameAnonymous)
                        self.newRes.createdBy = app.me.userName;
                    if (self.localOpts.selNodeId)
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.insertAfter,
                            msgBtns.insertBelow
                        ];
                    else
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.insert
                        ];
                    editRes();
                })
                    .catch(LIB.stdError);
                break;
            case 'clone':
            case 'update':
                app.projects.selected.readItems('resource', [self.parent.tree.selectedNode.ref], { showEmptyProperties: true })
                    .then((rL) => {
                    self.newRes = rL[0];
                    if (self.localOpts.mode == 'clone') {
                        self.newRes.id = LIB.genID(CONFIG.prefixR);
                        self.localOpts.dialogTitle = i18n.MsgCloneResource;
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.insertAfter,
                            msgBtns.insertBelow
                        ];
                    }
                    else {
                        if (rL[0].revision)
                            self.newRes.replaces = [rL[0].revision];
                        self.localOpts.dialogTitle = i18n.MsgUpdateResource;
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.update
                        ];
                    }
                    ;
                    editRes();
                })
                    .catch(LIB.stdError);
        }
        ;
        return;
        function editRes() {
            self.toEdit = new CResourceToEdit(self.newRes);
            self.toEdit.editForm(self.localOpts);
        }
        function selectResClass(opts) {
            return new Promise((resolve, reject) => {
                app.projects.selected.readItems('resourceClass', opts.eligibleResourceClasses.map((rCId) => { return LIB.makeKey(rCId); }))
                    .then((rCL) => {
                    function resv() {
                        resolve(LIB.itemById(rCL, radioValue(i18n.LblResourceClass)));
                        modalSelectRC.hide();
                    }
                    function rejc() {
                        reject({ status: 0, statusText: 'Create Resource cancelled by the user' });
                        modalSelectRC.hide();
                    }
                    let resClasses;
                    if (rCL.length > 0) {
                        resClasses = rCL.map((rC) => {
                            return {
                                id: rC.id,
                                title: LIB.titleOf(rC, { lookupTitles: true, targetLanguage: app.projects.selected.language }),
                                description: rC.description
                            };
                        });
                        if (resClasses.length > 1) {
                            resClasses[0].checked = true;
                            const modalId = "selectRC";
                            $('#' + modalId).remove();
                            $('body').append('<div id="' + modalId + '" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" >'
                                + '<div class="modal-dialog" >'
                                + '<div class="modal-content">'
                                + '<div class="modal-header bg-success text-white" >'
                                + '<h5 class="modal-title" >' + i18n.MsgSelectResClass + '</h5>'
                                + '<button id="selRCclose" type="button" class="btn-close" aria-label="Close" > </button>'
                                + '</div>'
                                + '<div class="modal-body" >'
                                + '<div style="max-height:' + (LIB.getHeight('#app') - 220) + 'px; overflow:auto" >'
                                + makeSelectionField(i18n.LblResourceClass, resClasses, { kind: 'radio' })
                                + '</div>'
                                + '</div>'
                                + '<div class="modal-footer" >'
                                + '<button id="selRCcancel" type="button" class="btn btn-secondary">' + i18n.BtnCancel + '</button>'
                                + '<button id="selRCnext" type="button" class="btn btn-success">' + i18n.LblNextStep + '</button>'
                                + '</div>'
                                + '</div>'
                                + '</div>'
                                + '</div>');
                            const domEl = document.getElementById(modalId);
                            domEl.addEventListener('hidePrevented.bs.modal', rejc);
                            [
                                { id: 'selRCclose', action: rejc },
                                { id: 'selRCcancel', action: rejc },
                                { id: 'selRCnext', action: resv }
                            ].forEach((b) => {
                                document.getElementById(b.id)
                                    .addEventListener('click', b.action);
                            });
                            modalSelectRC = new bootstrap.Modal(domEl);
                            modalSelectRC.show();
                        }
                        else {
                            resolve(rCL[0]);
                        }
                    }
                    else {
                        reject({ status: 999, statusText: "No resource class defined for manual creation of a resource." });
                    }
                    ;
                }, reject);
            });
        }
    };
    self.hide = () => {
    };
    function save(mode) {
        let pend = 2, chD = new Date().toISOString();
        self.toEdit.getProperties().forEach((nP) => {
            let i = LIB.indexBy(self.newRes.properties, 'class', nP['class']);
            if (i > -1)
                self.newRes.properties.splice(i, 1, nP);
            else
                throw Error('Programming error: Edited property does not replace an existing');
        });
        self.newRes.properties = self.newRes.properties.filter((p) => {
            return (p.values.length > 0);
        });
        self.newRes.changedAt = chD;
        if (app.me.userName != CONFIG.userNameAnonymous)
            self.newRes.changedBy = app.me.userName;
        self.newRes.revision = "rev-" + simpleHash(chD);
        switch (mode) {
            case 'update':
                app.projects.selected.updateItems('resource', [self.newRes])
                    .then(finalize, LIB.stdError);
                break;
            default:
                app.projects.selected.createItems('resource', [self.newRes])
                    .then(finalize, LIB.stdError);
        }
        ;
        switch (mode) {
            case 'insert':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD }])
                    .then(finalize, LIB.stdError);
                break;
            case 'insertAfter':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD, predecessor: self.localOpts.selNodeId }])
                    .then(finalize, LIB.stdError);
                break;
            case 'insertBelow':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD, parent: self.localOpts.selNodeId }])
                    .then(finalize, LIB.stdError);
        }
        ;
        app.projects.selected.createItems('file', self.toEdit.getNewFiles())
            .then(finalize, LIB.stdError);
        return;
        function finalize() {
            if (--pend < 1) {
                self.parent.updateTree({
                    targetLanguage: self.newRes.language || browser.language
                });
                let selNd = self.parent.tree.selectedNode;
                if (selNd) {
                    switch (mode) {
                        case 'insertBelow':
                            self.parent.tree.openNode();
                        case 'insertAfter':
                            self.parent.tree.selectNode(selNd.getNextNode());
                    }
                }
                else {
                    self.parent.tree.selectFirstNode();
                }
                ;
                self.parent.doRefresh({ forced: true });
            }
        }
    }
    ;
    return self;
});
