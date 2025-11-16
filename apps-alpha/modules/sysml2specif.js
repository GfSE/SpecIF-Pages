"use strict";
/*!	Transform SysML XMI to SpecIF
    - Parse the XMI file
    - Extract both model-elements and semantic relations in SpecIF Format
    - Model elements with same type and title are NOT consolidated by this transformation
    
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)

    References:
    [1] S.Friedenthal et al: A Practical Guide to SysML, The MK/OMG Press, Third Edition

    ToDo:
    - The events of state machines should be listed below the state machine in the hierarchy (one level lower); see xEvent.
*/
function sysml2specif(xmi, options) {
    "use strict";
    const terms = {};
    [
        { id: "rcDefault", type: "resourceClass", term: CONFIG.resClassModelElement },
        { id: "rcFolder", type: "resourceClass", term: CONFIG.resClassFolder },
        { id: "rcDiagram", type: "resourceClass", term: "uml:Diagram" },
        { id: "rcModelElement", type: "resourceClass", term: CONFIG.resClassModelElement },
        { id: "rcActor", type: "resourceClass", term: CONFIG.resClassActor },
        { id: "rcState", type: "resourceClass", term: CONFIG.resClassState },
        { id: "rcEvent", type: "resourceClass", term: CONFIG.resClassEvent },
        { id: "rcPackage", type: "resourceClass", term: "uml:Package" },
        { id: "rcStereotype", type: "resourceClass", term: "uml:Stereotype" },
        { id: "scDefault", type: "statementClass", term: "SpecIF:relates" },
        { id: "scControlFlow", type: "statementClass", term: "uml:ControlFlow" },
        { id: "scTriggers", type: "statementClass", term: "uml:Trigger" },
        { id: "scTransitionSource", type: "statementClass", term: "uml:TransitionSource" },
        { id: "scTransitionTarget", type: "statementClass", term: "uml:TransitionTarget" },
        { id: "scContains", type: "statementClass", term: "SpecIF:contains" },
        { id: "scHasDiagram", type: "statementClass", term: "uml:ownedDiagram" },
        { id: "scHasBehavior", type: "statementClass", term: "uml:ownedBehavior" },
        { id: "scHasPart", type: "statementClass", term: "dcterms:hasPart" },
        { id: "scSpecializes", type: "statementClass", term: "SpecIF:isSpecializationOf" },
        { id: "scRealizes", type: "statementClass", term: "uml:Realization" },
        { id: "scServes", type: "statementClass", term: "SpecIF:serves" },
        { id: "scAssociatedWith", type: "statementClass", term: "SpecIF:isAssociatedWith" },
        { id: "scHandles", type: "statementClass", term: "SpecIF:handles" },
        { id: "scProvides", type: "statementClass", term: "SpecIF:provides" },
        { id: "scConsumes", type: "statementClass", term: "SpecIF:consumes" },
        { id: "scShows", type: "statementClass", term: "SpecIF:shows" }
    ].forEach((t) => {
        let tId = app.ontology.getClassId(t.type, t.term);
        if (tId)
            terms[t.id] = tId;
        else {
            switch (t.type) {
                case "resourceClass":
                    terms[t.id] = terms.rcDefault;
                    break;
                case "statementClass":
                    terms[t.id] = terms.scDefault;
            }
            ;
            console.warn("Cameo Import: Term '" + t.term + "' not found in the ontology, using default term instead.");
        }
    });
    terms.scAggregates =
        terms.scComprises = terms.scHasPart;
    terms.scDefault = terms.scAssociatedWith;
    if (typeof (options) != 'object' || !options.fileName)
        throw Error("Programming Error: Cameo import gets no 'options'");
    let opts = Object.assign({
        mimeType: "application/vnd.xmi+xml",
        fileDate: new Date().toISOString(),
        addElementsToHierarchy: true,
        replaceSeparatorNamespace: '*'
    }, options);
    var parser = new DOMParser(), xmiDoc = parser.parseFromString(xmi, "text/xml");
    if (validateCameo(xmiDoc))
        return new resultMsg(0, 'Cameo Import done', 'json', cameo2specif(xmiDoc, opts));
    return new resultMsg(899, 'Cameo Import: Input file is not supported.');
    function cameo2specif(xmi, opts) {
        function makeMap(att) {
            let top = xmi.getElementsByTagName('xmi:XMI')[0], map = new Map();
            Array.from(top.children, (ch) => {
                let base = ch.getAttribute(att);
                if (base) {
                    let txt = ch.getAttribute("Text");
                    if (att == "base_Property")
                        map.set(base, { tag: ch.tagName, dir: ch.getAttribute("direction") });
                    else if (txt)
                        map.set(base, { tag: ch.tagName, text: txt });
                    else
                        map.set(base, { tag: ch.tagName });
                }
                ;
            });
            return map;
        }
        const classStereotypes = makeMap("base_Class"), namedElementStereotypes = makeMap("base_NamedElement"), abstractionStereotypes = makeMap("base_Abstraction"), propertyStereotypes = makeMap("base_Property"), flowProperties = new Map(), models = Array.from(xmi.getElementsByTagName('uml:Model')), packEls = Array.from(xmi.getElementsByTagName('packagedElement'))
            .filter((el) => {
            return el.getAttribute("xmi:type") == "uml:Model";
        }), packgs = Array.from(xmi.getElementsByTagName('uml:Package')), profiles = Array.from(xmi.getElementsByTagName('uml:Profile')), modL = models.concat(packgs).concat(packEls).concat(profiles);
        let spD = app.ontology.generateSpecifClasses({
            domains: [
                "SpecIF:DomainBase",
                "SpecIF:DomainSystemsEngineering",
                "SpecIF:DomainSystemModelIntegration"
            ],
            lifeCycles: [
                "SpecIF:LifecycleStatusReleased",
                "SpecIF:LifecycleStatusEquivalent"
            ],
            referencesWithoutRevision: true
        }), diagramL = [], usedElementL = [], abstractions = [], specializations = [], associationEnds = [], portL = [], connectorL = [], stateTransitionL = [];
        for (let modDoc of modL) {
            if (modDoc.tagName == 'uml:Model') {
                spD.id = CONFIG.prefixP + modDoc.getAttribute("xmi:id");
                spD.title = [{ text: modDoc.getAttribute("name") }];
            }
            ;
            let rId = modDoc.getAttribute("xmi:id"), r = {
                id: rId,
                class: LIB.makeKey(terms.rcFolder),
                properties: [{
                        class: LIB.makeKey("PC-Name"),
                        values: [[{ text: replaceSeparatorNS(modDoc.getAttribute("name")) }]]
                    }, {
                        class: LIB.makeKey("PC-Description"),
                        values: [[{ text: parseDesc(modDoc, { parent: rId }) }]]
                    }, {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: modDoc.getAttribute("xmi:type") }]]
                    }],
                changedAt: opts.fileDate
            }, nd = makeNode(r, spD.id);
            spD.resources.push(r);
            spD.nodes.push(nd);
            parseElements(modDoc, { packageId: '', nodes: nd.nodes });
        }
        ;
        specializations = specializations
            .filter(validateStatement);
        spD.resources
            .forEach((me) => {
            if (me["class"].id == terms.rcDefault) {
                let rC;
                rC = makeGeneralizingResourceClass(me);
                if (rC && rC.id != terms.rcDefault) {
                    me["class"] = LIB.makeKey(rC.id);
                    console.info("Cameo Import: Adopting superclass " + rC.id + " as class of model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                }
                ;
                let sTy = classStereotypes.get(me.id) || namedElementStereotypes.get(me.id);
                if (sTy) {
                    if (sTy.tag == "sysml:InterfaceBlock") {
                        me["class"] = LIB.makeKey(terms.rcState);
                        console.info("Cameo Import: Assigning class '" + terms.rcState + "' to interface-block " + me.id + " with title '" + LIB.valueByTitle(me, CONFIG.propClassTitle, spD) + "'");
                        return;
                    }
                    ;
                    rC = LIB.itemByTitle(spD.resourceClasses, sTy.tag);
                    if (rC) {
                        me["class"] = LIB.makeKey(rC.id);
                        console.info("Cameo Import: Adopting stereotype equalling an ontology term '" + rC.id + " with title '" + sTy.tag + "' as class of model-element " + me.id + " with title '" + LIB.valueByTitle(me, CONFIG.propClassTitle, spD) + "'");
                        if (sTy.tag == "sysml:Requirement") {
                            let prp = LIB.propByTitle(me, CONFIG.propClassDesc, spD);
                            if (prp) {
                                prp.values = [[{ text: sTy.text }]];
                            }
                            ;
                        }
                        ;
                        return;
                    }
                    ;
                    let prp = LIB.propByTitle(me, CONFIG.propClassType, spD);
                    if (prp) {
                        prp.values = [[{ text: sTy.tag }]];
                        console.info("Cameo Import: Adding a type property with value '" + sTy.tag + "' to  model-element " + me.id + " with title '" + LIB.valueByTitle(me, CONFIG.propClassTitle, spD) + "'");
                    }
                    ;
                }
                ;
            }
            ;
            return;
            function makeGeneralizingResourceClass(r) {
                let spL = specializations.filter((sp) => {
                    return sp.subject.id == r.id;
                });
                if (spL.length > 1)
                    console.warn("Cameo Import: Model-elment with id " + me.id + " specializes " + spL.length + " classes");
                for (var sp of spL) {
                    let gE = LIB.itemByKey(spD.resources, sp.object), ti = LIB.titleFromProperties(gE.properties, spD.propertyClasses, { targetLanguage: "default" }), rC = LIB.itemByTitle(spD.resourceClasses, ti);
                    if (rC)
                        return rC;
                    rC = makeGeneralizingResourceClass(gE);
                    if (rC)
                        return rC;
                }
                ;
            }
        });
        abstractions = abstractions
            .filter(validateStatement)
            .map((a) => {
            let sTy = abstractionStereotypes.get(a.id);
            if (sTy) {
                let sC = LIB.itemByTitle(spD.statementClasses, sTy.tag);
                if (sC) {
                    a['class'] = LIB.makeKey(sC.id);
                    console.info("Cameo Import: Adopting stereotype equalling an ontology term " + sC.id + " with title '" + sTy.tag + "' as class of statement " + a.id);
                }
                else {
                    let prp = {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: sTy.tag }]]
                    };
                    LIB.addProperty(a, prp);
                    console.info("Cameo Import: Adding a type property with value '" + sTy.tag + "' to statement " + a.id);
                }
                ;
            }
            ;
            return a;
        });
        portL.forEach((p) => {
            let ibId = p.interfaceBlock, dir = flowProperties.get(ibId), acc;
            switch (dir) {
                case 'in':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: p.isConjugated ? 'out' : 'in' }]]
                    });
                    acc = p.isConjugated ? terms.scProvides : terms.scConsumes;
                    spD.statements.push({
                        id: CONFIG.prefixS + (p.isConjugated ? 'provides-' : 'consumes-') + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource.id),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
                    break;
                case 'out':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: p.isConjugated ? 'in' : 'out' }]]
                    });
                    acc = p.isConjugated ? terms.scConsumes : terms.scProvides;
                    spD.statements.push({
                        id: CONFIG.prefixS + (p.isConjugated ? 'consumes-' : 'provides-') + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource.id),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
                    break;
                case 'inout':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: 'inout' }]]
                    });
                    spD.statements.push({
                        id: CONFIG.prefixS + 'handles-' + simpleHash(p.resource.id + terms.scHandles + ibId),
                        class: LIB.makeKey(terms.scHandles),
                        subject: LIB.makeKey(p.resource.id),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
            }
            ;
        });
        connectorL.forEach((co) => {
            let port0 = LIB.itemById(portL, co.ends[0]), port1 = LIB.itemById(portL, co.ends[1]), p0serves = LIB.valueByTitle(port0.resource, 'uml:is_Service', spD) == 'true', p1serves = LIB.valueByTitle(port1.resource, 'uml:is_Service', spD) == 'true';
            if (p0serves && !p1serves) {
                spD.statements.push({
                    id: co.id,
                    class: LIB.makeKey(terms.scServes),
                    subject: LIB.makeKey(port0.id),
                    object: LIB.makeKey(port1.id),
                    changedAt: opts.fileDate
                });
                return;
            }
            ;
            if (!p0serves && p1serves) {
                spD.statements.push({
                    id: co.id,
                    class: LIB.makeKey(terms.scServes),
                    subject: LIB.makeKey(port1.id),
                    object: LIB.makeKey(port0.id),
                    changedAt: opts.fileDate
                });
                return;
            }
            ;
            spD.statements.forEach((st) => {
                if (st['class'].id == terms.scComprises) {
                    if (st.subject.id == port0.parent.id && st.object.id == port1.parent.id) {
                        spD.statements.push({
                            id: co.id,
                            class: LIB.makeKey(terms.scServes),
                            subject: LIB.makeKey(p0serves && p1serves ? port1.id : port0.id),
                            object: LIB.makeKey(p0serves && p1serves ? port0.id : port1.id),
                            changedAt: opts.fileDate
                        });
                        return;
                    }
                    ;
                    if (st.subject.id == port1.parent.id && st.object.id == port0.parent.id) {
                        spD.statements.push({
                            id: co.id,
                            class: LIB.makeKey(terms.scServes),
                            subject: LIB.makeKey(p0serves && p1serves ? port0.id : port1.id),
                            object: LIB.makeKey(p0serves && p1serves ? port1.id : port0.id),
                            changedAt: opts.fileDate
                        });
                    }
                    ;
                }
                ;
            });
        });
        stateTransitionL.forEach((stT) => {
            let tr = LIB.itemById(spD.resources, stT.id), trTi = LIB.valueByTitle(tr, 'dcterms:title', spD), trTy = LIB.valueByTitle(tr, 'dcterms:type', spD), src = LIB.itemById(spD.resources, stT.source), sTi = LIB.valueByTitle(src, 'dcterms:title', spD), sTy = LIB.valueByTitle(src, 'dcterms:type', spD), tgt = LIB.itemById(spD.resources, stT.target), tTi = LIB.valueByTitle(tgt, 'dcterms:title', spD);
            if (sTy == 'uml:Pseudostate' && sTi.includes('unnamed')) {
                sTi = 'entry';
                LIB.updatePropertyByTitle(src, 'dcterms:title', () => { return [[{ text: sTi }]]; }, spD);
            }
            ;
            if (trTy == 'uml:Transition' && trTi.includes('unnamed'))
                LIB.updatePropertyByTitle(tr, 'dcterms:title', () => { return [[{ text: sTi + '→' + tTi }]]; }, spD);
        });
        spD.statements = spD.statements
            .concat(abstractions)
            .concat(specializations)
            .concat(usedElementL);
        let prevLength;
        do {
            prevLength = spD.statements.length;
            spD.statements = spD.statements
                .filter(validateStatement);
        } while (prevLength > spD.statements.length);
        spD = LIB.keepUsedClasses(spD);
        console.debug('from SysML:', spD, opts);
        return spD;
        function parseElements(elem, params) {
            function addResource(r, prms) {
                spD.resources.push(r);
                if (opts.addElementsToHierarchy)
                    prms.nodes.push(makeNode(r, prms.packageId));
            }
            function parseEnum(ch) {
                let enumL = [];
                Array.from(ch.children, (e) => {
                    if (e.tagName == "ownedLiteral") {
                        enumL.push({
                            id: e.getAttribute("xmi:id"),
                            txt: e.getAttribute("name")
                        });
                    }
                });
                return enumL;
            }
            Array.from(elem.children, (ch) => {
                switch (ch.tagName) {
                    case "ownedComment":
                        break;
                    case "packagedElement":
                        let ty = ch.getAttribute("xmi:type");
                        switch (ty) {
                            case "uml:DataType":
                                addResource(makeResource(ch, { class: terms.rcDefault }), params);
                                break;
                            case "uml:Stereotype":
                                let rc = makeResourceClass(ch), gen = parseGeneralization(ch), parent = LIB.itemByTitle(spD.resourceClasses, gen);
                                if (parent)
                                    rc.extends = LIB.makeKey(parent.id);
                                else
                                    rc.extends = LIB.makeKey(terms.rcDefault);
                                spD.resourceClasses.push(rc);
                                break;
                            case "uml:Enumeration":
                                let pId = ch.getAttribute("xmi:id"), ti = ch.getAttribute("name"), dT = {
                                    id: CONFIG.prefixDT + pId,
                                    title: ti,
                                    type: XsDataType.String,
                                    enumeration: parseEnum(ch).map((e) => {
                                        return {
                                            id: CONFIG.prefixV + e.id,
                                            value: [{ text: e.txt }]
                                        };
                                    }),
                                    changedAt: opts.fileDate
                                }, desc = parseDesc(ch, { parent: pId }), pC = {
                                    id: CONFIG.prefixPC + pId,
                                    title: ti,
                                    description: desc ? [{ text: desc }] : undefined,
                                    dataType: LIB.makeKey(dT.id),
                                    keepEvenIfUnused: true,
                                    changedAt: opts.fileDate
                                };
                                spD.dataTypes.push(dT);
                                spD.propertyClasses.push(pC);
                        }
                        ;
                }
                ;
            });
            Array.from(elem.children, (ch) => {
                let r, nd;
                switch (ch.tagName) {
                    case "ownedComment":
                        break;
                    case "xmi:Extension":
                        makeDiagrams(ch, params);
                        break;
                    case "packagedElement":
                        switch (ch.getAttribute("xmi:type")) {
                            case "uml:DataType":
                            case "uml:Stereotype":
                            case "uml:Enumeration":
                                break;
                            case 'uml:Package':
                                r = makeResource(ch, { class: terms.rcPackage });
                                spD.resources.push(r);
                                nd = makeNode(r, params.packageId);
                                if (opts.addElementsToHierarchy)
                                    params.nodes.push(nd);
                                parseElements(ch, { packageId: r.id, nodes: nd.nodes });
                                break;
                            case 'uml:UseCase':
                            case 'uml:Actor':
                            case 'uml:Class':
                                xClass(ch, params);
                                break;
                            case 'uml:Activity':
                                makeActivity(ch, params);
                                break;
                            case 'uml:CallEvent':
                            case 'uml:ChangeEvent':
                            case 'uml:SignalEvent':
                            case 'uml:TimeEvent':
                                xEvent(ch, params);
                                break;
                            case "uml:Association":
                            case "uml:Abstraction":
                            case "uml:Realization":
                                break;
                            case "uml:Profile":
                                break;
                            case "uml:Usage":
                                break;
                        }
                        ;
                }
                ;
            });
            Array.from(elem.children, (ch) => {
                switch (ch.tagName) {
                    case "ownedComment":
                    case "xmi:Extension":
                        break;
                    case "packagedElement":
                        let ty = ch.getAttribute("xmi:type");
                        switch (ty) {
                            case "uml:DataType":
                            case "uml:Stereotype":
                            case "uml:Enumeration":
                            case 'uml:Package':
                            case 'uml:UseCase':
                            case 'uml:Actor':
                            case 'uml:Class':
                            case 'uml:CallEvent':
                            case 'uml:ChangeEvent':
                            case 'uml:SignalEvent':
                            case 'uml:TimeEvent':
                                break;
                            case "uml:Association":
                                xAssociation(ch);
                                break;
                            case "uml:Abstraction":
                                let sbj = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), obj = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref");
                                abstractions.push({
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(terms.scDefault),
                                    subject: LIB.makeKey(sbj),
                                    object: LIB.makeKey(obj),
                                    changedAt: opts.fileDate
                                });
                                break;
                            case "uml:Realization":
                                let sbjR = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), objR = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref"), staR = {
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(terms.scRealizes || terms.scAssociatedWith),
                                    subject: LIB.makeKey(sbjR),
                                    object: LIB.makeKey(objR),
                                    changedAt: opts.fileDate
                                };
                                spD.statements.push(staR);
                                break;
                            case "uml:Profile":
                                break;
                            case "uml:Usage":
                                break;
                            default:
                                console.info("Cameo Import: Skipping the packagedElement", ch, "with name", ch.getAttribute("name"), "and type", ty, ".");
                        }
                        ;
                        break;
                    case 'profileApplication':
                        break;
                    default:
                        infoSkip(ch);
                }
                ;
            });
            function parseGeneralization(el) {
                let gen = el.getAttribute("general");
                if (!gen) {
                    let ref = el.getElementsByTagName('referenceExtension')[0];
                    if (ref) {
                        gen = ref.getAttribute("referentPath");
                        if (gen && gen.indexOf("::") > 0) {
                            let ns = gen.toLowerCase().includes("sysml") ? "sysml:" : "uml:";
                            gen = ns + gen.split("::").pop();
                            console.debug("Cameo Import: Generalization found in referenceExtension: " + gen);
                        }
                    }
                }
                ;
                return gen;
            }
            function xGeneralization(el, params) {
                let sid = el.getAttribute("xmi:id"), obj = parseGeneralization(el);
                if (obj)
                    specializations.push({
                        id: sid,
                        class: LIB.makeKey(terms.scSpecializes),
                        subject: LIB.makeKey(params.parent.id),
                        object: LIB.makeKey(obj),
                        changedAt: opts.fileDate
                    });
                else
                    console.warn("Cameo Import: Skipping generalization with id '" + sid + "', because it has no attribute 'general'.");
            }
            function xClass(el, params) {
                let r2 = makeResource(el, { class: terms.rcDefault });
                spD.resources.push(r2);
                let nd2 = makeNode(r2, params.packageId), pars = { packageId: params.packageId, parent: r2, nodes: nd2.nodes };
                if (opts.addElementsToHierarchy)
                    params.nodes.push(nd2);
                if (params.packageId)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(params.packageId + terms.scContains + r2.id),
                        class: LIB.makeKey(terms.scContains),
                        subject: LIB.makeKey(params.packageId),
                        object: LIB.makeKey(r2.id),
                        changedAt: opts.fileDate
                    });
                Array.from(el.children, (ch) => {
                    switch (ch.tagName) {
                        case "ownedComment":
                            break;
                        case 'nestedClassifier':
                            xClass(ch, pars);
                            break;
                        case "xmi:Extension":
                            makeDiagrams(ch, pars);
                            break;
                        case 'ownedBehavior':
                            switch (ch.getAttribute("xmi:type")) {
                                case 'uml:StateMachine':
                                    makeStateMachine(ch, pars);
                                    break;
                                case 'uml:Activity':
                                    makeActivity(ch, pars);
                            }
                            ;
                            break;
                        case 'generalization':
                            xGeneralization(ch, pars);
                            break;
                        case 'ownedAttribute':
                            xOwnedAttribute(ch, pars);
                            break;
                        case 'ownedOperation':
                            let oO = makeResource(ch, { class: terms.rcActor });
                            spD.resources.push(oO);
                            if (opts.addElementsToHierarchy)
                                nd2.nodes.push(makeNode(oO, r2.id));
                            spD.statements.push({
                                id: CONFIG.prefixS + 'comprises-' + simpleHash(r2.id + terms.scComprises + oO.id),
                                class: LIB.makeKey(terms.scComprises),
                                subject: LIB.makeKey(r2.id),
                                object: LIB.makeKey(oO.id),
                                changedAt: opts.fileDate
                            });
                            break;
                        case 'ownedConnector':
                            let cId = ch.getAttribute("xmi:id"), ports = Array.from(ch.getElementsByTagName("end"), (ch3) => {
                                return ch3.getAttribute("role");
                            });
                            if (ports.length < 2) {
                                console.error("uml:Connector " + cId + " has too few ends");
                                return;
                            }
                            ;
                            if (ports.length > 2) {
                                console.error("uml:Connector " + cId + " has too many ends");
                                return;
                            }
                            ;
                            connectorL.push({ id: cId, ends: [ports[0], ports[1]] });
                            break;
                        default:
                            infoSkip(ch);
                    }
                });
                function xOwnedAttribute(oA, params) {
                    let pId, ac, ty, ag, ti, nm, cl;
                    switch (oA.getAttribute("xmi:type")) {
                        case "uml:Property":
                            pId = oA.getAttribute("xmi:id");
                            ac = oA.getAttribute("association");
                            ty = oA.getAttribute("type");
                            ag = oA.getAttribute("aggregation");
                            if (ac && ty) {
                                cl = ag == "composite" ? terms.scComprises : (ag == "shared" ? terms.scAggregates : undefined);
                                nm = oA.getAttribute("name");
                                if (nm) {
                                    spD.resources.push({
                                        id: pId,
                                        class: LIB.makeKey(terms.rcDefault),
                                        properties: [{
                                                class: LIB.makeKey("PC-Name"),
                                                values: [[{ text: replaceSeparatorNS(nm) }]]
                                            }, {
                                                class: LIB.makeKey("PC-Type"),
                                                values: [[{ text: "uml:Class" }]]
                                            }],
                                        changedAt: opts.fileDate
                                    });
                                    if (opts.addElementsToHierarchy)
                                        params.nodes.push(makeNode(LIB.makeKey(pId), params.parent.id));
                                    specializations.push({
                                        id: CONFIG.prefixS + 'specializes-' + simpleHash(pId + terms.scSpecializes + ty),
                                        class: LIB.makeKey(terms.scSpecializes),
                                        subject: LIB.makeKey(pId),
                                        object: LIB.makeKey(ty),
                                        changedAt: opts.fileDate
                                    });
                                    ty = pId;
                                }
                                ;
                                associationEnds.push({
                                    associationId: oA.getAttribute("association"),
                                    associationType: cl,
                                    thisEnd: LIB.makeKey(params.parent.id),
                                    otherEnd: LIB.makeKey(ty)
                                });
                                usedElementL
                                    .filter((e) => {
                                    return e.object.id == pId;
                                })
                                    .forEach((e) => {
                                    makeStatementShows(e.subject.id, ty);
                                });
                            }
                            else if (classStereotypes.get(params.parent.id) == "sysml:InterfaceBlock") {
                                if (ty) {
                                    spD.statements.push({
                                        id: pId,
                                        class: LIB.makeKey(terms.scDefault),
                                        subject: LIB.makeKey(params.parent.id),
                                        object: LIB.makeKey(ty),
                                        properties: [{
                                                class: LIB.makeKey("PC-Type"),
                                                values: [[{ text: "has data type" }]]
                                            }],
                                        changedAt: opts.fileDate
                                    });
                                }
                                else {
                                }
                                ;
                                let stT = propertyStereotypes.get(pId);
                                if (stT && stT.dir)
                                    flowProperties.set(params.parent.id, stT.dir);
                            }
                            else {
                                let r = makeResource(oA, { class: terms.rcState });
                                spD.resources.push(r);
                                if (opts.addElementsToHierarchy)
                                    nd2.nodes.push(makeNode(r, params.parent.id));
                                spD.statements.push({
                                    id: CONFIG.prefixS + 'comprises-' + simpleHash(params.parent.id + terms.scComprises + r.id),
                                    class: LIB.makeKey(terms.scComprises),
                                    subject: LIB.makeKey(params.parent.id),
                                    object: LIB.makeKey(r.id),
                                    changedAt: opts.fileDate
                                });
                            }
                            ;
                            break;
                        case "uml:Port":
                            pId = oA.getAttribute("xmi:id");
                            ty = oA.getAttribute("type");
                            nm = replaceSeparatorNS(oA.getAttribute("name"));
                            ti = LIB.titleFromProperties(params.parent.properties, spD.propertyClasses, { targetLanguage: "default" });
                            let prt = {
                                id: pId,
                                class: LIB.makeKey("RC-UmlPort"),
                                properties: [{
                                        class: LIB.makeKey("PC-Name"),
                                        values: [[{ text: (ti ? ti + " Port " + nm : nm) }]]
                                    }, {
                                        class: LIB.makeKey("PC-Type"),
                                        values: [[{ text: "uml:Port" }]]
                                    }, {
                                        class: LIB.makeKey("PC-UmlIsservice"),
                                        values: [oA.getAttribute("isService") ?? "true"]
                                    }],
                                changedAt: opts.fileDate
                            };
                            spD.resources.push(prt);
                            spD.statements.push({
                                id: CONFIG.prefixS + 'hasPart-' + simpleHash(params.parent.id + terms.scHasPart + pId),
                                class: LIB.makeKey(terms.scHasPart),
                                subject: LIB.makeKey(params.parent.id),
                                object: LIB.makeKey(pId),
                                changedAt: opts.fileDate
                            });
                            portL.push({ id: prt.id, resource: prt, interfaceBlock: ty, isConjugated: oA.getAttribute("isConjugated") == 'true', parent: params.parent });
                    }
                    ;
                }
                ;
            }
            function xEvent(el, pars) {
                let r = makeResource(el, { class: terms.rcEvent });
                spD.resources.push(r);
                if (opts.addElementsToHierarchy)
                    pars.nodes.push(makeNode(r, pars.packageId));
                if (pars.packageId)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(pars.packageId + terms.scContains + r.id),
                        class: LIB.makeKey(terms.scContains),
                        subject: LIB.makeKey(pars.packageId),
                        object: LIB.makeKey(r.id),
                        changedAt: opts.fileDate
                    });
            }
            function xAssociation(el) {
                let nm = el.getAttribute("name"), sC, prpL, aId = el.getAttribute("xmi:id"), aEnds = associationEnds.filter(aE => aE.associationId == aId);
                if (nm) {
                    sC = LIB.itemByTitle(spD.statementClasses, nm);
                    if (!sC)
                        prpL = [{
                                class: LIB.makeKey("PC-Type"),
                                values: [[{ text: replaceSeparatorNS(nm) }]]
                            }];
                }
                ;
                if (aEnds.length == 1) {
                    spD.statements.push({
                        id: aId,
                        class: LIB.makeKey(aEnds[0].associationType || (sC ? sC.id : undefined) || terms.scAssociatedWith),
                        properties: prpL ? prpL : undefined,
                        subject: LIB.makeKey(aEnds[0].thisEnd),
                        object: LIB.makeKey(aEnds[0].otherEnd),
                        changedAt: opts.fileDate
                    });
                }
                else if (aEnds.length == 2) {
                    let cl, sbj, obj;
                    if (aEnds[0].associationType || aEnds[1].associationType) {
                        if (aEnds[1].associationType) {
                            cl = aEnds[1].associationType;
                            sbj = aEnds[1].thisEnd;
                            obj = aEnds[1].otherEnd;
                        }
                        else {
                            cl = aEnds[0].associationType || (sC ? sC.id : undefined) || terms.scAssociatedWith;
                            sbj = aEnds[0].thisEnd;
                            obj = aEnds[0].otherEnd;
                        }
                        ;
                        spD.statements.push({
                            id: aId,
                            class: LIB.makeKey(cl),
                            properties: prpL ? prpL : undefined,
                            subject: LIB.makeKey(sbj),
                            object: LIB.makeKey(obj),
                            changedAt: opts.fileDate
                        });
                    }
                    else
                        console.warn("Cameo Import: Skipping the uml:Association with id " + aId + ", because it has no direction in RDF terms.");
                }
                else if (aEnds.length < 1) {
                    let st = {
                        id: aId,
                        properties: prpL ? prpL : undefined,
                        changedAt: opts.fileDate
                    };
                    Array.from(el.getElementsByTagName('ownedEnd'), (oE) => {
                        let ag = oE.getAttribute("aggregation");
                        if (ag && ['composite', 'shared'].includes(ag)) {
                            st['class'] = LIB.makeKey(ag == 'composite' ? terms.scComprises : terms.scAggregates);
                            st.object = LIB.makeKey(oE.getAttribute("type"));
                        }
                        else {
                            st.subject = LIB.makeKey(oE.getAttribute("type"));
                        }
                        ;
                    });
                    if (LIB.isKey(st['class']) && LIB.isKey(st.subject) && LIB.isKey(st.object))
                        spD.statements.push(st);
                    else
                        console.warn("Cameo Import: Skipping the uml:Association with id " + aId + ", because it has no direction in RDF terms.");
                }
                else if (aEnds.length > 2) {
                    console.error("Cameo Import: Too many association ends found; must be 0, 1 or 2 and is " + aEnds.length);
                    console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
                }
                ;
            }
        }
        function makeDiagrams(el, params) {
            Array.from(el.getElementsByTagName('ownedDiagram'), (oD) => {
                let dg = oD.getElementsByTagName('diagram:DiagramRepresentationObject')[0], ty = dg.getAttribute("type"), nm = replaceSeparatorNS(oD.getAttribute("name"));
                let r = {
                    id: oD.getAttribute("xmi:id"),
                    class: LIB.makeKey(terms.rcDiagram),
                    properties: [{
                            class: LIB.makeKey("PC-Name"),
                            values: [[{ text: nm }]]
                        }, {
                            class: LIB.makeKey("PC-Type"),
                            values: [[{ text: oD.getAttribute("xmi:type") }]]
                        }, {
                            class: LIB.makeKey("PC-Notation"),
                            values: [[{ text: (ty.startsWith("SysML") ? "" : "UML ") + ty }]]
                        }],
                    changedAt: opts.fileDate
                };
                addDesc(r, oD);
                diagramL.push({
                    id: r.id,
                    name: nm,
                    type: ty
                });
                if (params.packageId)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(params.packageId + terms.scContains + r.id),
                        class: LIB.makeKey(terms.scContains),
                        subject: LIB.makeKey(params.packageId),
                        object: LIB.makeKey(r.id),
                        changedAt: opts.fileDate
                    });
                Array.from(dg.getElementsByTagName('usedElements'), uE => makeStatementShows(r.id, uE.innerHTML));
                if (params.parent) {
                    makeStatementShows(r.id, params.parent);
                    spD.statements.push({
                        id: CONFIG.prefixS + 'ownedDiagram-' + simpleHash(params.parent.id + terms.scHasDiagram + r.id),
                        class: LIB.makeKey(terms.scHasDiagram),
                        subject: LIB.makeKey(params.parent.id),
                        object: LIB.makeKey(r.id),
                        changedAt: opts.fileDate
                    });
                }
                ;
                spD.resources.push(r);
                params.nodes.push({
                    id: CONFIG.prefixN + simpleHash(params.packageId + r.id),
                    resource: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            });
        }
        function makeStateMachine(el, params) {
            let r = makeResource(el, { class: terms.rcActor });
            spD.resources.push(r);
            spD.statements.push({
                id: CONFIG.prefixS + 'ownedBehavior-' + simpleHash(params.parent.id + terms.scHasBehavior + r.id),
                class: LIB.makeKey(terms.scHasBehavior),
                subject: LIB.makeKey(params.parent.id),
                object: LIB.makeKey(r.id),
                changedAt: opts.fileDate
            });
            if (params.packageId)
                spD.statements.push({
                    id: CONFIG.prefixS + 'contains-' + simpleHash(params.packageId + terms.scContains + r.id),
                    class: LIB.makeKey(terms.scContains),
                    subject: LIB.makeKey(params.packageId),
                    object: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "ownedComment":
                        break;
                    case "xmi:Extension":
                        makeDiagrams(ch, Object.assign({}, params, { parent: r }));
                        break;
                    case "region":
                        let stm = diagramL[diagramL.length - 1];
                        makeStatementShows(stm.id, ch.getAttribute("xmi:id"));
                        makeRegion(ch, Object.assign({}, params, { parent: r, diagram: stm }));
                        break;
                    default:
                        infoSkip(ch);
                }
                ;
            });
            return;
            function makeRegion(rg, params) {
                let reg = makeResource(rg, { class: terms.rcActor });
                spD.resources.push(reg);
                spD.statements.push({
                    id: CONFIG.prefixS + 'contains-' + simpleHash(params.parent.id + terms.scContains + reg.id),
                    class: LIB.makeKey(terms.scContains),
                    subject: LIB.makeKey(params.parent.id),
                    object: LIB.makeKey(reg.id),
                    changedAt: opts.fileDate
                });
                Array.from(rg.children, (ch) => {
                    let r;
                    switch (ch.tagName) {
                        case "ownedComment":
                            break;
                        case "subvertex":
                            r = makeResource(ch, { class: terms.rcState });
                            spD.statements.push({
                                id: CONFIG.prefixS + 'contains-' + simpleHash(reg.id + terms.scContains + r.id),
                                class: LIB.makeKey(terms.scContains),
                                subject: LIB.makeKey(reg.id),
                                object: LIB.makeKey(r.id),
                                changedAt: opts.fileDate
                            });
                            Array.from(ch.children, (ch) => {
                                switch (ch.tagName) {
                                    case "region":
                                        makeRegion(ch, Object.assign({}, params, { parent: r }));
                                }
                                ;
                            });
                            break;
                        case "transition":
                            r = makeResource(ch, { class: terms.rcActor });
                            let src = ch.getAttribute("source"), tgt = ch.getAttribute("target"), stTransition = { id: r.id, source: src, target: tgt };
                            spD.statements.push({
                                id: CONFIG.prefixS + 'startsFrom-' + simpleHash(src + terms.scTransitionSource + r.id),
                                class: LIB.makeKey(terms.scTransitionSource),
                                subject: LIB.makeKey(r.id),
                                object: LIB.makeKey(src),
                                changedAt: opts.fileDate
                            });
                            spD.statements.push({
                                id: CONFIG.prefixS + 'endsAt-' + simpleHash(tgt + terms.scTransitionTarget + r.id),
                                class: LIB.makeKey(terms.scTransitionTarget),
                                subject: LIB.makeKey(r.id),
                                object: LIB.makeKey(tgt),
                                changedAt: opts.fileDate
                            });
                            Array.from(ch.children, (ch) => {
                                switch (ch.tagName) {
                                    case "ownedComment":
                                        break;
                                    case "trigger":
                                        let evId = ch.getAttribute("event");
                                        stTransition.event = evId;
                                        spD.statements.push({
                                            id: CONFIG.prefixS + 'triggers-' + simpleHash(evId + terms.scTriggers + r.id),
                                            class: LIB.makeKey(terms.scTriggers),
                                            subject: LIB.makeKey(evId),
                                            object: LIB.makeKey(r.id),
                                            changedAt: opts.fileDate
                                        });
                                        makeStatementShows(params.diagram.id, evId);
                                        break;
                                    case "effect":
                                        makeActivity(ch, Object.assign({}, params, { parent: r }));
                                        break;
                                    default:
                                        infoSkip(ch);
                                }
                                ;
                            });
                            stateTransitionL.push(stTransition);
                            break;
                        default:
                            infoSkip(ch);
                    }
                    ;
                    if (r) {
                        spD.resources.push(r);
                        if (opts.addElementsToHierarchy)
                            params.nodes.push(makeNode(r, params.packageId));
                    }
                    ;
                });
            }
        }
        function makeActivity(el, params) {
            let r = makeResource(el, { class: terms.rcActor });
            spD.resources.push(r);
            if (params.packageId)
                spD.statements.push({
                    id: CONFIG.prefixS + 'contains-' + simpleHash(params.packageId + terms.scContains + r.id),
                    class: LIB.makeKey(terms.scContains),
                    subject: LIB.makeKey(params.packageId),
                    object: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            if (params.parent)
                spD.statements.push({
                    id: CONFIG.prefixS + 'ownedBehavior-' + simpleHash(params.parent.id + terms.scHasBehavior + r.id),
                    class: LIB.makeKey(terms.scHasBehavior),
                    subject: LIB.makeKey(params.parent.id),
                    object: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                        makeDiagrams(ch, Object.assign({}, params, { parent: r }));
                        break;
                    case "node":
                        let act = makeResource(ch, { class: terms.rcActor });
                        spD.resources.push(act);
                        spD.statements.push({
                            id: CONFIG.prefixS + 'contains-' + simpleHash(r.id + terms.scContains + act.id),
                            class: LIB.makeKey(terms.scContains),
                            subject: LIB.makeKey(r.id),
                            object: LIB.makeKey(act.id),
                            changedAt: opts.fileDate
                        });
                        break;
                }
                ;
            });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "ownedComment":
                        break;
                    case "xmi:Extension":
                    case "node":
                        break;
                    case "edge":
                        spD.statements.push({
                            id: ch.getAttribute('xmi:id'),
                            class: LIB.makeKey(terms.scControlFlow),
                            subject: LIB.makeKey(ch.getAttribute('source')),
                            object: LIB.makeKey(ch.getAttribute('target')),
                            changedAt: opts.fileDate
                        });
                        break;
                    default:
                        infoSkip(ch);
                }
                ;
            });
        }
        function makeResourceClass(el, pars) {
            let rcId = el.getAttribute("xmi:id"), desc = parseDesc(el, { parent: rcId }), rc = {
                id: CONFIG.prefixRC + rcId,
                title: el.getAttribute("name"),
                description: desc ? [{ text: desc }] : undefined,
                keepEvenIfUnused: true,
                changedAt: opts.fileDate
            };
            return rc;
        }
        function makeResource(el, pars) {
            let r = {
                id: el.getAttribute("xmi:id"),
                class: pars && pars["class"] ? LIB.makeKey(pars["class"]) : undefined,
                properties: [{
                        class: LIB.makeKey("PC-Name"),
                        values: [[{ text: (pars && pars.name ? pars.name : replaceSeparatorNS(el.getAttribute("name")) || ('unnamed ' + el.getAttribute("xmi:type"))) }]]
                    }, {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: el.getAttribute("xmi:type") }]]
                    }],
                changedAt: opts.fileDate
            };
            addDesc(r, el);
            return r;
        }
        function makeNode(r, pck) {
            let nd = {
                id: CONFIG.prefixN + simpleHash(pck + r.id),
                resource: LIB.makeKey(r.id),
                nodes: [],
                changedAt: opts.fileDate
            };
            return nd;
        }
        function parseDesc(el, opts) {
            let dscL = [];
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case 'ownedComment':
                        let desc = ch.getAttribute("body");
                        if (desc)
                            dscL.push(desc);
                }
                ;
            });
            if (dscL.length > 1)
                console.warn("Element " + opts.parent + " has more than one comment/description.");
            if (dscL.length > 0)
                return dscL[0];
        }
        function addDesc(r, el) {
            let desc = parseDesc(el, { parent: r.id });
            if (desc)
                r.properties.push({
                    class: LIB.makeKey("PC-Description"),
                    values: [[{ text: desc }]]
                });
        }
        function makeStatementShows(sbj, obj) {
            if (sbj && obj) {
                let stId = CONFIG.prefixS + 'shows-' + simpleHash(sbj + terms.scShows + obj);
                if (LIB.indexById(usedElementL, stId) < 0)
                    usedElementL.push({
                        id: stId,
                        class: LIB.makeKey(terms.scShows),
                        subject: LIB.makeKey(sbj),
                        object: LIB.makeKey(obj),
                        changedAt: opts.fileDate
                    });
            }
            else
                console.error("When creating 'shows' statement, the subject or object is undefined", sbj, obj);
        }
        function validateStatement(st, idx, stL) {
            if (LIB.isKey(st.subject) && LIB.isKey(st.object) && LIB.isKey(st["class"])) {
                let stC = LIB.itemByKey(spD.statementClasses, st["class"]), list = spD.resources.concat(stL), sbj = LIB.itemByKey(list, st.subject), obj = LIB.itemByKey(list, st.object), valid = sbj && obj;
                if (!stC) {
                    console.warn("Cameo Import: Class " + st["class"].id + " for statement " + st.id + " not found.");
                    return false;
                }
                ;
                if (!valid)
                    console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + ", because " + (sbj ? ("object " + st.object.id) : ("subject " + st.subject.id)) + " isn't listed as resource resp. statement.");
                else {
                    valid = ((!stC.subjectClasses || LIB.referenceIndex(stC.subjectClasses, sbj["class"]) > -1)
                        && (!stC.objectClasses || LIB.referenceIndex(stC.objectClasses, obj["class"]) > -1));
                    if (!valid)
                        console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + " with subject", sbj, " and object", obj, ", because they violate the statementClass.");
                }
                ;
                return valid;
            }
            ;
            console.warn("Cameo Import: Skipping statement, because class, subject or object is undefined: " + st);
            return false;
        }
    }
    function replaceSeparatorNS(name) {
        if (name && opts.replaceSeparatorNamespace) {
            let rx = new RegExp('^(.{1,9})\\' + opts.replaceSeparatorNamespace + '(.+)$');
            return name.replace(rx, (match, $2, $3) => { return $2 + ':' + $3; });
        }
        ;
        return name;
    }
    function infoSkip(el) {
        let nm = el.getAttribute("name"), ex = " with " + (nm ? "name '" + nm + "' and " : "") + "id '" + el.getAttribute("xmi:id") + "'.";
        console.info("Cameo Import: Skipping tag '" + el.tagName + "'" + ex);
    }
    function validateCameo(xmi) {
        return xmi.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw");
    }
}
