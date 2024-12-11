"use strict";
/*!	SpecIF Class-based Reports.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: CONFIG.reports
}, function (self) {
    "use strict";
    var selPrj;
    self.list = [];
    self.init = function () {
        self.list = [];
    };
    self.clear = function () {
        self.list = [];
        app.busy.reset();
    };
    self.hide = function () {
        $(self.view).empty();
        self.clear();
    };
    function handleError(xhr) {
        self.hide();
        self.clear();
        LIB.stdError(xhr, self.parent.returnToCaller);
    }
    function showNotice(txt) {
        $('#' + CONFIG.reports).html('<div class="notice-default" >' + txt + '</div>');
    }
    self.show = function (options) {
        selPrj = app.projects.selected;
        self.parent.showLeft.reset();
        let opts = Object.assign({
            targetLanguage: selPrj.language,
            lookupTitles: true,
            lookupValues: true
        }, options);
        self.list = [];
        let tr = self.parent.tree.get();
        if (!tr || tr.length < 1) {
            showNotice(i18n.MsgNoReports);
            app.busy.reset();
            return true;
        }
        ;
        if (!opts || !opts.urlParams)
            setUrlParams({
                project: selPrj.id,
                view: self.view
            });
        app.busy.set();
        showNotice(i18n.MsgAnalyzing);
        function addResourceClassReport() {
            var rCR = {
                title: app.ontology.localize("SpecIF:Resource", { targetLanguage: browser.language, plural: true }),
                category: FilterCategory.resourceClass,
                pid: selPrj.id,
                scaleMin: 0,
                scaleMax: 0,
                datasets: []
            };
            selPrj.cache.get("resourceClass", selPrj.resourceClasses)
                .forEach((rC) => {
                if (!CONFIG.excludedFromTypeFiltering.includes(rC.title)
                    && (!Array.isArray(rC.instantiation) || rC.instantiation.includes(SpecifInstantiation.Auto) || rC.instantiation.includes(SpecifInstantiation.User))) {
                    rCR.datasets.push({
                        label: LIB.titleOf(rC, opts),
                        id: rC.id,
                        count: 0,
                        color: CONFIG.focusColor
                    });
                }
            });
            self.list.push(rCR);
        }
        addResourceClassReport();
        function addStatementClassReport() {
            var sCR = {
                title: app.ontology.localize("SpecIF:Statement", { targetLanguage: browser.language, plural: true }),
                category: FilterCategory.statementClass,
                pid: selPrj.id,
                scaleMin: 0,
                scaleMax: 0,
                datasets: []
            };
            selPrj.cache.get("statementClass", selPrj.statementClasses)
                .forEach((sC) => {
                if (!Array.isArray(sC.instantiation) || sC.instantiation.includes(SpecifInstantiation.Auto) || sC.instantiation.includes(SpecifInstantiation.User))
                    sCR.datasets.push({
                        label: LIB.titleOf(sC, opts),
                        id: sC.id,
                        count: 0,
                        color: CONFIG.focusColor
                    });
            });
            self.list.push(sCR);
        }
        addStatementClassReport();
        function addEnumeratedValueReports() {
            function possibleValues(dt) {
                var dL = [];
                dt.enumeration.forEach((enV) => {
                    dL.push({
                        label: LIB.displayValueOf(enV.value, opts),
                        id: enV.id,
                        count: 0,
                        color: '#1a48aa'
                    });
                });
                dL.push({
                    label: i18n.LblNotAssigned,
                    id: CONFIG.notAssigned,
                    count: 0,
                    color: '#ffff00'
                });
                return dL;
            }
            let pC, dT;
            LIB.getExtendedClasses(selPrj.cache.get("resourceClass", "all"), selPrj.resourceClasses).forEach((rC) => {
                rC.propertyClasses.forEach((pck) => {
                    pC = selPrj.cache.get("propertyClass", [pck])[0];
                    dT = selPrj.cache.get("dataType", [pC.dataType])[0];
                    if (dT.enumeration) {
                        var aVR = {
                            title: LIB.titleOf(rC, opts) + ': ' + LIB.titleOf(pC, opts),
                            category: FilterCategory.enumValue,
                            pid: selPrj.id,
                            rCk: LIB.keyOf(rC),
                            pCk: pck,
                            scaleMin: 0,
                            scaleMax: 0,
                            datasets: possibleValues(dT)
                        };
                        self.list.push(aVR);
                    }
                });
            });
        }
        addEnumeratedValueReports();
        function incVal(rep, j) {
            rep.datasets[j].count++;
            rep.scaleMax = Math.max(rep.scaleMax, rep.datasets[j].count);
        }
        function evalResource(res) {
            function findEnumPanel(rL, rC, pC) {
                for (var i = rL.length - 1; i > -1; i--) {
                    if (rL[i].category == FilterCategory.enumValue
                        && LIB.references(rC, rL[i].rCk)
                        && LIB.references(pC, rL[i].pCk))
                        return i;
                }
                ;
                return -1;
            }
            let rCk = res['class'], j = LIB.indexById(self.list[0].datasets, rCk.id);
            if (j > -1)
                incVal(self.list[0], j);
            else
                throw Error("Did not find a report panel for resourceClass with id:" + rCk.id);
            let rC = LIB.getExtendedClasses(selPrj.cache.get("resourceClass", "all"), [rCk])[0], pC, dT, rp, i;
            rC.propertyClasses.forEach((pCk) => {
                pC = selPrj.cache.get("propertyClass", [pCk])[0];
                dT = selPrj.cache.get("dataType", [pC.dataType])[0];
                if (dT.enumeration && dT.enumeration.length > 0) {
                    i = findEnumPanel(self.list, rCk, pCk);
                    if (i > -1) {
                        rp = LIB.itemBy(res.properties, 'class', pCk);
                        if (rp && rp.values.length > 0) {
                            rp.values.forEach((val) => {
                                j = LIB.indexById(self.list[i].datasets, val.id);
                                if (j > -1) {
                                    incVal(self.list[i], j);
                                }
                            });
                        }
                        else {
                            incVal(self.list[i], self.list[i].datasets.length - 1);
                        }
                    }
                }
            });
        }
        function evalStatement(st) {
            let sCk = st['class'], j = LIB.indexById(self.list[1].datasets, sCk.id);
            if (j > -1)
                incVal(self.list[1], j);
            else
                throw Error("Did not find a report panel for resourceClass with id:" + sCk.id);
        }
        let pend = 0, visited = [];
        LIB.iterateNodes(selPrj.cache.get("hierarchy", selPrj.nodes)
            .filter((h) => {
            return LIB.typeOf(h.resource, selPrj.cache) != CONFIG.resClassUnreferencedResources;
        }), (nd) => {
            if (visited.includes(nd.resource.id))
                return;
            visited.push(nd.resource.id);
            pend++;
            selPrj.readItems('resource', [nd.resource], { reload: false, timelag: 10 })
                .then((resL) => {
                evalResource(resL[0]);
                if (--pend < 1) {
                    finalize();
                }
            }, handleError);
            pend++;
            selPrj.readStatementsOf(nd.resource, { dontCheckStatementVisibility: selPrj.aDiagramWithoutShowsStatementsForEdges(), asSubject: true })
                .then((staL) => {
                for (var sta of staL)
                    evalStatement(sta);
                if (--pend < 1) {
                    finalize();
                }
            }, handleError);
            return true;
        });
        return;
        function finalize() {
            self.list = removeEmptyReports(self.list);
            if (self.list.length > 0)
                $(self.view).html(renderReports(self.list));
            else
                showNotice(i18n.MsgNoReports);
            app.busy.reset();
        }
        function removeEmptyReports(rL) {
            return rL.filter((r) => {
                for (var s of r.datasets) {
                    if (s.count > 0)
                        return true;
                }
                ;
                return false;
            });
        }
        function renderReports(list) {
            var rs = '<div class="container-fluid background-select"><div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 pt-1 px-3">', lb;
            list.forEach((li, i) => {
                rs += '<div class="col my-1 px-1"><div class="card h-100"><div class="card-body">'
                    + '<h4 class="card-title">' + li.title + '</h4>'
                    + '<table style="width:100%; font-size:90%">'
                    + '<tbody>';
                li.datasets.forEach((ds, s) => {
                    lb = (li.category != FilterCategory.statementClass && ds.count > 0) ? '<a class="link-primary" onclick="app.' + self.loadAs + '.facetClicked(' + i + ',' + s + ')">' + ds.label + '</a>' : ds.label;
                    rs += '<tr>'
                        + '<td style="width:35%; white-space: nowrap">' + lb + '</td>'
                        + '<td class="px-2" style="width:10%; text-align:right">' + ds.count + '</td>'
                        + '<td>'
                        + '<div style="background-color:#1a48aa; height: 0.5em; border-radius: 0.2em; width: ' + barLength(li, ds) + '" />'
                        + '</td>'
                        + '</tr>';
                });
                rs += '</tbody>'
                    + '</table>'
                    + '</div></div></div>';
            });
            rs += '</div></div>';
            return rs;
            function barLength(rp, ds) {
                if (rp && ds) {
                    if (ds.count <= rp.scaleMin)
                        return '0%';
                    let val = Math.max(Math.min(ds.count, rp.scaleMax), rp.scaleMin);
                    return ((val - rp.scaleMin) / (rp.scaleMax - rp.scaleMin) * 100 + '%');
                }
                ;
                throw Error("Programming Error: Invalid report count or scale");
            }
        }
    };
    self.facetClicked = function (rX, cX) {
        var rep = self.list[rX], fL = [];
        switch (rep.category) {
            case FilterCategory.resourceClass:
                fL.push({ category: FilterCategory.resourceClass, selected: [rep.datasets[cX].id] });
                break;
            case FilterCategory.enumValue:
                fL.push({ category: FilterCategory.resourceClass, selected: [rep.rCk.id] });
                fL.push({ category: FilterCategory.enumValue, rCk: rep.rCk, pCk: rep.pCk, selected: [rep.datasets[cX].id] });
        }
        ;
        moduleManager.show({ view: '#' + CONFIG.objectFilter, filters: fL });
    };
    return self;
});
