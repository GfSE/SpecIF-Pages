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
*/
function sysml2specif(xmi, options) {
    "use strict";
    const terms = {};
    [
        { id: "resourceClassFolder", type: "resourceClass", term: CONFIG.resClassFolder },
        { id: "resourceClassDiagram", type: "resourceClass", term: CONFIG.resClassView },
        { id: "resourceClassActor", type: "resourceClass", term: CONFIG.resClassActor },
        { id: "resourceClassState", type: "resourceClass", term: CONFIG.resClassState },
        { id: "resourceClassEvent", type: "resourceClass", term: CONFIG.resClassEvent },
        { id: "resourceClassPackage", type: "resourceClass", term: "uml:Package" },
        { id: "resourceClassDefault", type: "resourceClass", term: CONFIG.resClassModelElement },
        { id: "statementClassControlFlow", type: "statementClass", term: "uml:ControlFlow" },
        { id: "statementClassTriggers", type: "statementClass", term: "uml:Trigger" },
        { id: "statementClassTransitionSource", type: "statementClass", term: "uml:TransitionSource" },
        { id: "statementClassTransitionTarget", type: "statementClass", term: "uml:TransitionTarget" },
        { id: "statementClassContains", type: "statementClass", term: "SpecIF:contains" },
        { id: "statementClassHasPart", type: "statementClass", term: "dcterms:hasPart" },
        { id: "statementClassSpecializes", type: "statementClass", term: "SpecIF:isSpecializationOf" },
        { id: "statementClassRealizes", type: "statementClass", term: "uml:Realization" },
        { id: "statementClassServes", type: "statementClass", term: "SpecIF:serves" },
        { id: "statementClassAssociatedWith", type: "statementClass", term: "SpecIF:isAssociatedWith" },
        { id: "statementClassHandles", type: "statementClass", term: "SpecIF:handles" },
        { id: "statementClassProvides", type: "statementClass", term: "SpecIF:provides" },
        { id: "statementClassConsumes", type: "statementClass", term: "SpecIF:consumes" },
        { id: "statementClassShows", type: "statementClass", term: "SpecIF:shows" },
        { id: "statementClassHasOwnedBehavior", type: "statementClass", term: "uml:ownedBehavior" }
    ].forEach((t) => {
        let term = app.ontology.getClassId(t.type, t.term);
        if (term)
            terms[t.id] = term;
        else
            console.error("Cameo Import: Term '" + t.term + "' not found in the ontology");
    });
    terms.statementClassAggregates =
        terms.statementClassComprises = terms.statementClassHasPart;
    terms.statementClassDefault = terms.statementClassAssociatedWith;
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
        return new resultMsg(0, '', 'object', cameo2specif(xmiDoc, opts));
    return new resultMsg(899, 'Cameo Import: Input file is not supported');
    function cameo2specif(xmi, opts) {
        function makeMap(att) {
            let top = xmi.getElementsByTagName('xmi:XMI')[0], map = new Map();
            Array.from(top.children, (ch) => {
                let base = ch.getAttribute(att);
                if (base) {
                    if (att == "base_Property")
                        map.set(base, { tag: ch.tagName, dir: ch.getAttribute("direction") });
                    else
                        map.set(base, ch.tagName);
                }
                ;
            });
            return map;
        }
        let classStereotypes = makeMap("base_Class"), abstractionStereotypes = makeMap("base_Abstraction"), propertyStereotypes = makeMap("base_Property"), flowProperties = new Map(), models = xmi.getElementsByTagName('uml:Model'), packgs = xmi.getElementsByTagName('uml:Package'), modDoc = models.length > 0 ? models[0] : packgs[0], spD = app.ontology.generateSpecifClasses({
            domains: [
                "SpecIF:DomainBase",
                "SpecIF:DomainSystemsEngineering",
                "SpecIF:DomainSystemModelIntegration"
            ],
            lifeCycles: [
                "SpecIF:LifecycleStatusReleased",
                "SpecIF:LifecycleStatusEquivalent"
            ]
        }), diagramL = [], usedElementL = [], abstractions = [], specializations = [], associationEnds = [], portL = [], connectorL = [], stateTransitionL = [];
        spD.id = CONFIG.prefixP + modDoc.getAttribute("xmi:id");
        spD.title = [{ text: modDoc.getAttribute("name") }];
        let r = {
            id: modDoc.getAttribute("xmi:id"),
            class: LIB.makeKey(terms.resourceClassFolder),
            properties: [{
                    class: LIB.makeKey("PC-Name"),
                    values: [[{ text: replaceSeparatorNS(modDoc.getAttribute("name")) }]]
                }, {
                    class: LIB.makeKey("PC-Type"),
                    values: [[{ text: modDoc.getAttribute("xmi:type") }]]
                }],
            changedAt: opts.fileDate
        }, nd = makeNode(r, spD.id);
        spD.resources.push(r);
        spD.nodes.push(nd);
        parseElements(modDoc, { package: '', nodes: nd.nodes });
        specializations = specializations
            .filter(validateStatement);
        spD.resources
            .forEach((me) => {
            if (me["class"].id == terms.resourceClassDefault) {
                let rC;
                rC = generalizingResourceClassOf(me);
                if (rC && rC.id != terms.resourceClassDefault) {
                    me["class"] = LIB.makeKey(rC.id);
                    console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                }
                ;
                let sTy = classStereotypes.get(me.id);
                if (sTy) {
                    if (sTy == "sysml:InterfaceBlock") {
                        me["class"] = LIB.makeKey(terms.resourceClassState);
                        console.info("Cameo Import: Reassigning class '" + terms.resourceClassState + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                        return;
                    }
                    ;
                    let prp = LIB.propByTitle(me, CONFIG.propClassType, spD);
                    if (prp) {
                        prp.values = [[{ text: sTy }]];
                        console.info("Cameo Import: Assigning stereotype '" + sTy + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                    }
                    ;
                }
                ;
            }
            ;
            return;
            function generalizingResourceClassOf(r) {
                let spL = specializations.filter((sp) => {
                    return sp.subject.id == r.id;
                });
                if (spL.length > 1)
                    console.warn("Cameo Import: Model-elment with id " + me.id + " specializes " + spL.length + " classes");
                for (var sp of spL) {
                    let gE = LIB.itemByKey(spD.resources, sp.object), ti = LIB.titleFromProperties(gE.properties, spD.propertyClasses, { targetLanguage: "default" }), rC = LIB.itemByTitle(spD.resourceClasses, ti);
                    if (rC)
                        return rC;
                    rC = generalizingResourceClassOf(gE);
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
                let sC = LIB.itemByTitle(spD.statementClasses, sTy);
                if (sC) {
                    a['class'] = LIB.makeKey(sC.id);
                    console.info("Cameo Import: Re-assigning class " + sC.id + " with title " + sTy + " to statement " + a.id);
                }
                else {
                    let prp = {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: sTy }]]
                    };
                    LIB.addProperty(a, prp);
                    console.info("Cameo Import: Assigning stereotype " + sTy + " to statement " + a.id);
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
                    acc = p.isConjugated ? terms.statementClassProvides : terms.statementClassConsumes;
                    spD.statements.push({
                        id: CONFIG.prefixS + (p.isConjugated ? 'provides-' : 'consumes-') + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
                    break;
                case 'out':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: p.isConjugated ? 'in' : 'out' }]]
                    });
                    acc = p.isConjugated ? terms.statementClassConsumes : terms.statementClassProvides;
                    spD.statements.push({
                        id: CONFIG.prefixS + (p.isConjugated ? 'consumes-' : 'provides-') + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource),
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
                        id: CONFIG.prefixS + 'handles-' + simpleHash(p.resource.id + terms.statementClassHandles + ibId),
                        class: LIB.makeKey(terms.statementClassHandles),
                        subject: LIB.makeKey(p.resource),
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
                    class: LIB.makeKey(terms.statementClassServes),
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
                    class: LIB.makeKey(terms.statementClassServes),
                    subject: LIB.makeKey(port1.id),
                    object: LIB.makeKey(port0.id),
                    changedAt: opts.fileDate
                });
                return;
            }
            ;
            spD.statements.forEach((st) => {
                if (st['class'].id == terms.statementClassComprises) {
                    if (st.subject.id == port0.parent.id && st.object.id == port1.parent.id) {
                        spD.statements.push({
                            id: co.id,
                            class: LIB.makeKey(terms.statementClassServes),
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
                            class: LIB.makeKey(terms.statementClassServes),
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
            let src = LIB.itemById(spD.resources, stT.source), sTi = LIB.valueByTitle(src, 'dcterms:title', spD), tgt = LIB.itemById(spD.resources, stT.target), tTi = LIB.valueByTitle(tgt, 'dcterms:title', spD), tr = LIB.itemById(spD.resources, stT.id);
            if (sTi == 'uml:Pseudostate') {
                sTi = 'entry';
                LIB.updatePropertyByTitle(src, 'dcterms:title', () => { return [[{ text: sTi }]]; }, spD);
            }
            ;
            let trName = sTi + '→' + tTi;
            LIB.updatePropertyByTitle(tr, 'dcterms:title', () => {
                let ti = LIB.valueByTitle(tr, 'dcterms:title', spD);
                return ti == 'uml:Transition' ? [[{ text: trName }]] : undefined;
            }, spD);
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
        function parseElements(parent, params) {
            Array.from(parent.children, (ch) => {
                let r;
                switch (ch.tagName) {
                    case "packagedElement":
                        let ty = ch.getAttribute("xmi:type");
                        switch (ty) {
                            case "uml:DataType":
                                r = makeResource(ch, { class: terms.resourceClassDefault });
                                spD.resources.push(r);
                                if (opts.addElementsToHierarchy)
                                    params.nodes.push(makeNode(r, params.package));
                        }
                        ;
                }
                ;
            });
            Array.from(parent.children, (ch) => {
                let r, nd;
                switch (ch.tagName) {
                    case "xmi:Extension":
                        makeDiagrams(ch, params);
                        break;
                    case "packagedElement":
                        switch (ch.getAttribute("xmi:type")) {
                            case 'uml:Package':
                                r = makeResource(ch, { class: terms.resourceClassPackage });
                                spD.resources.push(r);
                                nd = makeNode(r, params.package);
                                if (opts.addElementsToHierarchy)
                                    params.nodes.push(nd);
                                parseElements(ch, { package: r.id, nodes: nd.nodes });
                                break;
                            case 'uml:Class':
                                parseClass(ch, params);
                                break;
                            case 'uml:CallEvent':
                            case 'uml:ChangeEvent':
                            case 'uml:SignalEvent':
                            case 'uml:TimeEvent':
                                parseEvent(ch, params);
                                break;
                            case "uml:DataType":
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
            Array.from(parent.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                        break;
                    case "packagedElement":
                        let ty = ch.getAttribute("xmi:type");
                        switch (ty) {
                            case 'uml:Package':
                            case 'uml:Class':
                            case "uml:DataType":
                            case 'uml:CallEvent':
                            case 'uml:ChangeEvent':
                            case 'uml:SignalEvent':
                            case 'uml:TimeEvent':
                                break;
                            case "uml:Association":
                                parseAssociation(ch);
                                break;
                            case "uml:Abstraction":
                                let sbj = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), obj = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref");
                                abstractions.push({
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(terms.statementClassDefault),
                                    subject: LIB.makeKey(sbj),
                                    object: LIB.makeKey(obj),
                                    changedAt: opts.fileDate
                                });
                                break;
                            case "uml:Realization":
                                let sbjR = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), objR = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref"), staR = {
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(terms.statementClassRealizes ?? terms.statementClassAssociatedWith),
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
                        console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                }
                ;
            });
            function parseClass(el, params) {
                let r2 = makeResource(el, { class: terms.resourceClassDefault });
                spD.resources.push(r2);
                let nd2 = makeNode(r2, params.package), pars = { package: params.package, parent: r2, nodes: nd2.nodes };
                if (opts.addElementsToHierarchy)
                    params.nodes.push(nd2);
                if (params.package)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(params.package + terms.statementClassContains + r2.id),
                        class: LIB.makeKey(terms.statementClassContains),
                        subject: LIB.makeKey(params.package),
                        object: LIB.makeKey(r2.id),
                        changedAt: opts.fileDate
                    });
                Array.from(el.children, (ch) => {
                    switch (ch.tagName) {
                        case 'nestedClassifier':
                            parseClass(ch, pars);
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
                            specializations.push({
                                id: ch.getAttribute("xmi:id"),
                                class: LIB.makeKey(terms.statementClassSpecializes),
                                subject: LIB.makeKey(r2.id),
                                object: LIB.makeKey(ch.getAttribute("general")),
                                changedAt: opts.fileDate
                            });
                            break;
                        case 'ownedAttribute':
                            parseOwnedAttribute(ch, { parent: r2, nodes: nd2.nodes });
                            break;
                        case 'ownedOperation':
                            let oO = makeResource(ch, { class: terms.resourceClassActor });
                            spD.resources.push(oO);
                            if (opts.addElementsToHierarchy)
                                nd2.nodes.push(makeNode(oO, r2.id));
                            spD.statements.push({
                                id: CONFIG.prefixS + 'comprises-' + simpleHash(r2.id + terms.statementClassComprises + oO.id),
                                class: LIB.makeKey(terms.statementClassComprises),
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
                            console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                    }
                });
                function parseOwnedAttribute(oA, params) {
                    let pId, ac, ty, ag, ti, nm, cl;
                    switch (oA.getAttribute("xmi:type")) {
                        case "uml:Property":
                            pId = oA.getAttribute("xmi:id");
                            ac = oA.getAttribute("association");
                            ty = oA.getAttribute("type");
                            ag = oA.getAttribute("aggregation");
                            if (ac && ty) {
                                cl = ag == "composite" ? terms.statementClassComprises : (ag == "shared" ? terms.statementClassAggregates : undefined);
                                nm = oA.getAttribute("name");
                                if (nm) {
                                    spD.resources.push({
                                        id: pId,
                                        class: LIB.makeKey(terms.resourceClassDefault),
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
                                        id: CONFIG.prefixS + 'specializes-' + simpleHash(pId + terms.statementClassSpecializes + ty),
                                        class: LIB.makeKey(terms.statementClassSpecializes),
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
                                        class: LIB.makeKey(terms.statementClassDefault),
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
                                let r = makeResource(oA, { class: terms.resourceClassState });
                                spD.resources.push(r);
                                if (opts.addElementsToHierarchy)
                                    nd2.nodes.push(makeNode(r, params.parent.id));
                                spD.statements.push({
                                    id: CONFIG.prefixS + 'comprises-' + simpleHash(params.parent.id + terms.statementClassComprises + r.id),
                                    class: LIB.makeKey(terms.statementClassComprises),
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
                                id: CONFIG.prefixS + 'hasPart-' + simpleHash(params.parent.id + terms.statementClassHasPart + pId),
                                class: LIB.makeKey(terms.statementClassHasPart),
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
            function parseEvent(el, params) {
                let re = makeResource(el, { class: terms.resourceClassEvent });
                spD.resources.push(re);
                if (opts.addElementsToHierarchy)
                    params.nodes.push(makeNode(re, params.package));
                if (params.package)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(params.package + terms.statementClassContains + re.id),
                        class: LIB.makeKey(terms.statementClassContains),
                        subject: LIB.makeKey(params.package),
                        object: LIB.makeKey(re.id),
                        changedAt: opts.fileDate
                    });
            }
            function parseAssociation(el) {
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
                        class: LIB.makeKey(aEnds[0].associationType ?? (sC ? sC.id : undefined) ?? terms.statementClassAssociatedWith),
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
                            cl = aEnds[0].associationType ?? (sC ? sC.id : undefined) ?? terms.statementClassAssociatedWith;
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
                        properties: prpL,
                        changedAt: opts.fileDate
                    };
                    Array.from(el.getElementsByTagName('ownedEnd'), (oE) => {
                        let ag = oE.getAttribute("aggregation");
                        if (ag && ['composite', 'shared'].includes(ag)) {
                            st['class'] = LIB.makeKey(ag == 'composite' ? terms.statementClassComprises : terms.statementClassAggregates);
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
                    class: LIB.makeKey(terms.resourceClassDiagram),
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
                if (params.package)
                    spD.statements.push({
                        id: CONFIG.prefixS + 'contains-' + simpleHash(params.package + terms.statementClassContains + r.id),
                        class: LIB.makeKey(terms.statementClassContains),
                        subject: LIB.makeKey(params.package),
                        object: LIB.makeKey(r.id),
                        changedAt: opts.fileDate
                    });
                Array.from(dg.getElementsByTagName('usedElements'), uE => makeStatementShows(r.id, uE.innerHTML));
                if (params.parent)
                    makeStatementShows(r.id, params.parent);
                spD.resources.push(r);
                params.nodes.push({
                    id: CONFIG.prefixN + simpleHash(params.package + r.id),
                    resource: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            });
        }
        function makeStateMachine(el, params) {
            let r = makeResource(el, { class: terms.resourceClassActor });
            spD.resources.push(r);
            spD.statements.push({
                id: CONFIG.prefixS + 'ownedBehavior-' + simpleClone(params.parent.id + r.id),
                class: LIB.makeKey(terms.statementClassHasOwnedBehavior),
                subject: LIB.makeKey(params.parent),
                object: LIB.makeKey(r),
                changedAt: opts.fileDate
            });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                        makeDiagrams(ch, Object.assign({}, params, { parent: r }));
                        break;
                    case "region":
                        let stm = diagramL[diagramL.length - 1];
                        makeStatementShows(stm.id, ch.getAttribute("xmi:id"));
                        makeRegion(ch, Object.assign({}, params, { parent: r, diagram: stm }));
                        break;
                    default:
                        console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                }
                ;
            });
            return;
            function makeRegion(rg, params) {
                let reg = makeResource(rg, { class: terms.resourceClassActor });
                spD.resources.push(reg);
                spD.statements.push({
                    id: CONFIG.prefixS + 'contains-' + simpleHash(params.parent.id + terms.statementClassContains + reg.id),
                    class: LIB.makeKey(terms.statementClassContains),
                    subject: LIB.makeKey(params.parent),
                    object: LIB.makeKey(reg),
                    changedAt: opts.fileDate
                });
                Array.from(rg.children, (ch) => {
                    let r;
                    switch (ch.tagName) {
                        case "subvertex":
                            r = makeResource(ch, { class: terms.resourceClassState });
                            spD.statements.push({
                                id: CONFIG.prefixS + 'contains-' + simpleHash(reg.id + terms.statementClassContains + r.id),
                                class: LIB.makeKey(terms.statementClassContains),
                                subject: LIB.makeKey(reg),
                                object: LIB.makeKey(r),
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
                            r = makeResource(ch, { class: terms.resourceClassActor });
                            let src = ch.getAttribute("source"), tgt = ch.getAttribute("target"), stTransition = { id: r.id, source: src, target: tgt };
                            spD.statements.push({
                                id: CONFIG.prefixS + 'startsFrom-' + simpleHash(src + terms.statementClassTransitionSource + r.id),
                                class: LIB.makeKey(terms.statementClassTransitionSource),
                                subject: LIB.makeKey(r),
                                object: LIB.makeKey(src),
                                changedAt: opts.fileDate
                            });
                            spD.statements.push({
                                id: CONFIG.prefixS + 'endsAt-' + simpleHash(tgt + terms.statementClassTransitionTarget + r.id),
                                class: LIB.makeKey(terms.statementClassTransitionTarget),
                                subject: LIB.makeKey(r),
                                object: LIB.makeKey(tgt),
                                changedAt: opts.fileDate
                            });
                            Array.from(ch.children, (ch) => {
                                switch (ch.tagName) {
                                    case "trigger":
                                        let evId = ch.getAttribute("event");
                                        stTransition.event = evId;
                                        spD.statements.push({
                                            id: CONFIG.prefixS + 'triggers-' + simpleHash(evId + terms.statementClassTriggers + r.id),
                                            class: LIB.makeKey(terms.statementClassTriggers),
                                            subject: LIB.makeKey(evId),
                                            object: LIB.makeKey(r),
                                            changedAt: opts.fileDate
                                        });
                                        makeStatementShows(params.diagram.id, evId);
                                        break;
                                    case "effect":
                                        makeActivity(ch, Object.assign({}, params, { parent: r }));
                                        break;
                                    default:
                                        console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                                }
                                ;
                            });
                            stateTransitionL.push(stTransition);
                            break;
                        default:
                            console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                    }
                    ;
                    spD.resources.push(r);
                });
            }
        }
        function makeActivity(el, params) {
            console.debug('makeActivity still incomplete', el, params);
            let r = makeResource(el, { class: terms.resourceClassActor });
            spD.resources.push(r);
            spD.statements.push({
                id: CONFIG.prefixS + 'ownedBehavior-' + simpleClone(params.parent.id + terms.statementClassHasOwnedBehavior + r.id),
                class: LIB.makeKey(terms.statementClassHasOwnedBehavior),
                subject: LIB.makeKey(params.parent),
                object: LIB.makeKey(r),
                changedAt: opts.fileDate
            });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                        makeDiagrams(ch, Object.assign({}, params, { parent: r }));
                        break;
                    case "node":
                        let act = makeResource(ch, { class: terms.resourceClassActor });
                        spD.resources.push(act);
                        spD.statements.push({
                            id: CONFIG.prefixS + 'contains-' + simpleHash(r.id + terms.statementClassContains + act.id),
                            class: LIB.makeKey(terms.statementClassContains),
                            subject: LIB.makeKey(r),
                            object: LIB.makeKey(act),
                            changedAt: opts.fileDate
                        });
                        break;
                }
                ;
            });
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                    case "node":
                        break;
                    case "edge":
                        spD.statements.push({
                            id: ch.getAttribute('xmi:id'),
                            class: LIB.makeKey(terms.statementClassControlFlow),
                            subject: LIB.makeKey(ch.getAttribute('source')),
                            object: LIB.makeKey(ch.getAttribute('target')),
                            changedAt: opts.fileDate
                        });
                        break;
                    default:
                        console.info("Cameo Import: Skipping tag", ch.tagName, "with name", ch.getAttribute("name"), ".");
                }
                ;
            });
        }
        function makeResource(el, pars) {
            let r = {
                id: el.getAttribute("xmi:id"),
                class: pars && pars["class"] ? LIB.makeKey(pars["class"]) : undefined,
                properties: [{
                        class: LIB.makeKey("PC-Name"),
                        values: [[{ text: replaceSeparatorNS(pars && pars.name ? pars.name : (el.getAttribute("name")) ?? (el.getAttribute("xmi:type"))) }]]
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
        function addDesc(r, el) {
            Array.from(el.children, (ch) => {
                switch (ch.tagName) {
                    case 'ownedComment':
                        let desc = ch.getAttribute("body");
                        if (desc)
                            r.properties.push({
                                class: LIB.makeKey("PC-Description"),
                                values: [[{ text: desc }]]
                            });
                }
                ;
            });
        }
        function makeStatementShows(sbj, obj) {
            if (sbj && obj) {
                let stId = CONFIG.prefixS + 'shows-' + simpleHash(sbj + terms.statementClassShows + obj);
                if (LIB.indexById(usedElementL, stId) < 0)
                    usedElementL.push({
                        id: stId,
                        class: LIB.makeKey(terms.statementClassShows),
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
    function validateCameo(xmi) {
        return xmi.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
            && xmi.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0");
    }
    function replaceSeparatorNS(name) {
        if (opts.replaceSeparatorNamespace) {
            let rx = new RegExp('^(.{1,9})\\' + opts.replaceSeparatorNamespace + '(.+)$');
            return name.replace(rx, (match, $2, $3) => { return $2 + ':' + $3; });
        }
        ;
        return name;
    }
}
