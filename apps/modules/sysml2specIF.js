"use strict";
/*!	Transform SysML XMI to SpecIF
    - Parse the XMI file
    - Extract both model-elements and semantic relations in SpecIF Format
    - Model elements with same type and title are NOT consolidated by this transformation
    
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de

    References:
    [1] S.Friedenthal et al: A Practical Guide to SysML, The MK/OMG Press, Third Edition
*/
function sysml2specif(xmi, options) {
    "use strict";
    const idResourceClassDiagram = "RC-SpecifView", idResourceClassActor = "RC-Actor", idResourceClassState = "RC-State", idResourceClassEvent = "RC-Event", idResourceClassCollection = "RC-Collection", idResourceClassDefault = "RC-SpecifModelelement", idStatementClassContains = "SC-DctermsHaspart", idStatementClassShows = "SC-shows";
    if (typeof (options) != 'object' || !options.fileName)
        return null;
    let opts = Object.assign({
        fileDate: new Date().toISOString(),
        titleLength: 96,
        textLength: 8192,
        mimeType: "application/vnd.xmi+xml",
        strNamespace: "SysML:",
        modelElementClasses: [idResourceClassActor, idResourceClassState, idResourceClassEvent, idResourceClassCollection],
        strRoleType: "SpecIF:Role",
        strFolderType: "SpecIF:Heading",
        strDiagramType: "SpecIF:View",
        strTextAnnotation: "Text Annotation"
    }, options);
    var parser = new DOMParser(), xmiDoc = parser.parseFromString(xmi, "text/xml");
    console.debug('xmi', xmiDoc);
    if (xmiDoc.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
        && xmiDoc.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0"))
        return cameo2specif(xmiDoc, opts);
    return null;
    function cameo2specif(xmi, opts) {
        var modDoc = xmi.getElementsByTagName('uml:Model')[0], spD = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"] });
        spD.id = modDoc.getAttribute("xmi:id");
        spD.title = [{ text: modDoc.getAttribute("name") }];
        let usedElements = [], specializations = [], associations = [];
        Array.from(modDoc.children, ch => parseEl(ch, { package: undefined, nodes: spD.hierarchies }));
        specializations = specializations
            .filter(validateStatement);
        spD.resources
            .forEach((me) => {
            if (me["class"].id == idResourceClassDefault) {
                let rC = generalizingResourceClassOf(me);
                if (rC && rC.id != idResourceClassDefault) {
                    me["class"] = LIB.makeKey(rC.id);
                    console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + me.properties[0].values[0][0].text);
                    return;
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
                    let gE = LIB.itemByKey(spD.resources, sp.object), ti = LIB.getTitleFromProperties(gE.properties, spD.propertyClasses, { targetLanguage: "default" }), rC = LIB.itemByTitle(spD.resourceClasses, ti);
                    if (rC)
                        return rC;
                    rC = generalizingResourceClassOf(gE);
                    if (rC)
                        return rC;
                }
                ;
            }
        });
        LIB.cacheL(spD.statements, associations
            .map((ac) => {
            return ac.statement;
        }));
        spD.statements = usedElements
            .concat(spD.statements)
            .filter(validateStatement)
            .concat(specializations);
        console.debug('SysML', spD, opts);
        return spD;
        function parseEl(ch, params) {
            switch (ch.tagName) {
                case "xmi:Extension":
                    Array.from(ch.getElementsByTagName('ownedDiagram'), (oD) => {
                        let dg = oD.getElementsByTagName('diagram:DiagramRepresentationObject')[0];
                        let r = {
                            id: oD.getAttribute("xmi:id"),
                            class: LIB.makeKey(idResourceClassDiagram),
                            properties: [{
                                    class: LIB.makeKey("PC-Name"),
                                    values: [[{ text: oD.getAttribute("name") }]]
                                }, {
                                    class: LIB.makeKey("PC-Type"),
                                    values: [[{ text: oD.getAttribute("xmi:type") }]]
                                }, {
                                    class: LIB.makeKey("PC-Notation"),
                                    values: [[{ text: dg.getAttribute("type") }]]
                                }],
                            changedAt: opts.fileDate
                        };
                        if (params.package)
                            spD.statements.push({
                                id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r.id),
                                class: LIB.makeKey(idStatementClassContains),
                                subject: LIB.makeKey(params.package),
                                object: LIB.makeKey(r.id),
                                changedAt: opts.fileDate
                            });
                        Array.from(dg.getElementsByTagName('usedElements'), (uE) => {
                            usedElements.push({
                                id: CONFIG.prefixS + simpleHash(r.id + idStatementClassShows + uE.innerHTML),
                                class: LIB.makeKey(idStatementClassShows),
                                subject: LIB.makeKey(r.id),
                                object: LIB.makeKey(uE.innerHTML),
                                changedAt: opts.fileDate
                            });
                        });
                        spD.resources.push(r);
                        params.nodes.push({
                            id: CONFIG.prefixN + r.id,
                            resource: LIB.makeKey(r.id),
                            changedAt: opts.fileDate
                        });
                    });
                    break;
                case "packagedElement":
                    let ty = ch.getAttribute("xmi:type"), r = {
                        id: ch.getAttribute("xmi:id"),
                        properties: [{
                                class: LIB.makeKey("PC-Name"),
                                values: [[{ text: ch.getAttribute("name") }]]
                            }, {
                                class: LIB.makeKey("PC-Type"),
                                values: [[{ text: ty }]]
                            }],
                        changedAt: opts.fileDate
                    }, nd = {
                        id: CONFIG.prefixN + r.id,
                        resource: LIB.makeKey(r.id),
                        nodes: [],
                        changedAt: opts.fileDate
                    };
                    Array.from(ch.children, ch => parseEl(ch, { package: r.id, nodes: nd.nodes }));
                    switch (ty) {
                        case 'uml:Package':
                            r["class"] = LIB.makeKey(idResourceClassCollection);
                            spD.resources.push(r);
                            params.nodes.push(nd);
                            break;
                        case 'uml:Class':
                            let rC = LIB.itemByTitle(spD.resourceClasses, ch.getAttribute("name"));
                            if (rC) {
                                r["class"] = LIB.makeKey(rC.id);
                                console.info("Cameo Import: Assigning class " + rC.id + " to model-element " + r.id + " with title " + r.properties[0].values[0][0].text);
                            }
                            else {
                                r["class"] = LIB.makeKey(idResourceClassDefault);
                            }
                            ;
                            spD.resources.push(r);
                            params.nodes.push(nd);
                            if (params.package)
                                spD.statements.push({
                                    id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r.id),
                                    class: LIB.makeKey(idStatementClassContains),
                                    subject: LIB.makeKey(params.package),
                                    object: LIB.makeKey(r.id),
                                    changedAt: opts.fileDate
                                });
                            Array.from(ch.getElementsByTagName('generalization'), (gn) => {
                                specializations.push({
                                    id: gn.getAttribute("xmi:id"),
                                    class: LIB.makeKey("SC-UmlIsspecializationof"),
                                    subject: LIB.makeKey(r.id),
                                    object: LIB.makeKey(gn.getAttribute("general")),
                                    changedAt: opts.fileDate
                                });
                            });
                            Array.from(ch.getElementsByTagName('ownedAttribute'), (oA) => {
                                switch (oA.getAttribute("xmi:type")) {
                                    case "uml:Property":
                                        let pId = oA.getAttribute("xmi:id"), ty = oA.getAttribute("aggregation"), cl = ty == "composite" ? "SC-UmlIscomposedof" : (ty == "shared" ? "SC-UmlAggregates" : "SC-UmlIsassociatedwith"), ob = oA.getAttribute("type"), nm = oA.getAttribute("name");
                                        if (ob) {
                                            if (nm) {
                                                spD.resources.push({
                                                    id: pId,
                                                    class: LIB.makeKey(idResourceClassDefault),
                                                    properties: [{
                                                            class: LIB.makeKey("PC-Name"),
                                                            values: [[{ text: nm }]]
                                                        }, {
                                                            class: LIB.makeKey("PC-Type"),
                                                            values: [[{ text: "uml:Class" }]]
                                                        }],
                                                    changedAt: opts.fileDate
                                                });
                                                specializations.push({
                                                    id: CONFIG.prefixS + simpleHash(pId + "SC-UmlIsspecializationof" + ob),
                                                    class: LIB.makeKey("SC-UmlIsspecializationof"),
                                                    subject: LIB.makeKey(pId),
                                                    object: LIB.makeKey(ob),
                                                    changedAt: opts.fileDate
                                                });
                                                ob = pId;
                                            }
                                            ;
                                            associations.push({
                                                association: oA.getAttribute("association"),
                                                statement: {
                                                    id: CONFIG.prefixS + simpleHash(r.id + cl + ob),
                                                    class: LIB.makeKey(cl),
                                                    subject: LIB.makeKey(r.id),
                                                    object: LIB.makeKey(ob),
                                                    changedAt: opts.fileDate
                                                }
                                            });
                                            usedElements
                                                .filter((e) => {
                                                return e.object.id == pId;
                                            })
                                                .forEach((e) => {
                                                let stId = CONFIG.prefixS + simpleHash(e.subject.id + idStatementClassShows + ob), shownClass = LIB.itemByKey(usedElements, LIB.makeKey(stId));
                                                if (!shownClass) {
                                                    usedElements.push({
                                                        id: stId,
                                                        class: LIB.makeKey(idStatementClassShows),
                                                        subject: e.subject,
                                                        object: LIB.makeKey(ob),
                                                        changedAt: opts.fileDate
                                                    });
                                                }
                                                ;
                                            });
                                        }
                                        else {
                                            console.info("Cameo Import: Skipping the packagedElement", pId, "with name", nm, ".");
                                        }
                                        ;
                                        break;
                                    case "uml:Port":
                                }
                                ;
                            });
                            break;
                        case "uml:Association":
                            let nm = ch.getAttribute("name"), aId = ch.getAttribute("xmi:id");
                            if (nm) {
                                associations.forEach((ac) => {
                                    if (aId == ac.association) {
                                        let prp = {
                                            class: LIB.makeKey("PC-Type"),
                                            values: [[{ text: nm }]]
                                        };
                                        if (ac.statement.properties)
                                            ac.statement.properties.push(prp);
                                        else
                                            ac.statement.properties = [prp];
                                        ac.statement.id = CONFIG.prefixS + simpleHash(ac.statement.subject.id + ac.statement["class"] + ac.statement.object.id + nm);
                                    }
                                });
                            }
                            ;
                            break;
                        case "uml:ProfileApplication":
                            break;
                        case "uml:DataType":
                        default:
                            console.info("Cameo Import: Skipping the packagedElement", ch, "with name", ch.getAttribute("name"), "and type", ty, ".");
                    }
            }
        }
        function validateStatement(st) {
            let stC = LIB.itemByKey(spD.statementClasses, st["class"]), sbj = LIB.itemByKey(spD.resources.concat(spD.statements), st.subject), obj = LIB.itemByKey(spD.resources.concat(spD.statements), st.object), valid = sbj && obj;
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
    }
}
