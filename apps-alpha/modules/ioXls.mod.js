"use strict";
/*!	iLaH: Excel (XLS) import
    Dependencies: jQuery 3.0+, sheetjs
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)

    Limitation:
    - This code assumes that dataTypes with cetrtain names including DT-Text and DT-ShortString are retrieved from the ontology.
*/
moduleManager.construct({
    name: 'ioXls'
}, function (self) {
    "use strict";
    const myName = self.loadAs;
    var fDate;
    self.init = function () {
        return true;
    };
    self.verify = function (f) {
        if (f.lastModified) {
            fDate = new Date(f.lastModified).toISOString();
        }
        else {
            fDate = new Date().toISOString();
        }
        ;
        return true;
    };
    self.toSpecif = function (buf) {
        self.abortFlag = false;
        var xDO = $.Deferred();
        let data = xlsx2specif(buf, self.parent.projectName, fDate);
        xDO.resolve(data);
        return xDO;
    };
    self.fromSpecif = function (pr, opts) {
        specif2xlsx(pr, opts);
    };
    self.abort = function () {
        app.projects.abort();
        self.abortFlag = true;
    };
    return self;
    function xlsx2specif(buf, prjN, chAt) {
        "use strict";
        class Coord {
            constructor(addr) {
                let res = addr.match(/([A-Z]+)(\d+)/);
                if (!Array.isArray(res) || !res[1] || !res[2])
                    throw Error("Incomplete input data: Cell without address!");
                this.col = colIdx(res[1]);
                this.row = parseInt(res[2]);
            }
        }
        class Worksheet {
            constructor(wsN) {
                this.isValid = false;
                this.name = wsN;
                this.data = wb.Sheets[wsN],
                    this.resClass = resClassId(prjN + '-' + wsN);
                this.hid = CONFIG.prefixH + simpleHash(prjN + wsN);
                this.range = this.data["!ref"];
                if (this.range) {
                    let splittedRange = this.range.split(":");
                    if (splittedRange.length > 1) {
                        this.firstCell = new Coord(splittedRange[0]);
                        this.lastCell = new Coord(splittedRange[1]);
                        this.isValid = true;
                    }
                    ;
                }
                ;
                this.col2dT = new Map();
            }
        }
        function dataTypeId(str) {
            return CONFIG.prefixDT + simpleHash(str);
        }
        class PropClass {
            constructor(nm, ti, dTid) {
                this.id = propClassId(nm);
                this.title = ti;
                this.dataType = LIB.makeKey(dTid);
                this.changedAt = chAt;
            }
        }
        function propClassId(str) {
            return CONFIG.prefixPC + simpleHash(str);
        }
        class ResClass {
            constructor(nm, ti) {
                this.id = nm;
                this.title = ti;
                this.description = LIB.makeMultiLanguageValue('For resources specified per line of an excel sheet');
                this.instantiation = [SpecifInstantiation.User];
                this.propertyClasses = [];
                this.changedAt = chAt;
            }
        }
        function resClassId(str) {
            return CONFIG.prefixRC + simpleHash(str);
        }
        class StaClass {
            constructor(ti) {
                this.title = ti;
                this.id = staClassId(ti);
                this.description = LIB.makeMultiLanguageValue('For statements created by columns whose title is declared as a statement');
                this.instantiation = [SpecifInstantiation.User];
                this.changedAt = chAt;
            }
        }
        function staClassId(str) {
            return CONFIG.prefixSC + simpleHash(str);
        }
        function colName(colI) {
            function cName(idx, res) {
                if (idx < 1)
                    return res;
                let r = idx % 26, f = (idx - r) / 26;
                res = String.fromCharCode(r + 64) + res;
                return cName(f, res);
            }
            return cName(colI, '');
        }
        function cellName(col, row) {
            return colName(col) + row;
        }
        function colIdx(colN) {
            let idx = 0, f = 1;
            for (var i = colN.length - 1; i > -1; i--) {
                idx += f * (colN.charCodeAt(i) - 64);
                f *= 26;
            }
            ;
            return idx;
        }
        function collectDefinitions(ws) {
            if (ws && ws.isValid) {
                switch (ws.name) {
                    case "{Enumerations}":
                        let c, r, cell, dT, pC;
                        for (c = ws.firstCell.col; c < ws.lastCell.col + 1; c++) {
                            cell = ws.data[cellName(c, ws.firstCell.row)];
                            if (!cell || !cell.v)
                                continue;
                            dT = { id: dataTypeId(ws.name + c), title: '', type: XsDataType.String, enumeration: [], changedAt: chAt };
                            pC = { id: propClassId(ws.name + c), title: '', dataType: LIB.keyOf(dT), changedAt: chAt };
                            for (r = ws.firstCell.row; r < ws.lastCell.row + 1; r++) {
                                cell = ws.data[cellName(c, r)];
                                if (r == ws.firstCell.row) {
                                    pC.title = dT.title = (cell && cell.t == 's' ? cell.v : '');
                                }
                                else {
                                    if (cell && cell.t == 's' && cell.v)
                                        dT.enumeration.push({
                                            id: dT.id + '-' + r,
                                            value: LIB.makeMultiLanguageValue(cell.v)
                                        });
                                }
                                ;
                            }
                            ;
                            if (dT.title && dT.enumeration.length > 0) {
                                specifData.dataTypes.push(dT);
                                specifData.propertyClasses.push(pC);
                            }
                            ;
                        }
                        ;
                        break;
                    default:
                        if (ws.name.startsWith('{') && ws.name.endsWith('}'))
                            console.warn("Sheet with name " + ws.name + " skipped, because it has an unknown keyword in curly brackets");
                }
            }
        }
        function transformData(ws) {
            if (ws && ws.isValid) {
                if (ws.name.startsWith("{") && ws.name.endsWith("}"))
                    return;
                function isDateTime(cell) {
                    return cell && (cell.t == 'd' || cell.t == 's' && LIB.isIsoDateTime(cell.v));
                }
                function isInt(cell) {
                    return cell && (cell.t == 'n' && Number.isInteger(cell.v) || (cell.t == 's' && RE.Integer.test(cell.v)));
                }
                function isReal(cell) {
                    return cell && (cell.t == 'n' && !Number.isInteger(cell.v) || (cell.t == 's' && RE.Real().test(cell.v)));
                }
                function isBool(cell) {
                    return cell && (cell.t == 'b' || cell.t == 's' && (LIB.isTrue(cell.v) || LIB.isFalse(cell.v)));
                }
                function isStr(cell) {
                    return cell && cell.t == 's' && cell.v.length > 0;
                }
                function createFld(sh) {
                    if (sh.lastCell.row - sh.firstCell.row < 1)
                        return;
                    var fld = {
                        id: CONFIG.prefixR + simpleHash(prjN + sh.name + CONFIG.resClassFolder),
                        class: LIB.makeKey("RC-Folder"),
                        properties: [{
                                class: LIB.makeKey("PC-Name"),
                                values: [LIB.makeMultiLanguageValue(withoutContentInBracketsAtEnd(sh.name))]
                            }],
                        changedAt: chAt
                    };
                    specifData.resources.push(fld);
                    var hTree = {
                        id: sh.hid,
                        resource: LIB.keyOf(fld),
                        nodes: [],
                        changedAt: chAt
                    }, dupIdL = [];
                    for (var l = sh.firstCell.row + 1, L = sh.lastCell.row + 1; l < L; l++) {
                        createRes(sh, l);
                    }
                    ;
                    specifData.nodes[0].nodes.push(hTree);
                    return;
                    function createRes(ws, row) {
                        function getVal(dT, cell) {
                            if (cell && cell.v && dT)
                                if (dT.enumeration) {
                                    for (var eV of dT.enumeration)
                                        if ((eV.value[0].text || eV.value[0]) == cell.v)
                                            return eV.id;
                                    return '';
                                }
                            ;
                            switch (dT.type) {
                                case XsDataType.String:
                                    let v;
                                    switch (cell.t) {
                                        case "d":
                                            v = cell.v.toISOString();
                                            break;
                                        case "n":
                                            v = cell.v.toString();
                                            break;
                                        case "b":
                                            v = cell.v.toString();
                                            break;
                                        default: v = cell.v;
                                    }
                                    ;
                                    return LIB.makeMultiLanguageValue(v);
                                case XsDataType.DateTime:
                                    switch (cell.t) {
                                        case "d": return cell.v.toISOString();
                                        case "s":
                                            if (LIB.isIsoDateTime(cell.v))
                                                return cell.v;
                                            return '';
                                    }
                                    ;
                                case XsDataType.Integer:
                                case XsDataType.Double:
                                    switch (cell.t) {
                                        case "n": return cell.v.toString();
                                        case "s": return cell.v;
                                    }
                                    ;
                                case XsDataType.Boolean:
                                    switch (cell.t) {
                                        case "b": return cell.v.toString();
                                        case "s": return LIB.isTrue(cell.v).toString();
                                    }
                                    ;
                            }
                            ;
                            return '';
                        }
                        var res = {
                            class: LIB.makeKey(ws.resClass),
                            properties: [],
                            changedAt: chAt
                        };
                        let c, C, cell, val, pC, dT, id, pTi;
                        for (c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {
                            cell = ws.data[cellName(c, ws.firstCell.row)];
                            pTi = cell && cell.v ? cell.v.trim() : '';
                            if (!pTi)
                                continue;
                            cell = ws.data[cellName(c, row)];
                            if (cell && cell.v) {
                                if (CONFIG.nativeProperties.has(pTi)) {
                                    pC = CONFIG.nativeProperties.get(pTi);
                                    val = getVal({ type: pC.type }, cell);
                                    if (pC.check(val)) {
                                        res[pC.name] = val;
                                        console.info(ws.name + ", row " + row + ": '" + pTi + "' with value '" + val + "' has been mapped to the native property '" + pC.name + "'");
                                    }
                                    else
                                        console.warn(ws.name + ", row " + row + ": Cell value '" + cell.v + "' is invalid for the given native property '" + pTi + "'");
                                    continue;
                                }
                                ;
                                let cl = ws.col2dT.get(c);
                                if (cl) {
                                    pC = LIB.itemByKey(specifData.propertyClasses, cl);
                                    dT = LIB.itemByKey(specifData.dataTypes, pC.dataType);
                                    if (dT) {
                                        if (!id && CONFIG.idProperties.includes(pC.title))
                                            id = cell.v;
                                        val = getVal(dT, cell);
                                        if (dT.maxLength && (dT.maxLength < val.length)) {
                                            val = val.slice(0, dT.maxLength);
                                            console.warn('Text of cell ' + cellName(c, row) + ' on sheet ' + sh.name + ' has been truncated because it is too long');
                                        }
                                        ;
                                        if (val)
                                            res.properties.push({
                                                class: LIB.keyOf(pC),
                                                values: [val]
                                            });
                                    }
                                    else {
                                        console.error(myName + ': No dataType with id ' + pC.dataType.id + ' found for value ' + cell.v + ' in cell ' + cellName(c, row) + ' of worksheet ' + ws.name);
                                    }
                                }
                                else {
                                    console.error(myName + ': Did not find the key of a propertyClass that should have been created earlier');
                                }
                            }
                        }
                        ;
                        if (res.properties.length > 0) {
                            if (id) {
                                res.id = CONFIG.prefixR + simpleHash(ws.name + id);
                                if (LIB.indexById(specifData.resources, res.id) > -1) {
                                    dupIdL.push(id);
                                    let counts = {};
                                    dupIdL.forEach((x) => { counts[x] = (counts[x] || 0) + 1; });
                                    console.warn('The user-defined identifier', id, 'is occurring', counts[id] + 1, 'times.');
                                    res.id = CONFIG.prefixR + simpleHash(ws.name + id + counts[id]);
                                }
                                ;
                            }
                            else {
                                res.id = LIB.genID(CONFIG.prefixR);
                            }
                            ;
                            hTree.nodes.push({
                                id: CONFIG.prefixN + simpleHash(res.id + hTree.nodes.length),
                                resource: LIB.keyOf(res),
                                changedAt: chAt
                            });
                            specifData.resources.push(res);
                        }
                    }
                }
                function getPropClasses(ws) {
                    var pCs = [], pC, dT, c, C, cell, pTi;
                    for (c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {
                        cell = ws.data[cellName(c, ws.firstCell.row)];
                        pTi = cell && cell.v ? cell.v.trim() : '';
                        if (pTi) {
                            if (CONFIG.nativeProperties.has(pTi))
                                continue;
                            pC = LIB.itemByTitle(specifData.propertyClasses, pTi);
                            if (pC && pC.id) {
                                dT = LIB.itemByKey(specifData.dataTypes, pC.dataType);
                                if (dT && dT.enumeration) {
                                    let pCk = LIB.keyOf(pC);
                                    pCs.push(pCk);
                                    ws.col2dT.set(c, pCk);
                                    continue;
                                }
                                ;
                            }
                            ;
                            pC = getPropClass(c);
                            if (pC) {
                                LIB.cacheE(specifData.propertyClasses, pC);
                                let pCk = LIB.keyOf(pC);
                                pCs.push(pCk);
                                ws.col2dT.set(c, pCk);
                            }
                            ;
                        }
                        ;
                    }
                    ;
                    return pCs;
                    function getPropClass(cX) {
                        const defaultC = 'ShortString';
                        let valL = [], r, R;
                        for (r = ws.firstCell.row, R = ws.lastCell.row + 1; r < R; r++) {
                            valL.push(ws.data[cellName(cX, r)]);
                        }
                        ;
                        let pTi = valL[0] ? (valL[0].w || valL[0].v) : '', pC = '', nC = '';
                        let pc = LIB.itemByTitle(specifData.propertyClasses, pTi);
                        if (pc)
                            return pc;
                        for (var i = valL.length - 1; i > 0; i--) {
                            nC = classOf(valL[i]);
                            if (nC.length < 1)
                                continue;
                            if (!pC) {
                                pC = nC;
                                continue;
                            }
                            ;
                            if (pC == nC)
                                continue;
                            if (pC == 'Real' && nC == 'Integer')
                                continue;
                            if (pC == 'Integer' && nC == 'Real') {
                                pC = 'Real';
                                continue;
                            }
                            ;
                            pC = defaultC;
                        }
                        ;
                        if (!pC)
                            pC = defaultC;
                        if (pC == defaultC && app.ontology.propertyClassIsText(pTi))
                            pC = 'Text';
                        if (pC == defaultC) {
                            let maxL = 0, multLines = false;
                            for (var i = valL.length - 1; i > 0; i--) {
                                maxL = Math.max(maxL, valL[i] && valL[i].v ? valL[i].v.length : 0);
                                multLines = multLines || valL[i] && typeof (valL[i].v) == 'string' && valL[i].v.indexOf('\n') > -1;
                            }
                            ;
                            if (maxL > CONFIG.textThreshold || multLines)
                                pC = 'Text';
                        }
                        ;
                        return new PropClass(ws.name + cX, pTi, CONFIG.prefixDT + pC);
                        function classOf(cell) {
                            if (isBool(cell))
                                return 'Boolean';
                            if (isInt(cell))
                                return 'Integer';
                            if (isReal(cell))
                                return 'Real';
                            if (isDateTime(cell))
                                return 'DateTime';
                            if (isStr(cell))
                                return defaultC;
                            return '';
                        }
                    }
                }
                if (ws.range) {
                    let rC = new ResClass(ws.resClass, inBracketsAtEnd(ws.name) ?? inBracketsAtEnd(prjN) ?? CONFIG.resClassXlsRow);
                    rC.propertyClasses = getPropClasses(ws);
                    specifData.resourceClasses.push(rC);
                    createFld(ws);
                }
            }
        }
        let xDta = new Uint8Array(buf), wb = XLSX.read(xDta, { type: 'array', cellDates: true, cellStyles: true }), wsCnt = wb.SheetNames.length;
        console.info('SheetNames: ' + wb.SheetNames + ' (' + wsCnt + ')');
        var xlsTerms = ["xs:string", "xs:boolean", "xs:integer", "xs:double", "xs:dateTime", "xs:anyURI", CONFIG.propClassId, CONFIG.propClassTitle, CONFIG.propClassDesc, CONFIG.propClassType, CONFIG.resClassFolder], specifData = app.ontology.generateSpecifClasses({ terms: xlsTerms, referencesWithoutRevision: true });
        let ti = withoutContentInBracketsAtEnd(prjN), pid = ti.toSpecifId();
        specifData.id = CONFIG.prefixP + pid;
        specifData.title = LIB.makeMultiLanguageValue(ti);
        specifData.resources.push({
            id: CONFIG.prefixR + pid,
            class: LIB.makeKey("RC-Folder"),
            properties: [{
                    class: LIB.makeKey("PC-Name"),
                    values: [specifData.title]
                }, {
                    class: LIB.makeKey("PC-Type"),
                    values: [LIB.makeMultiLanguageValue(CONFIG.resClassOutline)]
                }],
            changedAt: chAt
        });
        specifData.nodes.push({
            id: CONFIG.prefixH + pid,
            resource: LIB.makeKey(CONFIG.prefixR + pid),
            nodes: [],
            changedAt: chAt
        });
        let idx;
        for (idx = 0; idx < wsCnt; idx++)
            collectDefinitions(new Worksheet(wb.SheetNames[idx]));
        for (idx = 0; idx < wsCnt; idx++)
            transformData(new Worksheet(wb.SheetNames[idx]));
        console.debug('from xlsx:', specifData);
        return specifData;
        function withoutContentInBracketsAtEnd(str) {
            let resL = RE.withoutBracketsAtEnd.exec(str);
            if (Array.isArray(resL) && resL.length > 1)
                return resL[1];
        }
        function inBracketsAtEnd(str) {
            let resL = RE.inBracketsAtEnd.exec(str);
            if (Array.isArray(resL) && resL.length > 1)
                return resL[1];
        }
    }
    function specif2xlsx(data, opts) {
        console.debug('toXlsx', data, opts);
        const wb = XLSX.utils.book_new();
        let selPrj = app.projects.selected, cData = selPrj.cache, pend = 0, sheet = [
            data.propertyClasses.map((pC) => {
                return pC.title;
            })
        ];
        LIB.iterateSpecifNodes(cData.get("hierarchy", selPrj.nodes)
            .filter((h) => {
            return LIB.typeOf(h.resource, cData) != CONFIG.resClassUnreferencedResources;
        }), (nd) => {
            pend++;
            selPrj.readItems('resource', [nd.resource])
                .then((rL) => {
                sheet.push(prpValues(rL[0]));
                if (--pend < 1) {
                    const ws = XLSX.utils.aoa_to_sheet(sheet);
                    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
                    XLSX.writeFile(wb, opts.fileName + ".xlsx", { compression: true });
                    if (typeof (opts.done) == "function")
                        opts.done();
                }
            }, LIB.stdError);
            return true;
        });
        return;
        function prpValues(res) {
            let prpL = [], pVal;
            for (var pC of data.propertyClasses) {
                let p = findPrp(res.properties, pC);
                if (p) {
                    if (p.values.length > 1)
                        console.info("Limitation of XLS export: Only first property value is included.");
                    let dT = LIB.itemByKey(data.dataTypes, pC.dataType);
                    if (dT) {
                        if (dT.enumeration) {
                            let v = LIB.itemById(dT.enumeration, p.values[0].id);
                            pVal = LIB.isMultiLanguageValue(v.value) ? v.value[0]['text'] : v.value;
                        }
                        else if (dT.type == XsDataType.String) {
                            if (p.values[0].length > 1)
                                console.info("Limitation of XLS export: Only first language value is included.");
                            pVal = p.values[0][0]['text'];
                        }
                        else {
                            pVal = p.values[0];
                        }
                        ;
                        prpL.push(pVal);
                    }
                    ;
                }
                ;
            }
            ;
            return prpL;
            function findPrp(prpL, pC) {
                for (var p of prpL) {
                    if (LIB.references(p['class'], pC))
                        return p;
                }
            }
        }
    }
});
