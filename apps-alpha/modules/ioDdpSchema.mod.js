"use strict";
/*!	DDP-Schema import
    Dependencies: -
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)

    Limitations:
    - The schema is blindly traversed, so that almost every little change in structure will lead to failure
    
*/
moduleManager.construct({
    name: 'ioDdpSchema'
}, (self) => {
    "use strict";
    const errInvalidXML = new resultMsg(898, 'DDP Schema is not valid XML.'), errTransformationCancelled = new resultMsg(999, 'Transformation cancelled on user request.'), errTransformationFailed = new resultMsg(999, 'Input file could not be transformed to SpecIF.'), domainOfDDPElements = "V-Domain-20";
    self.init = () => {
        return true;
    };
    self.verify = (f) => {
        function isDdpSchema(fname) {
            return fname == "Dictionary.xsd";
        }
        if (!isDdpSchema(f.name)) {
            message.show("This transformation works only for 'Dictionary.xsd'.");
            return false;
        }
        ;
        return true;
    };
    self.toSpecif = (buf) => {
        let dDO = $.Deferred(), xsd = LIB.ab2str(buf);
        const modalId = "ddpOpts";
        self.cancel = () => {
            dDO.reject(errTransformationCancelled);
            self.modalOpts.hide();
        };
        self.nextStep = () => {
            let data;
            switch (radioValue(i18n.LblFormat)) {
                case 'ontology':
                    data = ddpSchema2specifOntology(xsd);
                    break;
                case 'specifClasses':
                    data = ddpSchema2specifClasses(xsd);
            }
            ;
            if (typeof (data) == 'object' && data.id)
                dDO.resolve(data);
            else
                dDO.reject(errTransformationFailed);
            self.modalOpts.hide();
        };
        if (LIB.validXML(xsd)) {
            $('body').append('<div id="' + modalId + '" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" >'
                + '<div class="modal-dialog modal-lg" >'
                + '<div class="modal-content" >'
                + '<div class="modal-header bg-primary text-white" >'
                + '<h5 class="modal-title" >Choose result type</h5>'
                + '<button type="button" class="btn-close" onclick="app.' + self.name + '.cancel()" aria-label="Close" > </button>'
                + '</div>'
                + '<div class="modal-body" >'
                + "<p>" + i18n.MsgExport + "</p>"
                + makeRadioField(i18n.LblFormat, [
                    { title: 'SpecIF Ontology for DDP', id: 'ontology', checked: true },
                    { title: 'SpecIF Classes for DDP', id: 'specifClasses' }
                ])
                + '</div>'
                + '<div class="modal-footer" >'
                + '<button type="button" class="btn btn-secondary" onclick="app.' + self.name + '.cancel()">' + i18n.BtnCancel + '</button>'
                + '<button type="button" class="btn btn-success" onclick="app.' + self.name + '.nextStep()">' + i18n.BtnImport + '</button>'
                + '</div>'
                + '</div>'
                + '</div>'
                + '</div>');
            const domEl = document.getElementById(modalId);
            domEl.addEventListener('hidePrevented.bs.modal', self.cancel);
            self.modalOpts = new bootstrap.Modal(domEl);
            self.modalOpts.show();
        }
        else
            dDO.reject(errInvalidXML);
        return dDO;
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
    function ddpSchema2specifClasses(xsd) {
        "use strict";
        var xsTerms = ["xs:string", "xs:boolean", "xs:integer", "xs:double", "xs:dateTime", "xs:anyURI"], spD = app.ontology.generateSpecifClasses({ terms: xsTerms });
        spD.title = [{ text: "SpecIF Classes for prostep iViP DDP (Data Model)" }];
        spD.description = [{ text: "SpecIF Classes derived from DDP Schema Version 2.0 created 10.03.2023 08:09:28 by Michael Kirsch, :em engineering methods AG on behalf of prostep iViP Association" }];
        spD.id = "P-DDP-Classes-V20";
        spD.createdAt = new Date().toISOString();
        let parser = new DOMParser(), xsdDoc = parser.parseFromString(xsd, "text/xml");
        let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
            .filter((ch) => { return ch.tagName == "xs:complexType"; })
            .filter((ch) => { return ch.getAttribute("name") == "DictionaryEntitiesCollection"; });
        Array.from(dictionaryEntities[0].children[0].children, (d) => {
            let dE = d.children[0].children[0].children[0];
            let ti = dE.getAttribute("name") || "", rC = {
                id: CONFIG.prefixRC + ti.toJsId(),
                title: ti,
                description: getDesc(dE),
                instantiation: ["auto", "user"],
                propertyClasses: [],
                changedAt: spD.createdAt
            };
            let attC = dE.getElementsByTagName('xs:complexContent'), atts = attC[0].children[0].children;
            let prpL = (atts && atts.length == 1) ? Array.from(atts[0].getElementsByTagName('xs:element')) : [];
            prpL.forEach((prp) => {
                let ti = prp.getAttribute("ref") || prp.getAttribute("name") || "", id = CONFIG.prefixPC + ti.toJsId(), ty = prp.getAttribute("type") || "xs:string", dT = LIB.itemBy(spD.dataTypes, "type", ty);
                if (dT) {
                    let pC = {
                        id: id,
                        title: ti,
                        description: getDesc(prp),
                        dataType: { id: dT.id },
                        changedAt: spD.createdAt
                    };
                    LIB.cacheE(spD.propertyClasses, pC);
                    LIB.cacheE(rC.propertyClasses, { id: id });
                }
                else
                    console.warn('Property with title ' + ti + ' has unknown data type ' + ty);
            });
            LIB.cacheE(spD.resourceClasses, rC);
        });
        let dictionaryRelations = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
            .filter((ch) => { return ch.tagName == "xs:complexType"; })
            .filter((ch) => { return ch.getAttribute("name") == "DictionaryRelationsCollection"; });
        Array.from(dictionaryRelations[0].children[0].children, (rel) => {
            if (rel.tagName == "xs:element") {
                let ti = rel.getAttribute("name") || "", sC = {
                    id: CONFIG.prefixSC + ti.toJsId(),
                    title: ti,
                    description: getDesc(rel),
                    subjectClasses: [],
                    objectClasses: [],
                    changedAt: spD.createdAt
                };
                let entities = Array.from(rel.getElementsByTagName('xs:element')), sbj = entities.filter((en) => {
                    return en.getAttribute("name").includes("subject");
                }), obj = entities.filter((en) => {
                    return en.getAttribute("name").includes("object");
                });
                let sTi = sbj[0].getAttribute("name").substring(7), oTi = obj[0].getAttribute("name").substring(6);
                sC.subjectClasses.push({
                    id: CONFIG.prefixRC + sTi.toJsId()
                });
                sC.objectClasses.push({
                    id: CONFIG.prefixRC + oTi.toJsId()
                });
                LIB.cacheE(spD.statementClasses, sC);
            }
        });
        console.info('SpecIF data from DDP', spD);
        return spD;
    }
    function ddpSchema2specifOntology(xsd) {
        "use strict";
        let spD = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainOntology"] }), termPropertyClasses = new Map();
        app.ontology.primitiveDataTypes.forEach((v, k) => {
            termPropertyClasses.set(v, k);
        });
        spD.title = [{ text: "prostep iViP DDP (Ontology)" }];
        spD.description = [{ text: "Ontology derived from DDP Schema Version 2.0 created 10.03.2023 08:09:28 by Michael Kirsch, :em engineering methods AG on behalf of prostep iViP Association" }];
        spD.id = "P-DDP-Ontology-V20";
        spD.createdAt = new Date().toISOString();
        let parser = new DOMParser(), xsdDoc = parser.parseFromString(xsd, "text/xml");
        let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
            .filter((ch) => { return ch.tagName == "xs:complexType"; })
            .filter((ch) => { return ch.getAttribute("name") == "DictionaryEntitiesCollection"; });
        Array.from(dictionaryEntities[0].children[0].children, (d) => {
            let dE = d.children[0].children[0].children[0];
            let ti = dE.getAttribute("name") || "", rT = {
                id: CONFIG.prefixR + ti.toJsId(),
                changedAt: spD.createdAt,
                class: {
                    "id": "RC-SpecifTermresourceclass"
                },
                properties: []
            };
            if (!RE.isolateNamespace.test(ti))
                ti = "DDP:" + ti;
            rT.properties.push({ "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] }, { "class": { "id": "PC-Description" }, "values": [getDesc(dE)] }, { "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] }, { "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] }, { "class": { "id": "PC-Instantiation" }, "values": ["V-Instantiation-10", "V-Instantiation-20"] });
            LIB.cacheE(spD.resources, rT);
            add2Hierarchy(rT.id, "N-FolderTermsResourceClass");
            let attC = dE.getElementsByTagName('xs:complexContent'), atts = attC[0].children[0].children;
            let prpL = (atts && atts.length == 1) ? Array.from(atts[0].getElementsByTagName('xs:element')) : [];
            prpL.forEach((prp) => {
                let ti = prp.getAttribute("ref") || prp.getAttribute("name") || "", ty = prp.getAttribute("type") || "xs:string", dT = LIB.itemBy(spD.dataTypes, "type", ty);
                if (dT) {
                    let pT = {
                        id: CONFIG.prefixR + ti.toJsId(),
                        changedAt: spD.createdAt,
                        class: {
                            "id": termPropertyClasses.get(ty)
                        },
                        properties: []
                    };
                    if (!RE.isolateNamespace.test(ti))
                        ti = "DDP:" + ti;
                    pT.properties.push({ "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] }, { "class": { "id": "PC-Description" }, "values": [getDesc(dE)] }, { "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] }, { "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] });
                    LIB.cacheE(spD.resources, pT);
                    add2Hierarchy(pT.id, "N-FolderTermsPropertyClass");
                    spD.statements.push({
                        id: CONFIG.prefixS + (rT.id + 'property' + pT.id).toJsId(),
                        class: { id: "SC-hasProperty" },
                        subject: { id: rT.id },
                        object: { id: pT.id },
                        changedAt: spD.createdAt
                    });
                }
                else
                    console.warn('Property with title ' + ti + ' has unknown data type ' + ty);
            });
        });
        let dictionaryRelations = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
            .filter((ch) => { return ch.tagName == "xs:complexType"; })
            .filter((ch) => { return ch.getAttribute("name") == "DictionaryRelationsCollection"; });
        Array.from(dictionaryRelations[0].children[0].children, (rel) => {
            if (rel.tagName == "xs:element") {
                let ti = rel.getAttribute("name") || "", sT = {
                    id: CONFIG.prefixR + ti.toJsId(),
                    changedAt: spD.createdAt,
                    class: {
                        "id": "RC-SpecifTermstatementclass"
                    },
                    properties: []
                };
                if (!RE.isolateNamespace.test(ti))
                    ti = "DDP:" + ti;
                sT.properties.push({ "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] }, { "class": { "id": "PC-Description" }, "values": [getDesc(rel)] }, { "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] }, { "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] }, { "class": { "id": "PC-Instantiation" }, "values": ["V-Instantiation-10", "V-Instantiation-20"] });
                LIB.cacheE(spD.resources, sT);
                add2Hierarchy(sT.id, "N-FolderTermsStatementClass");
                let entities = Array.from(rel.getElementsByTagName('xs:element')), sbj = entities.filter((en) => {
                    return en.getAttribute("name").includes("subject");
                }), obj = entities.filter((en) => {
                    return en.getAttribute("name").includes("object");
                });
                let sTi = sbj[0].getAttribute("name").substring(7), oTi = obj[0].getAttribute("name").substring(6), sbjId = CONFIG.prefixR + sTi.toJsId(), objId = CONFIG.prefixR + oTi.toJsId();
                spD.statements.push({
                    id: CONFIG.prefixS + (sT.id + 'subject' + sbjId).toJsId(),
                    class: { id: "SC-isEligibleAsSubject" },
                    subject: { id: sbjId },
                    object: { id: sT.id },
                    changedAt: spD.createdAt
                });
                spD.statements.push({
                    id: CONFIG.prefixS + (sT.id + 'object' + objId).toJsId(),
                    class: { id: "SC-isEligibleAsObject" },
                    subject: { id: objId },
                    object: { id: sT.id },
                    changedAt: spD.createdAt
                });
            }
        });
        return spD;
        function add2Hierarchy(termId, folderName) {
            if (spD.nodes.length == 1 && spD.nodes[0].nodes) {
                let fld = LIB.itemByKey(spD.nodes[0].nodes, LIB.makeKey(folderName));
                if (fld && fld.nodes)
                    LIB.cacheE(fld.nodes, {
                        id: LIB.replacePrefix(CONFIG.prefixN, termId),
                        resource: LIB.makeKey(termId),
                        changedAt: spD.createdAt
                    });
                else
                    throw Error("Assumption not met: Did'nt find the folder with id='" + folderName + "'.");
            }
            else
                throw Error("Assumption not met: Hierarchy should have a single element with a folder for ontologies.");
        }
    }
    function getDesc(el) {
        let docL = el.children && el.children.length > 0 ? Array.from(el.children[0].children) : [];
        return docL.map((doc) => {
            return {
                text: doc.innerHTML,
                language: doc.getAttribute("xml:lang")
            };
        });
    }
});
