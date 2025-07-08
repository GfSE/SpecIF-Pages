"use strict";
/*!    SpecIF: Generate Specif classes from the Ontology.
    Dependencies: -
    (C)copyright enso managers gmbh (http://enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
class COntology {
    constructor(dta) {
        this.headings = [];
        this.organizerClasses = [];
        this.modelElementClasses = [];
        this.termCategories = new Map([
            ["resourceClass", { synonymStatement: "SpecIF:isSynonymOfResource", prefix: CONFIG.prefixRC }],
            ["statementClass", { synonymStatement: "SpecIF:isSynonymOfStatement", prefix: CONFIG.prefixSC }],
            ["propertyClass", { synonymStatement: "SpecIF:isSynonymOfProperty", prefix: CONFIG.prefixPC }],
            ["propertyValue", { synonymStatement: "SpecIF:isSynonymOfValue", prefix: CONFIG.prefixV }]
        ]);
        this.termPrincipalClasses = new Map([
            ["SpecIF:TermResourceClass", "R-FolderTermsResourceClass"],
            ["SpecIF:TermStatementClass", "R-FolderTermsStatementClass"],
            ["SpecIF:TermPropertyClass", "R-FolderTermsPropertyClass"],
            ["SpecIF:TermPropertyValue", "R-FolderTermsPropertyValue"]
        ]);
        this.termClasses = [
            "SpecIF:TermResourceClass",
            "SpecIF:TermStatementClass",
            "SpecIF:TermPropertyClassString",
            "SpecIF:TermPropertyClassBoolean",
            "SpecIF:TermPropertyClassInteger",
            "SpecIF:TermPropertyClassReal",
            "SpecIF:TermPropertyClassTimestamp",
            "SpecIF:TermPropertyClassDuration",
            "SpecIF:TermPropertyClassURI",
            "SpecIF:TermPropertyValue"
        ];
        this.primitiveDataTypes = new Map([
            ["RC-SpecifTermpropertyclassstring", XsDataType.String],
            ["RC-SpecifTermpropertyclassboolean", XsDataType.Boolean],
            ["RC-SpecifTermpropertyclassinteger", XsDataType.Integer],
            ["RC-SpecifTermpropertyclassreal", XsDataType.Double],
            ["RC-SpecifTermpropertyclasstimestamp", XsDataType.DateTime],
            ["RC-SpecifTermpropertyclassduration", XsDataType.Duration],
            ["RC-SpecifTermpropertyclassuri", XsDataType.AnyURI]
        ]);
        this.termDefaultValues = [
            "SpecIF:DefaultValueString",
            "SpecIF:DefaultValueBoolean",
            "SpecIF:DefaultValueInteger",
            "SpecIF:DefaultValueReal",
            "SpecIF:DefaultValueTimestamp",
            "SpecIF:DefaultValueDuration",
            "SpecIF:DefaultValueAnyURI",
        ];
        this.eligibleLifecycles = [
            "SpecIF:LifecycleStatusReleased",
            "SpecIF:LifecycleStatusEquivalent",
            "SpecIF:LifecycleStatusSubmitted"
        ];
        let oData = this.data = dta;
        this.data.nodes = (dta.nodes || dta.hierarchies).filter((n) => {
            let r = LIB.itemByKey(dta.resources, n.resource);
            return this.valueByTitle(r, CONFIG.propClassType) == CONFIG.resClassOntology;
        });
        if (dta.nodes.length < 1) {
            message.show("No ontology found.", { severity: 'warning' });
            this.data = undefined;
            return;
        }
        ;
        if (this.data.$schema.includes('v1.1')) {
            this.data.$schema = this.data.$schema.replace('v1.1', 'v1.2');
            this.data.resources.forEach((r) => {
                r.properties.forEach((p) => {
                    let pC = LIB.itemByKey(oData.propertyClasses, p['class']), dT = LIB.itemByKey(oData.dataTypes, pC.dataType);
                    p.values = p.values.map((v) => {
                        return dT.enumeration ? { id: v } : v;
                    });
                });
            });
        }
        ;
        this.namespaces = this.getNamespaces();
        this.headings = this.getHeadings();
        this.organizerClasses = this.getOrganizerClasses();
        this.modelElementClasses = this.getModelElementClasses();
        if (!this.checkConstraints()) {
            message.show("The Ontology has not been loaded, because one or more constraints are violated. Please see the browser log for details.", { severity: 'error' });
            this.data = undefined;
            return;
        }
        ;
        this.options = {};
    }
    isValid() {
        return this.data && this.data.id && this.data.nodes.length > 0 && this.checkConstraints();
    }
    getTermResources(ctg, term, opts) {
        let nTerm = term.replace(/^dc:/, 'dcterms:');
        ctg = ctg.toLowerCase();
        return this.data.resources
            .filter((r) => {
            let stat = this.valueByTitle(r, COntology.propClassTermStatus), valL = LIB.valuesByTitle(r, [CONFIG.propClassTerm], this.data);
            if (valL.length > 1)
                console.warn("Ontology: Term " + r.id + " has multiple values (" + valL.toString() + ")");
            return (valL.length > 0
                && LIB.languageTextOf(valL[0], { targetLanguage: "default" }) == nTerm
                && (!opts || !opts.eligibleOnly || this.eligibleLifecycles.includes(stat))
                && (ctg == 'all' || LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg)));
        });
    }
    getTermResource(ctg, term, opts) {
        let resL = this.getTermResources(ctg, term, opts);
        if (resL.length > 1)
            console.warn("Ontology: Multiple resources describe term '" + term + "': " + resL.map((r) => { return r.id; }).toString());
        if (resL.length > 0)
            return resL[0];
    }
    getTerms(ctg, opts) {
        if (!opts)
            opts = {};
        if (Array.isArray(opts.lifeCycles))
            LIB.cacheE(opts.lifeCycles, "SpecIF:LifecycleStatusReleased");
        else
            opts.lifeCycles = ["SpecIF:LifecycleStatusReleased"];
        let ctgL = Array.from(this.termCategories.keys());
        if (ctgL.includes(ctg)) {
            return this.data.resources
                .filter((r) => {
                return LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg.toLowerCase())
                    && this.hasSelectedStatus(r, opts);
            })
                .map((r) => {
                return this.makeIdAndTitle(r, this.termCategories.get(ctg).prefix);
            });
        }
        ;
        throw Error("Programming Error: Unknown category '" + ctg + "'; must be one of " + ctgL.toString());
    }
    getClassId(ctg, term) {
        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource(ctg, term);
            if (tR) {
                let c = this.termCategories.get(ctg);
                if (c)
                    return this.makeIdAndTitle(tR, c.prefix).id;
                else
                    throw Error("Programming Error: Unknown category '" + ctg + "'");
            }
            ;
        }
        ;
    }
    getPreferredTerm(ctg, term) {
        if (term.startsWith('dcterms:'))
            return term;
        let tR = this.getTermResource(ctg, term);
        if (tR) {
            if (this.valueByTitle(tR, COntology.propClassTermStatus) == "SpecIF:LifecycleStatusReleased")
                return term;
            let ctgV = this.termCategories.get(ctg), ctgL = ctgV ? [ctgV] : Array.from(this.termCategories.values()), staL = this.statementsByTitle(tR, ctgL.map(c => c.synonymStatement), { asSubject: true, asObject: true }), resL = staL.map((st) => {
                return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id));
            }), synL = resL.filter((r) => {
                return this.valueByTitle(r, COntology.propClassTermStatus) == "SpecIF:LifecycleStatusReleased";
            });
            if (synL.length < 1)
                return term;
            if (synL.length > 1)
                console.warn('Ontology: Multiple equivalent terms are released: ', synL.map((r) => { return r.id; }).toString());
            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Ontology: Preferred term assigned: ' + term + ' → ' + newT);
            return newT;
        }
        ;
        return term;
    }
    localize(term, opts) {
        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource('all', term, { eligibleOnly: true });
            if (tR) {
                let lnL = [];
                if (opts.plural) {
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTermPlural"], this.data);
                    if (lnL.length < 1) {
                        let stL = this.statementsByTitle(tR, ["SpecIF:isPluralOfResource"], { asSubject: false, asObject: true });
                        if (stL.length > 0) {
                            let tR = LIB.itemByKey(this.data.resources, stL[0].subject);
                            lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                        }
                    }
                }
                else {
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                }
                ;
                if (lnL.length > 0) {
                    let newT = LIB.languageTextOf(lnL[0], opts);
                    return newT;
                }
                ;
            }
        }
        ;
        return term;
    }
    globalize(ctg, name) {
        if (RE.vocabularyTerm.test(name))
            return name;
        let rC;
        let termL = this.data.resources.filter((r) => {
            rC = LIB.itemByKey(this.data.resourceClasses, r['class']);
            if (this.termClasses.includes(LIB.titleOf(rC))
                && (LIB.titleOf(rC).toLowerCase().includes(ctg.toLowerCase())
                    || ['all', 'any'].includes(ctg))) {
                let tVL = LIB.valuesByTitle(r, ["SpecIF:LocalTerm", "SpecIF:LocalTermPlural"], this.data);
                for (let v of tVL) {
                    for (var l of v) {
                        if (l.text.toLowerCase() == name.toLowerCase())
                            return true;
                    }
                }
            }
            ;
            return false;
        });
        if (termL.length > 0) {
            for (let status of this.eligibleLifecycles)
                for (let t of termL) {
                    if (this.valueByTitle(t, COntology.propClassTermStatus) == status) {
                        let newT = this.valueByTitle(t, CONFIG.propClassTerm);
                        console.info('Ontology: Global term assigned: ' + name + ' → ' + newT);
                        return newT;
                    }
                }
        }
        ;
        return name;
    }
    normalize(ctg, term) {
        let str = this.globalize(ctg, term);
        str = this.getPreferredTerm(ctg, str);
        return str;
    }
    getTermValue(ctg, term, title) {
        let tR = this.getTermResource(ctg, term);
        if (tR) {
            return this.valueByTitle(tR, title);
        }
        ;
    }
    propertyClassIsText(term) {
        let len = this.getTermValue("propertyClass", term, "SpecIF:StringMaxLength");
        return len == undefined || typeof (len) == 'number' && len > CONFIG.textThreshold;
    }
    propertyClassIsFormatted(term) {
        return this.getTermValue("propertyClass", term, "SpecIF:TextFormat") == SpecifTextFormat.Xhtml;
    }
    getIcon(ctg, term) {
        return this.getTermValue(ctg, term, "SpecIF:Icon");
    }
    changeNamespace(term, opts) {
        let self = this;
        if (!opts.targetNamespaces || opts.targetNamespaces.length < 1) {
            return term;
        }
        ;
        let tR = this.getTermResource('all', term, { eligibleOnly: true });
        if (tR) {
            let v = findSynonymStatementOf(tR['class']), staL = this.statementsByTitle(tR, [v], { asSubject: true, asObject: true }), resL = staL.map((st) => {
                return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id));
            }), syn = findSynonym(resL, opts.targetNamespaces);
            if (syn) {
                let newT = this.valueByTitle(syn, CONFIG.propClassTerm);
                console.info('Ontology: Term with desired namespace assigned: ' + term + ' → ' + newT);
                return newT;
            }
            ;
            return term;
        }
        ;
        return term;
        function findSynonymStatementOf(rCk) {
            let rC = LIB.itemByKey(self.data.resourceClasses, rCk);
            for (let [ctg, syn] of self.termCategories) {
                if (rC.title.toLowerCase().includes(ctg.toLowerCase()))
                    return syn.synonymStatement;
            }
            ;
            throw (new Error("No synonym statement found for '" + rCk.id + "'."));
        }
        function findSynonym(rL, nsL) {
            let sL = [];
            for (var ns of nsL) {
                sL = rL.filter((r) => {
                    return self.valueByTitle(r, CONFIG.propClassTerm).startsWith(ns)
                        && (opts.lifeCycles ?? self.eligibleLifecycles).includes(self.valueByTitle(r, COntology.propClassTermStatus));
                });
                if (sL.length > 1) {
                    for (let ls of opts.lifeCycles ?? self.eligibleLifecycles) {
                        sL = sL.filter((r) => {
                            return self.valueByTitle(r, COntology.propClassTermStatus) == ls;
                        });
                        if (sL.length < 1)
                            continue;
                        if (sL.length > 1)
                            console.warn('Ontology: Multiple terms of a desired namespace with lifecycleStatus "' + ls + '" are synonyms: ', sL.map((r) => { return r.id; }).toString());
                        break;
                    }
                    ;
                }
                ;
                if (sL.length > 0)
                    return sL[0];
            }
            ;
        }
    }
    generateSpecifClasses(opts) {
        if (Array.isArray(opts.domains) && opts.domains.length > 0
            || Array.isArray(opts.terms) && opts.terms.length > 0) {
            this.options = opts;
            if (Array.isArray(this.options.lifeCycles))
                LIB.cacheE(this.options.lifeCycles, "SpecIF:LifecycleStatusReleased");
            else
                this.options.lifeCycles = ["SpecIF:LifecycleStatusReleased"];
            let spId = "P-SpecifClasses", now = new Date().toISOString();
            if (Array.isArray(opts.domains)) {
                let tmp = '';
                opts.domains.forEach((d) => { tmp += d; });
                spId += '-' + simpleHash(tmp);
            }
            ;
            if (Array.isArray(opts.terms)) {
                let tmp = '';
                opts.terms.forEach((t) => { tmp += t; });
                spId += '-' + simpleHash(tmp);
            }
            ;
            this.required = {
                sTL: []
            };
            this.generated = {
                dTL: [],
                pCL: [],
                rCL: [],
                sCL: [],
                rL: [],
                hL: []
            };
            [
                { resultL: this.generated.pCL, classes: Array.from(this.primitiveDataTypes.keys()), fn: this.makePC.bind(this) },
                { resultL: this.generated.rCL, classes: ["RC-SpecifTermresourceclass"], fn: this.makeRC.bind(this) },
                { resultL: this.generated.sCL, classes: ["RC-SpecifTermstatementclass"], fn: this.makeSC.bind(this) }
            ].forEach((step) => { LIB.cacheL(step.resultL, this.makeClasses(step.classes, step.fn)); });
            while (this.required.sTL.length > 0) {
                let sCL = [].concat(this.required.sTL);
                this.required.sTL.length = 0;
                LIB.cacheL(this.generated.sCL, sCL.map(this.makeSC.bind(this)));
            }
            ;
            if (this.options.domains && this.options.domains.includes("SpecIF:DomainOntology")) {
                let rId = "R-FolderOntology";
                this.generated.rL.push(LIB.itemByKey(this.data.resources, { id: rId }));
                let h = {
                    id: LIB.replacePrefix(CONFIG.prefixN, rId),
                    resource: { id: rId },
                    nodes: [],
                    changedAt: now
                };
                Array.from(this.termPrincipalClasses.values(), (clId) => {
                    this.generated.rL.push(LIB.itemByKey(this.data.resources, { id: clId }));
                    h.nodes.push({
                        id: LIB.replacePrefix(CONFIG.prefixN, clId),
                        resource: { id: clId },
                        nodes: [],
                        changedAt: now
                    });
                });
                this.generated.hL.push(h);
            }
            ;
            return Object.assign(opts.delta ? {} : app.standards.makeTemplate(), opts.delta ? {} : {
                "id": spId,
                "title": [{
                        "text": "SpecIF Classes" + (opts.domains ? (" for " + opts.domains.toString().replace(/:/g, " ")) : ""),
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }],
                "description": [{
                        "text": "A set of SpecIF Classes derived from a SpecIF Ontology" + (opts.domains ? (" for the domain" + (opts.domains.length < 2 ? " " : "s ") + opts.domains.toString().replace(/,/g, ", ") + ".") : ""),
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }],
            }, {
                "dataTypes": this.generated.dTL,
                "propertyClasses": this.generated.pCL,
                "resourceClasses": this.generated.rCL,
                "statementClasses": this.generated.sCL,
                "resources": this.generated.rL,
                "nodes": this.generated.hL
            });
        }
        else {
            message.show("No domain or term specified, so no classes will be generated.", { severity: 'warning' });
            return app.standards.makeTemplate();
        }
    }
    hasSelectedStatus(el, opts) {
        if (!opts || !opts.lifeCycles || opts.lifeCycles.length < 1)
            return true;
        let selStatus = LIB.valuesByTitle(el, [COntology.propClassTermStatus], this.data);
        for (let st of selStatus) {
            if (opts.lifeCycles.includes(LIB.displayValueOf(st)))
                return true;
        }
        ;
        return false;
    }
    makeClasses(rCIdL, createFn) {
        let self = this;
        let cL = [], idL = LIB.referencedResourcesByClass(this.data.resources, this.data.nodes, rCIdL);
        if (idL.length > 0) {
            let tL = idL
                .filter(isSelected);
            cL = LIB.forAll(tL, createFn);
        }
        ;
        return cL;
        function isSelected(r) {
            return self.hasSelectedStatus(r, self.options)
                && (hasSelectedDomain(r) || hasSelectedTerm(r));
            function hasSelectedDomain(el) {
                if (Array.isArray(self.options.domains)) {
                    let elDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], self.data);
                    for (let d of elDomains) {
                        if (self.options.domains.includes(LIB.displayValueOf(d)))
                            return true;
                    }
                }
                ;
                return false;
            }
            function hasSelectedTerm(el) {
                if (Array.isArray(self.options.terms)) {
                    let elTerms = LIB.valuesByTitle(el, [CONFIG.propClassTerm], self.data);
                    if (elTerms.length > 0 && self.options.terms.includes(LIB.displayValueOf(elTerms[0])))
                        return true;
                }
                ;
                return false;
            }
        }
    }
    makeDT(r) {
        let self = this;
        let ty = this.primitiveDataTypes.get(r["class"].id), prep = this.makeIdAndTitle(r, CONFIG.prefixPC), enumId = LIB.replacePrefix(CONFIG.prefixDT, prep.id), vId = LIB.replacePrefix(CONFIG.prefixV, prep.id), stL = this.statementsByTitle(r, ["SpecIF:hasEnumValue"], { asSubject: true }), oL = stL.map((st) => {
            return LIB.itemById(this.data.resources, st.object.id);
        }), enumL = LIB.forAll(oL, (o, idx) => {
            let evL = LIB.valuesByTitle(o, [CONFIG.propClassTerm], this.data);
            if (evL.length > 0)
                return {
                    id: this.valueByTitle(o, CONFIG.propClassId) || vId + '-' + idx.toString(),
                    value: evL[0]
                };
            else
                console.warn("Ontology: Property value term '" + o.id + "' is undefined");
        }), dT = {}, dTid;
        switch (ty) {
            case XsDataType.String:
                let maxLen = this.valueByTitle(r, "SpecIF:StringMaxLength");
                switch (maxLen) {
                    case '256':
                        dTid = CONFIG.prefixDT + "ShortString";
                        break;
                    default:
                        if (maxLen)
                            dTid = CONFIG.prefixDT + "String" + (maxLen ? "-LE" + maxLen : "");
                        else
                            dTid = CONFIG.prefixDT + "Text";
                }
                ;
                dT = {
                    id: dTid,
                    title: maxLen ? "String <=" + maxLen : "Plain or formatted Text",
                    description: [{ text: "Text string" + (enumL.length > 0 ? " with enumerated values for " + prep.title : (maxLen ? " with maximum length " + maxLen : "")) }],
                    maxLength: maxLen ? parseInt(maxLen) : undefined
                };
                break;
            case XsDataType.Boolean:
                dT = {
                    id: CONFIG.prefixDT + "Boolean",
                    title: "Boolean Value",
                    description: [{ text: "A Boolean value." }]
                };
                break;
            case XsDataType.Integer:
                let maxI = this.valueByTitle(r, "SpecIF:IntegerMaxInclusive"), minI = this.valueByTitle(r, "SpecIF:IntegerMinInclusive");
                dTid = CONFIG.prefixDT + "Integer";
                if (minI != CONFIG.minInteger || maxI != CONFIG.maxInteger)
                    dTid += (minI ? "-GE" + minI : "") + (maxI ? "-LE" + maxI : "");
                dT = {
                    id: dTid,
                    title: "Integer Value" + (minI ? " >=" + minI : "") + (maxI ? " <=" + maxI : ""),
                    description: [{ text: "A numerical integer value" + (minI && maxI ? " with minimum value " + minI + " and maximum value " + maxI : (minI ? " with minimum value " + minI : (maxI ? " with maximum value " + maxI : ""))) + "." }],
                    minInclusive: minI ? parseInt(minI) : undefined,
                    maxInclusive: maxI ? parseInt(maxI) : undefined
                };
                break;
            case XsDataType.Double:
                let frD = this.valueByTitle(r, "SpecIF:RealFractionDigits"), maxR = this.valueByTitle(r, "SpecIF:RealMaxInclusive"), minR = this.valueByTitle(r, "SpecIF:RealMinInclusive");
                dT = {
                    id: CONFIG.prefixDT + "Real" + (minR ? "-GE" + minR : "") + (maxR ? "-LE" + maxR : "") + (frD ? "-FD" + frD : ""),
                    title: "Real Value" + (minR ? " >=" + minR : "") + (maxR ? " <=" + maxR : "") + (frD ? " " + frD + "digits" : ""),
                    description: [{ text: "A numerical floating point number (double precision)" + (minR && maxR ? " with minimum value " + minR + " and maximum value " + maxR : (minR ? " with minimum value " + minR : (maxR ? " with maximum value " + maxR : ""))) + (frD ? " having no more than " + frD + " digits" : "") + "." }],
                    minInclusive: minR ? parseFloat(minR) : undefined,
                    maxInclusive: maxR ? parseFloat(maxR) : undefined,
                    fractionDigits: frD ? parseInt(frD) : undefined
                };
                break;
            case XsDataType.DateTime:
                dT = {
                    id: CONFIG.prefixDT + "DateTime",
                    title: "Date/Time",
                    description: [{ text: "Date or timestamp in ISO-8601 format." }]
                };
                break;
            case XsDataType.Duration:
                dT = {
                    id: CONFIG.prefixDT + "Duration",
                    title: "Duration",
                    description: [{ text: "A duration as defined by the ISO 8601 ABNF for 'duration'." }]
                };
                break;
            case XsDataType.AnyURI:
                dT = {
                    id: CONFIG.prefixDT + "AnyURI",
                    title: "Universal Resource Identifier (URI)",
                    description: [{ text: "A universal resource identifier (URI), according to RFC3986." }]
                };
        }
        ;
        dT.type = ty;
        if (enumL.length > 0) {
            dT.id = enumId;
            dT.title = prep.title;
            dT.enumeration = enumL;
        }
        ;
        dT.revision = this.valueByTitle(r, "SpecIF:Revision") || r.revision;
        dT.changedAt = r.changedAt;
        if (this.options.adoptOntologyDataTypes) {
            dT = adoptOntologyDataType(dT) || dT;
        }
        ;
        LIB.cacheE(this.generated.dTL, dT);
        return dT;
        function adoptOntologyDataType(d) {
            for (let dT of self.data.dataTypes) {
                if (LIB.equalDT(d, dT))
                    return dT;
            }
        }
    }
    makePC(r) {
        let dT = this.makeDT(r), defaultVL = LIB.valuesByTitle(r, this.termDefaultValues, this.data);
        return Object.assign(this.makeItem(r, CONFIG.prefixPC), {
            dataType: this.options.referencesWithoutRevision ? LIB.makeKey(dT.id) : LIB.makeKey(dT),
            format: this.valueByTitle(r, "SpecIF:TextFormat"),
            required: LIB.isTrue(this.valueByTitle(r, "SpecIF:isRequired")) || undefined,
            multiple: LIB.isTrue(this.valueByTitle(r, "SpecIF:multiple")) || undefined,
            values: (defaultVL.length > 0 && (dT.type != XsDataType.Boolean || defaultVL[0] == "true") ? defaultVL : undefined)
        });
    }
    makeRC(r) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data), eC = this.extendingClassOf(r, CONFIG.prefixRC), eCk, pCL = this.propertyClassesOf(r);
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.rCL, [eCk])[0];
                pCL = pCL.filter((p) => {
                    return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                });
            }
            ;
        }
        ;
        return Object.assign(this.makeItem(r, CONFIG.prefixRC), {
            extends: eCk,
            instantiation: iL.map((ins) => { return LIB.displayValueOf(ins, { lookupValues: true }); }),
            isHeading: LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading")) ? true : undefined,
            icon: this.valueByTitle(r, "SpecIF:Icon"),
            propertyClasses: pCL.length > 0 ? pCL : undefined
        });
    }
    makeSC(r) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data), eC = this.extendingClassOf(r, CONFIG.prefixSC), eCk, pCL = this.propertyClassesOf(r), sCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsSubject"]), oCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsObject"]);
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.sCL, [eCk])[0];
                pCL = pCL.filter((p) => {
                    return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                });
            }
            ;
        }
        ;
        return Object.assign(this.makeItem(r, CONFIG.prefixSC), {
            extends: eCk,
            instantiation: iL.map((ins) => { return LIB.displayValueOf(ins, { lookupValues: true }); }),
            isUndirected: LIB.isTrue(this.valueByTitle(r, "SpecIF:isUndirected")) ? true : undefined,
            icon: this.valueByTitle(r, "SpecIF:Icon"),
            subjectClasses: sCL.length > 0 ? sCL : undefined,
            objectClasses: oCL.length > 0 ? oCL : undefined,
            propertyClasses: pCL.length > 0 ? pCL : undefined
        });
    }
    extendingClassOf(el, pfx) {
        if ([CONFIG.prefixRC, CONFIG.prefixSC].includes(pfx)) {
            let sL = this.statementsByTitle(el, (pfx == CONFIG.prefixRC ? ["SpecIF:isSpecializationOfResource"] : ["SpecIF:isSpecializationOfStatement"]), { asSubject: true });
            if (sL.length > 1) {
                console.warn('Ontology: Term ' + el.id + ' has more than one extended class; the first found prevails.');
                sL.length = 1;
            }
            ;
            if (sL.length > 0) {
                let term = LIB.itemByKey(this.data.resources, sL[0].object), eC;
                switch (pfx) {
                    case CONFIG.prefixRC:
                        eC = this.makeRC(term);
                        LIB.cacheE(this.generated.rCL, eC);
                        break;
                    case CONFIG.prefixSC:
                        eC = this.makeSC(term);
                        LIB.cacheE(this.generated.sCL, eC);
                }
                ;
                return eC;
            }
            ;
        }
        ;
    }
    propertyClassesOf(el) {
        let pCL = [];
        let pL = this.statementsByTitle(el, ["SpecIF:hasProperty"], { asSubject: true });
        for (let p of pL) {
            let term = LIB.itemByKey(this.data.resources, p.object), prep = this.makeIdAndTitle(term, CONFIG.prefixPC);
            LIB.cacheE(pCL, { id: prep.id });
            LIB.cacheE(this.generated.pCL, this.makePC(term));
        }
        ;
        return pCL;
    }
    eligibleClassesOf(el, clL) {
        let iCL = [], sL = this.statementsByTitle(el, clL, { asObject: true });
        for (let s of sL) {
            let term = LIB.itemByKey(this.data.resources, s.subject), prep = this.makeIdAndTitle(term, term['class'].id == CONFIG.prefixRC + "SpecifTermresourceclass" ? CONFIG.prefixRC : CONFIG.prefixSC);
            LIB.cacheE(iCL, { id: prep.id });
            if (!this.options.excludeEligibleSubjectClassesAndObjectClasses) {
                if (term['class'].id == CONFIG.prefixRC + "SpecifTermresourceclass") {
                    if (LIB.indexById(this.generated.rCL, prep.id) < 0)
                        LIB.cacheE(this.generated.rCL, this.makeRC(term));
                }
                else {
                    if (LIB.indexById(this.generated.sCL, prep.id) < 0)
                        LIB.cacheE(this.required.sTL, term);
                }
            }
        }
        ;
        return iCL;
    }
    makeItem(r, prefix) {
        let prep = this.makeIdAndTitle(r, prefix), dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], this.data), dsc;
        if (dscL.length > 1)
            console.info("Ontology: Only the fist value of the description property will be used for the class generated from "
                + r.id + " with title " + prep.title + ".");
        if (dscL.length > 0) {
            dsc = dscL[0];
            dsc.format = LIB.isHTML(dsc.text) ? SpecifTextFormat.Xhtml : SpecifTextFormat.Plain;
        }
        ;
        return {
            id: prep.id,
            revision: this.valueByTitle(r, "SpecIF:Revision") || r.revision,
            title: prep.title,
            description: dsc,
            changedAt: r.changedAt
        };
    }
    makeStatementsIsNamespace() {
        let item = LIB.itemBy(this.data.statementClasses, "title", "SpecIF:isNamespace");
        if (item) {
            for (var i = this.data.statements.length - 1; i > -1; i--) {
                if (LIB.classTitleOf(this.data.statements[i]['class'], this.data.statementClasses) == "SpecIF:isNamespace")
                    this.data.statements.splice(i, 1);
            }
            ;
            let now = new Date().toISOString();
            for (var r of this.data.resources) {
                if (this.termClasses.includes(LIB.classTitleOf(r['class'], this.data.resourceClasses))) {
                    let term = this.valueByTitle(r, CONFIG.propClassTerm), match = RE.splitVocabularyTerm.exec(term);
                    if (Array.isArray(match) && match[1]) {
                        let stC = LIB.makeKey(item), noNs = true;
                        for (let [key, val] of this.namespaces) {
                            if (match[1] == key) {
                                this.data.statements.push({
                                    id: LIB.genID(CONFIG.prefixS),
                                    changedAt: now,
                                    class: stC,
                                    subject: LIB.makeKey(val.id),
                                    object: LIB.makeKey(r)
                                });
                                noNs = false;
                                break;
                            }
                            ;
                        }
                        ;
                        if (noNs)
                            console.warn("Ontology: No namespace found for " + r.id);
                    }
                    else
                        console.warn("Ontology: No namespace given for " + r.id);
                }
                ;
            }
            ;
        }
        else
            console.warn("Ontology: No statementClass 'SpecIF:isNamespace' defined");
    }
    checkConstraints() {
        this.makeStatementsIsNamespace();
        for (var r of this.data.resources) {
            if (this.termClasses.includes(LIB.classTitleOf(r['class'], this.data.resourceClasses))) {
                let ti = this.valueByTitle(r, CONFIG.propClassTerm);
                if (!ti) {
                    console.error("Ontology: No term name defined for " + r.id + ".");
                }
                else if (!RE.splitVocabularyTerm.test(ti)) {
                    console.error("Ontology: Term " + r.id + " has no namespace, so it is not a valid term name.");
                }
                ;
                let dL = LIB.valuesByTitle(r, [CONFIG.propClassDomain], this.data), stat = this.valueByTitle(r, COntology.propClassTermStatus);
                if (dL.length < 1 && this.eligibleLifecycles.includes(stat)) {
                    console.warn("Ontology: Term " + r.id + " has no domain, so the default domain 'SpecIF:DomainBase' is assigned.");
                    r.properties.push({
                        class: { id: "PC-Domain" },
                        values: [{
                                id: "V-Domain-00"
                            }]
                    });
                }
                ;
            }
            ;
        }
        ;
        return true;
    }
    statementsByTitle(r, tiL, opts) {
        return this.data.statements.filter((st) => {
            return tiL.includes(LIB.classTitleOf(st['class'], this.data.statementClasses))
                && (opts.asSubject && st.subject.id == r.id
                    || opts.asObject && st.object.id == r.id);
        });
    }
    valueByTitle(el, ti) {
        return LIB.valueByTitle(el, ti, this.data);
    }
    distinctiveCoreOf(ti) {
        return ti.toCamelCase();
    }
    makeIdAndTitle(r, pfx) {
        const termId = CONFIG.prefixPC + "SpecifTerm";
        let visIdL = LIB.valuesByTitle(r, ["dcterms:identifier"], this.data), prp = LIB.itemBy(r.properties, 'class', { id: termId });
        if (prp && prp.values.length > 0) {
            let ti = LIB.languageTextOf(prp.values[0], { targetLanguage: 'default' });
            return {
                id: visIdL && visIdL.length > 0 ?
                    LIB.languageTextOf(visIdL[0], { targetLanguage: 'default' }).toSpecifId()
                    : (pfx + this.distinctiveCoreOf(ti)),
                title: ti
            };
        }
        ;
        console.error("Ontology: No item with id '" + termId + "' found in the Ontology or it has no value");
    }
    getSpecializationsOf(ctg, term) {
        if (!["resourceClass", "statementClass"].includes(ctg))
            return [];
        let tR = this.getTermResource(ctg, term), spL = [term];
        if (tR) {
            spL = this.statementsByTitle(tR, [ctg == 'resourceClass' ? "SpecIF:isSpecializationOfResource" : "SpecIF:isSpecializationOfStatement"], { asObject: true })
                .map((s) => {
                return LIB.itemByKey(this.data.resources, s.subject);
            })
                .filter((r) => {
                let stat = this.valueByTitle(r, COntology.propClassTermStatus);
                return this.eligibleLifecycles.includes(stat);
            })
                .map((r) => {
                return this.valueByTitle(r, CONFIG.propClassTerm);
            });
            spL.forEach((sp) => { spL = spL.concat(this.getSpecializationsOf(ctg, sp)); });
        }
        ;
        return spL;
    }
    getOrganizerClasses() {
        return [CONFIG.resClassOrganizer].concat(this.getSpecializationsOf('resourceClass', CONFIG.resClassOrganizer));
    }
    getModelElementClasses() {
        return [CONFIG.resClassModelElement].concat(this.getSpecializationsOf('resourceClass', CONFIG.resClassModelElement));
    }
    getHeadings() {
        return this.data.resources
            .filter((r) => {
            return (LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:TermResourceClass")
                && LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading"));
        })
            .map((r) => {
            return this.valueByTitle(r, CONFIG.propClassTerm);
        });
    }
    getNamespaces() {
        let m = new Map();
        this.data.resources
            .filter((r) => {
            return LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:Namespace";
        })
            .forEach((r) => {
            m.set(this.valueByTitle(r, CONFIG.propClassTerm), { id: r.id, url: this.valueByTitle(r, "SpecIF:Origin") });
        });
        return m;
    }
}
COntology.propClassTermStatus = "SpecIF:TermStatus";
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
