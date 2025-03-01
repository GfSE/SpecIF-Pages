"use strict";
/*!	SpecIF: Link Resources.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
moduleManager.construct({
    name: CONFIG.resourceLink
}, (self) => {
    "use strict";
    let myName = self.loadAs, myFullName = 'app.' + myName, selPrj, cData, selRes, opts, modalAddLink;
    self.eligibleSCL = [];
    self.selResStatements = [];
    self.allResources = [];
    function candidateMayBeObject(sC, res) {
        return (!sC.subjectClasses || LIB.indexByKey(sC.subjectClasses, selRes['class']) > -1)
            && (!sC.objectClasses || LIB.indexByKey(sC.objectClasses, res['class']) > -1);
    }
    function candidateMayBeSubject(sC, res) {
        return (!sC.objectClasses || LIB.indexByKey(sC.objectClasses, selRes['class']) > -1)
            && (!sC.subjectClasses || LIB.indexByKey(sC.subjectClasses, res['class']) > -1);
    }
    self.init = () => {
        self.clear();
        return true;
    };
    self.clear = () => {
        self.eligibleSCL.length = 0;
        self.selResStatements.length = 0;
        self.allResources.length = 0;
    };
    self.show = (options) => {
        self.clear();
        selPrj = app.projects.selected;
        cData = selPrj.cache;
        opts = Object.assign({}, options, {
            targetLanguage: browser.language,
            addIcon: true
        });
        selPrj.readItems('resource', [self.parent.tree.selectedNode.ref])
            .then((rL) => {
            selRes = rL[0];
            createStatement(opts);
        }, LIB.stdError);
        return;
        function createStatement(opts) {
            let pend = 3;
            self.eligibleSCL.length = 0;
            opts.eligibleStatementClasses.subjectClasses.concat(opts.eligibleStatementClasses.objectClasses).forEach((sCk) => { LIB.cacheE(self.eligibleSCL, sCk); });
            selPrj.readItems('statementClass', self.eligibleSCL, { extendClasses: true })
                .then((list) => {
                self.eligibleSCL = list;
                chooseResourceToLink();
            }, LIB.stdError);
            selPrj.readStatementsOf(LIB.keyOf(selRes))
                .then((list) => {
                self.selResStatements = list;
                chooseResourceToLink();
            }, LIB.stdError);
            self.allResources.length = 0;
            LIB.iterateSpecifNodes(cData.get("hierarchy", selPrj.nodes)
                .filter((h) => {
                return LIB.typeOf(h.resource, cData) != CONFIG.resClassUnreferencedResources;
            }), (nd) => {
                LIB.cacheE(self.allResources, nd.resource);
                return true;
            });
            selPrj.readItems('resource', self.allResources)
                .then((list) => {
                LIB.sortBy(list, (el) => { return cData.instanceTitleOf(el, opts); });
                self.allResources = list;
                chooseResourceToLink();
            }, LIB.stdError);
            return;
            function chooseResourceToLink() {
                if (--pend < 1) {
                    const modalId = "addLink";
                    $('#' + modalId).remove();
                    let staClasses = self.eligibleSCL.map((sC) => {
                        return {
                            title: LIB.titleOf(sC, { lookupTitles: true, targetLanguage: selPrj.language }),
                            description: sC.description
                        };
                    });
                    staClasses[0].checked = true;
                    $('body').append('<div id="' + modalId + '" class="modal fade" tabindex="-1" >'
                        + '<div class="modal-dialog modal-xl" >'
                        + '<div class="modal-content">'
                        + '<div class="modal-header bg-success text-white" >'
                        + '<h5 class="modal-title" >' + i18n.MsgCreateStatement + '</h5>'
                        + '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" > </button>'
                        + '</div>'
                        + '<div class="modal-body" >'
                        + '<div class="row">'
                        + '<div class="col-xl-6">'
                        + makeRadioField(i18n.LblStatementClass, staClasses, { handle: myFullName + '.filterClicked()' })
                        + makeTextField(i18n.TabFilter, '', { typ: 'line', handle: myFullName + '.filterClicked()', classes: 'mt-1' })
                        + '</div>'
                        + '<div class="col-xl-6">'
                        + '<div class="mt-1 text-primary"><em>' + i18n.MsgSelectResource + ':</em></div>'
                        + '<div id="resCandidates" style="max-height:' + ($('#app').outerHeight(true) - 250) + 'px; overflow:auto" ></div>'
                        + '</div>'
                        + '</div>'
                        + '</div>'
                        + '<div class="modal-footer" >'
                        + '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal" >' + i18n.BtnCancel + '</button>'
                        + '<button type="button" id="btn-modal-saveResourceAsSubject" class="btn btn-success" onclick="' + myFullName + '.saveClicked(\'subject\')">' + i18n.IcoAdd + '&#160;' + i18n.LblSaveRelationAsSource + '</button>'
                        + '<button type="button" id="btn-modal-saveResourceAsObject" class="btn btn-success" onclick="' + myFullName + '.saveClicked(\'object\')">' + i18n.IcoAdd + '&#160;' + i18n.LblSaveRelationAsTarget + '</button>'
                        + '</div>'
                        + '</div>'
                        + '</div>'
                        + '</div>');
                    const addLink = document.getElementById(modalId);
                    addLink.addEventListener('shown.bs.modal', app[myName].filterClicked);
                    modalAddLink = new bootstrap.Modal(addLink);
                    modalAddLink.show();
                }
            }
        }
    };
    self.hide = () => {
        self.clear();
    };
    self.filterClicked = () => {
        self.selectedStatementClass = self.eligibleSCL[radioValue(i18n.LblStatementClass)];
        setFocus(i18n.TabFilter);
        let eligibleRs = '', searchStr = textValue(i18n.TabFilter), reTi = new RegExp(searchStr.escapeRE(), 'i');
        let sL = self.selResStatements.filter((s) => { return LIB.references(s['class'], self.selectedStatementClass); });
        self.allResources.forEach((res, i) => {
            if (res.id != selRes.id
                && LIB.referenceIndexBy(sL, 'subject', res) < 0
                && LIB.referenceIndexBy(sL, 'object', res) < 0
                && (candidateMayBeObject(self.selectedStatementClass, res)
                    || candidateMayBeSubject(self.selectedStatementClass, res))) {
                let ti = cData.instanceTitleOf(res, $.extend({}, opts, { neverEmpty: true }));
                if (reTi.test(ti))
                    eligibleRs += '<div id="cand-' + i + '" class="candidates text-black bg-white" onclick="' + myFullName + '.itemClicked(\'' + i + '\')">' + ti + '</div>';
            }
        });
        document.getElementById("resCandidates").innerHTML = eligibleRs || "<em>" + i18n.MsgNoMatchingObjects + "</em>";
        document.getElementById("btn-modal-saveResourceAsObject").disabled = true;
        document.getElementById("btn-modal-saveResourceAsSubject").disabled = true;
    };
    self.itemClicked = (idx) => {
        if (self.selectedCandidate && !LIB.equalKey(self.selectedCandidate.resource, self.allResources[idx])) {
            self.selectedCandidate.domEl.classList.remove("text-white");
            self.selectedCandidate.domEl.classList.add("text-black");
            self.selectedCandidate.domEl.classList.remove("bg-secondary");
            self.selectedCandidate.domEl.classList.add("bg-white");
        }
        ;
        let el = document.getElementById("cand-" + idx);
        el.classList.remove("text-black");
        el.classList.add("text-white");
        el.classList.remove("bg-white");
        el.classList.add("bg-secondary");
        self.selectedCandidate = { resource: self.allResources[idx], domEl: el };
        let btn = document.getElementById("btn-modal-saveResourceAsObject");
        if (candidateMayBeObject(self.selectedStatementClass, self.selectedCandidate.resource)) {
            btn.disabled = false;
            btn.setAttribute("data-toggle", "popover");
            btn.setAttribute("title", "'" + cData.instanceTitleOf(selRes, opts) + "' "
                + LIB.titleOf(self.selectedStatementClass, opts) + " '"
                + cData.instanceTitleOf(self.selectedCandidate.resource, opts) + "'");
        }
        else {
            btn.disabled = true;
        }
        ;
        btn = document.getElementById("btn-modal-saveResourceAsSubject");
        if (candidateMayBeSubject(self.selectedStatementClass, self.selectedCandidate.resource)) {
            btn.disabled = false;
            btn.setAttribute("data-toggle", "popover");
            btn.setAttribute("title", "'" + cData.instanceTitleOf(self.selectedCandidate.resource, opts) + "' "
                + LIB.titleOf(self.selectedStatementClass, opts) + " '"
                + cData.instanceTitleOf(selRes, opts) + "'");
        }
        else {
            btn.disabled = true;
        }
        ;
    };
    self.saveStatement = (dir) => {
        let sta = {
            id: LIB.genID(CONFIG.prefixS),
            class: LIB.makeKey(self.selectedStatementClass.id),
            subject: LIB.makeKey(dir.secondAs == 'object' ? selRes.id : self.selectedCandidate.resource.id),
            object: LIB.makeKey(dir.secondAs == 'object' ? self.selectedCandidate.resource.id : selRes.id),
            changedAt: new Date().toISOString()
        };
        if (app.me.userName != CONFIG.userNameAnonymous)
            sta.changedBy = app.me.userName;
        return selPrj.createItems('statement', [sta]);
    };
    self.saveClicked = (dir) => {
        self.saveStatement({ secondAs: dir })
            .then(() => {
            self.parent.doRefresh({ forced: true });
        }, LIB.stdError);
        modalAddLink.hide();
    };
    return self;
});
